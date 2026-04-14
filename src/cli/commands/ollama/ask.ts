import chalk from "chalk";
import { loadOllamaConfig } from "../../../config/ollama.js";
import { line, width } from "../../../utils/cliTypes.js";
import {
  printWrappedMessage,
  printWrappedLines,
} from "../../utils/formatting.js";
import {
  sendOllamaRequest,
  formatErrorForCLI,
} from "../../../functions/ollama-request.js";
import { OllamaClient } from "../../../ollama/client.js";

export async function runAsk(
  prompt?: string,
  modelOverride?: string,
): Promise<void> {
  const config = loadOllamaConfig();

  if (!config.baseURL) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
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

  if (!prompt) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No prompt provided")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent ollama --ask "your question here"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const model = modelOverride || config.defaultModel;
  if (!model) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Ask"));
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
      `Set default: ${chalk.cyan('openokapi agent ollama --setagent "llama2"')}`,
    );
    printWrappedMessage(
      `Or specify:  ${chalk.cyan('openokapi agent ollama --ask "prompt" --model "llama2"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const client = new OllamaClient({ baseURL: config.baseURL });
  const modelExists = await client.modelExists(model);

  if (!modelExists) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Ask"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Ask") +
        chalk.dim(" ────────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red(`Model "${model}" not found. Pull it first with:`)}`,
    );
    printWrappedMessage(
      `${chalk.cyan(`openokapi agent ollama --pull "${model}"`)}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Ask"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Ask") +
      chalk.dim(" ────────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  ${chalk.cyan("Model:")} ${chalk.yellow(model)}`));
  printWrappedMessage(`  ${chalk.cyan("Prompt:")} ${chalk.green(prompt)}`);
  console.log(line(""));
  console.log(line(`  ${chalk.dim("Generating response...")}`));

  try {
    const response = await sendOllamaRequest(model, prompt);

    console.log(line(""));
    console.log(line(`  ${chalk.cyan("Response:")}`));
    console.log(line(""));
    printWrappedLines(response.split("\n"));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  } catch (error) {
    const errorMessage = formatErrorForCLI(error);
    console.log(line(""));
    console.log(
      line(`  ${chalk.red("✗")} ${chalk.red("Error:")} ${errorMessage}`),
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  }
}
