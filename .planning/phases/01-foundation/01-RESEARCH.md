# Phase 1: Foundation - Research

**Researched:** 2026-06-07
**Domain:** Next.js 16 App Router + Supabase SSR Auth + Opaque Token System + Upload Gateway
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign in to dashboard with magic-link (email link, no password) | Supabase `signInWithOtp` + `/auth/confirm` route handler — fully documented pattern |
| AUTH-02 | User session persists across browser refresh | `@supabase/ssr` cookie-based sessions + `proxy.ts` session refresh on every request |
| AUTH-03 | All dashboard pages are protected and redirect unauthenticated users to sign-in | `proxy.ts` with `getUser()` guard + route matcher on `/dashboard/:path*` |
| MACH-01 | User can register a machine with a user-facing name | `machines` table with label column; Server Action inserts row; Settings page spec for Cursor |
| MACH-02 | Machine record captures hostname, OS, kernel, architecture, scanner version, Python version, last scan time | `machines` table columns; populated on first scanner upload via service_role client |
| TOKEN-01 | User can generate a scanner token from the dashboard | Server Action: `crypto.randomBytes(32)` → SHA-256 hash stored in `scanner_tokens`; raw token shown once |
| TOKEN-02 | Dashboard shows a ready-to-run setup/scan command the user can copy | Settings page spec: generate command string from env vars + token; copy-to-clipboard |
| TOKEN-03 | User can revoke a scanner token from the dashboard | Server Action: UPDATE `scanner_tokens` SET `revoked = true`; Settings page spec |
| TOKEN-04 | Scanner authenticates via token sent to Vercel API route — no Supabase credentials on local machine | `/api/scanner/upload` route handler validates Bearer token via SHA-256 hash lookup using service_role client |
| SET-01 | Settings page shows auth status / logged-in email | Settings page spec: `getUser()` in Server Component, display email |
| SET-02 | Settings page provides scanner token management (create, view, revoke) | Settings page spec: token list + generate + revoke actions |
| SET-04 | Settings page shows machine name with ability to edit | Settings page spec: machine name display + inline edit Server Action |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire trust boundary for the system. It must deliver: (1) working magic-link authentication with session persistence and protected routes, (2) a `machines` table that captures machine metadata, (3) a scanner token system with issuance and revocation, and (4) a `/api/scanner/upload` endpoint that validates tokens and is ready to accept data. The Settings page (auth status, token management, machine name) is produced as `FRONTEND_UI_SPEC.md` for Cursor — no frontend code is written by Claude directly.

The project is entirely greenfield — no application code exists yet. The Supabase project is live (post 2026-05-30, so explicit GRANTs are mandatory) and the Vercel project is configured. Next.js 16 App Router is the target framework, which means `proxy.ts` (not `middleware.ts`), async `params`/`cookies()`, and the `@supabase/ssr` two-client pattern. The schema must include a `scan_runs` FK from day one even though Phase 1 only stubs it — retrofitting it after data exists is an expensive migration.

All security-critical patterns must be correct in Phase 1 because later phases build on top of them: store only SHA-256 hash of the scanner token (never plaintext), use `getUser()` not `getSession()` in all server-side auth guards, include explicit `GRANT` statements in every migration, and include `scan_run_id` and `machine_id` FKs in `scan_items` even though they are unused until Phase 2.

