import { Router } from "express";
import type { Request, Response } from "express";
import { loadClaudeConfig } from "../../config/claude.js";
import { sendClaudeRequest } from "../../functions/claude-request.js";

const router: Router = Router();

router.get("/status", async (req: Request, res: Response) => {
  try {
    const config = loadClaudeConfig();
    res.json({
      enabled: config.enabled || false,
      apiKey: config.apiKey ? "***configured***" : null,
      defaultModel: config.defaultModel || null,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get Claude status",
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

    const config = loadClaudeConfig();

    if (!config.apiKey) {
      res.status(400).json({
        error:
          "Claude API key not configured. Use 'openokapi claude --setkey' first.",
      });
      return;
    }

    const result = await sendClaudeRequest({
      model: model || config.defaultModel || "claude-3-5-sonnet-20241022",
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
      error: "Failed to process Claude request",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
