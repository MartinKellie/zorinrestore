import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

// Full tests for app/api/export/markdown/route.ts and app/api/export/json/route.ts (plan 03-04)

const mockMachine = { id: "machine-1", label: "My Zorin Box", last_scan_at: "2026-06-07T12:00:00Z" };
const mockRun = { id: "run-1", scanned_at: "2026-06-07T12:00:00Z", item_count: 3 };
const mockItems = [
  {
    id: "item-1",
    scan_run_id: "run-1",
    category: "CLI Tools",
    tool_name: "node",
    version: "20.0.0",
    install_path: "/usr/local/bin/node",
    importance: "Essential",
    confidence: "high",
    needs_review: false,
    metadata: null,
    general_note: "Core runtime",
    restore_note: "Install via nvm",
  },
  {
    id: "item-2",
    scan_run_id: "run-1",
    category: "CLI Tools",
    tool_name: "git",
    version: "2.40.0",
    install_path: "/usr/bin/git",
    importance: "Useful",
    confidence: "high",
    needs_review: false,
    metadata: null,
    general_note: null,
    restore_note: null,
  },
  {
    id: "item-3",
    scan_run_id: "run-1",
    category: "AI Tools",
    tool_name: "claude",
    version: "1.0.0",
    install_path: "/usr/local/bin/claude",
    importance: "Ignore",
    confidence: "medium",
    needs_review: false,
    metadata: null,
    general_note: null,
    restore_note: null,
  },
];

// Items without the "Ignore" one (for default export)
const mockActiveItems = mockItems.filter((i) => i.importance !== "Ignore");

// Helper to build the authenticated Supabase mock that returns machine, run, and items
function makeAuthenticatedClient(items: typeof mockItems) {
  // We need a chainable client that handles different .from() calls
  const machineChain: any = {
    select: () => machineChain,
    eq: () => machineChain,
    single: () => Promise.resolve({ data: mockMachine, error: null }),
  };
  const runChain: any = {
    select: () => runChain,
    eq: () => runChain,
    order: () => runChain,
    limit: () => runChain,
    single: () => Promise.resolve({ data: mockRun, error: null }),
  };
  const itemsChain: any = {
    select: () => itemsChain,
    eq: () => itemsChain,
    neq: () => itemsChain,
    order: () => Promise.resolve({ data: items, error: null }),
  };

  let callCount = 0;
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (table: string) => {
      if (table === "machines") return machineChain;
      if (table === "scan_runs") return runChain;
      if (table === "scan_items") return itemsChain;
      return machineChain;
    },
  } as any;
}

describe("GET /api/export/markdown (EXP-01, EXP-03, EXP-04)", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
    } as any);
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/export/markdown/route");
    const req = new Request("http://localhost/api/export/markdown") as any;
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns text/markdown with Content-Disposition attachment when authenticated", async () => {
    const { GET } = await import("@/app/api/export/markdown/route");
    vi.mocked(createClient).mockResolvedValueOnce(makeAuthenticatedClient(mockActiveItems));
    const req = new Request("http://localhost/api/export/markdown") as any;
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("machine-inventory.md");
  });

  it("markdown body contains machine label and item names", async () => {
    const { GET } = await import("@/app/api/export/markdown/route");
    vi.mocked(createClient).mockResolvedValueOnce(makeAuthenticatedClient(mockActiveItems));
    const req = new Request("http://localhost/api/export/markdown") as any;
    const res = await GET(req);
    const text = await res.text();
    expect(text).toContain("My Zorin Box");
    expect(text).toContain("node");
    expect(text).toContain("git");
  });

  it("default export excludes items where importance='Ignore'", async () => {
    const { GET } = await import("@/app/api/export/markdown/route");
    vi.mocked(createClient).mockResolvedValueOnce(makeAuthenticatedClient(mockActiveItems));
    const req = new Request("http://localhost/api/export/markdown") as any;
    const res = await GET(req);
    const text = await res.text();
    // "claude" item has importance=Ignore — should not appear
    expect(text).not.toContain("## Ignored Items");
  });

  it("?include_ignored=true puts ignored items in ## Ignored Items section", async () => {
    const { GET } = await import("@/app/api/export/markdown/route");
    vi.mocked(createClient).mockResolvedValueOnce(makeAuthenticatedClient(mockItems));
    const req = new Request(
      "http://localhost/api/export/markdown?include_ignored=true"
    ) as any;
    const res = await GET(req);
    const text = await res.text();
    expect(text).toContain("## Ignored Items");
    expect(text).toContain("claude");
  });
});

describe("GET /api/export/json (EXP-02, EXP-03, EXP-04)", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
    } as any);
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/export/json/route");
    const req = new Request("http://localhost/api/export/json") as any;
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns application/json with Content-Disposition attachment when authenticated", async () => {
    const { GET } = await import("@/app/api/export/json/route");
    vi.mocked(createClient).mockResolvedValueOnce(makeAuthenticatedClient(mockActiveItems));
    const req = new Request("http://localhost/api/export/json") as any;
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("machine-inventory.json");
  });

  it("JSON body contains machine and items array", async () => {
    const { GET } = await import("@/app/api/export/json/route");
    vi.mocked(createClient).mockResolvedValueOnce(makeAuthenticatedClient(mockActiveItems));
    const req = new Request("http://localhost/api/export/json") as any;
    const res = await GET(req);
    const json = await res.json();
    expect(json.machine).toBeDefined();
    expect(json.machine.label).toBe("My Zorin Box");
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.generated_at).toBeDefined();
  });

  it("default export excludes items where importance='Ignore' — no 'ignored' key", async () => {
    const { GET } = await import("@/app/api/export/json/route");
    vi.mocked(createClient).mockResolvedValueOnce(makeAuthenticatedClient(mockActiveItems));
    const req = new Request("http://localhost/api/export/json") as any;
    const res = await GET(req);
    const json = await res.json();
    expect(json.ignored).toBeUndefined();
    // None of the active items should have importance='Ignore'
    const hasIgnore = json.items.some((i: any) => i.importance === "Ignore");
    expect(hasIgnore).toBe(false);
  });

  it("?include_ignored=true adds separate 'ignored' array in JSON", async () => {
    const { GET } = await import("@/app/api/export/json/route");
    vi.mocked(createClient).mockResolvedValueOnce(makeAuthenticatedClient(mockItems));
    const req = new Request(
      "http://localhost/api/export/json?include_ignored=true"
    ) as any;
    const res = await GET(req);
    const json = await res.json();
    expect(Array.isArray(json.ignored)).toBe(true);
    expect(json.ignored.length).toBeGreaterThan(0);
    expect(json.ignored[0].tool_name).toBe("claude");
    // Active items should not include the ignored one
    const hasIgnoreInItems = json.items.some((i: any) => i.importance === "Ignore");
    expect(hasIgnoreInItems).toBe(false);
  });
});
