import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type {
  ClaudeMessageResponse,
  ClaudeModelsListResponse,
  ClaudeRequestOptions,
  ClaudeModelInfo,
} from "../models/index.js";
import { ErrorHandler } from "../utils/error-handler.js";
import { Logger } from "../utils/logger.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import { Validator } from "../utils/validator.js";

export interface APIRequestConfig extends AxiosRequestConfig {
  retries?: number;
  timeout?: number;
}

export class APILayer {
  private static readonly MODULE = "ClaudeAPILayer";
  private static readonly BASE_URL = "https://api.anthropic.com/v1";
  private static readonly DEFAULT_TIMEOUT = 30000;
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly API_VERSION = "2023-06-01";

  private apiKey: string;
  private client: AxiosInstance;
  private timeout: number;
  private maxRetries: number;

  constructor(
    apiKey: string,
    config?: { timeout?: number; maxRetries?: number },
  ) {
    this.apiKey = apiKey;
    this.timeout = config?.timeout || APILayer.DEFAULT_TIMEOUT;
    this.maxRetries = config?.maxRetries || APILayer.DEFAULT_MAX_RETRIES;

    this.client = axios.create({
      baseURL: APILayer.BASE_URL,
      headers: this.getHeaders(),
      timeout: this.timeout,
    });

    Logger.info(APILayer.MODULE, "API Layer initialized");
  }

  private getHeaders() {
    return {
      "x-api-key": this.apiKey,
      "anthropic-version": APILayer.API_VERSION,
      "Content-Type": "application/json",
      "User-Agent": "OpenOKAPI/1.0",
    };
  }

  async listModels(): Promise<ClaudeModelInfo[]> {
    return this.requestWithRetry(async () => {
      Logger.debug(APILayer.MODULE, "Fetching models list");
      const response =
        await this.client.get<ClaudeModelsListResponse>("/models");
      return response.data?.data || [];
    }, "listModels");
  }

  async sendMessage(
    request: ClaudeRequestOptions,
  ): Promise<ClaudeMessageResponse> {
    const validation = Validator.validateRequest(request);
    if (!validation.valid) {
      throw new Error(`Invalid request: ${validation.errors.join(", ")}`);
    }

    if (!RateLimiter.canMakeRequest(request.max_tokens || 100)) {
      Logger.warn(APILayer.MODULE, "Rate limit check failed");
      throw new Error("Rate limit exceeded");
    }

    return this.requestWithRetry(async () => {
      Logger.debug(
        APILayer.MODULE,
        `Sending message request for model: ${request.model}`,
      );
      const response = await this.client.post<ClaudeMessageResponse>(
        "/messages",
        request,
      );

      RateLimiter.updateFromHeaders(response.headers as any);
      RateLimiter.consumeRequest(request.max_tokens || 100);
      return response.data;
    }, "sendMessage");
  }

  private async requestWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string,
    attempt: number = 0,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const claudeError = ErrorHandler.parseError(error);
      ErrorHandler.logError(claudeError, operationName);

      if (
        !ErrorHandler.isRetryable(claudeError) ||
        attempt >= this.maxRetries
      ) {
        throw claudeError;
      }

      const delay = ErrorHandler.getRetryDelay(attempt);
      Logger.warn(
        APILayer.MODULE,
        `Retrying ${operationName} after ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.requestWithRetry(fn, operationName, attempt + 1);
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client.defaults.headers = { ...this.getHeaders() } as any;
    Logger.info(APILayer.MODULE, "API key updated");
  }

  getStatus() {
    return {
      configured: !!this.apiKey,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      rateLimitStatus: RateLimiter.getStatus(),
    };
  }
}
