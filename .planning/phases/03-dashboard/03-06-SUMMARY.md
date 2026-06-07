---
phase: 03-dashboard
plan: "06"
subsystem: dashboard-specs
tags: [spec, cursor, review-queue, secrets-checklist, ui]

# Dependency graph
requires:
  - phase: 03-dashboard/03-03
    provides: classifyReviewItem, addSecretReminder, deleteSecretReminder Server Actions
  - phase: 03-dashboard/03-05
    provides: review/page.tsx stub, secrets/page.tsx stub, ReviewView stub, SecretsView stub

provides:
  - REVIEW_QUEUE_UI_SPEC.md — Complete Cursor spec for ReviewView (REVQ-01 through REVQ-03)
  - SECRETS_CHECKLIST_UI_SPEC.md — Complete Cursor spec for SecretsView (SEC-01 through SEC-04)

affects: [REVIEW_QUEUE_UI_SPEC.md, SECRETS_CHECKLIST_UI_SPEC.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Spec-first UI workflow: Claude writes self-contained Cursor spec, Cursor implements React component"
    - "Optimistic removal pattern: filter local state on success, show inline error on failure"
    - "Optimistic add pattern: crypto.randomUUID() temp id, real id populated on next Server Component render"

key-files:
  created:
    - REVIEW_QUEUE_UI_SPEC.md
    - SECRETS_CHECKLIST_UI_SPEC.md
  modified: []

key-decisions:
  - "REVIEW_QUEUE_UI_SPEC.md uses optimistic removal — item disappears from local state on classifyReviewItem success, no page reload needed"
  - "SECRETS_CHECKLIST_UI_SPEC.md optimistic add uses crypto.randomUUID() temp id — Server Actions only return { error? }, not the inserted row"
  - "SEC-04 flagging explicitly excluded from SecretsView — handled from inventory item detail drawer per INVENTORY_UI_SPEC.md"

# Metrics
duration: 2min
completed: 2026-06-07
---

# Phase 3 Plan 06: Review Queue and Secrets Checklist UI Specs Summary

**Two self-contained Cursor specs for ReviewView (REVQ-01/02/03) and SecretsView (SEC-01/02/03/04) with full prop types, server action signatures, Tailwind patterns, and all interaction flows**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-07T21:18:56Z
- **Completed:** 2026-06-07T21:21:17Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Wrote `REVIEW_QUEUE_UI_SPEC.md` (250 lines) as a complete Cursor implementation spec for `ReviewView.tsx`
  - REVQ-01: item list with confidence badges, category, version, metadata preview
  - REVQ-02: four classification buttons per card (Essential/Useful/Optional/Ignore), loading states
  - REVQ-03: optimistic removal from local state on classify success, empty state with /inventory link
- Wrote `SECRETS_CHECKLIST_UI_SPEC.md` (433 lines) as a complete Cursor implementation spec for `SecretsView.tsx`
  - SEC-01: detected .env files section with `metadata.variable_names` rendered as monospace tags
  - SEC-02: manual reminders section with add form + delete, optimistic updates, loading/error states
  - SEC-03: flagged inventory items section (read-only) with links to `/inventory#item-{id}`
  - SEC-04: cross-referenced to INVENTORY_UI_SPEC.md for the flagging action itself

## Task Commits

Each task was committed atomically:

1. **Task 1: REVIEW_QUEUE_UI_SPEC.md** — `0d6da15` (feat)
2. **Task 2: SECRETS_CHECKLIST_UI_SPEC.md** — `b1962c1` (feat)

## Files Created/Modified

- `REVIEW_QUEUE_UI_SPEC.md` — 250-line Cursor spec (REVQ-01 through REVQ-03)
- `SECRETS_CHECKLIST_UI_SPEC.md` — 433-line Cursor spec (SEC-01 through SEC-04)

## Decisions Made

- REVIEW_QUEUE_UI_SPEC.md: optimistic removal on classify success — items disappear from local state immediately, no reload needed. Error shown inline per card if classifyReviewItem returns error.
- SECRETS_CHECKLIST_UI_SPEC.md: optimistic add uses `crypto.randomUUID()` as temp id since Server Actions only return `{ error? }` — real id populated on next Server Component render
- SEC-04 (flagSecretDep) explicitly called out as out of scope for SecretsView — it is triggered from the inventory item detail drawer, documented in INVENTORY_UI_SPEC.md

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- REVIEW_QUEUE_UI_SPEC.md: 250 lines, all required sections present, covers REVQ-01/02/03
- SECRETS_CHECKLIST_UI_SPEC.md: 433 lines, all required sections present, covers SEC-01/02/03/04
- Both specs reference correct stub files: ReviewView.tsx, SecretsView.tsx
- Tests: `npx vitest run` — 48/48 passed, 11 test files, no regressions

## Self-Check: PASSED

Files confirmed:
- FOUND: REVIEW_QUEUE_UI_SPEC.md
- FOUND: SECRETS_CHECKLIST_UI_SPEC.md

Commits confirmed:
- FOUND: 0d6da15 (Task 1)
- FOUND: b1962c1 (Task 2)

---
*Phase: 03-dashboard*
*Completed: 2026-06-07*
