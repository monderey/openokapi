import { loadCapabilitiesConfig } from "../config/capabilities.js";
import { dispatchIntegrationEvent } from "./integrations-dispatch.js";
import { runAutomationRules, type AutomationExecution } from "./automations.js";
import { runHooksForEvent, type HookExecution } from "./hooks.js";

export interface PlatformEventResult {
  event: string;
  integrations:
    | {
        attempted: number;
        delivered: number;
      }
    | undefined;
  automations:
    | {
        evaluated: number;
        matched: number;
        failed: number;
        executions: AutomationExecution[];
      }
    | undefined;
  hooks:
    | {
        evaluated: number;
        matched: number;
        failed: number;
        executions: HookExecution[];
      }
    | undefined;
}

export async function emitPlatformEvent(input: {
  event: string;
  payload: Record<string, unknown>;
}): Promise<PlatformEventResult> {
  const capabilities = loadCapabilitiesConfig().values;

  let integrations: PlatformEventResult["integrations"];
  if (capabilities.webhook_integrations) {
    const results = await dispatchIntegrationEvent({
      event: input.event,
      payload: input.payload,
    });
    integrations = {
      attempted: results.length,
      delivered: results.filter((result) => result.delivered).length,
    };
  }

  let automations: PlatformEventResult["automations"];
  if (capabilities.automation_rules) {
    const executions = await runAutomationRules({
      event: input.event,
      payload: input.payload,
    });
    automations = {
      evaluated: executions.length,
      matched: executions.filter((execution) => execution.matched).length,
      failed: executions.filter(
        (execution) =>
          Boolean(execution.error) ||
          execution.actionResults.some((result) => !result.ok),
      ).length,
      executions,
    };
  }

  let hooks: PlatformEventResult["hooks"];
  if (capabilities.event_hooks) {
    const executions = await runHooksForEvent({
      event: input.event,
      payload: input.payload,
    });
    hooks = {
      evaluated: executions.length,
      matched: executions.filter((execution) => execution.matched).length,
      failed: executions.filter(
        (execution) =>
          Boolean(execution.error) ||
          execution.actionResults.some((result) => !result.ok),
      ).length,
      executions,
    };
  }

  return {
    event: input.event,
    integrations,
    automations,
    hooks,
  };
}
