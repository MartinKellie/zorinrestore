import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

describe("classifyReviewItem (REVQ-02)", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: null }, error: null }),
      },
    } as any);
  });

  it("returns error for invalid classification value", async () => {
    const { classifyReviewItem } = await import("@/lib/actions/review");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "item-1" }, error: null }) }) }) }),
    } as any);
    const result = await classifyReviewItem("item-1", "NotValid");
    expect(result.error).toBeDefined();
  });

  it("returns {} and clears needs_review on valid classification", async () => {
    const { classifyReviewItem } = await import("@/lib/actions/review");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "item-1" }, error: null }) }) }) }),
    } as any);
    const result = await classifyReviewItem("item-1", "Essential");
    expect(result.error).toBeUndefined();
  });

  it("returns error when user is not authenticated", async () => {
    const { classifyReviewItem } = await import("@/lib/actions/review");
    const result = await classifyReviewItem("item-1", "Essential");
    expect(result.error).toBe("Unauthorized");
  });
});
