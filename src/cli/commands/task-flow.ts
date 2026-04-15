import chalk from "chalk";
import {
  deleteTaskFlow,
  listTaskFlows,
  upsertTaskFlow,
  type TaskFlowMode,
} from "../../config/task-flow.js";
import {
  cancelTaskFlow,
  getTaskFlowStatus,
  runTaskFlow,
} from "../../functions/task-flow.js";
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

export async function runTaskFlowCommand(commandArgs: string[]): Promise<void> {
  if (commandArgs.includes("--set")) {
    const id = getFlagValue(commandArgs, "--id");
    const name = getFlagValue(commandArgs, "--name") || "";
    const mode: TaskFlowMode =
      getFlagValue(commandArgs, "--mode") === "mirrored"
        ? "mirrored"
        : "managed";
    const provider = getFlagValue(commandArgs, "--provider");
    const model = getFlagValue(commandArgs, "--model");
    const steps = parseJson<Array<{ name: string; instruction: string }>>(
      getFlagValue(commandArgs, "--steps"),
      [],
    );

    const payload: {
      id?: string;
      name: string;
      enabled?: boolean;
      mode?: TaskFlowMode;
      provider?: "openai" | "claude" | "ollama";
      model?: string;
      steps: Array<{ name: string; instruction: string }>;
    } = {
      name,
      enabled: getFlagValue(commandArgs, "--enabled") !== "false",
      mode,
      steps,
    };

    if (id) payload.id = id;
    if (
      provider === "openai" ||
      provider === "claude" ||
      provider === "ollama"
    ) {
      payload.provider = provider;
    }
    if (model) payload.model = model;

    upsertTaskFlow(payload);
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) throw new Error("Use --delete --id <flow-id>");
    deleteTaskFlow(id);
  }

  if (commandArgs.includes("--run")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) throw new Error("Use --run --id <flow-id>");
    await runTaskFlow(id);
  }

  if (commandArgs.includes("--cancel")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) throw new Error("Use --cancel --id <flow-id>");
    cancelTaskFlow(id);
  }

  const flows = listTaskFlows();
  const status = getTaskFlowStatus();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Task Flow"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Total: ${chalk.cyan(String(status.total))} idle:${status.idle} running:${status.running} completed:${status.completed} failed:${status.failed} canceled:${status.canceled}`,
    ),
  );
  console.log(line(""));
  for (const flow of flows) {
    console.log(
      line(
        `  ${flow.enabled ? chalk.green("✓") : chalk.red("✗")} ${flow.id} r${flow.revision} ${flow.name} mode:${flow.mode} provider:${flow.provider} status:${flow.status} steps:${flow.steps.length}`,
      ),
    );
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
