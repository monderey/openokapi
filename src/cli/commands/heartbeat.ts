import chalk from "chalk";
import { loadHeartbeatConfig } from "../../config/heartbeat.js";
import {
  getHeartbeatEngineStatus,
  reloadHeartbeatEngine,
  runHeartbeatNow,
  updateAndReloadHeartbeat,
} from "../../functions/heartbeat-engine.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export async function runHeartbeat(commandArgs: string[]): Promise<void> {
  if (commandArgs.includes("--set")) {
    const payload: {
      enabled?: boolean;
      intervalMinutes?: number;
      provider?: "openai" | "claude" | "ollama";
      model?: string;
      prompt?: string;
    } = {};

    const enabled = getFlagValue(commandArgs, "--enabled");
    const intervalMinutesRaw = Number(
      getFlagValue(commandArgs, "--interval-minutes") || "",
    );
    const provider = getFlagValue(commandArgs, "--provider");
    const model = getFlagValue(commandArgs, "--model");
    const prompt = getFlagValue(commandArgs, "--prompt");

    if (enabled === "true" || enabled === "false") {
      payload.enabled = enabled === "true";
    }
    if (Number.isFinite(intervalMinutesRaw)) {
      payload.intervalMinutes = intervalMinutesRaw;
    }
    if (
      provider === "openai" ||
      provider === "claude" ||
      provider === "ollama"
    ) {
      payload.provider = provider;
    }
    if (model) payload.model = model;
    if (prompt) payload.prompt = prompt;

    updateAndReloadHeartbeat(payload);
  }

  if (commandArgs.includes("--run")) {
    await runHeartbeatNow();
  }

  if (commandArgs.includes("--reload")) {
    reloadHeartbeatEngine();
  }

  const config = loadHeartbeatConfig();
  const status = getHeartbeatEngineStatus();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Heartbeat"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(`  Enabled: ${config.enabled ? chalk.green("yes") : chalk.red("no")}`),
  );
  console.log(
    line(`  Started: ${status.started ? chalk.green("yes") : chalk.red("no")}`),
  );
  console.log(
    line(`  Interval: ${chalk.cyan(String(config.intervalMinutes))} min`),
  );
  console.log(
    line(`  Provider: ${chalk.cyan(config.provider)} ${config.model || ""}`),
  );
  console.log(line(`  Last run: ${config.lastRunAt || chalk.dim("never")}`));
  if (config.lastStatus) {
    console.log(
      line(
        `  Last status: ${config.lastStatus === "success" ? chalk.green(config.lastStatus) : chalk.red(config.lastStatus)}`,
      ),
    );
  }
  if (config.lastError) {
    console.log(line(`  Last error: ${chalk.red(config.lastError)}`));
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
