import chalk from "chalk";
import {
  CAPABILITY_KEYS,
  loadCapabilitiesConfig,
  setCapability,
  type CapabilityKey,
} from "../../config/capabilities.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runCapabilities(commandArgs: string[]): void {
  const enable = getFlagValue(commandArgs, "--enable");
  const disable = getFlagValue(commandArgs, "--disable");

  if (enable && CAPABILITY_KEYS.includes(enable as CapabilityKey)) {
    setCapability(enable as CapabilityKey, true);
  }

  if (disable && CAPABILITY_KEYS.includes(disable as CapabilityKey)) {
    setCapability(disable as CapabilityKey, false);
  }

  const config = loadCapabilitiesConfig();
  const enabledCount = CAPABILITY_KEYS.filter(
    (key) => config.values[key],
  ).length;

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Capabilities"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(
    line(
      `  Enabled: ${chalk.green(String(enabledCount))}/${CAPABILITY_KEYS.length}`,
    ),
  );
  console.log(line(""));
  for (const key of CAPABILITY_KEYS) {
    const mark = config.values[key] ? chalk.green("✓") : chalk.red("✗");
    console.log(line(`  ${mark} ${key}`));
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
