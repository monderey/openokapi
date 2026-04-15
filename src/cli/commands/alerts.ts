import chalk from "chalk";
import { getAlertsReport } from "../../functions/alerts.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runAlertsCommand(commandArgs: string[]): void {
  const deep = commandArgs.includes("--deep");
  const ignoreMute = commandArgs.includes("--ignore-mute");
  const json = commandArgs.includes("--json");
  const limitRaw = Number(getFlagValue(commandArgs, "--limit") || "");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.floor(limitRaw))
    : undefined;

  const report = getAlertsReport({
    deep,
    limit: Number.isFinite(limitRaw) ? limit : undefined,
    ignoreMute,
  } as any);

  if (json) {
    console.log(JSON.stringify({ report }, null, 2));
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Alerts"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(`  Status: ${report.ok ? chalk.green("CLEAR") : chalk.red("ACTIVE")}`),
  );
  if (report.muted) {
    console.log(
      line(`  Mute window active: ${chalk.yellow("alerts suppressed")}`),
    );
  }
  console.log(
    line(
      `  Alerts: total ${report.summary.total}, warn ${report.summary.warn}, error ${report.summary.error}, suppressed ${report.summary.suppressed}`,
    ),
  );
  if (typeof limit === "number") {
    console.log(line(`  Showing: ${report.alerts.length} (limit ${limit})`));
  }

  console.log(line(""));
  if (!report.alerts.length) {
    console.log(line(`  ${chalk.green("No active alerts")}`));
  } else {
    for (const alert of report.alerts) {
      const severity =
        alert.severity === "error"
          ? chalk.red(alert.severity)
          : chalk.yellow(alert.severity);
      const ref = alert.ref ? ` [${alert.ref}]` : "";
      console.log(
        line(
          `  ${severity} ${alert.source}.${alert.code}${ref} ${alert.message}`,
        ),
      );
    }
  }

  if (deep) {
    console.log(line(""));
    console.log(line("  Deep snapshot: enabled"));
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
