import { redactSensitiveFields } from "./redact";
import type { LogContext, Logger, LogLevel } from "./logger";

/**
 * The logger for server paths that must stay observable in production.
 *
 * `createDevLogger()` silences itself when `NODE_ENV === "production"`, which is right
 * for chatty development output but wrong for a durable pipeline: a swallowed
 * notification failure or an unconfigured provider would leave no trace at all, and
 * docs/PRODUCT.md §4 (J3) requires that failure to be recorded.
 *
 * One redacted JSON object per line, on the stream the platform collects. `debug` is
 * still suppressed in production, it is the only level that is purely diagnostic.
 *
 * Callers are responsible for what they put in `context`: this logger redacts fields
 * with sensitive names, but it cannot know that a value is someone's phone number.
 * Nothing in the lead pipeline passes PII to it.
 */
class ServerLogger implements Logger {
  private emit(level: LogLevel, message: string, context?: LogContext): void {
    if (level === "debug" && process.env.NODE_ENV === "production") return;

    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? { context: redactSensitiveFields(context) } : {}),
    });

    if (level === "error") {
      console.error(line);
      return;
    }
    if (level === "warn") {
      console.warn(line);
      return;
    }
    console.log(line);
  }

  debug(message: string, context?: LogContext): void {
    this.emit("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.emit("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.emit("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.emit("error", message, context);
  }

  captureException(error: unknown, context?: LogContext): void {
    this.emit("error", "Exception caught", {
      ...context,
      // The name and the frames, never the message: a provider or database message can
      // quote the offending row, and `error.stack` starts with that message.
      errorName: error instanceof Error ? error.name : "unknown",
      stack: error instanceof Error ? stackFrames(error) : undefined,
    });
  }
}

/** The stack without its leading `Name: message` line. */
function stackFrames(error: Error): string | undefined {
  const marker = error.stack?.indexOf("\n    at ") ?? -1;
  return marker === -1 ? undefined : error.stack?.slice(marker + 1);
}

export function createServerLogger(): Logger {
  return new ServerLogger();
}
