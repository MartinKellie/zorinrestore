---
phase: 01-foundation
plan: "00"
subsystem: testing
tags: [vitest, jsdom, testing-library, red-green, tdd, wave-0]

# Dependency graph
requires: []
provides:
  - Vitest framework installed and configured with jsdom environment
  - 5 failing RED test stubs covering TOKEN-01/02/03/04, AUTH-01/03, MACH-01/02
  - tests/ directory with setup.ts and all Wave-0 test files
  - vitest.config.ts with @ alias resolving to repo root
affects:
  - 01-01 (Next.js scaffold — test stubs turn green when modules exist)
  - 01-02 (Auth/proxy — proxy.test.ts and auth.test.ts turn green)
  - 01-03 (Token/upload API — tokens.test.ts and upload-route.test.ts turn green)
  - 01-04 (machines — machines.test.ts turns green)

# Tech tracking
tech-stack:
  added:
    - vitest (test runner)
    - "@vitejs/plugin-react (vitest React transform)"
    - jsdom (browser environment for tests)
    - "@testing-library/react"
    - "@testing-library/jest-dom"
  patterns:
    - "RED stubs: import-based failing tests using dynamic import() so stubs fail when module doesn't exist"
    - "Wave-0 Nyquist compliance: every requirement has a failing test before implementation"

key-files:
  created:
    - vitest.config.ts
    - tests/setup.ts
    - tests/tokens.test.ts
    - tests/upload-route.test.ts
    - tests/proxy.test.ts
    - tests/machines.test.ts
    - tests/auth.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "@ alias set to /home/martin/Projects/zorinpackages repo root — will resolve correctly once Next.js app exists there"
  - "Dynamic import() used for test stubs so tests fail naturally with module-not-found when modules don't exist yet"
  - "MACH-02 upload metadata test hard-coded to fail (expect 'not yet implemented').toBe('implemented')) until Phase 2 implementation"

patterns-established:
  - "Wave-0 RED stubs: use dynamic import() inside it() blocks; fails on missing module, passes once module exists"
  - "Test naming includes requirement IDs in describe() block names for traceability (e.g., TOKEN-01, AUTH-03)"

requirements-completed: [TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, AUTH-01, AUTH-03, MACH-01, MACH-02]

# Metrics
duration: 2min
completed: 2026-06-07
---

# Phase 1 Plan 00: Test Infrastructure Summary

**Vitest installed with jsdom, 5 RED stub test files covering all 8 Wave-0 requirements (TOKEN-01/02/03/04, AUTH-01/03, MACH-01/02)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-07T08:39:16Z
- **Completed:** 2026-06-07T08:41:01Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Vitest framework installed and configured with jsdom environment, globals, and @testing-library/jest-dom setup
- 5 failing test stub files created covering all 8 Wave-0 requirements — confirmed RED with `npx vitest run` (5 failed, 0 passed)
- @ path alias configured to resolve to repo root for seamless transition when Next.js app is scaffolded in plan 01-01

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Vitest and create vitest.config.ts** - `1739e4c` (chore)
2. **Task 2: Create failing test stubs for all Wave-0 requirements** - `2e7bd99` (test)

**Plan metadata:** (see final docs commit)

## Files Created/Modified

- `vitest.config.ts` - Vitest config with jsdom environment, globals:true, @ alias, tests/** include glob
- `tests/setup.ts` - @testing-library/jest-dom global import
- `tests/tokens.test.ts` - RED stubs for TOKEN-01 (hash not plaintext), TOKEN-02 (64-char hex), TOKEN-03 (revoke), TOKEN-04 (validateScannerToken rejects bad tokens)
- `tests/upload-route.test.ts` - RED stubs for TOKEN-04 (401 without auth), MACH-02 (upload updates machine metadata)
- `tests/proxy.test.ts` - RED stub for AUTH-03 (redirects /dashboard unauthenticated to /login)
- `tests/machines.test.ts` - RED stub for MACH-01 (upsertMachine exported and callable)
- `tests/auth.test.ts` - RED stub for AUTH-01 (signInWithMagicLink exported and callable)
- `package.json` - Updated with devDependencies for vitest ecosystem

## Decisions Made

- @ alias set to `/home/martin/Projects/zorinpackages` repo root — resolves correctly once Next.js app is scaffolded in 01-01
- Dynamic `import()` used inside `it()` blocks so stubs fail with module-not-found (natural RED) rather than needing explicit `expect(false).toBe(true)` hacks
- MACH-02 test hard-coded to fail with `expect('not yet implemented').toBe('implemented')` because Phase 2 scanner upload is the correct implementation home

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Vitest framework ready; all 8 Wave-0 requirements have pre-existing RED tests
- Tests turn green automatically as each functional plan (01-01 through 01-04) creates the modules under `@/`
- Plan 01-01 (Next.js scaffold) can proceed immediately

## Self-Check: PASSED

- vitest.config.ts: FOUND
- tests/setup.ts: FOUND
- tests/tokens.test.ts: FOUND
- tests/upload-route.test.ts: FOUND
- tests/proxy.test.ts: FOUND
- tests/machines.test.ts: FOUND
- tests/auth.test.ts: FOUND
- .planning/phases/01-foundation/01-00-SUMMARY.md: FOUND
- Commit 1739e4c: FOUND
- Commit 2e7bd99: FOUND

---
*Phase: 01-foundation*
*Completed: 2026-06-07*
