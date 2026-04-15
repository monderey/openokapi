import { getStatusReport, type StatusReport } from "./status.js";
import { getMaintenanceStatus } from "./maintenance-windows.js";

export type AlertSeverity = "warn" | "error";

export interface AlertItem {
  source: "self-test" | "doctor" | "security";
  code: string;
  severity: AlertSeverity;
  message: string;
  ref?: string;
}

export interface AlertsReport {
  ok: boolean;
  timestamp: string;
  muted: boolean;
  summary: {
    total: number;
    warn: number;
    error: number;
    suppressed: number;
  };
  alerts: AlertItem[];
  deep?: {
    status: StatusReport;
  };
}

function dedupeAlerts(items: AlertItem[]): AlertItem[] {
  const seen = new Set<string>();
  const deduped: AlertItem[] = [];

  for (const item of items) {
    const key = `${item.source}|${item.code}|${item.message}|${item.ref || ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export function getAlertsReport(options?: {
  deep?: boolean;
  limit?: number;
  ignoreMute?: boolean;
}): AlertsReport {
  const deep = options?.deep === true;
  const limitRaw = Number(options?.limit);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.floor(limitRaw))
    : undefined;

  const status = getStatusReport({ deep: true });
  const alerts: AlertItem[] = [];

  if (status.selfTest?.checks) {
    for (const check of status.selfTest.checks) {
      if (check.ok) {
        continue;
      }
      alerts.push({
        source: "self-test",
        code: "check_failed",
        severity: "error",
        message: `${check.name}: ${check.message}`,
      });
    }
  }

  if (status.doctor?.findings) {
    for (const finding of status.doctor.findings) {
      alerts.push({
        source: "doctor",
        code: `${finding.domain}.${finding.code}`,
        severity: finding.severity,
        message: finding.message,
        ref: finding.ref,
      });
    }
  }

  if (status.security?.findings) {
    for (const finding of status.security.findings) {
      alerts.push({
        source: "security",
        code: finding.code,
        severity: finding.severity,
        message: finding.message,
        ref: finding.ref,
      });
    }
  }

  const normalized = dedupeAlerts(alerts).sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "error" ? -1 : 1;
    }
    return a.code.localeCompare(b.code);
  });

  const maintenance = getMaintenanceStatus();
  const muted = maintenance.mutedAlerts && options?.ignoreMute !== true;
  const visiblePool = muted ? [] : normalized;

  const visible =
    typeof limit === "number" ? visiblePool.slice(0, limit) : visiblePool;

  const report: AlertsReport = {
    ok: normalized.length === 0 || muted,
    timestamp: new Date().toISOString(),
    muted,
    summary: {
      total: normalized.length,
      warn: normalized.filter((item) => item.severity === "warn").length,
      error: normalized.filter((item) => item.severity === "error").length,
      suppressed: muted ? normalized.length : 0,
    },
    alerts: visible,
  };

  if (deep) {
    report.deep = { status };
  }

  return report;
}
