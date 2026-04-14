import { Logger } from "./logger.js";

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

export interface RateLimitHeaders {
  "x-ratelimit-limit-requests"?: string;
  "x-ratelimit-limit-tokens"?: string;
  "x-ratelimit-remaining-requests"?: string;
  "x-ratelimit-remaining-tokens"?: string;
  "x-ratelimit-reset-requests"?: string;
  "x-ratelimit-reset-tokens"?: string;
}

export class RateLimiter {
  private static readonly MODULE = "RateLimiter";
  private static requestTokens = 90;
  private static tokenTokens = 90000;
  private static lastRefillTime = Date.now();
  private static lastHeaderUpdateTime = Date.now();
  private static requestsPerMinute = 90;
  private static tokensPerMinute = 90000;
  private static limitRequestsFromHeader = 90;
  private static limitTokensFromHeader = 90000;

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

  static updateFromHeaders(headers: RateLimitHeaders): void {
    try {
      const remainingRequests = parseInt(
        headers["x-ratelimit-remaining-requests"] || "0",
        10,
      );
      const remainingTokens = parseInt(
        headers["x-ratelimit-remaining-tokens"] || "0",
        10,
      );
      const limitRequests = parseInt(
        headers["x-ratelimit-limit-requests"] || "0",
        10,
      );
      const limitTokens = parseInt(
        headers["x-ratelimit-limit-tokens"] || "0",
        10,
      );

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
