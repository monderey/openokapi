import chalk from "chalk";
import { DISCORD_API_BASE, versionDiscord } from "../../../discord/types.js";
import { line, width } from "../../../utils/cliTypes.js";

export async function runDiscordVersion(): Promise<void> {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord Version"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Agent version") +
      chalk.dim(" ──────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  Version: ${chalk.cyan("v" + versionDiscord)}`));
  console.log(line(`  API URL: ${chalk.cyan(DISCORD_API_BASE)}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
