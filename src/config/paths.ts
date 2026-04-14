import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".openokapi");
const DISCORD_CONFIG_PATH = path.join(CONFIG_DIR, "discord.json");
const DISCORD_PID_PATH = path.join(CONFIG_DIR, "discord.pid");
const DISCORD_LOG_PATH = path.join(CONFIG_DIR, "discord.log");
const OPENAI_CONFIG_PATH = path.join(CONFIG_DIR, "openai.json");
const OPENAI_MODELS_PATH = path.join(CONFIG_DIR, "openai-models.json");
const CLAUDE_CONFIG_PATH = path.join(CONFIG_DIR, "claude.json");
const CLAUDE_MODELS_PATH = path.join(CONFIG_DIR, "claude-models.json");
const OLLAMA_CONFIG_PATH = path.join(CONFIG_DIR, "ollama.json");
const OLLAMA_MODELS_PATH = path.join(CONFIG_DIR, "ollama-models.json");
const APP_CONFIG_PATH = path.join(CONFIG_DIR, "openokapi.json");
const REQUEST_HISTORY_PATH = path.join(CONFIG_DIR, "history.jsonl");
const PRIVATE_FILE_MODE = 0o600;
const PRIVATE_DIR_MODE = 0o700;

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getDiscordConfigPath(): string {
  return DISCORD_CONFIG_PATH;
}

export function getDiscordPidPath(): string {
  return DISCORD_PID_PATH;
}

export function getDiscordLogPath(): string {
  return DISCORD_LOG_PATH;
}

export function getOpenAIConfigPath(): string {
  return OPENAI_CONFIG_PATH;
}

export function getOpenAIModelsPath(): string {
  return OPENAI_MODELS_PATH;
}

export function getClaudeConfigPath(): string {
  return CLAUDE_CONFIG_PATH;
}

export function getClaudeModelsPath(): string {
  return CLAUDE_MODELS_PATH;
}

export function getOllamaConfigPath(): string {
  return OLLAMA_CONFIG_PATH;
}

export function getOllamaModelsPath(): string {
  return OLLAMA_MODELS_PATH;
}

export function getAppConfigPath(): string {
  return APP_CONFIG_PATH;
}

export function getRequestHistoryPath(): string {
  return REQUEST_HISTORY_PATH;
}

export function ensureConfigDir(): void {
  fs.mkdirSync(CONFIG_DIR, {
    recursive: true,
    mode: PRIVATE_DIR_MODE,
  });

  try {
    fs.chmodSync(CONFIG_DIR, PRIVATE_DIR_MODE);
  } catch {
    // ignore permission hardening failures
  }
}

export function writePrivateFile(filePath: string, contents: string): void {
  ensureConfigDir();
  fs.writeFileSync(filePath, contents, {
    encoding: "utf-8",
    mode: PRIVATE_FILE_MODE,
  });

  try {
    fs.chmodSync(filePath, PRIVATE_FILE_MODE);
  } catch {
    // ignore permission hardening failures
  }
}

export function ensurePrivateFile(filePath: string): void {
  ensureConfigDir();

  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "", {
        encoding: "utf-8",
        mode: PRIVATE_FILE_MODE,
      });
    }

    fs.chmodSync(filePath, PRIVATE_FILE_MODE);
  } catch {
    // ignore permission hardening failures
  }
}
