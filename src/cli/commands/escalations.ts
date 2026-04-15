import chalk from "chalk";
import {
  deleteEscalationRule,
  listEscalationRules,
  upsertEscalationRule,
  type EscalationSeverity,
  type EscalationTrigger,
} from "../../config/escalations.js";
import { runEscalationRules } from "../../functions/escalations.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function parseTrigger(
  value: string | undefined,
): EscalationTrigger | undefined {
  return value === "alerts.active" ||
    value === "alerts.error" ||
    value === "incident.created"
    ? value
    : undefined;
}

function parseSeverity(
  value: string | undefined,
): EscalationSeverity | undefined {
  return value === "warn" || value === "error" ? value : undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function runEscalationsCommand(
  commandArgs: string[],
): Promise<void> {
  const json = commandArgs.includes("--json");

  if (commandArgs.includes("--set")) {
    const trigger = parseTrigger(getFlagValue(commandArgs, "--trigger"));
    if (!trigger) {
      throw new Error(
        "Use --set --trigger <alerts.active|alerts.error|incident.created>",
      );
    }

    const minCountRaw = getFlagValue(commandArgs, "--min-count");
    const cooldownRaw = getFlagValue(commandArgs, "--cooldown-minutes");
    const rule = upsertEscalationRule({
      id: getFlagValue(commandArgs, "--id"),
      name: getFlagValue(commandArgs, "--name") || "",
      enabled: parseBoolean(getFlagValue(commandArgs, "--enabled")),
      trigger,
      minSeverity: parseSeverity(getFlagValue(commandArgs, "--min-severity")),
      minCount: minCountRaw ? Number.parseInt(minCountRaw, 10) : undefined,
      integrationEvent: getFlagValue(commandArgs, "--integration-event"),
      autoCreateIncident: parseBoolean(
        getFlagValue(commandArgs, "--auto-incident"),
      ),
      cooldownMinutes: cooldownRaw
        ? Number.parseInt(cooldownRaw, 10)
        : undefined,
    });

    if (json) {
      console.log(JSON.stringify({ rule }, null, 2));
      return;
    }

    console.log(chalk.green(`Saved escalation rule: ${rule.id}`));
    return;
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) {
      throw new Error("Use --delete --id <rule-id>");
    }

    const deleted = deleteEscalationRule(id);
    if (!deleted) {
      throw new Error(`Escalation rule not found: ${id}`);
    }

    console.log(chalk.green(`Deleted escalation rule: ${id}`));
    return;
  }

  if (commandArgs.includes("--run")) {
    const results = await runEscalationRules({
      force: commandArgs.includes("--force"),
      reason: getFlagValue(commandArgs, "--reason"),
    });

    if (json) {
      console.log(JSON.stringify({ results }, null, 2));
      return;
    }

    console.log(results);
    return;
  }

  const rules = listEscalationRules();
  if (json) {
    console.log(JSON.stringify({ rules }, null, 2));
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Escalations"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Count: ${chalk.cyan(String(rules.length))}`));
  console.log(line(""));

  for (const rule of rules) {
    console.log(
      line(
        `  ${rule.enabled ? chalk.green("✓") : chalk.red("✗")} ${rule.id} ${rule.name} trigger:${rule.trigger} min:${rule.minSeverity}/${rule.minCount} event:${rule.integrationEvent} cooldown:${rule.cooldownMinutes}m autoIncident:${rule.autoCreateIncident}`,
      ),
    );
  }

  if (!rules.length) {
    console.log(line("  No escalation rules"));
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
