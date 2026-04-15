import chalk from "chalk";
import { runSystemSelfTest } from "../../functions/self-test.js";
import { line, width } from "../../utils/cliTypes.js";

export function runSelfTest(): void {
  const report = runSystemSelfTest();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Self Test"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Overall: ${report.ok ? chalk.green("PASS") : chalk.red("FAIL")} (${report.timestamp})`,
    ),
  );
  console.log(line(""));

  for (const check of report.checks) {
    console.log(
      line(
        `  ${check.ok ? chalk.green("✓") : chalk.red("✗")} ${check.name} - ${check.message}`,
      ),
    );
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
