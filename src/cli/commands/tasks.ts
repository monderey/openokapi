import chalk from "chalk";
import { listTaskFlows, resolveTaskFlow } from "../../config/task-flow.js";
import { cancelTaskFlow } from "../../functions/task-flow.js";
import {
  cancelBackgroundTask,
  getBackgroundTask,
  getTaskLedgerMaintenanceStatus,
  getTaskLedgerStats,
  listBackgroundTasks,
  runTaskLedgerAudit,
  runTaskLedgerMaintenance,
  updateBackgroundTaskNotifyPolicy,
} from "../../functions/tasks-ledger.js";
import {
  getTaskFlowMaintenanceStatus,
  runTaskFlowAudit,
  runTaskFlowMaintenance,
} from "../../functions/task-flow.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runTasks(commandArgs: string[]): void {
  const firstArg = commandArgs[0];
  const subcommand = firstArg && !firstArg.startsWith("--") ? firstArg : "list";

  if (subcommand === "flow") {
    runTasksFlow(commandArgs.slice(1));
    return;
  }

  if (subcommand === "audit") {
    runTasksAudit(commandArgs);
    return;
  }

  if (subcommand === "maintenance") {
    runTasksMaintenance(commandArgs.slice(1));
    return;
  }

  if (subcommand === "cancel") {
    const lookup =
      commandArgs[1] && !commandArgs[1].startsWith("--")
        ? commandArgs[1]
        : undefined;
    if (!lookup) {
      throw new Error("Use: openokapi tasks cancel <lookup>");
    }
    runTasksCancel(lookup);
    return;
  }

  if (subcommand === "notify") {
    const id =
      commandArgs[1] && !commandArgs[1].startsWith("--")
        ? commandArgs[1]
        : undefined;
    const policy =
      commandArgs[2] && !commandArgs[2].startsWith("--")
        ? commandArgs[2]
        : undefined;
    if (!id || !policy) {
      throw new Error(
        "Use: openokapi tasks notify <lookup> <done_only|state_changes|silent>",
      );
    }
    runTasksNotify(id, policy);
    return;
  }

  if (subcommand === "show") {
    const explicitId =
      commandArgs[1] && !commandArgs[1].startsWith("--")
        ? commandArgs[1]
        : undefined;
    const id = explicitId || getFlagValue(commandArgs, "--id");
    if (!id) {
      throw new Error("Use: openokapi tasks show <lookup> or --id <lookup>");
    }
    runTasksShow(id, commandArgs.includes("--json"));
    return;
  }

  const id = getFlagValue(commandArgs, "--id");
  const limitRaw = Number(getFlagValue(commandArgs, "--limit") || "");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.floor(limitRaw))
    : 100;
  const json = commandArgs.includes("--json");
  const status = getFlagValue(commandArgs, "--status");
  const kind = getFlagValue(commandArgs, "--kind");
  const notifyPolicy = getFlagValue(commandArgs, "--notify-policy");

  if (id) {
    runTasksShow(id, json);
    return;
  }

  const tasks = listBackgroundTasks({
    limit,
    status:
      status === "queued" ||
      status === "running" ||
      status === "completed" ||
      status === "failed" ||
      status === "canceled"
        ? status
        : undefined,
    kind:
      kind === "scheduler" ||
      kind === "task-flow" ||
      kind === "heartbeat" ||
      kind === "manual"
        ? kind
        : undefined,
    notifyPolicy:
      notifyPolicy === "done_only" ||
      notifyPolicy === "state_changes" ||
      notifyPolicy === "silent"
        ? notifyPolicy
        : undefined,
  });
  const stats = getTaskLedgerStats();

  if (json) {
    console.log(
      JSON.stringify(
        {
          tasks,
          stats,
          filters: {
            limit,
            status,
            kind,
            notifyPolicy,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Tasks"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Total:${stats.total} queued:${stats.queued} running:${stats.running} completed:${stats.completed} failed:${stats.failed} canceled:${stats.canceled}`,
    ),
  );
  console.log(line(""));
  for (const task of tasks) {
    console.log(
      line(
        `  ${task.id} ${task.kind} ${task.status} ${task.name}${typeof task.durationMs === "number" ? ` (${task.durationMs}ms)` : ""}`,
      ),
    );
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}

function runTasksShow(id: string, json = false): void {
  const task = getBackgroundTask(id);
  if (!task) {
    throw new Error(`Task not found: ${id}`);
  }

  if (json) {
    console.log(JSON.stringify({ task }, null, 2));
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Task"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  ID: ${chalk.cyan(task.id)}`));
  console.log(line(`  Kind: ${task.kind}`));
  console.log(line(`  Name: ${task.name}`));
  console.log(line(`  Status: ${task.status}`));
  console.log(line(`  Created: ${task.createdAt}`));
  if (task.startedAt) console.log(line(`  Started: ${task.startedAt}`));
  if (task.completedAt) console.log(line(`  Completed: ${task.completedAt}`));
  if (typeof task.durationMs === "number") {
    console.log(line(`  Duration: ${task.durationMs}ms`));
  }
  if (task.error) {
    console.log(line(`  Error: ${chalk.red(task.error)}`));
  }
  console.log(line(""));
  for (const log of task.logs) {
    console.log(line(`  - ${log.timestamp} ${log.message}`));
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}

function runTasksAudit(commandArgs: string[]): void {
  const findings = runTaskLedgerAudit();
  const warnCount = findings.filter(
    (entry) => entry.severity === "warn",
  ).length;
  const errorCount = findings.filter(
    (entry) => entry.severity === "error",
  ).length;

  if (commandArgs.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          findings,
          summary: {
            total: findings.length,
            warn: warnCount,
            error: errorCount,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Tasks Audit"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Findings: ${findings.length} warn:${warnCount} error:${errorCount}`,
    ),
  );
  if (!findings.length) {
    console.log(line(""));
    console.log(line(`  ${chalk.green("No findings")}`));
  } else {
    console.log(line(""));
    for (const finding of findings) {
      const severity =
        finding.severity === "error"
          ? chalk.red(finding.severity)
          : chalk.yellow(finding.severity);
      console.log(
        line(
          `  ${severity} ${finding.code} ${chalk.cyan(finding.taskId)} ${finding.message}`,
        ),
      );
    }
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}

function runTasksMaintenance(commandArgs: string[]): void {
  const json = commandArgs.includes("--json");
  if (commandArgs.includes("--status")) {
    const status = getTaskLedgerMaintenanceStatus();
    if (json) {
      console.log(JSON.stringify({ status }, null, 2));
      return;
    }

    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Tasks Maintenance Status"),
    );
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(line(`  Started: ${status.started}`));
    console.log(line(`  Interval: ${status.intervalMinutes}m`));
    console.log(line(`  Retention: ${status.retentionDays}d`));
    if (status.lastRunAt) {
      console.log(line(`  Last run: ${status.lastRunAt}`));
      console.log(line(`  Last removed: ${status.lastRemoved}`));
    }
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const apply = commandArgs.includes("--apply");
  const retentionDaysRaw = Number(
    getFlagValue(commandArgs, "--retention-days") || "",
  );
  const retentionDays = Number.isFinite(retentionDaysRaw)
    ? Math.max(1, Math.floor(retentionDaysRaw))
    : undefined;

  const result = runTaskLedgerMaintenance({ apply, retentionDays });

  if (json) {
    console.log(JSON.stringify({ result }, null, 2));
    return;
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Tasks Maintenance"),
  );
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Mode: ${result.apply ? chalk.yellow("apply") : chalk.cyan("dry-run")}`,
    ),
  );
  console.log(line(`  Retention: ${result.retentionDays}d`));
  console.log(line(`  Total: ${result.total}`));
  console.log(line(`  Terminal: ${result.terminal}`));
  console.log(line(`  Prunable: ${result.prunable}`));
  console.log(line(`  Removed: ${result.removed}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}

function runTasksCancel(lookup: string): void {
  const task = cancelBackgroundTask(lookup);
  if (!task) {
    throw new Error(`Task not found: ${lookup}`);
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Task Cancel"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  ID: ${chalk.cyan(task.id)}`));
  console.log(line(`  Status: ${chalk.yellow(task.status)}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}

function runTasksNotify(id: string, policyRaw: string): void {
  const policy =
    policyRaw === "done_only" ||
    policyRaw === "state_changes" ||
    policyRaw === "silent"
      ? policyRaw
      : undefined;
  if (!policy) {
    throw new Error("Invalid policy. Use done_only, state_changes, or silent");
  }

  const task = updateBackgroundTaskNotifyPolicy(id, policy);
  if (!task) {
    throw new Error(`Task not found: ${id}`);
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Task Notify"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  ID: ${chalk.cyan(task.id)}`));
  console.log(line(`  Policy: ${task.notifyPolicy}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}

function runTasksFlow(commandArgs: string[]): void {
  const json = commandArgs.includes("--json");
  const statusFilter = getFlagValue(commandArgs, "--status");
  const enabledFilter = getFlagValue(commandArgs, "--enabled");
  const sub = commandArgs[0];

  if (sub === "audit") {
    const findings = runTaskFlowAudit();
    const warn = findings.filter(
      (finding) => finding.severity === "warn",
    ).length;
    const error = findings.filter(
      (finding) => finding.severity === "error",
    ).length;

    if (json) {
      console.log(
        JSON.stringify(
          {
            findings,
            summary: {
              total: findings.length,
              warn,
              error,
            },
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Task Flow Audit"),
    );
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(
      line(`  Findings: ${findings.length} warn:${warn} error:${error}`),
    );
    console.log(line(""));
    for (const finding of findings) {
      const severity =
        finding.severity === "error"
          ? chalk.red(finding.severity)
          : chalk.yellow(finding.severity);
      console.log(
        line(
          `  ${severity} ${finding.code} ${finding.flowId} ${finding.message}`,
        ),
      );
    }
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (sub === "maintenance") {
    if (commandArgs.includes("--status")) {
      const status = getTaskFlowMaintenanceStatus();
      if (json) {
        console.log(JSON.stringify({ status }, null, 2));
        return;
      }

      console.log();
      console.log(
        chalk.dim("┌  ") +
          chalk.bold.green("OpenOKAPI Task Flow Maintenance Status"),
      );
      console.log(chalk.dim("│"));
      console.log(line(""));
      console.log(line(`  Started: ${status.started}`));
      console.log(line(`  Interval: ${status.intervalMinutes}m`));
      console.log(line(`  Retention: ${status.retentionDays}d`));
      if (status.lastRunAt) {
        console.log(line(`  Last run: ${status.lastRunAt}`));
        console.log(line(`  Last removed: ${status.lastRemoved}`));
      }
      console.log(line(""));
      console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
      console.log();
      return;
    }

    const apply = commandArgs.includes("--apply");
    const retentionDaysRaw = Number(
      getFlagValue(commandArgs, "--retention-days") || "",
    );
    const retentionDays = Number.isFinite(retentionDaysRaw)
      ? Math.max(1, Math.floor(retentionDaysRaw))
      : undefined;
    const result = runTaskFlowMaintenance({ apply, retentionDays });

    if (json) {
      console.log(JSON.stringify({ result }, null, 2));
      return;
    }

    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Task Flow Maintenance"),
    );
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(
      line(
        `  Mode: ${result.apply ? chalk.yellow("apply") : chalk.cyan("dry-run")}`,
      ),
    );
    console.log(line(`  Retention: ${result.retentionDays}d`));
    console.log(line(`  Total: ${result.total}`));
    console.log(line(`  Terminal: ${result.terminal}`));
    console.log(line(`  Prunable: ${result.prunable}`));
    console.log(line(`  Removed: ${result.removed}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (sub === "cancel") {
    const lookup = commandArgs[1];
    if (!lookup) {
      throw new Error("Use: openokapi tasks flow cancel <lookup>");
    }

    const flow = resolveTaskFlow(lookup);
    if (!flow) {
      throw new Error(`Task flow not found: ${lookup}`);
    }

    cancelTaskFlow(flow.id);
    if (json) {
      console.log(JSON.stringify({ canceled: true, flowId: flow.id }, null, 2));
      return;
    }

    console.log(chalk.green(`Canceled flow: ${flow.id}`));
    return;
  }

  if (sub === "show") {
    const lookup = commandArgs[1];
    if (!lookup) {
      throw new Error("Use: openokapi tasks flow show <lookup>");
    }

    const flow = resolveTaskFlow(lookup);
    if (!flow) {
      throw new Error(`Task flow not found: ${lookup}`);
    }

    if (json) {
      console.log(JSON.stringify({ flow }, null, 2));
      return;
    }

    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Task Flow"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(line(`  ID: ${chalk.cyan(flow.id)}`));
    console.log(line(`  Name: ${flow.name}`));
    console.log(line(`  Status: ${flow.status}`));
    console.log(line(`  Mode: ${flow.mode}`));
    console.log(line(`  Revision: ${flow.revision}`));
    console.log(line(`  Provider: ${flow.provider}`));
    if (flow.model) {
      console.log(line(`  Model: ${flow.model}`));
    }
    console.log(line(""));
    for (const step of flow.steps) {
      console.log(line(`  - ${step.id} ${step.status} ${step.name}`));
    }
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const flows = listTaskFlows().filter((flow) => {
    if (!statusFilter) {
      if (enabledFilter === "true") {
        return flow.enabled;
      }
      if (enabledFilter === "false") {
        return !flow.enabled;
      }
      return true;
    }
    if (flow.status !== statusFilter) {
      return false;
    }
    if (enabledFilter === "true") {
      return flow.enabled;
    }
    if (enabledFilter === "false") {
      return !flow.enabled;
    }
    return true;
  });

  if (json) {
    console.log(JSON.stringify({ flows }, null, 2));
    return;
  }
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Task Flows"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  for (const flow of flows) {
    console.log(
      line(
        `  ${flow.id} ${flow.status} r${flow.revision} ${flow.name} mode:${flow.mode} steps:${flow.steps.length}`,
      ),
    );
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
