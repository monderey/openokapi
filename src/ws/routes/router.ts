import { Router } from "express";
import type { Request, Response } from "express";
import {
  loadRouterPolicy,
  updateRouterPolicy,
} from "../../config/router-policy.js";
import {
  executeWithSmartRouting,
  explainRoutingDecision,
  selectProviderByPolicy,
} from "../../functions/smart-router.js";

const router: Router = Router();

router.get("/policy", (req: Request, res: Response) => {
  res.json({ policy: loadRouterPolicy() });
});

router.post("/policy", (req: Request, res: Response) => {
  const updated = updateRouterPolicy({
    strategy: req.body?.strategy,
    enabledProviders: req.body?.enabledProviders,
    preferredModels: req.body?.preferredModels,
    maxLatencyMs: req.body?.maxLatencyMs,
    maxCostUsdPerRequest: req.body?.maxCostUsdPerRequest,
  });
  res.json({ policy: updated });
});

router.get("/pick", (req: Request, res: Response) => {
  res.json({ provider: selectProviderByPolicy() });
});

router.get("/explain", (req: Request, res: Response) => {
  res.json({ explanation: explainRoutingDecision() });
});

router.post("/execute", async (req: Request, res: Response) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  if (!prompt.trim()) {
    res.status(400).json({ error: "Missing required field: prompt" });
    return;
  }

  const result = await executeWithSmartRouting({
    prompt,
    model: typeof req.body?.model === "string" ? req.body.model : undefined,
    temperature:
      typeof req.body?.temperature === "number"
        ? req.body.temperature
        : undefined,
    maxTokens:
      typeof req.body?.maxTokens === "number" ? req.body.maxTokens : undefined,
    system: typeof req.body?.system === "string" ? req.body.system : undefined,
    historySource: "gateway",
    historyAction: "ask",
  });

  res.json({ result });
});

export default router;
