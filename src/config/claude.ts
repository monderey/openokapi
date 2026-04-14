import fs from "node:fs";
import {
  ensureConfigDir,
  getClaudeConfigPath,
  getClaudeModelsPath,
} from "./paths.js";

export type ClaudeModel = {
  id: string;
  name?: string;
  display_name?: string;
  created_at?: string;
  type?: string;
};

export type ClaudeConfig = {
  apiKey?: string;
  enabled?: boolean;
  defaultModel?: string;
};

const DEFAULT_CONFIG: Required<Pick<ClaudeConfig, "enabled">> = {
  enabled: false,
};

export function loadClaudeConfig(): ClaudeConfig {
  try {
    const raw = fs.readFileSync(getClaudeConfigPath(), "utf-8");
    const parsed = JSON.parse(raw) as ClaudeConfig;
    if (parsed.apiKey) {
      parsed.apiKey = parsed.apiKey.trim();
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveClaudeConfig(config: ClaudeConfig): void {
  ensureConfigDir();
  fs.writeFileSync(
    getClaudeConfigPath(),
    JSON.stringify(config, null, 2),
    "utf-8",
  );
}

export function updateClaudeConfig(partial: ClaudeConfig): ClaudeConfig {
  const current = loadClaudeConfig();
  const updated: ClaudeConfig = { ...current, ...partial };
  saveClaudeConfig(updated);
  return updated;
}

export function loadClaudeModels(): ClaudeModel[] {
  try {
    const raw = fs.readFileSync(getClaudeModelsPath(), "utf-8");
    const parsed = JSON.parse(raw) as ClaudeModel[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClaudeModels(models: ClaudeModel[]): void {
  ensureConfigDir();
  fs.writeFileSync(
    getClaudeModelsPath(),
    JSON.stringify(models, null, 2),
    "utf-8",
  );
}
