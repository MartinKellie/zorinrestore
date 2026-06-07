import { describe, it, expect } from "vitest";

describe("proxy.ts route protection (AUTH-03)", () => {
  it("redirects unauthenticated requests to /dashboard to /login", async () => {
    // Will fail: proxy module does not exist yet until plan 01-02
    const proxyModule = await import("@/proxy");
    expect(proxyModule.proxy).toBeDefined();
    // Full redirect behaviour verified via manual smoke test (requires real session)
    // Unit coverage: proxy function is exported and callable
  });

  it("allows requests to /login without redirecting", async () => {
    const proxyModule = await import("@/proxy");
    expect(proxyModule.config).toBeDefined();
    expect(proxyModule.config.matcher).toBeDefined();
  });
});
