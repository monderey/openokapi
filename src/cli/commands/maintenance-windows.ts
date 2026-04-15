import chalk from "chalk";
import {
  deleteMaintenanceWindow,
  getMaintenanceStatus,
  listMaintenanceWindows,
  upsertMaintenanceWindow,
} from "../../functions/maintenance-windows.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function parseBooleanFlag(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function runMaintenanceWindowsCommand(commandArgs: string[]): void {
  const json = commandArgs.includes("--json");

  if (commandArgs.includes("--set")) {
    const window = upsertMaintenanceWindow({
      id: getFlagValue(commandArgs, "--id"),
      name: getFlagValue(commandArgs, "--name") || "",
      enabled: parseBooleanFlag(getFlagValue(commandArgs, "--enabled")),
      startAt: getFlagValue(commandArgs, "--start-at") || "",
      endAt: getFlagValue(commandArgs, "--end-at") || "",
      muteAlerts: parseBooleanFlag(getFlagValue(commandArgs, "--mute-alerts")),
      muteIncidents: parseBooleanFlag(
        getFlagValue(commandArgs, "--mute-incidents"),
      ),
    });

    if (json) {
      console.log(JSON.stringify({ window }, null, 2));
      return;
    }

    console.log(chalk.green(`Saved maintenance window: ${window.id}`));
    return;
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) {
      throw new Error("Use --delete --id <window-id>");
    }

    const deleted = deleteMaintenanceWindow(id);
    if (!deleted) {
      throw new Error(`Maintenance window not found: ${id}`);
    }

    console.log(chalk.green(`Deleted maintenance window: ${id}`));
    return;
  }

  const status = getMaintenanceStatus();
  const windows = listMaintenanceWindows();

  if (json) {
    console.log(JSON.stringify({ status, windows }, null, 2));
    return;
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Maintenance Windows"),
  );
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Mute: alerts ${status.mutedAlerts ? chalk.yellow("on") : chalk.green("off")}, incidents ${status.mutedIncidents ? chalk.yellow("on") : chalk.green("off")}`,
    ),
  );
  console.log(line(`  Active windows: ${status.activeWindowIds.length}`));
  console.log(line(""));

  for (const window of windows.slice(0, 50)) {
    console.log(
      line(
        `  ${window.enabled ? chalk.green("✓") : chalk.red("✗")} ${window.id} ${window.name} ${window.startAt} -> ${window.endAt} muteAlerts:${window.muteAlerts} muteIncidents:${window.muteIncidents}`,
      ),
    );
  }

  if (!windows.length) {
    console.log(line("  No maintenance windows"));
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
