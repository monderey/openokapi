import fs from "node:fs";
import { getRouterPolicyPath, writePrivateFile } from "./paths.js";

export type RoutingStrategy = "balanced" | "cost" | "speed" | "reliability";
export type Provider = "openai" | "claude" | "ollama";

export interface RouterPolicy {
  strategy: RoutingStrategy;
  enabledProviders: Provider[];
  preferredModels: Partial<Record<Provider, string>>;
  maxLatencyMs: number;
  maxCostUsdPerRequest: number;
  updatedAt: string;
}

const DEFAULT_POLICY: RouterPolicy = {
  strategy: "balanced",
  enabledProviders: ["openai", "claude", "ollama"],
  preferredModels: {},
  maxLatencyMs: 30_000,
  maxCostUsdPerRequest: 0.1,
  updatedAt: new Date().toISOString(),
};

export function loadRouterPolicy(): RouterPolicy {
  try {
    const raw = fs.readFileSync(getRouterPolicyPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<RouterPolicy>;

    return {
      strategy:
        parsed.strategy === "balanced" ||
        parsed.strategy === "cost" ||
        parsed.strategy === "speed" ||
        parsed.strategy === "reliability"
          ? parsed.strategy
          : DEFAULT_POLICY.strategy,
      enabledProviders: Array.isArray(parsed.enabledProviders)
        ? parsed.enabledProviders.filter(
            (provider): provider is Provider =>
              provider === "openai" ||
              provider === "claude" ||
              provider === "ollama",
          )
        : DEFAULT_POLICY.enabledProviders,
      preferredModels:
        parsed.preferredModels && typeof parsed.preferredModels === "object"
          ? parsed.preferredModels
          : {},
      maxLatencyMs:
        typeof parsed.maxLatencyMs === "number" &&
        Number.isFinite(parsed.maxLatencyMs)
          ? Math.max(1_000, Math.floor(parsed.maxLatencyMs))
          : DEFAULT_POLICY.maxLatencyMs,
      maxCostUsdPerRequest:
        typeof parsed.maxCostUsdPerRequest === "number" &&
        Number.isFinite(parsed.maxCostUsdPerRequest)
          ? Math.max(0, parsed.maxCostUsdPerRequest)
          : DEFAULT_POLICY.maxCostUsdPerRequest,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_POLICY };
  }
}

export function saveRouterPolicy(policy: RouterPolicy): void {
  writePrivateFile(getRouterPolicyPath(), JSON.stringify(policy, null, 2));
}

export function updateRouterPolicy(
  partial: Partial<RouterPolicy>,
): RouterPolicy {
  const current = loadRouterPolicy();
  const next: RouterPolicy = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  saveRouterPolicy(next);
  return next;
}
