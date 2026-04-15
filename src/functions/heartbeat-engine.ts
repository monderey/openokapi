import {
  loadHeartbeatConfig,
  markHeartbeatRun,
  updateHeartbeatConfig,
} from "../config/heartbeat.js";
import { executeWithFailover } from "./failover.js";
import { emitPlatformEvent } from "./event-bus.js";
import {
  addTaskLog,
  createBackgroundTask,
  markTaskCompleted,
  markTaskFailed,
  markTaskRunning,
} from "./tasks-ledger.js";

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatStarted = false;

async function runHeartbeatOnceInternal(): Promise<void> {
  const config = loadHeartbeatConfig();

  if (!config.enabled) {
    return;
  }

  const task = createBackgroundTask({
    kind: "heartbeat",
    name: "Heartbeat run",
    metadata: {
      provider: config.provider,
      intervalMinutes: config.intervalMinutes,
    },
  });
  markTaskRunning(task.id);
  addTaskLog(task.id, "Heartbeat started");

  try {
    const result = await executeWithFailover({
      provider: config.provider,
      model: config.model,
      prompt: config.prompt,
      historySource: "gateway",
      historyAction: "other",
    });

    if (!result.success) {
      throw new Error(result.error?.message || "Heartbeat request failed");
    }

    markHeartbeatRun({ status: "success" });
    markTaskCompleted(task.id, {
      provider: config.provider,
      model: result.modelUsed,
    });
    addTaskLog(task.id, "Heartbeat completed");
    await emitPlatformEvent({
      event: "heartbeat.success",
      payload: {
        provider: config.provider,
        model: result.modelUsed,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    markHeartbeatRun({ status: "failed", error: message });
    markTaskFailed(task.id, message);
    addTaskLog(task.id, `Heartbeat failed: ${message}`);
    await emitPlatformEvent({
      event: "heartbeat.failed",
      payload: {
        provider: config.provider,
        error: message,
      },
    });
  }
}

export async function runHeartbeatNow(): Promise<{ ok: boolean }> {
  await runHeartbeatOnceInternal();
  return { ok: true };
}

export function startHeartbeatEngine(): void {
  if (heartbeatStarted) {
    return;
  }

  const config = loadHeartbeatConfig();
  heartbeatStarted = true;

  if (!config.enabled) {
    return;
  }

  heartbeatTimer = setInterval(
    () => {
      void runHeartbeatOnceInternal();
    },
    Math.max(60_000, config.intervalMinutes * 60_000),
  );
}

export function stopHeartbeatEngine(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  heartbeatStarted = false;
}

export function reloadHeartbeatEngine(): {
  started: boolean;
  enabled: boolean;
  intervalMinutes: number;
} {
  stopHeartbeatEngine();
  startHeartbeatEngine();
  const config = loadHeartbeatConfig();
  return {
    started: heartbeatStarted,
    enabled: config.enabled,
    intervalMinutes: config.intervalMinutes,
  };
}

export function getHeartbeatEngineStatus(): {
  started: boolean;
  enabled: boolean;
  intervalMinutes: number;
  provider: "openai" | "claude" | "ollama";
  lastRunAt?: string;
  lastStatus?: "success" | "failed";
  lastError?: string;
} {
  const config = loadHeartbeatConfig();
  return {
    started: heartbeatStarted,
    enabled: config.enabled,
    intervalMinutes: config.intervalMinutes,
    provider: config.provider,
    lastRunAt: config.lastRunAt,
    lastStatus: config.lastStatus,
    lastError: config.lastError,
  };
}

export function updateAndReloadHeartbeat(input: {
  enabled?: boolean;
  intervalMinutes?: number;
  provider?: "openai" | "claude" | "ollama";
  model?: string;
  prompt?: string;
}): {
  config: ReturnType<typeof loadHeartbeatConfig>;
  status: ReturnType<typeof reloadHeartbeatEngine>;
} {
  const config = updateHeartbeatConfig(input);
  const status = reloadHeartbeatEngine();
  return { config, status };
}
