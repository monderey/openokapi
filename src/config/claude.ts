import fs from "node:fs";
import {
  getClaudeConfigPath,
  getClaudeModelsPath,
  writePrivateFile,
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
  writePrivateFile(getClaudeConfigPath(), JSON.stringify(config, null, 2));
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
  writePrivateFile(getClaudeModelsPath(), JSON.stringify(models, null, 2));
}
