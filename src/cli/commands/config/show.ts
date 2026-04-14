import chalk from "chalk";
import { loadAppConfig } from "../../../config/app.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

export function runConfigShow(target?: string): void {
  if (!target) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Config Show"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Show") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No value after --show")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan("openokapi config --show api-key")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (target !== "api-key") {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Config Show"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Show") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("Unknown config key")}`);
    printWrappedMessage(`Allowed: ${chalk.cyan("api-key")}`);
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const config = loadAppConfig();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Config Show"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Show") +
      chalk.dim(" ───────────────────────────────────────────────────┐"),
  );
  console.log(line(""));

  if (!config.apiKey) {
    printWrappedMessage(
      `Error: ${chalk.red("API key is not set. Run openokapi generate api-key")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log(line(`  Key: ${chalk.cyan(config.apiKey)}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
