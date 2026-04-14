import fs from "node:fs";
import { getAppConfigPath, writePrivateFile } from "./paths.js";

export type AppConfig = {
  apiKey?: string;
  userAgent?: string;
  fallbackProvider?: "openai" | "claude" | "ollama";
};

export function loadAppConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(getAppConfigPath(), "utf-8");
    const parsed = JSON.parse(raw) as AppConfig;
    if (parsed.apiKey) {
      parsed.apiKey = parsed.apiKey.trim();
    }
    return parsed;
  } catch {
    return {};
  }
}

export function saveAppConfig(config: AppConfig): void {
  writePrivateFile(getAppConfigPath(), JSON.stringify(config, null, 2));
}

export function updateAppConfig(partial: AppConfig): AppConfig {
  const current = loadAppConfig();
  const updated: AppConfig = { ...current, ...partial };
  saveAppConfig(updated);
  return updated;
}
