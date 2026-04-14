import type { ClaudeErrorResponse } from "../models/index.js";
import { ClaudeError, ClaudeErrorCode } from "../models/index.js";
import { Logger } from "./logger.js";

export class ErrorHandler {
  private static readonly MODULE = "ClaudeErrorHandler";
  private static readonly RETRYABLE_ERRORS = [
    ClaudeErrorCode.RATE_LIMIT,
    ClaudeErrorCode.SERVER,
    ClaudeErrorCode.TIMEOUT,
    ClaudeErrorCode.NETWORK,
  ];

  static parseError(error: unknown): ClaudeError {
    if (error instanceof ClaudeError) {
      return error;
    }

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as any;
      const response = axiosError.response?.data as
        | ClaudeErrorResponse
        | undefined;
      const status = axiosError.response?.status;

      if (response?.error) {
        Logger.debug(
          ErrorHandler.MODULE,
          `Claude API Error: ${JSON.stringify(response.error)}`,
        );
      }

      const errorType = response?.error?.type || response?.type || "";
      const message =
        response?.error?.message || axiosError.message || "Unknown API error";

      if (status === 401 || errorType === "authentication_error") {
        return new ClaudeError(
          ClaudeErrorCode.AUTHENTICATION,
          "Invalid API key or authentication failed",
          axiosError,
          false,
        );
      }

      if (status === 403 || errorType === "permission_error") {
        return new ClaudeError(
          ClaudeErrorCode.PERMISSION,
          "Access denied - check your account permissions",
          axiosError,
          false,
        );
      }

      if (status === 429 || errorType === "rate_limit_error") {
        return new ClaudeError(
          ClaudeErrorCode.RATE_LIMIT,
          "Rate limit exceeded. Please try again later.",
          axiosError,
          true,
        );
      }

      if (
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 529
      ) {
        return new ClaudeError(
          ClaudeErrorCode.SERVER,
          `Claude API server error (${status})`,
          axiosError,
          true,
        );
      }

      if (status === 400 || errorType === "invalid_request_error") {
        return new ClaudeError(
          ClaudeErrorCode.INVALID_REQUEST,
          message || "Invalid request",
          axiosError,
          false,
        );
      }

      if (status === 408 || status === 504 || errorType === "timeout_error") {
        return new ClaudeError(
          ClaudeErrorCode.TIMEOUT,
          "Request timeout",
          axiosError,
          true,
        );
      }

      return new ClaudeError(ClaudeErrorCode.SERVER, message, axiosError, true);
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      return new ClaudeError(
        ClaudeErrorCode.TIMEOUT,
        "Request timeout",
        error,
        true,
      );
    }

    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      return new ClaudeError(
        ClaudeErrorCode.NETWORK,
        "Failed to connect to Claude API",
        error,
        true,
      );
    }

    if (error instanceof Error) {
      return new ClaudeError(
        ClaudeErrorCode.SERVER,
        error.message,
        error,
        false,
      );
    }

    return new ClaudeError(
      ClaudeErrorCode.SERVER,
      String(error),
      new Error(String(error)),
      false,
    );
  }

  static isRetryable(error: ClaudeError): boolean {
    return this.RETRYABLE_ERRORS.includes(error.code);
  }

  static getRetryDelay(attempt: number): number {
    const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  static logError(error: ClaudeError, context?: string): void {
    const data = {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      context,
    };

    Logger.error(this.MODULE, error.message, error.originalError, data);
  }

  static getHumanReadableMessage(error: ClaudeError): string {
    switch (error.code) {
      case ClaudeErrorCode.AUTHENTICATION:
        return "Your API key is invalid. Please check and try again.";
      case ClaudeErrorCode.PERMISSION:
        return "Access denied. Please check your account permissions.";
      case ClaudeErrorCode.RATE_LIMIT:
        return "You've hit the rate limit. Please wait a moment and try again.";
      case ClaudeErrorCode.SERVER:
        return "Claude API is currently experiencing issues. Please try again later.";
      case ClaudeErrorCode.TIMEOUT:
        return "Request timed out. Please try again.";
      case ClaudeErrorCode.VALIDATION:
        return "Request validation failed. Please check your input.";
      case ClaudeErrorCode.NETWORK:
        return "Network error. Please check your connection.";
      case ClaudeErrorCode.INVALID_REQUEST:
        return `Invalid request: ${error.message}`;
      default:
        return `An error occurred: ${error.message}`;
    }
  }
}
