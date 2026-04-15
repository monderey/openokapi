import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getTaskFlowsPath, writePrivateFile } from "./paths.js";

export type TaskFlowMode = "managed" | "mirrored";
export type TaskFlowStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "canceled";
export type TaskFlowStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface TaskFlowStep {
  id: string;
  name: string;
  instruction: string;
  status: TaskFlowStepStatus;
  result?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TaskFlow {
  id: string;
  name: string;
  enabled: boolean;
  mode: TaskFlowMode;
  provider: "openai" | "claude" | "ollama";
  model?: string;
  status: TaskFlowStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  steps: TaskFlowStep[];
}

export interface ListTaskFlowsOptions {
  status?: TaskFlowStatus;
  enabled?: boolean;
  limit?: number;
}

export type TaskFlowAuditSeverity = "warn" | "error";
export type TaskFlowAuditFindingCode =
  | "stale_running"
  | "empty_steps"
  | "inconsistent_timestamps";

export interface TaskFlowAuditFinding {
  code: TaskFlowAuditFindingCode;
  severity: TaskFlowAuditSeverity;
  flowId: string;
  message: string;
}

export interface TaskFlowMaintenanceResult {
  total: number;
  terminal: number;
  prunable: number;
  removed: number;
  retentionDays: number;
  apply: boolean;
}

const STALE_RUNNING_MS = 30 * 60 * 1000;

function loadAll(): TaskFlow[] {
  try {
    const raw = fs.readFileSync(getTaskFlowsPath(), "utf-8");
    const parsed = JSON.parse(raw) as TaskFlow[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is TaskFlow =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        Array.isArray(item.steps),
    );
  } catch {
    return [];
  }
}

function saveAll(items: TaskFlow[]): void {
  writePrivateFile(getTaskFlowsPath(), JSON.stringify(items, null, 2));
}

export function listTaskFlows(options?: ListTaskFlowsOptions): TaskFlow[] {
  const limitRaw = Number(options?.limit);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.floor(limitRaw))
    : undefined;

  const filtered = loadAll()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((flow) => {
      if (options?.status && flow.status !== options.status) {
        return false;
      }
      if (
        typeof options?.enabled === "boolean" &&
        flow.enabled !== options.enabled
      ) {
        return false;
      }
      return true;
    });

  return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
}

export function getTaskFlow(id: string): TaskFlow | undefined {
  return loadAll().find((item) => item.id === id);
}

export function resolveTaskFlow(lookup: string): TaskFlow | undefined {
  const token = lookup.trim();
  if (!token) {
    return undefined;
  }

  const flows = listTaskFlows();
  const byId = flows.find((item) => item.id === token);
  if (byId) {
    return byId;
  }

  const byExactName = flows.find((item) => item.name.trim() === token);
  if (byExactName) {
    return byExactName;
  }

  return flows.find((item) =>
    item.name.toLowerCase().includes(token.toLowerCase()),
  );
}

function normalizeSteps(
  input: Array<{ name: string; instruction: string }>,
): TaskFlowStep[] {
  return input
    .map((step) => ({
      id: randomUUID(),
      name: step.name.trim(),
      instruction: step.instruction.trim(),
      status: "pending" as TaskFlowStepStatus,
    }))
    .filter((step) => step.name && step.instruction);
}

export function upsertTaskFlow(input: {
  id?: string;
  name: string;
  enabled?: boolean;
  mode?: TaskFlowMode;
  provider?: "openai" | "claude" | "ollama";
  model?: string;
  steps: Array<{ name: string; instruction: string }>;
}): TaskFlow {
  const now = new Date().toISOString();
  const current = loadAll();
  const existing =
    input.id && input.id.trim()
      ? current.find((item) => item.id === input.id!.trim())
      : undefined;

  const steps = normalizeSteps(input.steps);
  if (!steps.length) {
    throw new Error("Task flow requires at least one step");
  }

  const id = existing?.id || input.id?.trim() || randomUUID();
  const next: TaskFlow = {
    id,
    name: input.name.trim() || `task-flow-${id.slice(0, 8)}`,
    enabled: input.enabled !== false,
    mode: input.mode || existing?.mode || "managed",
    provider: input.provider || existing?.provider || "openai",
    status: existing?.status || "idle",
    revision: (existing?.revision || 0) + 1,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    steps,
  };

  if (input.model?.trim()) {
    next.model = input.model.trim();
  } else if (existing?.model) {
    next.model = existing.model;
  }
  if (existing?.lastRunAt) {
    next.lastRunAt = existing.lastRunAt;
  }

  const filtered = current.filter((item) => item.id !== id);
  filtered.push(next);
  saveAll(filtered);
  return next;
}

