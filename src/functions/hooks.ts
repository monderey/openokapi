import {
  listHooks,
  markHookRun,
  type HookAction,
  type HookCondition,
} from "../config/hooks.js";
import { dispatchIntegrationEvent } from "./integrations-dispatch.js";
import { runAutomationRules } from "./automations.js";
import { setCapability } from "../config/capabilities.js";
import { updateRouterPolicy } from "../config/router-policy.js";

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
  condition: HookCondition,
): boolean {
  const value = getByPath(payload, condition.path);

  if (typeof condition.exists === "boolean") {
    const exists = value !== undefined && value !== null;
    if (exists !== condition.exists) {
      return false;
    }
  }

  if (condition.equals !== undefined && value !== condition.equals) {
    return false;
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

async function executeHookAction(
  action: HookAction,
  event: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  if (action.type === "log") {
    return {
      ok: true,
      message: action.message,
    };
  }

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

  if (action.type === "runAutomation") {
    const nextEvent = action.event || event;
    const executions = await runAutomationRules({
      event: nextEvent,
      payload: {
        sourceEvent: event,
        sourcePayload: payload,
        ...(action.payload || {}),
      },
    });

    const failed = executions.filter(
      (execution) =>
        Boolean(execution.error) ||
        execution.actionResults.some((item) => !item.ok),
    ).length;

    return {
      ok: failed === 0,
      message: `runAutomation (${executions.length} rules, failed=${failed})`,
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
    updateRouterPolicy({ strategy: action.strategy });
    return {
      ok: true,
      message: `setRouterStrategy ${action.strategy}`,
    };
  }

  return {
    ok: false,
    message: "Unknown hook action",
  };
}

export interface HookExecution {
  hookId: string;
  hookName: string;
  matched: boolean;
  actionsExecuted: number;
  actionResults: Array<{ ok: boolean; message: string }>;
  error?: string;
}

export async function runHooksForEvent(input: {
  event: string;
  payload: Record<string, unknown>;
}): Promise<HookExecution[]> {
  const hooks = listHooks().filter(
    (hook) => hook.enabled && hook.event === input.event,
  );

  const executions: HookExecution[] = [];

  for (const hook of hooks) {
    try {
      const matched = hook.conditions.every((condition) =>
        conditionMatches(input.payload, condition),
      );

      if (!matched) {
        markHookRun({ id: hook.id, status: "skipped" });
        executions.push({
          hookId: hook.id,
          hookName: hook.name,
          matched: false,
          actionsExecuted: 0,
          actionResults: [],
        });
        continue;
      }

      const actionResults: Array<{ ok: boolean; message: string }> = [];
      for (const action of hook.actions) {
        const result = await executeHookAction(
          action,
          input.event,
          input.payload,
        );
        actionResults.push(result);
      }

      const hasError = actionResults.some((result) => !result.ok);
      const runMeta: {
        id: string;
        status: "matched" | "failed";
        error?: string;
      } = {
        id: hook.id,
        status: hasError ? "failed" : "matched",
      };
      if (hasError) {
        runMeta.error = actionResults
          .filter((result) => !result.ok)
          .map((result) => result.message)
          .join("; ");
      }
      markHookRun(runMeta);

      executions.push({
        hookId: hook.id,
        hookName: hook.name,
        matched: true,
        actionsExecuted: hook.actions.length,
        actionResults,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      markHookRun({
        id: hook.id,
        status: "failed",
        error: message,
      });
      executions.push({
        hookId: hook.id,
        hookName: hook.name,
        matched: true,
        actionsExecuted: 0,
        actionResults: [],
        error: message,
      });
    }
  }

  return executions;
}
