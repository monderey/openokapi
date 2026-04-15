import chalk from "chalk";
import {
  loadRouterPolicy,
  updateRouterPolicy,
} from "../../config/router-policy.js";
import {
  explainRoutingDecision,
  selectProviderByPolicy,
} from "../../functions/smart-router.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runRouter(commandArgs: string[]): void {
  const strategy = getFlagValue(commandArgs, "--strategy");
  if (
    strategy === "balanced" ||
    strategy === "cost" ||
    strategy === "speed" ||
    strategy === "reliability"
  ) {
    updateRouterPolicy({ strategy });
  }

  const policy = loadRouterPolicy();
  const pick = selectProviderByPolicy();
  const explanation = explainRoutingDecision();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Router"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Strategy: ${chalk.cyan(policy.strategy)}`));
  console.log(line(`  Pick now: ${chalk.green(pick)}`));
  console.log(line(`  Providers: ${policy.enabledProviders.join(", ")}`));
  for (const candidate of explanation.candidates) {
    console.log(
      line(
        `  - ${candidate.provider}: score=${candidate.score} latency=${candidate.avgLatencyMs}ms reliability=${(candidate.reliability * 100).toFixed(1)}% cost=$${candidate.avgCostUsd.toFixed(4)} ${candidate.constrainedOut ? "[filtered by policy]" : ""}`,
      ),
    );
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
