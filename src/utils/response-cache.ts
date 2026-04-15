import fs from "node:fs";
import { createHash } from "node:crypto";
import { getResponseCachePath, writePrivateFile } from "../config/paths.js";
import { loadCacheConfig } from "../config/cache.js";

export interface CachedResponse {
  key: string;
  provider: "openai" | "claude" | "ollama";
  model: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  source?: string;
}

export interface CacheStats {
  entries: number;
  expired: number;
  oldest?: string;
  newest?: string;
}

function readCacheEntries(): CachedResponse[] {
  try {
    const raw = fs.readFileSync(getResponseCachePath(), "utf-8");
    const parsed = JSON.parse(raw) as CachedResponse[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCacheEntries(entries: CachedResponse[]): void {
  writePrivateFile(getResponseCachePath(), JSON.stringify(entries, null, 2));
}

function isExpired(entry: CachedResponse): boolean {
  return Date.parse(entry.expiresAt) <= Date.now();
}

export function computeCacheKey(payload: {
  provider: "openai" | "claude" | "ollama";
  prompt: string;
  model?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}): string {
  const normalized = JSON.stringify({
    provider: payload.provider,
    prompt: payload.prompt,
    model: payload.model || "",
    system: payload.system || "",
    temperature: payload.temperature ?? null,
    maxTokens: payload.maxTokens ?? null,
  });

  return createHash("sha256").update(normalized).digest("hex");
}

export function getCachedResponse(key: string): CachedResponse | undefined {
  const config = loadCacheConfig();
  if (!config.enabled) {
    return undefined;
  }

  const allEntries = readCacheEntries();
  const entries = allEntries.filter((entry) => !isExpired(entry));
  const hit = entries.find((entry) => entry.key === key);

  if (entries.length !== allEntries.length) {
    saveCacheEntries(entries);
  }

  return hit;
}

function isModelExcluded(model: string, excludedModels: string[]): boolean {
  const normalizedModel = model.toLowerCase();
  return excludedModels.some((item) => {
    const normalizedRule = item.toLowerCase();
    if (normalizedRule === "*") {
      return true;
    }

    if (normalizedRule.endsWith("*")) {
      const prefix = normalizedRule.slice(0, -1);
      return normalizedModel.startsWith(prefix);
    }

    return normalizedModel === normalizedRule;
  });
}

export function shouldUseCache(input: {
  provider: "openai" | "claude" | "ollama";
  model: string;
}): boolean {
  const config = loadCacheConfig();
  if (!config.enabled) {
    return false;
  }

  const providerPolicy = config.providers[input.provider];
  if (!providerPolicy.enabled) {
    return false;
  }

  if (isModelExcluded(input.model, providerPolicy.excludedModels)) {
    return false;
  }

  return true;
}

export function getCachedResponseFor(input: {
  key: string;
  provider: "openai" | "claude" | "ollama";
  model: string;
}): CachedResponse | undefined {
  if (!shouldUseCache({ provider: input.provider, model: input.model })) {
    return undefined;
  }

  return getCachedResponse(input.key);
}

export function putCachedResponse(input: {
  key: string;
  provider: "openai" | "claude" | "ollama";
  model: string;
  content: string;
  source?: string;
}): CachedResponse {
  const config = loadCacheConfig();
  const providerPolicy = config.providers[input.provider];

  if (!shouldUseCache({ provider: input.provider, model: input.model })) {
    return {
      key: input.key,
      provider: input.provider,
      model: input.model,
      content: input.content,
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
    };
  }

  const now = Date.now();

  const entry: CachedResponse = {
    key: input.key,
    provider: input.provider,
    model: input.model,
    content: input.content,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + providerPolicy.ttlMs).toISOString(),
  };

  if (input.source) {
    entry.source = input.source;
  }

  const deduped = readCacheEntries().filter(
    (existing) => existing.key !== input.key && !isExpired(existing),
  );
  deduped.push(entry);
  deduped.sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );

  saveCacheEntries(deduped.slice(0, config.maxEntries));
  return entry;
}

export function clearResponseCache(): void {
  saveCacheEntries([]);
}

export function getResponseCacheStats(): CacheStats {
  const entries = readCacheEntries();
  const expired = entries.filter((entry) => isExpired(entry)).length;
  const active = entries.filter((entry) => !isExpired(entry));

  const stats: CacheStats = {
    entries: active.length,
    expired,
  };

  if (active[0]?.createdAt) {
    stats.newest = active[0].createdAt;
  }

  const oldestEntry = active[active.length - 1];
  if (oldestEntry?.createdAt) {
    stats.oldest = oldestEntry.createdAt;
  }

  return stats;
}

export function replayCachedResponse(key: string): string | undefined {
  return getCachedResponse(key)?.content;
}