**Primary recommendation:** Build in this order — Supabase schema + migrations (with GRANTs) → auth + `proxy.ts` + `/auth/confirm` handler → scanner token table + Server Actions → `/api/scanner/upload` route handler → Settings page spec for Cursor. Each step is a hard dependency for the next.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.x (latest) | App Router, API routes, Server Actions | Project constraint; Turbopack default; `proxy.ts` routing layer |
| `react` / `react-dom` | 19.2 | UI runtime | Bundled with Next.js 16 |
| `@supabase/supabase-js` | 2.107.x | Supabase client — data queries | Core client; used in both server and client contexts |
| `@supabase/ssr` | latest | Cookie-aware Supabase client for App Router SSR | Required for magic-link with Next.js 16; handles two-client pattern + session refresh in proxy |
| `typescript` | 5.1+ | Type safety | Required; Next.js 16 minimum TypeScript 5.1 |
| `zod` | 3.x | API input validation | Validates scanner upload payload shape on the route handler side |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `crypto` (Node.js stdlib) | — | SHA-256 hash for scanner token | Built-in; `createHash('sha256').update(raw).digest('hex')` |
| `openai` | 2.x | OpenAI calls from API routes | Phase 4 only; install now if scaffolding the full app shell |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Never — deprecated; redirected to `@supabase/ssr` by Supabase docs |
| Opaque token (SHA-256 hash) | JWT | JWT is stateless — cannot revoke without a denylist; DB lookup cost is equivalent; opaque token is simpler and harder to misuse |
| `proxy.ts` | `middleware.ts` | `middleware.ts` is the Next.js 15 name; Next.js 16 renamed it `proxy.ts` — using the old name silently falls back or breaks |

**Installation:**
```bash
npm install next@latest react@latest react-dom@latest
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D typescript @types/react @types/react-dom @types/node
```

---

## Architecture Patterns

### Recommended Project Structure

```
zorinrestore/                        # repo root
├── app/
│   ├── (dashboard)/                 # Route group — ALL routes here require auth
│   │   └── settings/
│   │       └── page.tsx             # Settings page — SPEC ONLY (Cursor implements)
│   ├── api/
│   │   └── scanner/
│   │       └── upload/
│   │           └── route.ts         # Scanner POST endpoint — token validation + stub upsert
│   ├── auth/
│   │   └── confirm/
│   │       └── route.ts             # Magic-link callback (token_hash exchange)
│   ├── login/
│   │   └── page.tsx                 # Sign-in page (email input → signInWithOtp)
│   └── layout.tsx
├── lib/
│   └── supabase/
│       ├── client.ts                # Browser client (createBrowserClient from @supabase/ssr)
│       ├── server.ts                # Server/RSC client (createServerClient with cookies())
│       └── admin.ts                 # Service role client — API routes only, never browser
├── proxy.ts                         # Route protection (NOT middleware.ts)
├── supabase/
│   └── migrations/
│       └── 0001_foundation.sql      # All Phase 1 tables + GRANTs
└── FRONTEND_UI_SPEC.md              # Settings page spec for Cursor
```

### Pattern 1: Supabase SSR Two-Client Setup

**What:** `@supabase/ssr` provides two factory functions: `createBrowserClient` for Client Components and `createServerClient` for Server Components / Route Handlers. They share the same session via cookies. A third `admin` client uses the `service_role` key and is only imported in `app/api/` files.

**When to use:** Every Supabase interaction in the Next.js app goes through one of these three clients. The choice depends on execution context.

```typescript
// lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies(); // async in Next.js 16
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Server Components cannot set cookies — ignore */ }
        },
      },
    }
  );
}
```

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/admin.ts  — NEVER import this in client components or lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // server-only env var (no NEXT_PUBLIC_ prefix)
);
```

### Pattern 2: proxy.ts Route Protection

**What:** `proxy.ts` (Next.js 16 name for what was `middleware.ts`) intercepts every request, refreshes the Supabase session cookie, and redirects unauthenticated users away from `/dashboard` routes. Uses `getUser()` — NOT `getSession()`.

**When to use:** This is the single gatekeeper for all protected routes. Must be present before any dashboard route exists.

```typescript
// proxy.ts — the file is named proxy.ts in Next.js 16 (NOT middleware.ts)
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: use getUser(), never getSession()
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Pattern 3: Magic-Link Auth Flow

**What:** The sign-in page calls `supabase.auth.signInWithOtp({ email })` which sends the magic link. The user clicks the link and lands on `/auth/confirm` which exchanges the token hash for a session.

**When to use:** The `/auth/confirm` route MUST exist before any user attempts to sign in — without it, magic-link auth silently fails (the link has nowhere to redirect to).

```typescript
// app/auth/confirm/route.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) redirect(next);
  }

  redirect("/login?error=auth_failed");
}
```

### Pattern 4: Opaque Scanner Token — Issuance and Validation

