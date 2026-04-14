import chalk from "chalk";
import { loadClaudeConfig, loadClaudeModels } from "../../../config/claude.js";
import { line, width } from "../../../utils/cliTypes.js";
import {
  printWrappedMessage,
  printWrappedLines,
} from "../../utils/formatting.js";
import {
  sendClaudeRequest,
  formatClaudeErrorForCLI,
} from "../../../functions/claude-request.js";
import { getClaudeClient } from "../../../claude/client.js";

export async function runAsk(
  prompt?: string,
  modelOverride?: string,
): Promise<void> {
  const config = loadClaudeConfig();

  if (!config.apiKey) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
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

  if (!prompt) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No prompt provided")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent claude --ask "your question here"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const model = modelOverride || config.defaultModel;
  if (!model) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red("No default model configured and no model specified")}`,
    );
    printWrappedMessage(
      `Set default: ${chalk.cyan('openokapi agent claude --setagent "claude-3-opus-20240229"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Validating") +
      chalk.dim(" ─────────────────────────────────────────────┐"),
  );
  console.log(line(""));

  const client = getClaudeClient();
  const validation = await client.validateApiKey(model);

  if (!validation.valid) {
    printWrappedMessage(
      `Error: ${chalk.red(validation.error || "API key validation failed")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Ask") +
      chalk.dim(" ────────────────────────────────────────────────────┐"),
  );
  console.log(line(""));

  const availableModels = loadClaudeModels();
  if (
    availableModels.length > 0 &&
    !availableModels.some((m) => m.id === model)
  ) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red(`Model "${model}" not found or not available`)}`,
    );
    printWrappedMessage(
      `Update models: ${chalk.cyan("openokapi agent claude --update-models")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Ask") +
      chalk.dim(" ────────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  Model:  ${chalk.cyan(model)}`));
  console.log(
    line(
      `  Prompt: ${chalk.dim(prompt.length > 50 ? prompt.slice(0, 47) + "..." : prompt)}`,
    ),
  );
  console.log(line(""));
  console.log(line("  Processing..."));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);

  try {
    const result = await sendClaudeRequest({
      model,
      prompt,
      temperature: 0.7,
      maxTokens: 1024,
    });

    if (!result.success || !result.content) {
      process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
      console.log();
      console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
      console.log(chalk.dim("│"));
      console.log(
        chalk.cyan("◇  ") +
          chalk.bold.green("Error") +
          chalk.dim(" ──────────────────────────────────────────────────┐"),
      );
      console.log(line(""));

      const errorMessage = formatClaudeErrorForCLI(result.error);
      const errorLines = errorMessage.split("\n");
      for (const errorLine of errorLines) {
        printWrappedMessage(errorLine);
      }

      console.log(line(""));
      console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
      console.log();
      return;
    }

    process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Response") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    console.log(line(`  Model: ${chalk.cyan(model)}`));
    console.log(line(""));

    const responseLines = result.content.split("\n");
    printWrappedLines(responseLines);

    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  } catch (error: any) {
    process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Error") +
        chalk.dim(" ──────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(error.message || "Unknown error occurred");
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  }
}
