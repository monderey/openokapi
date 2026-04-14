import chalk from "chalk";
import {
  loadAppConfig,
  saveAppConfig,
  updateAppConfig,
} from "../../../config/app.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

const ALLOWED = ["openai", "claude", "ollama", "off"] as const;

export async function runSetFallback(provider?: string): Promise<void> {
  if (!provider) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Config Set Fallback"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetFallback") +
        chalk.dim(" ───────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("No fallback provider provided")}`);
    printWrappedMessage(
      `Usage: ${chalk.cyan("openokapi config --set-fallback <openai|claude|ollama|off>")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const normalized = provider.trim().toLowerCase();
  if (!ALLOWED.includes(normalized as (typeof ALLOWED)[number])) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Config Set Fallback"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("SetFallback") +
        chalk.dim(" ───────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(`Error: ${chalk.red("Unsupported fallback provider")}`);
    printWrappedMessage(`Allowed: ${chalk.cyan(ALLOWED.join(", "))}`);
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (normalized === "off") {
    const current = loadAppConfig();
    const { fallbackProvider: _unused, ...rest } = current;
    saveAppConfig(rest);
  } else {
    updateAppConfig({
      fallbackProvider: normalized as "openai" | "claude" | "ollama",
    });
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Config Set Fallback"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("SetFallback") +
      chalk.dim(" ───────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(
      `  ${chalk.green("✓")} Fallback provider: ${chalk.cyan(normalized === "off" ? "disabled" : normalized)}`,
    ),
  );
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
