import chalk from "chalk";
import { loadOllamaConfig } from "../../../config/ollama.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";
import { OllamaClient } from "../../../ollama/client.js";

export async function runSearchModel(searchTerm?: string): Promise<void> {
  const config = loadOllamaConfig();

  if (!config.baseURL) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Search Model"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Search") +
        chalk.dim(" ─────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red("Ollama base URL not configured. Use --seturl first.")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (!searchTerm) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Search Model"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Search") +
        chalk.dim(" ─────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No search term provided")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent ollama --search "llama"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Search Model"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Search") +
      chalk.dim(" ─────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(chalk.cyan("  Search term:"), chalk.yellow(searchTerm));
  console.log(line(""));
  console.log(chalk.dim("  Searching..."));

  try {
    const client = new OllamaClient({ baseURL: config.baseURL });
    const results = await client.searchModel(searchTerm);

    console.log(line(""));

    if (results.length === 0) {
      console.log(chalk.yellow(`  No models found matching "${searchTerm}"`));
    } else {
      console.log(chalk.cyan(`  Found ${results.length} model(s):`));
      console.log(line(""));

      for (const model of results) {
        const size = (model.size / 1024 / 1024 / 1024).toFixed(2);
        const family = model.details?.family || "unknown";

        console.log(chalk.cyan("  •"), chalk.yellow(model.name));
        console.log(chalk.dim(`    Size: ${size} GB | Family: ${family}`));
      }
    }

    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  } catch (error) {
    console.log(line(""));
    console.log(
      chalk.red("✗ Error:"),
      error instanceof Error ? error.message : "Unknown error",
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  }
}
