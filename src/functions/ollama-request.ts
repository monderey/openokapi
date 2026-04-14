import { OllamaClient } from "../ollama/client.js";
import type {
  OllamaChatRequest,
  OllamaGenerateRequest,
} from "../ollama/models/index.js";
import {
  recordRequestHistory,
  type RequestHistoryAction,
  type RequestHistorySource,
} from "../utils/request-history.js";

export async function sendOllamaRequest(
  model: string,
  prompt: string,
  type: "chat" | "generate" = "generate",
  history?: {
    source?: RequestHistorySource;
    action?: RequestHistoryAction;
  },
): Promise<string> {
  const client = new OllamaClient();
  const startedAt = Date.now();
  const historySource = history?.source || "unknown";
  const historyAction = history?.action || type;

  try {
    if (type === "chat") {
      const chatRequest: OllamaChatRequest = {
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      };

      const response = await client.chat(chatRequest);
      recordRequestHistory({
        provider: "ollama",
        source: historySource,
        action: historyAction,
        model,
        success: true,
        durationMs: Date.now() - startedAt,
        promptLength: prompt.length,
        responseLength: response.message.content.length,
      });
      return response.message.content;
    } else {
      const generateRequest: OllamaGenerateRequest = {
        model,
        prompt,
      };

      const response = await client.generate(generateRequest);
      recordRequestHistory({
        provider: "ollama",
        source: historySource,
        action: historyAction,
        model,
        success: true,
        durationMs: Date.now() - startedAt,
        promptLength: prompt.length,
        responseLength: response.response.length,
      });
      return response.response;
    }
  } catch (error) {
    recordRequestHistory({
      provider: "ollama",
      source: historySource,
      action: historyAction,
      model,
      success: false,
      durationMs: Date.now() - startedAt,
      promptLength: prompt.length,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    throw new Error(
      `Failed to send Ollama request: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function formatErrorForCLI(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
