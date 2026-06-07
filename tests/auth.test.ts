import { describe, it, expect } from "vitest";

describe("signInWithMagicLink Server Action (AUTH-01)", () => {
  it("is exported from app/login/actions module", async () => {
    // Will fail: module not found until plan 01-02
    const { signInWithMagicLink } = await import("@/app/login/actions");
    expect(signInWithMagicLink).toBeDefined();
    expect(typeof signInWithMagicLink).toBe("function");
  });
});
