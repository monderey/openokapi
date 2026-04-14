import { getClaudeClient } from "../claude/client.js";
import type { ClaudeRequestOptions } from "../claude/models/index.js";
import { Validator } from "../claude/utils/validator.js";
import {
  recordRequestHistory,
  type RequestHistoryAction,
  type RequestHistorySource,
} from "../utils/request-history.js";

export interface ClaudeRequestInput {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  history?: {
    source?: RequestHistorySource;
    action?: RequestHistoryAction;
  };
}

export interface ClaudeRequestResult {
  success: boolean;
  content?: string;
  error?: {
    type:
      | "auth"
      | "rate-limit"
      | "not-found"
      | "timeout"
      | "network"
      | "invalid"
      | "unknown";
    message: string;
    status?: number;
    retryAfter?: number;
  };
}

export async function sendClaudeRequest(
  options: ClaudeRequestInput,
): Promise<ClaudeRequestResult> {
  const client = getClaudeClient();
  const maxRetries = 3;
  let lastError: any = null;
  const startedAt = Date.now();
  let attempts = 0;
  const historySource = options.history?.source || "unknown";
  const historyAction = options.history?.action || "ask";

  const request: ClaudeRequestOptions = {
    model: options.model,
    messages: [{ role: "user", content: options.prompt }],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
  };

  if (options.system) {
    request.system = options.system;
  }

  const validation = Validator.validateRequest(request);
  if (!validation.valid) {
    recordRequestHistory({
      provider: "claude",
      source: historySource,
      action: historyAction,
      model: options.model,
      success: false,
      durationMs: Date.now() - startedAt,
      promptLength: options.prompt.length,
      errorType: "invalid",
      errorMessage: `Validation failed: ${validation.errors.join(", ")}`,
    });

    return {
      success: false,
      error: {
        type: "invalid",
        message: `Validation failed: ${validation.errors.join(", ")}`,
      },
    };
  }

  for (let retries = 0; retries < maxRetries; retries++) {
    attempts += 1;
    try {
      const content = await client.sendMessage(request);

      recordRequestHistory({
        provider: "claude",
        source: historySource,
        action: historyAction,
        model: options.model,
        success: true,
        durationMs: Date.now() - startedAt,
        promptLength: options.prompt.length,
        responseLength: content.length,
        retries: attempts - 1,
      });

      return {
        success: true,
        content,
      };
    } catch (error: any) {
      lastError = error;

      if (error.response?.status === 429 && retries < maxRetries - 1) {
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      break;
    }
  }

  const parsed = parseClaudeError(lastError);

  recordRequestHistory({
    provider: "claude",
    source: historySource,
    action: historyAction,
    model: options.model,
    success: false,
    durationMs: Date.now() - startedAt,
    promptLength: options.prompt.length,
    retries: attempts - 1,
    errorType: parsed.error?.type,
    errorMessage: parsed.error?.message,
  });

  return parsed;
}

function parseClaudeError(error: any): ClaudeRequestResult {
  const status = error.response?.status;
  const message =
    error.response?.data?.error?.message || error.message || "Unknown error";
  const errorType = error.response?.data?.error?.type || "";

  if (status === 401 || errorType === "authentication_error") {
    return {
      success: false,
      error: {
        type: "auth",
        message: "Invalid or expired API key",
        status,
      },
    };
  }

  if (status === 429 || errorType === "rate_limit_error") {
    const retryAfter = parseInt(
      error.response?.headers?.["retry-after"] || "60",
    );
    return {
      success: false,
      error: {
        type: "rate-limit",
        message: "Rate limit exceeded. Try again later.",
        status,
        retryAfter,
      },
    };
  }

  if (status === 404) {
    return {
      success: false,
      error: {
        type: "not-found",
        message: "Model not found or not available",
        status,
      },
    };
  }

  if (status === 400 || errorType === "invalid_request_error") {
    return {
      success: false,
      error: {
        type: "invalid",
        message,
        status,
      },
    };
  }

  if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
    return {
      success: false,
      error: {
        type: "network",
        message: "Cannot connect to Claude API",
      },
    };
  }

  if (error.message?.includes("timeout") || error.code === "ETIMEDOUT") {
    return {
      success: false,
      error: {
        type: "timeout",
        message: "Request timed out",
      },
    };
  }

  return {
    success: false,
    error: {
      type: "unknown",
      message,
      status,
    },
  };
}

export function formatClaudeErrorForCLI(
  error: ClaudeRequestResult["error"],
): string {
  if (!error) return "Unknown error";

  switch (error.type) {
    case "auth":
      return "Invalid API key. Update with: openokapi agent claude --setkey";
    case "rate-limit":
      return `Rate limited. Try again in ${error.retryAfter || 60} seconds.`;
    case "not-found":
      return "Model not found. Update models: openokapi agent claude --update-models";
    case "timeout":
      return "Request timed out. Try again.";
    case "network":
      return "Cannot connect to Claude API. Check your internet connection.";
    case "invalid":
      return error.message;
    default:
      return error.message;
  }
}

export function formatClaudeErrorForDiscord(
  error: ClaudeRequestResult["error"],
): string {
  if (!error) return "Unknown error";

  switch (error.type) {
    case "auth":
      return "Invalid Claude API key. Update with `openokapi agent claude --setkey`";
    case "rate-limit":
      return "Rate limit exceeded. Try again later.";
    case "not-found":
      return "Model not found or not available.";
    case "timeout":
      return "Request timed out.";
    case "network":
      return "Cannot connect to Claude API.";
    case "invalid":
      return error.message;
    default:
      return error.message;
  }
}
