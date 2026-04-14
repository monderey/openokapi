import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type {
  OpenAICompletionResponse,
  OpenAIStreamChunk,
  OpenAIRequestOptions,
  OpenAIModel,
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
  private static readonly MODULE = "APILayer";
  private static readonly BASE_URL = "https://api.openai.com/v1";
  private static readonly DEFAULT_TIMEOUT = 30000;
  private static readonly DEFAULT_MAX_RETRIES = 3;

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
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "OpenOKAPI/1.0",
    };
  }

  async listModels(): Promise<OpenAIModel[]> {
    return this.requestWithRetry(async () => {
      Logger.debug(APILayer.MODULE, "Fetching models list");
      const response = await this.client.get("/models");
      return response.data.data || [];
    }, "listModels");
  }

  async sendCompletion(
    request: OpenAIRequestOptions,
  ): Promise<OpenAICompletionResponse> {
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
        `Sending completion request for model: ${request.model}`,
      );
      const response = await this.client.post<OpenAICompletionResponse>(
        "/chat/completions",
        request,
      );

      RateLimiter.updateFromHeaders(response.headers as any);
      RateLimiter.consumeRequest(request.max_tokens || 100);
      return response.data;
    }, "sendCompletion");
  }

  async *streamCompletion(
    request: OpenAIRequestOptions,
  ): AsyncGenerator<OpenAIStreamChunk, void, unknown> {
    const validation = Validator.validateRequest(request);
    if (!validation.valid) {
      throw new Error(`Invalid request: ${validation.errors.join(", ")}`);
    }

    if (!RateLimiter.canMakeRequest(request.max_tokens || 100)) {
      throw new Error("Rate limit exceeded");
    }

    Logger.debug(
      APILayer.MODULE,
      `Streaming completion for model: ${request.model}`,
    );

    const response = await this.client.post(
      "/chat/completions",
      { ...request, stream: true },
      { responseType: "stream" },
    );

    RateLimiter.updateFromHeaders(response.headers as any);

    const stream = response.data;

    for await (const chunk of stream) {
      const line = chunk.toString();

      if (line.startsWith("data: ")) {
        const data = line.slice(6);

        if (data === "[DONE]") {
          break;
        }

        try {
          const parsed = JSON.parse(data) as OpenAIStreamChunk;
          yield parsed;
          RateLimiter.consumeRequest((request.max_tokens || 100) / 10);
        } catch (error) {
          Logger.debug(APILayer.MODULE, "Failed to parse stream chunk");
        }
      }
    }
  }

  private async requestWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string,
    attempt: number = 0,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const openaiError = ErrorHandler.parseError(error);
      ErrorHandler.logError(openaiError, operationName);

      if (
        !ErrorHandler.isRetryable(openaiError) ||
        attempt >= this.maxRetries
      ) {
        throw openaiError;
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
