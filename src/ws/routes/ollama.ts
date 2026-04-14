import { Router } from "express";
import type { Request, Response } from "express";
import { loadOllamaConfig } from "../../config/ollama.js";
import {
  executeWithFailover,
  type ProviderExecutionResult,
} from "../../functions/failover.js";
import { OllamaClient } from "../../ollama/client.js";

const router: Router = Router();

const MAX_PROMPT_LENGTH = 20_000;
const MAX_MODEL_LENGTH = 256;
const MAX_QUERY_LENGTH = 256;

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
    error: result.error?.message || "Ollama request failed",
    meta: {
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
      fallbackUsed: result.fallbackUsed,
    },
  });
}

router.get("/status", async (req: Request, res: Response) => {
  try {
    const config = loadOllamaConfig();
    res.json({
      enabled: config.enabled || false,
      baseURL: config.baseURL || "http://localhost:11434",
      defaultModel: config.defaultModel || null,
    });
  } catch {
    res.status(500).json({
      error: "Failed to get Ollama status",
    });
  }
});

router.get("/list", async (req: Request, res: Response) => {
  try {
    const config = loadOllamaConfig();

    if (!config.enabled) {
      res.status(400).json({
        error: "Ollama is not enabled",
      });
      return;
    }

    const client = new OllamaClient({
      baseURL: config.baseURL || "http://localhost:11434",
    });

    const models = await client.listModels();
    res.json({
      models,
    });
  } catch {
    res.status(500).json({
      error: "Failed to list Ollama models",
    });
  }
});

router.get("/search", async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!isValidTextField(query, MAX_QUERY_LENGTH)) {
      res.status(400).json({
        error: "Missing or invalid query parameter: query",
      });
      return;
    }

    const config = loadOllamaConfig();

    if (!config.enabled) {
      res.status(400).json({
        error: "Ollama is not enabled",
      });
      return;
    }

    const client = new OllamaClient({
      baseURL: config.baseURL || "http://localhost:11434",
    });

    const results = await client.searchModel(query);
    res.json({
      results,
    });
  } catch {
    res.status(500).json({
      error: "Failed to search Ollama models",
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

    const config = loadOllamaConfig();

    if (!config.enabled) {
      res.status(400).json({
        error: "Ollama is not enabled",
      });
      return;
    }

    const resolvedModel =
      typeof model === "string" && model.trim().length > 0
        ? model.trim()
        : config.defaultModel || "llama2";

    const result = await executeWithFailover({
      provider: "ollama",
      model: resolvedModel,
      prompt,
      historySource: "gateway",
      historyAction: "ask",
    });

    sendResult(res, result);
  } catch {
    res.status(500).json({
      error: "Failed to process Ollama request",
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

    const config = loadOllamaConfig();
    const resolvedModel =
      typeof model === "string" && model.trim().length > 0
        ? model.trim()
        : config.defaultModel || "llama2";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const result = await executeWithFailover({
      provider: "ollama",
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

    const chunks = result.content
      .split(/(\s+)/)
      .filter((chunk) => chunk.length > 0);
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(
      `event: done\ndata: ${JSON.stringify({ providerUsed: result.providerUsed, fallbackUsed: result.fallbackUsed, modelUsed: result.modelUsed })}\n\n`,
    );
    res.end();
  } catch {
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to stream Ollama response",
      });
      return;
    }

    res.write(
      `event: error\ndata: ${JSON.stringify({ error: "Failed to stream Ollama response" })}\n\n`,
    );
    res.end();
  }
});

router.post("/pull", async (req: Request, res: Response) => {
  try {
    const { model } = req.body;

    if (!isValidTextField(model, MAX_MODEL_LENGTH)) {
      res.status(400).json({
        error: "Missing or invalid field: model",
      });
      return;
    }

    const config = loadOllamaConfig();

    if (!config.enabled) {
      res.status(400).json({
        error: "Ollama is not enabled",
      });
      return;
    }

    const client = new OllamaClient({
      baseURL: config.baseURL || "http://localhost:11434",
    });

    await client.pullModel(model);
    res.json({
      success: true,
      message: `Model ${model} pulled successfully`,
    });
  } catch {
    res.status(500).json({
      error: "Failed to pull Ollama model",
    });
  }
});

router.delete("/delete", async (req: Request, res: Response) => {
  try {
    const { model } = req.body;

    if (!isValidTextField(model, MAX_MODEL_LENGTH)) {
      res.status(400).json({
        error: "Missing or invalid field: model",
      });
      return;
    }

    const config = loadOllamaConfig();

    if (!config.enabled) {
      res.status(400).json({
        error: "Ollama is not enabled",
      });
      return;
    }

    const client = new OllamaClient({
      baseURL: config.baseURL || "http://localhost:11434",
    });

    await client.deleteModel(model);
    res.json({
      success: true,
      message: `Model ${model} deleted successfully`,
    });
  } catch {
    res.status(500).json({
      error: "Failed to delete Ollama model",
    });
  }
});

router.get("/info", async (req: Request, res: Response) => {
  try {
    const { model } = req.query;

    if (!isValidTextField(model, MAX_MODEL_LENGTH)) {
      res.status(400).json({
        error: "Missing or invalid query parameter: model",
      });
      return;
    }

    const config = loadOllamaConfig();

    if (!config.enabled) {
      res.status(400).json({
        error: "Ollama is not enabled",
      });
      return;
    }

    const client = new OllamaClient({
      baseURL: config.baseURL || "http://localhost:11434",
    });

    const info = await client.getModelInfo(model);
    res.json({
      info,
    });
  } catch {
    res.status(500).json({
      error: "Failed to get Ollama model info",
    });
  }
});

export default router;
