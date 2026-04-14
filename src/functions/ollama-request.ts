import { OllamaClient } from "../ollama/client.js";
import type {
  OllamaChatRequest,
  OllamaGenerateRequest,
} from "../ollama/models/index.js";

export async function sendOllamaRequest(
  model: string,
  prompt: string,
  type: "chat" | "generate" = "generate",
): Promise<string> {
  const client = new OllamaClient();

  try {
    if (type === "chat") {
      const chatRequest: OllamaChatRequest = {
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      };

      const response = await client.chat(chatRequest);
      return response.message.content;
    } else {
      const generateRequest: OllamaGenerateRequest = {
        model,
        prompt,
      };

      const response = await client.generate(generateRequest);
      return response.response;
    }
  } catch (error) {
    throw new Error(
      `Failed to send Ollama request: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function formatErrorForCLI(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
