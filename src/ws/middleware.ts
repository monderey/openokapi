import type { Request, Response, NextFunction } from "express";
import { loadAppConfig } from "../config/app.js";

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
  const config = loadAppConfig();

  return {
    apiKey: config.apiKey?.trim() || "",
    userAgent: config.userAgent?.trim() || "OPENOKAPI/1.0",
  };
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
