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
import { recordRequestHistory } from "../utils/request-history.js";
import {
  computeCacheKey,
  getCachedResponseFor,
  putCachedResponse,
} from "../utils/response-cache.js";
import { estimateCostUsd, estimateTokensFromText } from "../utils/costs.js";
import { sanitizeText } from "./guardrails.js";
import { evaluateBudgetRequest, getBudgetStatus } from "./budget-enforcer.js";
import { loadCapabilitiesConfig } from "../config/capabilities.js";
import { emitPlatformEvent } from "./event-bus.js";
import { applyStandingOrdersToPrompt } from "./standing-orders.js";

export type Provider = "openai" | "claude" | "ollama";

export interface ProviderRequestOptions {
  provider: Provider;
  prompt: string;
  model?: string | undefined;
  temperature?: number | undefined;
  maxTokens?: number | undefined;
  system?: string | undefined;
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

function resolveModelForProvider(
  provider: Provider,
  modelOverride: string | undefined,
): string {
  if (provider === "openai") {
    return modelOverride || loadOpenAIConfig().defaultModel || "gpt-3.5-turbo";
  }

  if (provider === "claude") {
    return (
      modelOverride ||
      loadClaudeConfig().defaultModel ||
      "claude-3-5-sonnet-20241022"
    );
  }

  return modelOverride || loadOllamaConfig().defaultModel || "llama2";
}

async function callProvider(
  provider: Provider,
  prompt: string,
  modelOverride?: string,
  temperature?: number,
  maxTokens?: number,
  system?: string,
  cacheKey?: string,
  historySource: RequestHistorySource = "unknown",
  historyAction: RequestHistoryAction = "ask",
): Promise<ProviderExecutionResult> {
  const historyMeta: {
    source: RequestHistorySource;
    action: RequestHistoryAction;
    cacheHit: boolean;
    cacheKey?: string;
  } = {
    source: historySource,
    action: historyAction,
    cacheHit: false,
  };

  if (cacheKey) {
    historyMeta.cacheKey = cacheKey;
  }

  if (provider === "openai") {
    const config = loadOpenAIConfig();
    const model = modelOverride || config.defaultModel || "gpt-3.5-turbo";

    if (!config.apiKey) {
      return buildConfigError("openai", "OpenAI API key is not configured");
    }

    const requestInput: {
      model: string;
      prompt: string;
      temperature?: number;
      maxTokens?: number;
      system?: string;
      history: {
        source: RequestHistorySource;
        action: RequestHistoryAction;
        cacheHit: boolean;
        cacheKey?: string;
      };
    } = {
      model,
      prompt,
      history: historyMeta,
    };
    if (typeof temperature === "number") requestInput.temperature = temperature;
    if (typeof maxTokens === "number") requestInput.maxTokens = maxTokens;
    if (system) requestInput.system = system;

    const result = await sendOpenAIRequest(requestInput);

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

    const requestInput: {
      model: string;
      prompt: string;
      temperature?: number;
      maxTokens?: number;
      system?: string;
      history: {
        source: RequestHistorySource;
        action: RequestHistoryAction;
        cacheHit: boolean;
        cacheKey?: string;
      };
    } = {
      model,
      prompt,
      history: historyMeta,
    };
    if (typeof temperature === "number") requestInput.temperature = temperature;
    if (typeof maxTokens === "number") requestInput.maxTokens = maxTokens;
    if (system) requestInput.system = system;

    const result = await sendClaudeRequest(requestInput);

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
    const ollamaOptions: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
    } = {};
    if (typeof temperature === "number")
      ollamaOptions.temperature = temperature;
    if (typeof maxTokens === "number") ollamaOptions.maxTokens = maxTokens;
    if (system) ollamaOptions.system = system;

    const result = await sendOllamaRequest(
      model,
      prompt,
      "generate",
      {
        ...historyMeta,
      },
      ollamaOptions,
    );

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
  const capabilities = loadCapabilitiesConfig().values;
  const source = options.historySource || "unknown";
  const action = options.historyAction || "ask";
  const guardrailInput = sanitizeText(options.prompt);

  if (!guardrailInput.allowed) {
    const message = `Blocked by guardrails term: ${guardrailInput.blockedBy || "policy"}`;
    void emitPlatformEvent({
      event: "guardrails.block",
      payload: {
        provider: options.provider,
        source,
        action,
        blockedBy: guardrailInput.blockedBy,
      },
    }).catch(() => undefined);

    return {
      success: false,
      providerUsed: options.provider,
      modelUsed: resolveModelForProvider(options.provider, options.model),
      fallbackUsed: false,
      error: {
        type: "guardrails",
        message,
      },
    };
  }

  if (guardrailInput.redactedPatterns?.length) {
    void emitPlatformEvent({
      event: "guardrails.redaction",
      payload: {
        provider: options.provider,
        source,
        action,
        patterns: guardrailInput.redactedPatterns,
      },
    }).catch(() => undefined);
  }

  const safePrompt = applyStandingOrdersToPrompt({
    provider: options.provider,
    prompt: guardrailInput.sanitizedText,
  });

  const predictedPromptTokens = estimateTokensFromText(safePrompt);
  const predictedCompletionTokens =
    typeof options.maxTokens === "number"
      ? Math.max(1, Math.floor(options.maxTokens))
      : 512;
  const predictedCost = estimateCostUsd({
    provider: options.provider,
    model: resolveModelForProvider(options.provider, options.model),
    promptTokens: predictedPromptTokens,
    completionTokens: predictedCompletionTokens,
  });

  const budgetDecision = evaluateBudgetRequest({
    estimatedCostUsd: predictedCost,
  });
  if (!budgetDecision.allowed) {
    void emitPlatformEvent({
      event: "budget.block",
      payload: {
        provider: options.provider,
        source,
        action,
        reason: budgetDecision.reason,
        estimatedCostUsd: budgetDecision.estimatedCostUsd,
        status: budgetDecision.status,
      },
    }).catch(() => undefined);

    return {
      success: false,
      providerUsed: options.provider,
      modelUsed: resolveModelForProvider(options.provider, options.model),
      fallbackUsed: false,
      error: {
        type: "budget",
        message: budgetDecision.reason || "Request blocked by budget policy",
      },
    };
  }

  const resolvedPrimaryModel = resolveModelForProvider(
    options.provider,
    options.model,
  );
  const cachePayload: {
    provider: "openai" | "claude" | "ollama";
    prompt: string;
    model?: string;
    system?: string;
    temperature?: number;
    maxTokens?: number;
  } = {
    provider: options.provider,
    prompt: safePrompt,
  };

  cachePayload.model = resolvedPrimaryModel;
  if (options.system) {
    cachePayload.system = options.system;
  }
  if (typeof options.temperature === "number") {
    cachePayload.temperature = options.temperature;
  }
  if (typeof options.maxTokens === "number") {
    cachePayload.maxTokens = options.maxTokens;
  }

  const cacheKey = computeCacheKey(cachePayload);
  const cached = capabilities.response_cache
    ? getCachedResponseFor({
        key: cacheKey,
        provider: options.provider,
        model: resolvedPrimaryModel,
      })
    : undefined;

  if (cached) {
    const promptTokens = estimateTokensFromText(safePrompt);
    const completionTokens = estimateTokensFromText(cached.content);

    recordRequestHistory({
      provider: cached.provider,
      source,
      action: "replay",
      model: cached.model,
      success: true,
      durationMs: 1,
      promptLength: safePrompt.length,
      responseLength: cached.content.length,
      cacheHit: true,
      cacheKey,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCostUsd: estimateCostUsd({
        provider: cached.provider,
        model: cached.model,
        promptTokens,
        completionTokens,
      }),
    });

    return {
      success: true,
      providerUsed: cached.provider,
      modelUsed: cached.model,
      fallbackUsed: false,
      content: cached.content,
    };
  }

  const primary = await callProvider(
    options.provider,
    safePrompt,
    resolvedPrimaryModel,
    options.temperature,
    options.maxTokens,
    options.system,
    cacheKey,
    source,
    action,
  );

  if (primary.success) {
    if (primary.content && capabilities.response_cache) {
      putCachedResponse({
        key: cacheKey,
        provider: primary.providerUsed,
        model: primary.modelUsed,
        content: primary.content,
        source,
      });
    }

    void emitPlatformEvent({
      event: "request.success",
      payload: {
        provider: primary.providerUsed,
        model: primary.modelUsed,
        source,
        action,
        fallbackUsed: primary.fallbackUsed,
      },
    }).catch(() => undefined);

    const budgetStatus = getBudgetStatus();
    if (budgetStatus.alert) {
      void emitPlatformEvent({
        event: "budget.alert",
        payload: {
          status: budgetStatus,
          provider: primary.providerUsed,
          model: primary.modelUsed,
          source,
          action,
        },
      }).catch(() => undefined);
    }

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
    safePrompt,
    undefined,
    options.temperature,
    options.maxTokens,
    options.system,
    cacheKey,
    source,
    action,
  );

  if (fallback.success) {
    if (fallback.content && capabilities.response_cache) {
      putCachedResponse({
        key: cacheKey,
        provider: fallback.providerUsed,
        model: fallback.modelUsed,
        content: fallback.content,
        source,
      });
    }

    void emitPlatformEvent({
      event: "request.success",
      payload: {
        provider: fallback.providerUsed,
        model: fallback.modelUsed,
        source,
        action,
        fallbackUsed: true,
      },
    }).catch(() => undefined);

    return {
      ...fallback,
      fallbackUsed: true,
    };
  }

  void emitPlatformEvent({
    event: "request.error",
    payload: {
      provider: options.provider,
      fallbackProvider,
      source,
      action,
      primaryError: primary.error,
      fallbackError: fallback.error,
    },
  }).catch(() => undefined);

  return {
    ...primary,
    error: {
      type: primary.error?.type || "unknown",
      message: `${primary.error?.message || "Primary provider failed"}; fallback ${fallbackProvider} failed: ${fallback.error?.message || "unknown error"}`,
    },
  };
}
