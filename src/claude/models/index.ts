export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | Array<{ type: "text"; text: string }>;
}

export interface ClaudeRequestOptions {
  model: string;
  messages: ClaudeMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
}

export interface ClaudeMessageResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: Array<{ type: "text"; text: string }>;
  stop_reason?: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeModelInfo {
  id: string;
  type?: string;
  display_name?: string;
  created_at?: string;
}

export interface ClaudeModelsListResponse {
  data: ClaudeModelInfo[];
}

export interface ClaudeErrorResponse {
  type?: string;
  error?: {
    type: string;
    message: string;
  };
}

export enum ClaudeErrorCode {
  INVALID_REQUEST = "invalid_request_error",
  AUTHENTICATION = "authentication_error",
  RATE_LIMIT = "rate_limit_error",
  SERVER = "server_error",
  TIMEOUT = "timeout_error",
  VALIDATION = "validation_error",
  NETWORK = "network_error",
  PERMISSION = "permission_error",
}

export class ClaudeError extends Error {
  constructor(
    public code: ClaudeErrorCode,
    message: string,
    public originalError?: Error,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "ClaudeError";
  }
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
  "anthropic-ratelimit-requests-limit"?: string;
  "anthropic-ratelimit-requests-remaining"?: string;
  "anthropic-ratelimit-requests-reset"?: string;
  "anthropic-ratelimit-tokens-limit"?: string;
  "anthropic-ratelimit-tokens-remaining"?: string;
  "anthropic-ratelimit-tokens-reset"?: string;
}
