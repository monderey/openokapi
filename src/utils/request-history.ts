import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { ensurePrivateFile, getRequestHistoryPath } from "../config/paths.js";

export type RequestHistoryProvider = "openai" | "claude" | "ollama";

export type RequestHistorySource = "cli" | "gateway" | "discord" | "unknown";

export type RequestHistoryAction =
  | "ask"
  | "chat"
  | "generate"
  | "stream"
  | "validate"
  | "other";

export interface RequestHistoryEntry {
  id: string;
  timestamp: string;
  provider: RequestHistoryProvider;
  source: RequestHistorySource;
  action: RequestHistoryAction;
  model: string;
  success: boolean;
  durationMs: number;
  promptLength: number;
  responseLength?: number | undefined;
  retries?: number | undefined;
  errorType?: string | undefined;
  errorMessage?: string | undefined;
}

export interface RequestHistoryInput {
  provider: RequestHistoryProvider;
  model: string;
  success: boolean;
  durationMs: number;
  promptLength: number;
  source?: RequestHistorySource;
  action?: RequestHistoryAction;
  responseLength?: number | undefined;
  retries?: number | undefined;
  errorType?: string | undefined;
  errorMessage?: string | undefined;
}

export interface RequestHistorySummary {
  total: number;
  success: number;
  failed: number;
  byProvider: Record<RequestHistoryProvider, number>;
  bySource: Record<RequestHistorySource, number>;
  averageDurationMs: number;
}

function normalizeLength(value: number | undefined): number {
  if (!Number.isFinite(value) || !value || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

function trimMessage(
  message: string | undefined,
  maxLength: number,
): string | undefined {
  if (!message) return undefined;
  const trimmed = message.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

export function recordRequestHistory(
  input: RequestHistoryInput,
): RequestHistoryEntry | null {
  const entry: RequestHistoryEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    provider: input.provider,
    source: input.source || "unknown",
    action: input.action || "other",
    model: input.model,
    success: input.success,
    durationMs: normalizeLength(input.durationMs),
    promptLength: normalizeLength(input.promptLength),
    responseLength: normalizeLength(input.responseLength) || undefined,
    retries: normalizeLength(input.retries) || undefined,
    errorType: trimMessage(input.errorType, 80),
    errorMessage: trimMessage(input.errorMessage, 240),
  };

  ensurePrivateFile(getRequestHistoryPath());

  try {
    fs.appendFileSync(
      getRequestHistoryPath(),
      `${JSON.stringify(entry)}\n`,
      "utf-8",
    );
    return entry;
  } catch {
    return null;
  }
}

export function readRequestHistory(limit = 50): RequestHistoryEntry[] {
  try {
    if (!fs.existsSync(getRequestHistoryPath())) {
      return [];
    }

    const raw = fs.readFileSync(getRequestHistoryPath(), "utf-8");
    const entries = raw
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        try {
          const parsed = JSON.parse(line) as RequestHistoryEntry;
          return parsed;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is RequestHistoryEntry => entry !== null);

    return entries.slice(Math.max(entries.length - limit, 0)).reverse();
  } catch {
    return [];
  }
}

export function clearRequestHistory(): void {
  ensurePrivateFile(getRequestHistoryPath());
  fs.writeFileSync(getRequestHistoryPath(), "", "utf-8");
}

export function summarizeRequestHistory(
  entries: RequestHistoryEntry[],
): RequestHistorySummary {
  const summary: RequestHistorySummary = {
    total: entries.length,
    success: 0,
    failed: 0,
    byProvider: {
      openai: 0,
      claude: 0,
      ollama: 0,
    },
    bySource: {
      cli: 0,
      gateway: 0,
      discord: 0,
      unknown: 0,
    },
    averageDurationMs: 0,
  };

  let totalDuration = 0;

  for (const entry of entries) {
    if (entry.success) {
      summary.success += 1;
    } else {
      summary.failed += 1;
    }

    summary.byProvider[entry.provider] += 1;
    summary.bySource[entry.source] += 1;
    totalDuration += normalizeLength(entry.durationMs);
  }

  summary.averageDurationMs =
    entries.length > 0 ? Math.round(totalDuration / entries.length) : 0;
  return summary;
}

export function formatRequestHistoryTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}
