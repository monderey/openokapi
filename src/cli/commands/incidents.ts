import chalk from "chalk";
import {
  acknowledgeIncident,
  createIncident,
  getIncident,
  listIncidents,
  resolveIncident,
  type IncidentStatus,
} from "../../functions/incidents.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function parseStatus(value: string | undefined): IncidentStatus | undefined {
  return value === "open" || value === "acknowledged" || value === "resolved"
    ? value
    : undefined;
}

export function runIncidentsCommand(commandArgs: string[]): void {
  const json = commandArgs.includes("--json");
  const sub =
    commandArgs[0] && !commandArgs[0].startsWith("--")
      ? commandArgs[0]
      : "list";

  if (sub === "create") {
    const incident = createIncident({
      title: getFlagValue(commandArgs, "--title"),
      deep: commandArgs.includes("--deep"),
      alertLimit: Number(getFlagValue(commandArgs, "--limit") || ""),
      forceWhenMuted: commandArgs.includes("--force"),
    });

    if (json) {
      console.log(JSON.stringify({ incident }, null, 2));
      return;
    }

    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Incident Created"),
    );
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(line(`  ID: ${chalk.cyan(incident.id)}`));
    console.log(line(`  Status: ${incident.status}`));
    console.log(line(`  Severity: ${incident.severity}`));
    console.log(line(`  Alerts: ${incident.summary.totalAlerts}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (sub === "show") {
    const id =
      commandArgs[1] && !commandArgs[1].startsWith("--")
        ? commandArgs[1]
        : getFlagValue(commandArgs, "--id");
    if (!id) {
      throw new Error("Use: openokapi incidents show <id>");
    }

    const incident = getIncident(id);
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    if (json) {
      console.log(JSON.stringify({ incident }, null, 2));
      return;
    }

    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Incident"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(line(`  ID: ${chalk.cyan(incident.id)}`));
    console.log(line(`  Title: ${incident.title}`));
    console.log(line(`  Status: ${incident.status}`));
    console.log(line(`  Severity: ${incident.severity}`));
    console.log(
      line(
        `  Alerts: total ${incident.summary.totalAlerts}, warn ${incident.summary.warn}, error ${incident.summary.error}`,
      ),
    );
    if (incident.notes.length) {
      console.log(line(""));
      for (const note of incident.notes.slice(-10)) {
        console.log(line(`  - ${note}`));
      }
    }
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (sub === "ack") {
    const id =
      commandArgs[1] && !commandArgs[1].startsWith("--")
        ? commandArgs[1]
        : getFlagValue(commandArgs, "--id");
    if (!id) {
      throw new Error("Use: openokapi incidents ack <id> [--note ...]");
    }

    const incident = acknowledgeIncident(
      id,
      getFlagValue(commandArgs, "--note"),
    );
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    if (json) {
      console.log(JSON.stringify({ incident }, null, 2));
      return;
    }

    console.log(chalk.green(`Acknowledged incident: ${incident.id}`));
    return;
  }

  if (sub === "resolve") {
    const id =
      commandArgs[1] && !commandArgs[1].startsWith("--")
        ? commandArgs[1]
        : getFlagValue(commandArgs, "--id");
    if (!id) {
      throw new Error("Use: openokapi incidents resolve <id> [--note ...]");
    }

    const incident = resolveIncident(id, getFlagValue(commandArgs, "--note"));
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    if (json) {
      console.log(JSON.stringify({ incident }, null, 2));
      return;
    }

    console.log(chalk.green(`Resolved incident: ${incident.id}`));
    return;
  }

  const limitRaw = Number(getFlagValue(commandArgs, "--limit") || "");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.floor(limitRaw))
    : 50;
  const status = parseStatus(getFlagValue(commandArgs, "--status"));
  const incidents = listIncidents({ limit, status });

  if (json) {
    console.log(JSON.stringify({ incidents }, null, 2));
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Incidents"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  for (const incident of incidents) {
    console.log(
      line(
        `  ${incident.id} ${incident.status} ${incident.severity} alerts:${incident.summary.totalAlerts} ${incident.title}`,
      ),
    );
  }
  if (!incidents.length) {
    console.log(line("  No incidents"));
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
