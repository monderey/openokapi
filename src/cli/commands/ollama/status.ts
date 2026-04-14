import chalk from "chalk";
import { loadOllamaConfig } from "../../../config/ollama.js";
import { line, width } from "../../../utils/cliTypes.js";
import {
  printWrappedMessage,
  printWrappedLines,
} from "../../utils/formatting.js";
import { OllamaClient } from "../../../ollama/client.js";

export async function runOllamaStatus(): Promise<void> {
  const config = loadOllamaConfig();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Status"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Status") +
      chalk.dim(" ─────────────────────────────────────────────────┐"),
  );
  console.log(line(""));

  const statusItems: Array<[string, string]> = [
    [`Enabled:`, config.enabled ? chalk.green("Yes") : chalk.red("No")],
    [
      `Base URL:`,
      config.baseURL || chalk.dim("Not configured (http://localhost:11434)"),
    ],
    [`Default Model:`, config.defaultModel || chalk.dim("Not set")],
  ];

  for (const [key, value] of statusItems) {
    console.log(line(chalk.cyan(`  ${key.padEnd(16)} `) + value));
  }

  console.log(line(""));

  if (config.enabled && config.baseURL) {
    try {
      const client = new OllamaClient({
        baseURL: config.baseURL,
      });

      console.log(line(chalk.cyan("  Checking models...")));
      const models = await client.listModels();

      console.log(
        line(chalk.green(`  Connected! Found ${models.length} model(s):`)),
      );
      console.log(line(""));

      if (models.length > 0) {
        for (const model of models.slice(0, 5)) {
          const size = (model.size / 1024 / 1024 / 1024).toFixed(2);
          console.log(
            line(
              `    ${chalk.cyan("•")} ${chalk.yellow(model.name)} (${size} GB)`,
            ),
          );
        }
        if (models.length > 5) {
          console.log(
            line(`    ${chalk.dim(`... and ${models.length - 5} more`)}`),
          );
        }
      }
    } catch (error) {
      console.log(
        line(
          chalk.red(
            "  Could not connect to Ollama: " +
              chalk.yellow(
                error instanceof Error ? error.message : "Unknown error",
              ),
          ),
        ),
      );
      printWrappedMessage(
        `  Make sure Ollama is running at ${chalk.cyan(
          config.baseURL || "http://localhost:11434",
        )}`,
      );
    }
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
