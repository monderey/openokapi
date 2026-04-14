import { loadAppConfig } from "../config/app.js";
import { loadOpenAIConfig } from "../config/openai.js";
import { loadClaudeConfig } from "../config/claude.js";
import { loadOllamaConfig } from "../config/ollama.js";
import { sendOpenAIRequest } from "./openai-request.js";
import { sendClaudeRequest } from "./claude-request.js";
import { sendOllamaRequest } from "./ollama-request.js";
import type {
  RequestHistoryAction,
  RequestHistorySource,
} from "../utils/request-history.js";

export type Provider = "openai" | "claude" | "ollama";

export interface ProviderRequestOptions {
  provider: Provider;
  prompt: string;
  model?: string | undefined;
  historySource?: RequestHistorySource | undefined;
  historyAction?: RequestHistoryAction | undefined;
}

export interface ProviderExecutionResult {
  success: boolean;
  providerUsed: Provider;
  modelUsed: string;
  fallbackUsed: boolean;
  content?: string | undefined;
  error?:
    | {
        type: string;
        message: string;
      }
    | undefined;
}

function canFallback(errorType: string | undefined): boolean {
  return ["rate-limit", "timeout", "network", "unknown"].includes(
    errorType || "",
  );
}

function buildConfigError(
  provider: Provider,
  message: string,
): ProviderExecutionResult {
  return {
    success: false,
    providerUsed: provider,
    modelUsed: "",
    fallbackUsed: false,
    error: {
      type: "config",
      message,
    },
  };
}

async function callProvider(
  provider: Provider,
  prompt: string,
  modelOverride?: string,
  historySource: RequestHistorySource = "unknown",
  historyAction: RequestHistoryAction = "ask",
): Promise<ProviderExecutionResult> {
  if (provider === "openai") {
    const config = loadOpenAIConfig();
    const model = modelOverride || config.defaultModel || "gpt-3.5-turbo";

    if (!config.apiKey) {
      return buildConfigError("openai", "OpenAI API key is not configured");
    }

    const result = await sendOpenAIRequest({
      model,
      prompt,
      history: {
        source: historySource,
        action: historyAction,
      },
    });

    return {
      success: result.success,
      providerUsed: "openai",
      modelUsed: model,
      fallbackUsed: false,
      content: result.content,
      error: result.error
        ? {
            type: result.error.type,
            message: result.error.message,
          }
        : undefined,
    };
  }

  if (provider === "claude") {
    const config = loadClaudeConfig();
    const model =
      modelOverride || config.defaultModel || "claude-3-5-sonnet-20241022";

    if (!config.apiKey) {
      return buildConfigError("claude", "Claude API key is not configured");
    }

    const result = await sendClaudeRequest({
      model,
      prompt,
      history: {
        source: historySource,
        action: historyAction,
      },
    });

    return {
      success: result.success,
      providerUsed: "claude",
      modelUsed: model,
      fallbackUsed: false,
      content: result.content,
      error: result.error
        ? {
            type: result.error.type,
            message: result.error.message,
          }
        : undefined,
    };
  }

  const config = loadOllamaConfig();
  const model = modelOverride || config.defaultModel || "llama2";

  if (!config.enabled) {
    return buildConfigError("ollama", "Ollama integration is disabled");
  }

  try {
    const result = await sendOllamaRequest(model, prompt, "generate", {
      source: historySource,
      action: historyAction,
    });

    return {
      success: true,
      providerUsed: "ollama",
      modelUsed: model,
      fallbackUsed: false,
      content: result,
    };
  } catch (error) {
    return {
      success: false,
      providerUsed: "ollama",
      modelUsed: model,
      fallbackUsed: false,
      error: {
        type: "unknown",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export async function executeWithFailover(
  options: ProviderRequestOptions,
): Promise<ProviderExecutionResult> {
  const appConfig = loadAppConfig();
  const source = options.historySource || "unknown";
  const action = options.historyAction || "ask";

  const primary = await callProvider(
    options.provider,
    options.prompt,
    options.model,
    source,
    action,
  );

  if (primary.success) {
    return primary;
  }

  const fallbackProvider = appConfig.fallbackProvider;
  if (!fallbackProvider || fallbackProvider === options.provider) {
    return primary;
  }

  if (!canFallback(primary.error?.type)) {
    return primary;
  }

  const fallback = await callProvider(
    fallbackProvider,
    options.prompt,
    undefined,
    source,
    action,
  );

  if (fallback.success) {
    return {
      ...fallback,
      fallbackUsed: true,
    };
  }

  return {
    ...primary,
    error: {
      type: primary.error?.type || "unknown",
      message: `${primary.error?.message || "Primary provider failed"}; fallback ${fallbackProvider} failed: ${fallback.error?.message || "unknown error"}`,
    },
  };
}
