#!/usr/bin/env node
import chalk from "chalk";
import { startDiscordBotFromConfig } from "../discord/index.js";
import { printHelp, printWelcome } from "./utils/output.js";
import { runVersion } from "./commands/version.js";
import { runSetToken } from "./commands/discord/settoken.js";
import { runDiscordStatus } from "./commands/discord/status.js";
import { runDiscordVersion } from "./commands/discord/version.js";
import { runDiscordForeground } from "./commands/discord/foreground.js";
import { runSetApiKey } from "./commands/openai/setkey.js";
import { runOpenAIStatus } from "./commands/openai/status.js";
import { runUpdateModels } from "./commands/openai/update-models.js";
import { runSetAgent } from "./commands/openai/setagent.js";
import { runAsk } from "./commands/openai/ask.js";
import { runRateLimitStatus } from "./commands/openai/rate-limit.js";
import { runOpenAIHelp } from "./commands/openai/help.js";
import { runDiscordHelp } from "./commands/discord/help.js";
import { runClaudeHelp } from "./commands/claude/help.js";
import { runClaudeStatus } from "./commands/claude/status.js";
import { runUpdateModels as runClaudeUpdateModels } from "./commands/claude/update-models.js";
import { runSetAgent as runClaudeSetAgent } from "./commands/claude/setagent.js";
import { runSetApiKey as runClaudeSetApiKey } from "./commands/claude/setkey.js";
import { runAsk as runClaudeAsk } from "./commands/claude/ask.js";
import { runRateLimitStatus as runClaudeRateLimitStatus } from "./commands/claude/rate-limit.js";
import { runOllamaHelp } from "./commands/ollama/help.js";
import { runSetURL } from "./commands/ollama/seturl.js";
import { runSetAgent as runOllamaSetAgent } from "./commands/ollama/setagent.js";
import { runAsk as runOllamaAsk } from "./commands/ollama/ask.js";
import { runOllamaStatus } from "./commands/ollama/status.js";
import { runListModels } from "./commands/ollama/list.js";
import { runSearchModel } from "./commands/ollama/search.js";
import { runPullModel } from "./commands/ollama/pull.js";
import { runModelInfo } from "./commands/ollama/info.js";
import { runDeleteModel } from "./commands/ollama/delete.js";
import { runRateLimitStatus as runOllamaRateLimitStatus } from "./commands/ollama/rate-limit.js";
import { runOnboard } from "./commands/onboard.js";
import { runGenerateApiKey } from "./commands/generate/api-key.js";
import { runConfigShow } from "./commands/config/show.js";
import { runSetUserAgent } from "./commands/config/set-user-agent.js";
import { runGateway } from "./commands/gateway.js";

const args = process.argv.slice(2);

async function handleDiscordCommand(commandArgs: string[]): Promise<void> {
  if (
    commandArgs.length === 0 ||
    commandArgs.includes("--help") ||
    commandArgs.includes("help")
  ) {
    runDiscordHelp();
    return;
  }

  if (commandArgs.includes("--settoken")) {
    const tokenIndex = commandArgs.indexOf("--settoken") + 1;
    await runSetToken(commandArgs[tokenIndex]);
    return;
  }

  if (commandArgs.includes("--status")) {
    const statusIndex = commandArgs.indexOf("--status") + 1;
    const statusValue = commandArgs[statusIndex];
    const headlessIndex = commandArgs.indexOf("--headless");
    const headless = headlessIndex !== -1 ? "--headless" : undefined;
    await runDiscordStatus(statusValue, headless);
    return;
  }

  if (commandArgs.includes("--foreground")) {
    await runDiscordForeground();
    return;
  }

  if (commandArgs.includes("--version")) {
    await runDiscordVersion();
    return;
  }

  printHelp();
}

async function handleOpenAICommand(commandArgs: string[]): Promise<void> {
  if (
    commandArgs.length === 0 ||
    commandArgs.includes("--help") ||
    commandArgs.includes("help")
  ) {
    runOpenAIHelp();
    return;
  }

  if (commandArgs.includes("--setkey")) {
    const keyIndex = commandArgs.indexOf("--setkey") + 1;
    await runSetApiKey(commandArgs[keyIndex]);
    return;
  }

  if (commandArgs.includes("--ask")) {
    const askIndex = commandArgs.indexOf("--ask") + 1;
    const prompt = commandArgs.slice(askIndex).join(" ");
    await runAsk(prompt);
    return;
  }

  if (commandArgs.includes("--setagent")) {
    const agentIndex = commandArgs.indexOf("--setagent") + 1;
    await runSetAgent(commandArgs[agentIndex]);
    return;
  }

  if (commandArgs.includes("--status")) {
    await runOpenAIStatus();
    return;
  }

  if (commandArgs.includes("--rate-limit")) {
    await runRateLimitStatus();
    return;
  }

  if (commandArgs.includes("--update-models")) {
    await runUpdateModels();
    return;
  }

  printHelp();
}

