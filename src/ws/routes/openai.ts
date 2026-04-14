import { Router } from "express";
import type { Request, Response } from "express";
import { loadOpenAIConfig } from "../../config/openai.js";
import { loadAppConfig } from "../../config/app.js";
import {
  executeWithFailover,
  type ProviderExecutionResult,
} from "../../functions/failover.js";
import {
  parseOpenAIError,
  streamOpenAIRequest,
} from "../../functions/openai-request.js";

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
    error: result.error?.message || "OpenAI request failed",
    meta: {
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
      fallbackUsed: result.fallbackUsed,
    },
  });
}

router.get("/status", async (req: Request, res: Response) => {
  try {
    const config = loadOpenAIConfig();
    res.json({
      enabled: config.enabled || false,
      apiKey: config.apiKey ? "***configured***" : null,
      defaultModel: config.defaultModel || null,
    });
  } catch {
    res.status(500).json({
      error: "Failed to get OpenAI status",
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

    const config = loadOpenAIConfig();

    if (!config.apiKey) {
      res.status(400).json({
        error:
          "OpenAI API key not configured. Use 'openokapi openai --setkey' first.",
      });
      return;
    }

    const result = await executeWithFailover({
      provider: "openai",
      model:
        typeof model === "string" && model.trim().length > 0
          ? model.trim()
          : config.defaultModel || "gpt-3.5-turbo",
      prompt,
      historySource: "gateway",
      historyAction: "ask",
    });

    sendResult(res, result);
  } catch {
    res.status(500).json({
      error: "Failed to process OpenAI request",
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

    const config = loadOpenAIConfig();
    const resolvedModel =
      typeof model === "string" && model.trim().length > 0
        ? model.trim()
        : config.defaultModel || "gpt-3.5-turbo";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const streamResult = await streamOpenAIRequest({
      model: resolvedModel,
      prompt,
      history: {
        source: "gateway",
        action: "stream",
      },
    });

    if (!streamResult.success || !streamResult.stream) {
      const appConfig = loadAppConfig();
      if (
        appConfig.fallbackProvider &&
        appConfig.fallbackProvider !== "openai"
      ) {
        const fallback = await executeWithFailover({
          provider: "openai",
          prompt,
          model: resolvedModel,
          historySource: "gateway",
          historyAction: "stream",
        });

        if (fallback.success) {
          res.write(
            `data: ${JSON.stringify({ chunk: fallback.content || "" })}\n\n`,
          );
          res.write(
            `event: done\ndata: ${JSON.stringify({ providerUsed: fallback.providerUsed, fallbackUsed: fallback.fallbackUsed })}\n\n`,
          );
          res.end();
          return;
        }
      }

      res.write(
        `event: error\ndata: ${JSON.stringify({ error: streamResult.error?.message || "Streaming failed" })}\n\n`,
      );
      res.end();
      return;
    }

    let hasStreamedChunk = false;

    try {
      for await (const chunk of streamResult.stream) {
        hasStreamedChunk = true;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write(
        `event: done\ndata: ${JSON.stringify({ providerUsed: "openai", fallbackUsed: false, modelUsed: resolvedModel })}\n\n`,
      );
      res.end();
      return;
    } catch (streamError) {
      const parsedStreamError = parseOpenAIError(streamError);
      const appConfig = loadAppConfig();

      if (
        !hasStreamedChunk &&
        appConfig.fallbackProvider &&
        appConfig.fallbackProvider !== "openai"
      ) {
        const fallback = await executeWithFailover({
          provider: "openai",
          prompt,
          model: resolvedModel,
          historySource: "gateway",
          historyAction: "stream",
        });

        if (fallback.success) {
          res.write(
            `data: ${JSON.stringify({ chunk: fallback.content || "" })}\n\n`,
          );
          res.write(
            `event: done\ndata: ${JSON.stringify({ providerUsed: fallback.providerUsed, fallbackUsed: fallback.fallbackUsed, modelUsed: fallback.modelUsed })}\n\n`,
          );
          res.end();
          return;
        }
      }

      if (!res.headersSent) {
        res
          .status(parsedStreamError.error?.type === "rate-limit" ? 429 : 500)
          .json({
            error:
              parsedStreamError.error?.message ||
              "Failed to stream OpenAI response",
          });
        return;
      }

      res.write(
        `event: error\ndata: ${JSON.stringify({ error: parsedStreamError.error?.message || "Failed to stream OpenAI response" })}\n\n`,
      );
      res.end();
      return;
    }
  } catch (error) {
    const parsedError = parseOpenAIError(error);

    if (!res.headersSent) {
      res.status(parsedError.error?.type === "rate-limit" ? 429 : 500).json({
        error: parsedError.error?.message || "Failed to stream OpenAI response",
      });
      return;
    }

    res.write(
      `event: error\ndata: ${JSON.stringify({ error: parsedError.error?.message || "Failed to stream OpenAI response" })}\n\n`,
    );
    res.end();
  }
});

export default router;
