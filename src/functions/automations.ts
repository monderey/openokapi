import {
  listAutomationRules,
  markAutomationRuleRun,
  type AutomationAction,
  type AutomationCondition,
} from "../config/automations.js";
import { dispatchIntegrationEvent } from "./integrations-dispatch.js";
import { setCapability } from "../config/capabilities.js";
import {
  updateRouterPolicy,
  type RoutingStrategy,
} from "../config/router-policy.js";

function getByPath(input: Record<string, unknown>, path: string): unknown {
  const parts = path
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean);
  let current: unknown = input;
  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function conditionMatches(
  payload: Record<string, unknown>,
  condition: AutomationCondition,
): boolean {
  const value = getByPath(payload, condition.path);

  if (typeof condition.exists === "boolean") {
    const exists = value !== undefined && value !== null;
    if (exists !== condition.exists) {
      return false;
    }
  }

  if (condition.equals !== undefined) {
    if (value !== condition.equals) {
      return false;
    }
  }

  if (condition.contains !== undefined) {
    if (typeof value !== "string") {
      return false;
    }
    if (!value.includes(condition.contains)) {
      return false;
    }
  }

  return true;
}

async function executeAction(
  action: AutomationAction,
  event: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  if (action.type === "dispatchIntegration") {
    const results = await dispatchIntegrationEvent({
      event: action.event,
      payload: {
        sourceEvent: event,
        sourcePayload: payload,
        ...(action.payload || {}),
      },
    });
    const failed = results.filter((item) => !item.delivered).length;
    return {
      ok: failed === 0,
      message: `dispatchIntegration (${results.length} targets, failed=${failed})`,
    };
  }

  if (action.type === "setCapability") {
    setCapability(action.key, action.enabled);
    return {
      ok: true,
      message: `setCapability ${action.key}=${action.enabled}`,
    };
  }

  if (action.type === "setRouterStrategy") {
    updateRouterPolicy({
      strategy: action.strategy as RoutingStrategy,
    });
    return {
      ok: true,
      message: `setRouterStrategy ${action.strategy}`,
    };
  }

  if (action.type === "log") {
    return {
      ok: true,
      message: action.message,
    };
  }

  return {
    ok: false,
    message: "Unknown action",
  };
}

export interface AutomationExecution {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actionsExecuted: number;
  actionResults: Array<{ ok: boolean; message: string }>;
  error?: string;
}

export async function runAutomationRules(input: {
  event: string;
  payload: Record<string, unknown>;
}): Promise<AutomationExecution[]> {
  const rules = listAutomationRules().filter(
    (rule) => rule.enabled && rule.event === input.event,
  );

  const executions: AutomationExecution[] = [];
  for (const rule of rules) {
    try {
      const matched = rule.conditions.every((condition) =>
        conditionMatches(input.payload, condition),
      );

      if (!matched) {
        markAutomationRuleRun({
          id: rule.id,
          status: "skipped",
        });
        executions.push({
          ruleId: rule.id,
          ruleName: rule.name,
          matched: false,
          actionsExecuted: 0,
          actionResults: [],
        });
        continue;
      }

      const actionResults: Array<{ ok: boolean; message: string }> = [];
      for (const action of rule.actions) {
        const result = await executeAction(action, input.event, input.payload);
        actionResults.push(result);
      }

      const hasError = actionResults.some((result) => !result.ok);
      const runMeta: {
        id: string;
        status: "matched" | "failed";
        error?: string;
      } = {
        id: rule.id,
        status: hasError ? "failed" : "matched",
      };
      if (hasError) {
        runMeta.error = actionResults
          .filter((result) => !result.ok)
          .map((result) => result.message)
          .join("; ");
      }
      markAutomationRuleRun(runMeta);

      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched: true,
        actionsExecuted: rule.actions.length,
        actionResults,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      markAutomationRuleRun({
        id: rule.id,
        status: "failed",
        error: message,
      });
      executions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched: true,
        actionsExecuted: 0,
        actionResults: [],
        error: message,
      });
    }
  }

  return executions;
}
