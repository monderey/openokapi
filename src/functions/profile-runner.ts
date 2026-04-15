import { executeWithFailover } from "./failover.js";
import { getProfile, type ProfileDefinition } from "../config/profiles.js";
import { renderTemplate } from "../utils/template.js";

export interface ProfileRunInput {
  input: string;
  variables?: Record<string, string>;
  historySource?: "cli" | "gateway" | "discord" | "unknown";
}

export interface ProfileRunResult {
  profile: ProfileDefinition;
  prompt: string;
  response: string;
  providerUsed: string;
  modelUsed: string;
  fallbackUsed: boolean;
}

export async function runProfile(
  profileName: string,
  options: ProfileRunInput,
): Promise<ProfileRunResult> {
  const profile = getProfile(profileName);

  if (!profile) {
    throw new Error(`Profile not found: ${profileName}`);
  }

  const prompt = renderTemplate(profile.template, {
    input: options.input,
    prompt: options.input,
    ...Object.fromEntries(
      Object.entries(options.variables || {}).map(([key, value]) => [
        key,
        value,
      ]),
    ),
  });

  const result = await executeWithFailover({
    provider: profile.provider,
    prompt,
    model: profile.model,
    temperature: profile.temperature,
    maxTokens: profile.maxTokens,
    system: profile.system,
    historySource: options.historySource || "cli",
    historyAction: "ask",
  });

  if (!result.success || !result.content) {
    throw new Error(result.error?.message || "Profile execution failed");
  }

  return {
    profile,
    prompt,
    response: result.content,
    providerUsed: result.providerUsed,
    modelUsed: result.modelUsed,
    fallbackUsed: result.fallbackUsed,
  };
}
