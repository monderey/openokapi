import fs from "node:fs";
import { getHeartbeatPath, writePrivateFile } from "./paths.js";

export interface HeartbeatConfig {
  enabled: boolean;
  intervalMinutes: number;
  provider: "openai" | "claude" | "ollama";
  model?: string;
  prompt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastStatus?: "success" | "failed";
  lastError?: string;
}

const DEFAULT_HEARTBEAT: HeartbeatConfig = {
  enabled: false,
  intervalMinutes: 30,
  provider: "openai",
  prompt: "Provide a concise system heartbeat report.",
  updatedAt: new Date().toISOString(),
};

export function loadHeartbeatConfig(): HeartbeatConfig {
  try {
    const raw = fs.readFileSync(getHeartbeatPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<HeartbeatConfig>;

    const next: HeartbeatConfig = {
      enabled: parsed.enabled === true,
      intervalMinutes:
        typeof parsed.intervalMinutes === "number" &&
        Number.isFinite(parsed.intervalMinutes)
          ? Math.max(1, Math.floor(parsed.intervalMinutes))
          : DEFAULT_HEARTBEAT.intervalMinutes,
      provider:
        parsed.provider === "openai" ||
        parsed.provider === "claude" ||
        parsed.provider === "ollama"
          ? parsed.provider
          : DEFAULT_HEARTBEAT.provider,
      prompt:
        typeof parsed.prompt === "string" && parsed.prompt.trim()
          ? parsed.prompt.trim()
          : DEFAULT_HEARTBEAT.prompt,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };

    if (typeof parsed.model === "string" && parsed.model.trim()) {
      next.model = parsed.model.trim();
    }
    if (typeof parsed.lastRunAt === "string" && parsed.lastRunAt.trim()) {
      next.lastRunAt = parsed.lastRunAt;
    }
    if (parsed.lastStatus === "success" || parsed.lastStatus === "failed") {
      next.lastStatus = parsed.lastStatus;
    }
    if (typeof parsed.lastError === "string" && parsed.lastError.trim()) {
      next.lastError = parsed.lastError;
    }

    return next;
  } catch {
    return { ...DEFAULT_HEARTBEAT };
  }
}

export function saveHeartbeatConfig(config: HeartbeatConfig): void {
  writePrivateFile(getHeartbeatPath(), JSON.stringify(config, null, 2));
}

export function updateHeartbeatConfig(
  partial: Partial<HeartbeatConfig>,
): HeartbeatConfig {
  const current = loadHeartbeatConfig();
  const next: HeartbeatConfig = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  saveHeartbeatConfig(next);
  return next;
}

export function markHeartbeatRun(input: {
  status: "success" | "failed";
  error?: string;
}): HeartbeatConfig {
  const current = loadHeartbeatConfig();
  const next: HeartbeatConfig = {
    ...current,
    lastRunAt: new Date().toISOString(),
    lastStatus: input.status,
    updatedAt: new Date().toISOString(),
  };

  if (input.error) {
    next.lastError = input.error;
  } else {
    delete next.lastError;
  }

  saveHeartbeatConfig(next);
  return next;
}
