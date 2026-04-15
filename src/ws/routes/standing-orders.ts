import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteStandingOrder,
  listStandingOrders,
  upsertStandingOrder,
  type StandingOrderScope,
} from "../../config/standing-orders.js";
import { buildStandingOrdersPrompt } from "../../functions/standing-orders.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ orders: listStandingOrders() });
});

router.post("/", (req: Request, res: Response) => {
  try {
    const scope: StandingOrderScope =
      req.body?.scope === "provider" ? "provider" : "global";

    const payload: {
      id?: string;
      title: string;
      content: string;
      enabled?: boolean;
      priority?: number;
      scope?: StandingOrderScope;
      provider?: "openai" | "claude" | "ollama";
    } = {
      title: typeof req.body?.title === "string" ? req.body.title : "",
      content: typeof req.body?.content === "string" ? req.body.content : "",
      enabled: typeof req.body?.enabled === "boolean" ? req.body.enabled : true,
      scope,
    };

    if (typeof req.body?.id === "string") payload.id = req.body.id;
    if (typeof req.body?.priority === "number")
      payload.priority = req.body.priority;
    if (
      req.body?.provider === "openai" ||
      req.body?.provider === "claude" ||
      req.body?.provider === "ollama"
    ) {
      payload.provider = req.body.provider;
    }

    const order = upsertStandingOrder(payload);
    res.json({ order });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({ error: "Missing standing order id" });
    return;
  }

  const deleted = deleteStandingOrder(id);
  if (!deleted) {
    res.status(404).json({ error: "Standing order not found" });
    return;
  }

  res.json({ success: true });
});

router.get("/preview/:provider", (req: Request, res: Response) => {
  const provider =
    req.params.provider === "openai" ||
    req.params.provider === "claude" ||
    req.params.provider === "ollama"
      ? req.params.provider
      : undefined;

  if (!provider) {
    res.status(400).json({ error: "Provider must be openai|claude|ollama" });
    return;
  }

  const prompt = buildStandingOrdersPrompt({ provider });
  res.json({ provider, prompt });
});

export default router;
