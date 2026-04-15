import {
  auditTaskFlows,
  getTaskFlow,
  listTaskFlows,
  maintainTaskFlows,
  saveTaskFlow,
  type TaskFlowAuditFinding,
  type TaskFlowMaintenanceResult,
  type TaskFlow,
  type TaskFlowStep,
} from "../config/task-flow.js";
import { executeWithFailover } from "./failover.js";
import { emitPlatformEvent } from "./event-bus.js";
import {
  addTaskLog,
  createBackgroundTask,
  markTaskCompleted,
  markTaskFailed,
  markTaskRunning,
} from "./tasks-ledger.js";

let maintenanceTimer: ReturnType<typeof setInterval> | null = null;
let maintenanceStarted = false;
let maintenanceIntervalMinutes = 20;
let maintenanceRetentionDays = 7;
let maintenanceLastRunAt: string | undefined;
let maintenanceLastRemoved = 0;

function resetSteps(steps: TaskFlowStep[]): TaskFlowStep[] {
  return steps.map((step) => ({
    ...step,
    status: "pending",
    result: undefined,
    error: undefined,
    startedAt: undefined,
    completedAt: undefined,
  }));
}

export interface TaskFlowRunResult {
  found: boolean;
  flow?: TaskFlow;
  completedSteps: number;
  failedStepId?: string;
}

export async function runTaskFlow(flowId: string): Promise<TaskFlowRunResult> {
  const flow = getTaskFlow(flowId);
  if (!flow) {
    return {
      found: false,
      completedSteps: 0,
    };
  }

  const running: TaskFlow = {
    ...flow,
    status: "running",
    lastRunAt: new Date().toISOString(),
    steps: resetSteps(flow.steps),
  };
  saveTaskFlow(running);

  const task = createBackgroundTask({
    kind: "task-flow",
    name: `Task flow: ${running.name}`,
    metadata: {
      flowId: running.id,
      revision: running.revision,
      mode: running.mode,
    },
  });
  markTaskRunning(task.id);
  addTaskLog(task.id, `Started flow ${running.id}`);

  let completedSteps = 0;

  for (const step of running.steps) {
    step.status = "running";
    step.startedAt = new Date().toISOString();
    saveTaskFlow(running);
    addTaskLog(task.id, `Running step ${step.id}: ${step.name}`);

    try {
      const result = await executeWithFailover({
        provider: running.provider,
        model: running.model,
        prompt: `Task flow: ${running.name}\nStep: ${step.name}\nInstruction: ${step.instruction}`,
        historySource: "gateway",
        historyAction: "other",
      });

      if (!result.success || !result.content) {
        throw new Error(result.error?.message || "Task flow step failed");
      }

      step.status = "completed";
      step.result = result.content;
      step.completedAt = new Date().toISOString();
      completedSteps += 1;
      saveTaskFlow(running);
      addTaskLog(task.id, `Completed step ${step.id}: ${step.name}`);
    } catch (error) {
      step.status = "failed";
      step.error = error instanceof Error ? error.message : String(error);
      step.completedAt = new Date().toISOString();
      running.status = "failed";
      saveTaskFlow(running);
      markTaskFailed(task.id, step.error || "Task flow step failed");
      addTaskLog(task.id, `Failed step ${step.id}: ${step.error}`);

      await emitPlatformEvent({
        event: "taskflow.failed",
        payload: {
          flowId: running.id,
          flowName: running.name,
          stepId: step.id,
          stepName: step.name,
          error: step.error,
        },
      });

      return {
        found: true,
        flow: running,
        completedSteps,
        failedStepId: step.id,
      };
    }
  }

  running.status = "completed";
  saveTaskFlow(running);
  markTaskCompleted(task.id, {
    flowId: running.id,
    completedSteps,
    totalSteps: running.steps.length,
  });
  addTaskLog(task.id, "Task flow completed");

  await emitPlatformEvent({
    event: "taskflow.completed",
    payload: {
      flowId: running.id,
      flowName: running.name,
      completedSteps,
      totalSteps: running.steps.length,
    },
  });

  return {
    found: true,
    flow: running,
    completedSteps,
  };
}

export function cancelTaskFlow(flowId: string): {
  found: boolean;
  flow?: TaskFlow;
} {
  const flow = getTaskFlow(flowId);
  if (!flow) {
    return { found: false };
  }

  const next: TaskFlow = {
    ...flow,
    status: "canceled",
  };
  saveTaskFlow(next);
  return {
    found: true,
    flow: next,
  };
}

export function getTaskFlowStatus(): {
  total: number;
  idle: number;
  running: number;
  completed: number;
  failed: number;
  canceled: number;
} {
  const flows = listTaskFlows();

  return {
    total: flows.length,
    idle: flows.filter((flow) => flow.status === "idle").length,
    running: flows.filter((flow) => flow.status === "running").length,
    completed: flows.filter((flow) => flow.status === "completed").length,
    failed: flows.filter((flow) => flow.status === "failed").length,
    canceled: flows.filter((flow) => flow.status === "canceled").length,
  };
}

export function runTaskFlowAudit(): TaskFlowAuditFinding[] {
  return auditTaskFlows();
}

export function runTaskFlowMaintenance(options?: {
  apply?: boolean;
  retentionDays?: number;
}): TaskFlowMaintenanceResult {
  const result = maintainTaskFlows(options);
  maintenanceLastRunAt = new Date().toISOString();
  maintenanceLastRemoved = result.removed;
  return result;
}

export function startTaskFlowMaintenanceSweeper(options?: {
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
    runTaskFlowMaintenance({
      apply: true,
      retentionDays: maintenanceRetentionDays,
    });
  }, maintenanceIntervalMinutes * 60_000);
}

export function stopTaskFlowMaintenanceSweeper(): void {
  if (maintenanceTimer) {
    clearInterval(maintenanceTimer);
    maintenanceTimer = null;
  }
  maintenanceStarted = false;
}

export function getTaskFlowMaintenanceStatus(): {
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
    lastRunAt: maintenanceLastRunAt,
    lastRemoved: maintenanceLastRemoved,
  };
}
