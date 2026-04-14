import chalk from "chalk";
import { updateDiscordConfig } from "../../../config/discord.js";
import { cliVerifyToken } from "../../../discord/utils/cliVerifyToken.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

export async function runSetToken(token?: string): Promise<void> {
  if (!token) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord SetToken"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetToken") +
        chalk.dim(" ───────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No token after --settoken")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan('openokapi agent discord --settoken "TOKEN"')}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const maxTokenWidth = width - 6 - "Token: ".length;
  const truncatedToken =
    token.length > maxTokenWidth
      ? `${token.slice(0, Math.max(0, maxTokenWidth - 3))}...`
      : token;

  const verification = await cliVerifyToken(token);
  if (!verification.ok) {
    if (verification.reason === "invalid") {
      console.log();
      console.log(
        chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord SetToken"),
      );
      console.log(chalk.dim("│"));
      console.log(
        chalk.cyan("◇  ") +
          chalk.bold.green("SetToken") +
          chalk.dim(" ───────────────────────────────────────────────┐"),
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
        chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord SetToken"),
      );
      console.log(chalk.dim("│"));
      console.log(
        chalk.cyan("◇  ") +
          chalk.bold.green("SetToken") +
          chalk.dim(" ───────────────────────────────────────────────┐"),
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

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Discord SetToken"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("SetToken") +
      chalk.dim(" ───────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  Token: ${chalk.yellow(truncatedToken)}`));
  console.log(line(`  Status: ${chalk.cyan("Token saved successfully")}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();

  updateDiscordConfig({ token });
}
