import { Router } from "express";
import type { Request, Response } from "express";
import { loadClaudeConfig } from "../../config/claude.js";
import {
  executeWithFailover,
  type ProviderExecutionResult,
} from "../../functions/failover.js";

const router: Router = Router();

const MAX_PROMPT_LENGTH = 20_000;
const MAX_MODEL_LENGTH = 256;

function isValidTextField(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function sendResult(res: Response, result: ProviderExecutionResult): void {
  if (result.success) {
    res.json({
      response: result.content,
      meta: {
        providerUsed: result.providerUsed,
        modelUsed: result.modelUsed,
        fallbackUsed: result.fallbackUsed,
      },
    });
    return;
  }

  res.status(result.error?.type === "rate-limit" ? 429 : 500).json({
    error: result.error?.message || "Claude request failed",
    meta: {
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
      fallbackUsed: result.fallbackUsed,
    },
  });
}

router.get("/status", async (req: Request, res: Response) => {
  try {
    const config = loadClaudeConfig();
    res.json({
      enabled: config.enabled || false,
      apiKey: config.apiKey ? "***configured***" : null,
      defaultModel: config.defaultModel || null,
    });
  } catch {
    res.status(500).json({
      error: "Failed to get Claude status",
    });
  }
});

router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { prompt, model } = req.body;

    if (!isValidTextField(prompt, MAX_PROMPT_LENGTH)) {
      res.status(400).json({
        error: "Missing or invalid field: prompt",
      });
      return;
    }

    if (
      model !== undefined &&
      (typeof model !== "string" ||
        model.trim().length === 0 ||
        model.length > MAX_MODEL_LENGTH)
    ) {
      res.status(400).json({
        error: "Invalid field: model",
      });
      return;
    }

    const config = loadClaudeConfig();

    if (!config.apiKey) {
      res.status(400).json({
        error:
          "Claude API key not configured. Use 'openokapi claude --setkey' first.",
      });
      return;
    }

    const resolvedModel =
      typeof model === "string" && model.trim().length > 0
        ? model.trim()
        : config.defaultModel || "claude-3-5-sonnet-20241022";

    const result = await executeWithFailover({
      provider: "claude",
      model: resolvedModel,
      prompt,
      historySource: "gateway",
      historyAction: "ask",
    });

    sendResult(res, result);
  } catch {
    res.status(500).json({
      error: "Failed to process Claude request",
    });
  }
});

router.post("/stream", async (req: Request, res: Response) => {
  try {
    const { prompt, model } = req.body;

    if (!isValidTextField(prompt, MAX_PROMPT_LENGTH)) {
      res.status(400).json({
        error: "Missing or invalid field: prompt",
      });
      return;
    }

    if (
      model !== undefined &&
      (typeof model !== "string" ||
        model.trim().length === 0 ||
        model.length > MAX_MODEL_LENGTH)
    ) {
      res.status(400).json({
        error: "Invalid field: model",
      });
      return;
    }

    const config = loadClaudeConfig();
    const resolvedModel =
      typeof model === "string" && model.trim().length > 0
        ? model.trim()
        : config.defaultModel || "claude-3-5-sonnet-20241022";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const result = await executeWithFailover({
      provider: "claude",
      model: resolvedModel,
      prompt,
      historySource: "gateway",
      historyAction: "stream",
    });

    if (!result.success || !result.content) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: result.error?.message || "Streaming failed" })}\n\n`,
      );
      res.end();
      return;
    }

    const words = result.content
      .split(/(\s+)/)
      .filter((chunk) => chunk.length > 0);
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ chunk: word })}\n\n`);
    }

    res.write(
      `event: done\ndata: ${JSON.stringify({ providerUsed: result.providerUsed, fallbackUsed: result.fallbackUsed, modelUsed: result.modelUsed })}\n\n`,
    );
    res.end();
  } catch {
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to stream Claude response",
      });
      return;
    }

    res.write(
      `event: error\ndata: ${JSON.stringify({ error: "Failed to stream Claude response" })}\n\n`,
    );
    res.end();
  }
});

export default router;
