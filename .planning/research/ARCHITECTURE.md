# Architecture Research

**Domain:** Personal dev-machine inventory / rebuild-awareness tool
**Researched:** 2026-06-07
**Confidence:** HIGH (core patterns), MEDIUM (OpenAI flow details)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  LOCAL MACHINE (Zorin 18 Pro)                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Python Scanner (python -m scanner scan)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │   │
│  │  │ editors  │ │  tools   │ │  langs   │ │  projects      │  │   │
│  │  │ module   │ │  module  │ │  module  │ │  module        │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘  │   │
│  │       └────────────┴────────────┴───────────────┘            │   │
│  │                     CollectorRegistry                         │   │
│  │                           │ POST /api/scanner/upload          │   │
│  │                    (token in header only)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │ HTTPS
┌──────────────────────────────────────▼──────────────────────────────┐
│  VERCEL (Next.js App Router)                                        │
│                                                                     │
│  middleware.ts ─── protects /dashboard routes via Supabase session  │
│                                                                     │
│  app/api/scanner/upload/route.ts   ← Scanner POSTs here             │
│    1. validate opaque token (hash lookup via service role)          │
│    2. upsert scan_items via service role client                     │
│                                                                     │
│  app/api/scanner/config/route.ts   ← Scanner GETs before scan      │
│    1. validate opaque token                                         │
│    2. return approved_folders + approved_commands                   │
│                                                                     │
│  app/api/analysis/route.ts         ← dashboard triggers             │
│    1. read inventory from Supabase (service role)                   │
│    2. call OpenAI with structured output schema                     │
│    3. write results back to Supabase                                │
│    4. stream response to browser                                    │
│                                                                     │
│  app/(dashboard)/**                ← Server Components              │
│    fetch inventory direct from Supabase (user-scoped client)       │
│    all protected by middleware                                      │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │ service_role (server only)
┌──────────────────────────────────────▼──────────────────────────────┐
│  SUPABASE                                                           │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────────┐   │
│  │  auth        │  │  database     │  │  (storage — unused MVP)│   │
│  │  magic link  │  │  scan_items   │  └────────────────────────┘   │
│  │  sessions    │  │  scanner_tokens                               │   │
│  │              │  │  scan_config  │                               │   │
│  └──────────────┘  │  ai_notes     │                               │   │
│                    └───────────────┘                               │
│  RLS: ON for dashboard reads; bypassed via service_role on API     │
│  routes (scanner has no Supabase credentials at all)               │
└─────────────────────────────────────────────────────────────────────┘
                                       │ API call
┌──────────────────────────────────────▼──────────────────────────────┐
│  OPENAI                                                             │
│  gpt-4o with structured outputs (response_format: json_schema)     │
│  Manually triggered from dashboard only — no background polling    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Scanner CLI | Detect installed tools, redact secrets, POST inventory | Python + venv, modular collectors |
| CollectorRegistry | Discover and run all scanner modules, aggregate results | Python class, auto-discovers modules in `collectors/` |
| Vercel API: `/api/scanner/upload` | Validate scanner token, write inventory to Supabase | Next.js Route Handler, service_role client |
| Vercel API: `/api/scanner/config` | Return approved scan config to scanner before run | Next.js Route Handler, service_role client |
| Vercel API: `/api/analysis` | Call OpenAI, stream result, persist notes | Next.js Route Handler, edge-compatible |
| Next.js middleware | Protect all `/dashboard` routes using Supabase session cookie | `@supabase/ssr` middleware pattern |
| Dashboard (Server Components) | Display inventory, trigger analysis, manage config | Next.js App Router Server Components |
| Supabase auth | Magic-link login, session cookies | Supabase Auth, single user |
| Supabase database | Inventory storage, token storage, config storage | PostgreSQL, RLS enabled |

---

## Recommended Project Structure

```
zorinrestore/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Route group — middleware-protected
│   │   ├── page.tsx              # Inventory overview
│   │   ├── config/page.tsx       # Scan folder + command approval
│   │   ├── secrets/page.tsx      # Secrets checklist
│   │   └── export/page.tsx       # Export to .md / .json
│   ├── api/
│   │   ├── scanner/
│   │   │   ├── upload/route.ts   # Scanner POST endpoint
│   │   │   └── config/route.ts   # Scanner GET config endpoint
│   │   └── analysis/route.ts     # OpenAI trigger + streaming
│   ├── auth/
│   │   └── callback/route.ts     # Supabase magic-link callback
│   ├── login/page.tsx
│   └── layout.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client (@supabase/ssr)
│   │   ├── server.ts             # Server/RSC client (@supabase/ssr)
│   │   └── admin.ts             # Service role client (API routes only)
│   ├── tokens.ts                 # Token hash + validation helpers
│   └── openai.ts                 # OpenAI client + schema definitions
├── middleware.ts                  # Route protection
├── scanner/                      # Python package (separate from Next.js)
│   ├── __main__.py               # Entry point: python -m scanner scan
│   ├── client.py                 # HTTP client: fetch config, POST upload
│   ├── registry.py               # CollectorRegistry: discovers + runs all collectors
│   ├── redact.py                 # Redaction rules (env var names, paths)
│   └── collectors/
│       ├── base.py               # BaseCollector ABC
│       ├── editors.py            # VS Code, Cursor, Neovim, JetBrains
│       ├── ai_tools.py           # Claude CLI, Ollama, LM Studio, Continue
│       ├── languages.py          # Python, Node, Go, Rust versions + paths
│       ├── package_managers.py   # pip, npm, cargo, brew global installs
│       ├── shell.py              # Shell type, rc file paths (not content)
│       ├── git.py                # Git config name/email (not tokens)
│       └── projects.py          # Approved project roots, depth-1 scan
├── supabase/
│   └── migrations/               # SQL migration files
└── requirements.txt              # Scanner Python dependencies
```

### Structure Rationale

- **`app/(dashboard)/`:** Route group keeps all protected UI co-located; middleware targets this group cleanly.
- **`lib/supabase/`:** Three separate clients prevents accidental service_role leakage into browser bundles; admin.ts is only imported in `app/api/` files.
- **`scanner/collectors/`:** One file per tool category. Adding a new scanner module means adding one file — no changes to core. CollectorRegistry auto-discovers via directory scan.
- **`supabase/migrations/`:** Version-controlled schema history; required for reproducibility across environments.

---

## Architectural Patterns

### Pattern 1: Opaque Token for Scanner Authentication (not JWT)

**What:** The dashboard generates a cryptographically random token (e.g. 32-byte `secrets.token_urlsafe()`). The raw token is given to the user once. The server stores only a SHA-256 hash in the `scanner_tokens` table. On each scanner request the API route hashes the inbound token and does a constant-time equality check against the stored hash.

**When to use:** Any situation where the credential holder (scanner) must be revocable without a full key rotation, and where the credential must NOT be self-verifiable (JWTs can be decoded client-side, leaking claims).

**Why not JWT here:** JWTs are stateless — you cannot revoke them without maintaining a denylist, which defeats the purpose. For a scanner running on a local machine you want hard revocability. Also, Vercel serverless cannot cache JWKS in memory, so JWT verification requires an outbound network call on every request anyway — opaque tokens with a DB lookup are equivalent in cost and simpler.

**Schema:**
```sql
create table scanner_tokens (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text unique not null,  -- SHA-256 hex of raw token
  label       text,                  -- e.g. "zorin-laptop-2026"
  created_at  timestamptz default now(),
  last_used   timestamptz,
  revoked     boolean default false
);
-- No RLS needed: this table is only ever accessed via service_role from API routes
```

**Validation in route handler:**
```typescript
import { createHash } from "crypto";
import { adminSupabase } from "@/lib/supabase/admin";

async function validateScannerToken(raw: string): Promise<boolean> {
  const hash = createHash("sha256").update(raw).digest("hex");
  const { data } = await adminSupabase
    .from("scanner_tokens")
    .select("id, revoked")
    .eq("token_hash", hash)
    .single();
  return !!data && !data.revoked;
}
```

**Confidence:** HIGH — standard hashed token pattern; matches Vercel's own opaque token approach for their API keys.

---

### Pattern 2: Supabase Schema — Hybrid Fixed + JSONB

**What:** Core inventory fields (category, tool name, version, path, importance) are typed columns. Tool-specific metadata (e.g. VS Code extension list, npm global list) lives in a `metadata jsonb` column with a GIN index.

**When to use:** When the "shape" of a detected tool varies by category but you still want to filter/sort on core fields. A pure JSONB approach makes querying fragile; a pure relational approach requires a new column per tool property.

**Schema:**
```sql
-- All scan items for the latest scan (no history in MVP)
create table scan_items (
  id            uuid primary key default gen_random_uuid(),
  scanned_at    timestamptz default now(),
  category      text not null,          -- 'editor' | 'ai_tool' | 'language' | 'shell' | 'project'
  tool_name     text not null,          -- 'cursor' | 'node' | 'ollama'
  version       text,                   -- nullable; not all tools expose versions
  install_path  text,                   -- where it lives on disk
  importance    text default 'medium',  -- 'critical' | 'high' | 'medium' | 'low'
  confidence    text default 'high',    -- scanner confidence in the detection
  needs_review  boolean default false,  -- Review Queue flag
  metadata      jsonb,                  -- tool-specific flexible data
  ai_notes      text,                   -- OpenAI-generated notes (nullable)
  updated_at    timestamptz default now()
);

-- Unique constraint: one row per tool. Upsert on (category, tool_name).
create unique index scan_items_tool_uidx on scan_items (category, tool_name);

-- GIN index for metadata queries
create index scan_items_metadata_gin on scan_items using gin (metadata);

-- Scan config: approved folder roots + approved extra commands
create table scan_config (
  id            uuid primary key default gen_random_uuid(),
  approved_folders  text[] default '{}',
  approved_commands jsonb  default '[]'  -- [{cmd, args, label, approved_at}]
);

-- Secrets checklist: names/reminders only, never values
create table secrets_checklist (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,   -- e.g. "ANTHROPIC_API_KEY"
  reminder  text,            -- e.g. "stored in 1Password under AI keys"
  category  text             -- 'ai' | 'cloud' | 'git' | 'other'
);

-- GRANTs required (Supabase projects created >= 2026-05-30)
grant select, insert, update, delete
  on public.scan_items, public.scan_config, public.secrets_checklist, public.scanner_tokens
  to authenticated;
-- anon gets nothing — scanner never talks to Supabase directly
```

**Upsert pattern in upload route (replace scan on each run):**
```typescript
// Full replace: delete all, then insert. Keeps "latest scan only" invariant clean.
await adminSupabase.from("scan_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await adminSupabase.from("scan_items").insert(items);
```

**Confidence:** HIGH — PostgreSQL JSONB hybrid pattern is well-established for variable-schema inventory data.

---

### Pattern 3: Next.js App Router + Supabase Auth (Cookie Sessions)

**What:** `@supabase/ssr` provides two client factories: one for Server Components (reads cookies from Next.js `cookies()`) and one for the browser. Middleware at the root refreshes the session before every protected route renders. Dashboard pages are Server Components that fetch data directly — no client-side fetching needed for read-heavy inventory display.

**Package:** `@supabase/ssr` (the older `@supabase/auth-helpers-nextjs` is deprecated as of 2025 — do not use).

**Middleware pattern:**
```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(),
                 setAll: (cs) => cs.forEach(({ name, value, options }) =>
                   response.cookies.set(name, value, options)) } }
  );
  // IMPORTANT: use getUser(), not getSession() — getUser() re-validates with Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}
export const config = { matcher: ["/dashboard/:path*"] };
```

**Server Component data fetch (no client state needed):**
```typescript
// app/(dashboard)/page.tsx
import { createServerClient } from "@/lib/supabase/server";
export default async function InventoryPage() {
  const supabase = await createServerClient();
  const { data: items } = await supabase
    .from("scan_items")
    .select("*")
    .order("category");
  return <InventoryTable items={items} />;
}
```

**Confidence:** HIGH — official Supabase docs and the `@supabase/ssr` package are the current canonical pattern.

---

### Pattern 4: OpenAI Analysis — Structured Outputs, No Streaming

**What:** A Route Handler reads all `scan_items`, builds a single structured prompt, calls `gpt-4o` with `response_format: { type: "json_schema" }`, and writes the result back to Supabase. No streaming needed — this is a background operation the user triggers and waits a few seconds for; showing a spinner is fine.

**Why not streaming:** Streaming adds complexity (ReadableStream, client-side accumulation). For an analysis that writes to a database and then re-renders a table, there is nothing meaningful to stream to the UI incrementally. Ship the simple version first.

**Schema for structured output:**
```typescript
// lib/openai.ts
const analysisItemSchema = {
  type: "object",
  properties: {
    tool_name:  { type: "string" },
    importance: { type: "string", enum: ["critical", "high", "medium", "low"] },
    ai_notes:   { type: "string" },
    needs_review: { type: "boolean" }
  },
  required: ["tool_name", "importance", "ai_notes", "needs_review"],
  additionalProperties: false
};

const analysisResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: analysisItemSchema }
  },
  required: ["items"],
  additionalProperties: false
};
```

**Prompt strategy:** One system prompt defines the analyser role. One user message contains the raw inventory as compact JSON. Keep prompt flat — avoid deeply nested instructions.

```
System: You are analysing a Linux developer machine inventory.
        For each item: classify rebuild importance, write a one-sentence restore note,
        and flag it for review if the detection confidence is low or the item is unusual.
        Respond only with the JSON schema provided.

User: [JSON array of scan_items stripped to: tool_name, category, version, install_path, confidence, metadata]
```

**Confidence:** MEDIUM — structured outputs pattern is well-established; specific prompt tuning will require iteration.

---

### Pattern 5: Python Scanner — CollectorRegistry with Base Class

**What:** Each scanner module extends `BaseCollector`, implements a single `collect() -> list[ScanItem]` method, and is auto-discovered by `CollectorRegistry` via directory scan of `collectors/`. The registry runs all collectors, merges results, and the CLI then fetches config and POSTs.

**Why this over entry_points plugin system:** Entry points are for distributable packages. This is a personal tool run from a local repo. A simpler directory-scan approach (`importlib` + directory listing) has zero overhead and is trivially extensible.

**BaseCollector:**
```python
# scanner/collectors/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

@dataclass
class ScanItem:
    category: str
    tool_name: str
    version: str | None = None
    install_path: str | None = None
    confidence: str = "high"   # high | medium | low
    needs_review: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)

class BaseCollector(ABC):
    @abstractmethod
    def collect(self) -> list[ScanItem]:
        """Return detected items. Return [] if nothing found — never raise."""
        ...
```

**Auto-discovery:**
```python
# scanner/registry.py
import importlib
import pkgutil
from scanner.collectors.base import BaseCollector, ScanItem

class CollectorRegistry:
    def run_all(self) -> list[ScanItem]:
        results = []
        import scanner.collectors as pkg
        for _, name, _ in pkgutil.iter_modules(pkg.__path__):
            if name == "base":
                continue
            mod = importlib.import_module(f"scanner.collectors.{name}")
            for attr in vars(mod).values():
                if isinstance(attr, type) and issubclass(attr, BaseCollector) and attr is not BaseCollector:
                    results.extend(attr().collect())
        return results
```

**Adding a new scanner module = create one file in `collectors/`. No other changes.**

**Confidence:** HIGH — standard Python module autodiscovery pattern.

---

## Data Flow

### Scanner Run Flow

```
python -m scanner scan
    │
    ├─► GET /api/scanner/config  (token in Authorization header)
    │       Vercel validates token → returns {approved_folders, approved_commands}
    │
    ├─► CollectorRegistry.run_all()
    │       Each collector runs, returns ScanItem list
    │       redact.py strips secret values (env var names only)
    │
    └─► POST /api/scanner/upload  (token in Authorization header)
            Body: {items: ScanItem[], scanned_at: ISO8601}
            Vercel validates token → service_role upsert to scan_items
            Response: {ok: true, count: N}
```

### Dashboard Auth Flow

```
User visits /dashboard/*
    │
    middleware.ts
    │   supabase.auth.getUser()  [re-validates with Supabase Auth server]
    │   if no user → redirect /login
    │
    Server Component renders
    │   createServerClient() [reads session cookie]
    │   supabase.from("scan_items").select(...)
    │   returns data → renders HTML
```

### Token Issuance Flow

```
User (logged in) → /dashboard/config → "Generate scanner token"
    │
    Server Action (server-side)
    │   secrets.token_urlsafe(32)  → raw_token (shown once)
    │   SHA-256(raw_token)         → token_hash
    │   INSERT scanner_tokens (token_hash, label)
    │
    User copies raw_token → sets as SCANNER_TOKEN env var in scanner repo
```

### OpenAI Analysis Flow

```
User clicks "Run AI Analysis" in dashboard
    │
    POST /api/analysis
    │   adminSupabase.from("scan_items").select("*")
    │   Build prompt with inventory JSON
    │   openai.chat.completions.create({response_format: json_schema, ...})
    │   Parse structured response
    │   adminSupabase.from("scan_items").update({ai_notes, importance}) per item
    │
    Response: {ok: true, updated: N}
    Dashboard re-fetches (revalidatePath or router.refresh())
```

---

## Suggested Build Order

Dependencies drive this order. Each phase produces a working vertical slice.

| Step | What to Build | Dependency | Deliverable |
|------|--------------|------------|-------------|
| 1 | Supabase schema + migrations | None | Tables exist, GRANTs applied |
| 2 | Supabase auth + magic link + middleware | Schema | Can log in, /dashboard protected |
| 3 | Scanner token issuance UI + token table | Auth | Can issue/revoke scanner tokens |
| 4 | `/api/scanner/upload` route (token validation + upsert) | Token table | Scanner can POST |
| 5 | Python scanner: BaseCollector + 2-3 core collectors + CLI | Upload route | End-to-end: scan → upload → DB |
| 6 | `/api/scanner/config` route + scan_config table + scanner fetches config | Scanner | Config-gated scanning works |
| 7 | Dashboard inventory view (Server Components) | Data in DB | Can see inventory in browser |
| 8 | OpenAI analysis route + structured output schema | Inventory in DB | AI notes appear on items |
| 9 | Remaining scanner collectors | Core scanner | Full tool detection coverage |
| 10 | Review Queue, Secrets Checklist, Export | All above | Feature completeness |

**Fastest path to working end-to-end (Steps 1-5):** Schema → auth → token issuance → upload API route → scanner with one collector. This gives a working pipeline in ~2 days. Everything else layers on top.

---

## Anti-Patterns

### Anti-Pattern 1: Scanner Holds Supabase Credentials

**What people do:** Give the scanner the Supabase URL + anon key (or service role key) and let it write directly to the database.

**Why it's wrong:** The scanner runs on a local machine. Any credential stored there is at risk if the machine is compromised or the repo is accidentally pushed public. The service_role key bypasses all RLS — total DB exposure. The anon key still exposes the Supabase project URL and allows probing.

**Do this instead:** The scanner holds only the app URL and an opaque token. The Vercel API route holds all Supabase credentials server-side.

---

### Anti-Pattern 2: Using `supabase.auth.getSession()` in Middleware

**What people do:** Call `getSession()` in middleware to check auth status — it's faster because it reads the cookie without a network round-trip.

**Why it's wrong:** `getSession()` trusts the cookie contents without re-validating with the Supabase Auth server. A forged or expired-but-cached session cookie passes the check. The Supabase docs explicitly state: "never trust getSession() inside server code."

**Do this instead:** Always use `supabase.auth.getUser()` in middleware and server-side auth checks. It re-validates with the Auth server on every call.

---

### Anti-Pattern 3: JWT for Scanner Token

**What people do:** Issue a signed JWT to the scanner so the Vercel route can verify it without a database lookup.

**Why it's wrong:** JWTs are stateless — you cannot revoke them before expiry without maintaining a denylist (which is a DB lookup anyway). For a token stored on a developer's laptop, revocability is essential. A leaked JWT can be used until it expires.

**Do this instead:** Opaque token + hashed DB lookup. Revocation is a single `UPDATE scanner_tokens SET revoked = true`.

---

### Anti-Pattern 4: Scan History by Default

**What people do:** Append every scan as a new set of rows, building history.

**Why it's wrong:** For MVP, this creates query complexity (always filtering by latest scan_id), schema complexity (every query needs a JOIN or subquery), and display complexity (what to show if items appear/disappear between scans).

**Do this instead:** Delete all scan_items and re-insert on each scan (full replace). Add a `last_scanned_at` timestamp at the table level. History is explicitly a Phase 2 feature.

---

### Anti-Pattern 5: Streaming OpenAI Response to the Browser

**What people do:** Stream the OpenAI token stream directly to the browser for perceived responsiveness.

**Why it's wrong:** For this use case, the AI output is a structured JSON blob that gets written to a database. There is nothing meaningful to incrementally display — partial JSON is not renderable as an inventory update. Streaming adds a ReadableStream pipeline, client-side accumulation, and partial-parse logic for zero UX benefit.

**Do this instead:** Non-streaming call, spinner on the button, re-fetch inventory table after response.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `@supabase/ssr` cookie-based sessions; magic link only | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars |
| Supabase DB (dashboard) | `@supabase/ssr` server client, user-scoped (respects RLS) | Server Components only |
| Supabase DB (API routes) | `@supabase/supabase-js` with `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars — never in client bundle |
| OpenAI | `openai` Node SDK, `response_format: json_schema` | `OPENAI_API_KEY` in Vercel env vars |
| Scanner → Vercel | HTTPS POST with `Authorization: Bearer <raw_token>` header | Scanner needs only `SCANNER_API_URL` + `SCANNER_TOKEN` env vars |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Scanner ↔ Vercel API | HTTP (JSON over HTTPS) | One-way: scanner always initiates |
| Vercel middleware ↔ Dashboard routes | In-process (Next.js request pipeline) | Middleware runs before every route handler |
| API routes ↔ Supabase | `supabase-js` service_role client | Only in `app/api/` files — never exposed to client |
| Dashboard Server Components ↔ Supabase | `supabase-js` user-scoped client | Session cookie from `@supabase/ssr` |
| CollectorRegistry ↔ Collectors | Python in-process function call | No IPC, no subprocesses — all in same Python process |

---

## Scaling Considerations

This is a single-user personal tool. Scaling is irrelevant. The only "scaling" concern is latency:

- The upload route processes one scan at a time. Upsert of ~50-100 items is fast (< 100ms).
- The OpenAI analysis call will take 3-10 seconds depending on inventory size. A spinner is sufficient.
- Supabase free tier is more than adequate for a single user's inventory.

---

## Sources

- [Supabase SSR Auth for Next.js (official docs)](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Creating Supabase SSR client (official docs)](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Managing JSON and JSONB in Supabase (official docs)](https://supabase.com/docs/guides/database/json)
- [Row Level Security (Supabase docs)](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OpenAI Structured Outputs (official docs)](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Opaque token vs JWT — Nordic APIs](https://nordicapis.com/jwt-vs-opaque-tokens-choosing-the-right-token-for-api-security/)
- [JWT Authentication on Vercel (Curity)](https://curity.io/resources/learn/serverless-zero-trust-api-on-vercel/)
- [Next.js Route Handlers (official docs)](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Python plugin/module autodiscovery (packaging.python.org)](https://packaging.python.org/guides/creating-and-discovering-plugins/)

---
*Architecture research for: Rebuild Ledger — personal dev machine inventory tool*
*Researched: 2026-06-07*
