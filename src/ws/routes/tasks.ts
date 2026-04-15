import { Router } from "express";
import type { Request, Response } from "express";
import {
  cancelBackgroundTask,
  getBackgroundTask,
  getTaskLedgerMaintenanceStatus,
  getTaskLedgerStats,
  listBackgroundTasks,
  runTaskLedgerAudit,
  runTaskLedgerMaintenance,
  updateBackgroundTaskNotifyPolicy,
} from "../../functions/tasks-ledger.js";
import { listTaskFlows, resolveTaskFlow } from "../../config/task-flow.js";
import {
  cancelTaskFlow,
  getTaskFlowMaintenanceStatus,
  getTaskFlowStatus,
  runTaskFlow,
  runTaskFlowAudit,
  runTaskFlowMaintenance,
} from "../../functions/task-flow.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  const limit =
    typeof req.query.limit === "string"
      ? Number.parseInt(req.query.limit, 10)
      : 100;

  const status =
    req.query.status === "queued" ||
    req.query.status === "running" ||
    req.query.status === "completed" ||
    req.query.status === "failed" ||
    req.query.status === "canceled"
      ? req.query.status
      : undefined;

  const kind =
    req.query.kind === "scheduler" ||
    req.query.kind === "task-flow" ||
    req.query.kind === "heartbeat" ||
    req.query.kind === "manual"
      ? req.query.kind
      : undefined;

  const notifyPolicy =
    req.query.notifyPolicy === "done_only" ||
    req.query.notifyPolicy === "state_changes" ||
    req.query.notifyPolicy === "silent"
      ? req.query.notifyPolicy
      : undefined;

  const json = req.query.json === "1" || req.query.json === "true";

  const tasks = listBackgroundTasks(
    {
      limit,
      status,
      kind,
      notifyPolicy,
    } as any,
  );

  if (json) {
    res.json({
      tasks,
      stats: getTaskLedgerStats(),
      filters: {
        limit,
        status,
        kind,
        notifyPolicy,
      },
    });
    return;
  }

  res.json({
    tasks,
    stats: getTaskLedgerStats(),
  });
});

router.get("/audit", (_req: Request, res: Response) => {
  const findings = runTaskLedgerAudit();
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

  const result = runTaskLedgerMaintenance(
    {
      apply: body?.apply === true,
      retentionDays:
        typeof body?.retentionDays === "number"
          ? body.retentionDays
          : undefined,
    } as any,
  );

  res.json({ result });
});

router.get("/maintenance/status", (_req: Request, res: Response) => {
  res.json({ status: getTaskLedgerMaintenanceStatus() });
});

router.get("/flow", (req: Request, res: Response) => {
  const status =
    req.query.status === "idle" ||
    req.query.status === "running" ||
    req.query.status === "completed" ||
    req.query.status === "failed" ||
    req.query.status === "canceled"
      ? req.query.status
      : undefined;

  const limit =
    typeof req.query.limit === "string"
      ? Number.parseInt(req.query.limit, 10)
      : undefined;

  const enabled =
    req.query.enabled === "true"
      ? true
      : req.query.enabled === "false"
        ? false
        : undefined;

  res.json({
    flows: listTaskFlows({ status, enabled, limit } as any),
    status: getTaskFlowStatus(),
  });
});

router.get("/flow/audit", (_req: Request, res: Response) => {
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

router.post("/flow/maintenance", (req: Request, res: Response) => {
  const body = req.body as {
    apply?: boolean;
    retentionDays?: number;
  };
  const result = runTaskFlowMaintenance(
    {
      apply: body?.apply === true,
      retentionDays:
        typeof body?.retentionDays === "number"
          ? body.retentionDays
          : undefined,
    } as any,
  );

  res.json({ result });
});

router.get("/flow/maintenance/status", (_req: Request, res: Response) => {
  res.json({ status: getTaskFlowMaintenanceStatus() });
});

router.get("/flow/:lookup", (req: Request, res: Response) => {
  const lookup = typeof req.params.lookup === "string" ? req.params.lookup : "";
  const flow = resolveTaskFlow(lookup);
  if (!flow) {
    res.status(404).json({ error: "Task flow not found" });
    return;
  }

  res.json({ flow });
});

router.post("/flow/:lookup/run", async (req: Request, res: Response) => {
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

router.post("/flow/:lookup/cancel", (req: Request, res: Response) => {
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

router.get("/:lookup", (req: Request, res: Response) => {
  const lookup = typeof req.params.lookup === "string" ? req.params.lookup : "";
  if (!lookup) {
    res.status(400).json({ error: "Missing task lookup" });
    return;
  }

  const task = getBackgroundTask(lookup);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({ task });
});

router.post("/:lookup/cancel", (req: Request, res: Response) => {
  const lookup = typeof req.params.lookup === "string" ? req.params.lookup : "";
  if (!lookup) {
    res.status(400).json({ error: "Missing task lookup" });
    return;
  }

  const task = cancelBackgroundTask(lookup);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({ task });
});

router.post("/:lookup/notify", (req: Request, res: Response) => {
  const lookup = typeof req.params.lookup === "string" ? req.params.lookup : "";
  if (!lookup) {
    res.status(400).json({ error: "Missing task lookup" });
    return;
  }

  const body = req.body as { policy?: unknown };
  const policy =
    body?.policy === "done_only" ||
    body?.policy === "state_changes" ||
    body?.policy === "silent"
      ? body.policy
      : undefined;

  if (!policy) {
    res.status(400).json({
      error: "Invalid policy. Use done_only, state_changes, or silent",
    });
    return;
  }

  const task = updateBackgroundTaskNotifyPolicy(lookup, policy);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({ task });
});

export default router;
