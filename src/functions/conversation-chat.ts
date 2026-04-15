import {
  appendConversationMessage,
  compressConversation,
  createConversation,
  getConversation,
  listConversations,
  type ConversationProvider,
} from "../config/conversations.js";
import { executeWithFailover } from "./failover.js";

const MAX_CONTEXT_MESSAGES = 12;
const AUTO_SUMMARY_THRESHOLD = 24;
const AUTO_SUMMARY_KEEP_RECENT = 10;

function buildHeuristicSummary(
  previousSummary: string | undefined,
  messages: Array<{ role: string; content: string }>,
): string {
  const lines: string[] = [];

  if (previousSummary?.trim()) {
    lines.push(`Previous summary: ${previousSummary.trim()}`);
  }

  for (const message of messages) {
    const snippet = message.content.replace(/\s+/g, " ").trim().slice(0, 180);
    if (!snippet) {
      continue;
    }
    lines.push(`${message.role.toUpperCase()}: ${snippet}`);
  }

  return lines.slice(-20).join("\n");
}

function maybeCompressConversation(conversationId: string): void {
  const conversation = getConversation(conversationId);
  if (!conversation) {
    return;
  }

  const nonSystem = conversation.messages.filter(
    (message) => message.role !== "system",
  );
  if (nonSystem.length < AUTO_SUMMARY_THRESHOLD) {
    return;
  }

  const compressCandidate = Math.max(
    0,
    nonSystem.length - AUTO_SUMMARY_KEEP_RECENT,
  );
  if (compressCandidate <= 0) {
    return;
  }

  const fullNonSystem = conversation.messages.filter(
    (message) => message.role !== "system",
  );
  const toSummarize = fullNonSystem.slice(0, compressCandidate);
  if (toSummarize.length === 0) {
    return;
  }

  const summary = buildHeuristicSummary(conversation.summary, toSummarize);
  if (!summary.trim()) {
    return;
  }

  compressConversation({
    conversationId,
    summary,
    keepRecentMessages: AUTO_SUMMARY_KEEP_RECENT,
  });
}

export function summarizeConversationNow(conversationId: string): {
  conversationId: string;
  compressed: boolean;
} {
  const before = getConversation(conversationId);
  if (!before) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  const previousCount = before.messages.length;
  maybeCompressConversation(conversationId);
  const after = getConversation(conversationId);

  return {
    conversationId,
    compressed: !!after && after.messages.length < previousCount,
  };
}

function formatContextPrompt(conversationId: string, input: string): string {
  const conversation = getConversation(conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  const recent = conversation.messages.slice(-MAX_CONTEXT_MESSAGES);
  const blocks = recent.map((message) => {
    const label = message.role === "assistant" ? "Assistant" : "User";
    if (message.role === "system") {
      return `System:\n${message.content}`;
    }

    return `${label}:\n${message.content}`;
  });

  if (conversation.summary?.trim()) {
    blocks.unshift(`Conversation summary:\n${conversation.summary.trim()}`);
  }

  blocks.push(`User:\n${input}`);
  blocks.push("Assistant:");
  return blocks.join("\n\n");
}

export function startConversation(input: {
  provider: ConversationProvider;
  model?: string;
  title?: string;
  system?: string;
}) {
  return createConversation(input);
}

export function getConversations() {
  return listConversations();
}

export async function sendConversationMessage(input: {
  conversationId: string;
  message: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const conversation = getConversation(input.conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${input.conversationId}`);
  }

  appendConversationMessage(input.conversationId, "user", input.message);
  maybeCompressConversation(input.conversationId);

  const prompt = formatContextPrompt(input.conversationId, input.message);
  const result = await executeWithFailover({
    provider: conversation.provider,
    model: conversation.model,
    prompt,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    historySource: "cli",
    historyAction: "chat",
  });

  if (!result.success || !result.content) {
    throw new Error(result.error?.message || "Conversation request failed");
  }

  appendConversationMessage(input.conversationId, "assistant", result.content);

  return {
    ...result,
    conversationId: input.conversationId,
    reply: result.content,
  };
}
