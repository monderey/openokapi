import {
  listEscalationRules,
  markEscalationRun,
  type EscalationRule,
} from "../config/escalations.js";
import { getAlertsReport } from "./alerts.js";
import { createIncident } from "./incidents.js";
import { dispatchIntegrationEvent } from "./integrations-dispatch.js";

export interface EscalationRunResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  triggered: boolean;
  incidentId?: string;
  deliveries?: number;
  failedDeliveries?: number;
  error?: string;
}

function ruleIsInCooldown(rule: EscalationRule, now = new Date()): boolean {
  if (!rule.lastTriggeredAt || rule.cooldownMinutes <= 0) {
    return false;
  }

  const last = Date.parse(rule.lastTriggeredAt);
  if (!Number.isFinite(last)) {
    return false;
  }

  return now.getTime() - last < rule.cooldownMinutes * 60_000;
}

function matchesRule(rule: EscalationRule): {
  matched: boolean;
  count: number;
} {
  const alerts = getAlertsReport({ deep: false, ignoreMute: true });
  if (alerts.summary.total === 0) {
    return { matched: false, count: 0 };
  }

  if (rule.trigger === "alerts.error") {
    const count = alerts.summary.error;
    return { matched: count >= rule.minCount, count };
  }

  if (rule.minSeverity === "error") {
    const count = alerts.summary.error;
    return { matched: count >= rule.minCount, count };
  }

  const count = alerts.summary.total;
  return { matched: count >= rule.minCount, count };
}

export async function runEscalationRules(input?: {
  force?: boolean;
  reason?: string;
}): Promise<EscalationRunResult[]> {
  const force = input?.force === true;
  const reason = input?.reason?.trim() || "manual";
  const rules = listEscalationRules().filter((rule) => rule.enabled);

  const results: EscalationRunResult[] = [];
  for (const rule of rules) {
    try {
      if (!force && ruleIsInCooldown(rule)) {
        markEscalationRun({ id: rule.id, status: "skipped" });
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          matched: false,
          triggered: false,
        });
        continue;
      }

      const check = matchesRule(rule);
      if (!check.matched) {
        markEscalationRun({ id: rule.id, status: "skipped" });
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          matched: false,
          triggered: false,
        });
        continue;
      }

      const alerts = getAlertsReport({
        deep: false,
        limit: 25,
        ignoreMute: true,
      });
      const deliveries = await dispatchIntegrationEvent({
        event: rule.integrationEvent,
        payload: {
          reason,
          escalationRuleId: rule.id,
          escalationRuleName: rule.name,
          trigger: rule.trigger,
          minSeverity: rule.minSeverity,
          minCount: rule.minCount,
          matchedCount: check.count,
          alertsSummary: alerts.summary,
          alerts: alerts.alerts,
        },
      });

      const failedDeliveries = deliveries.filter(
        (item) => !item.delivered,
      ).length;
      let incidentId: string | undefined;

      if (rule.autoCreateIncident) {
        const incident = createIncident({
          title: `Escalation ${rule.name}`,
          deep: false,
          alertLimit: 50,
          forceWhenMuted: true,
        });
        incidentId = incident.id;
      }

      markEscalationRun({
        id: rule.id,
        status: "triggered",
        incidentId,
      });

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched: true,
        triggered: true,
        incidentId,
        deliveries: deliveries.length,
        failedDeliveries,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      markEscalationRun({
        id: rule.id,
        status: "failed",
        error: message,
      });
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched: true,
        triggered: false,
        error: message,
      });
    }
  }

  return results;
}
