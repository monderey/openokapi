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
import { estimateCostUsd, estimateTokensFromText } from "../utils/costs.js";

export async function sendOllamaRequest(
  model: string,
  prompt: string,
  type: "chat" | "generate" = "generate",
  history?: {
    source?: RequestHistorySource;
    action?: RequestHistoryAction;
    cacheKey?: string;
    cacheHit?: boolean;
  },
  options?: {
    temperature?: number;
    maxTokens?: number;
    system?: string;
  },
): Promise<string> {
  const client = new OllamaClient();
  const startedAt = Date.now();
  const historySource = history?.source || "unknown";
  const historyAction = history?.action || type;
  const cacheKey = history?.cacheKey;
  const cacheHit = history?.cacheHit;

  try {
    if (type === "chat") {
      const messages: Array<{ role: "system" | "user"; content: string }> = [];
      if (options?.system) {
        messages.push({
          role: "system",
          content: options.system,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      const chatRequest: OllamaChatRequest = {
        model,
        messages,
      };

      if (
        options?.temperature !== undefined ||
        options?.maxTokens !== undefined
      ) {
        chatRequest.options = {};
        if (options.temperature !== undefined) {
          chatRequest.options.temperature = options.temperature;
        }
        if (options.maxTokens !== undefined) {
          chatRequest.options.num_predict = options.maxTokens;
        }
      }

      const response = await client.chat(chatRequest);
      const promptTokens = estimateTokensFromText(prompt);
      const completionTokens = estimateTokensFromText(response.message.content);
      recordRequestHistory({
        provider: "ollama",
        source: historySource,
        action: historyAction,
        model,
        success: true,
        durationMs: Date.now() - startedAt,
        promptLength: prompt.length,
        responseLength: response.message.content.length,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostUsd: estimateCostUsd({
          provider: "ollama",
          model,
          promptTokens,
          completionTokens,
        }),
        cacheKey,
        cacheHit,
      });
      return response.message.content;
    } else {
      const generateRequest: OllamaGenerateRequest = {
        model,
        prompt,
      };

      if (options?.system) {
        generateRequest.system = options.system;
      }

      if (
        options?.temperature !== undefined ||
        options?.maxTokens !== undefined
      ) {
        generateRequest.options = {};
        if (options.temperature !== undefined) {
          generateRequest.options.temperature = options.temperature;
        }
        if (options.maxTokens !== undefined) {
          generateRequest.options.num_predict = options.maxTokens;
        }
      }

      const response = await client.generate(generateRequest);
      const promptTokens = estimateTokensFromText(prompt);
      const completionTokens = estimateTokensFromText(response.response);
      recordRequestHistory({
        provider: "ollama",
        source: historySource,
        action: historyAction,
        model,
        success: true,
        durationMs: Date.now() - startedAt,
        promptLength: prompt.length,
        responseLength: response.response.length,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostUsd: estimateCostUsd({
          provider: "ollama",
          model,
          promptTokens,
          completionTokens,
        }),
        cacheKey,
        cacheHit,
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
      cacheKey,
      cacheHit,
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
