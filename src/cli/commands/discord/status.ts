import chalk from "chalk";
import fs from "node:fs";
import { spawn } from "node:child_process";
import {
  loadDiscordConfig,
  updateDiscordConfig,
} from "../../../config/discord.js";
import { getDiscordPidPath } from "../../../config/paths.js";
import { cliVerifyToken } from "../../../discord/utils/cliVerifyToken.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";
import { startDiscordBotFromConfig } from "../../../discord/index.js";

export async function runDiscordStatus(
  status?: string,
  headless?: string,
): Promise<void> {
  if (status !== "on" && status !== "off") {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Agent status") +
        chalk.dim(" ───────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red("Invalid status value. Use on|off.")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const config = loadDiscordConfig();
  if (!config.token) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Agent status") +
        chalk.dim(" ───────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red('Please set the token first: --settoken "TOKEN"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const enabled = status === "on";
  const isHeadless = headless === "--headless";

  if (!enabled) {
    const pidPath = getDiscordPidPath();
    try {
      const pid = Number(fs.readFileSync(pidPath, "utf-8"));
      if (Number.isFinite(pid)) {
        process.kill(pid, "SIGTERM");
        updateDiscordConfig({ enabled: false, headless: false });
        console.log();
        console.log(
          chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
        );
        console.log(chalk.dim("│"));
        console.log(
          chalk.cyan("◇  ") +
            chalk.bold.green("Agent status") +
            chalk.dim(" ───────────────────────────────────────────┐"),
        );
        console.log(line(""));
        console.log(
          line(`  Success: ${chalk.cyan("Bot stopped successfully")}`),
        );
        console.log(line(""));
        console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
        console.log();
        return;
      }
    } catch {
      console.log();
      console.log(
        chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
      );
      console.log(chalk.dim("│"));
      console.log(
        chalk.cyan("◇  ") +
          chalk.bold.green("Agent status") +
          chalk.dim(" ───────────────────────────────────────────┐"),
      );
      console.log(line(""));
      console.log(
        line(`  Warning: ${chalk.yellow("No running bot process found")}`),
      );
      console.log(line(""));
      console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
      console.log();
    }
    return;
  }

  const pidPath = getDiscordPidPath();
  try {
    const existingPid = Number(fs.readFileSync(pidPath, "utf-8"));
    if (Number.isFinite(existingPid)) {
      try {
        process.kill(existingPid, 0);
        console.log();
        console.log(
          chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
        );
        console.log(chalk.dim("│"));
        console.log(
          chalk.cyan("◇  ") +
            chalk.bold.green("Agent status") +
            chalk.dim(" ───────────────────────────────────────────┐"),
        );
        console.log(line(""));
        console.log(
          line(`  Warning: ${chalk.yellow("Bot is already running!")}`),
        );
        console.log(
          line(`  Info: ${chalk.cyan(`Process ID: ${existingPid}`)}`),
        );
        console.log(
          line(
            `  Tip: ${chalk.dim('Use "openokapi agent discord --status off"')}`,
          ),
        );
        console.log(line(""));
        console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
        console.log();
        return;
      } catch {
        fs.rmSync(pidPath, { force: true });
      }
    }
  } catch {
    // ignore
  }

  const verification = await cliVerifyToken(config.token);
  if (!verification.ok) {
    if (verification.reason === "invalid") {
      console.log();
      console.log(
        chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
      );
      console.log(chalk.dim("│"));
      console.log(
        chalk.cyan("◇  ") +
          chalk.bold.green("Agent status") +
          chalk.dim(" ───────────────────────────────────────────┐"),
      );
      console.log(line(""));
      printWrappedMessage(
        `Error: ${chalk.red("Invalid token. Please set a valid token.")}`,
      );
      console.log(line(""));
      console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
      console.log();
    } else {
      console.log();
      console.log(
        chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
      );
      console.log(chalk.dim("│"));
      console.log(
        chalk.cyan("◇  ") +
          chalk.bold.green("Agent status") +
          chalk.dim(" ───────────────────────────────────────────┐"),
      );
      console.log(line(""));
      printWrappedMessage(
        `Error: ${chalk.red("Error connecting to Discord API.")}`,
      );
      console.log(line(""));
      console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
      console.log();
    }
    return;
  }

  const execPath = process.execPath;
  const scriptPath = process.argv[1];
  if (!scriptPath) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Agent status") +
        chalk.dim(" ───────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("Cannot start the bot.")}`);
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (isHeadless) {
    const child = spawn(execPath, [scriptPath, "__internal_bot_start"], {
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
    });

    child.unref();

    updateDiscordConfig({ enabled: true, headless: true });

    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Agent status") +
        chalk.dim(" ───────────────────────────────────────────┐"),
    );
    console.log(line(""));
    console.log(
      line(`  Success: ${chalk.cyan("Bot started in headless mode.")}`),
    );
    console.log(
      line(`  Info: ${chalk.yellow("PID saved in ~/.openokapi/discord.pid")}`),
    );
    console.log(line(`  Tip: ${chalk.dim("Use --foreground to view logs")}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
  } else {
    updateDiscordConfig({ enabled: true, headless: false });

    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Status"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Agent status") +
        chalk.dim(" ───────────────────────────────────────────┐"),
    );
    console.log(line(""));
    console.log(
      line(`  Success: ${chalk.cyan("Starting bot in foreground mode...")}`),
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();

    await startDiscordBotFromConfig();
  }
}