async function handleClaudeCommand(commandArgs: string[]): Promise<void> {
  if (
    commandArgs.length === 0 ||
    commandArgs.includes("--help") ||
    commandArgs.includes("help")
  ) {
    runClaudeHelp();
    return;
  }

  if (commandArgs.includes("--setkey")) {
    const keyIndex = commandArgs.indexOf("--setkey") + 1;
    await runClaudeSetApiKey(commandArgs[keyIndex]);
    return;
  }

  if (commandArgs.includes("--ask")) {
    const askIndex = commandArgs.indexOf("--ask") + 1;
    const prompt = commandArgs.slice(askIndex).join(" ");
    await runClaudeAsk(prompt);
    return;
  }

  if (commandArgs.includes("--setagent")) {
    const agentIndex = commandArgs.indexOf("--setagent") + 1;
    await runClaudeSetAgent(commandArgs[agentIndex]);
    return;
  }

  if (commandArgs.includes("--status")) {
    await runClaudeStatus();
    return;
  }

  if (commandArgs.includes("--rate-limit")) {
    await runClaudeRateLimitStatus();
    return;
  }

  if (commandArgs.includes("--update-models")) {
    await runClaudeUpdateModels();
    return;
  }

  printHelp();
}

async function handleOllamaCommand(commandArgs: string[]): Promise<void> {
  if (
    commandArgs.length === 0 ||
    commandArgs.includes("--help") ||
    commandArgs.includes("help")
  ) {
    runOllamaHelp();
    return;
  }

  if (commandArgs.includes("--seturl")) {
    const urlIndex = commandArgs.indexOf("--seturl") + 1;
    await runSetURL(commandArgs[urlIndex]);
    return;
  }

  if (commandArgs.includes("--ask")) {
    const askIndex = commandArgs.indexOf("--ask") + 1;
    const prompt = commandArgs.slice(askIndex).join(" ");
    await runOllamaAsk(prompt);
    return;
  }

  if (commandArgs.includes("--setagent")) {
    const agentIndex = commandArgs.indexOf("--setagent") + 1;
    await runOllamaSetAgent(commandArgs[agentIndex]);
    return;
  }

  if (commandArgs.includes("--list")) {
    await runListModels();
    return;
  }

  if (commandArgs.includes("--search")) {
    const searchIndex = commandArgs.indexOf("--search") + 1;
    const searchTerm = commandArgs.slice(searchIndex).join(" ");
    await runSearchModel(searchTerm);
    return;
  }

  if (commandArgs.includes("--pull")) {
    const pullIndex = commandArgs.indexOf("--pull") + 1;
    await runPullModel(commandArgs[pullIndex]);
    return;
  }

  if (commandArgs.includes("--info")) {
    const infoIndex = commandArgs.indexOf("--info") + 1;
    await runModelInfo(commandArgs[infoIndex]);
    return;
  }

  if (commandArgs.includes("--delete")) {
    const deleteIndex = commandArgs.indexOf("--delete") + 1;
    await runDeleteModel(commandArgs[deleteIndex]);
    return;
  }

  if (commandArgs.includes("--status")) {
    await runOllamaStatus();
    return;
  }

  if (commandArgs.includes("--rate-limit")) {
    await runOllamaRateLimitStatus();
    return;
  }

  printHelp();
}

async function handleGenerateCommand(commandArgs: string[]): Promise<void> {
  if (commandArgs.length === 0 || commandArgs.includes("--help")) {
    printHelp();
    return;
  }

  if (commandArgs[0] === "api-key") {
    await runGenerateApiKey();
    return;
  }

  printHelp();
}

async function handleConfigCommand(commandArgs: string[]): Promise<void> {
  if (commandArgs.length === 0 || commandArgs.includes("--help")) {
    printHelp();
    return;
  }

  if (commandArgs.includes("--show")) {
    const showIndex = commandArgs.indexOf("--show") + 1;
    await runConfigShow(commandArgs[showIndex]);
    return;
  }

  if (commandArgs.includes("--set-user-agent")) {
    const uaIndex = commandArgs.indexOf("--set-user-agent") + 1;
    await runSetUserAgent(commandArgs[uaIndex]);
    return;
  }

  printHelp();
}

async function main(): Promise<void> {
  if (args.length === 1 && args[0] === "__internal_bot_start") {
    await startDiscordBotFromConfig();
    return;
  }

  if (args.length === 0) {
    printWelcome();
    return;
  }

  if (args[0] === "onboard") {
    await runOnboard();
    return;
  }

  if (args[0] === "version") {
    await runVersion();
    return;
  }

  if (args[0] === "generate") {
    await handleGenerateCommand(args.slice(1));
    return;
  }

  if (args[0] === "config") {
    await handleConfigCommand(args.slice(1));
    return;
  }

  if (args[0] === "gateway") {
    const portIndex = args.indexOf("--port");
    const port = portIndex !== -1 ? args[portIndex + 1] : undefined;
    await runGateway(port);
    return;
  }

  const [scope, agent, ...rest] = args;

  if (scope === "agent" && agent === "discord") {
    await handleDiscordCommand(rest);
    return;
  }

  if (scope === "agent" && agent === "openai") {
    await handleOpenAICommand(rest);
    return;
  }

  if (scope === "agent" && agent === "claude") {
    await handleClaudeCommand(rest);
    return;
  }

  if (scope === "agent" && agent === "ollama") {
    await handleOllamaCommand(rest);
    return;
  }

  printHelp();
}

main().catch((error) => {
  console.error(chalk.red("CLI Error:"), error);
  process.exit(1);
});
