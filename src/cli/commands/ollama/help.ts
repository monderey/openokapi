import chalk from "chalk";
import { line, width } from "../../../utils/cliTypes.js";

export function runOllamaHelp(): void {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Agent commands") +
      chalk.dim(" ─────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(`  Usage: ${chalk.cyan("openokapi agent ollama [command]")}`),
  );
  console.log(line(""));
  console.log(
    line(`  ${chalk.bold.green("--seturl <url>")}     Set Ollama base URL`),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--ask <prompt>")}     Send a prompt to Ollama model`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--setagent <model>")} Set default model to use`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--list")}             List all downloaded models`,
    ),
  );
  console.log(
    line(`  ${chalk.bold.green("--search <term>")}    Search for models`),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--pull <model>")}     Download a model from Ollama registry`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--info <model>")}     Get information about a model`,
    ),
  );
  console.log(
    line(`  ${chalk.bold.green("--delete <model>")}   Delete a model`),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--status")}           Show configuration status`,
    ),
  );
  console.log(
    line(`  ${chalk.bold.green("--rate-limit")}       Show rate limit status`),
  );
  console.log(
    line(`  ${chalk.bold.green("--help")}             Show this help message`),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
