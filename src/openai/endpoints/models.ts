import type { AxiosInstance } from "axios";
import type { ModelInfo, ModelsListResponse } from "../resources/types.js";
import { Logger } from "../utils/logger.js";
import { Cache } from "../utils/cache.js";

export class ModelsEndpoint {
  private static readonly MODULE = "ModelsEndpoint";
  private static readonly ENDPOINT = "/models";
  private static readonly CACHE_KEY = "openai_models_list";
  private static readonly CACHE_TTL = 3600;

  constructor(private client: AxiosInstance) {}

  async list(): Promise<ModelInfo[]> {
    const cached = Cache.get<ModelInfo[]>(ModelsEndpoint.CACHE_KEY);
    if (cached) {
      Logger.info(ModelsEndpoint.MODULE, "Returning cached models");
      return cached;
    }

    try {
      Logger.debug(ModelsEndpoint.MODULE, "Fetching models list");

      const response = await this.client.get<ModelsListResponse>(
        ModelsEndpoint.ENDPOINT,
      );

      const models = response.data.data || [];

      Cache.set(ModelsEndpoint.CACHE_KEY, models, ModelsEndpoint.CACHE_TTL);

      Logger.info(ModelsEndpoint.MODULE, "Models fetched", {
        count: models.length,
      });

      return models;
    } catch (error) {
      Logger.error(
        ModelsEndpoint.MODULE,
        "Failed to fetch models",
        error as Error,
      );
      throw error;
    }
  }

  async retrieve(modelId: string): Promise<ModelInfo> {
    try {
      Logger.debug(ModelsEndpoint.MODULE, "Retrieving model", { modelId });

      const response = await this.client.get<ModelInfo>(
        `${ModelsEndpoint.ENDPOINT}/${modelId}`,
      );

      Logger.info(ModelsEndpoint.MODULE, "Model retrieved", { modelId });

      return response.data;
    } catch (error) {
      Logger.error(
        ModelsEndpoint.MODULE,
        "Failed to retrieve model",
        error as Error,
      );
      throw error;
    }
  }

  async listAvailable(): Promise<ModelInfo[]> {
    const models = await this.list();
    return models.filter(
      (m) =>
        m.id.includes("gpt") ||
        m.id.includes("text-davinci") ||
        m.id.includes("text-curie") ||
        m.id.includes("text-babbage") ||
        m.id.includes("text-ada"),
    );
  }

  clearCache(): void {
    Cache.delete(ModelsEndpoint.CACHE_KEY);
    Logger.info(ModelsEndpoint.MODULE, "Models cache cleared");
  }
}
