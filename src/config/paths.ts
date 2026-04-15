import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".openokapi");
const DISCORD_CONFIG_PATH = path.join(CONFIG_DIR, "discord.json");
const DISCORD_PID_PATH = path.join(CONFIG_DIR, "discord.pid");
const DISCORD_LOG_PATH = path.join(CONFIG_DIR, "discord.log");
const OPENAI_CONFIG_PATH = path.join(CONFIG_DIR, "openai.json");
const OPENAI_MODELS_PATH = path.join(CONFIG_DIR, "openai-models.json");
const CLAUDE_CONFIG_PATH = path.join(CONFIG_DIR, "claude.json");
const CLAUDE_MODELS_PATH = path.join(CONFIG_DIR, "claude-models.json");
const OLLAMA_CONFIG_PATH = path.join(CONFIG_DIR, "ollama.json");
const OLLAMA_MODELS_PATH = path.join(CONFIG_DIR, "ollama-models.json");
const PROFILES_PATH = path.join(CONFIG_DIR, "profiles.json");
const CACHE_CONFIG_PATH = path.join(CONFIG_DIR, "cache.json");
const RESPONSE_CACHE_PATH = path.join(CONFIG_DIR, "response-cache.json");
const CONVERSATIONS_PATH = path.join(CONFIG_DIR, "conversations.json");
const CAPABILITIES_PATH = path.join(CONFIG_DIR, "capabilities.json");
const INTEGRATIONS_PATH = path.join(CONFIG_DIR, "integrations.json");
const INTEGRATIONS_DLQ_PATH = path.join(CONFIG_DIR, "integrations-dlq.json");
const ROUTER_POLICY_PATH = path.join(CONFIG_DIR, "router-policy.json");
const GUARDRAILS_PATH = path.join(CONFIG_DIR, "guardrails.json");
const BUDGET_PATH = path.join(CONFIG_DIR, "budget.json");
const AUTOMATIONS_PATH = path.join(CONFIG_DIR, "automations.json");
const SCHEDULER_JOBS_PATH = path.join(CONFIG_DIR, "scheduler-jobs.json");
const HOOKS_PATH = path.join(CONFIG_DIR, "hooks.json");
const STANDING_ORDERS_PATH = path.join(CONFIG_DIR, "standing-orders.json");
const TASK_FLOWS_PATH = path.join(CONFIG_DIR, "task-flows.json");
const HEARTBEAT_PATH = path.join(CONFIG_DIR, "heartbeat.json");
const TASKS_LEDGER_PATH = path.join(CONFIG_DIR, "tasks-ledger.json");
const INCIDENTS_PATH = path.join(CONFIG_DIR, "incidents.json");
const MAINTENANCE_WINDOWS_PATH = path.join(
  CONFIG_DIR,
  "maintenance-windows.json",
);
const ESCALATIONS_PATH = path.join(CONFIG_DIR, "escalations.json");
const APP_CONFIG_PATH = path.join(CONFIG_DIR, "openokapi.json");
const REQUEST_HISTORY_PATH = path.join(CONFIG_DIR, "history.jsonl");
const PRIVATE_FILE_MODE = 0o600;
const PRIVATE_DIR_MODE = 0o700;

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getDiscordConfigPath(): string {
  return DISCORD_CONFIG_PATH;
}

export function getDiscordPidPath(): string {
  return DISCORD_PID_PATH;
}

export function getDiscordLogPath(): string {
  return DISCORD_LOG_PATH;
}

export function getOpenAIConfigPath(): string {
  return OPENAI_CONFIG_PATH;
}

export function getOpenAIModelsPath(): string {
  return OPENAI_MODELS_PATH;
}

export function getClaudeConfigPath(): string {
  return CLAUDE_CONFIG_PATH;
}

export function getClaudeModelsPath(): string {
  return CLAUDE_MODELS_PATH;
}

export function getOllamaConfigPath(): string {
  return OLLAMA_CONFIG_PATH;
}

export function getOllamaModelsPath(): string {
  return OLLAMA_MODELS_PATH;
}

export function getProfilesPath(): string {
  return PROFILES_PATH;
}

export function getCacheConfigPath(): string {
  return CACHE_CONFIG_PATH;
}

export function getResponseCachePath(): string {
  return RESPONSE_CACHE_PATH;
}

export function getConversationsPath(): string {
  return CONVERSATIONS_PATH;
}

export function getCapabilitiesPath(): string {
  return CAPABILITIES_PATH;
}

export function getIntegrationsPath(): string {
  return INTEGRATIONS_PATH;
}

export function getIntegrationsDlqPath(): string {
  return INTEGRATIONS_DLQ_PATH;
}

export function getRouterPolicyPath(): string {
  return ROUTER_POLICY_PATH;
}

export function getGuardrailsPath(): string {
  return GUARDRAILS_PATH;
}

export function getBudgetPath(): string {
  return BUDGET_PATH;
}

export function getAutomationsPath(): string {
  return AUTOMATIONS_PATH;
}

export function getSchedulerJobsPath(): string {
  return SCHEDULER_JOBS_PATH;
}

export function getHooksPath(): string {
  return HOOKS_PATH;
}

export function getStandingOrdersPath(): string {
  return STANDING_ORDERS_PATH;
}

export function getTaskFlowsPath(): string {
  return TASK_FLOWS_PATH;
}

export function getHeartbeatPath(): string {
  return HEARTBEAT_PATH;
}

export function getTasksLedgerPath(): string {
  return TASKS_LEDGER_PATH;
}

export function getIncidentsPath(): string {
  return INCIDENTS_PATH;
}

export function getMaintenanceWindowsPath(): string {
  return MAINTENANCE_WINDOWS_PATH;
}

export function getEscalationsPath(): string {
  return ESCALATIONS_PATH;
}

export function getAppConfigPath(): string {
  return APP_CONFIG_PATH;
}

export function getRequestHistoryPath(): string {
  return REQUEST_HISTORY_PATH;
}

export function ensureConfigDir(): void {
  fs.mkdirSync(CONFIG_DIR, {
    recursive: true,
    mode: PRIVATE_DIR_MODE,
  });

  try {
    fs.chmodSync(CONFIG_DIR, PRIVATE_DIR_MODE);
  } catch {
    // ignore permission hardening failures
  }
}

export function writePrivateFile(filePath: string, contents: string): void {
  ensureConfigDir();
  fs.writeFileSync(filePath, contents, {
    encoding: "utf-8",
    mode: PRIVATE_FILE_MODE,
  });

  try {
    fs.chmodSync(filePath, PRIVATE_FILE_MODE);
  } catch {
    // ignore permission hardening failures
  }
}

export function ensurePrivateFile(filePath: string): void {
  ensureConfigDir();

  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "", {
        encoding: "utf-8",
        mode: PRIVATE_FILE_MODE,
      });
    }

    fs.chmodSync(filePath, PRIVATE_FILE_MODE);
  } catch {
    // ignore permission hardening failures
  }
}
