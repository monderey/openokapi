import fs from "node:fs";
import net from "node:net";
import { getIntegrationsPath, writePrivateFile } from "./paths.js";

export type IntegrationType =
  | "webhook"
  | "slack"
  | "telegram"
  | "discord"
  | "github"
  | "gitlab"
  | "jira"
  | "linear"
  | "notion"
  | "teams"
  | "pagerduty";

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  enabled: boolean;
  endpoint?: string;
  token?: string;
  secret?: string;
  headers?: Record<string, string>;
  channel?: string;
  events: string[];
  timeoutMs: number;
  retries: number;
  retryBackoffMs: number;
  maxPayloadBytes: number;
  deadLetterEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function sanitizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [
    ...new Set(
      input
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function sanitizeHeaders(input: unknown): Record<string, string> | undefined {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const entries = Object.entries(input as Record<string, unknown>)
    .filter(
      ([key, value]) =>
        typeof key === "string" && key.trim() && typeof value === "string",
    )
    .map(([key, value]) => [key.trim(), (value as string).trim()] as const)
    .filter(([key, value]) => Boolean(key) && Boolean(value));

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function isPrivateHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "host.docker.internal" ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }

  const ipVersion = net.isIP(normalized);
  if (ipVersion === 4) {
    if (normalized.startsWith("10.")) return true;
    if (normalized.startsWith("127.")) return true;
    if (normalized.startsWith("169.254.")) return true;
    if (normalized.startsWith("192.168.")) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(normalized)) return true;
    return false;
  }

  if (ipVersion === 6) {
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe80:")) return true;
    return false;
  }

  return false;
}

function sanitizeEndpoint(input: unknown): string | undefined {
  if (typeof input !== "string") {
    return undefined;
  }

  const candidate = input.trim();
  if (!candidate) {
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Invalid integration endpoint URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Integration endpoint must use http or https");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Integration endpoint must not include URL credentials");
  }

  const allowPrivateEndpoints =
    process.env.OPENOKAPI_ALLOW_PRIVATE_WEBHOOKS === "true";
  if (!allowPrivateEndpoints && isPrivateHost(parsed.hostname)) {
    throw new Error(
      "Private/local integration endpoints are blocked. Set OPENOKAPI_ALLOW_PRIVATE_WEBHOOKS=true to override.",
    );
  }

  return parsed.toString();
}

