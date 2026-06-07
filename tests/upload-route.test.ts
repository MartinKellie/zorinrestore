import { describe, it, expect } from "vitest";

describe("/api/scanner/upload route (TOKEN-04, MACH-02)", () => {
  it("returns 401 for request without Authorization header", async () => {
    // Will fail: module not found until plan 01-03
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

  it("updates machine metadata fields from upload payload (MACH-02)", async () => {
    // Phase 1 stub — machine metadata population from scanner upload is implemented in Phase 2.
    // This test turns green when plan 01-03 / Phase 2 wires upsertMachine in the upload route.
    expect("not yet implemented").toBe("implemented");
  });
});
