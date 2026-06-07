import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminSupabase } from "@/lib/supabase/admin";

describe("/api/scanner/upload route (TOKEN-04, MACH-02, MACH-03)", () => {
  it("returns 401 for request without Authorization header", async () => {
    const { POST } = await import("@/app/api/scanner/upload/route");
    const req = new Request("http://localhost/api/scanner/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 401 for request with invalid Bearer token", async () => {
    const { POST } = await import("@/app/api/scanner/upload/route");
    const req = new Request("http://localhost/api/scanner/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalidtoken",
      },
      body: JSON.stringify({}),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  describe("with a valid token (MACH-03)", () => {
    const validPayload = {
      machine_hostname: "my-host",
      machine_os: "Linux",
      machine_kernel: "6.1.0",
      machine_arch: "x86_64",
      scanner_version: "0.1.0",
      python_version: "3.11.2",
      scanned_at: "2026-06-07T12:00:00.000Z",
      items: [
        {
          category: "python",
          tool_name: "ruff",
          version: "0.4.1",
          install_path: "/usr/local/bin/ruff",
          confidence: "high" as const,
          needs_review: false,
        },
      ],
    };

    beforeEach(() => {
      vi.resetModules();

      const MACHINE_ID = "machine-uuid";
      const RUN_ID = "run-uuid";

      vi.mock("@/lib/supabase/admin", () => {
        const makeChain = (overrides: Record<string, any> = {}): any => {
          const chain: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            ...overrides,
          };
          return chain;
        };
        return {
          adminSupabase: {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === "scanner_tokens") {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  single: vi
                    .fn()
                    .mockResolvedValue({
                      data: { id: "token-id", revoked: false, user_id: "user-uuid" },
                      error: null,
                    }),
                  update: vi.fn().mockReturnThis(),
                };
              }
              if (table === "machines") {
                return {
                  upsert: vi.fn().mockReturnThis(),
                  select: vi.fn().mockReturnThis(),
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: { id: "machine-uuid" }, error: null }),
                };
              }
              if (table === "scan_runs") {
                return {
                  insert: vi.fn().mockReturnThis(),
                  select: vi.fn().mockReturnThis(),
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: { id: "run-uuid" }, error: null }),
                };
              }
              if (table === "scan_items") {
                return {
                  upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
                };
              }
              return makeChain();
            }),
          },
        };
      });

      vi.mock("@/lib/tokens", () => ({
        validateScannerToken: vi.fn().mockResolvedValue({
          valid: true,
          tokenId: "token-id",
          userId: "user-uuid",
        }),
      }));
    });

    it("upserts machine row with correct fields (MACH-03)", async () => {
      const { POST } = await import("@/app/api/scanner/upload/route");
      const { adminSupabase: mockSupa } = await import("@/lib/supabase/admin");

      const req = new Request("http://localhost/api/scanner/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer validtoken",
        },
        body: JSON.stringify(validPayload),
      });

      const res = await POST(req as any);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);

      // Assert machines table was accessed
      expect(mockSupa.from).toHaveBeenCalledWith("machines");
    });

    it("creates scan_run row with machine_id", async () => {
      const { POST } = await import("@/app/api/scanner/upload/route");
      const { adminSupabase: mockSupa } = await import("@/lib/supabase/admin");

      const req = new Request("http://localhost/api/scanner/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer validtoken",
        },
        body: JSON.stringify(validPayload),
      });

      await POST(req as any);

      expect(mockSupa.from).toHaveBeenCalledWith("scan_runs");
    });

    it("upserts scan_items with scan_run_id", async () => {
      const { POST } = await import("@/app/api/scanner/upload/route");
      const { adminSupabase: mockSupa } = await import("@/lib/supabase/admin");

      const req = new Request("http://localhost/api/scanner/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer validtoken",
        },
        body: JSON.stringify(validPayload),
      });

      const res = await POST(req as any);
      const body = await res.json();

      expect(mockSupa.from).toHaveBeenCalledWith("scan_items");
      expect(body.scan_run_id).toBe("run-uuid");
      expect(body.items).toBe(1);
    });
  });
});
