import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "@/modules/auth/validation";

describe("auth validation", () => {
  it("normalizes valid signup fields", () => {
    expect(
      signupSchema.parse({
        displayName: "  Pat Example  ",
        email: "pat@example.test",
        password: "ValidPass123",
        tenantName: "  Pat Workspace  ",
      }),
    ).toEqual({
      displayName: "Pat Example",
      email: "pat@example.test",
      password: "ValidPass123",
      tenantName: "Pat Workspace",
    });
  });

  it("rejects malformed login input", () => {
    expect(
      loginSchema.safeParse({
        email: "not-an-email",
        password: "short",
      }).success,
    ).toBe(false);
  });
});
