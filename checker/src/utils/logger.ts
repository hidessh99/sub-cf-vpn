export interface ILogger {
  debug(message: string, context?: string): void;
  info(message: string, context?: string): void;
  warn(message: string, context?: string): void;
  error(message: string, error?: any, context?: string): void;
}

export class StructuredLogger implements ILogger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
  }

  private format(level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, context?: string, error?: any): string {
    const timestamp = new Date().toISOString();
    
    if (this.isProduction) {
      return JSON.stringify({
        timestamp,
        level,
        context: context || "Application",
        message,
        error: error ? {
          message: error.message || String(error),
          stack: error.stack || undefined
        } : undefined
      });
    }

    const colorMap = {
      DEBUG: "\x1b[36m", // Cyan
      INFO: "\x1b[32m",  // Green
      WARN: "\x1b[33m",  // Yellow
      ERROR: "\x1b[31m", // Red
    };
    const resetColor = "\x1b[0m";
    const color = colorMap[level] || resetColor;
    
    const contextStr = context ? ` \x1b[35m[${context}]\x1b[0m` : "";
    let formatted = `[${timestamp}] ${color}[${level}]${resetColor}${contextStr} ${message}`;
    
    if (error) {
      formatted += `\n${error.stack || error.message || String(error)}`;
    }
    
    return formatted;
  }

  debug(message: string, context?: string): void {
    if (!this.isProduction || process.env.LOG_LEVEL === "debug") {
      console.debug(this.format("DEBUG", message, context));
    }
  }

  info(message: string, context?: string): void {
    console.log(this.format("INFO", message, context));
  }

  warn(message: string, context?: string): void {
    console.warn(this.format("WARN", message, context));
  }

  error(message: string, error?: any, context?: string): void {
    console.error(this.format("ERROR", message, context, error));
  }
}

// Global logger instance for quick fallback
export const logger = new StructuredLogger();
