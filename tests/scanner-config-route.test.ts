import { describe, it, expect, vi } from "vitest";
import { validateScannerToken } from "@/lib/tokens";
import { adminSupabase } from "@/lib/supabase/admin";

vi.mock("@/lib/tokens", () => ({
  validateScannerToken: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "machines") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "machine-uuid" }, error: null }),
      };
    }
    if (table === "scan_config") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            approved_folders: ["/home/user/projects"],
            approved_commands: [],
          },
          error: null,
        }),
      };
    }
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    };
    return chain;
  });
  return {
    adminSupabase: { from: fromMock },
  };
});

describe("GET /api/scanner/config (FLDR-03)", () => {
  it("returns 401 when no valid token provided", async () => {
    vi.mocked(validateScannerToken).mockResolvedValueOnce({ valid: false });

    const { GET } = await import("@/app/api/scanner/config/route");
    const req = new Request("http://localhost/api/scanner/config", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("returns empty arrays when machine does not exist", async () => {
    vi.mocked(validateScannerToken).mockResolvedValueOnce({
      valid: true,
      tokenId: "token-id",
      userId: "user-uuid",
    });

    // Override machines to return null (no machine found)
    vi.mocked(adminSupabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }) as any);

    const { GET } = await import("@/app/api/scanner/config/route");
    const req = new Request("http://localhost/api/scanner/config", {
      method: "GET",
      headers: { Authorization: "Bearer validtoken" },
    });
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ approved_folders: [], approved_commands: [] });
  });

  it("returns scan_config data when machine and config row exist", async () => {
    vi.mocked(validateScannerToken).mockResolvedValueOnce({
      valid: true,
      tokenId: "token-id",
      userId: "user-uuid",
    });

    const { GET } = await import("@/app/api/scanner/config/route");
    const req = new Request("http://localhost/api/scanner/config", {
      method: "GET",
      headers: { Authorization: "Bearer validtoken" },
    });
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.approved_folders).toContain("/home/user/projects");
    expect(Array.isArray(body.approved_commands)).toBe(true);
  });
});
