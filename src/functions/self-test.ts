import fs from "node:fs";
import os from "node:os";
import { loadAppConfig } from "../config/app.js";
import { loadCapabilitiesConfig } from "../config/capabilities.js";
import { getConfigDir, getRequestHistoryPath } from "../config/paths.js";
import { getResponseCacheStats } from "../utils/response-cache.js";
import { listIntegrations } from "../config/integrations.js";
import { listSchedulerJobs } from "../config/scheduler.js";
import { listAutomationRules } from "../config/automations.js";
import { listHooks } from "../config/hooks.js";
import { listStandingOrders } from "../config/standing-orders.js";
import { listTaskFlows } from "../config/task-flow.js";
import { loadHeartbeatConfig } from "../config/heartbeat.js";

export interface SelfTestCheck {
  name: string;
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface SelfTestReport {
  ok: boolean;
  timestamp: string;
  checks: SelfTestCheck[];
}

export function runSystemSelfTest(): SelfTestReport {
  const checks: SelfTestCheck[] = [];

  try {
    const app = loadAppConfig();
    checks.push({
      name: "gateway.auth",
      ok: Boolean(app.apiKey?.trim()),
      message: app.apiKey?.trim() ? "API key configured" : "API key missing",
    });
  } catch (error) {
    checks.push({
      name: "gateway.auth",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const configDir = getConfigDir();
    fs.mkdirSync(configDir, { recursive: true });
    fs.accessSync(configDir, fs.constants.R_OK | fs.constants.W_OK);
    checks.push({
      name: "storage.config_dir",
      ok: true,
      message: "Config directory readable and writable",
      details: {
        path: configDir,
      },
    });
  } catch (error) {
    checks.push({
      name: "storage.config_dir",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const historyPath = getRequestHistoryPath();
    if (!fs.existsSync(historyPath)) {
      fs.writeFileSync(historyPath, "", "utf-8");
    }
    fs.accessSync(historyPath, fs.constants.R_OK | fs.constants.W_OK);
    checks.push({
      name: "storage.history",
      ok: true,
      message: "History file ready",
      details: {
        path: historyPath,
      },
    });
  } catch (error) {
    checks.push({
      name: "storage.history",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const stats = getResponseCacheStats();
    checks.push({
      name: "cache.health",
      ok: true,
      message: "Cache metadata loaded",
      details: stats as unknown as Record<string, unknown>,
    });
  } catch (error) {
    checks.push({
      name: "cache.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const capabilities = loadCapabilitiesConfig().values;
    checks.push({
      name: "capabilities.health",
      ok: true,
      message: "Capabilities loaded",
      details: {
        enabled: Object.values(capabilities).filter(Boolean).length,
        total: Object.values(capabilities).length,
      },
    });
  } catch (error) {
    checks.push({
      name: "capabilities.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const integrations = listIntegrations();
    checks.push({
      name: "integrations.health",
      ok: true,
      message: "Integrations loaded",
      details: {
        total: integrations.length,
        enabled: integrations.filter((item) => item.enabled).length,
      },
    });
  } catch (error) {
    checks.push({
      name: "integrations.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const jobs = listSchedulerJobs();
    checks.push({
      name: "scheduler.health",
      ok: true,
      message: "Scheduler jobs loaded",
      details: {
        total: jobs.length,
        enabled: jobs.filter((job) => job.enabled).length,
      },
    });
  } catch (error) {
    checks.push({
      name: "scheduler.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const rules = listAutomationRules();
    checks.push({
      name: "automations.health",
      ok: true,
      message: "Automation rules loaded",
      details: {
        total: rules.length,
        enabled: rules.filter((rule) => rule.enabled).length,
      },
    });
  } catch (error) {
    checks.push({
      name: "automations.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const hooks = listHooks();
    checks.push({
      name: "hooks.health",
      ok: true,
      message: "Hooks loaded",
      details: {
        total: hooks.length,
        enabled: hooks.filter((hook) => hook.enabled).length,
      },
    });
  } catch (error) {
    checks.push({
      name: "hooks.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const orders = listStandingOrders();
    checks.push({
      name: "standing-orders.health",
      ok: true,
      message: "Standing orders loaded",
      details: {
        total: orders.length,
        enabled: orders.filter((order) => order.enabled).length,
      },
    });
  } catch (error) {
    checks.push({
      name: "standing-orders.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const flows = listTaskFlows();
    checks.push({
      name: "task-flow.health",
      ok: true,
      message: "Task flows loaded",
      details: {
        total: flows.length,
        enabled: flows.filter((flow) => flow.enabled).length,
      },
    });
  } catch (error) {
    checks.push({
      name: "task-flow.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const heartbeat = loadHeartbeatConfig();
    checks.push({
      name: "heartbeat.health",
      ok: true,
      message: "Heartbeat config loaded",
      details: {
        enabled: heartbeat.enabled,
        intervalMinutes: heartbeat.intervalMinutes,
        provider: heartbeat.provider,
      },
    });
  } catch (error) {
    checks.push({
      name: "heartbeat.health",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  checks.push({
    name: "runtime.node",
    ok: true,
    message: "Runtime info",
    details: {
      node: process.version,
      platform: process.platform,
      host: os.hostname(),
      pid: process.pid,
    },
  });

  return {
    ok: checks.every((check) => check.ok),
    timestamp: new Date().toISOString(),
    checks,
  };
}
