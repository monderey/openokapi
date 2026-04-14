import chalk from "chalk";
import { getVersion } from "../../version.js";
import { line, width } from "../../utils/cliTypes.js";

export async function runVersion(): Promise<void> {
  const version = await getVersion();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI CLI Version"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Information") +
      chalk.dim(" ────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  OpenOKAPI version: ${chalk.cyan(version)}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
