import fs from "node:fs";
import path from "node:path";
import {
  getAppConfigPath,
  getAutomationsPath,
  getBudgetPath,
  getCacheConfigPath,
  getCapabilitiesPath,
  getClaudeConfigPath,
  getClaudeModelsPath,
  getConfigDir,
  getConversationsPath,
  getDiscordConfigPath,
  getDiscordLogPath,
  getDiscordPidPath,
  getEscalationsPath,
  getGuardrailsPath,
  getHeartbeatPath,
  getHooksPath,
  getIncidentsPath,
  getIntegrationsDlqPath,
  getIntegrationsPath,
  getMaintenanceWindowsPath,
  getOllamaConfigPath,
  getOllamaModelsPath,
  getOpenAIConfigPath,
  getOpenAIModelsPath,
  getProfilesPath,
  getRequestHistoryPath,
  getResponseCachePath,
  getRouterPolicyPath,
  getSchedulerJobsPath,
  getStandingOrdersPath,
  getTaskFlowsPath,
  getTasksLedgerPath,
} from "../config/paths.js";

export type ResetScope = "config" | "config+history" | "full";

export interface ResetTarget {
  path: string;
  exists: boolean;
  kind: "file" | "directory" | "missing";
  sizeBytes: number;
}

export interface ResetResult {
  scope: ResetScope;
  dryRun: boolean;
  targets: ResetTarget[];
  removed: string[];
  skipped: string[];
}

function getConfigTargets(): string[] {
  return [
    getAppConfigPath(),
    getDiscordConfigPath(),
    getDiscordPidPath(),
    getDiscordLogPath(),
    getOpenAIConfigPath(),
    getOpenAIModelsPath(),
    getClaudeConfigPath(),
    getClaudeModelsPath(),
    getOllamaConfigPath(),
    getOllamaModelsPath(),
    getProfilesPath(),
    getCacheConfigPath(),
    getResponseCachePath(),
    getConversationsPath(),
    getCapabilitiesPath(),
    getIntegrationsPath(),
    getIntegrationsDlqPath(),
    getRouterPolicyPath(),
    getGuardrailsPath(),
    getBudgetPath(),
    getAutomationsPath(),
    getSchedulerJobsPath(),
    getHooksPath(),
    getStandingOrdersPath(),
    getTaskFlowsPath(),
    getHeartbeatPath(),
    getTasksLedgerPath(),
    getIncidentsPath(),
    getMaintenanceWindowsPath(),
    getEscalationsPath(),
  ];
}

function dirSizeBytes(dirPath: string): number {
  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += dirSizeBytes(absolute);
      continue;
    }
    if (entry.isFile()) {
      total += fs.statSync(absolute).size;
    }
  }
  return total;
}

function describeTarget(targetPath: string): ResetTarget {
  if (!fs.existsSync(targetPath)) {
    return {
      path: targetPath,
      exists: false,
      kind: "missing",
      sizeBytes: 0,
    };
  }

  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    return {
      path: targetPath,
      exists: true,
      kind: "directory",
      sizeBytes: dirSizeBytes(targetPath),
    };
  }

  return {
    path: targetPath,
    exists: true,
    kind: "file",
    sizeBytes: stats.size,
  };
}

function resolveScopeTargets(scope: ResetScope): string[] {
  if (scope === "full") {
    return [getConfigDir()];
  }

  const targets = [...getConfigTargets()];
  if (scope === "config+history") {
    targets.push(getRequestHistoryPath());
  }

  return [...new Set(targets)];
}

export function runReset(input: {
  scope: ResetScope;
  dryRun?: boolean;
}): ResetResult {
  const dryRun = input.dryRun === true;
  const targetPaths = resolveScopeTargets(input.scope);
  const targets = targetPaths.map(describeTarget);

  const removed: string[] = [];
  const skipped: string[] = [];

  for (const target of targets) {
    if (!target.exists) {
      skipped.push(target.path);
      continue;
    }

    if (dryRun) {
      skipped.push(target.path);
      continue;
    }

    if (target.kind === "directory") {
      fs.rmSync(target.path, { recursive: true, force: true });
      removed.push(target.path);
      continue;
    }

    fs.rmSync(target.path, { force: true });
    removed.push(target.path);
  }

  return {
    scope: input.scope,
    dryRun,
    targets,
    removed,
    skipped,
  };
}
