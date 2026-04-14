import type { LogEntry } from "../models/index.js";
import { LogLevel } from "../models/index.js";

export class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000;
  private static logLevel: LogLevel = LogLevel.INFO;

  static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    const currentIndex = levels.indexOf(this.logLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= currentIndex;
  }

  private static addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (entry.level === LogLevel.ERROR) {
      const timestamp = new Date(entry.timestamp).toISOString();
      const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
      const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
      console.error(prefix, entry.message + dataStr, entry.error);
    }
  }

  static debug(module: string, message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog({
        level: LogLevel.DEBUG,
        timestamp: Date.now(),
        module,
        message,
        data,
      });
    }
  }

  static info(module: string, message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog({
        level: LogLevel.INFO,
        timestamp: Date.now(),
        module,
        message,
        data,
      });
    }
  }

  static warn(module: string, message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog({
        level: LogLevel.WARN,
        timestamp: Date.now(),
        module,
        message,
        data,
      });
    }
  }

  static error(
    module: string,
    message: string,
    error?: Error,
    data?: unknown,
  ): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog({
        level: LogLevel.ERROR,
        timestamp: Date.now(),
        module,
        message,
        data,
        error: error || undefined,
      } as LogEntry);
    }
  }

  static getLogs(limit?: number): LogEntry[] {
    if (limit) {
      return this.logs.slice(-limit);
    }
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static getStats() {
    return {
      totalLogs: this.logs.length,
      errors: this.logs.filter((l) => l.level === LogLevel.ERROR).length,
      warnings: this.logs.filter((l) => l.level === LogLevel.WARN).length,
    };
  }
}