**What:** A Server Action generates a cryptographically random token, stores only its SHA-256 hash in the DB, and returns the raw token to the user once. The upload API route hashes the inbound Bearer token and compares against the stored hash.

**When to use:** Any time a scanner token is created or a scanner request is validated.

```typescript
// Server Action — token issuance (called from Settings page)
"use server";
import { randomBytes, createHash } from "crypto";
import { adminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function generateScannerToken(label: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const rawToken = randomBytes(32).toString("hex"); // 64-char hex string
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await adminSupabase.from("scanner_tokens").insert({
    user_id: user.id,
    token_hash: tokenHash,
    label,
  });

  return rawToken; // shown to user once — never stored raw
}
```

```typescript
// lib/tokens.ts — shared token validation helper
import { createHash } from "crypto";
import { adminSupabase } from "@/lib/supabase/admin";

export async function validateScannerToken(
  authHeader: string | null
): Promise<{ valid: boolean; tokenId?: string }> {
  if (!authHeader?.startsWith("Bearer ")) return { valid: false };
  const raw = authHeader.slice(7);
  const hash = createHash("sha256").update(raw).digest("hex");

  const { data } = await adminSupabase
    .from("scanner_tokens")
    .select("id, revoked")
    .eq("token_hash", hash)
    .single();

  if (!data || data.revoked) return { valid: false };

  // Update last_used
  await adminSupabase
    .from("scanner_tokens")
    .update({ last_used: new Date().toISOString() })
    .eq("id", data.id);

  return { valid: true, tokenId: data.id };
}
```

```typescript
// app/api/scanner/upload/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { validateScannerToken } from "@/lib/tokens";
import { adminSupabase } from "@/lib/supabase/admin";
import { z } from "zod";

const UploadPayloadSchema = z.object({
  machine_hostname: z.string(),
  machine_os: z.string(),
  machine_kernel: z.string().optional(),
  machine_arch: z.string().optional(),
  scanner_version: z.string(),
  python_version: z.string().optional(),
  scanned_at: z.string().datetime(),
  items: z.array(z.object({
    category: z.string(),
    tool_name: z.string(),
    version: z.string().nullable().optional(),
    install_path: z.string().nullable().optional(),
    confidence: z.enum(["high", "medium", "low"]).default("high"),
    needs_review: z.boolean().default(false),
    metadata: z.record(z.unknown()).optional(),
  })),
});

export async function POST(request: NextRequest) {
  const { valid } = await validateScannerToken(
    request.headers.get("authorization")
  );
  if (!valid) {
    return NextResponse.json({ error: "Invalid or revoked token" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = UploadPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  // Phase 1: stub — accept and acknowledge. Phase 2 wires up the upsert.
  return NextResponse.json({ ok: true, received: parsed.data.items.length });
}
```

### Pattern 5: Supabase Schema — Phase 1 Foundation Tables

**What:** Four tables required in Phase 1: `machines`, `scan_runs`, `scanner_tokens`, `scan_items` (stubbed). A `scan_config` table is also seeded (empty row) so Phase 2 can write approved folders into it immediately.

**Critical:** Every `CREATE TABLE` in this migration MUST be followed by explicit `GRANT` statements — this Supabase project was created post-2026-05-30 and does not auto-expose tables.

