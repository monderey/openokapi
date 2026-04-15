import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getTasksLedgerPath, writePrivateFile } from "./paths.js";

export type TaskKind = "scheduler" | "task-flow" | "heartbeat" | "manual";
export type TaskStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "canceled";
export type TaskNotifyPolicy = "done_only" | "state_changes" | "silent";

export interface TaskLogEntry {
  timestamp: string;
  message: string;
}

export interface TaskRecord {
  id: string;
  kind: TaskKind;
  name: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  notifyPolicy: TaskNotifyPolicy;
  metadata?: Record<string, unknown>;
  logs: TaskLogEntry[];
}

export type TaskAuditSeverity = "warn" | "error";
export type TaskAuditFindingCode =
  | "stale_queued"
  | "stale_running"
  | "missing_cleanup"
  | "inconsistent_timestamps";

export interface TaskAuditFinding {
  code: TaskAuditFindingCode;
  severity: TaskAuditSeverity;
  taskId: string;
  message: string;
}

export interface TaskMaintenanceResult {
  total: number;
  terminal: number;
  prunable: number;
  removed: number;
  retentionDays: number;
  apply: boolean;
}

const MAX_TASKS = 5000;
const MAX_LOGS_PER_TASK = 200;
const STALE_QUEUED_MS = 10 * 60 * 1000;
const STALE_RUNNING_MS = 30 * 60 * 1000;

function loadAll(): TaskRecord[] {
  try {
    const raw = fs.readFileSync(getTasksLedgerPath(), "utf-8");
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized: TaskRecord[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const entry = item as Partial<TaskRecord>;
      if (
        typeof entry.id !== "string" ||
        typeof entry.kind !== "string" ||
        typeof entry.name !== "string" ||
        typeof entry.status !== "string" ||
        !Array.isArray(entry.logs)
      ) {
        continue;
      }

      const notifyPolicyRaw = entry.notifyPolicy;
      const notifyPolicy: TaskNotifyPolicy =
        notifyPolicyRaw === "done_only" ||
        notifyPolicyRaw === "state_changes" ||
        notifyPolicyRaw === "silent"
          ? notifyPolicyRaw
          : "done_only";

      normalized.push({
        ...entry,
        id: entry.id,
        kind: entry.kind as TaskKind,
        name: entry.name,
        status: entry.status as TaskStatus,
        createdAt: String(entry.createdAt || ""),
        updatedAt: String(entry.updatedAt || entry.createdAt || ""),
        notifyPolicy,
        logs: entry.logs
          .filter(
            (log): log is TaskLogEntry =>
              Boolean(log) &&
              typeof log.timestamp === "string" &&
              typeof log.message === "string",
          )
          .slice(-MAX_LOGS_PER_TASK),
      });
    }

    return normalized;
  } catch {
    return [];
  }
}

function saveAll(items: TaskRecord[]): void {
  writePrivateFile(
    getTasksLedgerPath(),
    JSON.stringify(items.slice(-MAX_TASKS), null, 2),
  );
}

