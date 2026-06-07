---
phase: 03-dashboard
plan: "04"
subsystem: api
tags: [nextjs, supabase, route-handler, export, markdown, json, vitest, tdd]

# Dependency graph
requires:
  - phase: 03-dashboard
    plan: "01"
    provides: RED test stubs in tests/export-route.test.ts; scan_items query patterns from research doc
  - phase: 03-dashboard
    plan: "02"
    provides: createClient mock pattern (vi.fn + mockResolvedValueOnce per-test override in beforeEach)
provides:
  - app/api/export/markdown/route.ts — GET handler generating machine-inventory.md download
  - app/api/export/json/route.ts — GET handler generating machine-inventory.json download
  - Both routes: auth guard, latest-scan query pattern, include_ignored=true support
affects: [EXPORT_UI_SPEC, any future export enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Export routes use bare new Response() for file downloads, NextResponse.json() only for 401 error"
    - "URL fallback: request.nextUrl?.searchParams ?? new URL(request.url).searchParams — works in both NextRequest (production) and plain Request (JSDOM test env)"
    - "Array.prototype.reduce for category grouping — safe across all Node versions (Object.groupBy not used)"
    - "Latest-scan triple-query: machine → scan_runs order scanned_at desc limit 1 → scan_items eq scan_run_id"

key-files:
  created:
    - app/api/export/markdown/route.ts
    - app/api/export/json/route.ts
  modified:
    - tests/export-route.test.ts

key-decisions:
  - "URL fallback pattern (nextUrl?.searchParams ?? new URL(request.url).searchParams) used instead of request.nextUrl directly — NextRequest.nextUrl is undefined in JSDOM/plain Request test environment"
  - "When include_ignored=false (default), .neq('importance','Ignore') filter applied at DB query level — avoids fetching then discarding rows"
  - "When include_ignored=true, all items fetched then split in JS — single DB round-trip with client-side partition"

patterns-established:
  - "Export route auth: same getUser() gate → 401 JSON pattern as all other authenticated routes"
  - "File download response: new Response(content, { headers: { Content-Type, Content-Disposition: attachment } })"

requirements-completed: [EXP-01, EXP-02, EXP-03, EXP-04]

# Metrics
duration: 2min
completed: 2026-06-07
---

# Phase 3 Plan 04: Export API Routes Summary

**Two Next.js 16 GET route handlers that stream machine-inventory.md and machine-inventory.json file downloads, with auth guard, latest-scan query, and ?include_ignored=true split — all 10 tests GREEN**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-07T21:09:08Z
- **Completed:** 2026-06-07T21:11:14Z
- **Tasks:** 2 (RED + GREEN per TDD)
- **Files modified:** 3

## Accomplishments
- Expanded `tests/export-route.test.ts` from 2 basic stubs to 10 full assertions covering auth, Content-Type, Content-Disposition, body content, default exclusion of Ignore items, and ?include_ignored=true split behaviour
- Created `app/api/export/markdown/route.ts` — authenticated GET that resolves machine → latest scan_run → scan_items, groups by category alphabetically, appends ## Ignored Items section when requested
- Created `app/api/export/json/route.ts` — same query pattern, returns structured JSON with optional `ignored` array key only when ?include_ignored=true
- Full suite (48 tests, 11 files) confirmed GREEN — no regressions

## Task Commits

Each task was committed atomically:

1. **RED: Expand export route test stubs to full expectations** - `bd98f34` (test)
2. **GREEN: Implement export API routes** - `5c61672` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `tests/export-route.test.ts` - Full 10-test suite covering all EXP-01 through EXP-04 requirements
- `app/api/export/markdown/route.ts` - GET handler: 401 guard, machine/run/items query, markdown generation with category sections and optional Ignored Items section
- `app/api/export/json/route.ts` - GET handler: 401 guard, same query pattern, JSON output with optional `ignored` array

## Decisions Made
- URL fallback pattern (`request.nextUrl?.searchParams ?? new URL(request.url).searchParams`) applied to both routes after discovering `nextUrl` is undefined on plain `Request` objects in the JSDOM test environment — production NextRequest still works via the `nextUrl` path
- Default export filters at DB level with `.neq("importance", "Ignore")` — avoids unnecessary data transfer
- `include_ignored=true` fetches all then partitions in JS — one DB round-trip is simpler than two separate queries

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] URL searchParams fallback for JSDOM compatibility**
- **Found during:** GREEN phase (first test run)
- **Issue:** `request.nextUrl.searchParams` throws TypeError in tests because plain `Request` objects (used in test mocks as `new Request(url) as any`) do not have `.nextUrl` — this is a NextRequest-specific property
- **Fix:** Changed both routes to use `request.nextUrl?.searchParams ?? new URL(request.url).searchParams` so tests pass and production NextRequest continues to work via the primary path
- **Files modified:** `app/api/export/markdown/route.ts`, `app/api/export/json/route.ts`
- **Verification:** All 10 tests pass; the fix is transparent to the production code path
- **Committed in:** `5c61672` (GREEN task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix required for test correctness; no functional change in production.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both export routes fully implemented and tested
- EXP-01 through EXP-04 requirements complete
- Ready for EXPORT_UI_SPEC.md (Cursor implements the export page with download links)

---
*Phase: 03-dashboard*
*Completed: 2026-06-07*

## Self-Check: PASSED
- app/api/export/markdown/route.ts: FOUND
- app/api/export/json/route.ts: FOUND
- tests/export-route.test.ts: FOUND
- .planning/phases/03-dashboard/03-04-SUMMARY.md: FOUND
- Commit bd98f34 (RED tests): FOUND
- Commit 5c61672 (GREEN implementation): FOUND
