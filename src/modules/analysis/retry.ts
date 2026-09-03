import { MediaError } from "@/modules/media/errors";

export async function withTransientRetry<T>(
  operation: () => Promise<T>,
  maximumAttempts: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (cause) {
      lastError = cause;
      if (!(cause instanceof MediaError) || !cause.retryable) throw cause;
    }
  }
  throw lastError;
}
