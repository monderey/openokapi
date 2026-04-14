import axios, { type AxiosInstance } from "axios";
import type {
  ClaudeMessageResponse,
  ClaudeRequestOptions,
  ClaudeModelInfo,
} from "./models/index.js";
import { Logger } from "./utils/logger.js";
import { RateLimiter } from "./utils/rate-limiter.js";
import { loadClaudeConfig } from "../config/claude.js";

export interface ClaudeClientOptions {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

export class ClaudeClient {
  private static readonly MODULE = "ClaudeClient";
  private static readonly BASE_URL = "https://api.anthropic.com/v1";
  private static readonly DEFAULT_TIMEOUT = 30000;
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly API_VERSION = "2023-06-01";

  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private httpClient: AxiosInstance;

  constructor(options?: ClaudeClientOptions) {
    const config = loadClaudeConfig();

    this.apiKey = options?.apiKey || config.apiKey || "";
    this.baseURL = options?.baseURL || ClaudeClient.BASE_URL;
    this.timeout = options?.timeout || ClaudeClient.DEFAULT_TIMEOUT;
    this.maxRetries = options?.maxRetries || ClaudeClient.DEFAULT_MAX_RETRIES;

    if (!this.apiKey) {
      throw new Error(
        "Claude API key not configured. Set CLAUDE_API_KEY environment variable or pass it in options.",
      );
    }

    this.httpClient = this.createHttpClient();

    Logger.info(ClaudeClient.MODULE, "Claude Client initialized", {
      baseURL: this.baseURL,
    });
  }

  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": ClaudeClient.API_VERSION,
        "Content-Type": "application/json",
        "User-Agent": "OpenOKAPI/1.0",
      },
    });
  }

  async listModels(): Promise<ClaudeModelInfo[]> {
    const response = await this.httpClient.get("/models");
    return response.data?.data || [];
  }

  async sendMessage(request: ClaudeRequestOptions): Promise<string> {
    if (!RateLimiter.canMakeRequest(request.max_tokens || 100)) {
      throw new Error("Rate limit exceeded");
    }

    const response = await this.httpClient.post<ClaudeMessageResponse>(
      "/messages",
      request,
    );

    RateLimiter.updateFromHeaders(response.headers as any);
    RateLimiter.consumeRequest(request.max_tokens || 100);

    const contentParts = response.data?.content || [];
    return contentParts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.httpClient.defaults.headers["x-api-key"] = apiKey;
    Logger.info(ClaudeClient.MODULE, "API key updated");
  }

  configureRateLimit(config: RateLimitConfig): void {
    RateLimiter.configure(config);
    Logger.info(ClaudeClient.MODULE, "Rate limiter configured");
  }

  getRateLimitStatus() {
    return RateLimiter.getStatus();
  }

  async getStatus() {
    return {
      configured: !!this.apiKey,
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      rateLimitStatus: this.getRateLimitStatus(),
    };
  }

  async validateApiKey(modelToCheck: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        return {
          valid: false,
          error: "API key not configured",
        };
      }

      const modelsResponse = await this.httpClient.get("/models", {
        timeout: 10000,
      });

      RateLimiter.updateFromHeaders(modelsResponse.headers as any);

      if (
        modelsResponse.status !== 200 ||
        !Array.isArray(modelsResponse.data?.data)
      ) {
        return {
          valid: false,
          error: "Cannot list available models",
        };
      }

      const modelExists = modelsResponse.data.data.some(
        (model: { id?: string }) => model.id === modelToCheck,
      );

      if (!modelExists) {
        return {
          valid: false,
          error: `Model "${modelToCheck}" is not available in your account`,
        };
      }

      try {
        const testResponse = await this.httpClient.post(
          "/messages",
          {
            model: modelToCheck,
            max_tokens: 1,
            messages: [
              { role: "user", content: [{ type: "text", text: "." }] },
            ],
          },
          {
            timeout: 15000,
          },
        );

        RateLimiter.updateFromHeaders(testResponse.headers as any);

        if (testResponse.status === 200 && testResponse.data?.content) {
          Logger.info(
            ClaudeClient.MODULE,
            `API key validation successful - model ${modelToCheck} budget is available`,
          );
          return { valid: true };
        }
      } catch (chatError: any) {
        const status = chatError.response?.status;
        const errorType = chatError.response?.data?.error?.type || "";
        const errorMsg = chatError.response?.data?.error?.message || "";

        if (status === 429 || errorType === "rate_limit_error") {
          return {
            valid: false,
            error: "Rate limited - too many requests",
          };
        }

        if (status === 402 || errorMsg.toLowerCase().includes("insufficient")) {
          return {
            valid: false,
            error: "No budget remaining - account quota exceeded",
          };
        }

        if (status === 400 || errorType === "invalid_request_error") {
          return {
            valid: false,
            error: errorMsg || "Invalid request while validating API key",
          };
        }

        if (status !== 401 && status !== 403) {
          throw chatError;
        }
      }

      return {
        valid: false,
        error: "API validation failed",
      };
    } catch (error: any) {
      const status = error.response?.status;

      if (status === 401) {
        return {
          valid: false,
          error: "Invalid API key - authentication failed",
        };
      }

      if (status === 403) {
        return {
          valid: false,
          error: "Access denied - check your account status",
        };
      }

      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        return {
          valid: false,
          error: "Network error - cannot reach Claude API",
        };
      }

      if (error.message?.includes("timeout")) {
        return {
          valid: false,
          error: "API request timed out",
        };
      }

      return {
        valid: false,
        error: error.message || "API validation failed",
      };
    }
  }
}

export function createClaudeClient(
  options?: ClaudeClientOptions,
): ClaudeClient {
  return new ClaudeClient(options);
}

let _claudeClient: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!_claudeClient) {
    try {
      _claudeClient = new ClaudeClient();
    } catch {
      throw new Error("Claude client not initialized. Set API key first.");
    }
  }
  return _claudeClient;
}

export const claudeClient = {
  get instance(): ClaudeClient {
    return getClaudeClient();
  },
  sendMessage: async (request: ClaudeRequestOptions): Promise<string> => {
    return getClaudeClient().sendMessage(request);
  },
};
