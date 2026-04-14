export {
  OpenAIClient,
  createOpenAIClient,
  getOpenAIClient,
  openaiClient,
} from "./openai/client.js";
export type {
  OpenAIClientOptions,
  RateLimitConfig as OpenAIRateLimitConfig,
} from "./openai/client.js";
export type {
  ChatCompletionMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  CompletionRequest,
  CompletionResponse,
  ModelInfo,
} from "./openai/resources/types.js";
export { StreamProcessor } from "./openai/streaming/processor.js";
export type { StreamHandler } from "./openai/streaming/processor.js";
export {
  ClaudeClient,
  createClaudeClient,
  getClaudeClient,
  claudeClient,
} from "./claude/client.js";
export type {
  ClaudeClientOptions,
  RateLimitConfig as ClaudeRateLimitConfig,
} from "./claude/client.js";
export type {
  ClaudeMessage,
  ClaudeRequestOptions,
  ClaudeMessageResponse,
  ClaudeModelInfo,
  ClaudeModelsListResponse,
  ClaudeErrorResponse,
  ClaudeErrorCode,
  ClaudeError,
  LogLevel,
  LogEntry,
  ValidationResult,
  RateLimitHeaders,
} from "./claude/models/index.js";
export {
  sendOpenAIRequest,
  streamOpenAIRequest,
  formatErrorForCLI as formatOpenAIErrorForCLI,
} from "./functions/openai-request.js";
export {
  sendClaudeRequest,
  formatClaudeErrorForCLI,
  formatClaudeErrorForDiscord,
} from "./functions/claude-request.js";
export {
  loadOpenAIConfig,
  saveOpenAIConfig,
  updateOpenAIConfig,
  loadOpenAIModels,
  saveOpenAIModels,
} from "./config/openai.js";
export type { OpenAIConfig, OpenAIModel } from "./config/openai.js";
export {
  loadClaudeConfig,
  saveClaudeConfig,
  updateClaudeConfig,
  loadClaudeModels,
  saveClaudeModels,
} from "./config/claude.js";
export type { ClaudeConfig, ClaudeModel } from "./config/claude.js";
export {
  loadDiscordConfig,
  saveDiscordConfig,
  updateDiscordConfig,
} from "./config/discord.js";
export type { DiscordConfig } from "./config/discord.js";
export { startDiscordBot, startDiscordBotFromConfig } from "./discord/index.js";
export { getVersion } from "./version.js";
export {
  OPENAI_DEFAULT_BASE_URL,
  OPENAI_API_VERSION,
  getOpenAIVersionInfo,
} from "./openai/version.js";
export type { OpenAIVersionInfo } from "./openai/version.js";
export {
  CLAUDE_DEFAULT_BASE_URL,
  CLAUDE_API_VERSION,
  getClaudeVersionInfo,
} from "./claude/version.js";
export type { ClaudeVersionInfo } from "./claude/version.js";
export { OllamaClient } from "./ollama/client.js";
export type { OllamaClientOptions } from "./ollama/client.js";
export type {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaModelInfo,
  OllamaPullResponse,
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  RateLimitConfig as OllamaRateLimitConfig,
} from "./ollama/models/index.js";
export {
  loadOllamaConfig,
  saveOllamaConfig,
  updateOllamaConfig,
  loadOllamaModels,
  saveOllamaModels,
  findOllamaModel,
  modelExists,
} from "./config/ollama.js";
export type { OllamaConfig, OllamaModel } from "./config/ollama.js";
export {
  sendOllamaRequest,
  formatErrorForCLI as formatOllamaErrorForCLI,
} from "./functions/ollama-request.js";
