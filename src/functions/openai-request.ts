import { getOpenAIClient } from "../openai/client.js";
import type { ChatCompletionRequest } from "../openai/resources/types.js";

export interface OpenAIRequestOptions {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface OpenAIRequestResult {
  success: boolean;
  content?: string;
  error?: {
    type:
      | "auth"
      | "rate-limit"
      | "not-found"
      | "timeout"
      | "network"
      | "unknown";
    message: string;
    status?: number;
    retryAfter?: number;
  };
}

export interface OpenAIStreamResult {
  success: boolean;
  stream?: AsyncGenerator<string>;
  error?: OpenAIRequestResult["error"];
}

export async function sendOpenAIRequest(
  options: OpenAIRequestOptions,
): Promise<OpenAIRequestResult> {
  const client = getOpenAIClient();
  const maxRetries = 3;
  let lastError: any = null;

  for (let retries = 0; retries < maxRetries; retries++) {
    try {
      const request: ChatCompletionRequest = {
        model: options.model,
        messages: [{ role: "user", content: options.prompt }],
        temperature: options.temperature ?? 0.7,
      };

      if (options.maxTokens) {
        request.max_tokens = options.maxTokens;
      }

      const response = await client.createChatCompletion(request);
      const content = response.choices[0]?.message?.content || "";

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

  return parseOpenAIError(lastError);
}

export async function streamOpenAIRequest(
  options: OpenAIRequestOptions,
): Promise<OpenAIStreamResult> {
  try {
    const client = getOpenAIClient();

    const requestParams: {
      model: string;
      messages: { role: "user"; content: string }[];
      temperature?: number;
      max_tokens?: number;
    } = {
      model: options.model,
      messages: [{ role: "user", content: options.prompt }],
      temperature: options.temperature ?? 0.7,
    };

    if (options.maxTokens) {
      requestParams.max_tokens = options.maxTokens;
    }

    const stream = client.streamMessage(requestParams);

    return {
      success: true,
      stream,
    };
  } catch (error: any) {
    return {
      success: false,
      error: parseOpenAIError(error).error,
    };
  }
}

function parseOpenAIError(error: any): OpenAIRequestResult {
  const status = error.response?.status;
  const message =
    error.response?.data?.error?.message || error.message || "Unknown error";

  if (status === 401) {
    return {
      success: false,
      error: {
        type: "auth",
        message: "Invalid or expired API key",
        status,
      },
    };
  }

  if (status === 429) {
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

  if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
    return {
      success: false,
      error: {
        type: "network",
        message: "Cannot connect to OpenAI API",
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

export function formatErrorForCLI(error: OpenAIRequestResult["error"]): string {
  if (!error) return "Unknown error";

  switch (error.type) {
    case "auth":
      return "Invalid API key. Update with: openokapi agent openai --setkey";
    case "rate-limit":
      return `Rate limited. Try again in ${error.retryAfter || 60} seconds.\nOptions:\n  • Wait and try again\n  • Upgrade OpenAI account\n  • Use gpt-3.5-turbo (cheaper model)`;
    case "not-found":
      return "Model not found. Update models: openokapi agent openai --update-models";
    case "timeout":
      return "Request timed out. Try again.";
    case "network":
      return "Cannot connect to OpenAI API. Check your internet connection.";
    default:
      return error.message;
  }
}

export function formatErrorForDiscord(
  error: OpenAIRequestResult["error"],
): string {
  if (!error) return "Unknown error";

  switch (error.type) {
    case "auth":
      return "Invalid OpenAI API key. Update with `openokapi agent openai --setkey`";
    case "rate-limit":
      return "Rate limit exceeded. Try again later.";
    case "not-found":
      return "Model not found or not available.";
    case "timeout":
      return "Request timed out.";
    case "network":
      return "Cannot connect to OpenAI API.";
    default:
      return error.message;
  }
}