export function saveTaskFlow(flow: TaskFlow): TaskFlow {
  const current = loadAll().filter((item) => item.id !== flow.id);
  const next = {
    ...flow,
    updatedAt: new Date().toISOString(),
  };
  current.push(next);
  saveAll(current);
  return next;
}

export function deleteTaskFlow(id: string): boolean {
  const current = loadAll();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) {
    return false;
  }

  saveAll(next);
  return true;
}

function isTerminalStatus(status: TaskFlowStatus): boolean {
  return status === "completed" || status === "failed" || status === "canceled";
}

export function auditTaskFlows(nowMs = Date.now()): TaskFlowAuditFinding[] {
  const findings: TaskFlowAuditFinding[] = [];

  for (const flow of loadAll()) {
    const createdMs = Date.parse(flow.createdAt);
    const updatedMs = Date.parse(flow.updatedAt);
    const lastRunMs = flow.lastRunAt ? Date.parse(flow.lastRunAt) : Number.NaN;

    if (flow.status === "running") {
      const ageBase = Number.isFinite(lastRunMs)
        ? lastRunMs
        : Number.isFinite(updatedMs)
          ? updatedMs
          : createdMs;
      const runningMs = Number.isFinite(ageBase)
        ? Math.max(0, nowMs - ageBase)
        : 0;
      if (runningMs > STALE_RUNNING_MS) {
        findings.push({
          code: "stale_running",
          severity: "error",
          flowId: flow.id,
          message: `Flow running for ${(runningMs / 60000).toFixed(1)}m`,
        });
      }
    }

    if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
      findings.push({
        code: "empty_steps",
        severity: "warn",
        flowId: flow.id,
        message: "Flow has no steps",
      });
    }

    const invalidTime =
      !Number.isFinite(createdMs) ||
      !Number.isFinite(updatedMs) ||
      (Number.isFinite(updatedMs) &&
        Number.isFinite(createdMs) &&
        updatedMs < createdMs) ||
      (Number.isFinite(lastRunMs) &&
        Number.isFinite(createdMs) &&
        lastRunMs < createdMs);

    if (invalidTime) {
      findings.push({
        code: "inconsistent_timestamps",
        severity: "warn",
        flowId: flow.id,
        message: "Flow contains inconsistent timestamps",
      });
    }
  }

  return findings;
}

export function maintainTaskFlows(options?: {
  apply?: boolean;
  retentionDays?: number;
  nowMs?: number;
}): TaskFlowMaintenanceResult {
  const apply = options?.apply === true;
  const retentionDaysRaw = Number(options?.retentionDays);
  const retentionDays = Number.isFinite(retentionDaysRaw)
    ? Math.max(1, Math.floor(retentionDaysRaw))
    : 7;
  const nowMs = Number.isFinite(options?.nowMs)
    ? Number(options?.nowMs)
    : Date.now();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

  const all = loadAll();
  const terminal = all.filter((flow) => isTerminalStatus(flow.status));
  const prunableIds = new Set(
    terminal
      .filter((flow) => {
        const ts = Date.parse(flow.updatedAt || flow.createdAt);
        if (!Number.isFinite(ts)) {
          return false;
        }
        return nowMs - ts > retentionMs;
      })
      .map((flow) => flow.id),
  );

  let removed = 0;
  if (apply && prunableIds.size > 0) {
    const filtered = all.filter((flow) => {
      const keep = !prunableIds.has(flow.id);
      if (!keep) {
        removed += 1;
      }
      return keep;
    });
    saveAll(filtered);
  }

  return {
    total: all.length,
    terminal: terminal.length,
    prunable: prunableIds.size,
    removed,
    retentionDays,
    apply,
  };
}
