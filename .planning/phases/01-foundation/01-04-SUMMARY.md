---
phase: 01-foundation
plan: "04"
subsystem: ui
tags: [settings, tokens, machines, tailwind, next.js, server-actions, cursor-spec]

# Dependency graph
requires:
  - phase: 01-foundation/01-02
    provides: Settings page stub (app/(dashboard)/settings/page.tsx), auth guard with getUser()
  - phase: 01-foundation/01-03
    provides: generateScannerToken, revokeToken (lib/actions/tokens.ts), upsertMachine (lib/actions/machines.ts)
provides:
  - FRONTEND_UI_SPEC.md: Complete self-contained Settings page spec for Cursor covering SET-01, SET-02, SET-04
affects:
  - Cursor implementation of app/(dashboard)/settings/page.tsx
  - Phase 2 (machine registration flow references same upsertMachine action)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Frontend spec pattern: Claude writes FRONTEND_UI_SPEC.md, Cursor implements — no Claude frontend code"
    - "One-time token UX: modal with copy buttons, checkbox confirmation gate, no click-outside dismiss"
    - "Inline edit pattern: view mode (label + pencil) -> edit mode (input + Save/Cancel) -> router.refresh()"

key-files:
  created:
    - .planning/phases/01-foundation/FRONTEND_UI_SPEC.md
  modified: []

key-decisions:
  - "FRONTEND_UI_SPEC.md follows project rule from CLAUDE.md: Claude writes spec, Cursor implements Settings page"
  - "Modal dismiss via Done button only (checkbox gate required) — Escape and click-outside intentionally blocked"
  - "router.refresh() on Done and Save to re-run Server Component and pull updated DB state"

patterns-established:
  - "Pattern 7: Cursor spec format — What already exists / Section-by-section requirements / CSS patterns / Acceptance criteria"

requirements-completed: [SET-01, SET-02, SET-04, TOKEN-01, TOKEN-02, TOKEN-03, MACH-01]

# Metrics
duration: 2min
completed: 2026-06-07
---

# Phase 01 Plan 04: Settings UI Spec Summary

**Self-contained FRONTEND_UI_SPEC.md covering Settings page auth status, scanner token management (one-time display modal with clipboard + checkbox gate), and machine name inline edit — ready to paste into Cursor**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-07T08:50:58Z
- **Completed:** 2026-06-07T08:52:46Z
- **Tasks:** 1
- **Files modified:** 1 created

## Accomplishments
- FRONTEND_UI_SPEC.md (539 lines) documents all three Settings page sections with exact Server Action signatures, Tailwind class patterns, critical UX constraints, and a 19-item acceptance criteria checklist
- Token one-time display UX fully specified: modal that cannot be dismissed by click-outside or Escape, copy buttons for both raw token and scan command, "I have copied this token" checkbox gates the Done button
- Machine name inline edit pattern specified: pencil icon enters edit mode, Save calls upsertMachine + router.refresh(), Cancel reverts — "no machine yet" shows register form
- Spec is self-contained: Cursor can implement without asking questions — all imports, types, Tailwind classes, and component boundaries are given

## Task Commits

Each task was committed atomically:

1. **Task 1: Write FRONTEND_UI_SPEC.md for the Settings page** - `ff326e5` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `.planning/phases/01-foundation/FRONTEND_UI_SPEC.md` — Complete Cursor implementation spec: imports from @/lib/actions/tokens and @/lib/actions/machines, full Server Component layout, three Client Components (TokensSection, MachineSection, SignOutButton), CSS patterns, acceptance criteria

## Decisions Made
- Spec follows CLAUDE.md frontend rule: Claude writes the spec file, Cursor writes the React/TypeScript code — no frontend implementation by Claude
- Modal dismiss-only-via-Done is a deliberate UX requirement per 01-RESEARCH.md Pitfall 6 (one-time secret must not be accidentally dismissed)
- `router.refresh()` chosen over `revalidatePath` for Client Component context — only router is available client-side

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

FRONTEND_UI_SPEC.md is ready at `.planning/phases/01-foundation/FRONTEND_UI_SPEC.md`.

To implement the Settings page: paste the contents of FRONTEND_UI_SPEC.md into Cursor (or your IDE). The spec tells Cursor exactly which files to create, what to import, how each section behaves, and provides the full acceptance criteria checklist.

No new external services or environment variables are needed for the UI implementation.

## Next Phase Readiness
- All Phase 1 foundation plans complete: scaffold (01-01), auth (01-02), token/machine server actions (01-03), settings UI spec (01-04)
- Cursor can implement the Settings page now using FRONTEND_UI_SPEC.md
- Phase 2 (scanner upload population) can proceed independently — upsertMachine and validateScannerToken are both ready

---
*Phase: 01-foundation*
*Completed: 2026-06-07*
