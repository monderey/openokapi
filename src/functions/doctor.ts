import { getHeartbeatEngineStatus } from "./heartbeat-engine.js";
import { getSchedulerEngineStatus } from "./scheduler-engine.js";
import {
  getTaskLedgerMaintenanceStatus,
  runTaskLedgerAudit,
  runTaskLedgerMaintenance,
} from "./tasks-ledger.js";
import {
  getTaskFlowMaintenanceStatus,
  runTaskFlowAudit,
  runTaskFlowMaintenance,
} from "./task-flow.js";

export type DoctorSeverity = "warn" | "error";

export interface DoctorFinding {
  domain: "tasks" | "task-flow" | "scheduler" | "heartbeat";
  code: string;
  severity: DoctorSeverity;
  message: string;
  ref?: string;
}

export interface DoctorReport {
  ok: boolean;
  timestamp: string;
  summary: {
    totalFindings: number;
    warn: number;
    error: number;
  };
  findings: DoctorFinding[];
  status: {
    scheduler: ReturnType<typeof getSchedulerEngineStatus>;
    heartbeat: ReturnType<typeof getHeartbeatEngineStatus>;
    tasksMaintenance: ReturnType<typeof getTaskLedgerMaintenanceStatus>;
    taskFlowMaintenance: ReturnType<typeof getTaskFlowMaintenanceStatus>;
  };
  repair?: {
    tasks: ReturnType<typeof runTaskLedgerMaintenance>;
    taskFlow: ReturnType<typeof runTaskFlowMaintenance>;
  };
}

export function runDoctor(options?: {
  repair?: boolean;
  retentionDays?: number;
}): DoctorReport {
  const findings: DoctorFinding[] = [];

  const taskFindings = runTaskLedgerAudit();
  for (const finding of taskFindings) {
    findings.push({
      domain: "tasks",
      code: finding.code,
      severity: finding.severity,
      message: finding.message,
      ref: finding.taskId,
    });
  }

  const flowFindings = runTaskFlowAudit();
  for (const finding of flowFindings) {
    findings.push({
      domain: "task-flow",
      code: finding.code,
      severity: finding.severity,
      message: finding.message,
      ref: finding.flowId,
    });
  }

  const scheduler = getSchedulerEngineStatus();
  if (!scheduler.started) {
    findings.push({
      domain: "scheduler",
      code: "engine_stopped",
      severity: "warn",
      message: "Scheduler engine is not running",
    });
  }

  const heartbeat = getHeartbeatEngineStatus();
  if (heartbeat.enabled && !heartbeat.started) {
    findings.push({
      domain: "heartbeat",
      code: "engine_not_started",
      severity: "warn",
      message: "Heartbeat is enabled but engine is not started",
    });
  }

  const report: DoctorReport = {
    ok: findings.every((finding) => finding.severity !== "error"),
    timestamp: new Date().toISOString(),
    summary: {
      totalFindings: findings.length,
      warn: findings.filter((finding) => finding.severity === "warn").length,
      error: findings.filter((finding) => finding.severity === "error").length,
    },
    findings,
    status: {
      scheduler,
      heartbeat,
      tasksMaintenance: getTaskLedgerMaintenanceStatus(),
      taskFlowMaintenance: getTaskFlowMaintenanceStatus(),
    },
  };

  if (options?.repair) {
    const retentionDaysRaw = Number(options.retentionDays);
    const retentionDays = Number.isFinite(retentionDaysRaw)
      ? Math.max(1, Math.floor(retentionDaysRaw))
      : undefined;

    report.repair = {
        tasks: runTaskLedgerMaintenance({
          apply: true,
          ...(typeof retentionDays === "number" && { retentionDays }),
      }),
      taskFlow: runTaskFlowMaintenance({
          apply: true,
          ...(typeof retentionDays === "number" && { retentionDays }),
      }),
    };
  }

  return report;
}
