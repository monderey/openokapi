import fs from "node:fs";
import { getConfigDir, writePrivateFile } from "./paths.js";

export type PricingProvider = "openai" | "claude" | "ollama";

export interface PricingRule {
  provider: PricingProvider;
  match: string;
  inputPer1kUsd: number;
  outputPer1kUsd: number;
}

export interface PricingConfig {
  updatedAt: string;
  rules: PricingRule[];
}

const PRICING_PATH = `${getConfigDir()}/pricing.json`;

const DEFAULT_RULES: PricingRule[] = [
  {
    provider: "openai",
    match: "gpt-4.1",
    inputPer1kUsd: 0.01,
    outputPer1kUsd: 0.03,
  },
  {
    provider: "openai",
    match: "gpt-4o",
    inputPer1kUsd: 0.005,
    outputPer1kUsd: 0.015,
  },
  {
    provider: "openai",
    match: "gpt-4o-mini",
    inputPer1kUsd: 0.00015,
    outputPer1kUsd: 0.0006,
  },
  {
    provider: "openai",
    match: "gpt-3.5",
    inputPer1kUsd: 0.0005,
    outputPer1kUsd: 0.0015,
  },
  {
    provider: "claude",
    match: "claude-3.7-sonnet",
    inputPer1kUsd: 0.003,
    outputPer1kUsd: 0.015,
  },
  {
    provider: "claude",
    match: "claude-3.5-sonnet",
    inputPer1kUsd: 0.003,
    outputPer1kUsd: 0.015,
  },
  {
    provider: "claude",
    match: "claude-3-haiku",
    inputPer1kUsd: 0.00025,
    outputPer1kUsd: 0.00125,
  },
  {
    provider: "ollama",
    match: "*",
    inputPer1kUsd: 0,
    outputPer1kUsd: 0,
  },
];

function normalizeRule(rule: PricingRule): PricingRule {
  return {
    provider: rule.provider,
    match: rule.match.trim().toLowerCase(),
    inputPer1kUsd: Number(rule.inputPer1kUsd.toFixed(8)),
    outputPer1kUsd: Number(rule.outputPer1kUsd.toFixed(8)),
  };
}

export function loadPricingConfig(): PricingConfig {
  try {
    const raw = fs.readFileSync(PRICING_PATH, "utf-8");
    const parsed = JSON.parse(raw) as PricingConfig;
    if (!Array.isArray(parsed.rules)) {
      throw new Error("Invalid pricing rules");
    }

    return {
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      rules: parsed.rules
        .filter((rule) => {
          return (
            rule &&
            (rule.provider === "openai" ||
              rule.provider === "claude" ||
              rule.provider === "ollama") &&
            typeof rule.match === "string" &&
            typeof rule.inputPer1kUsd === "number" &&
            typeof rule.outputPer1kUsd === "number"
          );
        })
        .map((rule) => normalizeRule(rule)),
    };
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      rules: DEFAULT_RULES.map((rule) => normalizeRule(rule)),
    };
  }
}

export function savePricingConfig(config: PricingConfig): void {
  writePrivateFile(PRICING_PATH, JSON.stringify(config, null, 2));
}

export function upsertPricingRule(rule: PricingRule): PricingConfig {
  const current = loadPricingConfig();
  const normalized = normalizeRule(rule);

  const nextRules = current.rules.filter(
    (item) =>
      !(
        item.provider === normalized.provider && item.match === normalized.match
      ),
  );
  nextRules.push(normalized);

  const updated: PricingConfig = {
    updatedAt: new Date().toISOString(),
    rules: nextRules.sort((left, right) => {
      if (left.provider === right.provider) {
        return left.match.localeCompare(right.match);
      }
      return left.provider.localeCompare(right.provider);
    }),
  };

  savePricingConfig(updated);
  return updated;
}

export function deletePricingRule(
  provider: PricingProvider,
  match: string,
): PricingConfig {
  const current = loadPricingConfig();
  const normalizedMatch = match.trim().toLowerCase();
  const updated: PricingConfig = {
    updatedAt: new Date().toISOString(),
    rules: current.rules.filter(
      (item) => !(item.provider === provider && item.match === normalizedMatch),
    ),
  };

  savePricingConfig(updated);
  return updated;
}
