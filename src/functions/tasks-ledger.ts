import {
  appendTaskLog,
  auditTasks,
  createTask,
  getTask,
  listTasks,
  maintainTasks,
  type TaskAuditFinding,
  type TaskStatus,
  type TaskNotifyPolicy,
  type TaskMaintenanceResult,
  type TaskKind,
  type TaskRecord,
  setTaskNotifyPolicy,
} from "../config/tasks.js";
import { updateTask } from "../config/tasks.js";
import { emitPlatformEvent } from "./event-bus.js";

let maintenanceTimer: ReturnType<typeof setInterval> | null = null;
let maintenanceStarted = false;
let maintenanceIntervalMinutes = 15;
let maintenanceRetentionDays = 7;
let maintenanceLastRunAt: string | undefined;
let maintenanceLastRemoved = 0;

export function createBackgroundTask(input: {
  kind: TaskKind;
  name: string;
  notifyPolicy?: TaskNotifyPolicy;
  metadata?: Record<string, unknown>;
}): TaskRecord {
  return createTask(input);
}

function shouldNotify(
  task: TaskRecord,
  transition: "running" | "completed" | "failed" | "canceled",
): boolean {
  if (task.notifyPolicy === "silent") {
    return false;
  }

  if (task.notifyPolicy === "state_changes") {
    return true;
  }

  return transition === "completed";
}

function emitTaskNotification(
  task: TaskRecord,
  transition: "running" | "completed" | "failed" | "canceled",
): void {
  if (!shouldNotify(task, transition)) {
    return;
  }

  void emitPlatformEvent({
    event: "tasks.notification",
    payload: {
      taskId: task.id,
      taskName: task.name,
      kind: task.kind,
      status: task.status,
      transition,
      notifyPolicy: task.notifyPolicy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      error: task.error,
      metadata: task.metadata,
    },
  });
}

export function markTaskRunning(taskId: string): TaskRecord | undefined {
  const task = updateTask(taskId, { status: "running" });
  if (task) {
    emitTaskNotification(task, "running");
  }
  return task;
}

export function markTaskCompleted(
  taskId: string,
  metadata?: Record<string, unknown>,
): TaskRecord | undefined {
  const task = updateTask(taskId, {
    status: "completed",
    metadata,
  } as any);
  if (task) {
    emitTaskNotification(task, "completed");
  }
  return task;
}

export function markTaskFailed(
  taskId: string,
  error: string,
): TaskRecord | undefined {
  const task = updateTask(taskId, { status: "failed", error });
  if (task) {
    emitTaskNotification(task, "failed");
  }
  return task;
}

export function markTaskCanceled(taskId: string): TaskRecord | undefined {
  const task = updateTask(taskId, { status: "canceled" });
  if (task) {
    emitTaskNotification(task, "canceled");
  }
  return task;
}

export function addTaskLog(
  taskId: string,
  message: string,
): TaskRecord | undefined {
  return appendTaskLog(taskId, message);
}

export function getBackgroundTask(taskId: string): TaskRecord | undefined {
  const lookup = taskId.trim();
  if (!lookup) {
    return undefined;
  }

  const direct = getTask(lookup);
  if (direct) {
    return direct;
  }

  return resolveBackgroundTask(lookup);
}

export interface ListBackgroundTasksOptions {
  limit?: number;
  status?: TaskStatus;
  kind?: TaskKind;
  notifyPolicy?: TaskNotifyPolicy;
}

function matchesLookupToken(value: unknown, lookup: string): boolean {
  return typeof value === "string" && value.trim() === lookup;
}

export function resolveBackgroundTask(lookup: string): TaskRecord | undefined {
  const token = lookup.trim();
  if (!token) {
    return undefined;
  }

  const tasks = listTasks();
  return tasks.find((task) => {
    if (task.id === token) {
      return true;
    }

    const metadata = task.metadata;
    if (!metadata || typeof metadata !== "object") {
      return false;
    }

    return (
      matchesLookupToken(metadata.runId, token) ||
      matchesLookupToken(metadata.sessionKey, token) ||
      matchesLookupToken(metadata.childSessionKey, token) ||
      matchesLookupToken(metadata.flowId, token) ||
      matchesLookupToken(metadata.jobId, token)
    );
  });
}

