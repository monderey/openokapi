import axios, { type AxiosInstance } from "axios";
import {
  ChatCompletionsEndpoint,
  EmbeddingsEndpoint,
  CompletionsEndpoint,
  ModelsEndpoint,
} from "./endpoints/index.js";
import { StreamProcessor, type StreamHandler } from "./streaming/processor.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  CompletionRequest,
  CompletionResponse,
  ModelInfo,
} from "./resources/types.js";
import { Logger } from "./utils/logger.js";
import { RateLimiter } from "./utils/rate-limiter.js";
import { Cache } from "./utils/cache.js";
import { loadOpenAIConfig } from "../config/openai.js";

export interface OpenAIClientOptions {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

export class OpenAIClient {
  private static readonly MODULE = "OpenAIClient";
  private static readonly BASE_URL = "https://api.openai.com/v1";
  private static readonly DEFAULT_TIMEOUT = 30000;
  private static readonly DEFAULT_MAX_RETRIES = 3;

  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private httpClient: AxiosInstance;

  public readonly chat: ChatCompletionsEndpoint;
  public readonly embeddings: EmbeddingsEndpoint;
  public readonly completions: CompletionsEndpoint;
  public readonly models: ModelsEndpoint;

  constructor(options?: OpenAIClientOptions) {
    const config = loadOpenAIConfig();

    this.apiKey = options?.apiKey || config.apiKey || "";
    this.baseURL = options?.baseURL || OpenAIClient.BASE_URL;
    this.timeout = options?.timeout || OpenAIClient.DEFAULT_TIMEOUT;
    this.maxRetries = options?.maxRetries || OpenAIClient.DEFAULT_MAX_RETRIES;

    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key not configured. Set OPENAI_API_KEY environment variable or pass it in options.",
      );
    }

    this.httpClient = this.createHttpClient();

    this.chat = new ChatCompletionsEndpoint(this.httpClient);
    this.embeddings = new EmbeddingsEndpoint(this.httpClient);
    this.completions = new CompletionsEndpoint(this.httpClient);
    this.models = new ModelsEndpoint(this.httpClient);

