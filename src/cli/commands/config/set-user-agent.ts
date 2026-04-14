import chalk from "chalk";
import { updateAppConfig } from "../../../config/app.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

export async function runSetUserAgent(userAgent?: string): Promise<void> {
  if (!userAgent) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Config SetUserAgent"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetUserAgent") +
        chalk.dim(" ───────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No user-agent provided")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi config --set-user-agent "CUSTOM_USER_AGENT/1.0"')}`,
    );
    printWrappedMessage(
      `Example: ${chalk.cyan('openokapi config --set-user-agent "MyBot/1.0"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const maxKeyWidth = width - 6 - "User-Agent: ".length;
  const truncatedUA =
    userAgent.length > maxKeyWidth
      ? `${userAgent.slice(0, Math.max(0, maxKeyWidth - 3))}...`
      : userAgent;

  updateAppConfig({ userAgent });

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Config Set User Agent"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Set User Agent") +
      chalk.dim(" ─────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(`  ${chalk.green("✓")} User-Agent: ${chalk.cyan(truncatedUA)}`),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
