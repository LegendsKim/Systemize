import { Logger, LogContext, LogLevel } from "./logger";
import { redactSensitiveFields } from "./redact";

class DevLogger implements Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const safeContext = context ? redactSensitiveFields(context) : undefined;
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(safeContext && { context: safeContext }),
    };
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(JSON.stringify(this.formatLog("debug", message, context), null, 2));
    }
  }

  info(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      console.info(JSON.stringify(this.formatLog("info", message, context), null, 2));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      console.warn(JSON.stringify(this.formatLog("warn", message, context), null, 2));
    }
  }

  error(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      console.error(JSON.stringify(this.formatLog("error", message, context), null, 2));
    }
  }

  captureException(error: unknown, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      
      const enrichedContext = {
        ...context,
        error: errorMessage,
        stack,
      };
      
      console.error(JSON.stringify(this.formatLog("error", "Exception caught", enrichedContext), null, 2));
    }
  }
}

export function createDevLogger(): Logger {
  return new DevLogger();
}
