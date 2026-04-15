import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getAutomationsPath, writePrivateFile } from "./paths.js";
import type { CapabilityKey } from "./capabilities.js";
import type { RoutingStrategy } from "./router-policy.js";

export interface AutomationCondition {
  path: string;
  equals?: string | number | boolean;
  contains?: string;
  exists?: boolean;
}

export type AutomationAction =
  | {
      type: "dispatchIntegration";
      event: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: "setCapability";
      key: CapabilityKey;
      enabled: boolean;
    }
  | {
      type: "setRouterStrategy";
      strategy: RoutingStrategy;
    }
  | {
      type: "log";
      message: string;
    };

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  event: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastStatus?: "matched" | "skipped" | "failed";
  lastError?: string;
}

function loadAll(): AutomationRule[] {
  try {
    const raw = fs.readFileSync(getAutomationsPath(), "utf-8");
    const parsed = JSON.parse(raw) as AutomationRule[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AutomationRule =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.event === "string" &&
        Array.isArray(item.conditions) &&
        Array.isArray(item.actions),
    );
  } catch {
    return [];
  }
}

function saveAll(items: AutomationRule[]): void {
  writePrivateFile(getAutomationsPath(), JSON.stringify(items, null, 2));
}

export function listAutomationRules(): AutomationRule[] {
  return loadAll().sort((a, b) => a.name.localeCompare(b.name));
}

export function upsertAutomationRule(input: {
  id?: string;
  name: string;
  enabled?: boolean;
  event: string;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
}): AutomationRule {
  const now = new Date().toISOString();
  const current = loadAll();
  const existing =
    input.id && input.id.trim()
      ? current.find((item) => item.id === input.id!.trim())
      : undefined;

  const id = existing?.id || input.id?.trim() || randomUUID();
  const normalizedConditions = Array.isArray(input.conditions)
    ? input.conditions
        .filter(
          (condition): condition is AutomationCondition =>
            Boolean(condition) && typeof condition.path === "string",
        )
        .map((condition) => {
          const normalized: AutomationCondition = {
            path: condition.path.trim(),
          };

          if (condition.equals !== undefined) {
            normalized.equals = condition.equals;
          }
          if (typeof condition.contains === "string") {
            normalized.contains = condition.contains;
          }
          if (typeof condition.exists === "boolean") {
            normalized.exists = condition.exists;
          }

          return normalized;
        })
    : existing?.conditions || [];

  const next: AutomationRule = {
    id,
    name: input.name.trim() || `automation-${id.slice(0, 8)}`,
    enabled: input.enabled !== false,
    event: input.event.trim(),
    conditions: normalizedConditions,
    actions: input.actions,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (existing?.lastRunAt) {
    next.lastRunAt = existing.lastRunAt;
  }
  if (existing?.lastStatus) {
    next.lastStatus = existing.lastStatus;
  }
  if (existing?.lastError) {
    next.lastError = existing.lastError;
  }

  if (!next.event) {
    throw new Error("Automation event is required");
  }

  if (!next.actions.length) {
    throw new Error("Automation requires at least one action");
  }

  const filtered = current.filter((item) => item.id !== next.id);
  filtered.push(next);
  saveAll(filtered);
  return next;
}

export function deleteAutomationRule(id: string): boolean {
  const current = loadAll();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) {
    return false;
  }

  saveAll(next);
  return true;
}

export function markAutomationRuleRun(input: {
  id: string;
  status: "matched" | "skipped" | "failed";
  error?: string;
}): void {
  const current = loadAll();
  const index = current.findIndex((item) => item.id === input.id);
  if (index === -1) {
    return;
  }

  const rule = current[index];
  if (!rule) {
    return;
  }

  rule.lastRunAt = new Date().toISOString();
  rule.lastStatus = input.status;
  if (input.error) {
    rule.lastError = input.error;
  } else {
    delete rule.lastError;
  }
  rule.updatedAt = new Date().toISOString();
  current[index] = rule;
  saveAll(current);
}
