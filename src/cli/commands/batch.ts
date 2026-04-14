import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import chalk from "chalk";
import { loadAppConfig } from "../../config/app.js";
import { line, width } from "../../utils/cliTypes.js";
import { printWrappedMessage } from "../utils/formatting.js";

type BatchRequest = {
  provider: "openai" | "claude" | "ollama";
  prompt: string;
  model?: string;
};

function parseConcurrency(value: string | undefined): number {
  if (!value) return 3;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 3;
  return Math.min(parsed, 10);
}

export async function runBatch(
  filePathArg?: string,
  concurrencyArg?: string,
): Promise<void> {
  if (!filePathArg) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Batch"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Batch") +
        chalk.dim(" ──────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("Missing batch file path")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan("openokapi batch --file ./requests.json --concurrency 3")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), filePathArg);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Batch file not found: ${resolvedPath}`);
  }

  let requests: BatchRequest[];
  try {
    const raw = fs.readFileSync(resolvedPath, "utf-8");
    const parsed = JSON.parse(raw) as BatchRequest[];
    if (!Array.isArray(parsed)) {
      throw new Error("Batch file must contain an array");
    }
    requests = parsed;
  } catch (error) {
    throw new Error(
      `Failed to parse batch file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const config = loadAppConfig();
  if (!config.apiKey) {
    throw new Error("API key not configured. Run: openokapi generate api-key");
  }

  const concurrency = parseConcurrency(concurrencyArg);
  const port = process.env.GATEWAY_PORT || "16273";
  const baseURL = `http://localhost:${port}`;

  const response = await axios.post(
    `${baseURL}/api/batch`,
    {
      requests,
      concurrency,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
        "User-Agent": config.userAgent || "OPENOKAPI/1.0",
      },
      timeout: 120000,
    },
  );

  const data = response.data as {
    total: number;
    completedInMs: number;
    results: Array<{
      success: boolean;
      providerUsed: string;
      fallbackUsed: boolean;
      error?: { message?: string };
    }>;
  };

  const successCount = data.results.filter((item) => item.success).length;
  const failedCount = data.results.length - successCount;

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Batch"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Result") +
      chalk.dim(" ─────────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  Total: ${chalk.cyan(String(data.total))}`));
  console.log(line(`  Success: ${chalk.green(String(successCount))}`));
  console.log(line(`  Failed: ${chalk.red(String(failedCount))}`));
  console.log(line(`  Time: ${chalk.yellow(`${data.completedInMs} ms`)}`));
  console.log(line(""));

  data.results.slice(0, 10).forEach((item, idx) => {
    const icon = item.success ? chalk.green("✓") : chalk.red("✗");
    const fallback = item.fallbackUsed ? chalk.yellow(" fallback") : "";
    const errorMsg = item.error?.message ? ` - ${item.error.message}` : "";
    console.log(
      line(`  ${icon} #${idx + 1} ${item.providerUsed}${fallback}${errorMsg}`),
    );
  });

  if (data.results.length > 10) {
    console.log(line(`  ...and ${data.results.length - 10} more results`));
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
