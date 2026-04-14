import chalk from "chalk";
import {
  updateOpenAIConfig,
  loadOpenAIConfig,
  loadOpenAIModels,
} from "../../../config/openai.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

export async function runSetAgent(modelName?: string): Promise<void> {
  const config = loadOpenAIConfig();

  if (!config.apiKey) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI SetAgent"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetAgent") +
        chalk.dim(" ───────────────────────────────────────────────┐"),
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

  if (!modelName) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI SetAgent"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetAgent") +
        chalk.dim(" ───────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red("No model name after --setagent")}`,
    );
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent openai --setagent "gpt-4"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const models = loadOpenAIModels();
  const modelExists = models.some((m) => m.id === modelName);

  if (!modelExists) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI SetAgent"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetAgent") +
        chalk.dim(" ───────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Warning: ${chalk.yellow(`Model '${modelName}' not found in cached models`)}`,
    );
    printWrappedMessage(
      `${chalk.dim("Run")} ${chalk.cyan("--update-models")} ${chalk.dim("to refresh the list")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  }

  updateOpenAIConfig({
    ...config,
    defaultModel: modelName,
  });

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI SetAgent"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("SetAgent") +
      chalk.dim(" ───────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(`  Success: ${chalk.green("Default agent set successfully")}`),
  );
  console.log(line(`  Model: ${chalk.cyan(modelName)}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
