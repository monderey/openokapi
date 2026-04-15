import { loadGuardrailsConfig } from "../config/guardrails.js";

export interface GuardrailCheckResult {
  allowed: boolean;
  blockedBy?: string;
  sanitizedText: string;
  redactedPatterns?: string[];
}

export function sanitizeText(input: string): GuardrailCheckResult {
  const config = loadGuardrailsConfig();
  if (!config.enabled) {
    return {
      allowed: true,
      sanitizedText: input,
    };
  }

  const lower = input.toLowerCase();
  for (const term of config.blockedTerms) {
    const normalizedTerm = term.trim().toLowerCase();
    if (normalizedTerm && lower.includes(normalizedTerm)) {
      return {
        allowed: false,
        blockedBy: term,
        sanitizedText: input,
      };
    }
  }

  let sanitized = input;
  const redactedPatterns: string[] = [];
  for (const pattern of config.redactPatterns) {
    try {
      const regex = new RegExp(pattern, "gi");
      if (regex.test(sanitized)) {
        redactedPatterns.push(pattern);
      }
      sanitized = sanitized.replace(regex, config.replacement);
    } catch {
      // Ignore invalid regex entries.
    }
  }

  const output: GuardrailCheckResult = {
    allowed: true,
    sanitizedText: sanitized,
  };

  if (redactedPatterns.length) {
    output.redactedPatterns = redactedPatterns;
  }

  return output;
}