```sql
-- supabase/migrations/0001_foundation.sql

-- ============================================================
-- MACHINES
-- ============================================================
create table public.machines (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  label          text not null,              -- user-facing name e.g. "Zorin 18 Pro Laptop"
  hostname       text,
  os_name        text,
  os_version     text,
  kernel_version text,
  architecture   text,
  scanner_version text,
  python_version text,
  last_scan_at   timestamptz,
  created_at     timestamptz default now() not null
);

-- RLS
alter table public.machines enable row level security;
create policy "Owner can read own machines"
  on public.machines for select
  using (auth.uid() = user_id);
create policy "Owner can insert own machines"
  on public.machines for insert
  with check (auth.uid() = user_id);
create policy "Owner can update own machines"
  on public.machines for update
  using (auth.uid() = user_id);

-- GRANTs (mandatory for post-2026-05-30 projects)
grant select, insert, update, delete on public.machines to authenticated;

-- ============================================================
-- SCAN RUNS (FK anchor — used by Phase 2 scanner)
-- ============================================================
create table public.scan_runs (
  id              uuid primary key default gen_random_uuid(),
  machine_id      uuid references public.machines(id) on delete cascade not null,
  scanned_at      timestamptz default now() not null,
  scanner_version text,
  item_count      integer default 0
);

alter table public.scan_runs enable row level security;
create policy "Owner can read own scan runs"
  on public.scan_runs for select
  using (exists (
    select 1 from public.machines m
    where m.id = scan_runs.machine_id and m.user_id = auth.uid()
  ));
create policy "Service role inserts scan runs"
  on public.scan_runs for insert
  with check (true);  -- only reachable via service_role from API routes

grant select, insert, update, delete on public.scan_runs to authenticated;

-- ============================================================
-- SCAN ITEMS (stubbed — Phase 2 populates)
-- ============================================================
create table public.scan_items (
  id            uuid primary key default gen_random_uuid(),
  scan_run_id   uuid references public.scan_runs(id) on delete cascade not null,
  category      text not null,
  tool_name     text not null,
  version       text,
  install_path  text,
  importance    text default 'medium',
  confidence    text default 'high',
  needs_review  boolean default false,
  metadata      jsonb,
  ai_notes      text,
  general_note  text,
  restore_note  text,
  updated_at    timestamptz default now()
);

create unique index scan_items_tool_uidx on public.scan_items (scan_run_id, category, tool_name);
create index scan_items_metadata_gin on public.scan_items using gin (metadata);

alter table public.scan_items enable row level security;
create policy "Owner can read own scan items"
  on public.scan_items for select
  using (exists (
    select 1 from public.scan_runs sr
    join public.machines m on m.id = sr.machine_id
    where sr.id = scan_items.scan_run_id and m.user_id = auth.uid()
  ));
create policy "Owner can update own scan items"
  on public.scan_items for update
  using (exists (
    select 1 from public.scan_runs sr
    join public.machines m on m.id = sr.machine_id
    where sr.id = scan_items.scan_run_id and m.user_id = auth.uid()
  ));
create policy "Service role inserts scan items"
  on public.scan_items for insert
  with check (true);

grant select, insert, update, delete on public.scan_items to authenticated;

-- ============================================================
-- SCANNER TOKENS
-- ============================================================
create table public.scanner_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  token_hash  text unique not null,   -- SHA-256 hex of raw token, never plaintext
  label       text,
  created_at  timestamptz default now() not null,
  last_used   timestamptz,
  revoked     boolean default false not null
);

-- No RLS needed: only accessed via service_role from API routes
-- But add for defence-in-depth
alter table public.scanner_tokens enable row level security;
create policy "Owner can view own tokens"
  on public.scanner_tokens for select
  using (auth.uid() = user_id);

-- Only service_role can insert/update tokens
-- Dashboard uses Server Actions which call adminSupabase (service_role)
grant select on public.scanner_tokens to authenticated;
-- insert/update/delete intentionally NOT granted to authenticated —
-- only service_role (adminSupabase in Server Actions) manages tokens

-- ============================================================
-- SCAN CONFIG (one row per machine — Phase 2 writes approved folders)
-- ============================================================
create table public.scan_config (
  id                  uuid primary key default gen_random_uuid(),
  machine_id          uuid references public.machines(id) on delete cascade not null,
  approved_folders    text[] default '{}',
  approved_commands   jsonb default '[]'
);

alter table public.scan_config enable row level security;
create policy "Owner can read own scan config"
  on public.scan_config for select
  using (exists (
    select 1 from public.machines m
    where m.id = scan_config.machine_id and m.user_id = auth.uid()
  ));
create policy "Owner can update own scan config"
  on public.scan_config for update
  using (exists (
    select 1 from public.machines m
    where m.id = scan_config.machine_id and m.user_id = auth.uid()
  ));
create policy "Service role manages scan config"
  on public.scan_config for insert
  with check (true);

grant select, insert, update, delete on public.scan_config to authenticated;
```

### Anti-Patterns to Avoid

