import fs from "node:fs";
import { randomUUID } from "node:crypto";
import {
  getMaintenanceWindowsPath,
  writePrivateFile,
} from "../config/paths.js";

export interface MaintenanceWindow {
  id: string;
  name: string;
  enabled: boolean;
  startAt: string;
  endAt: string;
  muteAlerts: boolean;
  muteIncidents: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceStatus {
  mutedAlerts: boolean;
  mutedIncidents: boolean;
  activeWindowIds: string[];
  activeWindows: MaintenanceWindow[];
}

function readWindows(): MaintenanceWindow[] {
  try {
    const raw = fs.readFileSync(getMaintenanceWindowsPath(), "utf-8");
    const parsed = JSON.parse(raw) as MaintenanceWindow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWindows(items: MaintenanceWindow[]): void {
  writePrivateFile(getMaintenanceWindowsPath(), JSON.stringify(items, null, 2));
}

function toMs(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function isActive(window: MaintenanceWindow, nowMs: number): boolean {
  if (!window.enabled) {
    return false;
  }

  const startMs = toMs(window.startAt);
  const endMs = toMs(window.endAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return false;
  }

  return nowMs >= startMs && nowMs <= endMs;
}

export function listMaintenanceWindows(): MaintenanceWindow[] {
  return readWindows().sort((a, b) => b.startAt.localeCompare(a.startAt));
}

export function upsertMaintenanceWindow(input: {
  id?: string;
  name: string;
  enabled?: boolean;
  startAt: string;
  endAt: string;
  muteAlerts?: boolean;
  muteIncidents?: boolean;
}): MaintenanceWindow {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Maintenance window name is required");
  }

  const startMs = toMs(input.startAt);
  const endMs = toMs(input.endAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    throw new Error("startAt and endAt must be valid ISO timestamps");
  }
  if (endMs <= startMs) {
    throw new Error("endAt must be greater than startAt");
  }

  const all = readWindows();
  const existing = input.id
    ? all.find((item) => item.id === input.id)
    : undefined;
  const now = new Date().toISOString();

  const next: MaintenanceWindow = {
    id: existing?.id || input.id || randomUUID(),
    name,
    enabled: input.enabled !== false,
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    muteAlerts: input.muteAlerts !== false,
    muteIncidents: input.muteIncidents !== false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  const filtered = all.filter((item) => item.id !== next.id);
  filtered.push(next);
  saveWindows(filtered.slice(-1000));
  return next;
}

export function deleteMaintenanceWindow(id: string): boolean {
  const all = readWindows();
  const filtered = all.filter((item) => item.id !== id.trim());
  if (filtered.length === all.length) {
    return false;
  }

  saveWindows(filtered);
  return true;
}

export function getMaintenanceStatus(now = new Date()): MaintenanceStatus {
  const nowMs = now.getTime();
  const activeWindows = readWindows().filter((item) => isActive(item, nowMs));

  return {
    mutedAlerts: activeWindows.some((item) => item.muteAlerts),
    mutedIncidents: activeWindows.some((item) => item.muteIncidents),
    activeWindowIds: activeWindows.map((item) => item.id),
    activeWindows,
  };
}
