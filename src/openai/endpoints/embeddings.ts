import type { AxiosInstance } from "axios";
import type {
  EmbeddingRequest,
  EmbeddingResponse,
} from "../resources/types.js";
import { Logger } from "../utils/logger.js";
import { RateLimiter } from "../utils/rate-limiter.js";

export class EmbeddingsEndpoint {
  private static readonly MODULE = "EmbeddingsEndpoint";
  private static readonly ENDPOINT = "/embeddings";

  constructor(private client: AxiosInstance) {}

  async create(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      if (!RateLimiter.canMakeRequest(500)) {
        throw new Error("Rate limit exceeded");
      }

      Logger.debug(EmbeddingsEndpoint.MODULE, "Creating embeddings", {
        model: request.model,
        inputType: Array.isArray(request.input) ? "array" : "string",
      });

      const response = await this.client.post<EmbeddingResponse>(
        EmbeddingsEndpoint.ENDPOINT,
        request,
      );

      RateLimiter.updateFromHeaders(response.headers as any);
      RateLimiter.consumeRequest(response.data.usage.total_tokens);

      Logger.info(EmbeddingsEndpoint.MODULE, "Embeddings created", {
        model: request.model,
        embeddingsCount: response.data.data.length,
        tokensUsed: response.data.usage.total_tokens,
      });

      return response.data;
    } catch (error) {
      Logger.error(
        EmbeddingsEndpoint.MODULE,
        "Failed to create embeddings",
        error as Error,
      );
      throw error;
    }
  }

  async createBatch(
    inputs: string[],
    model: string,
    batchSize: number = 20,
  ): Promise<EmbeddingResponse[]> {
    const results: EmbeddingResponse[] = [];

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const response = await this.create({
        input: batch,
        model,
      });
      results.push(response);

      if (i + batchSize < inputs.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}
