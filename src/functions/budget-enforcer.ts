import { loadBudgetConfig } from "../config/budget.js";
import {
  filterRequestHistoryByDays,
  readRequestHistory,
} from "../utils/request-history.js";
import { summarizeCosts } from "../utils/costs.js";

export interface BudgetStatus {
  enabled: boolean;
  dailySpentUsd: number;
  monthlySpentUsd: number;
  dailyRemainingUsd: number;
  monthlyRemainingUsd: number;
  alert: boolean;
  blocked: boolean;
}

export interface BudgetDecision {
  allowed: boolean;
  reason?: string;
  estimatedCostUsd?: number;
  status: BudgetStatus;
}

export function getBudgetStatus(): BudgetStatus {
  const config = loadBudgetConfig();
  const entries = readRequestHistory(20_000);
  const daily = summarizeCosts(filterRequestHistoryByDays(entries, 1));
  const monthly = summarizeCosts(filterRequestHistoryByDays(entries, 30));

  const dailyRemaining = Math.max(
    0,
    config.dailyUsdLimit - daily.totalEstimatedCostUsd,
  );
  const monthlyRemaining = Math.max(
    0,
    config.monthlyUsdLimit - monthly.totalEstimatedCostUsd,
  );

  const dailyRatio =
    config.dailyUsdLimit > 0
      ? daily.totalEstimatedCostUsd / config.dailyUsdLimit
      : 0;
  const monthlyRatio =
    config.monthlyUsdLimit > 0
      ? monthly.totalEstimatedCostUsd / config.monthlyUsdLimit
      : 0;

  const alert =
    config.enabled &&
    (dailyRatio >= config.alertThresholdRatio ||
      monthlyRatio >= config.alertThresholdRatio);
  const blocked =
    config.enabled && (dailyRemaining <= 0 || monthlyRemaining <= 0);

  return {
    enabled: config.enabled,
    dailySpentUsd: Number(daily.totalEstimatedCostUsd.toFixed(6)),
    monthlySpentUsd: Number(monthly.totalEstimatedCostUsd.toFixed(6)),
    dailyRemainingUsd: Number(dailyRemaining.toFixed(6)),
    monthlyRemainingUsd: Number(monthlyRemaining.toFixed(6)),
    alert,
    blocked,
  };
}

export function evaluateBudgetRequest(input: {
  estimatedCostUsd: number;
}): BudgetDecision {
  const config = loadBudgetConfig();
  const status = getBudgetStatus();

  if (!config.enabled) {
    return {
      allowed: true,
      estimatedCostUsd: Number(input.estimatedCostUsd.toFixed(6)),
      status,
    };
  }

  const estimated = Number.isFinite(input.estimatedCostUsd)
    ? Math.max(0, input.estimatedCostUsd)
    : 0;

  if (status.blocked) {
    return {
      allowed: false,
      reason: "Daily or monthly budget limit reached",
      estimatedCostUsd: Number(estimated.toFixed(6)),
      status,
    };
  }

  if (estimated > config.perRequestUsdLimit) {
    return {
      allowed: false,
      reason: `Estimated request cost exceeds per-request limit (${config.perRequestUsdLimit} USD)`,
      estimatedCostUsd: Number(estimated.toFixed(6)),
      status,
    };
  }

  if (estimated > status.dailyRemainingUsd) {
    return {
      allowed: false,
      reason: "Estimated request cost exceeds remaining daily budget",
      estimatedCostUsd: Number(estimated.toFixed(6)),
      status,
    };
  }

  if (estimated > status.monthlyRemainingUsd) {
    return {
      allowed: false,
      reason: "Estimated request cost exceeds remaining monthly budget",
      estimatedCostUsd: Number(estimated.toFixed(6)),
      status,
    };
  }

  return {
    allowed: true,
    estimatedCostUsd: Number(estimated.toFixed(6)),
    status,
  };
}
