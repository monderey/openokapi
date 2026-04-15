import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteEscalationRule,
  listEscalationRules,
  upsertEscalationRule,
  type EscalationSeverity,
  type EscalationTrigger,
} from "../../config/escalations.js";
import { runEscalationRules } from "../../functions/escalations.js";

const router: Router = Router();

function parseTrigger(value: unknown): EscalationTrigger | undefined {
  return value === "alerts.active" ||
    value === "alerts.error" ||
    value === "incident.created"
    ? value
    : undefined;
}

function parseSeverity(value: unknown): EscalationSeverity | undefined {
  return value === "warn" || value === "error" ? value : undefined;
}

router.get("/", (_req: Request, res: Response) => {
  res.json({ rules: listEscalationRules() });
});

router.post("/", (req: Request, res: Response) => {
  try {
    const trigger = parseTrigger(req.body?.trigger);
    if (!trigger) {
      res.status(400).json({ error: "Missing or invalid trigger" });
      return;
    }

    const rule = upsertEscalationRule({
      id: typeof req.body?.id === "string" ? req.body.id : undefined,
      name: typeof req.body?.name === "string" ? req.body.name : "",
      enabled:
        typeof req.body?.enabled === "boolean" ? req.body.enabled : undefined,
      trigger,
      minSeverity: parseSeverity(req.body?.minSeverity),
      minCount:
        typeof req.body?.minCount === "number" ? req.body.minCount : undefined,
      integrationEvent:
        typeof req.body?.integrationEvent === "string"
          ? req.body.integrationEvent
          : undefined,
      autoCreateIncident:
        typeof req.body?.autoCreateIncident === "boolean"
          ? req.body.autoCreateIncident
          : undefined,
      cooldownMinutes:
        typeof req.body?.cooldownMinutes === "number"
          ? req.body.cooldownMinutes
          : undefined,
    });

    res.json({ rule });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = req.params.id || "";
  const deleted = deleteEscalationRule(id);
  if (!deleted) {
    res.status(404).json({ error: "Escalation rule not found" });
    return;
  }

  res.json({ success: true });
});

router.post("/run", async (req: Request, res: Response) => {
  const force = req.body?.force === true;
  const reason =
    typeof req.body?.reason === "string" ? req.body.reason : undefined;
  const results = await runEscalationRules({ force, reason });

  res.json({
    results,
    summary: {
      total: results.length,
      triggered: results.filter((item) => item.triggered).length,
      failed: results.filter((item) => Boolean(item.error)).length,
    },
  });
});

export default router;
