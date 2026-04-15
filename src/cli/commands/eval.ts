import chalk from "chalk";
import { evaluateResponse } from "../../functions/evals.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runEval(commandArgs: string[]): void {
  const prompt = getFlagValue(commandArgs, "--prompt") || "";
  const response = getFlagValue(commandArgs, "--response") || "";
  if (!prompt || !response) {
    throw new Error("Use --prompt <text> --response <text>");
  }

  const report = evaluateResponse({ prompt, response });
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Eval"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Score: ${chalk.cyan(String(report.score))}`));
  console.log(line(`  Relevance: ${report.dimensions.relevance}`));
  console.log(line(`  Completeness: ${report.dimensions.completeness}`));
  console.log(line(`  Safety: ${report.dimensions.safety}`));
  console.log(line(`  Clarity: ${report.dimensions.clarity}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
