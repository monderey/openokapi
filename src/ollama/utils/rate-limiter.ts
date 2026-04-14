import { Logger } from "./logger.js";
import type { RateLimitConfig } from "../models/index.js";

export class RateLimiter {
  private static readonly MODULE = "OllamaRateLimiter";
  private static requestTokens = 30;
  private static lastRefillTime = Date.now();
  private static requestsPerMinute = 30;

  static configure(config: RateLimitConfig): void {
    this.requestsPerMinute = config.requestsPerMinute;
    this.requestTokens = config.requestsPerMinute;
    this.lastRefillTime = Date.now();
    Logger.info(this.MODULE, "Rate limiter configured", config);
  }

  private static refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;
    const minutesPassed = timePassed / 60000;

    if (minutesPassed >= 1) {
      this.requestTokens = this.requestsPerMinute;
      this.lastRefillTime = now;
      Logger.debug(this.MODULE, "Rate limit tokens refilled");
    }
  }

  static canMakeRequest(): boolean {
    this.refill();
    return this.requestTokens > 0;
  }

  static async waitForSlot(): Promise<void> {
    while (!this.canMakeRequest()) {
      const timeSinceRefill = Date.now() - this.lastRefillTime;
      const timeUntilRefill = 60000 - timeSinceRefill;
      const waitTime = Math.min(timeUntilRefill + 100, 5000);

      Logger.warn(
        this.MODULE,
        `Rate limit reached. Waiting ${waitTime}ms before next request`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.refill();
    }
  }

  static consumeRequest(): void {
    this.refill();
    if (this.requestTokens > 0) {
      this.requestTokens--;
      Logger.debug(
        this.MODULE,
        `Request consumed. ${this.requestTokens} remaining`,
      );
    }
  }

  static getStatus(): {
    requestsRemaining: number;
    requestsLimit: number;
    lastRefillTime: number;
  } {
    this.refill();
    return {
      requestsRemaining: this.requestTokens,
      requestsLimit: this.requestsPerMinute,
      lastRefillTime: this.lastRefillTime,
    };
  }

  static reset(): void {
    this.requestTokens = this.requestsPerMinute;
    this.lastRefillTime = Date.now();
    Logger.info(this.MODULE, "Rate limiter reset");
  }
}
