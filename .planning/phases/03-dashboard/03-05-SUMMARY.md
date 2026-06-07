---
phase: 03-dashboard
plan: "05"
subsystem: dashboard-pages
tags: [next.js, server-components, supabase, spec, cursor, inventory]

# Dependency graph
requires:
  - phase: 03-dashboard/03-02
    provides: updateItemImportance, updateItemNotes Server Actions
  - phase: 03-dashboard/03-03
    provides: classifyReviewItem, addSecretReminder, deleteSecretReminder, flagSecretDep Server Actions

provides:
  - app/(dashboard)/inventory/page.tsx — Protected Server Component fetching scan items for latest run
  - app/(dashboard)/review/page.tsx — Protected Server Component fetching needs_review=true items
  - app/(dashboard)/secrets/page.tsx — Protected Server Component fetching secret_reminders + env_files + has_secret_dep items
  - app/(dashboard)/export/page.tsx — Protected Server Component shell (no data fetching)
  - INVENTORY_UI_SPEC.md — Complete Cursor spec for inventory UI (INV-01 through INV-09)

affects: [INVENTORY_UI_SPEC.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dashboard page Server Component pattern: createClient → getUser() → redirect('/login') → machine → latestRun → scan_items"
    - "latestRun query: .eq('machine_id', machine.id).order('scanned_at', { ascending: false }).limit(1).single()"
    - "Stub client component alongside page.tsx — placeholder div, Cursor replaces via spec"

key-files:
  created:
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/InventoryView.tsx
    - app/(dashboard)/review/page.tsx
    - app/(dashboard)/review/ReviewView.tsx
    - app/(dashboard)/secrets/page.tsx
    - app/(dashboard)/secrets/SecretsView.tsx
    - app/(dashboard)/export/page.tsx
    - app/(dashboard)/export/ExportView.tsx
    - INVENTORY_UI_SPEC.md
  modified: []

key-decisions:
  - "Secrets page fetches three datasets independently: secret_reminders (user-scoped), env_files category items, has_secret_dep=true items — each via separate Supabase query"
  - "INVENTORY_UI_SPEC.md written for Cursor per CLAUDE.md frontend rule — 348 lines covering INV-01 through INV-09 fully, including groupBy Array.reduce (not Object.groupBy), filter logic, drawer, save button states, keyboard handling"
  - "Stub client components use Record<string, unknown>[] props to avoid importing DB types into placeholder files"

# Metrics
duration: 3min
completed: 2026-06-07
---

# Phase 3 Plan 05: Dashboard Page Server Components + Inventory UI Spec Summary

**Four protected dashboard page Server Components with stub client components plus INVENTORY_UI_SPEC.md covering INV-01 through INV-09 for Cursor implementation**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-07T21:13:40Z
- **Completed:** 2026-06-07T21:16:00Z
- **Tasks:** 2
- **Files created:** 9

## Accomplishments

- Created four dashboard page Server Components each following the `getUser() + redirect("/login")` pattern from `settings/page.tsx`
- `inventory/page.tsx`: machine → latestRun (order scanned_at desc) → all scan_items for that run (order by category)
- `review/page.tsx`: machine → latestRun → scan_items where needs_review=true
- `secrets/page.tsx`: secret_reminders (user-scoped) + env_files category items + has_secret_dep=true items, all from latest run
- `export/page.tsx`: auth guard only, no data fetching (exports triggered via API routes)
- Created stub client components (InventoryView, ReviewView, SecretsView, ExportView) alongside each page
- Wrote `INVENTORY_UI_SPEC.md` (348 lines) as a complete self-contained Cursor implementation spec covering INV-01 through INV-09, SEC-04

## Task Commits

Each task was committed atomically:

1. **Task 1: Four dashboard page Server Components + stub views** — `7f48b94` (feat)
2. **Task 2: INVENTORY_UI_SPEC.md** — `76c6f00` (feat)

## Files Created/Modified

- `app/(dashboard)/inventory/page.tsx` — Protected Server Component, machine+latestRun+scan_items data fetching
- `app/(dashboard)/inventory/InventoryView.tsx` — Stub client component (Cursor target)
- `app/(dashboard)/review/page.tsx` — Protected Server Component, needs_review=true items
- `app/(dashboard)/review/ReviewView.tsx` — Stub client component
- `app/(dashboard)/secrets/page.tsx` — Protected Server Component, secret_reminders + env_files + flagged items
- `app/(dashboard)/secrets/SecretsView.tsx` — Stub client component
- `app/(dashboard)/export/page.tsx` — Protected Server Component shell
- `app/(dashboard)/export/ExportView.tsx` — Stub client component
- `INVENTORY_UI_SPEC.md` — 348-line Cursor spec (INV-01 through INV-09, SEC-04)

## Decisions Made

- Secrets page makes three distinct Supabase queries for the three data categories rather than one wide query — cleaner separation and each can be null-guarded independently
- Stub client components typed with `Record<string, unknown>[]` rather than importing database types — avoids coupling the placeholder to schema details before Cursor replaces them
- INVENTORY_UI_SPEC.md written as per CLAUDE.md frontend rule: Claude writes spec, Cursor implements the React components

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- All 4 page.tsx files present: confirmed
- All 4 stub View components present: confirmed
- TypeScript: `npx tsc --noEmit` — PASSED (no errors)
- Tests: `npx vitest run` — 48/48 passed, 11 test files, no regressions
- INVENTORY_UI_SPEC.md: 348 lines, all required sections present (showIgnored: 24 matches)

## Self-Check: PASSED

Files confirmed:
- FOUND: app/(dashboard)/inventory/page.tsx
- FOUND: app/(dashboard)/review/page.tsx
- FOUND: app/(dashboard)/secrets/page.tsx
- FOUND: app/(dashboard)/export/page.tsx
- FOUND: INVENTORY_UI_SPEC.md

Commits confirmed:
- FOUND: 7f48b94 (Task 1)
- FOUND: 76c6f00 (Task 2)

---
*Phase: 03-dashboard*
*Completed: 2026-06-07*
