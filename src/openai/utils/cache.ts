import type { CacheEntry, CacheStats } from "../models/index.js";
import { Logger } from "./logger.js";

export class Cache {
  private static readonly MODULE = "Cache";
  private static store = new Map<string, CacheEntry<any>>();
  private static maxSize = 1000;
  private static stats = { hits: 0, misses: 0 };

  static set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    if (this.store.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };

    this.store.set(key, entry);
    Logger.debug(this.MODULE, `Cache set: ${key}`);
  }

  static get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      Logger.debug(this.MODULE, `Cache miss: ${key}`);
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.store.delete(key);
      this.stats.misses++;
      Logger.debug(this.MODULE, `Cache expired: ${key}`);
      return null;
    }

    this.stats.hits++;
    Logger.debug(this.MODULE, `Cache hit: ${key}`);
    return entry.data;
  }

  static has(key: string): boolean {
    const entry = this.store.get(key) as CacheEntry<any> | undefined;

    if (!entry) {
      return false;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  static delete(key: string): void {
    this.store.delete(key);
    Logger.debug(this.MODULE, `Cache deleted: ${key}`);
  }

  static clear(): void {
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
    Logger.info(this.MODULE, "Cache cleared");
  }

  static getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.store.size,
      maxSize: this.maxSize,
    };
  }

  private static evictOldest(): void {
    let oldest: [string, CacheEntry<any>] | null = null;

    for (const [key, entry] of this.store.entries()) {
      if (!oldest || entry.timestamp < oldest[1].timestamp) {
        oldest = [key, entry];
      }
    }

    if (oldest) {
      this.store.delete(oldest[0]);
      Logger.debug(this.MODULE, `Evicted oldest cache entry: ${oldest[0]}`);
    }
  }

  static setMaxSize(size: number): void {
    this.maxSize = size;
    Logger.debug(this.MODULE, `Cache max size set to: ${size}`);
  }
}
