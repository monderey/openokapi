import cron, { type ScheduledTask } from "node-cron";
import {
  deleteSchedulerJob,
  getSchedulerJob,
  listSchedulerJobs,
  markSchedulerJobRun,
  type SchedulerJob,
} from "../config/scheduler.js";
import { executeWithFailover } from "./failover.js";
import { runProfile } from "./profile-runner.js";
import { emitPlatformEvent } from "./event-bus.js";
import {
  addTaskLog,
  createBackgroundTask,
  markTaskCompleted,
  markTaskFailed,
  markTaskRunning,
} from "./tasks-ledger.js";

const tasks = new Map<string, ScheduledTask>();
const intervals = new Map<string, ReturnType<typeof setInterval>>();
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();
let started = false;

async function executeSchedulerJob(job: SchedulerJob): Promise<void> {
  const startedAt = Date.now();
  const task = createBackgroundTask({
    kind: "scheduler",
    name: `Scheduler: ${job.name}`,
    metadata: {
      jobId: job.id,
      scheduleKind: job.scheduleKind,
      taskType: job.taskType,
    },
  });
  markTaskRunning(task.id);
  addTaskLog(task.id, `Started scheduler job ${job.id}`);

  try {
    if (job.taskType === "prompt") {
      const result = await executeWithFailover({
        provider: job.provider!,
        prompt: job.prompt!,
        model: job.model,
        temperature: job.temperature,
        maxTokens: job.maxTokens,
        system: job.system,
        historySource: "gateway",
        historyAction: "other",
      });

      if (!result.success) {
        throw new Error(result.error?.message || "Scheduler prompt failed");
      }
    } else {
      const profileInput: {
        input: string;
        variables?: Record<string, string>;
        historySource: "gateway";
      } = {
        input: job.profileInput!,
        historySource: "gateway",
      };
      if (job.variables) {
        profileInput.variables = job.variables;
      }

      await runProfile(job.profileName!, profileInput);
    }

    markSchedulerJobRun({
      id: job.id,
      durationMs: Date.now() - startedAt,
      status: "success",
    });
    markTaskCompleted(task.id, {
      jobId: job.id,
      durationMs: Date.now() - startedAt,
    });
    addTaskLog(task.id, "Scheduler job completed successfully");

    await emitPlatformEvent({
      event: "scheduler.job.success",
      payload: {
        jobId: job.id,
        jobName: job.name,
        taskType: job.taskType,
      },
    });

    if (job.scheduleKind === "at" && job.deleteAfterRun) {
      deleteSchedulerJob(job.id);
      clearScheduled(job.id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    markSchedulerJobRun({
      id: job.id,
      durationMs: Date.now() - startedAt,
      status: "failed",
      error: message,
    });
    markTaskFailed(task.id, message);
    addTaskLog(task.id, `Scheduler job failed: ${message}`);

    await emitPlatformEvent({
      event: "scheduler.job.failed",
      payload: {
        jobId: job.id,
        jobName: job.name,
        taskType: job.taskType,
        error: message,
      },
    });
  }
}

function clearScheduled(jobId: string): void {
  const task = tasks.get(jobId);
  if (task) {
    task.stop();
    task.destroy();
    tasks.delete(jobId);
  }

  const interval = intervals.get(jobId);
  if (interval) {
    clearInterval(interval);
    intervals.delete(jobId);
  }

  const timeout = timeouts.get(jobId);
  if (timeout) {
    clearTimeout(timeout);
    timeouts.delete(jobId);
  }
}

function scheduleJob(job: SchedulerJob): void {
  if (job.scheduleKind === "every") {
    if (typeof job.everyMs !== "number" || !Number.isFinite(job.everyMs)) {
      return;
    }
    const interval = setInterval(
      () => {
        void executeSchedulerJob(job);
      },
      Math.max(1_000, Math.floor(job.everyMs)),
    );
    intervals.set(job.id, interval);
    return;
  }

  if (job.scheduleKind === "at") {
    if (!job.at) {
      return;
    }
    const atMs = Date.parse(job.at);
    if (!Number.isFinite(atMs)) {
      return;
    }
    const delay = Math.max(0, atMs - Date.now());
    const timeout = setTimeout(() => {
      void executeSchedulerJob(job);
    }, delay);
    timeouts.set(job.id, timeout);
    return;
  }

  if (!cron.validate(job.cron)) {
    return;
  }

  const taskOptions: {
    timezone?: string;
  } = {};
  if (job.timezone) {
    taskOptions.timezone = job.timezone;
  }

  const task = cron.schedule(
    job.cron,
    () => {
      void executeSchedulerJob(job);
    },
    taskOptions,
  );

  tasks.set(job.id, task);
}

export function startSchedulerEngine(): void {
  if (started) {
    return;
  }

  started = true;
  const jobs = listSchedulerJobs().filter((job) => job.enabled);
  for (const job of jobs) {
    scheduleJob(job);
  }
}

export function stopSchedulerEngine(): void {
  for (const jobId of tasks.keys()) {
    clearScheduled(jobId);
  }
  for (const jobId of intervals.keys()) {
    clearScheduled(jobId);
  }
  for (const jobId of timeouts.keys()) {
    clearScheduled(jobId);
  }
  started = false;
}

export function reloadSchedulerEngine(): {
  started: boolean;
  scheduledJobs: number;
} {
  stopSchedulerEngine();
  startSchedulerEngine();
  return {
    started,
    scheduledJobs: tasks.size,
  };
}

export async function runSchedulerJobNow(jobId: string): Promise<{
  found: boolean;
  started: boolean;
}> {
  const job = getSchedulerJob(jobId);
  if (!job) {
    return {
      found: false,
      started: false,
    };
  }

  await executeSchedulerJob(job);
  return {
    found: true,
    started: true,
  };
}

export function getSchedulerEngineStatus(): {
  started: boolean;
  scheduledJobs: number;
  intervalJobs: number;
  timeoutJobs: number;
  activeJobIds: string[];
} {
  return {
    started,
    scheduledJobs: tasks.size,
    intervalJobs: intervals.size,
    timeoutJobs: timeouts.size,
    activeJobIds: [
      ...new Set([...tasks.keys(), ...intervals.keys(), ...timeouts.keys()]),
    ],
  };
}
