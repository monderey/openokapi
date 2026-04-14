import axios, { type AxiosInstance } from "axios";
import type {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaModelInfo,
  OllamaPullResponse,
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  RateLimitConfig,
} from "./models/index.js";
import { RateLimiter } from "./utils/rate-limiter.js";
import { loadOllamaConfig } from "../config/ollama.js";

export interface OllamaClientOptions {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export class OllamaClient {
  private static readonly MODULE = "OllamaClient";
  private static readonly DEFAULT_BASE_URL = "http://localhost:11434";
  private static readonly DEFAULT_TIMEOUT = 300000;
  private static readonly DEFAULT_MAX_RETRIES = 3;

  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private httpClient: AxiosInstance;

  constructor(options?: OllamaClientOptions) {
    const config = loadOllamaConfig();

    this.baseURL =
      options?.baseURL || config.baseURL || OllamaClient.DEFAULT_BASE_URL;
    this.timeout = options?.timeout || OllamaClient.DEFAULT_TIMEOUT;
    this.maxRetries = options?.maxRetries || OllamaClient.DEFAULT_MAX_RETRIES;

    this.httpClient = this.createHttpClient();
  }

  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  static configure(config: RateLimitConfig): void {
    RateLimiter.configure(config);
  }

  async listModels(): Promise<OllamaModelInfo[]> {
    try {
      await RateLimiter.waitForSlot();
      RateLimiter.consumeRequest();

      const response = await this.httpClient.get<{ models: OllamaModelInfo[] }>(
        "/api/tags",
      );
      return response.data.models;
    } catch (error) {
      throw error;
    }
  }

  async getModelInfo(modelName: string): Promise<OllamaModelInfo | null> {
    try {
      const models = await this.listModels();
      const model = models.find(
        (m) =>
          m.name.toLowerCase() === modelName.toLowerCase() ||
          m.model.toLowerCase() === modelName.toLowerCase(),
      );
      return model || null;
    } catch (error) {
      throw error;
    }
  }

  async modelExists(modelName: string): Promise<boolean> {
    try {
      const model = await this.getModelInfo(modelName);
      return model !== null;
    } catch {
      return false;
    }
  }

  async searchModel(searchTerm: string): Promise<OllamaModelInfo[]> {
    try {
      const models = await this.listModels();
      const searchLower = searchTerm.toLowerCase();
      return models.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.model.toLowerCase().includes(searchLower) ||
          (m.details?.family?.toLowerCase() || "").includes(searchLower),
      );
    } catch (error) {
      throw error;
    }
  }

  async pullModel(
    modelName: string,
    onProgress?: (response: OllamaPullResponse) => void,
  ): Promise<void> {
    try {
      await RateLimiter.waitForSlot();
      RateLimiter.consumeRequest();

      const response = await this.httpClient.post(
        "/api/pull",
        { name: modelName },
        {
          responseType: "stream",
        },
      );

      return new Promise((resolve, reject) => {
        let buffer = "";

        (response.data as any).on("data", (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line) as OllamaPullResponse;
                if (onProgress) {
                  onProgress(data);
                }
              } catch (e) {
                // ignore
              }
            }
          }
        });

        (response.data as any).on("end", () => {
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer) as OllamaPullResponse;
              if (onProgress) {
                onProgress(data);
              }
            } catch (e) {
              // ignore
            }
          }
          resolve();
        });

        (response.data as any).on("error", (error: Error) => {
          reject(error);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    try {
      await RateLimiter.waitForSlot();
      RateLimiter.consumeRequest();

      const response = await this.httpClient.post<OllamaChatResponse>(
        "/api/chat",
        { ...request, stream: false },
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async generate(
    request: OllamaGenerateRequest,
  ): Promise<OllamaGenerateResponse> {
    try {
      await RateLimiter.waitForSlot();
      RateLimiter.consumeRequest();

      const response = await this.httpClient.post<OllamaGenerateResponse>(
        "/api/generate",
        { ...request, stream: false },
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async embeddings(
    request: OllamaEmbeddingRequest,
  ): Promise<OllamaEmbeddingResponse> {
    try {
      await RateLimiter.waitForSlot();
      RateLimiter.consumeRequest();

      const response = await this.httpClient.post<OllamaEmbeddingResponse>(
        "/api/embeddings",
        request,
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteModel(modelName: string): Promise<void> {
    try {
      await RateLimiter.waitForSlot();
      RateLimiter.consumeRequest();

      await this.httpClient.delete("/api/delete", {
        data: { name: modelName },
      });
    } catch (error) {
      throw error;
    }
  }

  async copyModel(sourceModel: string, targetModel: string): Promise<void> {
    try {
      await RateLimiter.waitForSlot();
      RateLimiter.consumeRequest();

      await this.httpClient.post("/api/copy", {
        source: sourceModel,
        destination: targetModel,
      });
    } catch (error) {
      throw error;
    }
  }

  getRateLimitStatus() {
    return RateLimiter.getStatus();
  }
}
