import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { getAlertsReport, type AlertItem } from "./alerts.js";
import { getStatusReport } from "./status.js";
import { getIncidentsPath, writePrivateFile } from "../config/paths.js";
import { getMaintenanceStatus } from "./maintenance-windows.js";

export type IncidentStatus = "open" | "acknowledged" | "resolved";
export type IncidentSeverity = "warn" | "error";

export interface IncidentRecord {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  summary: {
    totalAlerts: number;
    warn: number;
    error: number;
  };
  alerts: AlertItem[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

function readIncidents(): IncidentRecord[] {
  try {
    const raw = fs.readFileSync(getIncidentsPath(), "utf-8");
    const parsed = JSON.parse(raw) as IncidentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIncidents(items: IncidentRecord[]): void {
  writePrivateFile(getIncidentsPath(), JSON.stringify(items, null, 2));
}

export function listIncidents(options?: {
  limit?: number;
  status?: IncidentStatus;
}): IncidentRecord[] {
  const limitRaw = Number(options?.limit);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.floor(limitRaw))
    : 50;

  return readIncidents()
    .filter((item) => (options?.status ? item.status === options.status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getIncident(id: string): IncidentRecord | undefined {
  return readIncidents().find((item) => item.id === id.trim());
}

export function createIncident(options?: {
  title?: string;
  deep?: boolean;
  alertLimit?: number;
  forceWhenMuted?: boolean;
}): IncidentRecord {
  const maintenance = getMaintenanceStatus();
  if (maintenance.mutedIncidents && options?.forceWhenMuted !== true) {
    throw new Error("Incidents are muted by active maintenance window");
  }

  const alertsReport = getAlertsReport({
    deep: false,
     ...(typeof options?.alertLimit === "number" && { limit: options.alertLimit }),
    ignoreMute: true,
  });
  const statusReport = getStatusReport({ deep: options?.deep === true });

  const severity: IncidentSeverity =
    alertsReport.summary.error > 0 ? "error" : "warn";
  const now = new Date().toISOString();
  const id = randomUUID();

  const incident: IncidentRecord = {
    id,
    title:
      options?.title?.trim() ||
      `Incident ${now} (alerts:${alertsReport.summary.total} status:${statusReport.ok ? "ok" : "issues"})`,
    status: "open",
    severity,
    summary: {
      totalAlerts: alertsReport.summary.total,
      warn: alertsReport.summary.warn,
      error: alertsReport.summary.error,
    },
    alerts: alertsReport.alerts,
    notes: [],
    createdAt: now,
    updatedAt: now,
  };

  const all = readIncidents();
  all.push(incident);
  saveIncidents(all.slice(-1000));
  return incident;
}

function updateIncident(
  id: string,
  updater: (incident: IncidentRecord) => IncidentRecord,
): IncidentRecord | undefined {
  const all = readIncidents();
  const index = all.findIndex((item) => item.id === id.trim());
  if (index === -1) {
    return undefined;
  }

  const current = all[index];
  if (!current) {
    return undefined;
  }

  const next = updater(current);
  all[index] = next;
  saveIncidents(all);
  return next;
}

export function acknowledgeIncident(
  id: string,
  note?: string,
): IncidentRecord | undefined {
  return updateIncident(id, (incident) => {
    if (incident.status === "resolved") {
      return incident;
    }

    const now = new Date().toISOString();
    const next: IncidentRecord = {
      ...incident,
      status: "acknowledged",
      acknowledgedAt: incident.acknowledgedAt || now,
      updatedAt: now,
    };

    if (note?.trim()) {
      next.notes = [...incident.notes, `ACK ${now}: ${note.trim()}`].slice(
        -200,
      );
    }

    return next;
  });
}

export function resolveIncident(
  id: string,
  note?: string,
): IncidentRecord | undefined {
  return updateIncident(id, (incident) => {
    const now = new Date().toISOString();
    const next: IncidentRecord = {
      ...incident,
      status: "resolved",
      resolvedAt: now,
      acknowledgedAt: incident.acknowledgedAt || now,
      updatedAt: now,
    };

    if (note?.trim()) {
      next.notes = [...incident.notes, `RESOLVE ${now}: ${note.trim()}`].slice(
        -200,
      );
    }

    return next;
  });
}
