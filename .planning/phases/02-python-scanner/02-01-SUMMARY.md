---
phase: 02-python-scanner
plan: "01"
subsystem: api
tags: [supabase, typescript, vitest, tdd, scanner, server-actions]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Scanner token infrastructure, adminSupabase client, upload route stub, scan_config schema

provides:
  - validateScannerToken returning { valid, tokenId, userId } (extended from Phase 1)
  - POST /api/scanner/upload writing machines + scan_runs + scan_items to Supabase
  - GET /api/scanner/config returning approved_folders/approved_commands for authenticated scanner
  - addApprovedFolder and removeApprovedFolder Server Actions managing scan_config rows

affects: [02-python-scanner, 03-settings-ui, scanner-package]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Top-level vi.mock + vi.mocked().mockResolvedValueOnce() pattern for per-test override without hoisting issues
    - Token mock pattern: mock @/lib/tokens at top level, override per test — avoids nested vi.mock hoisting problems
    - Route uses userId from token validation (not tokenId) for DB FK lookups
    - scan_config upsert uses onConflict machine_id — read-then-write pattern for deduplication

key-files:
  created:
    - app/api/scanner/config/route.ts
    - lib/actions/scan-config.ts
    - tests/scanner-config-route.test.ts
    - tests/scan-config.test.ts
  modified:
    - lib/tokens.ts
    - app/api/scanner/upload/route.ts
    - tests/upload-route.test.ts

key-decisions:
  - "Top-level vi.mock + mockResolvedValueOnce pattern used: nested vi.mock in beforeEach is hoisted by vitest causing all tests to use the same mock — top-level declaration with per-test overrides is the correct pattern"
  - "addApprovedFolder uses read-then-upsert (not array_append SQL) for deduplication clarity in TypeScript"
  - "removeApprovedFolder uses upsert (not update) to match addApprovedFolder pattern and handle missing rows gracefully"

patterns-established:
  - "Token mock pattern: vi.mock('@/lib/tokens') at top level, vi.mocked(validateScannerToken).mockResolvedValueOnce() per test"
  - "Admin Supabase mock pattern: vi.mock('@/lib/supabase/admin') with table-switch factory, mockImplementationOnce() for per-test overrides"

requirements-completed: [MACH-03, FLDR-01, FLDR-02, FLDR-03, SCAN-06]

# Metrics
duration: 3min
completed: 2026-06-07
---

# Phase 2 Plan 01: Server Prerequisites Summary

**Upload route fully wired to three Supabase tables (machines + scan_runs + scan_items), config endpoint serving approved_folders, and Server Actions for folder management — all TDD with 24/24 tests green**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-07T15:31:02Z
- **Completed:** 2026-06-07T15:34:51Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Extended `validateScannerToken` to return `userId` alongside `valid` and `tokenId`
- Replaced Phase 1 upload stub with full DB writes: machine upsert (onConflict user_id), scan_run insert, scan_items upsert (onConflict scan_run_id,category,tool_name)
- Created `GET /api/scanner/config` endpoint returning approved_folders and approved_commands for the authenticated scanner token's machine
- Created `addApprovedFolder` and `removeApprovedFolder` Server Actions with path validation and deduplication

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — upload-route failing tests** - `9cfb455` (test)
2. **Task 1: GREEN — extend validateScannerToken + complete upload route** - `09c87e3` (feat)
3. **Task 2: RED — scanner-config-route and scan-config failing tests** - `3af92cd` (test)
4. **Task 2: GREEN — scanner config endpoint and scan-config Server Actions** - `d555b4f` (feat)

**Plan metadata:** (docs commit — created after this summary)

_Note: TDD tasks produce two commits each (test RED → feat GREEN)_

## Files Created/Modified
- `lib/tokens.ts` — Added `user_id` to select, returns `userId` in result
- `app/api/scanner/upload/route.ts` — Full DB write implementation replacing Phase 1 stub
- `tests/upload-route.test.ts` — Replaced hardcoded-fail stub test with 5 real tests
- `app/api/scanner/config/route.ts` — New GET endpoint for scanner config
- `lib/actions/scan-config.ts` — New Server Actions: addApprovedFolder, removeApprovedFolder
- `tests/scanner-config-route.test.ts` — 3 tests for config route (401, empty, data)
- `tests/scan-config.test.ts` — 5 tests for scan-config actions (validation, upsert, remove)

## Decisions Made
- Nested `vi.mock` inside `beforeEach` is hoisted by vitest and affects all tests in the file — fixed by moving mocks to top level and using `mockResolvedValueOnce` for per-test overrides. This pattern is now the established project convention.
- `addApprovedFolder` uses a read-then-upsert approach (select existing → deduplicate in TypeScript → upsert full array) rather than SQL `array_append` for explicitness and testability.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock hoisting issue in test file**
- **Found during:** Task 1 (GREEN phase, test run)
- **Issue:** `vi.mock` calls inside `beforeEach` are hoisted by vitest to file top level, causing the `@/lib/tokens` mock (with `valid: true`) to apply to the 401 tests as well
- **Fix:** Moved all `vi.mock` declarations to file top level; used `vi.mocked(validateScannerToken).mockResolvedValueOnce()` for per-test control
- **Files modified:** `tests/upload-route.test.ts`
- **Verification:** All 5 tests pass including both 401 tests
- **Committed in:** `09c87e3` (part of Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug — vitest mock hoisting)
**Impact on plan:** Necessary fix for correct test isolation. No scope creep.

## Issues Encountered
- vitest hoists `vi.mock` calls even when nested inside `beforeEach` or `describe` — they execute before any tests run. This is a known vitest behavior documented in their migration guide. Fixed by restructuring tests to use top-level mocks with per-test `mockResolvedValueOnce` overrides.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Server now fully accepts scanner uploads and persists data
- Config endpoint ready for Python scanner to call before each scan
- Settings UI can call `addApprovedFolder` / `removeApprovedFolder` Server Actions
- Python scanner package (02-02) can target these endpoints

---
*Phase: 02-python-scanner*
*Completed: 2026-06-07*

## Self-Check: PASSED

All created files found on disk. All 4 task commits verified in git history.
