import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns readiness with mock providers and a request id", async () => {
    const response = await GET(
      new Request("http://localhost/api/health", {
        headers: { "x-request-id": "integration-test-request" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBe(
      "integration-test-request",
    );
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      service: "score-signals",
      providers: expect.arrayContaining([
        { name: "ai", mode: "mock", status: "ready" },
        { name: "jobs", mode: "mock", status: "ready" },
      ]),
    });
  });
});
