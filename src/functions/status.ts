import os from "node:os";
import { getHeartbeatEngineStatus } from "./heartbeat-engine.js";
import { getSchedulerEngineStatus } from "./scheduler-engine.js";
import { getTaskFlowMaintenanceStatus } from "./task-flow.js";
import { getTaskLedgerMaintenanceStatus } from "./tasks-ledger.js";
import { runDoctor, type DoctorReport } from "./doctor.js";
import {
  runSecurityAudit,
  type SecurityAuditReport,
} from "./security-audit.js";
import { runSystemSelfTest, type SelfTestCheck } from "./self-test.js";

export interface StatusSelfTestSummary {
  total: number;
  failed: number;
}

export interface StatusRuntime {
  node: string;
  platform: NodeJS.Platform;
  host: string;
  pid: number;
  uptimeSeconds: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  scheduler: ReturnType<typeof getSchedulerEngineStatus>;
  heartbeat: ReturnType<typeof getHeartbeatEngineStatus>;
  tasksMaintenance: ReturnType<typeof getTaskLedgerMaintenanceStatus>;
  taskFlowMaintenance: ReturnType<typeof getTaskFlowMaintenanceStatus>;
}

export interface StatusSummary {
  selfTest: StatusSelfTestSummary;
  doctor?: {
    totalFindings: number;
    warn: number;
    error: number;
  };
  security?: {
    totalFindings: number;
    warn: number;
    error: number;
  };
}

export interface StatusReport {
  ok: boolean;
  timestamp: string;
  mode: "basic" | "deep";
  runtime: StatusRuntime;
  summary: StatusSummary;
  selfTest?: {
    ok: boolean;
    checks: SelfTestCheck[];
  };
  doctor?: DoctorReport;
  security?: SecurityAuditReport;
}

export function getStatusReport(options?: { deep?: boolean }): StatusReport {
  const deep = options?.deep === true;
  const selfTest = runSystemSelfTest();

  const runtime: StatusRuntime = {
    node: process.version,
    platform: process.platform,
    host: os.hostname(),
    pid: process.pid,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
    },
    scheduler: getSchedulerEngineStatus(),
    heartbeat: getHeartbeatEngineStatus(),
    tasksMaintenance: getTaskLedgerMaintenanceStatus(),
    taskFlowMaintenance: getTaskFlowMaintenanceStatus(),
  };

  const report: StatusReport = {
    ok: selfTest.ok,
    timestamp: new Date().toISOString(),
    mode: deep ? "deep" : "basic",
    runtime,
    summary: {
      selfTest: {
        total: selfTest.checks.length,
        failed: selfTest.checks.filter((check) => !check.ok).length,
      },
    },
  };

  if (!deep) {
    return report;
  }

  const doctor = runDoctor();
  const security = runSecurityAudit();

  report.ok = report.ok && doctor.ok && security.ok;
  report.selfTest = {
    ok: selfTest.ok,
    checks: selfTest.checks,
  };
  report.doctor = doctor;
  report.security = security;
  report.summary.doctor = {
    totalFindings: doctor.summary.totalFindings,
    warn: doctor.summary.warn,
    error: doctor.summary.error,
  };
  report.summary.security = {
    totalFindings: security.summary.total,
    warn: security.summary.warn,
    error: security.summary.error,
  };

  return report;
}
