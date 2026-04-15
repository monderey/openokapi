import chalk from "chalk";
import {
  loadGuardrailsConfig,
  updateGuardrailsConfig,
} from "../../config/guardrails.js";
import { sanitizeText } from "../../functions/guardrails.js";
import { line, width } from "../../utils/cliTypes.js";
import { printWrappedMessage } from "../utils/formatting.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runGuardrails(commandArgs: string[]): void {
  const block = getFlagValue(commandArgs, "--add-block");
  if (block) {
    const current = loadGuardrailsConfig();
    updateGuardrailsConfig({
      blockedTerms: Array.from(
        new Set([...current.blockedTerms, block.trim()]),
      ),
    });
  }

  const text = getFlagValue(commandArgs, "--scan");
  const config = loadGuardrailsConfig();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Guardrails"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(`  Enabled: ${config.enabled ? chalk.green("yes") : chalk.red("no")}`),
  );
  console.log(
    line(`  Blocked terms: ${chalk.cyan(String(config.blockedTerms.length))}`),
  );
  console.log(
    line(
      `  Redaction rules: ${chalk.cyan(String(config.redactPatterns.length))}`,
    ),
  );
  if (text) {
    const result = sanitizeText(text);
    console.log(line(""));
    printWrappedMessage(
      `Scan: allowed=${result.allowed} blockedBy=${result.blockedBy || "none"}`,
    );
    printWrappedMessage(`Sanitized: ${result.sanitizedText}`);
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
