import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteIntegration,
  listIntegrations,
  upsertIntegration,
  type IntegrationType,
} from "../../config/integrations.js";
import {
  clearIntegrationDeadLetters,
  deleteIntegrationDeadLetter,
  dispatchIntegrationEvent,
  listIntegrationDeadLetters,
  retryIntegrationDeadLetter,
} from "../../functions/integrations-dispatch.js";

const router: Router = Router();

function parseType(value: unknown): IntegrationType | undefined {
  return value === "webhook" ||
    value === "slack" ||
    value === "telegram" ||
    value === "discord" ||
    value === "github" ||
    value === "gitlab" ||
    value === "jira" ||
    value === "linear" ||
    value === "notion" ||
    value === "teams" ||
    value === "pagerduty"
    ? value
    : undefined;
}

router.get("/", (req: Request, res: Response) => {
  res.json({ integrations: listIntegrations() });
});

router.post("/", (req: Request, res: Response) => {
  const type = parseType(req.body?.type);
  const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
  if (!type || !id) {
    res.status(400).json({ error: "Required: id, type" });
    return;
  }

  const payload: {
    id: string;
    type: IntegrationType;
    enabled?: boolean;
    endpoint?: string;
    token?: string;
    secret?: string;
    headers?: Record<string, string>;
    channel?: string;
    events?: string[];
    timeoutMs?: number;
    retries?: number;
    retryBackoffMs?: number;
    maxPayloadBytes?: number;
    deadLetterEnabled?: boolean;
  } = {
    id,
    type,
    enabled: req.body?.enabled !== false,
  };

  if (typeof req.body?.endpoint === "string")
    payload.endpoint = req.body.endpoint;
  if (typeof req.body?.token === "string") payload.token = req.body.token;
  if (typeof req.body?.secret === "string") payload.secret = req.body.secret;
  if (req.body?.headers && typeof req.body.headers === "object") {
    payload.headers = req.body.headers as Record<string, string>;
  }
  if (typeof req.body?.channel === "string") payload.channel = req.body.channel;
  if (Array.isArray(req.body?.events)) payload.events = req.body.events;
  if (typeof req.body?.timeoutMs === "number")
    payload.timeoutMs = req.body.timeoutMs;
  if (typeof req.body?.retries === "number") payload.retries = req.body.retries;
  if (typeof req.body?.retryBackoffMs === "number") {
    payload.retryBackoffMs = req.body.retryBackoffMs;
  }
  if (typeof req.body?.maxPayloadBytes === "number") {
    payload.maxPayloadBytes = req.body.maxPayloadBytes;
  }
  if (typeof req.body?.deadLetterEnabled === "boolean") {
    payload.deadLetterEnabled = req.body.deadLetterEnabled;
  }

  try {
    const integration = upsertIntegration(payload);
    res.json({ integration });
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Failed to upsert integration",
    });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  const deleted = deleteIntegration(id);
  if (!deleted) {
    res.status(404).json({ error: "Integration not found" });
    return;
  }

  res.json({ success: true });
});

router.post("/dispatch", async (req: Request, res: Response) => {
  const event = typeof req.body?.event === "string" ? req.body.event : "";
  const payload =
    req.body?.payload && typeof req.body.payload === "object"
      ? (req.body.payload as Record<string, unknown>)
      : {};

  if (!event) {
    res.status(400).json({ error: "Required: event" });
    return;
  }

  const results = await dispatchIntegrationEvent({ event, payload });
  res.json({ results });
});

router.get("/dlq", (req: Request, res: Response) => {
  const limit =
    typeof req.query.limit === "string"
      ? Number.parseInt(req.query.limit, 10)
      : 100;
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(1000, limit))
    : 100;
  res.json({ entries: listIntegrationDeadLetters(safeLimit) });
});

router.post("/dlq/:id/retry", async (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({ error: "Missing dead-letter id" });
    return;
  }

  const output = await retryIntegrationDeadLetter(id);
  if (!output.found) {
    res.status(404).json({ error: "Dead-letter entry not found" });
    return;
  }

  res.json(output);
});

router.delete("/dlq/:id", (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({ error: "Missing dead-letter id" });
    return;
  }

  const deleted = deleteIntegrationDeadLetter(id);
  if (!deleted) {
    res.status(404).json({ error: "Dead-letter entry not found" });
    return;
  }

  res.json({ success: true });
});

router.delete("/dlq", (req: Request, res: Response) => {
  clearIntegrationDeadLetters();
  res.json({ success: true });
});

export default router;
