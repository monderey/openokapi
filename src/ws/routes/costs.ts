import { Router } from "express";
import type { Request, Response } from "express";
import {
  filterRequestHistoryByDays,
  readRequestHistory,
} from "../../utils/request-history.js";
import { summarizeCosts } from "../../utils/costs.js";

const router: Router = Router();

function parseDays(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

router.get("/summary", (req: Request, res: Response) => {
  const days = parseDays(req.query.days);
  let entries = readRequestHistory(10_000);

  if (days) {
    entries = filterRequestHistoryByDays(entries, days);
  }

  res.json({ summary: summarizeCosts(entries) });
});

export default router;
