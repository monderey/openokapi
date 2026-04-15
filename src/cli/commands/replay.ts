import chalk from "chalk";
import {
  findRequestHistoryById,
  recordRequestHistory,
} from "../../utils/request-history.js";
import { replayCachedResponse } from "../../utils/response-cache.js";
import { line, width } from "../../utils/cliTypes.js";
import { printWrappedLines } from "../utils/formatting.js";

function getFlagValue(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index === -1 || index + 1 >= commandArgs.length) return undefined;
  const value = commandArgs[index + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runReplay(commandArgs: string[]): void {
  const id = getFlagValue(commandArgs, "--id");
  if (!id) {
    throw new Error("Missing required flag: --id <history-id>");
  }

  const entry = findRequestHistoryById(id);
  if (!entry || !entry.cacheKey) {
    throw new Error("History entry not found or missing cache key");
  }

  const content = replayCachedResponse(entry.cacheKey);
  if (!content) {
    throw new Error("Cached response not found or expired");
  }

  recordRequestHistory({
    provider: entry.provider,
    source: "cli",
    action: "replay",
    model: entry.model,
    success: true,
    durationMs: 1,
    promptLength: entry.promptLength,
    responseLength: content.length,
    cacheHit: true,
    cacheKey: entry.cacheKey,
    promptTokens: entry.promptTokens,
    completionTokens: entry.completionTokens,
    totalTokens: entry.totalTokens,
    estimatedCostUsd: 0,
  });

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Replay"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Source history id: ${chalk.cyan(id)}`));
  console.log(line(""));
  printWrappedLines(content.split("\n"));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
