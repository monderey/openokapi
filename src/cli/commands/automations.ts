import chalk from "chalk";
import {
  deleteAutomationRule,
  listAutomationRules,
  upsertAutomationRule,
  type AutomationAction,
  type AutomationCondition,
} from "../../config/automations.js";
import { runAutomationRules } from "../../functions/automations.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function runAutomations(commandArgs: string[]): Promise<void> {
  if (commandArgs.includes("--set")) {
    const id = getFlagValue(commandArgs, "--id");
    const name = getFlagValue(commandArgs, "--name") || "";
    const event = getFlagValue(commandArgs, "--event") || "";
    const conditions = parseJson<AutomationCondition[]>(
      getFlagValue(commandArgs, "--conditions"),
      [],
    );
    const actions = parseJson<AutomationAction[]>(
      getFlagValue(commandArgs, "--actions"),
      [],
    );

    const payload: {
      id?: string;
      name: string;
      enabled?: boolean;
      event: string;
      conditions?: AutomationCondition[];
      actions: AutomationAction[];
    } = {
      name,
      enabled: getFlagValue(commandArgs, "--enabled") !== "false",
      event,
      actions,
    };
    if (id) {
      payload.id = id;
    }
    if (conditions.length) {
      payload.conditions = conditions;
    }

    upsertAutomationRule(payload);
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) throw new Error("Use --delete --id <automation-id>");
    deleteAutomationRule(id);
  }

  if (commandArgs.includes("--simulate")) {
    const event = getFlagValue(commandArgs, "--event") || "";
    if (!event) throw new Error("Use --simulate --event <event-name>");
    const payload = parseJson<Record<string, unknown>>(
      getFlagValue(commandArgs, "--payload"),
      {},
    );
    const output = await runAutomationRules({ event, payload });
    console.log(output);
  }

  const rules = listAutomationRules();
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Automations"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Count: ${chalk.cyan(String(rules.length))}`));
  console.log(line(""));
  for (const rule of rules) {
    console.log(
      line(
        `  ${rule.enabled ? chalk.green("✓") : chalk.red("✗")} ${rule.id} ${rule.name} event:${rule.event} conditions:${rule.conditions.length} actions:${rule.actions.length}`,
      ),
    );
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
