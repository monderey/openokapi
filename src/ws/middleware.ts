import type { Request, Response, NextFunction } from "express";
import { loadAppConfig } from "../config/app.js";

export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.headers["x-api-key"];
  const config = loadAppConfig();

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
  const userAgent = req.headers["user-agent"];
  const config = loadAppConfig();
  const expectedUserAgent = config.userAgent || "OPENOKAPI/1.0";

  if (userAgent !== expectedUserAgent) {
    res.status(403).json({
      error: "Invalid User-Agent.",
    });
    return;
  }

  next();
}
