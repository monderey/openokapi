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
import { runSetFallback } from "./commands/config/set-fallback.js";
import { runGateway } from "./commands/gateway.js";
import { runHistory } from "./commands/history.js";
import { runBatch } from "./commands/batch.js";
import { runProfileCommand } from "./commands/profiles.js";
import { runCache } from "./commands/cache.js";
import { runCosts } from "./commands/costs.js";
import { runReplay } from "./commands/replay.js";
import { runChat } from "./commands/chat.js";
import { runPricing } from "./commands/pricing.js";
import { runCapabilities } from "./commands/capabilities.js";
import { runIntegrations } from "./commands/integrations.js";
import { runRouter } from "./commands/router.js";
import { runGuardrails } from "./commands/guardrails.js";
import { runEval } from "./commands/eval.js";
import { runBudget } from "./commands/budget.js";
import { runAutomations } from "./commands/automations.js";
import { runHooks } from "./commands/hooks.js";
import { runScheduler } from "./commands/scheduler.js";
import { runSelfTest } from "./commands/self-test.js";
import { runStandingOrders } from "./commands/standing-orders.js";
import { runTaskFlowCommand } from "./commands/task-flow.js";
import { runHeartbeat } from "./commands/heartbeat.js";
import { runTasks } from "./commands/tasks.js";
import { runDoctorCommand } from "./commands/doctor.js";
import { runBackupCommand } from "./commands/backup.js";
import { runResetCommand } from "./commands/reset.js";
import { runSecurityCommand } from "./commands/security.js";
import { runStatusCommand } from "./commands/status.js";
import { runAlertsCommand } from "./commands/alerts.js";
import { runIncidentsCommand } from "./commands/incidents.js";
import { runMaintenanceWindowsCommand } from "./commands/maintenance-windows.js";
import { runEscalationsCommand } from "./commands/escalations.js";

const args = process.argv.slice(2);

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
    const token = getFlagValue(commandArgs, "--settoken");
    if (!token) {
      printHelp();
      return;
    }

    await runSetToken(token);
    return;
  }

  if (commandArgs.includes("--status")) {
    const statusValue = getFlagValue(commandArgs, "--status");
    if (!statusValue) {
      printHelp();
      return;
    }

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
    const apiKey = getFlagValue(commandArgs, "--setkey");
    if (!apiKey) {
      printHelp();
      return;
    }

    await runSetApiKey(apiKey);
    return;
  }

  if (commandArgs.includes("--ask")) {
    const askIndex = commandArgs.indexOf("--ask") + 1;
    if (askIndex >= commandArgs.length) {
      printHelp();
      return;
    }

    const prompt = commandArgs.slice(askIndex).join(" ");
    if (!prompt.trim()) {
      printHelp();
      return;
    }

    await runAsk(prompt);
    return;
  }

  if (commandArgs.includes("--setagent")) {
    const agent = getFlagValue(commandArgs, "--setagent");
    if (!agent) {
      printHelp();
      return;
    }

    await runSetAgent(agent);
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
    const apiKey = getFlagValue(commandArgs, "--setkey");
    if (!apiKey) {
      printHelp();
      return;
    }

    await runClaudeSetApiKey(apiKey);
    return;
  }

  if (commandArgs.includes("--ask")) {
    const askIndex = commandArgs.indexOf("--ask") + 1;
    if (askIndex >= commandArgs.length) {
      printHelp();
      return;
    }

    const prompt = commandArgs.slice(askIndex).join(" ");
    if (!prompt.trim()) {
      printHelp();
      return;
    }

    await runClaudeAsk(prompt);
    return;
  }

  if (commandArgs.includes("--setagent")) {
    const agent = getFlagValue(commandArgs, "--setagent");
    if (!agent) {
      printHelp();
      return;
    }

    await runClaudeSetAgent(agent);
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
    const url = getFlagValue(commandArgs, "--seturl");
    if (!url) {
      printHelp();
      return;
    }

    await runSetURL(url);
    return;
  }

  if (commandArgs.includes("--ask")) {
    const askIndex = commandArgs.indexOf("--ask") + 1;
    if (askIndex >= commandArgs.length) {
      printHelp();
      return;
    }

    const prompt = commandArgs.slice(askIndex).join(" ");
    if (!prompt.trim()) {
      printHelp();
      return;
    }

    await runOllamaAsk(prompt);
    return;
  }

  if (commandArgs.includes("--setagent")) {
    const agent = getFlagValue(commandArgs, "--setagent");
    if (!agent) {
      printHelp();
      return;
    }

    await runOllamaSetAgent(agent);
    return;
  }

  if (commandArgs.includes("--list")) {
    await runListModels();
    return;
  }

  if (commandArgs.includes("--search")) {
    const searchIndex = commandArgs.indexOf("--search") + 1;
    if (searchIndex >= commandArgs.length) {
      printHelp();
      return;
    }

    const searchTerm = commandArgs.slice(searchIndex).join(" ");
    if (!searchTerm.trim()) {
      printHelp();
      return;
    }

    await runSearchModel(searchTerm);
    return;
  }

  if (commandArgs.includes("--pull")) {
    const model = getFlagValue(commandArgs, "--pull");
    if (!model) {
      printHelp();
      return;
    }

    await runPullModel(model);
    return;
  }

  if (commandArgs.includes("--info")) {
    const model = getFlagValue(commandArgs, "--info");
    if (!model) {
      printHelp();
      return;
    }

    await runModelInfo(model);
    return;
  }

  if (commandArgs.includes("--delete")) {
    const model = getFlagValue(commandArgs, "--delete");
    if (!model) {
      printHelp();
      return;
    }

    await runDeleteModel(model);
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
    const showValue = getFlagValue(commandArgs, "--show");
    if (!showValue) {
      printHelp();
      return;
    }

    await runConfigShow(showValue);
    return;
  }

  if (commandArgs.includes("--set-user-agent")) {
    const userAgent = getFlagValue(commandArgs, "--set-user-agent");
    if (!userAgent) {
      printHelp();
      return;
    }

    await runSetUserAgent(userAgent);
    return;
  }

  if (commandArgs.includes("--set-fallback")) {
    const fallbackProvider = getFlagValue(commandArgs, "--set-fallback");
    if (!fallbackProvider) {
      printHelp();
      return;
    }

    await runSetFallback(fallbackProvider);
    return;
  }

  printHelp();
}

