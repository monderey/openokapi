import { Router } from "express";
import type { Request, Response } from "express";
import { loadOpenAIConfig } from "../../config/openai.js";
import { sendOpenAIRequest } from "../../functions/openai-request.js";

const router: Router = Router();

router.get("/status", async (req: Request, res: Response) => {
  try {
    const config = loadOpenAIConfig();
    res.json({
      enabled: config.enabled || false,
      apiKey: config.apiKey ? "***configured***" : null,
      defaultModel: config.defaultModel || null,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get OpenAI status",
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

    const config = loadOpenAIConfig();

    if (!config.apiKey) {
      res.status(400).json({
        error:
          "OpenAI API key not configured. Use 'openokapi openai --setkey' first.",
      });
      return;
    }

    const result = await sendOpenAIRequest({
      model: model || config.defaultModel || "gpt-3.5-turbo",
      prompt,
    });

    if (result.success) {
      res.json({
        response: result.content,
      });
    } else {
      res.status(500).json({
        error: result.error?.message || "Unknown error",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to process OpenAI request",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
