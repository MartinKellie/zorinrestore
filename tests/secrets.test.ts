import { describe, it, expect, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";

// Stubs are RED until lib/actions/secrets.ts is implemented in plan 03-03

describe("addSecretReminder (SEC-02)", () => {
  it("returns error for empty name", async () => {
    const { addSecretReminder } = await import("@/lib/actions/secrets");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    } as any);
    const result = await addSecretReminder("");
    expect(result.error).toBeDefined();
  });

  it("returns {} on success with valid name", async () => {
    const { addSecretReminder } = await import("@/lib/actions/secrets");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    } as any);
    const result = await addSecretReminder("OPENAI_API_KEY");
    expect(result.error).toBeUndefined();
  });

  it("returns error when user is not authenticated", async () => {
    const { addSecretReminder } = await import("@/lib/actions/secrets");
    const result = await addSecretReminder("SOME_KEY");
    expect(result.error).toBe("Unauthorized");
  });
});

describe("flagSecretDep (SEC-03)", () => {
  it("returns error when user is not authenticated", async () => {
    const { flagSecretDep } = await import("@/lib/actions/secrets");
    const result = await flagSecretDep("item-1", true);
    expect(result.error).toBe("Unauthorized");
  });

  it("returns {} on success", async () => {
    const { flagSecretDep } = await import("@/lib/actions/secrets");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "item-1" }, error: null }) }) }) }),
    } as any);
    const result = await flagSecretDep("item-1", true);
    expect(result.error).toBeUndefined();
  });
});
