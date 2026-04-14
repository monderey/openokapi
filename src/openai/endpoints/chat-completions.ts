import type { AxiosInstance } from "axios";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamCallback,
  ErrorCallback,
} from "../resources/types.js";
import { Logger } from "../utils/logger.js";
import { RateLimiter } from "../utils/rate-limiter.js";

export class ChatCompletionsEndpoint {
  private static readonly MODULE = "ChatCompletionsEndpoint";
  private static readonly ENDPOINT = "/chat/completions";

  constructor(private client: AxiosInstance) {}

  async create(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    try {
      if (!RateLimiter.canMakeRequest(request.max_tokens || 100)) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      Logger.debug(ChatCompletionsEndpoint.MODULE, "Creating chat completion", {
        model: request.model,
        messagesCount: request.messages.length,
      });

      const response = await this.client.post<ChatCompletionResponse>(
        ChatCompletionsEndpoint.ENDPOINT,
        request,
      );

      RateLimiter.updateFromHeaders(response.headers as any);
      RateLimiter.consumeRequest(response.data.usage?.total_tokens || 100);

      Logger.info(ChatCompletionsEndpoint.MODULE, "Chat completion created", {
        model: request.model,
        tokensUsed: response.data.usage?.total_tokens,
        finishReason: response.data.choices[0]?.finish_reason,
      });

      return response.data;
    } catch (error) {
      Logger.error(
        ChatCompletionsEndpoint.MODULE,
        "Failed to create chat completion",
        error as Error,
      );
      throw error;
    }
  }

  async *stream(
    request: ChatCompletionRequest,
  ): AsyncGenerator<ChatCompletionResponse> {
    try {
      if (!RateLimiter.canMakeRequest(request.max_tokens || 100)) {
        throw new Error("Rate limit exceeded");
      }

      Logger.debug(
        ChatCompletionsEndpoint.MODULE,
        "Streaming chat completion",
        {
          model: request.model,
        },
      );

      const response = await this.client.post(
        ChatCompletionsEndpoint.ENDPOINT,
        { ...request, stream: true },
        { responseType: "stream" },
      );

      RateLimiter.updateFromHeaders(response.headers as any);

      const stream = response.data;
      let tokenCount = 0;

      for await (const chunk of stream) {
        const line = chunk.toString();

        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(data) as ChatCompletionResponse;
            yield parsed;

            if (parsed.usage) {
              tokenCount = parsed.usage.total_tokens;
            }
            RateLimiter.consumeRequest((request.max_tokens || 100) / 10);
          } catch (error) {
            Logger.debug(
              ChatCompletionsEndpoint.MODULE,
              "Failed to parse stream chunk",
            );
          }
        }
      }

      Logger.info(ChatCompletionsEndpoint.MODULE, "Stream completed", {
        model: request.model,
        tokensUsed: tokenCount,
      });
    } catch (error) {
      Logger.error(
        ChatCompletionsEndpoint.MODULE,
        "Stream failed",
        error as Error,
      );
      throw error;
    }
  }
}
