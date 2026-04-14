import chalk from "chalk";
import { line, width } from "../../../utils/cliTypes.js";

export function runClaudeHelp(): void {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Commands"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Help") +
      chalk.dim(" ───────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(
      `  Usage: ${chalk.cyan("openokapi agent claude <command> [options]")}`,
    ),
  );
  console.log(line(""));
  console.log(
    line(`  ${chalk.bold.green("--setkey")}        Set Claude API key`),
  );
  console.log(
    line(`  ${chalk.bold.green("--setagent")}      Set default model/agent`),
  );
  console.log(
    line(`  ${chalk.bold.green("--ask")}           Ask a question to Claude`),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--status")}        Show Claude configuration status`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--update-models")} Fetch available models from Claude API`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--rate-limit")}    Show rate limit status for Claude API`,
    ),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
