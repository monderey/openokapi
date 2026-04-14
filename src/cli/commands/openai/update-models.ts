import chalk from "chalk";
import { openaiClient } from "../../../openai/client.js";
import { loadOpenAIConfig } from "../../../config/openai.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

export async function runUpdateModels(): Promise<void> {
  const config = loadOpenAIConfig();

  if (!config.apiKey) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI UpdateModels"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("UpdateModels") +
        chalk.dim(" ────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red("OpenAI API key not configured. Use --setkey first.")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI UpdateModels"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("UpdateModels") +
      chalk.dim(" ───────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line("  Fetching available models from OpenAI API..."));

  try {
    openaiClient.setApiKey(config.apiKey);
    const models = await openaiClient.listModels();

    const gptModels = models.filter(
      (model) =>
        model.id.includes("gpt") ||
        model.id.includes("text-davinci") ||
        model.id.includes("text-curie") ||
        model.id.includes("text-babbage") ||
        model.id.includes("text-ada"),
    );

    console.log(line(""));
    console.log(
      line(
        `  Success: ${chalk.cyan("Successfully fetched")} ${chalk.green(gptModels.length)} ${chalk.cyan("models")}`,
      ),
    );
    console.log(line(""));

    gptModels.slice(0, 5).forEach((model) => {
      console.log(line(`  • ${model.id}`));
    });

    if (gptModels.length > 5) {
      console.log(line(`  ... and ${gptModels.length - 5} more`));
    }

    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  } catch (error: unknown) {
    const err = error as Error;
    console.log(line(""));
    console.log(line(`  ${chalk.red("✗")} Error: ${err.message}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  }
  console.log();
}
