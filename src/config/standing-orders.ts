import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getStandingOrdersPath, writePrivateFile } from "./paths.js";

export type StandingOrderScope = "global" | "provider";

export interface StandingOrder {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  priority: number;
  scope: StandingOrderScope;
  provider?: "openai" | "claude" | "ollama";
  createdAt: string;
  updatedAt: string;
}

function loadAll(): StandingOrder[] {
  try {
    const raw = fs.readFileSync(getStandingOrdersPath(), "utf-8");
    const parsed = JSON.parse(raw) as StandingOrder[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is StandingOrder =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.content === "string" &&
        (item.scope === "global" || item.scope === "provider"),
    );
  } catch {
    return [];
  }
}

function saveAll(items: StandingOrder[]): void {
  writePrivateFile(getStandingOrdersPath(), JSON.stringify(items, null, 2));
}

export function listStandingOrders(): StandingOrder[] {
  return loadAll().sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.title.localeCompare(b.title);
  });
}

export function upsertStandingOrder(input: {
  id?: string;
  title: string;
  content: string;
  enabled?: boolean;
  priority?: number;
  scope?: StandingOrderScope;
  provider?: "openai" | "claude" | "ollama";
}): StandingOrder {
  const now = new Date().toISOString();
  const current = loadAll();
  const existing =
    input.id && input.id.trim()
      ? current.find((item) => item.id === input.id!.trim())
      : undefined;

  const id = existing?.id || input.id?.trim() || randomUUID();
  const next: StandingOrder = {
    id,
    title: input.title.trim() || `standing-order-${id.slice(0, 8)}`,
    content: input.content.trim(),
    enabled: input.enabled !== false,
    priority:
      typeof input.priority === "number" && Number.isFinite(input.priority)
        ? Math.floor(input.priority)
        : existing?.priority || 0,
    scope: input.scope || existing?.scope || "global",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (next.scope === "provider") {
    const provider = input.provider || existing?.provider;
    if (!provider) {
      throw new Error("Provider scope standing order requires provider");
    }
    next.provider = provider;
  }

  if (!next.content) {
    throw new Error("Standing order content is required");
  }

  const filtered = current.filter((item) => item.id !== id);
  filtered.push(next);
  saveAll(filtered);
  return next;
}

export function deleteStandingOrder(id: string): boolean {
  const current = loadAll();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) {
    return false;
  }

  saveAll(next);
  return true;
}
