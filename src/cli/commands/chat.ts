import chalk from "chalk";
import {
  deleteConversation,
  getConversation,
} from "../../config/conversations.js";
import {
  getConversations,
  sendConversationMessage,
  summarizeConversationNow,
  startConversation,
} from "../../functions/conversation-chat.js";
import { line, width } from "../../utils/cliTypes.js";
import { printWrappedLines, printWrappedMessage } from "../utils/formatting.js";

function getFlagValue(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index === -1 || index + 1 >= commandArgs.length) return undefined;
  const value = commandArgs[index + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export async function runChat(commandArgs: string[]): Promise<void> {
  if (commandArgs.includes("--list")) {
    const conversations = getConversations();
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Chat"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    if (conversations.length === 0) {
      console.log(line(`  ${chalk.dim("No conversations yet")}`));
    } else {
      for (const item of conversations.slice(0, 50)) {
        console.log(
          line(
            `  ${chalk.cyan(item.id)} ${chalk.green(item.provider)} ${item.title}`,
          ),
        );
      }
    }
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (commandArgs.includes("--start")) {
    const provider = getFlagValue(commandArgs, "--provider") as
      | "openai"
      | "claude"
      | "ollama"
      | undefined;
    if (!provider) {
      throw new Error("Missing --provider for conversation start");
    }

    const startInput: {
      provider: "openai" | "claude" | "ollama";
      model?: string;
      title?: string;
      system?: string;
    } = {
      provider,
    };
    const model = getFlagValue(commandArgs, "--model");
    const title = getFlagValue(commandArgs, "--title");
    const system = getFlagValue(commandArgs, "--system");
    if (model) startInput.model = model;
    if (title) startInput.title = title;
    if (system) startInput.system = system;

    const conversation = startConversation(startInput);

    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Chat"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(line(`  ${chalk.green("✓")} Conversation started`));
    console.log(line(`  ID: ${chalk.cyan(conversation.id)}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--delete");
    if (!id) {
      throw new Error("Missing conversation id for --delete");
    }

    const deleted = deleteConversation(id);
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Chat"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(
      line(
        `  ${deleted ? chalk.green("✓") : chalk.yellow("!")} ${deleted ? "Conversation deleted" : "Conversation not found"}`,
      ),
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (commandArgs.includes("--history")) {
    const id = getFlagValue(commandArgs, "--history");
    if (!id) {
      throw new Error("Missing conversation id for --history");
    }

    const conversation = getConversation(id);
    if (!conversation) {
      throw new Error(`Conversation not found: ${id}`);
    }

    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Chat History"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(line(`  ${chalk.cyan(conversation.id)} ${conversation.title}`));
    console.log(line(""));
    for (const message of conversation.messages.slice(-20)) {
      printWrappedMessage(`${message.role.toUpperCase()}: ${message.content}`);
      console.log(line(""));
    }
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (commandArgs.includes("--summarize")) {
    const id = getFlagValue(commandArgs, "--summarize");
    if (!id) {
      throw new Error("Missing conversation id for --summarize");
    }

    const result = summarizeConversationNow(id);
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Chat"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(
      line(
        `  ${result.compressed ? chalk.green("✓") : chalk.yellow("!")} ${result.compressed ? "Conversation compressed" : "No compression needed"}`,
      ),
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  if (commandArgs.includes("--id") && commandArgs.includes("--ask")) {
    const id = getFlagValue(commandArgs, "--id");
    const askIndex = commandArgs.indexOf("--ask");
    const prompt =
      askIndex >= 0 ? commandArgs.slice(askIndex + 1).join(" ") : "";

    if (!id || !prompt.trim()) {
      throw new Error(
        "Use: openokapi chat --id <conversation-id> --ask <prompt>",
      );
    }

    const messageInput: {
      conversationId: string;
      message: string;
      temperature?: number;
      maxTokens?: number;
    } = {
      conversationId: id,
      message: prompt,
    };

    const temperatureRaw = Number(
      getFlagValue(commandArgs, "--temperature") || "",
    );
    const maxTokensRaw = Number(
      getFlagValue(commandArgs, "--max-tokens") || "",
    );
    if (Number.isFinite(temperatureRaw) && temperatureRaw > 0) {
      messageInput.temperature = temperatureRaw;
    }
    if (Number.isFinite(maxTokensRaw) && maxTokensRaw > 0) {
      messageInput.maxTokens = maxTokensRaw;
    }

    const result = await sendConversationMessage(messageInput);

    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Chat"));
    console.log(chalk.dim("│"));
    console.log(line(""));
    console.log(line(`  Provider: ${chalk.cyan(result.providerUsed)}`));
    console.log(line(`  Model: ${chalk.cyan(result.modelUsed)}`));
    console.log(line(""));
    printWrappedLines(result.reply.split("\n"));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  throw new Error(
    "Use: openokapi chat --start --provider <openai|claude|ollama> | --list | --id <id> --ask <text>",
  );
}
