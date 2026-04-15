import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteConversation,
  getConversation,
} from "../../config/conversations.js";
import {
  getConversations,
  sendConversationMessage,
  summarizeConversationNow,
  startConversation,
} from "../../functions/conversation-chat.js";

const router: Router = Router();

function getText(value: unknown): string | undefined {
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

router.get("/", (req: Request, res: Response) => {
  res.json({ conversations: getConversations() });
});

router.post("/start", (req: Request, res: Response) => {
  const provider = getText(req.body?.provider) as
    | "openai"
    | "claude"
    | "ollama"
    | undefined;
  if (!provider) {
    res.status(400).json({ error: "Missing required field: provider" });
    return;
  }

  const startInput: {
    provider: "openai" | "claude" | "ollama";
    model?: string;
    title?: string;
    system?: string;
  } = {
    provider,
  };

  const model = getText(req.body?.model);
  const title = getText(req.body?.title);
  const system = getText(req.body?.system);
  if (model) startInput.model = model;
  if (title) startInput.title = title;
  if (system) startInput.system = system;

  const conversation = startConversation(startInput);

  res.json({ conversation });
});

router.get("/:id", (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Missing conversation id" });
    return;
  }

  const conversation = getConversation(id);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json({ conversation });
});

router.post("/:id/message", async (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Missing conversation id" });
    return;
  }

  const message = getText(req.body?.message) || getText(req.body?.prompt);
  if (!message) {
    res.status(400).json({ error: "Missing required field: message" });
    return;
  }

  try {
    const inputPayload: {
      conversationId: string;
      message: string;
      temperature?: number;
      maxTokens?: number;
    } = {
      conversationId: id,
      message,
    };
    if (typeof req.body?.temperature === "number") {
      inputPayload.temperature = req.body.temperature;
    }
    if (typeof req.body?.maxTokens === "number") {
      inputPayload.maxTokens = req.body.maxTokens;
    }

    const result = await sendConversationMessage(inputPayload);

    res.json({ result });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to send message";
    const status = messageText.includes("not found") ? 404 : 500;
    res.status(status).json({ error: messageText });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Missing conversation id" });
    return;
  }

  const deleted = deleteConversation(id);
  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json({ success: true, message: "Conversation deleted" });
});

router.post("/:id/summarize", (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Missing conversation id" });
    return;
  }

  try {
    const result = summarizeConversationNow(id);
    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to summarize conversation";
    const status = message.includes("not found") ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export default router;
