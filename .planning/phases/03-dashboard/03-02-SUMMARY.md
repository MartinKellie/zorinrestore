---
phase: 03-dashboard
plan: "02"
subsystem: api
tags: [supabase, server-actions, zod, vitest, tdd, inventory]

# Dependency graph
requires:
  - phase: 03-dashboard/03-01
    provides: RED test stubs for inventory Server Actions; secret_reminders migration; setup.ts vitest mock infrastructure
  - phase: 01-foundation
    provides: adminSupabase client helper; createClient server helper; existing auth+write pattern in lib/actions/tokens.ts
provides:
  - lib/actions/inventory.ts with updateItemImportance and updateItemNotes Server Actions
  - Corrected setup.ts createClient mock as vi.fn() enabling per-test mockResolvedValueOnce overrides
affects: [03-03, 03-04, INVENTORY_UI_SPEC]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action auth+write pattern: ImportanceSchema/NotesSchema Zod validation → getUser() auth guard → RLS SELECT ownership check → adminSupabase write"
    - "beforeEach vi.mocked().mockReset() + mockResolvedValue() for reliable per-test isolation when module is cached across tests"
    - "setup.ts createClient mock as vi.fn() so per-test mockResolvedValueOnce overrides work — plain arrow function cannot be mocked per-test"

key-files:
  created:
    - lib/actions/inventory.ts
  modified:
    - tests/inventory.test.ts
    - tests/setup.ts

key-decisions:
  - "Validation (ImportanceSchema.safeParse) runs BEFORE getUser() auth check — invalid input rejected cheaply without a Supabase round-trip"
  - "updateItemNotes builds update payload dynamically — only provided fields plus updated_at are written, avoiding overwriting unset fields with undefined"
  - "setup.ts createClient mock changed from plain arrow to vi.fn() — enables mockResolvedValueOnce per-test overrides; affects all three Phase 3 test files (inventory, review, secrets)"
  - "beforeEach reset pattern (mockReset + mockResolvedValue default) added to inventory tests — prevents queued mocks from bleeding across tests when implementation returns early"

patterns-established:
  - "Phase 3 Server Action test: beforeEach mockReset + mockResolvedValue(null-user-default) + mockResolvedValueOnce(authenticatedClient) per-test"

requirements-completed: [INV-06, INV-07, INV-08]

# Metrics
duration: 5min
completed: 2026-06-07
---

# Phase 3 Plan 02: Inventory Server Actions Summary

**updateItemImportance and updateItemNotes Server Actions with Zod enum validation, RLS-respecting ownership check, and adminSupabase writes; 6 unit tests GREEN after fixing vi.fn() mock infrastructure in setup.ts**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-07T22:01:00Z
- **Completed:** 2026-06-07T22:04:00Z
- **Tasks:** 2 (RED verification + GREEN implementation)
- **Files modified:** 3

## Accomplishments
- Created `lib/actions/inventory.ts` implementing `updateItemImportance` (enum validation + auth guard + ownership check + adminSupabase update) and `updateItemNotes` (partial patch — only provided fields written)
- All 6 inventory unit tests GREEN: invalid importance, valid importance success, unauthenticated guard for both functions, general_note and restore_note persistence
- Fixed `tests/setup.ts` createClient mock from plain arrow function to `vi.fn()` so all Phase 3 test files can use `mockResolvedValueOnce` per-test overrides; 30 previously passing tests remain green

## Task Commits

Each task was committed atomically:

1. **GREEN: inventory.ts + test/mock fixes** - `0c32485` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `lib/actions/inventory.ts` - updateItemImportance and updateItemNotes Server Actions
- `tests/inventory.test.ts` - Updated with beforeEach mock reset pattern and authenticatedClient fixture
- `tests/setup.ts` - Changed createClient mock to vi.fn() for per-test mockResolvedValueOnce support

## Decisions Made
- Validation before auth check: `ImportanceSchema.safeParse` runs first — invalid input is rejected cheaply without calling Supabase
- Dynamic notes payload: `updateItemNotes` builds update object from only the provided fields, preventing undefined overwrites
- `beforeEach` reset pattern: `mockReset()` + `mockResolvedValue(null-user-default)` prevents mock queue bleed when implementation returns early without calling `createClient`
- `vi.fn()` in setup.ts: changed from plain arrow function — this is the correct Vitest pattern when tests need to override the mock per-test via `mockResolvedValueOnce`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed createClient mock in setup.ts to use vi.fn()**
- **Found during:** GREEN phase (test run after creating inventory.ts)
- **Issue:** `tests/setup.ts` mocked `createClient` as a plain arrow function `() => Promise.resolve(...)` instead of `vi.fn(...)`. `vi.mocked(createClient).mockResolvedValueOnce` is not a function on a plain arrow — 4 of 6 tests failed with `TypeError: vi.mocked(...).mockResolvedValueOnce is not a function`
- **Fix:** Changed mock factory to `vi.fn(() => Promise.resolve({...}))` in setup.ts; added `beforeEach` reset pattern to inventory.test.ts to prevent per-test mock queue bleed
- **Files modified:** tests/setup.ts, tests/inventory.test.ts
- **Verification:** All 6 inventory tests GREEN; 30 existing tests unaffected
- **Committed in:** 0c32485

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test mock infrastructure)
**Impact on plan:** Necessary for test correctness — the mock pattern was incompatible with the test stub expectations written in plan 03-01. No scope creep.

## Issues Encountered
- Vitest module cache caused mock queue bleed: when `updateItemImportance` returns early (validation failure before auth check), `createClient` is never called but the `mockResolvedValueOnce` remains in the queue and bleeds into the next test. Resolved by adding `beforeEach` mock reset.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `lib/actions/inventory.ts` ready for Inventory UI spec (INVENTORY_UI_SPEC.md) in plan 03-03
- `setup.ts` vi.fn() fix unblocks `review.test.ts` and `secrets.test.ts` which use the same `mockResolvedValueOnce` pattern — plans 03-03 and 03-04 will now work correctly
- 30 existing tests remain green, no regressions

---
*Phase: 03-dashboard*
*Completed: 2026-06-07*
