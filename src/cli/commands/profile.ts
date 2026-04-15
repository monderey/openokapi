import chalk from "chalk";
import {
  deleteProfile,
  listProfiles,
  upsertProfile,
} from "../../config/profiles.js";
import { extractTemplateVariables } from "../../utils/template.js";
import { runProfile } from "../../functions/profile-runner.js";
import { line, width } from "../../utils/cliTypes.js";
import { printWrappedMessage, printWrappedLines } from "../utils/formatting.js";

function getFlagValue(commandArgs: string[], flag: string): string | undefined {
  const flagIndex = commandArgs.indexOf(flag);
  if (flagIndex === -1 || flagIndex + 1 >= commandArgs.length) {
    return undefined;
  }

  const value = commandArgs[flagIndex + 1];
  if (!value || value.startsWith("--")) {
    return undefined;
  }

  return value;
}

function getRepeatedFlagValues(commandArgs: string[], flag: string): string[] {
  const values: string[] = [];

  for (let index = 0; index < commandArgs.length; index += 1) {
    if (commandArgs[index] !== flag) {
      continue;
    }

    const value = commandArgs[index + 1];
    if (!value || value.startsWith("--")) {
      continue;
    }

    values.push(value);
  }

  return values;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function printTitle(title: string): void {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green(title));
  console.log(chalk.dim("│"));
}

function printFooter(): void {
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}

function printHelp(): void {
  printTitle("OpenOKAPI Profiles");
  console.log(line(""));
  console.log(line(`  List: ${chalk.cyan("openokapi profile --list")}`));
  console.log(line(`  Show: ${chalk.cyan("openokapi profile --show <name>")}`));
  console.log(
    line(`  Delete: ${chalk.cyan("openokapi profile --delete <name>")}`),
  );
  console.log(
    line(
      `  Save: ${chalk.cyan('openokapi profile --set <name> --provider openai --template "..."')}`,
    ),
  );
  console.log(
    line(
      `  Run: ${chalk.cyan('openokapi profile --run <name> --input "..." [--var key=value]')}`,
    ),
  );
  console.log(line(""));
  printFooter();
}

function formatProfileSummary(profile: {
  name: string;
  provider: string;
  model?: string;
  description?: string;
  template: string;
}): string {
  const variables = extractTemplateVariables(profile.template);
  const details = [
    profile.provider,
    profile.model ? `model=${profile.model}` : undefined,
    variables.length > 0 ? `vars=${variables.join(",")}` : undefined,
  ]
    .filter(Boolean)
    .join(" • ");

  return `${profile.name} (${details})${profile.description ? ` - ${profile.description}` : ""}`;
}

