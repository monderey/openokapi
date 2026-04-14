import { Router } from "express";
import type { Request, Response } from "express";
import {
  clearRequestHistory,
  readRequestHistory,
  summarizeRequestHistory,
} from "../../utils/request-history.js";

const router: Router = Router();

function parseLimit(value: unknown, fallback = 50): number {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, 100);
}

function getTextQuery(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

router.get("/summary", (req: Request, res: Response) => {
  const entries = readRequestHistory(parseLimit(req.query.limit, 1000));
  res.json({
    summary: summarizeRequestHistory(entries),
  });
});

router.get("/recent", (req: Request, res: Response) => {
  const limit = parseLimit(req.query.limit, 50);
  const provider = getTextQuery(req.query.provider);
  const source = getTextQuery(req.query.source);
  const action = getTextQuery(req.query.action);

  let entries = readRequestHistory(1000);

  if (provider) {
    entries = entries.filter((entry) => entry.provider === provider);
  }

  if (source) {
    entries = entries.filter((entry) => entry.source === source);
  }

  if (action) {
    entries = entries.filter((entry) => entry.action === action);
  }

  res.json({
    entries: entries.slice(0, limit),
    summary: summarizeRequestHistory(entries),
  });
});

router.delete("/", (req: Request, res: Response) => {
  clearRequestHistory();
  res.json({
    success: true,
    message: "Request history cleared",
  });
});

export default router;
