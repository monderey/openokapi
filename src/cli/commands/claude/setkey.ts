import chalk from "chalk";
import { updateClaudeConfig } from "../../../config/claude.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";
import axios from "axios";

export async function runSetApiKey(apiKey?: string): Promise<void> {
  if (!apiKey) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude SetApiKey"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetApiKey") +
        chalk.dim(" ──────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No API key after --setkey")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent claude --setkey "sk-ant-..."')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const maxKeyWidth = width - 6 - "Key: ".length;
  const truncatedKey =
    apiKey.length > maxKeyWidth
      ? `${apiKey.slice(0, Math.max(0, maxKeyWidth - 3))}...`
      : apiKey;

  if (!apiKey.startsWith("sk-ant-")) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude SetApiKey"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetApiKey") +
        chalk.dim(" ──────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red("Invalid API key format. Must start with 'sk-ant-'")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude SetApiKey"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("SetApiKey") +
      chalk.dim(" ──────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line("  Validating API key..."));

  try {
    const client = axios.create({
      baseURL: "https://api.anthropic.com/v1",
      headers: {
        "x-api-key": apiKey.trim(),
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    await client.get("/models", { params: { limit: 1 } });

    updateClaudeConfig({
      apiKey: apiKey.trim(),
      enabled: true,
    });

    console.log(
      line(`  ${chalk.green("•")} ${chalk.cyan("API key is valid")}`),
    );
    console.log(line(""));
    console.log(
      line(`  Success: ${chalk.green("API Key saved successfully")}`),
    );
    console.log(line(`  Key: ${truncatedKey}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;

    console.log(line(`  ${chalk.red("✗")} API key validation failed`));
    console.log(line(""));

    if (status === 401) {
      printWrappedMessage(`Error: ${chalk.red("Invalid or expired API key")}`);
    } else if (status === 429) {
      printWrappedMessage(
        `Error: ${chalk.red("Rate limited. Try again later.")}`,
      );
    } else {
      printWrappedMessage(`Error: ${chalk.red(message || "Unknown error")}`);
    }

    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  }
}
