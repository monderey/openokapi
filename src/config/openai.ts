import fs from "node:fs";
import {
  getOpenAIConfigPath,
  getOpenAIModelsPath,
  writePrivateFile,
} from "./paths.js";

export type OpenAIModel = {
  id: string;
  name: string;
  context_window?: number;
  max_output_tokens?: number;
  owned_by?: string;
  created?: number;
};

export type OpenAIConfig = {
  apiKey?: string;
  enabled?: boolean;
  defaultModel?: string;
};

const DEFAULT_CONFIG: Required<Pick<OpenAIConfig, "enabled">> = {
  enabled: false,
};

export function loadOpenAIConfig(): OpenAIConfig {
  try {
    const raw = fs.readFileSync(getOpenAIConfigPath(), "utf-8");
    const parsed = JSON.parse(raw) as OpenAIConfig;
    if (parsed.apiKey) {
      parsed.apiKey = parsed.apiKey.trim();
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveOpenAIConfig(config: OpenAIConfig): void {
  writePrivateFile(getOpenAIConfigPath(), JSON.stringify(config, null, 2));
}

export function updateOpenAIConfig(partial: OpenAIConfig): OpenAIConfig {
  const current = loadOpenAIConfig();
  const updated: OpenAIConfig = { ...current, ...partial };
  saveOpenAIConfig(updated);
  return updated;
}

export function loadOpenAIModels(): OpenAIModel[] {
  try {
    const raw = fs.readFileSync(getOpenAIModelsPath(), "utf-8");
    const parsed = JSON.parse(raw) as OpenAIModel[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOpenAIModels(models: OpenAIModel[]): void {
  writePrivateFile(getOpenAIModelsPath(), JSON.stringify(models, null, 2));
}
