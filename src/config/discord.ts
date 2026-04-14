import fs from "node:fs";
import { getDiscordConfigPath, writePrivateFile } from "./paths.js";

export type DiscordConfig = {
  token?: string;
  enabled?: boolean;
  presenceText?: string;
  usageEnabled?: boolean;
  headless?: boolean;
};

const DEFAULT_CONFIG: Required<
  Pick<DiscordConfig, "enabled" | "presenceText" | "usageEnabled">
> = {
  enabled: false,
  presenceText: "OpenOKAPI",
  usageEnabled: true,
};

export function loadDiscordConfig(): DiscordConfig {
  try {
    const raw = fs.readFileSync(getDiscordConfigPath(), "utf-8");
    const parsed = JSON.parse(raw) as DiscordConfig;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveDiscordConfig(config: DiscordConfig): void {
  writePrivateFile(getDiscordConfigPath(), JSON.stringify(config, null, 2));
}

export function updateDiscordConfig(partial: DiscordConfig): DiscordConfig {
  const current = loadDiscordConfig();
  const updated: DiscordConfig = { ...current, ...partial };
  saveDiscordConfig(updated);
  return updated;
}
