export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIRequestOptions {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

export interface OpenAIStreamOptions extends OpenAIRequestOptions {
  stream: true;
}

export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export interface OpenAIModel {
  id: string;
  object: string;
  owned_by: string;
  permission: Array<{
    id: string;
    object: string;
    created: number;
    allow_create_engine: boolean;
    allow_fine_tuning: boolean;
    allow_logprobs: boolean;
    allow_sampling: boolean;
    allow_search_indices: boolean;
    allow_view: boolean;
    is_blocking: boolean;
  }>;
  root?: string;
  parent?: string | null;
}

export interface CachedOpenAIModel {
  id: string;
  name: string;
  context_window?: number;
  max_output_tokens?: number;
  owned_by?: string;
  created?: number;
  cached_at?: number;
}

export interface OpenAIConfig {
  apiKey?: string;
  enabled?: boolean;
  defaultModel?: string;
  baseURL?: string;
  requestTimeout?: number;
  maxRetries?: number;
  rateLimitPerMinute?: number;
}

export interface OpenAIRateLimitInfo {
  requestsRemaining: number;
  tokensRemaining: number;
  resetTime: number;
}

export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

export enum OpenAIErrorCode {
  INVALID_REQUEST = "invalid_request_error",
  AUTHENTICATION = "authentication_error",
  RATE_LIMIT = "rate_limit_error",
  SERVER = "server_error",
  TIMEOUT = "timeout_error",
  VALIDATION = "validation_error",
  NETWORK = "network_error",
}

export class OpenAIError extends Error {
  constructor(
    public code: OpenAIErrorCode,
    message: string,
    public originalError?: Error,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "OpenAIError";
  }
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

export interface RequestMetadata {
  id: string;
  timestamp: number;
  duration: number;
  tokensUsed: number;
  cached: boolean;
}

export interface EnhancedOpenAIResponse<T> {
  data: T;
  metadata: RequestMetadata;
  success: boolean;
}

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  level: LogLevel;
  timestamp: number;
  module: string;
  message: string;
  data?: unknown;
  error?: Error;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationSchema {
  model?: {
    required: boolean;
    pattern?: RegExp;
  };
  messages?: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
  };
  temperature?: {
    required: boolean;
    min?: number;
    max?: number;
  };
  max_tokens?: {
    required: boolean;
    min?: number;
    max?: number;
  };
}
export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

export interface RateLimitHeaders {
  "x-ratelimit-limit-requests"?: string;
  "x-ratelimit-limit-tokens"?: string;
  "x-ratelimit-remaining-requests"?: string;
  "x-ratelimit-remaining-tokens"?: string;
  "x-ratelimit-reset-requests"?: string;
  "x-ratelimit-reset-tokens"?: string;
}
