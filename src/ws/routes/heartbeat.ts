import { Router } from "express";
import type { Request, Response } from "express";
import {
  getHeartbeatEngineStatus,
  reloadHeartbeatEngine,
  runHeartbeatNow,
  updateAndReloadHeartbeat,
} from "../../functions/heartbeat-engine.js";
import { loadHeartbeatConfig } from "../../config/heartbeat.js";

const router: Router = Router();

router.get("/config", (req: Request, res: Response) => {
  res.json({ config: loadHeartbeatConfig() });
});

router.post("/config", (req: Request, res: Response) => {
  const payload: {
    enabled?: boolean;
    intervalMinutes?: number;
    provider?: "openai" | "claude" | "ollama";
    model?: string;
    prompt?: string;
  } = {};

  if (typeof req.body?.enabled === "boolean")
    payload.enabled = req.body.enabled;
  if (typeof req.body?.intervalMinutes === "number") {
    payload.intervalMinutes = req.body.intervalMinutes;
  }
  if (
    req.body?.provider === "openai" ||
    req.body?.provider === "claude" ||
    req.body?.provider === "ollama"
  ) {
    payload.provider = req.body.provider;
  }
  if (typeof req.body?.model === "string") payload.model = req.body.model;
  if (typeof req.body?.prompt === "string") payload.prompt = req.body.prompt;

  const result = updateAndReloadHeartbeat(payload);
  res.json(result);
});

router.get("/status", (req: Request, res: Response) => {
  res.json({ status: getHeartbeatEngineStatus() });
});

router.post("/run", async (req: Request, res: Response) => {
  const result = await runHeartbeatNow();
  res.json({ result, status: getHeartbeatEngineStatus() });
});

router.post("/reload", (req: Request, res: Response) => {
  res.json({ status: reloadHeartbeatEngine() });
});

export default router;
