import fs from "node:fs";
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
import { loadAppConfig } from "../config/app.js";

const FILE_MODE = 0o600;
const DIR_MODE = 0o700;

export type SecuritySeverity = "warn" | "error";

export interface SecurityFinding {
  code: string;
  severity: SecuritySeverity;
  message: string;
  ref?: string;
}

export interface SecurityAuditReport {
  ok: boolean;
  timestamp: string;
  findings: SecurityFinding[];
  summary: {
    total: number;
    warn: number;
    error: number;
  };
  fixes?: {
    chmodDir: string[];
    chmodFile: string[];
  };
}

function modeBits(filePath: string): number | undefined {
  try {
    return fs.statSync(filePath).mode & 0o777;
  } catch {
    return undefined;
  }
}

function isModeTooOpen(mode: number, kind: "file" | "dir"): boolean {
  if (kind === "file") {
    return (mode & 0o077) !== 0;
  }
  return (mode & 0o077) !== 0;
}

function configFilePaths(): string[] {
  return [
    getAppConfigPath(),
    getDiscordConfigPath(),
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
    getRequestHistoryPath(),
  ];
}

export function runSecurityAudit(options?: {
  fix?: boolean;
}): SecurityAuditReport {
  const findings: SecurityFinding[] = [];
  const fix = options?.fix === true;
  const chmodDir: string[] = [];
  const chmodFile: string[] = [];

  const configDir = getConfigDir();
  try {
    fs.mkdirSync(configDir, { recursive: true, mode: DIR_MODE });
  } catch {
    findings.push({
      code: "config_dir_unavailable",
      severity: "error",
      message: "Config directory is not accessible",
      ref: configDir,
    });
  }

  const dirMode = modeBits(configDir);
  if (typeof dirMode === "number" && isModeTooOpen(dirMode, "dir")) {
    findings.push({
      code: "config_dir_permissions",
      severity: "warn",
      message: `Config directory permissions are too open (${dirMode.toString(8)})`,
      ref: configDir,
    });
    if (fix) {
      try {
        fs.chmodSync(configDir, DIR_MODE);
        chmodDir.push(configDir);
      } catch {
        findings.push({
          code: "config_dir_permissions_fix_failed",
          severity: "warn",
          message: "Failed to tighten config directory permissions",
          ref: configDir,
        });
      }
    }
  }

  const files = configFilePaths();
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const mode = modeBits(filePath);
    if (typeof mode !== "number") {
      continue;
    }

    if (isModeTooOpen(mode, "file")) {
      findings.push({
        code: "file_permissions",
        severity: "warn",
        message: `File permissions are too open (${mode.toString(8)})`,
        ref: filePath,
      });

      if (fix) {
        try {
          fs.chmodSync(filePath, FILE_MODE);
          chmodFile.push(filePath);
        } catch {
          findings.push({
            code: "file_permissions_fix_failed",
            severity: "warn",
            message: "Failed to tighten file permissions",
            ref: filePath,
          });
        }
      }
    }
  }

  try {
    const app = loadAppConfig();
    if (!app.apiKey?.trim()) {
      findings.push({
        code: "api_key_missing",
        severity: "error",
        message: "API key is not configured",
      });
    }

    if (!app.userAgent?.trim()) {
      findings.push({
        code: "user_agent_missing",
        severity: "warn",
        message: "User-Agent is not configured",
      });
    }
  } catch {
    findings.push({
      code: "app_config_unreadable",
      severity: "error",
      message: "Cannot load application config",
      ref: getAppConfigPath(),
    });
  }

  const report: SecurityAuditReport = {
    ok: findings.every((finding) => finding.severity !== "error"),
    timestamp: new Date().toISOString(),
    findings,
    summary: {
      total: findings.length,
      warn: findings.filter((finding) => finding.severity === "warn").length,
      error: findings.filter((finding) => finding.severity === "error").length,
    },
  };

  if (fix) {
    report.fixes = {
      chmodDir,
      chmodFile,
    };
  }

  return report;
}
