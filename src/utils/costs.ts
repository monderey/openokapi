import type { RequestHistoryEntry } from "./request-history.js";
import {
  loadPricingConfig,
  type PricingProvider,
  type PricingRule,
} from "../config/pricing.js";

export interface CostSummary {
  totalEstimatedCostUsd: number;
  totalRequests: number;
  totalTokens: number;
  byProvider: Record<"openai" | "claude" | "ollama", number>;
}

export interface ResolvedPricing {
  rule: PricingRule;
  matchedBy: "exact" | "prefix" | "wildcard" | "fallback";
}

export function estimateTokensFromText(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateTokensFromLength(length: number): number {
  if (!Number.isFinite(length) || length <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(length / 4));
}

const FALLBACK_RULES: Record<PricingProvider, PricingRule> = {
  openai: {
    provider: "openai",
    match: "*",
    inputPer1kUsd: 0.002,
    outputPer1kUsd: 0.006,
  },
  claude: {
    provider: "claude",
    match: "*",
    inputPer1kUsd: 0.003,
    outputPer1kUsd: 0.015,
  },
  ollama: {
    provider: "ollama",
    match: "*",
    inputPer1kUsd: 0,
    outputPer1kUsd: 0,
  },
};

export function resolvePricingRule(
  provider: PricingProvider,
  model: string,
): ResolvedPricing {
  const normalizedModel = model.toLowerCase();
  const rules = loadPricingConfig().rules.filter(
    (rule) => rule.provider === provider,
  );

  const exact = rules.find((rule) => rule.match === normalizedModel);
  if (exact) {
    return { rule: exact, matchedBy: "exact" };
  }

  const prefix = rules.find(
    (rule) => rule.match !== "*" && normalizedModel.startsWith(rule.match),
  );
  if (prefix) {
    return { rule: prefix, matchedBy: "prefix" };
  }

  const wildcard = rules.find((rule) => rule.match === "*");
  if (wildcard) {
    return { rule: wildcard, matchedBy: "wildcard" };
  }

  return { rule: FALLBACK_RULES[provider], matchedBy: "fallback" };
}

export function estimateCostUsd(params: {
  provider: "openai" | "claude" | "ollama";
  model: string;
  promptTokens: number;
  completionTokens: number;
}): number {
  const resolved = resolvePricingRule(params.provider, params.model);
  const inputCost = (params.promptTokens / 1000) * resolved.rule.inputPer1kUsd;
  const outputCost =
    (params.completionTokens / 1000) * resolved.rule.outputPer1kUsd;
  return Number((inputCost + outputCost).toFixed(6));
}

export function summarizeCosts(entries: RequestHistoryEntry[]): CostSummary {
  const summary: CostSummary = {
    totalEstimatedCostUsd: 0,
    totalRequests: 0,
    totalTokens: 0,
    byProvider: {
      openai: 0,
      claude: 0,
      ollama: 0,
    },
  };

  for (const entry of entries) {
    if (!entry.success) {
      continue;
    }

    const promptTokens = entry.promptTokens || 0;
    const completionTokens = entry.completionTokens || 0;
    const cost =
      entry.estimatedCostUsd ??
      estimateCostUsd({
        provider: entry.provider,
        model: entry.model,
        promptTokens,
        completionTokens,
      });

    summary.totalRequests += 1;
    summary.totalTokens += entry.totalTokens || promptTokens + completionTokens;
    summary.totalEstimatedCostUsd += cost;
    summary.byProvider[entry.provider] += cost;
  }

  summary.totalEstimatedCostUsd = Number(
    summary.totalEstimatedCostUsd.toFixed(6),
  );
  summary.byProvider.openai = Number(summary.byProvider.openai.toFixed(6));
  summary.byProvider.claude = Number(summary.byProvider.claude.toFixed(6));
  summary.byProvider.ollama = Number(summary.byProvider.ollama.toFixed(6));

  return summary;
}