export function listTasks(): TaskRecord[] {
  return loadAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getTask(taskId: string): TaskRecord | undefined {
  return loadAll().find((item) => item.id === taskId);
}

export function createTask(input: {
  kind: TaskKind;
  name: string;
  notifyPolicy?: TaskNotifyPolicy;
  metadata?: Record<string, unknown>;
}): TaskRecord {
  const now = new Date().toISOString();
  const task: TaskRecord = {
    id: randomUUID(),
    kind: input.kind,
    name: input.name.trim() || `${input.kind}-task`,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    notifyPolicy: input.notifyPolicy || "done_only",
    logs: [],
  };

  if (input.metadata && typeof input.metadata === "object") {
    task.metadata = input.metadata;
  }

  const items = loadAll();
  items.push(task);
  saveAll(items);
  return task;
}

export function updateTask(
  taskId: string,
  partial: {
    status?: TaskStatus;
    error?: string;
    notifyPolicy?: TaskNotifyPolicy;
    metadata?: Record<string, unknown>;
  },
): TaskRecord | undefined {
  const items = loadAll();
  const index = items.findIndex((item) => item.id === taskId);
  if (index === -1) {
    return undefined;
  }

  const task = items[index];
  if (!task) {
    return undefined;
  }

  const now = new Date().toISOString();
  if (partial.status) {
    task.status = partial.status;
    if (partial.status === "running" && !task.startedAt) {
      task.startedAt = now;
    }
    if (
      partial.status === "completed" ||
      partial.status === "failed" ||
      partial.status === "canceled"
    ) {
      task.completedAt = now;
      if (task.startedAt) {
        task.durationMs = Math.max(
          0,
          Date.parse(now) - Date.parse(task.startedAt),
        );
      }
    }
  }

  if (partial.error) {
    task.error = partial.error;
  } else if (partial.status === "completed") {
    delete task.error;
  }

  if (partial.metadata && typeof partial.metadata === "object") {
    task.metadata = {
      ...(task.metadata || {}),
      ...partial.metadata,
    };
  }

  if (partial.notifyPolicy) {
    task.notifyPolicy = partial.notifyPolicy;
  }

  task.updatedAt = now;
  items[index] = task;
  saveAll(items);
  return task;
}

export function appendTaskLog(
  taskId: string,
  message: string,
): TaskRecord | undefined {
  const items = loadAll();
  const index = items.findIndex((item) => item.id === taskId);
  if (index === -1) {
    return undefined;
  }

  const task = items[index];
  if (!task) {
    return undefined;
  }

  task.logs.push({
    timestamp: new Date().toISOString(),
    message: message.trim(),
  });
  task.logs = task.logs.slice(-MAX_LOGS_PER_TASK);
  task.updatedAt = new Date().toISOString();

  items[index] = task;
  saveAll(items);
  return task;
}

export function setTaskNotifyPolicy(
  taskId: string,
  notifyPolicy: TaskNotifyPolicy,
): TaskRecord | undefined {
  return updateTask(taskId, { notifyPolicy });
}

function isTerminalStatus(status: TaskStatus): boolean {
  return status === "completed" || status === "failed" || status === "canceled";
}

export function auditTasks(nowMs = Date.now()): TaskAuditFinding[] {
  const findings: TaskAuditFinding[] = [];

  for (const task of loadAll()) {
    const createdMs = Date.parse(task.createdAt);
    const startedMs = task.startedAt ? Date.parse(task.startedAt) : Number.NaN;
    const completedMs = task.completedAt
      ? Date.parse(task.completedAt)
      : Number.NaN;
    const ageMs = Number.isFinite(createdMs)
      ? Math.max(0, nowMs - createdMs)
      : 0;

    if (task.status === "queued" && ageMs > STALE_QUEUED_MS) {
      findings.push({
        code: "stale_queued",
        severity: "warn",
        taskId: task.id,
        message: `Task queued for ${(ageMs / 60000).toFixed(1)}m`,
      });
    }

    if (task.status === "running" && ageMs > STALE_RUNNING_MS) {
      findings.push({
        code: "stale_running",
        severity: "error",
        taskId: task.id,
        message: `Task running for ${(ageMs / 60000).toFixed(1)}m`,
      });
    }

    if (isTerminalStatus(task.status) && !task.completedAt) {
      findings.push({
        code: "missing_cleanup",
        severity: "warn",
        taskId: task.id,
        message: "Terminal task has no completed timestamp",
      });
    }

    const hasInvalidTime =
      !Number.isFinite(createdMs) ||
      (task.startedAt !== undefined && !Number.isFinite(startedMs)) ||
      (task.completedAt !== undefined && !Number.isFinite(completedMs)) ||
      (Number.isFinite(startedMs) &&
        Number.isFinite(createdMs) &&
        startedMs < createdMs) ||
      (Number.isFinite(completedMs) &&
        Number.isFinite(createdMs) &&
        completedMs < createdMs) ||
      (Number.isFinite(completedMs) &&
        Number.isFinite(startedMs) &&
        completedMs < startedMs);

    if (hasInvalidTime) {
      findings.push({
        code: "inconsistent_timestamps",
        severity: "warn",
        taskId: task.id,
        message: "Task contains inconsistent timestamps",
      });
    }
  }

  return findings;
}

export function maintainTasks(options?: {
  apply?: boolean;
  retentionDays?: number;
  nowMs?: number;
}): TaskMaintenanceResult {
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
  const terminal = all.filter((task) => isTerminalStatus(task.status));
  const prunableIds = new Set(
    terminal
      .filter((task) => {
        const ts = Date.parse(
          task.completedAt || task.updatedAt || task.createdAt,
        );
        if (!Number.isFinite(ts)) {
          return false;
        }
        return nowMs - ts > retentionMs;
      })
      .map((task) => task.id),
  );

  let removed = 0;
  if (apply && prunableIds.size > 0) {
    const filtered = all.filter((task) => {
      const keep = !prunableIds.has(task.id);
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
