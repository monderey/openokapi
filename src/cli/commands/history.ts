import chalk from "chalk";
import {
  clearRequestHistory,
  formatRequestHistoryTimestamp,
  readRequestHistory,
  summarizeRequestHistory,
} from "../../utils/request-history.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(commandArgs: string[], flag: string): string | undefined {
  const flagIndex = commandArgs.indexOf(flag);
  if (flagIndex === -1 || flagIndex + 1 >= commandArgs.length) {
    return undefined;
  }

  const value = commandArgs[flagIndex + 1];
  if (!value || value.startsWith("--")) {
    return undefined;
  }

  return value;
}

function parseLimit(value: string | undefined): number {
  if (!value) return 10;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10;
  }

  return Math.min(parsed, 100);
}

function printTitle(): void {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI History"));
  console.log(chalk.dim("│"));
}

function printFooter(): void {
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}

export function runHistory(commandArgs: string[]): void {
  if (commandArgs.includes("--clear")) {
    clearRequestHistory();
    printTitle();
    console.log(line(""));
    console.log(line(`  ${chalk.green("✓")} History cleared`));
    console.log(line(""));
    printFooter();
    return;
  }

  const providerFilter = getFlagValue(commandArgs, "--provider");
  const sourceFilter = getFlagValue(commandArgs, "--source");
  const actionFilter = getFlagValue(commandArgs, "--action");
  const limit = parseLimit(getFlagValue(commandArgs, "--limit"));
  const showStats =
    commandArgs.includes("--show") ||
    commandArgs.includes("--stats") ||
    commandArgs.length === 0;

  let entries = readRequestHistory(1000);

  if (providerFilter) {
    entries = entries.filter((entry) => entry.provider === providerFilter);
  }

  if (sourceFilter) {
    entries = entries.filter((entry) => entry.source === sourceFilter);
  }

  if (actionFilter) {
    entries = entries.filter((entry) => entry.action === actionFilter);
  }

  const summary = summarizeRequestHistory(entries);
  const recentEntries = entries.slice(0, limit);

  printTitle();
  console.log(line(""));
  console.log(line(`  Total: ${chalk.cyan(String(summary.total))}`));
  console.log(line(`  Success: ${chalk.green(String(summary.success))}`));
  console.log(line(`  Failed: ${chalk.red(String(summary.failed))}`));
  console.log(
    line(`  Avg duration: ${chalk.yellow(`${summary.averageDurationMs} ms`)}`),
  );
  console.log(line(""));

  if (showStats) {
    console.log(
      line(
        `  By provider: openai ${summary.byProvider.openai}, claude ${summary.byProvider.claude}, ollama ${summary.byProvider.ollama}`,
      ),
    );
    console.log(
      line(
        `  By source: cli ${summary.bySource.cli}, gateway ${summary.bySource.gateway}, discord ${summary.bySource.discord}, unknown ${summary.bySource.unknown}`,
      ),
    );
    console.log(line(""));
  }

  if (recentEntries.length === 0) {
    console.log(line(`  ${chalk.dim("No history entries found.")}`));
    console.log(line(""));
    printFooter();
    return;
  }

  console.log(
    line(
      `  Recent entries (showing ${recentEntries.length}/${entries.length})`,
    ),
  );
  console.log(line(""));

  for (const entry of recentEntries) {
    const status = entry.success ? chalk.green("ok") : chalk.red("fail");
    const meta = `${entry.provider}/${entry.source}/${entry.action}`;
    const details = `${entry.model} • ${entry.durationMs} ms${entry.retries ? ` • ${entry.retries} retries` : ""}`;
    const timestamp = formatRequestHistoryTimestamp(entry.timestamp);

    console.log(line(`  ${chalk.dim(timestamp)}`));
    console.log(
      line(`  ${status} ${chalk.cyan(meta)} ${chalk.yellow(entry.model)}`),
    );
    console.log(line(`  ${chalk.dim(details)}`));

    if (!entry.success && entry.errorMessage) {
      console.log(line(`  ${chalk.red(entry.errorMessage)}`));
    }

    console.log(line(""));
  }

  printFooter();
}
