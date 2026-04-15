import { Router } from "express";
import type { Request, Response } from "express";
import {
  clearRequestHistory,
  findRequestHistoryById,
  recordRequestHistory,
  readRequestHistory,
  summarizeRequestHistory,
} from "../../utils/request-history.js";
import { replayCachedResponse } from "../../utils/response-cache.js";

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

function getParamId(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
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

router.post("/replay/:id", (req: Request, res: Response) => {
  const historyId = getParamId(req.params.id);
  if (!historyId) {
    res.status(400).json({ error: "Missing history id" });
    return;
  }

  const entry = findRequestHistoryById(historyId);
  if (!entry || !entry.cacheKey) {
    res
      .status(404)
      .json({ error: "History entry not found or not replayable" });
    return;
  }

  const content = replayCachedResponse(entry.cacheKey);
  if (!content) {
    res.status(404).json({ error: "Cached response not found or expired" });
    return;
  }

  recordRequestHistory({
    provider: entry.provider,
    source: "gateway",
    action: "replay",
    model: entry.model,
    success: true,
    durationMs: 1,
    promptLength: entry.promptLength,
    responseLength: content.length,
    cacheHit: true,
    cacheKey: entry.cacheKey,
    promptTokens: entry.promptTokens,
    completionTokens: entry.completionTokens,
    totalTokens: entry.totalTokens,
    estimatedCostUsd: 0,
  });

  res.json({
    id: historyId,
    cacheKey: entry.cacheKey,
    response: content,
  });
});

export default router;
