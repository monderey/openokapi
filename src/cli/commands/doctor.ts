import chalk from "chalk";
import { runDoctor } from "../../functions/doctor.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runDoctorCommand(commandArgs: string[]): void {
  const repair = commandArgs.includes("--repair");
  const json = commandArgs.includes("--json");
  const retentionDaysRaw = Number(
    getFlagValue(commandArgs, "--retention-days") || "",
  );
  const retentionDays = Number.isFinite(retentionDaysRaw)
    ? Math.max(1, Math.floor(retentionDaysRaw))
    : undefined;

  const report = runDoctor({
    repair,
    retentionDays: Number.isFinite(retentionDaysRaw) ? retentionDays : undefined,
  } as any);

  if (json) {
    console.log(JSON.stringify({ report }, null, 2));
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Doctor"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Status: ${report.ok ? chalk.green("OK") : chalk.red("ISSUES")} findings:${report.summary.totalFindings} warn:${report.summary.warn} error:${report.summary.error}`,
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
      console.log(
        line(
          `  ${sev} ${finding.domain}.${finding.code}${ref} ${finding.message}`,
        ),
      );
    }
  }

  if (report.repair) {
    console.log(line(""));
    console.log(line("  Repair: applied"));
    console.log(
      line(
        `  Tasks removed:${report.repair.tasks.removed} prunable:${report.repair.tasks.prunable}`,
      ),
    );
    console.log(
      line(
        `  TaskFlow removed:${report.repair.taskFlow.removed} prunable:${report.repair.taskFlow.prunable}`,
      ),
    );
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
