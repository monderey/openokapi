import type { ChatCompletionResponse } from "../resources/types.js";
import { Logger } from "../utils/logger.js";

export interface StreamHandler {
  onChunk?: (chunk: ChatCompletionResponse) => void | Promise<void>;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class StreamProcessor {
  private static readonly MODULE = "StreamProcessor";

  static async process(
    stream: AsyncGenerator<ChatCompletionResponse>,
    handlers: StreamHandler,
  ): Promise<string> {
    let fullContent = "";

    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullContent += content;

        if (handlers.onChunk) {
          try {
            await handlers.onChunk(chunk);
          } catch (error) {
            Logger.warn(
              StreamProcessor.MODULE,
              "Error in onChunk handler",
              error as Error,
            );
          }
        }
      }

      if (handlers.onComplete) {
        handlers.onComplete();
      }

      return fullContent;
    } catch (error) {
      if (handlers.onError) {
        handlers.onError(error as Error);
      }
      throw error;
    }
  }

  static collectText(
    stream: AsyncGenerator<ChatCompletionResponse>,
  ): Promise<string> {
    return this.process(stream, {});
  }
}
