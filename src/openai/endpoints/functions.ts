import type { AxiosInstance } from "axios";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "../resources/types.js";
import { Logger } from "../utils/logger.js";
import { RateLimiter } from "../utils/rate-limiter.js";

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: {
    type: "object";
    properties?: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

export interface FunctionCallResult {
  name: string;
  arguments: Record<string, unknown>;
}

export class FunctionsEndpoint {
  private static readonly MODULE = "FunctionsEndpoint";
  private static readonly ENDPOINT = "/chat/completions";

  constructor(private client: AxiosInstance) {}

  async callWithFunctions(
    request: ChatCompletionRequest,
    functions: FunctionDefinition[],
    functionCall?: "auto" | "none" | { name: string },
  ): Promise<{
    response: ChatCompletionResponse;
    functionCall: FunctionCallResult | undefined;
  }> {
    try {
      if (!RateLimiter.canMakeRequest(request.max_tokens || 100)) {
        throw new Error("Rate limit exceeded");
      }

      Logger.debug(FunctionsEndpoint.MODULE, "Calling with functions", {
        model: request.model,
        functionsCount: functions.length,
      });

      const response = await this.client.post<ChatCompletionResponse>(
        FunctionsEndpoint.ENDPOINT,
        {
          ...request,
          functions,
          function_call: functionCall || "auto",
        },
      );

      RateLimiter.updateFromHeaders(response.headers as Record<string, string>);
      RateLimiter.consumeRequest(response.data.usage?.total_tokens || 100);

      const choice = response.data.choices[0];
      let functionCallResult: FunctionCallResult | undefined;

      if (choice?.message?.function_call) {
        try {
          functionCallResult = {
            name: choice.message.function_call.name,
            arguments: JSON.parse(
              choice.message.function_call.arguments,
            ) as Record<string, unknown>,
          };
        } catch {
          Logger.warn(
            FunctionsEndpoint.MODULE,
            "Failed to parse function call arguments",
          );
        }
      }

      Logger.info(FunctionsEndpoint.MODULE, "Function call completed", {
        model: request.model,
        functionCalled: functionCallResult?.name,
        tokensUsed: response.data.usage?.total_tokens,
      });

      return {
        response: response.data,
        functionCall: functionCallResult ?? undefined,
      };
    } catch (error) {
      Logger.error(
        FunctionsEndpoint.MODULE,
        "Function call failed",
        error as Error,
      );
      throw error;
    }
  }

  async executeFunction<T>(
    request: ChatCompletionRequest,
    functions: FunctionDefinition[],
    executors: Record<string, (args: Record<string, unknown>) => Promise<T>>,
  ): Promise<{ result: T; functionName: string } | { content: string }> {
    const { response, functionCall } = await this.callWithFunctions(
      request,
      functions,
    );

    if (functionCall && executors[functionCall.name]) {
      const executor = executors[functionCall.name];
      if (executor) {
        const result = await executor(functionCall.arguments);
        return { result, functionName: functionCall.name };
      }
    }

    return { content: response.choices[0]?.message?.content || "" };
  }
}
