import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteHook,
  listHooks,
  upsertHook,
  type HookAction,
  type HookCondition,
} from "../../config/hooks.js";
import { runHooksForEvent } from "../../functions/hooks.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ hooks: listHooks() });
});

router.post("/", (req: Request, res: Response) => {
  try {
    const conditions = Array.isArray(req.body?.conditions)
      ? (req.body.conditions as HookCondition[])
      : [];
    const actions = Array.isArray(req.body?.actions)
      ? (req.body.actions as HookAction[])
      : [];

    const payload: {
      id?: string;
      name: string;
      enabled?: boolean;
      event: string;
      conditions?: HookCondition[];
      actions: HookAction[];
    } = {
      name: typeof req.body?.name === "string" ? req.body.name : "",
      enabled: typeof req.body?.enabled === "boolean" ? req.body.enabled : true,
      event: typeof req.body?.event === "string" ? req.body.event : "",
      actions,
    };

    if (typeof req.body?.id === "string") {
      payload.id = req.body.id;
    }

    if (conditions.length) {
      payload.conditions = conditions;
    }

    const hook = upsertHook(payload);
    res.json({ hook });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({ error: "Missing hook id" });
    return;
  }

  const deleted = deleteHook(id);
  if (!deleted) {
    res.status(404).json({ error: "Hook not found" });
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

  const results = await runHooksForEvent({ event, payload });
  res.json({ event, results });
});

export default router;