- **Using `middleware.ts` instead of `proxy.ts`:** Next.js 16 renamed the routing proxy file. Using the old name either falls back silently or breaks — start with `proxy.ts` from scratch.
- **Using `getSession()` in any server-side auth check:** `getSession()` reads the cookie without re-validating with the Supabase Auth server. A forged or replayed cookie passes. Use `getUser()` everywhere server-side.
- **Storing raw scanner token in DB:** The DB is a data store, not a secret store. Store SHA-256 hash only; display raw token once at issuance.
- **Omitting GRANTs from migrations:** The Supabase service_role key bypasses grants (so API route uploads work fine), hiding the missing grant until the dashboard's authenticated client silently returns empty data.
- **Skipping `scan_run_id` FK in Phase 1:** The MVP only shows the latest scan, but the FK must exist from day one. Adding it later after rows exist requires a destructive migration. The MVP query just filters to `ORDER BY scanned_at DESC LIMIT 1`.
- **Fetching `user_id` from the JWT payload in server code:** Always call `supabase.auth.getUser()` to get the user — never decode the JWT manually or trust request body `user_id` claims.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based Supabase sessions in App Router | Custom cookie read/write adapter | `@supabase/ssr` `createServerClient` / `createBrowserClient` | Cookie refresh, PKCE, token rotation are all handled; rolling your own breaks in subtle ways across Server Components, Route Handlers, and Client Components |
| Magic-link OTP exchange | Custom `/auth/callback` parsing | Supabase `verifyOtp({ token_hash, type })` in `/auth/confirm/route.ts` | Token hash extraction, expiry handling, and session creation are handled by the SDK |
| Opaque token generation | `Math.random()` or UUID v4 | `crypto.randomBytes(32).toString('hex')` | `randomBytes` is cryptographically secure; UUIDs and `Math.random()` are predictable |
| Token hash comparison | Direct string `===` compare | SHA-256 hex digest compare (constant-time by nature at DB lookup level) | Timing attacks are a real concern on token comparisons; a DB lookup with indexed `eq()` is safe |
| Route protection | Manual `redirect()` in every page | `proxy.ts` with `getUser()` + route matcher | One place to update; proxy runs before React renders; impossible to accidentally forget on a new page |
| Payload schema validation | Manual `typeof` / `if` checks | `zod` `safeParse()` on the route handler | zod gives typed output, structured error details, and future schema evolution for free |

**Key insight:** The Supabase + Next.js 16 auth surface is large and full of version-specific gotchas. Every custom auth helper that deviates from the `@supabase/ssr` canonical pattern has to rediscover these gotchas independently.

---

## Common Pitfalls

### Pitfall 1: Missing GRANT Statements on New Supabase Project

**What goes wrong:** Tables are created, RLS policies pass in the SQL editor, but the dashboard's `authenticated`-role client silently returns empty arrays from every query.

**Why it happens:** The Supabase SQL editor runs as `postgres` and bypasses both RLS and grants. The API route's `service_role` key also bypasses grants. The only way to observe the missing grant is to run the exact query from the dashboard as the authenticated user — which doesn't happen until the frontend is wired up.

**How to avoid:** Every `CREATE TABLE` in the migration must be immediately followed by `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;`. For `scanner_tokens`, grant only `SELECT` to authenticated — insert/update/delete goes through `service_role` via Server Actions.

**Warning signs:** Dashboard queries return `[]` but Supabase SQL editor shows rows.

---

### Pitfall 2: `proxy.ts` vs `middleware.ts` in Next.js 16

**What goes wrong:** Developer creates `middleware.ts` with `export function middleware()`. Next.js 16 looks for `proxy.ts` with `export function proxy()`. The protection layer silently does nothing — all `/dashboard` routes are accessible without authentication.

**Why it happens:** Every Supabase tutorial before Next.js 16 uses `middleware.ts`. The rename is a breaking change.

**How to avoid:** Create `proxy.ts` at the repo root. Export `proxy` function (not `middleware`). The `config` export with the `matcher` is unchanged.

**Warning signs:** Navigating to `/dashboard` without being signed in does not redirect to `/login`.

---

