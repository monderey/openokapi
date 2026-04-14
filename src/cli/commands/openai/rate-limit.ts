import chalk from "chalk";
import { getOpenAIClient } from "../../../openai/client.js";
import { line, width } from "../../../utils/cliTypes.js";

export async function runRateLimitStatus(): Promise<void> {
  try {
    const client = getOpenAIClient();
    const status = client.getRateLimitStatus();

    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI OpenAI Rate Limit"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Current Status") +
        chalk.dim(" ─────────────────────────────────────────┐"),
    );
    console.log(line(""));

    const requestsAvailableNum = parseFloat(status.requestsAvailable);
    const tokensAvailableNum = parseFloat(status.tokensAvailable);
    const requestsAvailable = clampPercent(
      (requestsAvailableNum / status.requestsLimit) * 100,
    );
    const tokensAvailable = clampPercent(
      (tokensAvailableNum / status.tokensLimit) * 100,
    );
    const requestsUsed = 100 - requestsAvailable;
    const tokensUsed = 100 - tokensAvailable;
    const minAvailable = Math.min(requestsAvailable, tokensAvailable);
    const resetTime = formatResetTime(status.resetTime);

    const requestsBar = createProgressBar(requestsUsed, 20);
    console.log(line(`  Requests: ${requestsBar} ${requestsUsed}%`));
    console.log(
      line(
        `  Available: ${chalk.cyan(status.requestsAvailable)}/${status.requestsLimit} RPM`,
      ),
    );

    console.log(line(""));

    const tokensBar = createProgressBar(tokensUsed, 20);
    console.log(line(`  Tokens: ${tokensBar} ${tokensUsed}%`));
    console.log(
      line(
        `  Available: ${chalk.cyan(status.tokensAvailable)}/${status.tokensLimit} TPM`,
      ),
    );

    console.log(line(""));

    if (minAvailable < 5) {
      console.log(line(chalk.red("  CRITICAL - Rate limit exceeded!")));
    } else if (minAvailable < 20) {
      console.log(line(chalk.yellow("  Approaching rate limit!")));
    } else {
      console.log(line(chalk.green("  Ready to use")));
    }

    if (minAvailable < 20) {
      console.log(line(`  Reset time (UTC+1): ${resetTime}`));
    }

    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  } catch (error) {
    console.error(chalk.red("Error:"), (error as Error).message);
    process.exit(1);
  }
}

function createProgressBar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  let color = chalk.green;
  if (percent < 20) color = chalk.red;
  else if (percent < 40) color = chalk.yellow;

  return color(`[${"█".repeat(filled)}${chalk.dim("░".repeat(empty))}]`);
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatResetTime(isoTime: string): string {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return isoTime;

  const utcPlus1 = new Date(date.getTime() + 60 * 60 * 1000);
  const day = String(utcPlus1.getUTCDate()).padStart(2, "0");
  const month = String(utcPlus1.getUTCMonth() + 1).padStart(2, "0");
  const year = utcPlus1.getUTCFullYear();
  const hours = String(utcPlus1.getUTCHours()).padStart(2, "0");
  const minutes = String(utcPlus1.getUTCMinutes()).padStart(2, "0");
  const seconds = String(utcPlus1.getUTCSeconds()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}
