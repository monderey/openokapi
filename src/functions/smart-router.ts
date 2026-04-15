import { loadRouterPolicy, type Provider } from "../config/router-policy.js";
import {
  executeWithFailover,
  type ProviderExecutionResult,
} from "./failover.js";
import { readRequestHistory } from "../utils/request-history.js";
import { summarizeCosts } from "../utils/costs.js";

function baselineScore(provider: Provider, strategy: string): number {
  if (strategy === "cost") {
    return provider === "ollama" ? 100 : provider === "openai" ? 70 : 60;
  }

  if (strategy === "speed") {
    return provider === "ollama" ? 80 : provider === "openai" ? 75 : 70;
  }

  if (strategy === "reliability") {
    return provider === "claude" ? 85 : provider === "openai" ? 82 : 65;
  }

  return provider === "openai" ? 82 : provider === "claude" ? 81 : 72;
}

function recentStats(provider: Provider): {
  reliability: number;
  avgLatencyMs: number;
  avgCostUsd: number;
} {
  const entries = readRequestHistory(500)
    .filter((entry) => entry.provider === provider)
    .slice(0, 50);

  if (!entries.length) {
    return {
      reliability: 0.8,
      avgLatencyMs:
        provider === "ollama" ? 1200 : provider === "openai" ? 900 : 1000,
      avgCostUsd:
        provider === "ollama" ? 0.0001 : provider === "openai" ? 0.01 : 0.012,
    };
  }

  const successCount = entries.filter((entry) => entry.success).length;
  const reliability = successCount / entries.length;
  const avgLatencyMs =
    entries.reduce((acc, entry) => acc + entry.durationMs, 0) / entries.length;
  const costSummary = summarizeCosts(entries);
  const avgCostUsd = entries.length
    ? costSummary.totalEstimatedCostUsd / entries.length
    : 0;

  return {
    reliability,
    avgLatencyMs,
    avgCostUsd,
  };
}

function scoreProvider(provider: Provider, strategy: string): number {
  const base = baselineScore(provider, strategy);
  const stats = recentStats(provider);
  const reliabilityBonus = (stats.reliability - 0.5) * 40;
  const latencyBonus = Math.max(
    -20,
    Math.min(20, (1500 - stats.avgLatencyMs) / 100),
  );
  const costBonus = Math.max(
    -20,
    Math.min(20, (0.02 - stats.avgCostUsd) * 1000),
  );

  if (strategy === "cost") {
    return base + costBonus + reliabilityBonus * 0.5;
  }
  if (strategy === "speed") {
    return base + latencyBonus + reliabilityBonus * 0.5;
  }
  if (strategy === "reliability") {
    return base + reliabilityBonus + latencyBonus * 0.3;
  }

  return base + reliabilityBonus * 0.5 + latencyBonus * 0.3 + costBonus * 0.2;
}

function enforcePolicyConstraints(candidates: Provider[]): Provider[] {
  const policy = loadRouterPolicy();
  const filtered = candidates.filter((provider) => {
    const stats = recentStats(provider);
    if (stats.avgLatencyMs > policy.maxLatencyMs) {
      return false;
    }
    if (stats.avgCostUsd > policy.maxCostUsdPerRequest) {
      return false;
    }
    return true;
  });

  return filtered.length ? filtered : candidates;
}

export function explainRoutingDecision(): {
  strategy: string;
  selected: Provider;
  candidates: Array<{
    provider: Provider;
    score: number;
    reliability: number;
    avgLatencyMs: number;
    avgCostUsd: number;
    constrainedOut: boolean;
  }>;
} {
  const policy = loadRouterPolicy();
  const baseCandidates = policy.enabledProviders.length
    ? policy.enabledProviders
    : (["openai", "claude", "ollama"] as Provider[]);
  const constrained = enforcePolicyConstraints(baseCandidates);

  const candidates = baseCandidates
    .map((provider) => {
      const stats = recentStats(provider);
      return {
        provider,
        score: Number(scoreProvider(provider, policy.strategy).toFixed(3)),
        reliability: Number(stats.reliability.toFixed(4)),
        avgLatencyMs: Math.round(stats.avgLatencyMs),
        avgCostUsd: Number(stats.avgCostUsd.toFixed(6)),
        constrainedOut: !constrained.includes(provider),
      };
    })
    .sort((a, b) => b.score - a.score);

  const selected =
    candidates.find((item) => !item.constrainedOut)?.provider || "openai";

  return {
    strategy: policy.strategy,
    selected,
    candidates,
  };
}

export function selectProviderByPolicy(): Provider {
  const policy = loadRouterPolicy();
  const candidates = policy.enabledProviders.length
    ? policy.enabledProviders
    : (["openai", "claude", "ollama"] as Provider[]);
  const constrained = enforcePolicyConstraints(candidates);

  const sorted = [...constrained].sort(
    (a, b) =>
      scoreProvider(b, policy.strategy) - scoreProvider(a, policy.strategy),
  );
  return sorted[0] || "openai";
}

export async function executeWithSmartRouting(input: {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  historySource?: "cli" | "gateway" | "discord" | "unknown";
  historyAction?:
    | "ask"
    | "chat"
    | "generate"
    | "stream"
    | "replay"
    | "validate"
    | "other";
}): Promise<ProviderExecutionResult & { strategy: string }> {
  const policy = loadRouterPolicy();
  const provider = selectProviderByPolicy();
  const preferredModel = policy.preferredModels[provider];

  const result = await executeWithFailover({
    provider,
    prompt: input.prompt,
    model: input.model || preferredModel,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    system: input.system,
    historySource: input.historySource,
    historyAction: input.historyAction,
  });

  return {
    ...result,
    strategy: policy.strategy,
  };
}