function loadAll(): IntegrationConfig[] {
  try {
    const raw = fs.readFileSync(getIntegrationsPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<IntegrationConfig>[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is Partial<IntegrationConfig> =>
          Boolean(item) &&
          typeof item.id === "string" &&
          typeof item.type === "string",
      )
      .map((item) => {
        const normalized: IntegrationConfig = {
          id: item.id!.trim(),
          type: item.type as IntegrationType,
          enabled: item.enabled !== false,
          events: sanitizeStringArray(item.events),
          timeoutMs:
            typeof item.timeoutMs === "number" &&
            Number.isFinite(item.timeoutMs)
              ? Math.max(1_000, Math.floor(item.timeoutMs))
              : 10_000,
          retries:
            typeof item.retries === "number" && Number.isFinite(item.retries)
              ? Math.max(0, Math.min(10, Math.floor(item.retries)))
              : 2,
          retryBackoffMs:
            typeof item.retryBackoffMs === "number" &&
            Number.isFinite(item.retryBackoffMs)
              ? Math.max(100, Math.floor(item.retryBackoffMs))
              : 500,
          maxPayloadBytes:
            typeof item.maxPayloadBytes === "number" &&
            Number.isFinite(item.maxPayloadBytes)
              ? Math.max(1_024, Math.floor(item.maxPayloadBytes))
              : 262_144,
          deadLetterEnabled: item.deadLetterEnabled !== false,
          createdAt:
            typeof item.createdAt === "string"
              ? item.createdAt
              : new Date().toISOString(),
          updatedAt:
            typeof item.updatedAt === "string"
              ? item.updatedAt
              : new Date().toISOString(),
        };

        if (typeof item.endpoint === "string" && item.endpoint.trim()) {
          normalized.endpoint = item.endpoint.trim();
        }
        if (typeof item.token === "string" && item.token.trim()) {
          normalized.token = item.token.trim();
        }
        if (typeof item.secret === "string" && item.secret.trim()) {
          normalized.secret = item.secret.trim();
        }
        if (typeof item.channel === "string" && item.channel.trim()) {
          normalized.channel = item.channel.trim();
        }
        const headers = sanitizeHeaders(item.headers);
        if (headers) {
          normalized.headers = headers;
        }
        if (!normalized.events.length) {
          normalized.events = ["request.success", "request.error"];
        }

        return normalized;
      })
      .filter((item) => Boolean(item.id));
  } catch {
    return [];
  }
}

function saveAll(items: IntegrationConfig[]): void {
  writePrivateFile(getIntegrationsPath(), JSON.stringify(items, null, 2));
}

export function listIntegrations(): IntegrationConfig[] {
  return loadAll().sort((a, b) => a.id.localeCompare(b.id));
}

export function upsertIntegration(input: {
  id: string;
  type: IntegrationType;
  enabled?: boolean;
  endpoint?: string;
  token?: string;
  secret?: string;
  headers?: Record<string, string>;
  channel?: string;
  events?: string[];
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
  maxPayloadBytes?: number;
  deadLetterEnabled?: boolean;
}): IntegrationConfig {
  const normalizedId = input.id.trim();
  if (!normalizedId) {
    throw new Error("Integration id is required");
  }

  const now = new Date().toISOString();
  const current = loadAll();
  const existing = current.find((item) => item.id === normalizedId);

  const next: IntegrationConfig = {
    id: normalizedId,
    type: input.type,
    enabled: input.enabled !== false,
    events: Array.isArray(input.events)
      ? sanitizeStringArray(input.events)
      : existing?.events || ["request.success", "request.error"],
    timeoutMs:
      typeof input.timeoutMs === "number" && Number.isFinite(input.timeoutMs)
        ? Math.max(1_000, Math.floor(input.timeoutMs))
        : existing?.timeoutMs || 10_000,
    retries:
      typeof input.retries === "number" && Number.isFinite(input.retries)
        ? Math.max(0, Math.min(10, Math.floor(input.retries)))
        : existing?.retries || 2,
    retryBackoffMs:
      typeof input.retryBackoffMs === "number" &&
      Number.isFinite(input.retryBackoffMs)
        ? Math.max(100, Math.floor(input.retryBackoffMs))
        : existing?.retryBackoffMs || 500,
    maxPayloadBytes:
      typeof input.maxPayloadBytes === "number" &&
      Number.isFinite(input.maxPayloadBytes)
        ? Math.max(1_024, Math.floor(input.maxPayloadBytes))
        : existing?.maxPayloadBytes || 262_144,
    deadLetterEnabled:
      typeof input.deadLetterEnabled === "boolean"
        ? input.deadLetterEnabled
        : existing?.deadLetterEnabled !== false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  const endpoint = sanitizeEndpoint(input.endpoint);
  if (endpoint) next.endpoint = endpoint;
  else if (existing?.endpoint) next.endpoint = existing.endpoint;

  if (input.token?.trim()) next.token = input.token.trim();
  else if (existing?.token) next.token = existing.token;

  if (input.secret?.trim()) next.secret = input.secret.trim();
  else if (existing?.secret) next.secret = existing.secret;

  const headers = sanitizeHeaders(input.headers);
  if (headers) next.headers = headers;
  else if (existing?.headers) next.headers = existing.headers;

  if (input.channel?.trim()) next.channel = input.channel.trim();
  else if (existing?.channel) next.channel = existing.channel;

  if (!next.events.length) {
    next.events = ["request.success", "request.error"];
  }

  const filtered = current.filter((item) => item.id !== next.id);
  filtered.push(next);
  saveAll(filtered);
  return next;
}

export function deleteIntegration(id: string): boolean {
  const current = loadAll();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) {
    return false;
  }

  saveAll(next);
  return true;
}
