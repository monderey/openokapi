import chalk from "chalk";
import {
  createBackupSnapshot,
  listBackupSnapshots,
  verifyBackupSnapshot,
} from "../../functions/backup.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runBackupCommand(commandArgs: string[]): void {
  const json = commandArgs.includes("--json");
  const sub =
    commandArgs[0] && !commandArgs[0]?.startsWith("--")
      ? commandArgs[0]
      : "list";

  if (sub === "create") {
    const backup = createBackupSnapshot();
    if (json) {
      console.log(JSON.stringify({ backup }, null, 2));
      return;
    }

    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Backup Created"),
    );
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(line(`  ID: ${chalk.cyan(backup.id)}`));
    console.log(line(`  Entries: ${backup.entries}`));
    console.log(line(`  Path: ${backup.path}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (sub === "verify") {
    const id =
      commandArgs[1] && !commandArgs[1].startsWith("--")
        ? commandArgs[1]
        : getFlagValue(commandArgs, "--id");

    if (!id) {
      throw new Error("Use: openokapi backup verify <backup-id>");
    }

    const result = verifyBackupSnapshot(id);
    if (json) {
      console.log(JSON.stringify({ result }, null, 2));
      return;
    }

    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Backup Verify"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(
      line(`  Status: ${result.ok ? chalk.green("OK") : chalk.red("FAILED")}`),
    );
    console.log(line(`  Checked: ${result.checkedEntries}`));
    console.log(line(`  Missing: ${result.missing.length}`));
    console.log(line(`  Mismatched: ${result.mismatched.length}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const limitRaw = Number(getFlagValue(commandArgs, "--limit") || "");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.floor(limitRaw))
    : 20;
  const backups = listBackupSnapshots(limit);

  if (json) {
    console.log(JSON.stringify({ backups }, null, 2));
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Backups"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  for (const backup of backups) {
    console.log(
      line(
        `  ${backup.id} entries:${backup.entries} created:${backup.createdAt}`,
      ),
    );
  }
  if (!backups.length) {
    console.log(line("  No backups found"));
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
