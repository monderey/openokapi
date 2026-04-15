import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteTaskFlow,
  listTaskFlows,
  resolveTaskFlow,
  upsertTaskFlow,
  type TaskFlowMode,
} from "../../config/task-flow.js";
import {
  cancelTaskFlow,
  getTaskFlowMaintenanceStatus,
  getTaskFlowStatus,
  runTaskFlowAudit,
  runTaskFlowMaintenance,
  runTaskFlow,
} from "../../functions/task-flow.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  const status =
    req.query.status === "idle" ||
    req.query.status === "running" ||
    req.query.status === "completed" ||
    req.query.status === "failed" ||
    req.query.status === "canceled"
      ? req.query.status
      : undefined;

  const enabled =
    req.query.enabled === "true"
      ? true
      : req.query.enabled === "false"
        ? false
        : undefined;

  const limit =
    typeof req.query.limit === "string"
      ? Number.parseInt(req.query.limit, 10)
      : undefined;

  res.json({
    flows: listTaskFlows({ status, enabled, limit } as any),
    status: getTaskFlowStatus(),
  });
});

router.get("/audit", (_req: Request, res: Response) => {
  const findings = runTaskFlowAudit();
  res.json({
    findings,
    summary: {
      total: findings.length,
      warn: findings.filter((finding) => finding.severity === "warn").length,
      error: findings.filter((finding) => finding.severity === "error").length,
    },
  });
});

router.post("/maintenance", (req: Request, res: Response) => {
  const body = req.body as {
    apply?: boolean;
    retentionDays?: number;
  };
  const result = runTaskFlowMaintenance({
    apply: body?.apply === true,
    retentionDays:
      typeof body?.retentionDays === "number" ? body.retentionDays : undefined,
  } as any);

  res.json({ result });
});

router.get("/maintenance/status", (_req: Request, res: Response) => {
  res.json({ status: getTaskFlowMaintenanceStatus() });
});

router.get("/:lookup", (req: Request, res: Response) => {
  const lookup = typeof req.params.lookup === "string" ? req.params.lookup : "";
  const flow = resolveTaskFlow(lookup);
  if (!flow) {
    res.status(404).json({ error: "Task flow not found" });
    return;
  }

  res.json({ flow });
});

router.post("/", (req: Request, res: Response) => {
  try {
    const mode: TaskFlowMode =
      req.body?.mode === "mirrored" ? "mirrored" : "managed";
    const steps = Array.isArray(req.body?.steps) ? req.body.steps : [];

    const payload: {
      id?: string;
      name: string;
      enabled?: boolean;
      mode?: TaskFlowMode;
      provider?: "openai" | "claude" | "ollama";
      model?: string;
      steps: Array<{ name: string; instruction: string }>;
    } = {
      name: typeof req.body?.name === "string" ? req.body.name : "",
      enabled: typeof req.body?.enabled === "boolean" ? req.body.enabled : true,
      mode,
      steps,
    };

    if (typeof req.body?.id === "string") payload.id = req.body.id;
    if (
      req.body?.provider === "openai" ||
      req.body?.provider === "claude" ||
      req.body?.provider === "ollama"
    ) {
      payload.provider = req.body.provider;
    }
    if (typeof req.body?.model === "string") payload.model = req.body.model;

    const flow = upsertTaskFlow(payload);
    res.json({ flow });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/:lookup/run", async (req: Request, res: Response) => {
  const lookup = typeof req.params.lookup === "string" ? req.params.lookup : "";
  const flow = resolveTaskFlow(lookup);
  if (!flow) {
    res.status(404).json({ error: "Task flow not found" });
    return;
  }

  const result = await runTaskFlow(flow.id);
  if (!result.found) {
    res.status(404).json({ error: "Task flow not found" });
    return;
  }

  res.json({ result });
});

router.post("/:lookup/cancel", (req: Request, res: Response) => {
  const lookup = typeof req.params.lookup === "string" ? req.params.lookup : "";
  const flow = resolveTaskFlow(lookup);
  if (!flow) {
    res.status(404).json({ error: "Task flow not found" });
    return;
  }

  const result = cancelTaskFlow(flow.id);
  if (!result.found) {
    res.status(404).json({ error: "Task flow not found" });
    return;
  }

  res.json({ result });
});

router.delete("/:lookup", (req: Request, res: Response) => {
  const lookup = typeof req.params.lookup === "string" ? req.params.lookup : "";
  const flow = resolveTaskFlow(lookup);
  if (!flow) {
    res.status(404).json({ error: "Task flow not found" });
    return;
  }

  const deleted = deleteTaskFlow(flow.id);
  if (!deleted) {
    res.status(404).json({ error: "Task flow not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