export async function runProfileCommand(commandArgs: string[]): Promise<void> {
  if (commandArgs.length === 0 || commandArgs.includes("--help")) {
    printHelp();
    return;
  }

  if (commandArgs.includes("--list")) {
    const profiles = listProfiles();
    printTitle("OpenOKAPI Profiles");
    console.log(line(""));

    if (profiles.length === 0) {
      console.log(line(`  ${chalk.dim("No profiles configured yet.")}`));
      console.log(line(""));
      printFooter();
      return;
    }

    console.log(line(`  Profiles: ${chalk.cyan(String(profiles.length))}`));
    console.log(line(""));

    for (const profile of profiles) {
      console.log(line(`  ${chalk.green(profile.name)}`));
      printWrappedMessage(`    ${formatProfileSummary(profile)}`);
      console.log(line(""));
    }

    printFooter();
    return;
  }

  if (commandArgs.includes("--show")) {
    const name = getFlagValue(commandArgs, "--show");
    if (!name) {
      printHelp();
      return;
    }

    const profile = listProfiles().find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (!profile) {
      throw new Error(`Profile not found: ${name}`);
    }

    printTitle(`OpenOKAPI Profile: ${profile.name}`);
    console.log(line(""));
    console.log(line(`  Provider: ${chalk.cyan(profile.provider)}`));
    console.log(line(`  Model: ${chalk.cyan(profile.model || "default")}`));
    console.log(
      line(`  Description: ${profile.description || chalk.dim("none")}`),
    );
    console.log(
      line(
        `  Template variables: ${extractTemplateVariables(profile.template).join(", ") || chalk.dim("none")}`,
      ),
    );
    if (profile.system) {
      console.log(line(`  System: ${chalk.dim(profile.system)}`));
    }
    if (profile.temperature !== undefined) {
      console.log(
        line(`  Temperature: ${chalk.yellow(String(profile.temperature))}`),
      );
    }
    if (profile.maxTokens !== undefined) {
      console.log(
        line(`  Max tokens: ${chalk.yellow(String(profile.maxTokens))}`),
      );
    }
    console.log(line(""));
    printWrappedMessage(`Template: ${profile.template}`);
    console.log(line(""));
    printFooter();
    return;
  }

  if (commandArgs.includes("--delete")) {
    const name = getFlagValue(commandArgs, "--delete");
    if (!name) {
      printHelp();
      return;
    }

    const deleted = deleteProfile(name);
    printTitle("OpenOKAPI Profiles");
    console.log(line(""));
    console.log(
      line(
        `  ${deleted ? chalk.green("✓") : chalk.yellow("!")} ${deleted ? "Profile deleted" : "Profile not found"}`,
      ),
    );
    console.log(line(""));
    printFooter();
    return;
  }

  if (commandArgs.includes("--set")) {
    const name = getFlagValue(commandArgs, "--set");
    const provider = getFlagValue(commandArgs, "--provider");
    const template = getFlagValue(commandArgs, "--template");

    if (!name || !provider || !template) {
      printHelp();
      return;
    }

    const input: {
      name: string;
      provider: "openai" | "claude" | "ollama";
      template: string;
      model?: string;
      description?: string;
      system?: string;
      temperature?: number;
      maxTokens?: number;
    } = {
      name,
      provider: provider as "openai" | "claude" | "ollama",
      template,
    };

    const model = getFlagValue(commandArgs, "--model");
    const description = getFlagValue(commandArgs, "--description");
    const system = getFlagValue(commandArgs, "--system");
    const temperature = parseNumber(getFlagValue(commandArgs, "--temperature"));
    const maxTokens = parseNumber(getFlagValue(commandArgs, "--max-tokens"));

    if (model) input.model = model;
    if (description) input.description = description;
    if (system) input.system = system;
    if (typeof temperature === "number") input.temperature = temperature;
    if (typeof maxTokens === "number") input.maxTokens = maxTokens;

    const profile = upsertProfile(input);

    printTitle("OpenOKAPI Profiles");
    console.log(line(""));
    console.log(line(`  ${chalk.green("✓")} Profile saved`));
    console.log(line(`  Name: ${chalk.cyan(profile.name)}`));
    console.log(line(`  Provider: ${chalk.cyan(profile.provider)}`));
    console.log(line(""));
    printFooter();
    return;
  }

  if (commandArgs.includes("--run")) {
    const name = getFlagValue(commandArgs, "--run");
    const input = getFlagValue(commandArgs, "--input");
    const prompt = input || getFlagValue(commandArgs, "--prompt");
    const variablePairs = getRepeatedFlagValues(commandArgs, "--var");

    if (!name || !prompt) {
      printHelp();
      return;
    }

    const variables: Record<string, string> = {};
    for (const pair of variablePairs) {
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      if (key) {
        variables[key] = value;
      }
    }

    const result = await runProfile(name, {
      input: prompt,
      variables,
      historySource: "cli",
    });

    printTitle(`OpenOKAPI Profile: ${result.profile.name}`);
    console.log(line(""));
    console.log(line(`  Provider: ${chalk.cyan(result.providerUsed)}`));
    console.log(line(`  Model: ${chalk.cyan(result.modelUsed)}`));
    console.log(
      line(
        `  Fallback: ${result.fallbackUsed ? chalk.yellow("yes") : chalk.green("no")}`,
      ),
    );
    console.log(line(""));
    printWrappedMessage(`Prompt: ${result.prompt}`);
    console.log(line(""));
    printWrappedLines(result.response.split("\n"));
    console.log(line(""));
    printFooter();
    return;
  }

  printHelp();
}
