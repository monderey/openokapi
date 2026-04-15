import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getHooksPath, writePrivateFile } from "./paths.js";
import type { CapabilityKey } from "./capabilities.js";
import type { RoutingStrategy } from "./router-policy.js";

export interface HookCondition {
  path: string;
  equals?: unknown;
  contains?: string;
  exists?: boolean;
}

export type HookAction =
  | {
      type: "log";
      message: string;
    }
  | {
      type: "dispatchIntegration";
      event: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: "runAutomation";
      event?: string;
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
    };

export interface HookEntry {
  id: string;
  name: string;
  enabled: boolean;
  event: string;
  conditions: HookCondition[];
  actions: HookAction[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastStatus?: "matched" | "skipped" | "failed";
  lastError?: string;
}

function loadAll(): HookEntry[] {
  try {
    const raw = fs.readFileSync(getHooksPath(), "utf-8");
    const parsed = JSON.parse(raw) as HookEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is HookEntry =>
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

function saveAll(items: HookEntry[]): void {
  writePrivateFile(getHooksPath(), JSON.stringify(items, null, 2));
}

export function listHooks(): HookEntry[] {
  return loadAll().sort((a, b) => a.name.localeCompare(b.name));
}

export function getHook(id: string): HookEntry | undefined {
  return loadAll().find((item) => item.id === id);
}

export function upsertHook(input: {
  id?: string;
  name: string;
  enabled?: boolean;
  event: string;
  conditions?: HookCondition[];
  actions: HookAction[];
}): HookEntry {
  const now = new Date().toISOString();
  const current = loadAll();
  const existing =
    input.id && input.id.trim()
      ? current.find((item) => item.id === input.id!.trim())
      : undefined;

  const id = existing?.id || input.id?.trim() || randomUUID();
  const next: HookEntry = {
    id,
    name: input.name.trim() || `hook-${id.slice(0, 8)}`,
    enabled: input.enabled !== false,
    event: input.event.trim(),
    conditions: input.conditions || [],
    actions: input.actions,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (!next.event) {
    throw new Error("Hook event is required");
  }

  if (next.actions.length === 0) {
    throw new Error("Hook requires at least one action");
  }

  if (existing?.lastRunAt) {
    next.lastRunAt = existing.lastRunAt;
  }
  if (existing?.lastStatus) {
    next.lastStatus = existing.lastStatus;
  }
  if (existing?.lastError) {
    next.lastError = existing.lastError;
  }

  const filtered = current.filter((item) => item.id !== next.id);
  filtered.push(next);
  saveAll(filtered);
  return next;
}

export function deleteHook(id: string): boolean {
  const current = loadAll();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) {
    return false;
  }

  saveAll(next);
  return true;
}

export function markHookRun(input: {
  id: string;
  status: "matched" | "skipped" | "failed";
  error?: string;
}): void {
  const current = loadAll();
  const index = current.findIndex((item) => item.id === input.id);
  if (index === -1) {
    return;
  }

  const hook = current[index];
  if (!hook) {
    return;
  }

  hook.lastRunAt = new Date().toISOString();
  hook.lastStatus = input.status;
  hook.updatedAt = new Date().toISOString();
  if (input.error) {
    hook.lastError = input.error;
  } else {
    delete hook.lastError;
  }

  current[index] = hook;
  saveAll(current);
}
