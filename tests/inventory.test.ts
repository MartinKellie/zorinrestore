import { describe, it, expect, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";

// Stubs are RED until lib/actions/inventory.ts is implemented in plan 03-02

describe("updateItemImportance (INV-06)", () => {
  it("returns error for invalid importance value", async () => {
    const { updateItemImportance } = await import("@/lib/actions/inventory");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "item-1" }, error: null }) }) }) }),
    } as any);
    const result = await updateItemImportance("item-1", "BadValue");
    expect(result.error).toBeDefined();
  });

  it("returns {} on success for valid importance value", async () => {
    const { updateItemImportance } = await import("@/lib/actions/inventory");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "item-1" }, error: null }) }) }) }),
    } as any);
    const result = await updateItemImportance("item-1", "Essential");
    expect(result.error).toBeUndefined();
  });

  it("returns error when user is not authenticated", async () => {
    const { updateItemImportance } = await import("@/lib/actions/inventory");
    // createClient mock in setup.ts returns user: null by default
    const result = await updateItemImportance("item-1", "Essential");
    expect(result.error).toBe("Unauthorized");
  });
});

describe("updateItemNotes (INV-07, INV-08)", () => {
  it("returns error when user is not authenticated", async () => {
    const { updateItemNotes } = await import("@/lib/actions/inventory");
    const result = await updateItemNotes("item-1", {});
    expect(result.error).toBe("Unauthorized");
  });

  it("accepts general_note field (INV-07)", async () => {
    const { updateItemNotes } = await import("@/lib/actions/inventory");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "item-1" }, error: null }) }) }) }),
    } as any);
    const result = await updateItemNotes("item-1", { general_note: "used for AI" });
    expect(result.error).toBeUndefined();
  });

  it("accepts restore_note field (INV-08)", async () => {
    const { updateItemNotes } = await import("@/lib/actions/inventory");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "item-1" }, error: null }) }) }) }),
    } as any);
    const result = await updateItemNotes("item-1", { restore_note: "reinstall via npm" });
    expect(result.error).toBeUndefined();
  });
});
