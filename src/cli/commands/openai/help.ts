import chalk from "chalk";
import { line, width } from "../../../utils/cliTypes.js";

export function runOpenAIHelp(): void {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Commands"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Help") +
      chalk.dim(" ───────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(
      `  Usage: ${chalk.cyan("openokapi agent openai <command> [options]")}`,
    ),
  );
  console.log(line(""));
  console.log(
    line(`  ${chalk.bold.green("--setkey")}        Set OpenAI API key`),
  );
  console.log(
    line(`  ${chalk.bold.green("--setagent")}      Set default model/agent`),
  );
  console.log(
    line(`  ${chalk.bold.green("--ask")}           Ask a question to OpenAI`),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--status")}        Show OpenAI configuration status`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--update-models")} Fetch available models from OpenAI API`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--rate-limit")}    Fetch rate limit status from OpenAI API`,
    ),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
