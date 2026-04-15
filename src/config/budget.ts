import fs from "node:fs";
import { getBudgetPath, writePrivateFile } from "./paths.js";

export interface BudgetConfig {
  enabled: boolean;
  dailyUsdLimit: number;
  monthlyUsdLimit: number;
  perRequestUsdLimit: number;
  alertThresholdRatio: number;
  updatedAt: string;
}

const DEFAULT_BUDGET: BudgetConfig = {
  enabled: false,
  dailyUsdLimit: 10,
  monthlyUsdLimit: 200,
  perRequestUsdLimit: 1,
  alertThresholdRatio: 0.8,
  updatedAt: new Date().toISOString(),
};

export function loadBudgetConfig(): BudgetConfig {
  try {
    const raw = fs.readFileSync(getBudgetPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<BudgetConfig>;
    return {
      enabled: parsed.enabled === true,
      dailyUsdLimit:
        typeof parsed.dailyUsdLimit === "number" &&
        Number.isFinite(parsed.dailyUsdLimit)
          ? Math.max(0, parsed.dailyUsdLimit)
          : DEFAULT_BUDGET.dailyUsdLimit,
      monthlyUsdLimit:
        typeof parsed.monthlyUsdLimit === "number" &&
        Number.isFinite(parsed.monthlyUsdLimit)
          ? Math.max(0, parsed.monthlyUsdLimit)
          : DEFAULT_BUDGET.monthlyUsdLimit,
      perRequestUsdLimit:
        typeof parsed.perRequestUsdLimit === "number" &&
        Number.isFinite(parsed.perRequestUsdLimit)
          ? Math.max(0, parsed.perRequestUsdLimit)
          : DEFAULT_BUDGET.perRequestUsdLimit,
      alertThresholdRatio:
        typeof parsed.alertThresholdRatio === "number" &&
        Number.isFinite(parsed.alertThresholdRatio)
          ? Math.min(1, Math.max(0.1, parsed.alertThresholdRatio))
          : DEFAULT_BUDGET.alertThresholdRatio,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_BUDGET };
  }
}

export function saveBudgetConfig(config: BudgetConfig): void {
  writePrivateFile(getBudgetPath(), JSON.stringify(config, null, 2));
}

export function updateBudgetConfig(
  partial: Partial<BudgetConfig>,
): BudgetConfig {
  const current = loadBudgetConfig();
  const next: BudgetConfig = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveBudgetConfig(next);
  return next;
}
