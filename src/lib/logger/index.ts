import { env } from "@/lib/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  route?: string;
  userId?: string;
  code?: string;
  status?: number;
  [key: string]: unknown;
}

function serializeError(error: unknown): Record<string, unknown> | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: env.isProduction ? undefined : error.stack,
    };
  }

  return { value: String(error) };
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "mentis",
    environment: env.nodeEnv,
    ...context,
  };

  const line = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "debug":
      if (!env.isProduction) {
        console.debug(line);
      }
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    write("debug", message, context);
  },
  info(message: string, context?: LogContext): void {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    write("warn", message, context);
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    write("error", message, {
      ...context,
      error: serializeError(error),
    });
  },
};
