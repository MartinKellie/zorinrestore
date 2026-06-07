---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [nextjs, supabase, typescript, tailwind, postgresql, rls]

# Dependency graph
requires: []
provides:
  - Next.js 16.2.7 app scaffold with TypeScript App Router and Tailwind CSS v4
  - supabase/migrations/0001_foundation.sql with all 5 Phase 1 tables and explicit GRANTs
  - lib/supabase/server.ts: async SSR createClient using await cookies()
  - lib/supabase/client.ts: browser createBrowserClient
  - lib/supabase/admin.ts: service-role adminSupabase (server-only)
  - .env.local.example with all required environment variable templates
affects: [01-02, 01-03, 01-04, all subsequent plans]

# Tech tracking
tech-stack:
  added:
    - next@16.2.7 (App Router, Turbopack)
    - react@19, react-dom@19
    - @supabase/supabase-js@2.x
    - "@supabase/ssr@0.x"
    - zod
    - tailwindcss@4
    - "@tailwindcss/postcss@4"
  patterns:
    - "Two-client Supabase pattern: server.ts (SSR) + client.ts (browser) + admin.ts (service-role)"
    - "Post-2026-05-30 Supabase: every table requires explicit GRANT to anon/authenticated"
    - "scan_items linked to scan_runs via FK (not flat) from day one"
    - "Next.js 16 async cookies() — must await cookieStore"

key-files:
  created:
    - package.json
    - next.config.ts
    - tsconfig.json
    - postcss.config.mjs
    - app/layout.tsx
    - app/page.tsx
    - app/globals.css
    - next-env.d.ts
    - .env.local.example
    - supabase/migrations/0001_foundation.sql
    - lib/supabase/server.ts
    - lib/supabase/client.ts
    - lib/supabase/admin.ts
  modified:
    - package.json (was minimal placeholder from 01-00)

key-decisions:
  - "Used manual scaffold instead of create-next-app due to existing .planning/ and package.json conflicts"
  - "Tailwind v4 with @tailwindcss/postcss plugin (not tailwind.config.js — v4 CSS-first config)"
  - "scanner_tokens: only SELECT granted to authenticated — insert/update/delete via service_role only"
  - "machines UNIQUE(user_id) enforces single-machine MVP at DB level"

patterns-established:
  - "Pattern 1: lib/supabase/server.ts uses async createClient() with await cookies() for Next.js 16"
  - "Pattern 2: lib/supabase/admin.ts import restricted to app/api/ and lib/actions/ only"
  - "Pattern 3: Every new Supabase table gets explicit GRANT immediately after CREATE TABLE"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, MACH-01, MACH-02, TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04]

# Metrics
duration: 3min
completed: 2026-06-07
---

# Phase 1 Plan 01: Foundation Summary

**Next.js 16 app scaffold + 5-table Supabase schema (machines, scan_runs, scan_items, scanner_tokens, scan_config) with RLS, explicit GRANTs, and three Supabase client utilities**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-07T08:39:23Z
- **Completed:** 2026-06-07T08:42:22Z
- **Tasks:** 2
- **Files modified:** 13 created, 1 modified

## Accomplishments
- Next.js 16.2.7 with TypeScript App Router, Tailwind CSS v4, and Turbopack dev server scaffolded manually at repo root
- Full Phase 1 Supabase schema migration written with all 5 tables, RLS policies, and explicit GRANTs (post-2026-05-30 project requirement)
- Three Supabase client utilities created: async SSR server client, browser client, and service-role admin client with import restrictions

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 app at repo root** - `444396e` (feat)
2. **Task 2: Write Supabase migration SQL and Supabase client utilities** - `e6ca44b` (feat)

**Plan metadata:** (created after this summary)

## Files Created/Modified
- `package.json` - Updated from placeholder to Next.js 16 app with all dependencies
- `next.config.ts` - Minimal NextConfig (TypeScript, not JS)
- `tsconfig.json` - Next.js 16 TypeScript config with @ alias to project root
- `postcss.config.mjs` - Tailwind v4 @tailwindcss/postcss plugin
- `app/layout.tsx` - Root layout with metadata and globals.css import
- `app/page.tsx` - Minimal home page placeholder
- `app/globals.css` - Tailwind v4 @import entry point
- `.env.local.example` - All 4 required env var templates
- `supabase/migrations/0001_foundation.sql` - Complete Phase 1 schema with 5 tables, RLS, GRANTs
- `lib/supabase/server.ts` - Async SSR createClient using await cookies()
- `lib/supabase/client.ts` - Browser createBrowserClient
- `lib/supabase/admin.ts` - Service-role adminSupabase with import restriction comment

## Decisions Made
- Used manual scaffold instead of `create-next-app` — the tool rejected the directory because `.planning/` and existing `package.json` were present. Wrote all files directly with identical structure.
- Tailwind v4 with `@tailwindcss/postcss` plugin — v4 no longer uses `tailwind.config.js`; configuration is CSS-first via `@import "tailwindcss"` in globals.css.
- Kept vitest devDependencies from plan 01-00 intact in package.json alongside Next.js deps.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Manual scaffold instead of create-next-app**
- **Found during:** Task 1 (scaffold)
- **Issue:** `npx create-next-app` rejected the directory — existing `.planning/`, `graphify-out/`, `machine-inventory-scope.md`, and `package.json` caused a "files that could conflict" error with no --force flag available
- **Fix:** Wrote all Next.js app scaffold files manually (package.json, next.config.ts, tsconfig.json, postcss.config.mjs, app/layout.tsx, app/page.tsx, app/globals.css) producing identical structure to what create-next-app would have generated
- **Files modified:** All Task 1 files listed above
- **Verification:** `npm run build` passed cleanly, static pages generated
- **Committed in:** 444396e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Zero functional difference — manual scaffold produces same output as create-next-app. No scope creep.

## Issues Encountered
- `create-next-app` does not support `--force` to overwrite existing files in non-empty directories. Resolved by writing files manually using the same structure create-next-app would produce.
- TypeScript check shows errors only in `tests/` files referencing modules not yet created (planned in 01-02 through 01-04). No errors in files created by this plan.

## User Setup Required

Before any Phase 1 plan can run end-to-end, the following external configuration is needed:

**Environment variables** — copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase Dashboard -> Project Settings -> API -> Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Dashboard -> Project Settings -> API -> anon public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard -> Project Settings -> API -> service_role key (secret)
- `NEXT_PUBLIC_SITE_URL` — set to `https://zorinrestore.vercel.app` (or `http://localhost:3000` locally)

**Apply migration SQL** — choose one:
- Option A: `npx supabase db push` (if Supabase CLI is installed and project linked)
- Option B: Paste `supabase/migrations/0001_foundation.sql` into Supabase Dashboard -> SQL Editor -> New query -> Run

**Enable magic-link auth** — Supabase Dashboard -> Authentication -> Providers -> Email -> Enable 'Enable Email OTP (Magic Link)'

**Set site URL** — Supabase Dashboard -> Authentication -> URL Configuration:
- Site URL: `https://zorinrestore.vercel.app`
- Redirect URLs: add `https://zorinrestore.vercel.app/auth/confirm`

## Next Phase Readiness
- App scaffold complete — all subsequent plans can add routes, components, and API handlers
- Schema migration ready to apply — machines, scan_runs, scan_items, scanner_tokens, scan_config tables
- Supabase client utilities ready for import in server components, client components, and API routes
- No blockers for 01-02 (auth routes) or 01-03 (scanner upload API)

---
*Phase: 01-foundation*
*Completed: 2026-06-07*
