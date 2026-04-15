import chalk from "chalk";
import { loadBudgetConfig, updateBudgetConfig } from "../../config/budget.js";
import {
  evaluateBudgetRequest,
  getBudgetStatus,
} from "../../functions/budget-enforcer.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runBudget(commandArgs: string[]): void {
  if (commandArgs.includes("--set")) {
    const enabledRaw = getFlagValue(commandArgs, "--enabled");
    const dailyRaw = Number(getFlagValue(commandArgs, "--daily") || "");
    const monthlyRaw = Number(getFlagValue(commandArgs, "--monthly") || "");
    const perRequestRaw = Number(
      getFlagValue(commandArgs, "--per-request") || "",
    );

    const partial: {
      enabled?: boolean;
      dailyUsdLimit?: number;
      monthlyUsdLimit?: number;
      perRequestUsdLimit?: number;
    } = {};

    if (enabledRaw === "true" || enabledRaw === "false") {
      partial.enabled = enabledRaw === "true";
    }
    if (Number.isFinite(dailyRaw)) partial.dailyUsdLimit = dailyRaw;
    if (Number.isFinite(monthlyRaw)) partial.monthlyUsdLimit = monthlyRaw;
    if (Number.isFinite(perRequestRaw))
      partial.perRequestUsdLimit = perRequestRaw;

    updateBudgetConfig(partial);
  }

  const estimateRaw = getFlagValue(commandArgs, "--estimate");
  const estimatedCost = estimateRaw ? Number(estimateRaw) : undefined;

  const config = loadBudgetConfig();
  const status = getBudgetStatus();
  const preflight =
    typeof estimatedCost === "number" && Number.isFinite(estimatedCost)
      ? evaluateBudgetRequest({ estimatedCostUsd: estimatedCost })
      : undefined;

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Budget"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(`  Enabled: ${config.enabled ? chalk.green("yes") : chalk.red("no")}`),
  );
  console.log(line(`  Daily spent: ${chalk.cyan(`$${status.dailySpentUsd}`)}`));
  console.log(
    line(`  Monthly spent: ${chalk.cyan(`$${status.monthlySpentUsd}`)}`),
  );
  console.log(
    line(`  Daily remaining: ${chalk.yellow(`$${status.dailyRemainingUsd}`)}`),
  );
  console.log(
    line(
      `  Monthly remaining: ${chalk.yellow(`$${status.monthlyRemainingUsd}`)}`,
    ),
  );
  console.log(
    line(`  Alert: ${status.alert ? chalk.yellow("yes") : chalk.green("no")}`),
  );
  console.log(
    line(`  Blocked: ${status.blocked ? chalk.red("yes") : chalk.green("no")}`),
  );
  if (preflight) {
    console.log(
      line(
        `  Preflight ($${estimatedCost!.toFixed(6)}): ${preflight.allowed ? chalk.green("allowed") : chalk.red("blocked")}`,
      ),
    );
    if (!preflight.allowed && preflight.reason) {
      console.log(line(`  Reason: ${chalk.red(preflight.reason)}`));
    }
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
