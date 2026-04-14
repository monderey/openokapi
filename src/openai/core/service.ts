import type {
  OpenAIRequestOptions,
  OpenAICompletionResponse,
  CachedOpenAIModel,
  EnhancedOpenAIResponse,
  RequestMetadata,
} from "../models/index.js";
import { APILayer } from "../api/layer.js";
import { Cache } from "../utils/cache.js";
import { Logger } from "../utils/logger.js";
import { Validator } from "../utils/validator.js";
import { ErrorHandler } from "../utils/error-handler.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import type { RateLimitConfig } from "../utils/rate-limiter.js";
import { saveOpenAIModels } from "../../config/openai.js";

export class OpenAIService {
  private static readonly MODULE = "OpenAIService";
  private static readonly CACHE_TTL = 3600;
  private static readonly MODELS_CACHE_KEY = "openai_models";
  private static readonly MAX_CACHE_SIZE = 1000;

  private api: APILayer;
  private initialized = false;

  constructor(apiKey: string) {
    this.api = new APILayer(apiKey, {
      timeout: 30000,
      maxRetries: 3,
    });
    Cache.setMaxSize(OpenAIService.MAX_CACHE_SIZE);
    this.initialized = true;
    Logger.info(OpenAIService.MODULE, "Service initialized");
  }

  async listModels(): Promise<CachedOpenAIModel[]> {
    const cacheKey = OpenAIService.MODELS_CACHE_KEY;
    const cached = Cache.get<CachedOpenAIModel[]>(cacheKey);

    if (cached) {
      Logger.info(OpenAIService.MODULE, "Returning cached models");
      return cached;
    }

    try {
      Logger.info(OpenAIService.MODULE, "Fetching models from API");
      const models = await this.api.listModels();

      const formatted = models
        .filter(
          (m) =>
            m.id.includes("gpt") ||
            m.id.includes("text-davinci") ||
            m.id.includes("text-curie") ||
            m.id.includes("text-babbage") ||
            m.id.includes("text-ada"),
        )
        .map((m) => ({
          id: m.id,
          name: m.id,
          owned_by: m.owned_by,
          created: (m as any).created || Math.floor(Date.now() / 1000),
          context_window: 4096,
          max_output_tokens: 2048,
        }));

      Cache.set(cacheKey, formatted, OpenAIService.CACHE_TTL);

      saveOpenAIModels(formatted);

      Logger.info(
        OpenAIService.MODULE,
        `Fetched and cached ${formatted.length} models`,
      );
      return formatted;
    } catch (error) {
      const openaiError = ErrorHandler.parseError(error);
      ErrorHandler.logError(openaiError, "listModels");
      throw openaiError;
    }
  }

  async sendCompletion(
    request: OpenAIRequestOptions,
  ): Promise<EnhancedOpenAIResponse<OpenAICompletionResponse>> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const validation = Validator.validateRequest(request);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      Logger.debug(
        OpenAIService.MODULE,
        `Processing completion request: ${requestId}`,
        {
          model: request.model,
          messages: request.messages.length,
        },
      );

      const data = await this.api.sendCompletion(request);

      const duration = Date.now() - startTime;
      const tokensUsed = data.usage?.total_tokens || 0;

      const metadata: RequestMetadata = {
        id: requestId,
        timestamp: Date.now(),
        duration,
        tokensUsed,
        cached: false,
      };

      Logger.info(OpenAIService.MODULE, "Completion successful", {
        id: requestId,
        duration,
        tokens: tokensUsed,
        model: request.model,
      });

      return {
        data,
        metadata,
        success: true,
      };
    } catch (error) {
      const openaiError = ErrorHandler.parseError(error);
      const humanMessage = ErrorHandler.getHumanReadableMessage(openaiError);

      Logger.error(OpenAIService.MODULE, humanMessage, openaiError, {
        id: requestId,
        model: request.model,
      });

      throw openaiError;
    }
  }

  async *streamCompletion(request: OpenAIRequestOptions): AsyncGenerator<{
    chunk: string;
    timestamp: number;
    done: boolean;
  }> {
    const startTime = Date.now();
    const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const validation = Validator.validateRequest(request);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      Logger.debug(OpenAIService.MODULE, `Streaming completion: ${requestId}`, {
        model: request.model,
      });

      let tokenCount = 0;

      for await (const chunk of this.api.streamCompletion(request)) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content) {
          tokenCount += content.split(/\s+/).length;
          yield {
            chunk: content,
            timestamp: Date.now(),
            done: false,
          };
        }
      }

      const duration = Date.now() - startTime;

      Logger.info(OpenAIService.MODULE, "Stream completed", {
        id: requestId,
        duration,
        approximateTokens: tokenCount,
        model: request.model,
      });

      yield {
        chunk: "",
        timestamp: Date.now(),
        done: true,
      };
    } catch (error) {
      const openaiError = ErrorHandler.parseError(error);
      ErrorHandler.logError(openaiError, `stream:${requestId}`);
      throw openaiError;
    }
  }

  getCacheStats() {
    return Cache.getStats();
  }

  getRateLimitStatus() {
    return RateLimiter.getStatus();
  }

  getStatus() {
    return {
      initialized: this.initialized,
      cache: this.getCacheStats(),
      rateLimit: this.getRateLimitStatus(),
      api: this.api.getStatus(),
    };
  }

  setApiKey(apiKey: string): void {
    Validator.validateApiKey(apiKey);
    this.api.setApiKey(apiKey);
    Logger.info(OpenAIService.MODULE, "API key updated");
  }

  clearCache(): void {
    Cache.clear();
    Logger.info(OpenAIService.MODULE, "Cache cleared");
  }

  configureRateLimit(config: RateLimitConfig): void {
    RateLimiter.configure(config);
    Logger.info(OpenAIService.MODULE, "Rate limiter configured");
  }
}
