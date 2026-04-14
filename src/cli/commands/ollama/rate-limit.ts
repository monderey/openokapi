import chalk from "chalk";
import { line, width } from "../../../utils/cliTypes.js";
import { OllamaClient } from "../../../ollama/client.js";
import { loadOllamaConfig } from "../../../config/ollama.js";

export async function runRateLimitStatus(): Promise<void> {
  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Ollama Rate Limit"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Rate Limit Status") +
      chalk.dim(" ──────────────────────────────────────┐"),
  );
  console.log(line(""));

  const config = loadOllamaConfig();

  if (!config.baseURL) {
    console.log(chalk.yellow("  Warning: Ollama not configured"));
  } else {
    const client = new OllamaClient({ baseURL: config.baseURL });
    const status = client.getRateLimitStatus();

    console.log(
      line(
        `  ${chalk.cyan("Requests Remaining:")} ${chalk.yellow(status.requestsRemaining)}`,
      ),
    );
    console.log(
      line(
        `  ${chalk.cyan("Requests Limit:")} ${chalk.yellow(status.requestsLimit)}`,
      ),
    );

    const lastRefillDate = new Date(status.lastRefillTime);
    console.log(
      line(
        `  ${chalk.cyan("Last Refill Time:")} ${chalk.dim(lastRefillDate.toLocaleString())}`,
      ),
    );

    const nextRefill = status.lastRefillTime + 60000;
    const now = Date.now();
    const timeUntilRefill = Math.max(0, nextRefill - now);
    console.log(
      line(
        `  ${chalk.cyan("Next Refill In:")} ${chalk.dim(`${(timeUntilRefill / 1000).toFixed(1)}s`)}`,
      ),
    );
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
