import { describe, expect, it, vi } from "vitest";

import { withTransientRetry } from "@/modules/analysis/retry";
import { MediaError } from "@/modules/media/errors";

describe("analysis provider retries", () => {
  it("retries transient failures within the configured bound", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(
        new MediaError(
          "CREATIVE_ANALYSIS_PROVIDER_FAILED",
          "rate limited",
          502,
          true,
        ),
      )
      .mockResolvedValue("ok");
    await expect(withTransientRetry(operation, 3)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not blind-retry schema failures", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(
        new MediaError(
          "CREATIVE_ANALYSIS_INVALID_OUTPUT",
          "invalid",
          422,
          false,
        ),
      );
    await expect(withTransientRetry(operation, 3)).rejects.toThrow("invalid");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
