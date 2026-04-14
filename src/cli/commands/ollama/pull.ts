import chalk from "chalk";
import { loadOllamaConfig, saveOllamaModels } from "../../../config/ollama.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";
import { OllamaClient } from "../../../ollama/client.js";

export async function runPullModel(modelName?: string): Promise<void> {
  const config = loadOllamaConfig();

  if (!config.baseURL) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Pull Model"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Pull") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
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

  if (!modelName) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Pull Model"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Pull") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No model name provided")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent ollama --pull "llama2"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Pull Model"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Pull") +
      chalk.dim(" ───────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(chalk.cyan("  Model: ") + chalk.yellow(modelName)));
  console.log(line(""));

  try {
    const client = new OllamaClient({ baseURL: config.baseURL });

    let lastStatus = "";
    await client.pullModel(modelName, (response) => {
      const status = response.status || "downloading";
      if (status !== lastStatus) {
        lastStatus = status;
        const percent =
          response.completed && response.total
            ? Math.round((response.completed / response.total) * 100)
            : 0;
        const percentDisplay = percent > 0 ? ` (${percent}%)` : "";
        printWrappedMessage(`${chalk.dim(`${status}${percentDisplay}`)}`);
      }
    });

    const models = await client.listModels();
    saveOllamaModels(models);

    console.log(line(""));
    console.log(
      printWrappedMessage(`  ${chalk.green("✓")} Model pulled successfully!`),
    );
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
