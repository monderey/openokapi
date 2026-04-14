export class Logger {
  static debug(module: string, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    if (process.env.DEBUG || process.env.NODE_ENV === "development") {
      console.debug(
        `[${timestamp}] [${module}] [DEBUG] ${message}`,
        data || "",
      );
    }
  }

  static info(module: string, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] [${module}] [INFO] ${message}`, data || "");
  }

  static warn(module: string, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [${module}] [WARN] ${message}`, data || "");
  }

  static error(module: string, message: string, error?: Error | unknown): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${module}] [ERROR] ${message}`, error || "");
  }
}
