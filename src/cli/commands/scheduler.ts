import chalk from "chalk";
import {
  deleteSchedulerJob,
  listSchedulerJobs,
  upsertSchedulerJob,
} from "../../config/scheduler.js";
import {
  getSchedulerEngineStatus,
  reloadSchedulerEngine,
  runSchedulerJobNow,
} from "../../functions/scheduler-engine.js";
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

export async function runScheduler(commandArgs: string[]): Promise<void> {
  if (commandArgs.includes("--set")) {
    const taskType = getFlagValue(commandArgs, "--task-type");
    if (taskType !== "prompt" && taskType !== "profile") {
      throw new Error("Use --set --task-type <prompt|profile>");
    }

    const input: {
      id?: string;
      name: string;
      enabled?: boolean;
      cron: string;
      scheduleKind?: "cron" | "every" | "at";
      everyMs?: number;
      at?: string;
      timezone?: string;
      deleteAfterRun?: boolean;
      taskType: "prompt" | "profile";
      provider?: "openai" | "claude" | "ollama";
      model?: string;
      prompt?: string;
      profileName?: string;
      profileInput?: string;
      variables?: Record<string, string>;
      temperature?: number;
      maxTokens?: number;
      system?: string;
    } = {
      name: getFlagValue(commandArgs, "--name") || "",
      enabled: getFlagValue(commandArgs, "--enabled") !== "false",
      cron: getFlagValue(commandArgs, "--cron") || "",
      taskType,
    };

    const id = getFlagValue(commandArgs, "--id");
    if (id) input.id = id;
    const scheduleKind = getFlagValue(commandArgs, "--schedule");
    if (
      scheduleKind === "cron" ||
      scheduleKind === "every" ||
      scheduleKind === "at"
    ) {
      input.scheduleKind = scheduleKind;
    }
    const everyMsRaw = Number(getFlagValue(commandArgs, "--every-ms") || "");
    if (Number.isFinite(everyMsRaw)) input.everyMs = everyMsRaw;
    const at = getFlagValue(commandArgs, "--at");
    if (at) input.at = at;
    const timezone = getFlagValue(commandArgs, "--timezone");
    if (timezone) input.timezone = timezone;
    const deleteAfterRun = getFlagValue(commandArgs, "--delete-after-run");
    if (deleteAfterRun === "true" || deleteAfterRun === "false") {
      input.deleteAfterRun = deleteAfterRun === "true";
    }

    const provider = getFlagValue(commandArgs, "--provider");
    if (
      provider === "openai" ||
      provider === "claude" ||
      provider === "ollama"
    ) {
      input.provider = provider;
    }
    const model = getFlagValue(commandArgs, "--model");
    if (model) input.model = model;
    const prompt = getFlagValue(commandArgs, "--prompt");
    if (prompt) input.prompt = prompt;
    const profileName = getFlagValue(commandArgs, "--profile");
    if (profileName) input.profileName = profileName;
    const profileInput = getFlagValue(commandArgs, "--input");
    if (profileInput) input.profileInput = profileInput;
    const variables = parseJson<Record<string, string>>(
      getFlagValue(commandArgs, "--vars"),
      {},
    );
    if (Object.keys(variables).length) input.variables = variables;

    const temperatureRaw = Number(
      getFlagValue(commandArgs, "--temperature") || "",
    );
    if (Number.isFinite(temperatureRaw)) input.temperature = temperatureRaw;
    const maxTokensRaw = Number(
      getFlagValue(commandArgs, "--max-tokens") || "",
    );
    if (Number.isFinite(maxTokensRaw)) input.maxTokens = maxTokensRaw;
    const system = getFlagValue(commandArgs, "--system");
    if (system) input.system = system;

    upsertSchedulerJob(input);
    reloadSchedulerEngine();
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) throw new Error("Use --delete --id <job-id>");
    deleteSchedulerJob(id);
    reloadSchedulerEngine();
  }

  if (commandArgs.includes("--run")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) throw new Error("Use --run --id <job-id>");
    await runSchedulerJobNow(id);
  }

  if (commandArgs.includes("--reload")) {
    reloadSchedulerEngine();
  }

  const jobs = listSchedulerJobs();
  const status = getSchedulerEngineStatus();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Scheduler"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Engine: ${status.started ? chalk.green("started") : chalk.red("stopped")} cron:${status.scheduledJobs} every:${status.intervalJobs} at:${status.timeoutJobs}`,
    ),
  );
  console.log(line(`  Jobs: ${chalk.cyan(String(jobs.length))}`));
  console.log(line(""));
  for (const job of jobs) {
    console.log(
      line(
        `  ${job.enabled ? chalk.green("✓") : chalk.red("✗")} ${job.id} ${job.name} type:${job.taskType} cron:${job.cron}`,
      ),
    );
    if (job.scheduleKind === "every") {
      console.log(line(`    schedule: every ${job.everyMs}ms`));
    } else if (job.scheduleKind === "at") {
      console.log(
        line(
          `    schedule: at ${job.at}${job.deleteAfterRun ? " (delete-after-run)" : ""}`,
        ),
      );
    } else {
      console.log(line(`    schedule: cron ${job.cron}`));
    }
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
