import type { DestinationStream, LoggerOptions } from "pino";
import pino from "pino";

import { getServerEnvironment } from "@/lib/env/server";

export const redactedLogPaths = [
  "authorization",
  "cookie",
  "req.headers.authorization",
  "req.headers.cookie",
  "*.api_key",
  "*.apiKey",
  "*.access_token",
  "*.refresh_token",
  "*.secret",
] as const;

export function createLogger(destination?: DestinationStream) {
  const environment = getServerEnvironment();
  const options: LoggerOptions = {
    base: {
      service: "score-signals",
      environment: environment.NODE_ENV,
    },
    level: environment.LOG_LEVEL,
    redact: {
      paths: [...redactedLogPaths],
      censor: "[Redacted]",
    },
  };

  return destination ? pino(options, destination) : pino(options);
}

export const logger = createLogger();
