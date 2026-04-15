import chalk from "chalk";
import {
  deletePricingRule,
  loadPricingConfig,
  upsertPricingRule,
  type PricingProvider,
} from "../../config/pricing.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index === -1 || index + 1 >= commandArgs.length) {
    return undefined;
  }

  const value = commandArgs[index + 1];
  if (!value || value.startsWith("--")) {
    return undefined;
  }

  return value;
}

function parseProvider(value: string | undefined): PricingProvider | undefined {
  if (value === "openai" || value === "claude" || value === "ollama") {
    return value;
  }

  return undefined;
}

export function runPricing(commandArgs: string[]): void {
  const provider = parseProvider(getFlagValue(commandArgs, "--provider"));
  const match = getFlagValue(commandArgs, "--match");

  if (commandArgs.includes("--set")) {
    const inputRate = Number(getFlagValue(commandArgs, "--input") || "");
    const outputRate = Number(getFlagValue(commandArgs, "--output") || "");

    if (
      !provider ||
      !match ||
      !Number.isFinite(inputRate) ||
      !Number.isFinite(outputRate)
    ) {
      throw new Error(
        "Usage: openokapi pricing --set --provider <openai|claude|ollama> --match <model|prefix|*> --input <usd_per_1k> --output <usd_per_1k>",
      );
    }

    upsertPricingRule({
      provider,
      match,
      inputPer1kUsd: inputRate,
      outputPer1kUsd: outputRate,
    });
  }

  if (commandArgs.includes("--delete")) {
    if (!provider || !match) {
      throw new Error(
        "Usage: openokapi pricing --delete --provider <openai|claude|ollama> --match <model|prefix|*>",
      );
    }

    deletePricingRule(provider, match);
  }

  const config = loadPricingConfig();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Pricing"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Updated: ${chalk.cyan(config.updatedAt)}`));
  console.log(line(`  Rules: ${chalk.cyan(String(config.rules.length))}`));
  console.log(line(""));

  const scopedRules = provider
    ? config.rules.filter((rule) => rule.provider === provider)
    : config.rules;

  for (const rule of scopedRules) {
    console.log(
      line(
        `  ${rule.provider} ${chalk.green(rule.match)} in:${rule.inputPer1kUsd}/1k out:${rule.outputPer1kUsd}/1k`,
      ),
    );
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
