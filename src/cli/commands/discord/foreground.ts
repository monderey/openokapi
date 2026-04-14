import fs from "node:fs";
import chalk from "chalk";
import { spawn } from "node:child_process";
import { loadDiscordConfig } from "../../../config/discord.js";
import { getDiscordPidPath, getDiscordLogPath } from "../../../config/paths.js";

export async function runDiscordForeground(): Promise<void> {
  const config = loadDiscordConfig();

  if (!config.enabled) {
    console.log(chalk.red("Error: Discord bot is not enabled."));
    console.log(
      chalk.dim("Use: openokapi agent discord --status on --headless"),
    );
    return;
  }

  if (!config.headless) {
    console.log(
      chalk.red("Error: Discord bot is not running in headless mode."),
    );
    console.log(
      chalk.dim("Use: openokapi agent discord --status on --headless"),
    );
    return;
  }

  const pidPath = getDiscordPidPath();
  let pid: number | null = null;

  try {
    pid = Number(fs.readFileSync(pidPath, "utf-8"));
    if (!Number.isFinite(pid)) {
      pid = null;
    }
  } catch {
    pid = null;
  }

  if (!pid) {
    console.log(chalk.red("Error: No headless bot process found."));
    return;
  }

  try {
    process.kill(pid, 0);
  } catch {
    console.log(chalk.red("Error: Headless bot process is not running."));
    return;
  }

  const logPath = getDiscordLogPath();

  console.log(chalk.cyan(`Attaching to bot logs (PID: ${pid})...`));
  console.log(chalk.dim("Press Ctrl+C to detach (bot will keep running)\n"));

  const tail = spawn("tail", ["-f", logPath], {
    stdio: ["ignore", "inherit", "inherit"],
  });

  const cleanup = () => {
    tail.kill();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await new Promise((resolve) => {
    tail.on("close", resolve);
  });
}
