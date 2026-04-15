import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getConversationsPath, writePrivateFile } from "./paths.js";

export type ConversationProvider = "openai" | "claude" | "ollama";
export type ConversationRole = "system" | "user" | "assistant";

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: string;
}

export interface ConversationThread {
  id: string;
  title: string;
  provider: ConversationProvider;
  model?: string;
  summary?: string;
  summarizedAt?: string;
  compressedCount?: number;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

function loadAll(): ConversationThread[] {
  try {
    const raw = fs.readFileSync(getConversationsPath(), "utf-8");
    const parsed = JSON.parse(raw) as ConversationThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(threads: ConversationThread[]): void {
  writePrivateFile(getConversationsPath(), JSON.stringify(threads, null, 2));
}

export function listConversations(): ConversationThread[] {
  return loadAll().sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export function getConversation(id: string): ConversationThread | undefined {
  return loadAll().find((thread) => thread.id === id);
}

export function createConversation(input: {
  title?: string;
  provider: ConversationProvider;
  model?: string;
  system?: string;
}): ConversationThread {
  const now = new Date().toISOString();
  const thread: ConversationThread = {
    id: randomUUID(),
    title: input.title?.trim() || "Untitled conversation",
    provider: input.provider,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  if (input.model?.trim()) {
    thread.model = input.model.trim();
  }

  if (input.system?.trim()) {
    thread.messages.push({
      id: randomUUID(),
      role: "system",
      content: input.system.trim(),
      timestamp: now,
    });
  }

  const threads = loadAll();
  threads.push(thread);
  saveAll(threads);
  return thread;
}

export function appendConversationMessage(
  conversationId: string,
  role: ConversationRole,
  content: string,
): ConversationThread {
  const threads = loadAll();
  const index = threads.findIndex((thread) => thread.id === conversationId);
  if (index === -1) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  const now = new Date().toISOString();
  const existing = threads[index];
  if (!existing) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }
  existing.messages.push({
    id: randomUUID(),
    role,
    content,
    timestamp: now,
  });
  existing.updatedAt = now;

  threads[index] = existing;
  saveAll(threads);
  return existing;
}

export function compressConversation(input: {
  conversationId: string;
  summary: string;
  keepRecentMessages: number;
}): ConversationThread {
  const threads = loadAll();
  const index = threads.findIndex(
    (thread) => thread.id === input.conversationId,
  );
  if (index === -1) {
    throw new Error(`Conversation not found: ${input.conversationId}`);
  }

  const thread = threads[index];
  if (!thread) {
    throw new Error(`Conversation not found: ${input.conversationId}`);
  }

  const systemMessages = thread.messages.filter(
    (message) => message.role === "system",
  );
  const nonSystemMessages = thread.messages.filter(
    (message) => message.role !== "system",
  );
  const keepRecent = Math.max(2, Math.floor(input.keepRecentMessages));
  const keptNonSystem = nonSystemMessages.slice(-keepRecent);

  const now = new Date().toISOString();
  thread.messages = [...systemMessages, ...keptNonSystem];
  thread.summary = input.summary.trim();
  thread.summarizedAt = now;
  thread.compressedCount = Math.max(
    0,
    nonSystemMessages.length - keptNonSystem.length,
  );
  thread.updatedAt = now;

  threads[index] = thread;
  saveAll(threads);
  return thread;
}

export function deleteConversation(id: string): boolean {
  const threads = loadAll();
  const next = threads.filter((thread) => thread.id !== id);
  if (next.length === threads.length) {
    return false;
  }

  saveAll(next);
  return true;
}
