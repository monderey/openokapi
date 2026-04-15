import { Router } from "express";
import type { Request, Response } from "express";
import { loadBudgetConfig, updateBudgetConfig } from "../../config/budget.js";
import {
  evaluateBudgetRequest,
  getBudgetStatus,
} from "../../functions/budget-enforcer.js";

const router: Router = Router();

router.get("/config", (req: Request, res: Response) => {
  res.json({ config: loadBudgetConfig() });
});

router.post("/config", (req: Request, res: Response) => {
  const updated = updateBudgetConfig({
    enabled:
      typeof req.body?.enabled === "boolean" ? req.body.enabled : undefined,
    dailyUsdLimit:
      typeof req.body?.dailyUsdLimit === "number"
        ? req.body.dailyUsdLimit
        : undefined,
    monthlyUsdLimit:
      typeof req.body?.monthlyUsdLimit === "number"
        ? req.body.monthlyUsdLimit
        : undefined,
    perRequestUsdLimit:
      typeof req.body?.perRequestUsdLimit === "number"
        ? req.body.perRequestUsdLimit
        : undefined,
    alertThresholdRatio:
      typeof req.body?.alertThresholdRatio === "number"
        ? req.body.alertThresholdRatio
        : undefined,
  });
  res.json({ config: updated });
});

router.get("/status", (req: Request, res: Response) => {
  res.json({ status: getBudgetStatus() });
});

router.post("/preflight", (req: Request, res: Response) => {
  const estimatedCostUsd =
    typeof req.body?.estimatedCostUsd === "number"
      ? req.body.estimatedCostUsd
      : 0;
  const decision = evaluateBudgetRequest({ estimatedCostUsd });
  res.json({ decision });
});

export default router;
