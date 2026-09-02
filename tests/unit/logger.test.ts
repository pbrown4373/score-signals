import { Writable } from "node:stream";

import { afterEach, describe, expect, it } from "vitest";

import { resetServerEnvironmentForTests } from "@/lib/env/server";
import { createLogger } from "@/lib/logging/logger";

afterEach(() => {
  delete process.env.LOG_LEVEL;
  resetServerEnvironmentForTests();
});

describe("structured logger", () => {
  it("emits JSON and redacts secrets", async () => {
    const chunks: string[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk.toString());
        callback();
      },
    });

    const testLogger = createLogger(destination);
    testLogger.info(
      {
        authorization: "Bearer private-token",
        provider: { api_key: "private-key" },
      },
      "redaction check",
    );

    await new Promise<void>((resolve) => destination.end(resolve));

    const output = chunks.join("");
    expect(() => JSON.parse(output)).not.toThrow();
    expect(output).toContain("[Redacted]");
    expect(output).not.toContain("private-token");
    expect(output).not.toContain("private-key");
  });
});