export function listBackgroundTasks(
  options: number | ListBackgroundTasksOptions = 100,
): TaskRecord[] {
  const resolvedOptions: ListBackgroundTasksOptions =
    typeof options === "number" ? { limit: options } : options;

  const limitRaw = Number(resolvedOptions.limit);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.floor(limitRaw))
    : 100;

  return listTasks()
    .filter((task) => {
      if (resolvedOptions.status && task.status !== resolvedOptions.status) {
        return false;
      }
      if (resolvedOptions.kind && task.kind !== resolvedOptions.kind) {
        return false;
      }
      if (
        resolvedOptions.notifyPolicy &&
        task.notifyPolicy !== resolvedOptions.notifyPolicy
      ) {
        return false;
      }
      return true;
    })
    .slice(0, limit);
}

export function getTaskLedgerStats(): {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  canceled: number;
} {
  const tasks = listTasks();

  return {
    total: tasks.length,
    queued: tasks.filter((task) => task.status === "queued").length,
    running: tasks.filter((task) => task.status === "running").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    failed: tasks.filter((task) => task.status === "failed").length,
    canceled: tasks.filter((task) => task.status === "canceled").length,
  };
}

export function runTaskLedgerAudit(): TaskAuditFinding[] {
  return auditTasks();
}

export function runTaskLedgerMaintenance(options?: {
  apply?: boolean;
  retentionDays?: number;
}): TaskMaintenanceResult {
  const result = maintainTasks(options);
  maintenanceLastRunAt = new Date().toISOString();
  maintenanceLastRemoved = result.removed;
  return result;
}

export function cancelBackgroundTask(
  taskLookup: string,
): TaskRecord | undefined {
  const resolved = getBackgroundTask(taskLookup);
  if (!resolved) {
    return undefined;
  }

  const task = markTaskCanceled(resolved.id);
  if (!task) {
    return undefined;
  }
  appendTaskLog(task.id, "Task canceled by user request");
  return getTask(task.id);
}

export function updateBackgroundTaskNotifyPolicy(
  taskLookup: string,
  notifyPolicy: TaskNotifyPolicy,
): TaskRecord | undefined {
  const resolved = getBackgroundTask(taskLookup);
  if (!resolved) {
    return undefined;
  }

  const task = setTaskNotifyPolicy(resolved.id, notifyPolicy);
  if (!task) {
    return undefined;
  }
  appendTaskLog(task.id, `Notify policy updated to ${notifyPolicy}`);
  return getTask(task.id);
}

export function startTaskLedgerMaintenanceSweeper(options?: {
  intervalMinutes?: number;
  retentionDays?: number;
}): void {
  if (maintenanceStarted) {
    return;
  }

  const intervalRaw = Number(options?.intervalMinutes);
  const retentionRaw = Number(options?.retentionDays);
  maintenanceIntervalMinutes = Number.isFinite(intervalRaw)
    ? Math.max(1, Math.floor(intervalRaw))
    : maintenanceIntervalMinutes;
  maintenanceRetentionDays = Number.isFinite(retentionRaw)
    ? Math.max(1, Math.floor(retentionRaw))
    : maintenanceRetentionDays;

  maintenanceStarted = true;
  maintenanceTimer = setInterval(() => {
    runTaskLedgerMaintenance({
      apply: true,
      retentionDays: maintenanceRetentionDays,
    });
  }, maintenanceIntervalMinutes * 60_000);
}

export function stopTaskLedgerMaintenanceSweeper(): void {
  if (maintenanceTimer) {
    clearInterval(maintenanceTimer);
    maintenanceTimer = null;
  }
  maintenanceStarted = false;
}

export function getTaskLedgerMaintenanceStatus(): {
  started: boolean;
  intervalMinutes: number;
  retentionDays: number;
  lastRunAt?: string;
  lastRemoved: number;
} {
  return {
    started: maintenanceStarted,
    intervalMinutes: maintenanceIntervalMinutes,
    retentionDays: maintenanceRetentionDays,
    ...(maintenanceLastRunAt && { lastRunAt: maintenanceLastRunAt }),
    lastRemoved: maintenanceLastRemoved,
  };
}
