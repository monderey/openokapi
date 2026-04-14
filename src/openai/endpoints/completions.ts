import type { AxiosInstance } from "axios";
import type {
  CompletionRequest,
  CompletionResponse,
} from "../resources/types.js";
import { Logger } from "../utils/logger.js";
import { RateLimiter } from "../utils/rate-limiter.js";

export class CompletionsEndpoint {
  private static readonly MODULE = "CompletionsEndpoint";
  private static readonly ENDPOINT = "/completions";

  constructor(private client: AxiosInstance) {}

  async create(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      if (!RateLimiter.canMakeRequest(request.max_tokens || 100)) {
        throw new Error("Rate limit exceeded");
      }

      Logger.debug(CompletionsEndpoint.MODULE, "Creating completion", {
        model: request.model,
      });

      const response = await this.client.post<CompletionResponse>(
        CompletionsEndpoint.ENDPOINT,
        request,
      );

      RateLimiter.updateFromHeaders(response.headers as any);
      RateLimiter.consumeRequest(response.data.usage.total_tokens);

      Logger.info(CompletionsEndpoint.MODULE, "Completion created", {
        model: request.model,
        tokensUsed: response.data.usage.total_tokens,
      });

      return response.data;
    } catch (error) {
      Logger.error(
        CompletionsEndpoint.MODULE,
        "Failed to create completion",
        error as Error,
      );
      throw error;
    }
  }

  async *stream(
    request: CompletionRequest,
  ): AsyncGenerator<CompletionResponse> {
    try {
      if (!RateLimiter.canMakeRequest(request.max_tokens || 100)) {
        throw new Error("Rate limit exceeded");
      }

      Logger.debug(CompletionsEndpoint.MODULE, "Streaming completion", {
        model: request.model,
      });

      const response = await this.client.post(
        CompletionsEndpoint.ENDPOINT,
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
            const parsed = JSON.parse(data) as CompletionResponse;
            yield parsed;
            RateLimiter.consumeRequest((request.max_tokens || 100) / 10);
          } catch (error) {
            Logger.debug(
              CompletionsEndpoint.MODULE,
              "Failed to parse stream chunk",
            );
          }
        }
      }

      Logger.info(CompletionsEndpoint.MODULE, "Stream completed", {
        model: request.model,
      });
    } catch (error) {
      Logger.error(CompletionsEndpoint.MODULE, "Stream failed", error as Error);
      throw error;
    }
  }
}
