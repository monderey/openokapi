import chalk from "chalk";
import {
  updateClaudeConfig,
  loadClaudeConfig,
  loadClaudeModels,
} from "../../../config/claude.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

export async function runSetAgent(modelName?: string): Promise<void> {
  const config = loadClaudeConfig();

  if (!config.apiKey) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude SetAgent"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetAgent") +
        chalk.dim(" ───────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red("Claude API key not configured. Use --setkey first.")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (!modelName) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude SetAgent"),
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
      `Usage: ${chalk.cyan('openokapi agent claude --setagent "claude-3-opus-20240229"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const models = loadClaudeModels();
  const modelExists = models.some((m) => m.id === modelName);

  if (!modelExists && models.length > 0) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude SetAgent"),
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

  updateClaudeConfig({
    ...config,
    defaultModel: modelName,
  });

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude SetAgent"));
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
