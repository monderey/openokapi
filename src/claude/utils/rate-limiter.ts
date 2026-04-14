import { Logger } from "./logger.js";
import type { RateLimitConfig, RateLimitHeaders } from "../models/index.js";

export class RateLimiter {
  private static readonly MODULE = "ClaudeRateLimiter";
  private static requestTokens = 5;
  private static tokenTokens = 40000;
  private static lastRefillTime = Date.now();
  private static lastHeaderUpdateTime = Date.now();
  private static requestsPerMinute = 5;
  private static tokensPerMinute = 40000;
  private static limitRequestsFromHeader = 5;
  private static limitTokensFromHeader = 40000;

  static configure(config: RateLimitConfig): void {
    this.requestsPerMinute = config.requestsPerMinute;
    this.tokensPerMinute = config.tokensPerMinute;
    this.requestTokens = config.requestsPerMinute;
    this.tokenTokens = config.tokensPerMinute;
    this.limitRequestsFromHeader = config.requestsPerMinute;
    this.limitTokensFromHeader = config.tokensPerMinute;
    this.lastRefillTime = Date.now();
    this.lastHeaderUpdateTime = Date.now();
    Logger.info(this.MODULE, "Rate limiter configured", config);
  }

  private static parseHeader(
    headers: RateLimitHeaders,
    keys: string[],
  ): number {
    for (const key of keys) {
      const value = headers[key as keyof RateLimitHeaders];
      if (value) {
        const parsed = parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return 0;
  }

  static updateFromHeaders(headers: RateLimitHeaders): void {
    try {
      const remainingRequests = this.parseHeader(headers, [
        "anthropic-ratelimit-requests-remaining",
        "x-ratelimit-remaining-requests",
      ]);
      const remainingTokens = this.parseHeader(headers, [
        "anthropic-ratelimit-tokens-remaining",
        "x-ratelimit-remaining-tokens",
      ]);
      const limitRequests = this.parseHeader(headers, [
        "anthropic-ratelimit-requests-limit",
        "x-ratelimit-limit-requests",
      ]);
      const limitTokens = this.parseHeader(headers, [
        "anthropic-ratelimit-tokens-limit",
        "x-ratelimit-limit-tokens",
      ]);

      if (remainingRequests > 0) {
        this.requestTokens = remainingRequests;
        this.limitRequestsFromHeader = limitRequests || this.requestsPerMinute;
        Logger.debug(
          this.MODULE,
          `Updated from API headers: ${remainingRequests} requests remaining`,
        );
      }

      if (remainingTokens > 0) {
        this.tokenTokens = remainingTokens;
        this.limitTokensFromHeader = limitTokens || this.tokensPerMinute;
      }

      this.lastHeaderUpdateTime = Date.now();
      this.lastRefillTime = Date.now();
    } catch (error) {
      Logger.debug(
        this.MODULE,
        "Failed to parse rate limit headers",
        error as Error,
      );
    }
  }

  private static refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;
    const minutesPassed = timePassed / 60000;

    const timeSinceHeaderUpdate = now - this.lastHeaderUpdateTime;
    if (timeSinceHeaderUpdate > 60000) {
      this.requestTokens = this.limitRequestsFromHeader;
      this.tokenTokens = this.limitTokensFromHeader;
      this.lastRefillTime = now;
      Logger.debug(
        this.MODULE,
        "Reset rate limit tokens based on header limits",
      );
      return;
    }

    if (minutesPassed > 0) {
      const requestRefill = this.requestsPerMinute * minutesPassed;
      this.requestTokens = Math.min(
        this.limitRequestsFromHeader,
        this.requestTokens + requestRefill,
      );

      const tokenRefill = this.tokensPerMinute * minutesPassed;
      this.tokenTokens = Math.min(
        this.limitTokensFromHeader,
        this.tokenTokens + tokenRefill,
      );

      this.lastRefillTime = now;
    }
  }

  static canMakeRequest(estimatedTokens: number = 100): boolean {
    this.refill();

    const canRequest = this.requestTokens >= 1;
    const canTokens = this.tokenTokens >= estimatedTokens;

    return canRequest && canTokens;
  }

  static consumeRequest(tokensUsed: number = 100): boolean {
    this.refill();

    if (this.requestTokens >= 1 && this.tokenTokens >= tokensUsed) {
      this.requestTokens--;
      this.tokenTokens -= tokensUsed;
      Logger.debug(
        this.MODULE,
        `Request consumed: ${this.requestTokens.toFixed(1)} requests, ${this.tokenTokens.toFixed(1)} tokens remaining`,
      );
      return true;
    }

    Logger.warn(this.MODULE, "Rate limit exceeded", {
      requestTokens: this.requestTokens.toFixed(1),
      tokenTokens: this.tokenTokens.toFixed(1),
      estimated: tokensUsed,
    });

    return false;
  }

  static getStatus() {
    this.refill();

    const requestsPercentage =
      (this.requestTokens / this.requestsPerMinute) * 100;
    const tokensPercentage = (this.tokenTokens / this.tokensPerMinute) * 100;

    return {
      requestsAvailable: this.requestTokens.toFixed(1),
      requestsLimit: this.requestsPerMinute,
      requestsPercentage: requestsPercentage.toFixed(1),
      tokensAvailable: this.tokenTokens.toFixed(1),
      tokensLimit: this.tokensPerMinute,
      tokensPercentage: tokensPercentage.toFixed(1),
      resetTime: new Date(this.lastRefillTime + 60000).toISOString(),
    };
  }

  static reset(): void {
    this.requestTokens = this.requestsPerMinute;
    this.tokenTokens = this.tokensPerMinute;
    this.lastRefillTime = Date.now();
    Logger.info(this.MODULE, "Rate limiter reset");
  }

  static async waitForCapacity(
    estimatedTokens: number = 100,
    maxWaitMs: number = 30000,
  ): Promise<boolean> {
    const startTime = Date.now();

    while (!this.canMakeRequest(estimatedTokens)) {
      if (Date.now() - startTime > maxWaitMs) {
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return true;
  }
}
