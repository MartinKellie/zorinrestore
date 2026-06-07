---
phase: 03-dashboard
plan: "03"
subsystem: api
tags: [server-actions, supabase, zod, tdd, vitest]

# Dependency graph
requires:
  - phase: 03-dashboard/03-01
    provides: secret_reminders table (migration 0003), has_secret_dep column on scan_items, test stubs
  - phase: 03-dashboard/03-02
    provides: Server Action pattern (createClient + adminSupabase), setup.ts mockReset pattern

provides:
  - classifyReviewItem Server Action (lib/actions/review.ts) — clears needs_review, sets importance
  - addSecretReminder Server Action (lib/actions/secrets.ts) — inserts into secret_reminders
  - deleteSecretReminder Server Action (lib/actions/secrets.ts) — ownership-verified delete
  - flagSecretDep Server Action (lib/actions/secrets.ts) — sets has_secret_dep on scan_items

affects: [03-dashboard/03-04, 03-dashboard/03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - beforeEach mockReset on createClient vi.fn() prevents mock queue bleed when validation short-circuits before getUser

key-files:
  created:
    - lib/actions/review.ts
    - lib/actions/secrets.ts
  modified:
    - tests/review.test.ts
    - tests/secrets.test.ts

key-decisions:
  - "03-03: beforeEach mockReset required in review and secrets tests — ClassificationSchema.safeParse returns early (before createClient) on invalid input, leaving queued mocks to contaminate subsequent tests"

patterns-established:
  - "Any test file where the SUT validates BEFORE calling createClient needs beforeEach mockReset to prevent queue bleed"

requirements-completed: [REVQ-01, REVQ-02, REVQ-03, SEC-02, SEC-03, SEC-04]

# Metrics
duration: 2min
completed: 2026-06-07
---

# Phase 03 Plan 03: Review Queue and Secrets Server Actions Summary

**classifyReviewItem (clears needs_review + sets importance) and three secrets actions (addSecretReminder, deleteSecretReminder, flagSecretDep) implemented TDD-GREEN against secret_reminders table**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-07T21:05:27Z
- **Completed:** 2026-06-07T21:07:05Z
- **Tasks:** 2 (RED verify + GREEN implementation)
- **Files modified:** 4

## Accomplishments
- `lib/actions/review.ts`: classifyReviewItem validates with ClassificationSchema (z.enum), checks auth via getUser(), verifies item ownership via RLS SELECT, updates importance + needs_review=false via adminSupabase
- `lib/actions/secrets.ts`: addSecretReminder (empty name guard before auth, inserts with user_id from session), deleteSecretReminder (RLS ownership verify then adminSupabase delete), flagSecretDep (RLS ownership verify then adminSupabase update)
- All 8 tests GREEN; full suite 38 passed (pre-existing export-route stub excluded as future-plan scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: GREEN — review.ts + secrets.ts + test fixes** - `e3b2769` (feat)

_Note: RED state was already committed in plan 03-01 test stubs. No new RED commit needed._

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `lib/actions/review.ts` - classifyReviewItem Server Action
- `lib/actions/secrets.ts` - addSecretReminder, deleteSecretReminder, flagSecretDep Server Actions
- `tests/review.test.ts` - Added beforeEach mockReset to prevent mock queue bleed
- `tests/secrets.test.ts` - Added beforeEach mockReset per describe block

## Decisions Made
- beforeEach mockReset required in test files where validation runs before createClient — early return from ClassificationSchema.safeParse leaves a queued mockResolvedValueOnce unconsumed, which then satisfies a later test that expects the unauthenticated (null user) default. Pattern identical to the 03-02 inventory fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added beforeEach mockReset to review and secrets test files**
- **Found during:** Task 1 GREEN run
- **Issue:** Test "returns error when user is not authenticated" was receiving `undefined` instead of `"Unauthorized"`. The invalid-classification test sets `mockResolvedValueOnce` but the action returns early before `createClient` is called, leaving the mock in the queue. The unauthenticated test then consumes that queued mock (authenticated user) instead of the default null-user mock.
- **Fix:** Added `beforeEach(() => { vi.mocked(createClient).mockReset(); vi.mocked(createClient).mockResolvedValue(...null user...) })` to each describe block in both test files
- **Files modified:** tests/review.test.ts, tests/secrets.test.ts
- **Verification:** 8/8 tests GREEN after fix
- **Committed in:** e3b2769 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Necessary for test correctness. No scope creep.

## Issues Encountered
None beyond the mock queue bleed documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All write-path Server Actions for Review Queue and Secrets Checklist are complete
- Ready for plan 03-04 (dashboard UI spec or export route implementation)

---
*Phase: 03-dashboard*
*Completed: 2026-06-07*