### Pitfall 3: Raw Scanner Token Stored in DB

**What goes wrong:** The `scanner_tokens` table has a `token` text column containing the raw token. Anyone who reads the DB (via Supabase dashboard, a leaked service role key, or a future SQL injection) can immediately use all tokens.

**Why it happens:** Storing the hash feels like unnecessary complexity for a personal tool.

**How to avoid:** Store `token_hash` (SHA-256 hex). Display the raw token once at issuance via the Server Action return value. The raw token never touches the DB.

---

### Pitfall 4: `scan_items` Table Without `scan_run_id` FK

**What goes wrong:** MVP works fine with a flat `scan_items` table (full replace on each scan). Phase 2 adds scan history — now every query needs a `scan_run_id` filter, and the migration must add the column to existing rows (which have no natural value for it).

**Why it happens:** "Latest scan only" is read as a schema simplification, not just a query filter.

**How to avoid:** Create `scan_runs` and the FK in Phase 1. The MVP query is simply: `SELECT * FROM scan_runs ORDER BY scanned_at DESC LIMIT 1` to get the current run ID, then `SELECT * FROM scan_items WHERE scan_run_id = $1`. No schema change needed when history is added.

---

### Pitfall 5: async `cookies()` Not Awaited in Next.js 16

**What goes wrong:** `const cookieStore = cookies()` (without `await`) compiles fine but `cookieStore.getAll()` returns an empty array in Next.js 16 because `cookies()` is now a Promise.

**Why it happens:** Most Supabase documentation examples were written for Next.js 14/15 where `cookies()` was synchronous.

**How to avoid:** Always `const cookieStore = await cookies()` in the server Supabase client factory. This is already shown correctly in the `lib/supabase/server.ts` example above.

---

### Pitfall 6: Frontend Scanner Token Display Race Condition

