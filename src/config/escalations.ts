import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getEscalationsPath, writePrivateFile } from "./paths.js";

export type EscalationTrigger =
  | "alerts.active"
  | "alerts.error"
  | "incident.created";
export type EscalationSeverity = "warn" | "error";

export interface EscalationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: EscalationTrigger;
  minSeverity: EscalationSeverity;
  minCount: number;
  integrationEvent: string;
  autoCreateIncident: boolean;
  cooldownMinutes: number;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  lastStatus?: "triggered" | "skipped" | "failed";
  lastError?: string;
  lastIncidentId?: string;
}

function loadAll(): EscalationRule[] {
  try {
    const raw = fs.readFileSync(getEscalationsPath(), "utf-8");
    const parsed = JSON.parse(raw) as EscalationRule[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is EscalationRule =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.trigger === "string",
    );
  } catch {
    return [];
  }
}

function saveAll(items: EscalationRule[]): void {
  writePrivateFile(getEscalationsPath(), JSON.stringify(items, null, 2));
}

export function listEscalationRules(): EscalationRule[] {
  return loadAll().sort((a, b) => a.name.localeCompare(b.name));
}

export function upsertEscalationRule(input: {
  id?: string;
  name: string;
  enabled?: boolean;
  trigger: EscalationTrigger;
  minSeverity?: EscalationSeverity;
  minCount?: number;
  integrationEvent?: string;
  autoCreateIncident?: boolean;
  cooldownMinutes?: number;
}): EscalationRule {
  const current = loadAll();
  const existing =
    input.id && input.id.trim()
      ? current.find((item) => item.id === input.id!.trim())
      : undefined;
  const now = new Date().toISOString();

  const normalizedName = input.name.trim();
  if (!normalizedName) {
    throw new Error("Escalation name is required");
  }

  const next: EscalationRule = {
    id: existing?.id || input.id?.trim() || randomUUID(),
    name: normalizedName,
    enabled: input.enabled !== false,
    trigger: input.trigger,
    minSeverity: input.minSeverity || existing?.minSeverity || "warn",
    minCount: Math.max(
      1,
      Math.floor(input.minCount || existing?.minCount || 1),
    ),
    integrationEvent:
      input.integrationEvent?.trim() ||
      existing?.integrationEvent ||
      "escalation.triggered",
    autoCreateIncident:
      input.autoCreateIncident ?? existing?.autoCreateIncident ?? true,
    cooldownMinutes: Math.max(
      0,
      Math.floor(input.cooldownMinutes ?? existing?.cooldownMinutes ?? 10),
    ),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (!next.integrationEvent) {
    throw new Error("Escalation integration event is required");
  }

  if (existing?.lastTriggeredAt)
    next.lastTriggeredAt = existing.lastTriggeredAt;
  if (existing?.lastStatus) next.lastStatus = existing.lastStatus;
  if (existing?.lastError) next.lastError = existing.lastError;
  if (existing?.lastIncidentId) next.lastIncidentId = existing.lastIncidentId;

  const filtered = current.filter((item) => item.id !== next.id);
  filtered.push(next);
  saveAll(filtered);

  return next;
}

export function deleteEscalationRule(id: string): boolean {
  const current = loadAll();
  const next = current.filter((item) => item.id !== id.trim());
  if (next.length === current.length) {
    return false;
  }

  saveAll(next);
  return true;
}

export function markEscalationRun(input: {
  id: string;
  status: "triggered" | "skipped" | "failed";
  error?: string;
  incidentId?: string;
}): void {
  const current = loadAll();
  const index = current.findIndex((item) => item.id === input.id);
  if (index === -1) return;

  const rule = current[index];
  if (!rule) return;

  const now = new Date().toISOString();
  rule.lastStatus = input.status;
  rule.updatedAt = now;
  if (input.status === "triggered") {
    rule.lastTriggeredAt = now;
  }

  if (input.error) {
    rule.lastError = input.error;
  } else {
    delete rule.lastError;
  }

  if (input.incidentId) {
    rule.lastIncidentId = input.incidentId;
  }

  current[index] = rule;
  saveAll(current);
}
