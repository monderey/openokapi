import chalk from "chalk";
import {
  filterRequestHistoryByDays,
  readRequestHistory,
} from "../../utils/request-history.js";
import { summarizeCosts } from "../../utils/costs.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index === -1 || index + 1 >= commandArgs.length) return undefined;
  const value = commandArgs[index + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runCosts(commandArgs: string[]): void {
  const daysRaw = getFlagValue(commandArgs, "--days");
  const days = daysRaw ? Number(daysRaw) : undefined;

  let entries = readRequestHistory(10_000);
  if (days && Number.isFinite(days) && days > 0) {
    entries = filterRequestHistoryByDays(entries, days);
  }

  const summary = summarizeCosts(entries);

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Costs"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Estimated total: ${chalk.cyan(`$${summary.totalEstimatedCostUsd.toFixed(6)}`)}`,
    ),
  );
  console.log(line(`  Requests: ${chalk.cyan(String(summary.totalRequests))}`));
  console.log(line(`  Tokens: ${chalk.cyan(String(summary.totalTokens))}`));
  console.log(line(""));
  console.log(
    line(
      `  OpenAI: ${chalk.yellow(`$${summary.byProvider.openai.toFixed(6)}`)}`,
    ),
  );
  console.log(
    line(
      `  Claude: ${chalk.yellow(`$${summary.byProvider.claude.toFixed(6)}`)}`,
    ),
  );
  console.log(
    line(
      `  Ollama: ${chalk.yellow(`$${summary.byProvider.ollama.toFixed(6)}`)}`,
    ),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
