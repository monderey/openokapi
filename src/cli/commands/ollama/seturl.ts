import chalk from "chalk";
import { loadOllamaConfig, saveOllamaConfig } from "../../../config/ollama.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

export async function runSetURL(url?: string): Promise<void> {
  if (!url) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Set URL"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Set URL") +
        chalk.dim(" ────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No URL provided")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent ollama --seturl "http://localhost:11434"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const config = loadOllamaConfig();
  config.baseURL = url.trim();
  config.enabled = true;
  saveOllamaConfig(config);

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Set URL"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Set URL") +
      chalk.dim(" ────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  printWrappedMessage(
    chalk.green("✓") + " Ollama URL configured: " + chalk.cyan(config.baseURL),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
