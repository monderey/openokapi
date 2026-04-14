import chalk from "chalk";
import { loadOllamaConfig } from "../../../config/ollama.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";
import { OllamaClient } from "../../../ollama/client.js";

export async function runModelInfo(modelName?: string): Promise<void> {
  const config = loadOllamaConfig();

  if (!config.baseURL) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Model Info"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Info") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `  Error: ${chalk.red("Ollama base URL not configured. Use --seturl first.")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (!modelName) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Model Info"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Info") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`  Error: ${chalk.red("No model name provided")}`);
    printWrappedMessage(
      `  Usage: ${chalk.cyan('openokapi agent ollama --info "llama2"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Model Info"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Info") +
      chalk.dim(" ───────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(chalk.cyan("  Model: ") + chalk.yellow(modelName)));
  console.log(line(""));

  try {
    const client = new OllamaClient({ baseURL: config.baseURL });
    const info = await client.getModelInfo(modelName);

    if (!info) {
      console.log(line(chalk.red("  Model not found")));
    } else {
      console.log(line(chalk.green("  Model Information:")));
      console.log(line(""));
      console.log(line(chalk.cyan("  Name: ") + chalk.yellow(info.name)));
      console.log(line(chalk.cyan("  Model: ") + chalk.yellow(info.model)));
      console.log(
        line(
          chalk.cyan("  Size: ") +
            chalk.yellow(`${(info.size / 1024 / 1024 / 1024).toFixed(2)} GB`),
        ),
      );
      console.log(
        line(
          chalk.cyan("  Modified: ") +
            chalk.yellow(new Date(info.modified_at).toLocaleString()),
        ),
      );
      console.log(
        line(
          chalk.cyan("  Digest: ") +
            chalk.dim(info.digest.substring(0, 12) + "..."),
        ),
      );

      if (info.details) {
        console.log(line(""));
        console.log(line(chalk.cyan("  Details:")));
        if (info.details.format) {
          console.log(
            line(
              chalk.cyan("    Format: ") + chalk.yellow(info.details.format),
            ),
          );
        }
        if (info.details.family) {
          console.log(
            line(
              chalk.cyan("    Family: ") + chalk.yellow(info.details.family),
            ),
          );
        }
        if (info.details.parameter_size) {
          console.log(
            line(
              chalk.cyan("    Parameters: ") +
                chalk.yellow(info.details.parameter_size),
            ),
          );
        }
        if (info.details.quantization_level) {
          console.log(
            line(
              chalk.cyan("    Quantization: ") +
                chalk.yellow(info.details.quantization_level),
            ),
          );
        }
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
