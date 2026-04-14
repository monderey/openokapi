import { Router } from "express";
import type { Request, Response } from "express";
import { loadOllamaConfig } from "../../config/ollama.js";
import { sendOllamaRequest } from "../../functions/ollama-request.js";
import { OllamaClient } from "../../ollama/client.js";

const router: Router = Router();

router.get("/status", async (req: Request, res: Response) => {
  try {
    const config = loadOllamaConfig();
    res.json({
      enabled: config.enabled || false,
      baseURL: config.baseURL || "http://localhost:11434",
      defaultModel: config.defaultModel || null,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get Ollama status",
      details: error instanceof Error ? error.message : String(error),
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to list Ollama models",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/search", async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        error: "Missing required query parameter: query",
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to search Ollama models",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      res.status(400).json({
        error: "Missing required field: prompt",
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

    const result = await sendOllamaRequest(
      model || config.defaultModel || "llama2",
      prompt,
      "generate",
    );

    res.json({
      response: result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to process Ollama request",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/pull", async (req: Request, res: Response) => {
  try {
    const { model } = req.body;

    if (!model) {
      res.status(400).json({
        error: "Missing required field: model",
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to pull Ollama model",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.delete("/delete", async (req: Request, res: Response) => {
  try {
    const { model } = req.body;

    if (!model) {
      res.status(400).json({
        error: "Missing required field: model",
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete Ollama model",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/info", async (req: Request, res: Response) => {
  try {
    const { model } = req.query;

    if (!model || typeof model !== "string") {
      res.status(400).json({
        error: "Missing required query parameter: model",
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to get Ollama model info",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