async function handleHistoryCommand(commandArgs: string[]): Promise<void> {
  runHistory(commandArgs);
}

async function handleBatchCommand(commandArgs: string[]): Promise<void> {
  const filePath = getFlagValue(commandArgs, "--file");
  const concurrency = getFlagValue(commandArgs, "--concurrency");
  await runBatch(filePath, concurrency);
}

async function handleChatCommand(commandArgs: string[]): Promise<void> {
  await runChat(commandArgs);
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
    const port = getFlagValue(args, "--port");
    await runGateway(port);
    return;
  }

  if (args[0] === "history") {
    await handleHistoryCommand(args.slice(1));
    return;
  }

  if (args[0] === "batch") {
    await handleBatchCommand(args.slice(1));
    return;
  }

  if (args[0] === "profile") {
    await runProfileCommand(args.slice(1));
    return;
  }

  if (args[0] === "cache") {
    runCache(args.slice(1));
    return;
  }

  if (args[0] === "costs") {
    runCosts(args.slice(1));
    return;
  }

  if (args[0] === "replay") {
    runReplay(args.slice(1));
    return;
  }

  if (args[0] === "chat") {
    await handleChatCommand(args.slice(1));
    return;
  }

  if (args[0] === "pricing") {
    runPricing(args.slice(1));
    return;
  }

  if (args[0] === "capabilities") {
    runCapabilities(args.slice(1));
    return;
  }

  if (args[0] === "integrations") {
    await runIntegrations(args.slice(1));
    return;
  }

  if (args[0] === "router") {
    runRouter(args.slice(1));
    return;
  }

  if (args[0] === "guardrails") {
    runGuardrails(args.slice(1));
    return;
  }

  if (args[0] === "eval") {
    runEval(args.slice(1));
    return;
  }

  if (args[0] === "budget") {
    runBudget(args.slice(1));
    return;
  }

  if (args[0] === "automations") {
    await runAutomations(args.slice(1));
    return;
  }

  if (args[0] === "hooks") {
    await runHooks(args.slice(1));
    return;
  }

  if (args[0] === "heartbeat") {
    await runHeartbeat(args.slice(1));
    return;
  }

  if (args[0] === "standing-orders") {
    runStandingOrders(args.slice(1));
    return;
  }

  if (args[0] === "scheduler") {
    await runScheduler(args.slice(1));
    return;
  }

  if (args[0] === "task-flow") {
    await runTaskFlowCommand(args.slice(1));
    return;
  }

  if (args[0] === "tasks") {
    runTasks(args.slice(1));
    return;
  }

  if (args[0] === "doctor") {
    runDoctorCommand(args.slice(1));
    return;
  }

  if (args[0] === "backup") {
    runBackupCommand(args.slice(1));
    return;
  }

  if (args[0] === "reset") {
    runResetCommand(args.slice(1));
    return;
  }

  if (args[0] === "security") {
    runSecurityCommand(args.slice(1));
    return;
  }

  if (args[0] === "status") {
    runStatusCommand(args.slice(1));
    return;
  }

  if (args[0] === "alerts") {
    runAlertsCommand(args.slice(1));
    return;
  }

  if (args[0] === "incidents") {
    runIncidentsCommand(args.slice(1));
    return;
  }

  if (args[0] === "maintenance-windows") {
    runMaintenanceWindowsCommand(args.slice(1));
    return;
  }

  if (args[0] === "escalations") {
    await runEscalationsCommand(args.slice(1));
    return;
  }

  if (args[0] === "self-test") {
    runSelfTest();
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
