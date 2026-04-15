import axios from "axios";
import fs from "node:fs";
import { createHmac, randomUUID } from "node:crypto";
import {
  listIntegrations,
  type IntegrationConfig,
} from "../config/integrations.js";
import { getIntegrationsDlqPath, writePrivateFile } from "../config/paths.js";

export interface IntegrationDispatchResult {
  integrationId: string;
  delivered: boolean;
  statusCode?: number;
  attemptCount: number;
  latencyMs?: number;
  deadLettered: boolean;
  error?: string;
}

export interface IntegrationDeadLetter {
  id: string;
  createdAt: string;
  lastAttemptAt: string;
  attempts: number;
  event: string;
  payload: Record<string, unknown>;
  integrationId: string;
  error: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readDlq(): IntegrationDeadLetter[] {
  try {
    const raw = fs.readFileSync(getIntegrationsDlqPath(), "utf-8");
    const parsed = JSON.parse(raw) as IntegrationDeadLetter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDlq(items: IntegrationDeadLetter[]): void {
  writePrivateFile(getIntegrationsDlqPath(), JSON.stringify(items, null, 2));
}

function addToDlq(input: {
  event: string;
  payload: Record<string, unknown>;
  integrationId: string;
  error: string;
  attempts: number;
}): IntegrationDeadLetter {
  const items = readDlq();
  const now = new Date().toISOString();
  const entry: IntegrationDeadLetter = {
    id: randomUUID(),
    createdAt: now,
    lastAttemptAt: now,
    attempts: Math.max(1, input.attempts),
    event: input.event,
    payload: input.payload,
    integrationId: input.integrationId,
    error: input.error,
  };

  items.push(entry);
  writeDlq(items.slice(-5_000));
  return entry;
}

function removeFromDlq(id: string): boolean {
  const items = readDlq();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) {
    return false;
  }
  writeDlq(next);
  return true;
}

function shouldRetry(statusCode: number | undefined, error?: string): boolean {
  if (!statusCode) {
    return true;
  }

  if (statusCode === 429) {
    return true;
  }

  if (statusCode >= 500) {
    return true;
  }

  return Boolean(
    error && /timeout|network|socket|econn|enotfound/i.test(error),
  );
}

function mapPagerDutySeverity(
  input: unknown,
): "info" | "warning" | "error" | "critical" {
  const value = typeof input === "string" ? input.toLowerCase() : "";
  if (value === "critical") return "critical";
  if (value === "error") return "error";
  if (value === "warning" || value === "warn") return "warning";
  return "info";
}

function buildPagerDutyBody(input: {
  event: string;
  payload: Record<string, unknown>;
  integrationId: string;
  routingKey: string;
}): Record<string, unknown> {
  const payload = input.payload;
  const incidentId =
    typeof payload.incidentId === "string"
      ? payload.incidentId
      : typeof payload.id === "string"
        ? payload.id
        : undefined;
  const dedupKey =
    incidentId || `${input.integrationId}:${input.event}`.slice(0, 255);
  const summary =
    typeof payload.title === "string"
      ? payload.title
      : typeof payload.message === "string"
        ? payload.message
        : `OpenOKAPI event: ${input.event}`;

  const resolved =
    input.event.includes("resolve") ||
    payload.status === "resolved" ||
    payload.resolved === true;

  return {
    routing_key: input.routingKey,
    event_action: resolved ? "resolve" : "trigger",
    dedup_key: dedupKey,
    payload: {
      summary,
      source: "openokapi",
      severity: mapPagerDutySeverity(payload.severity),
      timestamp: new Date().toISOString(),
      custom_details: {
        event: input.event,
        payload,
      },
    },
  };
}

async function dispatchToIntegration(input: {
  integration: IntegrationConfig;
  event: string;
  payload: Record<string, unknown>;
}): Promise<IntegrationDispatchResult> {
  const integration = input.integration;

  if (!integration.enabled) {
    return {
      integrationId: integration.id,
      delivered: false,
      attemptCount: 0,
      deadLettered: false,
      error: "Integration is disabled",
    };
  }

  if (!integration.endpoint && integration.type !== "pagerduty") {
    return {
      integrationId: integration.id,
      delivered: false,
      attemptCount: 0,
      deadLettered: false,
      error: "Missing endpoint",
    };
  }

  const envelope = {
    event: input.event,
    integration: integration.type,
    integrationId: integration.id,
    payload: input.payload,
    sentAt: new Date().toISOString(),
  };

  let endpoint = integration.endpoint;
  let requestBody: Record<string, unknown> = envelope;

  if (integration.type === "pagerduty") {
    const routingKey = integration.token?.trim();
    if (!routingKey) {
      return {
        integrationId: integration.id,
        delivered: false,
        attemptCount: 0,
        deadLettered: false,
        error: "PagerDuty integration requires token as routing key",
      };
    }

    endpoint = endpoint || "https://events.pagerduty.com/v2/enqueue";
    requestBody = buildPagerDutyBody({
      event: input.event,
      payload: input.payload,
      integrationId: integration.id,
      routingKey,
    });
  }

  const bodyRaw = JSON.stringify(requestBody);
  const payloadBytes = Buffer.byteLength(bodyRaw, "utf8");
  if (payloadBytes > integration.maxPayloadBytes) {
    const error = `Payload too large (${payloadBytes} > ${integration.maxPayloadBytes} bytes)`;
    let deadLettered = false;
    if (integration.deadLetterEnabled) {
      addToDlq({
        event: input.event,
        payload: input.payload,
        integrationId: integration.id,
        error,
        attempts: 1,
      });
      deadLettered = true;
    }

    return {
      integrationId: integration.id,
      delivered: false,
      attemptCount: 1,
      deadLettered,
      error,
    };
  }

  const attemptsMax = Math.max(1, integration.retries + 1);
  const startedAt = Date.now();
  let lastStatusCode: number | undefined;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= attemptsMax; attempt += 1) {
    if (!endpoint) {
      throw new Error("Integration endpoint is required");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = integration.secret
      ? createHmac("sha256", integration.secret)
          .update(`${timestamp}.${bodyRaw}`)
          .digest("hex")
      : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "openokapi-integrations/1.0",
      "X-OpenOKAPI-Event": input.event,
      "X-OpenOKAPI-Delivery-Id": randomUUID(),
      "X-OpenOKAPI-Timestamp": timestamp,
      ...integration.headers,
    };

    if (integration.token) {
      headers.Authorization = `Bearer ${integration.token}`;
    }
    if (signature) {
      headers["X-OpenOKAPI-Signature"] = `sha256=${signature}`;
    }

    try {
      const response = await axios.post(endpoint, requestBody, {
        timeout: integration.timeoutMs,
        headers,
        validateStatus: () => true,
      });

      lastStatusCode = response.status;

      if (response.status >= 200 && response.status < 300) {
        return {
          integrationId: integration.id,
          delivered: true,
          statusCode: response.status,
          attemptCount: attempt,
          latencyMs: Date.now() - startedAt,
          deadLettered: false,
        };
      }

      lastError = `HTTP ${response.status}`;
      if (attempt < attemptsMax && shouldRetry(response.status, lastError)) {
        const backoff = integration.retryBackoffMs * 2 ** (attempt - 1);
        await sleep(backoff);
        continue;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attemptsMax && shouldRetry(undefined, lastError)) {
        const backoff = integration.retryBackoffMs * 2 ** (attempt - 1);
        await sleep(backoff);
        continue;
      }
    }

    break;
  }

  let deadLettered = false;
  if (integration.deadLetterEnabled) {
    addToDlq({
      event: input.event,
      payload: input.payload,
      integrationId: integration.id,
      error: lastError || "Delivery failed",
      attempts: attemptsMax,
    });
    deadLettered = true;
  }

  const failedResult: IntegrationDispatchResult = {
    integrationId: integration.id,
    delivered: false,
    attemptCount: attemptsMax,
    latencyMs: Date.now() - startedAt,
    deadLettered,
    error: lastError || "Delivery failed",
  };

  if (typeof lastStatusCode === "number") {
    failedResult.statusCode = lastStatusCode;
  }

  return failedResult;
}

export async function dispatchIntegrationEvent(input: {
  event: string;
  payload: Record<string, unknown>;
}): Promise<IntegrationDispatchResult[]> {
  const integrations = listIntegrations().filter(
    (item) => item.enabled && item.events.includes(input.event),
  );

  return Promise.all(
    integrations.map((integration) =>
      dispatchToIntegration({
        integration,
        event: input.event,
        payload: input.payload,
      }),
    ),
  );
}

export function listIntegrationDeadLetters(
  limit = 100,
): IntegrationDeadLetter[] {
  const entries = readDlq();
  return entries.slice(Math.max(0, entries.length - limit)).reverse();
}

export async function retryIntegrationDeadLetter(id: string): Promise<{
  found: boolean;
  result?: IntegrationDispatchResult;
}> {
  const items = readDlq();
  const item = items.find((entry) => entry.id === id);
  if (!item) {
    return { found: false };
  }

  const integration = listIntegrations().find(
    (entry) => entry.id === item.integrationId,
  );
  if (!integration) {
    return {
      found: true,
      result: {
        integrationId: item.integrationId,
        delivered: false,
        attemptCount: item.attempts,
        deadLettered: true,
        error: "Integration not found for DLQ entry",
      },
    };
  }

  const result = await dispatchToIntegration({
    integration,
    event: item.event,
    payload: item.payload,
  });

  if (result.delivered) {
    removeFromDlq(id);
  } else {
    const next = readDlq().map((entry) =>
      entry.id === id
        ? {
            ...entry,
            attempts: entry.attempts + 1,
            lastAttemptAt: new Date().toISOString(),
            error: result.error || entry.error,
          }
        : entry,
    );
    writeDlq(next);
  }

  return {
    found: true,
    result,
  };
}

export function deleteIntegrationDeadLetter(id: string): boolean {
  return removeFromDlq(id);
}

export function clearIntegrationDeadLetters(): void {
  writeDlq([]);
}
