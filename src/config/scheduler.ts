import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getSchedulerJobsPath, writePrivateFile } from "./paths.js";
import type { Provider } from "../functions/failover.js";

export type SchedulerTaskType = "prompt" | "profile";
export type SchedulerScheduleKind = "cron" | "every" | "at";

export interface SchedulerJob {
  id: string;
  name: string;
  enabled: boolean;
  scheduleKind: SchedulerScheduleKind;
  cron: string;
  everyMs?: number;
  at?: string;
  timezone?: string;
  deleteAfterRun?: boolean;
  taskType: SchedulerTaskType;
  provider?: Provider;
  model?: string;
  prompt?: string;
  profileName?: string;
  profileInput?: string;
  variables?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastDurationMs?: number;
  lastStatus?: "success" | "failed";
  lastError?: string;
}

function loadAll(): SchedulerJob[] {
  try {
    const raw = fs.readFileSync(getSchedulerJobsPath(), "utf-8");
    const parsed = JSON.parse(raw) as SchedulerJob[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SchedulerJob =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        (typeof item.cron === "string" ||
          typeof item.everyMs === "number" ||
          typeof item.at === "string") &&
        (item.taskType === "prompt" || item.taskType === "profile"),
    );
  } catch {
    return [];
  }
}

function saveAll(items: SchedulerJob[]): void {
  writePrivateFile(getSchedulerJobsPath(), JSON.stringify(items, null, 2));
}

export function listSchedulerJobs(): SchedulerJob[] {
  return loadAll().sort((a, b) => a.name.localeCompare(b.name));
}

export function getSchedulerJob(id: string): SchedulerJob | undefined {
  return loadAll().find((item) => item.id === id);
}

export function upsertSchedulerJob(input: {
  id?: string;
  name: string;
  enabled?: boolean;
  cron: string;
  scheduleKind?: SchedulerScheduleKind;
  everyMs?: number;
  at?: string;
  timezone?: string;
  deleteAfterRun?: boolean;
  taskType: SchedulerTaskType;
  provider?: Provider;
  model?: string;
  prompt?: string;
  profileName?: string;
  profileInput?: string;
  variables?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
  system?: string;
}): SchedulerJob {
  const now = new Date().toISOString();
  const current = loadAll();
  const existing =
    input.id && input.id.trim()
      ? current.find((item) => item.id === input.id!.trim())
      : undefined;

  const id = existing?.id || input.id?.trim() || randomUUID();
  const next: SchedulerJob = {
    id,
    name: input.name.trim() || `job-${id.slice(0, 8)}`,
    enabled: input.enabled !== false,
    cron: input.cron.trim(),
    scheduleKind: input.scheduleKind || existing?.scheduleKind || "cron",
    taskType: input.taskType,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (existing?.lastRunAt) next.lastRunAt = existing.lastRunAt;
  if (typeof existing?.lastDurationMs === "number") {
    next.lastDurationMs = existing.lastDurationMs;
  }
  if (existing?.lastStatus) next.lastStatus = existing.lastStatus;
  if (existing?.lastError) next.lastError = existing.lastError;

  if (input.timezone?.trim()) next.timezone = input.timezone.trim();
  else if (existing?.timezone) next.timezone = existing.timezone;

  if (typeof input.everyMs === "number" && Number.isFinite(input.everyMs)) {
    next.everyMs = Math.max(1_000, Math.floor(input.everyMs));
  } else if (typeof existing?.everyMs === "number") {
    next.everyMs = existing.everyMs;
  }

  if (input.at?.trim()) {
    next.at = input.at.trim();
  } else if (existing?.at) {
    next.at = existing.at;
  }

  if (typeof input.deleteAfterRun === "boolean") {
    next.deleteAfterRun = input.deleteAfterRun;
  } else if (typeof existing?.deleteAfterRun === "boolean") {
    next.deleteAfterRun = existing.deleteAfterRun;
  }

  if (input.taskType === "prompt") {
    const provider = input.provider || existing?.provider;
    const prompt = input.prompt || existing?.prompt;
    if (!provider || !prompt) {
      throw new Error("Prompt job requires provider and prompt");
    }

    next.provider = provider;
    next.prompt = prompt;
    if (input.model) next.model = input.model;
    else if (existing?.model) next.model = existing.model;
    if (typeof input.temperature === "number")
      next.temperature = input.temperature;
    else if (typeof existing?.temperature === "number") {
      next.temperature = existing.temperature;
    }
    if (typeof input.maxTokens === "number") next.maxTokens = input.maxTokens;
    else if (typeof existing?.maxTokens === "number") {
      next.maxTokens = existing.maxTokens;
    }
    if (input.system) next.system = input.system;
    else if (existing?.system) next.system = existing.system;
  }

  if (input.taskType === "profile") {
    const profileName = input.profileName || existing?.profileName;
    const profileInput = input.profileInput || existing?.profileInput;
    if (!profileName || !profileInput) {
      throw new Error("Profile job requires profileName and profileInput");
    }

    next.profileName = profileName;
    next.profileInput = profileInput;
    if (input.variables) {
      next.variables = input.variables;
    } else if (existing?.variables) {
      next.variables = existing.variables;
    }
  }

  if (next.scheduleKind === "cron" && !next.cron) {
    throw new Error("Scheduler cron is required for cron jobs");
  }

  if (next.scheduleKind === "every") {
    if (typeof next.everyMs !== "number" || !Number.isFinite(next.everyMs)) {
      throw new Error("Scheduler everyMs is required for every jobs");
    }
  }

  if (next.scheduleKind === "at") {
    if (!next.at) {
      throw new Error("Scheduler at timestamp is required for at jobs");
    }
    const atMs = Date.parse(next.at);
    if (!Number.isFinite(atMs)) {
      throw new Error("Scheduler at timestamp must be a valid ISO date");
    }
  }

  const filtered = current.filter((item) => item.id !== next.id);
  filtered.push(next);
  saveAll(filtered);
  return next;
}

export function deleteSchedulerJob(id: string): boolean {
  const current = loadAll();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) {
    return false;
  }

  saveAll(next);
  return true;
}

export function markSchedulerJobRun(input: {
  id: string;
  durationMs: number;
  status: "success" | "failed";
  error?: string;
}): void {
  const current = loadAll();
  const index = current.findIndex((item) => item.id === input.id);
  if (index === -1) {
    return;
  }

  const job = current[index];
  if (!job) {
    return;
  }

  job.lastRunAt = new Date().toISOString();
  job.lastDurationMs = Math.max(0, Math.floor(input.durationMs));
  job.lastStatus = input.status;
  if (input.error) {
    job.lastError = input.error;
  } else {
    delete job.lastError;
  }
  job.updatedAt = new Date().toISOString();

  current[index] = job;
  saveAll(current);
}