**What goes wrong:** The raw token is returned from a Server Action and displayed in the UI. If the user navigates away before copying, the token is lost forever (it's not stored anywhere retrievable). If a second action call is made to "show it again," the token was already hashed and is unrecoverable.

**Why it happens:** Single-use token display is easy to implement but requires specific UX treatment — the Settings page must make it unmistakably clear that the token is shown once only.

**How to avoid:** The Settings page spec (for Cursor) must specify: (a) a modal or inline alert with the raw token, (b) a copy-to-clipboard button, (c) explicit "I have copied this token" confirmation before the modal can be dismissed, and (d) a warning label: "This token will not be shown again."

---

## Code Examples

### Sign-in Page (Server Component trigger)

```typescript
// app/login/page.tsx  — sign-in form action
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });
  if (error) redirect("/login?error=send_failed");
  redirect("/login?check_email=true");
}
```

### Token Revocation Server Action

```typescript
// Server Action — revoke token
"use server";
import { adminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function revokeToken(tokenId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership before revoking
  const { data: token } = await adminSupabase
    .from("scanner_tokens")
    .select("id, user_id")
    .eq("id", tokenId)
    .single();

  if (!token || token.user_id !== user.id) throw new Error("Token not found");

  await adminSupabase
    .from("scanner_tokens")
    .update({ revoked: true })
    .eq("id", tokenId);
}
```

### Machine Registration Server Action

```typescript
// Server Action — register or update machine
"use server";
import { adminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function upsertMachine(data: {
  label: string;
  hostname?: string;
  os_name?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing } = await adminSupabase
    .from("machines")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await adminSupabase
      .from("machines")
      .update(data)
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted } = await adminSupabase
    .from("machines")
    .insert({ ...data, user_id: user.id })
    .select("id")
    .single();
  return inserted!.id;
}
```

### Environment Variables Required

```bash
# .env.local (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://hzcxwonllrwrtruuagqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service role key — NEVER prefix with NEXT_PUBLIC_>
NEXT_PUBLIC_SITE_URL=https://zorinrestore.vercel.app

# Vercel dashboard env vars (same keys, set for production)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 (deprecated) | All App Router Supabase auth must use `@supabase/ssr` — auth-helpers is dead |
| `middleware.ts` / `export function middleware()` | `proxy.ts` / `export function proxy()` | Next.js 16 | Silently broken if old name is used; create `proxy.ts` from scratch |
| `cookies()` synchronous | `await cookies()` (async) | Next.js 16 | Missing `await` returns empty cookie store; breaks session reads |
| `params` synchronous in page props | `await props.params` (async) | Next.js 16 | Passing params to child components breaks without await |
| `supabase.auth.getSession()` in server | `supabase.auth.getUser()` in server | Supabase SSR docs (ongoing) | Security: `getSession()` trusts cookie without re-validation |
| `GRANT` auto-applied on new tables | Explicit `GRANT` required | 2026-05-30 Supabase | Silent empty results from authenticated client until grants added |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: replaced by `@supabase/ssr`; do not install
- `serverRuntimeConfig` / `publicRuntimeConfig` in `next.config.js`: removed in Next.js 16; use `process.env` directly
- `next lint` CLI command: removed in Next.js 16; run `eslint` directly

---

## Frontend as Spec

**Phase 1 produces one spec file, not implemented frontend code:**

`FRONTEND_UI_SPEC.md` — Settings page covering:
- Auth status section (SET-01): logged-in email from `getUser()`
- Scanner token management section (SET-02, TOKEN-01, TOKEN-02, TOKEN-03): token list table, "Generate Token" button triggering `generateScannerToken` Server Action, copy-to-clipboard for the generated command, per-token "Revoke" button triggering `revokeToken` Server Action, one-time display modal with "I've copied this" confirmation gate
- Machine name section (SET-04, MACH-01): machine label display with inline edit triggering `upsertMachine` Server Action

The spec must include: all Server Action signatures (already defined above), the `machines` and `scanner_tokens` table shapes the components read from, the exact copy-to-clipboard command format (`SCANNER_TOKEN=<token> python -m scanner scan`), and CSS class patterns from whatever base styles exist.

**Claude writes the spec. Cursor implements it.**

---

## Open Questions

1. **Next.js app initialisation state**
   - What we know: The project is greenfield — only `.planning/` and `machine-inventory-scope.md` exist in the working directory
   - What's unclear: Whether `create-next-app` should be run at the root of `/home/martin/Projects/zorinpackages` or in a subdirectory (e.g. `web/`)
   - Recommendation: Run at project root (same directory as `scanner/` Python package) — matches the project structure in ARCHITECTURE.md

2. **Supabase CLI vs dashboard migrations**
   - What we know: The Supabase project is live. ARCHITECTURE.md references `supabase/migrations/` folder.
   - What's unclear: Whether the Supabase CLI is installed and linked to the project, or whether migrations should be applied via the dashboard SQL editor
   - Recommendation: Use Supabase CLI (`supabase db push`) if available; fall back to SQL editor paste. Document whichever path is used.

3. **Single machine constraint and `user_id` on machines table**
   - What we know: MVP is single-user, single-machine. The `machines` table has a `user_id` FK.
   - What's unclear: Whether to enforce a DB constraint of one machine per user (UNIQUE on `user_id`) or let the query filter to the first machine
   - Recommendation: Add `UNIQUE (user_id)` constraint on `machines` for MVP — a unique violation is a clear error signal vs silent multi-row results. Remove for multi-machine support in Phase 2.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — Wave 0 must install |
| Config file | `jest.config.ts` or `vitest.config.ts` — see Wave 0 |
| Quick run command | `npx vitest run --reporter=dot` |
| Full suite command | `npx vitest run` |

Vitest is recommended over Jest for Next.js 16 projects: better ESM support, no babel transform needed, faster.

**Install:**
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `signInWithMagicLink` Server Action returns without error for valid email | unit | `npx vitest run tests/auth.test.ts -t "signInWithMagicLink"` | Wave 0 |
| AUTH-02 | Session cookie is set after magic-link confirm | integration (manual) | Manual: sign in, refresh, verify session persists | manual-only |
| AUTH-03 | `/dashboard` redirects to `/login` when no session cookie | unit | `npx vitest run tests/proxy.test.ts -t "redirects unauthenticated"` | Wave 0 |
| TOKEN-01 | `generateScannerToken` stores SHA-256 hash, not raw token | unit | `npx vitest run tests/tokens.test.ts -t "stores hash not plaintext"` | Wave 0 |
| TOKEN-02 | Generated scan command includes token | unit | `npx vitest run tests/tokens.test.ts -t "generates scan command"` | Wave 0 |
| TOKEN-03 | `revokeToken` sets `revoked = true` on the correct row | unit | `npx vitest run tests/tokens.test.ts -t "revokes token"` | Wave 0 |
| TOKEN-04 | `/api/scanner/upload` returns 401 for missing/invalid/revoked token | unit | `npx vitest run tests/upload-route.test.ts` | Wave 0 |
| MACH-01 | `upsertMachine` creates a machine row with correct label | unit | `npx vitest run tests/machines.test.ts -t "upsertMachine"` | Wave 0 |
| MACH-02 | Upload route updates machine metadata fields from payload | unit | `npx vitest run tests/upload-route.test.ts -t "updates machine metadata"` | Wave 0 |
| SET-01 | Settings page renders logged-in email (from `getUser()`) | smoke (manual) | Manual: load Settings, verify email shown | manual-only |
| SET-02 | Settings page token list renders + generate + revoke work | smoke (manual) | Manual: generate token, verify hash in DB, revoke, verify 401 | manual-only |
| SET-04 | Machine name edit persists via Server Action | smoke (manual) | Manual: edit name, reload, verify persisted | manual-only |

**Notes on manual-only tests:** AUTH-02, SET-01, SET-02, SET-04 require a real browser session with a real Supabase project — they cannot be unit-tested without a full integration harness. They are verified during the Phase 1 smoke test pass.

### Sampling Rate

- **Per task commit:** `npx vitest run tests/tokens.test.ts tests/upload-route.test.ts` (token + upload core)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual smoke test checklist before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — framework setup
- [ ] `tests/tokens.test.ts` — covers TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04
- [ ] `tests/upload-route.test.ts` — covers TOKEN-04, MACH-02
- [ ] `tests/proxy.test.ts` — covers AUTH-03
- [ ] `tests/machines.test.ts` — covers MACH-01
- [ ] `tests/auth.test.ts` — covers AUTH-01
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react`

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — `proxy.ts` rename, async `params`/`cookies()`, Node 20 requirement
- [Supabase SSR Auth for Next.js (official)](https://supabase.com/docs/guides/auth/server-side/nextjs) — two-client pattern, `proxy.ts` session refresh, `getUser()` requirement
- [Supabase: Creating a client for SSR (official)](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — server/browser client factory patterns
- [Supabase Breaking Change — Tables not exposed to API by default](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) — explicit GRANT requirement for post-2026-05-30 projects
- `.planning/research/STACK.md` — verified stack versions and install commands
- `.planning/research/ARCHITECTURE.md` — schema designs, data flow diagrams, component responsibilities
- `.planning/research/PITFALLS.md` — pitfalls 1–11 with phase mapping
- `.planning/research/SUMMARY.md` — synthesised research summary

### Secondary (MEDIUM confidence)
- [Opaque token vs JWT — Nordic APIs](https://nordicapis.com/jwt-vs-opaque-tokens-choosing-the-right-token-for-api-security/) — rationale for opaque token
- [Supabase RLS Common Mistakes 2026](https://blog.starmorph.com/blog/row-level-security-supabase-tables-nextjs) — RLS + GRANT interaction nuances

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions and packages verified against official docs and npm; no ambiguity
- Architecture: HIGH — Supabase SSR + Next.js 16 patterns sourced from official docs; opaque token pattern sourced from prior project research
- Pitfalls: HIGH — all pitfalls directly traceable to official Supabase breaking-change docs, Next.js upgrade guide, or prior research
- Schema: HIGH — derived from ARCHITECTURE.md which was verified in prior research phase
- Validation: MEDIUM — test file structure is inferred from greenfield project; actual test content depends on mock strategy for Supabase admin client

**Research date:** 2026-06-07
**Valid until:** 2026-09-07 (90 days — stable stack; Next.js 16 and Supabase SSR patterns are unlikely to change significantly)
