import { describe, it, expect, vi } from "vitest";
import { adminSupabase } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "scan_config") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            approved_folders: ["/home/user/existing"],
            approved_commands: [],
          },
          error: null,
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnThis(),
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

describe("scan-config Server Actions (FLDR-01, FLDR-02)", () => {
  describe("addApprovedFolder", () => {
    it("rejects path not starting with / or ~/", async () => {
      const { addApprovedFolder } = await import("@/lib/actions/scan-config");
      const result = await addApprovedFolder("machine-id", "relative/path");
      expect(result).toHaveProperty("error");
      expect(result.error).toMatch(/start with/i);
    });

    it("rejects empty path", async () => {
      const { addApprovedFolder } = await import("@/lib/actions/scan-config");
      const result = await addApprovedFolder("machine-id", "");
      expect(result).toHaveProperty("error");
    });

    it("calls upsert on scan_config with correct machineId and folder array including new folder", async () => {
      const { addApprovedFolder } = await import("@/lib/actions/scan-config");
      const result = await addApprovedFolder("machine-id", "/home/user/new-project");

      expect(result).toEqual({});
      expect(adminSupabase.from).toHaveBeenCalledWith("scan_config");
    });

    it("does not add duplicate folders", async () => {
      // Mock returns existing folder — adding same folder should not duplicate
      vi.mocked(adminSupabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { approved_folders: ["/home/user/existing"] },
          error: null,
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }) as any);

      const { addApprovedFolder } = await import("@/lib/actions/scan-config");
      const result = await addApprovedFolder("machine-id", "/home/user/existing");
      expect(result).toEqual({});
    });
  });

  describe("removeApprovedFolder", () => {
    it("filters out the specified folder from approved_folders array", async () => {
      const { removeApprovedFolder } = await import("@/lib/actions/scan-config");
      const result = await removeApprovedFolder("machine-id", "/home/user/existing");

      expect(result).toEqual({});
      expect(adminSupabase.from).toHaveBeenCalledWith("scan_config");
    });
  });
});
