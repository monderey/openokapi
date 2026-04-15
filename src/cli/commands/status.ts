import chalk from "chalk";
import { getStatusReport } from "../../functions/status.js";
import { line, width } from "../../utils/cliTypes.js";

export function runStatusCommand(commandArgs: string[]): void {
  const deep = commandArgs.includes("--deep");
  const json = commandArgs.includes("--json");
  const report = getStatusReport({ deep });

  if (json) {
    console.log(JSON.stringify({ report }, null, 2));
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Status"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Mode: ${report.mode}`));
  console.log(
    line(`  Status: ${report.ok ? chalk.green("OK") : chalk.red("ISSUES")}`),
  );
  console.log(
    line(
      `  Self-test: total ${report.summary.selfTest.total}, failed ${report.summary.selfTest.failed}`,
    ),
  );
  console.log(
    line(
      `  Runtime: node ${report.runtime.node} | ${report.runtime.platform} | uptime ${report.runtime.uptimeSeconds}s`,
    ),
  );
  console.log(
    line(
      `  Engines: scheduler ${report.runtime.scheduler.started ? "started" : "stopped"}, heartbeat ${report.runtime.heartbeat.started ? "started" : "stopped"}`,
    ),
  );

  if (deep && report.summary.doctor && report.summary.security) {
    console.log(line(""));
    console.log(
      line(
        `  Doctor: findings ${report.summary.doctor.totalFindings} (warn ${report.summary.doctor.warn}, error ${report.summary.doctor.error})`,
      ),
    );
    console.log(
      line(
        `  Security: findings ${report.summary.security.totalFindings} (warn ${report.summary.security.warn}, error ${report.summary.security.error})`,
      ),
    );
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
