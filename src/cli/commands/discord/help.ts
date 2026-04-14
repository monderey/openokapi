import chalk from "chalk";
import { line, width } from "../../../utils/cliTypes.js";

export function runDiscordHelp(): void {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Help"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Agent commands") +
      chalk.dim(" ─────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(
      `  Usage: ${chalk.cyan("openokapi agent discord <command> [options]")}`,
    ),
  );
  console.log(line(""));
  console.log(
    line(
      `  ${chalk.bold.green("--version")}           Show Discord agent version`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--status on|off")}     Set Discord agent status`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--headless")}          Run bot in background (with --status on)`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--foreground")}        Run bot in foreground or resume from headless`,
    ),
  );
  console.log(
    line(
      `  ${chalk.bold.green("--settoken <TOKEN>")}  Set Discord agent token`,
    ),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
