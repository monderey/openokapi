import { Router } from "express";
import type { Request, Response } from "express";
import {
  type CacheProvider,
  loadCacheConfig,
  updateCacheConfig,
  updateCacheProviderPolicy,
} from "../../config/cache.js";
import {
  clearResponseCache,
  getResponseCacheStats,
} from "../../utils/response-cache.js";

const router: Router = Router();

router.get("/stats", (req: Request, res: Response) => {
  res.json({ stats: getResponseCacheStats() });
});

router.delete("/", (req: Request, res: Response) => {
  clearResponseCache();
  res.json({ success: true, message: "Response cache cleared" });
});

router.post("/config", (req: Request, res: Response) => {
  const { enabled, ttlMs, maxEntries, provider, excludeModel, includeModel } =
    req.body || {};

  const providerName: CacheProvider | undefined =
    provider === "openai" || provider === "claude" || provider === "ollama"
      ? provider
      : undefined;

  if (providerName) {
    const current = loadCacheConfig().providers[providerName];
    const partial: {
      enabled?: boolean;
      ttlMs?: number;
      excludedModels?: string[];
    } = {};

    if (typeof enabled === "boolean") {
      partial.enabled = enabled;
    }

    if (typeof ttlMs === "number" && Number.isFinite(ttlMs)) {
      partial.ttlMs = ttlMs;
    }

    if (typeof excludeModel === "string" && excludeModel.trim()) {
      partial.excludedModels = Array.from(
        new Set([...current.excludedModels, excludeModel.trim().toLowerCase()]),
      );
    }

    if (typeof includeModel === "string" && includeModel.trim()) {
      partial.excludedModels = current.excludedModels.filter(
        (item: string) => item !== includeModel.trim().toLowerCase(),
      );
    }

    const updated = updateCacheProviderPolicy(providerName, partial);
    res.json({ config: updated });
    return;
  }

  const globalPartial: { enabled?: boolean; maxEntries?: number } = {};
  if (typeof enabled === "boolean") {
    globalPartial.enabled = enabled;
  }
  if (typeof maxEntries === "number" && Number.isFinite(maxEntries)) {
    globalPartial.maxEntries = maxEntries;
  }

  const updated = updateCacheConfig(globalPartial);
  res.json({ config: updated });
});

export default router;
