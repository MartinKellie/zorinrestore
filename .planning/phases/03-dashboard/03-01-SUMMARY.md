---
phase: 03-dashboard
plan: "01"
subsystem: database
tags: [supabase, postgres, rls, vitest, tdd, migrations]

# Dependency graph
requires:
  - phase: 02-python-scanner
    provides: scan_items table with existing schema; vitest test infrastructure with setup.ts mock patterns
  - phase: 01-foundation
    provides: 0001_foundation.sql baseline schema; Supabase client helpers; dynamic import() RED stub pattern
provides:
  - supabase/migrations/0003_dashboard.sql with secret_reminders table, has_secret_dep column, importance normalisation
  - RED test stubs for all Phase 3 Server Actions (inventory, review, secrets, export routes)
affects: [03-02, 03-03, 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dynamic import() in test stubs for natural RED state (module-not-found) without explicit fail hacks"
    - "Post-2026-05-30 Supabase projects require explicit GRANT on every new table"

key-files:
  created:
    - supabase/migrations/0003_dashboard.sql
    - tests/inventory.test.ts
    - tests/review.test.ts
    - tests/secrets.test.ts
    - tests/export-route.test.ts
  modified: []

key-decisions:
  - "secret_reminders uses plain CREATE TABLE (not IF NOT EXISTS) — migrations run exactly once"
  - "GRANT only on new secret_reminders table — scan_items already GRANT-ed in 0001_foundation.sql"
  - "importance backfill UPDATE included in same migration as default change to avoid inconsistent data"
  - "Test stubs use dynamic import() (same pattern as tokens.test.ts) for natural module-not-found RED state"

patterns-established:
  - "Phase 3 test stubs: dynamic import() inside each it() block — module resolved at test time, not file load"
  - "createClient mock override per-test: vi.mocked(createClient).mockResolvedValueOnce() — setup.ts provides default null user"

requirements-completed: [INV-06, INV-07, INV-08, REVQ-02, SEC-02, SEC-03, EXP-01, EXP-02]

# Metrics
duration: 2min
completed: 2026-06-07
---

# Phase 3 Plan 01: Schema Foundation and RED Test Stubs Summary

**Supabase migration 0003 adds secret_reminders table with RLS + GRANT, has_secret_dep column on scan_items, and importance normalisation; four RED vitest stubs establish failing baselines for all Phase 3 Server Actions and export routes**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-07T20:58:03Z
- **Completed:** 2026-06-07T20:59:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `0003_dashboard.sql` extending the schema with secret_reminders table (RLS + explicit GRANT), has_secret_dep boolean column on scan_items, and importance default normalisation with backfill UPDATE
- Created 4 test stub files (inventory, review, secrets, export-route) all failing RED with module-not-found — correct Wave 0 baseline for plans 03-02/03/04
- Confirmed 13 existing passing tests (tokens, upload-route, proxy) remain green — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 0003 — secret_reminders table + scan_items extensions** - `0dbb0c4` (feat)
2. **Task 2: RED test stubs for all Phase 3 Server Actions and export routes** - `707f89a` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `supabase/migrations/0003_dashboard.sql` - Schema extension: has_secret_dep column, importance normalisation + backfill, secret_reminders table with RLS and GRANT
- `tests/inventory.test.ts` - RED stubs for INV-06 (updateItemImportance), INV-07/INV-08 (updateItemNotes)
- `tests/review.test.ts` - RED stubs for REVQ-02 (classifyReviewItem)
- `tests/secrets.test.ts` - RED stubs for SEC-02 (addSecretReminder), SEC-03 (flagSecretDep)
- `tests/export-route.test.ts` - RED stubs for EXP-01/EXP-02 (export route 401 auth guards)

## Decisions Made
- `secret_reminders` uses plain `CREATE TABLE` (not `IF NOT EXISTS`) — migrations run exactly once; the plan explicitly specifies this
- GRANT applied only to `secret_reminders` (new table) — `scan_items` already has GRANT in `0001_foundation.sql`; duplicate grants avoided
- Importance backfill UPDATE placed in same migration as the default change to prevent data inconsistency window
- Dynamic import() pattern (same as tokens.test.ts) used for test stubs — natural module-not-found RED state without explicit `throw` hacks

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Migration 0003 will be applied when `supabase db push` or `supabase migration up` is run in Phase 3 deployment.

## Next Phase Readiness
- Schema foundation complete: `secret_reminders` table and `has_secret_dep` column ready for Server Action implementation
- All 4 RED test stubs in place: plans 03-02, 03-03, 03-04 have their failing baselines to turn GREEN
- Existing test suite (13 tests) confirmed green — no regressions from this plan

---
*Phase: 03-dashboard*
*Completed: 2026-06-07*
