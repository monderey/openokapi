import type {
  ValidationResult,
  ValidationSchema,
  OpenAIRequestOptions,
} from "../models/index.js";
import { Logger } from "./logger.js";

export class Validator {
  private static readonly MODULE = "Validator";

  static validateRequest(request: OpenAIRequestOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request.model || request.model.trim().length === 0) {
      errors.push("Model is required");
    } else if (!/^[a-zA-Z0-9\-._]+$/.test(request.model)) {
      errors.push("Model name contains invalid characters");
    }

    if (!request.messages || !Array.isArray(request.messages)) {
      errors.push("Messages must be an array");
    } else if (request.messages.length === 0) {
      errors.push("At least one message is required");
    } else {
      request.messages.forEach((msg, index) => {
        if (!msg.role || !["system", "user", "assistant"].includes(msg.role)) {
          errors.push(`Message ${index}: Invalid role '${msg.role}'`);
        }
        if (!msg.content || typeof msg.content !== "string") {
          errors.push(`Message ${index}: Content must be a non-empty string`);
        }
        if (msg.content && msg.content.length > 32000) {
          warnings.push(
            `Message ${index}: Content is very long (${msg.content.length} chars)`,
          );
        }
      });
    }

    if (request.temperature !== undefined) {
      if (typeof request.temperature !== "number") {
        errors.push("Temperature must be a number");
      } else if (request.temperature < 0 || request.temperature > 2) {
        errors.push("Temperature must be between 0 and 2");
      }
    }

    if (request.max_tokens !== undefined) {
      if (!Number.isInteger(request.max_tokens) || request.max_tokens < 1) {
        errors.push("max_tokens must be a positive integer");
      } else if (request.max_tokens > 4096) {
        warnings.push(
          `max_tokens is very high (${request.max_tokens}), may incur high costs`,
        );
      }
    }

    if (request.top_p !== undefined) {
      if (typeof request.top_p !== "number") {
        errors.push("top_p must be a number");
      } else if (request.top_p < 0 || request.top_p > 1) {
        errors.push("top_p must be between 0 and 1");
      }
    }

    if (request.frequency_penalty !== undefined) {
      if (typeof request.frequency_penalty !== "number") {
        errors.push("frequency_penalty must be a number");
      } else if (
        request.frequency_penalty < -2 ||
        request.frequency_penalty > 2
      ) {
        errors.push("frequency_penalty must be between -2 and 2");
      }
    }

    if (request.presence_penalty !== undefined) {
      if (typeof request.presence_penalty !== "number") {
        errors.push("presence_penalty must be a number");
      } else if (
        request.presence_penalty < -2 ||
        request.presence_penalty > 2
      ) {
        errors.push("presence_penalty must be between -2 and 2");
      }
    }

    const valid = errors.length === 0;

    if (!valid) {
      Logger.warn(this.MODULE, "Request validation failed", {
        model: request.model,
        errors,
      });
    }

    if (warnings.length > 0) {
      Logger.debug(this.MODULE, "Request validation warnings", {
        model: request.model,
        warnings,
      });
    }

    return { valid, errors, warnings };
  }

  static validateApiKey(apiKey: string): ValidationResult {
    const errors: string[] = [];

    if (!apiKey || typeof apiKey !== "string") {
      errors.push("API key must be a string");
    } else if (!apiKey.startsWith("sk-")) {
      errors.push("API key must start with 'sk-'");
    } else if (apiKey.length < 20) {
      errors.push("API key seems too short");
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  static validateModel(model: string): ValidationResult {
    const errors: string[] = [];

    if (!model || typeof model !== "string") {
      errors.push("Model must be a string");
    } else if (model.trim().length === 0) {
      errors.push("Model cannot be empty");
    } else if (!/^[a-zA-Z0-9\-._]+$/.test(model)) {
      errors.push("Model name contains invalid characters");
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  static sanitizeContent(content: string): string {
    if (typeof content !== "string") {
      return "";
    }

    let sanitized = content.replace(/\0/g, "");

    if (sanitized.length > 32000) {
      sanitized = sanitized.substring(0, 32000);
    }

    return sanitized;
  }
}
