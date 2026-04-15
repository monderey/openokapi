import chalk from "chalk";
import { runSecurityAudit } from "../../functions/security-audit.js";
import { line, width } from "../../utils/cliTypes.js";

export function runSecurityCommand(commandArgs: string[]): void {
  const fix = commandArgs.includes("--fix");
  const json = commandArgs.includes("--json");
  const report = runSecurityAudit({ fix });

  if (json) {
    console.log(JSON.stringify({ report }, null, 2));
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Security Audit"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Status: ${report.ok ? chalk.green("OK") : chalk.red("ISSUES")} findings:${report.summary.total} warn:${report.summary.warn} error:${report.summary.error}`,
    ),
  );
  console.log(line(""));

  if (!report.findings.length) {
    console.log(line(`  ${chalk.green("No findings")}`));
  } else {
    for (const finding of report.findings) {
      const sev =
        finding.severity === "error"
          ? chalk.red(finding.severity)
          : chalk.yellow(finding.severity);
      const ref = finding.ref ? ` [${finding.ref}]` : "";
      console.log(line(`  ${sev} ${finding.code}${ref} ${finding.message}`));
    }
  }

  if (report.fixes) {
    console.log(line(""));
    console.log(line("  Fixes:"));
    console.log(line(`  chmod dir: ${report.fixes.chmodDir.length}`));
    console.log(line(`  chmod file: ${report.fixes.chmodFile.length}`));
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
