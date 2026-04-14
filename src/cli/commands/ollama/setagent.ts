import chalk from "chalk";
import { loadOllamaConfig, saveOllamaConfig } from "../../../config/ollama.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";
import { OllamaClient } from "../../../ollama/client.js";

export async function runSetAgent(model?: string): Promise<void> {
  if (!model) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Set Agent"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Set Agent") +
        chalk.dim(" ──────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No model specified")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent ollama --setagent "llama2"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const config = loadOllamaConfig();

  if (!config.baseURL) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Set Agent"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Set Agent") +
        chalk.dim(" ──────────────────────────────────────────────┐"),
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

  try {
    const client = new OllamaClient({ baseURL: config.baseURL });
    const modelExists = await client.modelExists(model.trim());

    if (!modelExists) {
      console.log();
      console.log(
        chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Set Agent"),
      );
      console.log(chalk.dim("│"));
      console.log(
        chalk.cyan("◇  ") +
          chalk.bold.green("Set Agent") +
          chalk.dim(" ──────────────────────────────────────────────┐"),
      );
      console.log(line(""));
      printWrappedMessage(
        `Error: ${chalk.red(`Model "${model.trim()}" not found in downloaded models.`)}`,
      );
      console.log(line(""));
      console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
      console.log();
      return;
    }
  } catch (error) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Set Agent"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Set Agent") +
        chalk.dim(" ──────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("Could not connect to Ollama")}`);
    printWrappedMessage(
      `Make sure Ollama is running at ${chalk.cyan(config.baseURL)}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  config.defaultModel = model.trim();
  saveOllamaConfig(config);

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Set Agent"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Set Agent") +
      chalk.dim(" ──────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(`  Default model set to: ${chalk.cyan(config.defaultModel)}`),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
