import chalk from "chalk";
import {
  deleteHook,
  listHooks,
  upsertHook,
  type HookAction,
  type HookCondition,
} from "../../config/hooks.js";
import { runHooksForEvent } from "../../functions/hooks.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) {
    return undefined;
  }
  const value = args[i + 1];
  if (!value || value.startsWith("--")) {
    return undefined;
  }
  return value;
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function runHooks(commandArgs: string[]): Promise<void> {
  if (commandArgs.includes("--set")) {
    const id = getFlagValue(commandArgs, "--id");
    const name = getFlagValue(commandArgs, "--name") || "";
    const event = getFlagValue(commandArgs, "--event") || "";
    const conditions = parseJson<HookCondition[]>(
      getFlagValue(commandArgs, "--conditions"),
      [],
    );
    const actions = parseJson<HookAction[]>(
      getFlagValue(commandArgs, "--actions"),
      [],
    );

    const payload: {
      id?: string;
      name: string;
      enabled?: boolean;
      event: string;
      conditions?: HookCondition[];
      actions: HookAction[];
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

    upsertHook(payload);
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) {
      throw new Error("Use --delete --id <hook-id>");
    }
    deleteHook(id);
  }

  if (commandArgs.includes("--simulate")) {
    const event = getFlagValue(commandArgs, "--event") || "";
    if (!event) {
      throw new Error("Use --simulate --event <event-name>");
    }

    const payload = parseJson<Record<string, unknown>>(
      getFlagValue(commandArgs, "--payload"),
      {},
    );

    const output = await runHooksForEvent({ event, payload });
    console.log(output);
  }

  const hooks = listHooks();
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Hooks"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Count: ${chalk.cyan(String(hooks.length))}`));
  console.log(line(""));
  for (const hook of hooks) {
    console.log(
      line(
        `  ${hook.enabled ? chalk.green("✓") : chalk.red("✗")} ${hook.id} ${hook.name} event:${hook.event} conditions:${hook.conditions.length} actions:${hook.actions.length}`,
      ),
    );
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
