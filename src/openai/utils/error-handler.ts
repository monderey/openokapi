import type { OpenAIErrorResponse } from "../models/index.js";
import { OpenAIError, OpenAIErrorCode } from "../models/index.js";
import { Logger } from "./logger.js";

export class ErrorHandler {
  private static readonly MODULE = "ErrorHandler";
  private static readonly RETRYABLE_ERRORS = [
    OpenAIErrorCode.RATE_LIMIT,
    OpenAIErrorCode.SERVER,
    OpenAIErrorCode.TIMEOUT,
    OpenAIErrorCode.NETWORK,
  ];

  static parseError(error: unknown): OpenAIError {
    if (error instanceof OpenAIError) {
      return error;
    }

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as any;
      const response = axiosError.response?.data as
        | OpenAIErrorResponse
        | undefined;
      const status = axiosError.response?.status;

      if (response?.error) {
        Logger.debug(
          ErrorHandler.MODULE,
          `OpenAI API Error: ${JSON.stringify(response.error)}`,
        );
      }

      if (status === 401) {
        const message =
          response?.error?.message ||
          "Invalid API key or authentication failed";
        return new OpenAIError(
          OpenAIErrorCode.AUTHENTICATION,
          message,
          axiosError,
          false,
        );
      }

      if (status === 429) {
        return new OpenAIError(
          OpenAIErrorCode.RATE_LIMIT,
          "Rate limit exceeded. Please try again later.",
          axiosError,
          true,
        );
      }

      if (status === 500 || status === 502 || status === 503) {
        return new OpenAIError(
          OpenAIErrorCode.SERVER,
          `OpenAI API server error (${status})`,
          axiosError,
          true,
        );
      }

      if (status === 400) {
        const message = response?.error?.message || "Invalid request";
        return new OpenAIError(
          OpenAIErrorCode.INVALID_REQUEST,
          message,
          axiosError,
          false,
        );
      }

      if (status === 408 || status === 504) {
        return new OpenAIError(
          OpenAIErrorCode.TIMEOUT,
          "Request timeout",
          axiosError,
          true,
        );
      }

      const message =
        response?.error?.message || axiosError.message || "Unknown API error";
      return new OpenAIError(OpenAIErrorCode.SERVER, message, axiosError, true);
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      return new OpenAIError(
        OpenAIErrorCode.TIMEOUT,
        "Request timeout",
        error,
        true,
      );
    }

    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      return new OpenAIError(
        OpenAIErrorCode.NETWORK,
        "Failed to connect to OpenAI API",
        error,
        true,
      );
    }

    if (error instanceof Error) {
      return new OpenAIError(
        OpenAIErrorCode.SERVER,
        error.message,
        error,
        false,
      );
    }

    return new OpenAIError(
      OpenAIErrorCode.SERVER,
      String(error),
      new Error(String(error)),
      false,
    );
  }

  static isRetryable(error: OpenAIError): boolean {
    return this.RETRYABLE_ERRORS.includes(error.code);
  }

  static getRetryDelay(attempt: number): number {
    const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  static logError(error: OpenAIError, context?: string): void {
    const data = {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      context,
    };

    Logger.error(this.MODULE, error.message, error.originalError, data);
  }

  static getHumanReadableMessage(error: OpenAIError): string {
    switch (error.code) {
      case OpenAIErrorCode.AUTHENTICATION:
        return "Your API key is invalid. Please check and try again.";
      case OpenAIErrorCode.RATE_LIMIT:
        return "You've hit the rate limit. Please wait a moment and try again.";
      case OpenAIErrorCode.SERVER:
        return "OpenAI API is currently experiencing issues. Please try again later.";
      case OpenAIErrorCode.TIMEOUT:
        return "Request timed out. Please try again.";
      case OpenAIErrorCode.VALIDATION:
        return "Request validation failed. Please check your input.";
      case OpenAIErrorCode.NETWORK:
        return "Network error. Please check your connection.";
      case OpenAIErrorCode.INVALID_REQUEST:
        return `Invalid request: ${error.message}`;
      default:
        return `An error occurred: ${error.message}`;
    }
  }
}
