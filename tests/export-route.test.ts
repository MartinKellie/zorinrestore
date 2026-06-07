import { describe, it, expect } from "vitest";

// Stubs are RED until app/api/export/*/route.ts is implemented in plan 03-04

describe("GET /api/export/markdown (EXP-01)", () => {
  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/export/markdown/route");
    const req = new Request("http://localhost/api/export/markdown");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/export/json (EXP-02)", () => {
  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/export/json/route");
    const req = new Request("http://localhost/api/export/json");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });
});
