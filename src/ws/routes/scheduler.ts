import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteSchedulerJob,
  listSchedulerJobs,
  upsertSchedulerJob,
  type SchedulerTaskType,
} from "../../config/scheduler.js";
import {
  getSchedulerEngineStatus,
  reloadSchedulerEngine,
  runSchedulerJobNow,
} from "../../functions/scheduler-engine.js";

const router: Router = Router();

function parseTaskType(value: unknown): SchedulerTaskType | undefined {
  return value === "prompt" || value === "profile" ? value : undefined;
}

router.get("/jobs", (req: Request, res: Response) => {
  res.json({ jobs: listSchedulerJobs() });
});

router.post("/jobs", (req: Request, res: Response) => {
  try {
    const taskType = parseTaskType(req.body?.taskType);
    if (!taskType) {
      res.status(400).json({ error: "taskType must be prompt or profile" });
      return;
    }

    const variables =
      req.body?.variables && typeof req.body.variables === "object"
        ? Object.fromEntries(
            Object.entries(req.body.variables as Record<string, unknown>).map(
              ([key, value]) => [key, String(value)],
            ),
          )
        : undefined;

    const payload: {
      id?: string;
      name: string;
      enabled?: boolean;
      cron: string;
      scheduleKind?: "cron" | "every" | "at";
      everyMs?: number;
      at?: string;
      timezone?: string;
      deleteAfterRun?: boolean;
      taskType: SchedulerTaskType;
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
      name: typeof req.body?.name === "string" ? req.body.name : "",
      enabled: typeof req.body?.enabled === "boolean" ? req.body.enabled : true,
      cron: typeof req.body?.cron === "string" ? req.body.cron : "",
      taskType,
    };

    if (typeof req.body?.id === "string") payload.id = req.body.id;
    if (
      req.body?.scheduleKind === "cron" ||
      req.body?.scheduleKind === "every" ||
      req.body?.scheduleKind === "at"
    ) {
      payload.scheduleKind = req.body.scheduleKind;
    }
    if (typeof req.body?.everyMs === "number")
      payload.everyMs = req.body.everyMs;
    if (typeof req.body?.at === "string") payload.at = req.body.at;
    if (typeof req.body?.timezone === "string")
      payload.timezone = req.body.timezone;
    if (typeof req.body?.deleteAfterRun === "boolean") {
      payload.deleteAfterRun = req.body.deleteAfterRun;
    }
    if (
      req.body?.provider === "openai" ||
      req.body?.provider === "claude" ||
      req.body?.provider === "ollama"
    ) {
      payload.provider = req.body.provider;
    }
    if (typeof req.body?.model === "string") payload.model = req.body.model;
    if (typeof req.body?.prompt === "string") payload.prompt = req.body.prompt;
    if (typeof req.body?.profileName === "string") {
      payload.profileName = req.body.profileName;
    }
    if (typeof req.body?.profileInput === "string") {
      payload.profileInput = req.body.profileInput;
    }
    if (variables) payload.variables = variables;
    if (typeof req.body?.temperature === "number") {
      payload.temperature = req.body.temperature;
    }
    if (typeof req.body?.maxTokens === "number") {
      payload.maxTokens = req.body.maxTokens;
    }
    if (typeof req.body?.system === "string") payload.system = req.body.system;

    const job = upsertSchedulerJob(payload);

    const status = reloadSchedulerEngine();
    res.json({ job, status });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.delete("/jobs/:id", (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({ error: "Missing job id" });
    return;
  }

  const deleted = deleteSchedulerJob(id);
  if (!deleted) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const status = reloadSchedulerEngine();
  res.json({ success: true, status });
});

router.post("/jobs/:id/run", async (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({ error: "Missing job id" });
    return;
  }

  const result = await runSchedulerJobNow(id);
  if (!result.found) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({ result });
});

router.post("/reload", (req: Request, res: Response) => {
  res.json({ status: reloadSchedulerEngine() });
});

router.get("/status", (req: Request, res: Response) => {
  res.json({ status: getSchedulerEngineStatus() });
});

export default router;
