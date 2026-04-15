import fs from "node:fs";
import { getGuardrailsPath, writePrivateFile } from "./paths.js";

export interface GuardrailsConfig {
  enabled: boolean;
  blockedTerms: string[];
  redactPatterns: string[];
  replacement: string;
  updatedAt: string;
}

const DEFAULT_GUARDRAILS: GuardrailsConfig = {
  enabled: true,
  blockedTerms: [],
  redactPatterns: [
    "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
    "\\+?[0-9]{7,15}",
  ],
  replacement: "[REDACTED]",
  updatedAt: new Date().toISOString(),
};

export function loadGuardrailsConfig(): GuardrailsConfig {
  try {
    const raw = fs.readFileSync(getGuardrailsPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<GuardrailsConfig>;

    return {
      enabled: parsed.enabled !== false,
      blockedTerms: Array.isArray(parsed.blockedTerms)
        ? parsed.blockedTerms.filter(
            (item): item is string => typeof item === "string",
          )
        : DEFAULT_GUARDRAILS.blockedTerms,
      redactPatterns: Array.isArray(parsed.redactPatterns)
        ? parsed.redactPatterns.filter(
            (item): item is string => typeof item === "string",
          )
        : DEFAULT_GUARDRAILS.redactPatterns,
      replacement:
        typeof parsed.replacement === "string"
          ? parsed.replacement
          : DEFAULT_GUARDRAILS.replacement,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_GUARDRAILS };
  }
}

export function saveGuardrailsConfig(config: GuardrailsConfig): void {
  writePrivateFile(getGuardrailsPath(), JSON.stringify(config, null, 2));
}

export function updateGuardrailsConfig(
  partial: Partial<GuardrailsConfig>,
): GuardrailsConfig {
  const current = loadGuardrailsConfig();
  const next: GuardrailsConfig = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  saveGuardrailsConfig(next);
  return next;
}
