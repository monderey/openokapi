import chalk from "chalk";
import { runReset, type ResetScope } from "../../functions/reset.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function parseScope(value: string | undefined): ResetScope | undefined {
  if (value === "config" || value === "config+history" || value === "full") {
    return value;
  }
  return undefined;
}

export function runResetCommand(commandArgs: string[]): void {
  const scope = parseScope(getFlagValue(commandArgs, "--scope"));
  if (!scope) {
    throw new Error("Use --scope <config|config+history|full>");
  }

  const dryRun = commandArgs.includes("--dry-run");
  const confirmed = commandArgs.includes("--yes");
  const json = commandArgs.includes("--json");

  if (!dryRun && !confirmed) {
    throw new Error("Reset requires --yes unless using --dry-run");
  }

  const result = runReset({
    scope,
    dryRun,
  });

  if (json) {
    console.log(JSON.stringify({ result }, null, 2));
    return;
  }

  const totalBytes = result.targets.reduce(
    (acc, target) => acc + target.sizeBytes,
    0,
  );

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Reset"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Scope: ${result.scope}`));
  console.log(
    line(
      `  Mode: ${result.dryRun ? chalk.cyan("dry-run") : chalk.yellow("apply")}`,
    ),
  );
  console.log(line(`  Targets: ${result.targets.length}`));
  console.log(line(`  Bytes: ${totalBytes}`));
  console.log(line(`  Removed: ${result.removed.length}`));
  console.log(line(""));
  for (const target of result.targets) {
    const marker = target.exists ? (result.dryRun ? "~" : "-") : "·";
    console.log(line(`  ${marker} ${target.path}`));
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
