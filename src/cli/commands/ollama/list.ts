import chalk from "chalk";
import { loadOllamaConfig } from "../../../config/ollama.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";
import { OllamaClient } from "../../../ollama/client.js";

export async function runListModels(): Promise<void> {
  const config = loadOllamaConfig();

  if (!config.baseURL) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama List Models"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("List") +
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

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama List Models"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("List") +
      chalk.dim(" ───────────────────────────────────────────────────┐"),
  );

  try {
    const client = new OllamaClient({ baseURL: config.baseURL });
    const models = await client.listModels();

    console.log(line(""));

    if (models.length === 0) {
      console.log(line(chalk.yellow("  No models found")));
    } else {
      console.log(line(chalk.cyan(`  Found ${models.length} model(s):`)));
      console.log(line(""));

      for (const model of models) {
        const size = (model.size / 1024 / 1024 / 1024).toFixed(2);
        const format = model.details?.format || "unknown";
        const family = model.details?.family || "unknown";

        console.log(line(chalk.cyan("  • ") + chalk.yellow(model.name)));
        console.log(
          line(
            chalk.dim(
              `    Size: ${size} GB | Format: ${format} | Family: ${family}`,
            ),
          ),
        );
      }
    }

    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  } catch (error) {
    console.log(line(""));
    console.log(
      line(chalk.red("✗ Error:")),
      line(error instanceof Error ? error.message : "Unknown error"),
    );
    printWrappedMessage(
      `Make sure Ollama is running at ${chalk.cyan(config.baseURL)}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  }
}
