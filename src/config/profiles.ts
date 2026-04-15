import fs from "node:fs";
import { getProfilesPath, writePrivateFile } from "./paths.js";

export type ProfileProvider = "openai" | "claude" | "ollama";

export interface ProfileDefinition {
  name: string;
  description?: string;
  provider: ProfileProvider;
  model?: string;
  template: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpsertInput {
  name: string;
  description?: string;
  provider: ProfileProvider;
  model?: string;
  template: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function isProfileProvider(value: unknown): value is ProfileProvider {
  return value === "openai" || value === "claude" || value === "ollama";
}

function normalizeProfile(profile: ProfileDefinition): ProfileDefinition {
  const normalized: ProfileDefinition = {
    name: profile.name.trim(),
    provider: profile.provider,
    template: profile.template.trim(),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  const description = profile.description?.trim();
  if (description) {
    normalized.description = description;
  }

  const model = profile.model?.trim();
  if (model) {
    normalized.model = model;
  }

  const system = profile.system?.trim();
  if (system) {
    normalized.system = system;
  }

  if (
    typeof profile.temperature === "number" &&
    Number.isFinite(profile.temperature)
  ) {
    normalized.temperature = profile.temperature;
  }

  if (
    typeof profile.maxTokens === "number" &&
    Number.isFinite(profile.maxTokens)
  ) {
    normalized.maxTokens = profile.maxTokens;
  }

  return normalized;
}

export function loadProfiles(): ProfileDefinition[] {
  try {
    const raw = fs.readFileSync(getProfilesPath(), "utf-8");
    const parsed = JSON.parse(raw) as ProfileDefinition[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((profile) => {
        return (
          profile &&
          typeof profile === "object" &&
          typeof profile.name === "string" &&
          isProfileProvider(profile.provider) &&
          typeof profile.template === "string"
        );
      })
      .map((profile) => normalizeProfile(profile))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: ProfileDefinition[]): void {
  writePrivateFile(getProfilesPath(), JSON.stringify(profiles, null, 2));
}

export function listProfiles(): ProfileDefinition[] {
  return loadProfiles();
}

export function getProfile(name: string): ProfileDefinition | undefined {
  const normalizedName = normalizeName(name);
  return loadProfiles().find(
    (profile) => normalizeName(profile.name) === normalizedName,
  );
}

export function upsertProfile(input: ProfileUpsertInput): ProfileDefinition {
  const name = input.name.trim();
  const template = input.template.trim();

  if (!name) {
    throw new Error("Profile name is required");
  }

  if (!template) {
    throw new Error("Profile template is required");
  }

  if (!isProfileProvider(input.provider)) {
    throw new Error(`Unsupported provider: ${input.provider}`);
  }

  const profiles = loadProfiles();
  const now = new Date().toISOString();
  const existing = profiles.find(
    (profile) => normalizeName(profile.name) === normalizeName(name),
  );

  const candidate: ProfileDefinition = {
    name,
    provider: input.provider,
    template,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (input.description?.trim()) {
    candidate.description = input.description.trim();
  }

  if (input.model?.trim()) {
    candidate.model = input.model.trim();
  }

  if (input.system?.trim()) {
    candidate.system = input.system.trim();
  }

  if (
    typeof input.temperature === "number" &&
    Number.isFinite(input.temperature)
  ) {
    candidate.temperature = input.temperature;
  }

  if (typeof input.maxTokens === "number" && Number.isFinite(input.maxTokens)) {
    candidate.maxTokens = Math.floor(input.maxTokens);
  }

  const nextProfile: ProfileDefinition = normalizeProfile(candidate);

  const nextProfiles = profiles.filter(
    (profile) => normalizeName(profile.name) !== normalizeName(name),
  );
  nextProfiles.push(nextProfile);
  nextProfiles.sort((left, right) => left.name.localeCompare(right.name));
  saveProfiles(nextProfiles);
  return nextProfile;
}

export function deleteProfile(name: string): boolean {
  const profiles = loadProfiles();
  const nextProfiles = profiles.filter(
    (profile) => normalizeName(profile.name) !== normalizeName(name),
  );

  if (nextProfiles.length === profiles.length) {
    return false;
  }

  saveProfiles(nextProfiles);
  return true;
}