    Logger.info(OpenAIClient.MODULE, "OpenAI Client initialized", {
      baseURL: this.baseURL,
    });
  }

  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "OpenOKAPI/1.0",
      },
    });
  }

  async createChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    return this.chat.create(request);
  }

  async *streamChatCompletion(
    request: ChatCompletionRequest,
  ): AsyncGenerator<ChatCompletionResponse> {
    yield* this.chat.stream(request);
  }

  async streamChatCompletionWithHandler(
    request: ChatCompletionRequest,
    handlers: StreamHandler,
  ): Promise<string> {
    const stream = this.chat.stream(request);
    return StreamProcessor.process(stream, handlers);
  }

  async createCompletion(
    request: CompletionRequest,
  ): Promise<CompletionResponse> {
    return this.completions.create(request);
  }

  async *streamCompletion(
    request: CompletionRequest,
  ): AsyncGenerator<CompletionResponse> {
    yield* this.completions.stream(request);
  }

  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.embeddings.create(request);
  }

  async createEmbeddingBatch(
    inputs: string[],
    model: string,
    batchSize?: number,
  ): Promise<EmbeddingResponse[]> {
    return this.embeddings.createBatch(inputs, model, batchSize);
  }

  async listModels(): Promise<ModelInfo[]> {
    return this.models.list();
  }

  async listAvailableModels(): Promise<ModelInfo[]> {
    return this.models.listAvailable();
  }

  async getModel(modelId: string): Promise<ModelInfo> {
    return this.models.retrieve(modelId);
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.httpClient.defaults.headers.Authorization = `Bearer ${apiKey}`;
    Logger.info(OpenAIClient.MODULE, "API key updated");
  }

  configureRateLimit(config: RateLimitConfig): void {
    RateLimiter.configure(config);
    Logger.info(OpenAIClient.MODULE, "Rate limiter configured");
  }

  getRateLimitStatus() {
    return RateLimiter.getStatus();
  }

  clearModelsCache(): void {
    this.models.clearCache();
  }

  clearAllCache(): void {
    Cache.clear();
    Logger.info(OpenAIClient.MODULE, "All cache cleared");
  }

  getCacheStats() {
    return Cache.getStats();
  }

  async getStatus() {
    return {
      configured: !!this.apiKey,
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      rateLimitStatus: this.getRateLimitStatus(),
      cacheStats: this.getCacheStats(),
    };
  }

  async validateApiKey(modelToCheck: string = "gpt-3.5-turbo"): Promise<{
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

      if (
        modelsResponse.status !== 200 ||
        !Array.isArray(modelsResponse.data?.data)
      ) {
        return {
          valid: false,
          error: "Cannot list available models",
        };
      }

      try {
        const modelResponse = await this.httpClient.get(
          `/models/${modelToCheck}`,
          {
            timeout: 10000,
          },
        );

        if (modelResponse.status !== 200 || !modelResponse.data?.id) {
          throw new Error("Model not found");
        }
      } catch (modelError: any) {
        if (modelError.response?.status === 404) {
          return {
            valid: false,
            error: `Model "${modelToCheck}" is not available in your account`,
          };
        }
        throw modelError;
      }

      try {
        const testResponse = await this.httpClient.post(
          "/chat/completions",
          {
            model: modelToCheck,
            messages: [{ role: "user", content: "." }],
            max_tokens: 1,
            temperature: 0,
          },
          {
            timeout: 15000,
          },
        );

        if (testResponse.status === 200 && testResponse.data?.choices?.[0]) {
          Logger.info(
            OpenAIClient.MODULE,
            `API key validation successful - model ${modelToCheck} budget is available`,
          );
          return { valid: true };
        }
      } catch (chatError: any) {
        const status = chatError.response?.status;
        const errorMsg = chatError.response?.data?.error?.message || "";

        if (status === 429 && errorMsg.toLowerCase().includes("quota")) {
          return {
            valid: false,
            error: "No budget remaining - account quota exceeded",
          };
        }

        if (status === 400 && errorMsg.toLowerCase().includes("quota")) {
          return {
            valid: false,
            error: "No budget remaining - insufficient account balance",
          };
        }

        if (status === 429) {
          return {
            valid: false,
            error: "Rate limited - too many requests",
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
          error: "Network error - cannot reach OpenAI API",
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

  async sendMessage(request: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }): Promise<string> {
    const chatRequest: ChatCompletionRequest = {
      model: request.model,
      messages: request.messages,
    };
    if (request.max_tokens !== undefined) {
      chatRequest.max_tokens = request.max_tokens;
    }
    if (request.temperature !== undefined) {
      chatRequest.temperature = request.temperature;
    }
    const response = await this.createChatCompletion(chatRequest);
    return response.choices[0]?.message?.content || "";
  }

  async *streamMessage(request: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }): AsyncGenerator<string> {
    const chatRequest: ChatCompletionRequest = {
      model: request.model,
      messages: request.messages,
    };
    if (request.max_tokens !== undefined) {
      chatRequest.max_tokens = request.max_tokens;
    }
    if (request.temperature !== undefined) {
      chatRequest.temperature = request.temperature;
    }
    for await (const chunk of this.streamChatCompletion(chatRequest)) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  }
}

export function createOpenAIClient(
  options?: OpenAIClientOptions,
): OpenAIClient {
  return new OpenAIClient(options);
}

let _openaiClient: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!_openaiClient) {
    try {
      _openaiClient = new OpenAIClient();
    } catch {
      throw new Error("OpenAI client not initialized. Set API key first.");
    }
  }
  return _openaiClient;
}

export const openaiClient = {
  get instance(): OpenAIClient {
    return getOpenAIClient();
  },
  sendMessage: async (request: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }): Promise<string> => {
    return getOpenAIClient().sendMessage(request);
  },
  streamMessage: (request: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }): AsyncGenerator<string> => {
    return getOpenAIClient().streamMessage(request);
  },
  sendStreamingMessage: async (
    request: {
      model: string;
      messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }>;
      max_tokens?: number;
      temperature?: number;
    },
    onChunk?: (chunk: string) => void,
  ): Promise<string> => {
    let fullContent = "";
    for await (const chunk of getOpenAIClient().streamMessage(request)) {
      fullContent += chunk;
      if (onChunk) {
        onChunk(chunk);
      }
    }
    return fullContent;
  },
  listModels: async (): Promise<ModelInfo[]> => {
    return getOpenAIClient().listModels();
  },
  getAvailableModels: async (): Promise<string[]> => {
    const models = await getOpenAIClient().listAvailableModels();
    return models.map((m) => m.id);
  },
  setApiKey: (apiKey: string): void => {
    getOpenAIClient().setApiKey(apiKey);
  },
  getStatus: async () => {
    return getOpenAIClient().getStatus();
  },
  getCacheStats: () => {
    return getOpenAIClient().getCacheStats();
  },
  getRateLimitStatus: () => {
    return getOpenAIClient().getRateLimitStatus();
  },
};

export default OpenAIClient;
