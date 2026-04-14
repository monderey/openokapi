import fs from "node:fs";
import {
  getOllamaConfigPath,
  getOllamaModelsPath,
  writePrivateFile,
} from "./paths.js";
export type OllamaModel = {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
};

export type OllamaConfig = {
  baseURL?: string;
  enabled?: boolean;
  defaultModel?: string;
};

const DEFAULT_CONFIG: Required<Pick<OllamaConfig, "enabled">> = {
  enabled: false,
};

export function loadOllamaConfig(): OllamaConfig {
  try {
    const raw = fs.readFileSync(getOllamaConfigPath(), "utf-8");
    const parsed = JSON.parse(raw) as OllamaConfig;
    if (parsed.baseURL) {
      parsed.baseURL = parsed.baseURL.trim();
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveOllamaConfig(config: OllamaConfig): void {
  writePrivateFile(getOllamaConfigPath(), JSON.stringify(config, null, 2));
}

export function updateOllamaConfig(partial: OllamaConfig): OllamaConfig {
  const current = loadOllamaConfig();
  const updated = { ...current, ...partial };
  saveOllamaConfig(updated);
  return updated;
}

export function loadOllamaModels(): OllamaModel[] {
  try {
    const raw = fs.readFileSync(getOllamaModelsPath(), "utf-8");
    return JSON.parse(raw) as OllamaModel[];
  } catch {
    return [];
  }
}

export function saveOllamaModels(models: OllamaModel[]): void {
  writePrivateFile(getOllamaModelsPath(), JSON.stringify(models, null, 2));
}

export function findOllamaModel(modelName: string): OllamaModel | undefined {
  const models = loadOllamaModels();
  return models.find(
    (m) =>
      m.name.toLowerCase() === modelName.toLowerCase() ||
      m.model.toLowerCase() === modelName.toLowerCase(),
  );
}

export function modelExists(modelName: string): boolean {
  return findOllamaModel(modelName) !== undefined;
}
