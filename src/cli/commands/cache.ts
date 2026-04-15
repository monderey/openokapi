import chalk from "chalk";
import {
  type CacheProvider,
  updateCacheConfig,
  updateCacheProviderPolicy,
  loadCacheConfig,
} from "../../config/cache.js";
import {
  clearResponseCache,
  getResponseCacheStats,
} from "../../utils/response-cache.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index === -1 || index + 1 >= commandArgs.length) return undefined;
  const value = commandArgs[index + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runCache(commandArgs: string[]): void {
  if (commandArgs.includes("--clear")) {
    clearResponseCache();
  }

  const enabledRaw = getFlagValue(commandArgs, "--enabled");
  const ttlRaw = getFlagValue(commandArgs, "--ttl-ms");
  const maxEntriesRaw = getFlagValue(commandArgs, "--max-entries");
  const providerRaw = getFlagValue(commandArgs, "--provider");
  const excludeModel = getFlagValue(commandArgs, "--exclude-model");
  const includeModel = getFlagValue(commandArgs, "--include-model");

  const provider =
    providerRaw === "openai" ||
    providerRaw === "claude" ||
    providerRaw === "ollama"
      ? (providerRaw as CacheProvider)
      : undefined;

  if (enabledRaw || ttlRaw || maxEntriesRaw || provider) {
    const partial: { enabled?: boolean; ttlMs?: number; maxEntries?: number } =
      {};
    if (enabledRaw !== undefined) {
      partial.enabled = ["1", "true", "yes", "on"].includes(
        enabledRaw.toLowerCase(),
      );
    }
    if (ttlRaw !== undefined && Number.isFinite(Number(ttlRaw))) {
      partial.ttlMs = Number(ttlRaw);
    }
    if (maxEntriesRaw !== undefined && Number.isFinite(Number(maxEntriesRaw))) {
      partial.maxEntries = Number(maxEntriesRaw);
    }
    if (provider) {
      const current = loadCacheConfig().providers[provider];
      const providerPartial: {
        enabled?: boolean;
        ttlMs?: number;
        excludedModels?: string[];
      } = {};

      if (partial.enabled !== undefined) {
        providerPartial.enabled = partial.enabled;
      }

      if (partial.ttlMs !== undefined) {
        providerPartial.ttlMs = partial.ttlMs;
      }

      if (excludeModel) {
        providerPartial.excludedModels = Array.from(
          new Set([
            ...current.excludedModels,
            excludeModel.trim().toLowerCase(),
          ]),
        );
      }

      if (includeModel) {
        providerPartial.excludedModels = current.excludedModels.filter(
          (item) => item !== includeModel.trim().toLowerCase(),
        );
      }

      updateCacheProviderPolicy(provider, providerPartial);
    }

    if (
      partial.maxEntries !== undefined ||
      (!provider && partial.enabled !== undefined)
    ) {
      const globalPartial: { enabled?: boolean; maxEntries?: number } = {};
      if (partial.maxEntries !== undefined) {
        globalPartial.maxEntries = partial.maxEntries;
      }
      if (!provider && partial.enabled !== undefined) {
        globalPartial.enabled = partial.enabled;
      }

      updateCacheConfig(globalPartial);
    }
  }

  const stats = getResponseCacheStats();
  const cacheConfig = loadCacheConfig();
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Cache"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Global: ${cacheConfig.enabled ? chalk.green("enabled") : chalk.red("disabled")}`,
    ),
  );
  console.log(
    line(`  Max entries: ${chalk.cyan(String(cacheConfig.maxEntries))}`),
  );
  console.log(line(""));
  console.log(
    line(
      `  OpenAI: ${cacheConfig.providers.openai.enabled ? "on" : "off"} • ttl ${cacheConfig.providers.openai.ttlMs}ms • excluded ${cacheConfig.providers.openai.excludedModels.length}`,
    ),
  );
  console.log(
    line(
      `  Claude: ${cacheConfig.providers.claude.enabled ? "on" : "off"} • ttl ${cacheConfig.providers.claude.ttlMs}ms • excluded ${cacheConfig.providers.claude.excludedModels.length}`,
    ),
  );
  console.log(
    line(
      `  Ollama: ${cacheConfig.providers.ollama.enabled ? "on" : "off"} • ttl ${cacheConfig.providers.ollama.ttlMs}ms • excluded ${cacheConfig.providers.ollama.excludedModels.length}`,
    ),
  );
  console.log(line(""));
  console.log(line(`  Entries: ${chalk.cyan(String(stats.entries))}`));
  console.log(line(`  Expired: ${chalk.yellow(String(stats.expired))}`));
  console.log(line(`  Newest: ${stats.newest || chalk.dim("n/a")}`));
  console.log(line(`  Oldest: ${stats.oldest || chalk.dim("n/a")}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
