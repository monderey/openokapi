import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteAutomationRule,
  listAutomationRules,
  upsertAutomationRule,
  type AutomationAction,
  type AutomationCondition,
} from "../../config/automations.js";
import { runAutomationRules } from "../../functions/automations.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ rules: listAutomationRules() });
});

router.post("/", (req: Request, res: Response) => {
  try {
    const conditions = Array.isArray(req.body?.conditions)
      ? (req.body.conditions as AutomationCondition[])
      : [];
    const actions = Array.isArray(req.body?.actions)
      ? (req.body.actions as AutomationAction[])
      : [];

    const payload: {
      id?: string;
      name: string;
      enabled?: boolean;
      event: string;
      conditions?: AutomationCondition[];
      actions: AutomationAction[];
    } = {
      name: typeof req.body?.name === "string" ? req.body.name : "",
      enabled: typeof req.body?.enabled === "boolean" ? req.body.enabled : true,
      event: typeof req.body?.event === "string" ? req.body.event : "",
      actions,
    };
    if (typeof req.body?.id === "string") payload.id = req.body.id;
    if (conditions.length) payload.conditions = conditions;

    const rule = upsertAutomationRule(payload);

    res.json({ rule });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({ error: "Missing automation id" });
    return;
  }

  const deleted = deleteAutomationRule(id);
  if (!deleted) {
    res.status(404).json({ error: "Automation not found" });
    return;
  }

  res.json({ success: true });
});

router.post("/simulate", async (req: Request, res: Response) => {
  const event = typeof req.body?.event === "string" ? req.body.event : "";
  const payload =
    req.body?.payload && typeof req.body.payload === "object"
      ? (req.body.payload as Record<string, unknown>)
      : {};

  if (!event) {
    res.status(400).json({ error: "Missing event" });
    return;
  }

  const results = await runAutomationRules({
    event,
    payload,
  });

  res.json({
    event,
    results,
  });
});

export default router;
