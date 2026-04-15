import fs from "node:fs";
import { getCacheConfigPath, writePrivateFile } from "./paths.js";

export type CacheProvider = "openai" | "claude" | "ollama";

export interface CacheProviderPolicy {
  enabled: boolean;
  ttlMs: number;
  excludedModels: string[];
}

export interface CacheConfig {
  enabled: boolean;
  maxEntries: number;
  providers: Record<CacheProvider, CacheProviderPolicy>;
}

const DEFAULT_PROVIDER_POLICY: CacheProviderPolicy = {
  enabled: true,
  ttlMs: 5 * 60 * 1000,
  excludedModels: [],
};

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  maxEntries: 500,
  providers: {
    openai: { ...DEFAULT_PROVIDER_POLICY },
    claude: { ...DEFAULT_PROVIDER_POLICY },
    ollama: { ...DEFAULT_PROVIDER_POLICY, ttlMs: 2 * 60 * 1000 },
  },
};

function normalizeProviderPolicy(
  input: Partial<CacheProviderPolicy> | undefined,
  fallback: CacheProviderPolicy,
): CacheProviderPolicy {
  const excludedModels = Array.isArray(input?.excludedModels)
    ? input.excludedModels
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : fallback.excludedModels;

  return {
    enabled:
      input?.enabled !== undefined ? input.enabled !== false : fallback.enabled,
    ttlMs:
      typeof input?.ttlMs === "number" && Number.isFinite(input.ttlMs)
        ? Math.max(5_000, Math.floor(input.ttlMs))
        : fallback.ttlMs,
    excludedModels,
  };
}

function normalizeConfig(input: Partial<CacheConfig>): CacheConfig {
  const providersInput: Partial<
    Record<CacheProvider, Partial<CacheProviderPolicy>>
  > = input.providers || {};

  return {
    enabled: input.enabled !== false,
    maxEntries:
      typeof input.maxEntries === "number" && Number.isFinite(input.maxEntries)
        ? Math.max(10, Math.floor(input.maxEntries))
        : DEFAULT_CACHE_CONFIG.maxEntries,
    providers: {
      openai: normalizeProviderPolicy(
        providersInput.openai,
        DEFAULT_CACHE_CONFIG.providers.openai,
      ),
      claude: normalizeProviderPolicy(
        providersInput.claude,
        DEFAULT_CACHE_CONFIG.providers.claude,
      ),
      ollama: normalizeProviderPolicy(
        providersInput.ollama,
        DEFAULT_CACHE_CONFIG.providers.ollama,
      ),
    },
  };
}

export function loadCacheConfig(): CacheConfig {
  try {
    const raw = fs.readFileSync(getCacheConfigPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<CacheConfig>;
    return normalizeConfig({ ...DEFAULT_CACHE_CONFIG, ...parsed });
  } catch {
    return { ...DEFAULT_CACHE_CONFIG };
  }
}

export function saveCacheConfig(config: CacheConfig): void {
  writePrivateFile(getCacheConfigPath(), JSON.stringify(config, null, 2));
}

export function updateCacheConfig(partial: Partial<CacheConfig>): CacheConfig {
  const current = loadCacheConfig();
  const updated = normalizeConfig({
    ...current,
    ...partial,
    providers: {
      ...current.providers,
      ...(partial.providers || {}),
    },
  });
  saveCacheConfig(updated);
  return updated;
}

export function updateCacheProviderPolicy(
  provider: CacheProvider,
  partial: Partial<CacheProviderPolicy>,
): CacheConfig {
  const current = loadCacheConfig();
  const updated = updateCacheConfig({
    providers: {
      ...current.providers,
      [provider]: normalizeProviderPolicy(
        {
          ...current.providers[provider],
          ...partial,
        },
        current.providers[provider],
      ),
    },
  });

  return updated;
}
