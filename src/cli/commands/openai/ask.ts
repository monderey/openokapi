import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { loadOpenAIConfig } from "../../../config/openai.js";
import { line, width } from "../../../utils/cliTypes.js";
import {
  printWrappedMessage,
  printWrappedLines,
} from "../../utils/formatting.js";
import {
  sendOpenAIRequest,
  formatErrorForCLI,
} from "../../../functions/openai-request.js";
import { getOpenAIClient } from "../../../openai/client.js";

export async function runAsk(
  prompt?: string,
  modelOverride?: string,
): Promise<void> {
  const config = loadOpenAIConfig();

  if (!config.apiKey) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
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

  if (!prompt) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No prompt provided")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent openai --ask "your question here"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const model = modelOverride || config.defaultModel;
  if (!model) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
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
      `Set default: ${chalk.cyan('openokapi agent openai --setagent "gpt-4"')}`,
    );
    printWrappedMessage(
      `Or specify:  ${chalk.cyan('openokapi agent openai --ask "prompt" --model "gpt-4"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Validating") +
      chalk.dim(" ─────────────────────────────────────────────┐"),
  );
  console.log(line(""));

  const client = getOpenAIClient();
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

  const configDir = path.join(process.env.HOME || "~", ".openokapi");
  const modelsFile = path.join(configDir, "models.json");
  let availableModels: string[] = [];

  if (fs.existsSync(modelsFile)) {
    try {
      const data = fs.readFileSync(modelsFile, "utf-8");
      const parsed = JSON.parse(data);
      availableModels = parsed.models || [];
    } catch {
      // ignore
    }
  }

  if (availableModels.length > 0 && !availableModels.includes(model)) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
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
      `Update models: ${chalk.cyan("openokapi agent openai --update-models")}`,
    );
    printWrappedMessage(
      `Or use another: ${chalk.cyan('openokapi agent openai --ask "prompt" --model "gpt-3.5-turbo"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
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
    const result = await sendOpenAIRequest({
      model,
      prompt,
      temperature: 0.7,
    });

    if (!result.success || !result.content) {
      process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
      console.log();
      console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
      console.log(chalk.dim("│"));
      console.log(
        chalk.cyan("◇  ") +
          chalk.bold.green("Error") +
          chalk.dim(" ──────────────────────────────────────────────────┐"),
      );
      console.log(line(""));

      const errorMessage = formatErrorForCLI(result.error);
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
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
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
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Ask"));
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
