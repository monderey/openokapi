import fs from "node:fs";
import { getCapabilitiesPath, writePrivateFile } from "./paths.js";

export const CAPABILITY_KEYS = [
  "smart_routing",
  "dynamic_failover",
  "provider_health_scoring",
  "cost_aware_execution",
  "latency_aware_execution",
  "quality_aware_execution",
  "prompt_profiles",
  "prompt_variants_ab",
  "conversation_memory",
  "conversation_auto_summary",
  "response_cache",
  "cache_replay",
  "per_provider_cache_policy",
  "per_model_cache_policy",
  "cost_analytics",
  "token_analytics",
  "pricing_rules",
  "budget_daily_limits",
  "budget_monthly_limits",
  "guardrails_blocklist",
  "guardrails_redaction",
  "safe_output_filter",
  "webhook_integrations",
  "slack_notifications",
  "telegram_notifications",
  "github_events_bridge",
  "jira_events_bridge",
  "audit_export",
  "evaluation_harness",
  "automation_rules",
  "event_hooks",
  "heartbeat_jobs",
  "standing_orders",
  "scheduler_jobs",
  "task_flow",
  "plugin_runtime",
  "extension_marketplace",
  "team_workspaces",
  "access_policies",
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];

export type CapabilitiesConfig = {
  updatedAt: string;
  values: Record<CapabilityKey, boolean>;
};

function defaultValues(): Record<CapabilityKey, boolean> {
  return Object.fromEntries(
    CAPABILITY_KEYS.map((key) => [key, true]),
  ) as Record<CapabilityKey, boolean>;
}

export function loadCapabilitiesConfig(): CapabilitiesConfig {
  try {
    const raw = fs.readFileSync(getCapabilitiesPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<CapabilitiesConfig>;
    const values = defaultValues();

    if (parsed.values) {
      for (const key of CAPABILITY_KEYS) {
        if (typeof parsed.values[key] === "boolean") {
          values[key] = parsed.values[key];
        }
      }
    }

    return {
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      values,
    };
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      values: defaultValues(),
    };
  }
}

export function saveCapabilitiesConfig(config: CapabilitiesConfig): void {
  writePrivateFile(getCapabilitiesPath(), JSON.stringify(config, null, 2));
}

export function setCapability(
  key: CapabilityKey,
  enabled: boolean,
): CapabilitiesConfig {
  const current = loadCapabilitiesConfig();
  const updated: CapabilitiesConfig = {
    updatedAt: new Date().toISOString(),
    values: {
      ...current.values,
      [key]: enabled,
    },
  };

  saveCapabilitiesConfig(updated);
  return updated;
}
