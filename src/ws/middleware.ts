import type { Request, Response, NextFunction } from "express";
import { loadAppConfig } from "../config/app.js";

const AUTH_CONFIG_CACHE_TTL_MS = 1000;

let cachedAuthConfig:
  | {
      apiKey: string;
      userAgent: string;
    }
  | undefined;
let cachedAt = 0;

type RateLimitState = {
  count: number;
  windowStart: number;
};

const rateLimitStore = new Map<string, RateLimitState>();
let lastRateLimitCleanup = 0;

export function getHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getGatewayAuthConfig(): {
  apiKey: string;
  userAgent: string;
} {
  const now = Date.now();
  if (cachedAuthConfig && now - cachedAt < AUTH_CONFIG_CACHE_TTL_MS) {
    return cachedAuthConfig;
  }

  const config = loadAppConfig();

  cachedAuthConfig = {
    apiKey: config.apiKey?.trim() || "",
    userAgent: config.userAgent?.trim() || "OPENOKAPI/1.0",
  };
  cachedAt = now;

  return cachedAuthConfig;
}

export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = getHeaderValue(req.headers["x-api-key"]);
  const config = getGatewayAuthConfig();

  if (!config.apiKey) {
    res.status(500).json({
      error:
        "API key not configured on server. Use 'openokapi generate api-key' first.",
    });
    return;
  }

  if (!apiKey || apiKey !== config.apiKey) {
    res.status(401).json({
      error: "Invalid or missing API key",
    });
    return;
  }

  next();
}

export function validateUserAgent(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userAgent = getHeaderValue(req.headers["user-agent"]);
  const panelClient = getHeaderValue(req.headers["x-openokapi-client"]);
  const config = getGatewayAuthConfig();

  if (userAgent !== config.userAgent && panelClient !== "web-panel") {
    res.status(403).json({
      error: "Invalid User-Agent.",
    });
    return;
  }

  next();
}

export function validateGatewayRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const maxRequestsPerMinute = Number.parseInt(
    process.env.OPENOKAPI_RATE_LIMIT_PER_MINUTE || "240",
    10,
  );

  if (!Number.isFinite(maxRequestsPerMinute) || maxRequestsPerMinute <= 0) {
    next();
    return;
  }

  const now = Date.now();
  const minuteMs = 60_000;

  const xForwardedFor = getHeaderValue(req.headers["x-forwarded-for"]);
  const forwardedIp = xForwardedFor?.split(",")[0]?.trim();
  const identifier =
    forwardedIp || req.ip || req.socket.remoteAddress || "unknown-client";

  const existing = rateLimitStore.get(identifier);
  if (!existing || now - existing.windowStart >= minuteMs) {
    rateLimitStore.set(identifier, {
      count: 1,
      windowStart: now,
    });
  } else {
    existing.count += 1;
    rateLimitStore.set(identifier, existing);

    if (existing.count > maxRequestsPerMinute) {
      res.status(429).json({
        error: "Rate limit exceeded",
      });
      return;
    }
  }

  if (now - lastRateLimitCleanup > 5 * minuteMs) {
    lastRateLimitCleanup = now;
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.windowStart > 2 * minuteMs) {
        rateLimitStore.delete(key);
      }
    }
  }

  next();
}
