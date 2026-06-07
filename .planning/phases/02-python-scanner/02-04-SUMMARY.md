---
phase: 02-python-scanner
plan: "04"
subsystem: ui
tags: [nextjs, typescript, tailwind, supabase, server-actions, cursor-spec]

# Dependency graph
requires:
  - phase: 02-python-scanner
    plan: "01"
    provides: addApprovedFolder and removeApprovedFolder Server Actions, machines table with full columns, scan_config table

provides:
  - SCANNER_SETTINGS_UI_SPEC.md — complete Cursor-ready spec for MachineDetails and ScanFolders sections on the Settings page

affects: [03-settings-ui, cursor-implementation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Frontend spec pattern: Claude writes comprehensive SCANNER_SETTINGS_UI_SPEC.md; Cursor implements — per CLAUDE.md frontend rule

key-files:
  created:
    - SCANNER_SETTINGS_UI_SPEC.md
  modified: []

key-decisions:
  - "Spec extends existing machines query (adds os_name, kernel_version, architecture, scanner_version, python_version) rather than adding a second parallel query"
  - "ScanFolders component is a client component (use client) because it has interactive add/remove state; MachineDetails is a server component"
  - "machineId null guard in ScanFolders renders a disabled-state message — no separate loading state needed since page is server-rendered"

patterns-established:
  - "Scanner UI specs: include exact file paths, existing Tailwind class patterns, complete component code, and summary table of files to create/modify"

requirements-completed: [FLDR-01, FLDR-02, MACH-03, SET-03]

# Metrics
duration: 1min
completed: 2026-06-07
---

# Phase 2 Plan 04: Scanner Settings UI Spec Summary

**Cursor-ready SCANNER_SETTINGS_UI_SPEC.md covering MachineDetails server component and ScanFolders client component wired to addApprovedFolder/removeApprovedFolder Server Actions**

## Performance

- **Duration:** 1 min
- **Started:** 2026-06-07T15:39:47Z
- **Completed:** 2026-06-07T15:41:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created SCANNER_SETTINGS_UI_SPEC.md (370 lines) covering both new Settings page sections
- Spec covers the machines query extension (7 new columns), scanConfig query, MachineDetails server component (definition list with null guard), and ScanFolders client component (add/remove with validation)
- All Server Action signatures, prop interfaces, Tailwind v4 class patterns, and insertion points specified precisely

## Task Commits

Each task was committed atomically:

1. **Task 1: Write SCANNER_SETTINGS_UI_SPEC.md** - `3eba3b4` (feat)

## Files Created/Modified
- `SCANNER_SETTINGS_UI_SPEC.md` — Complete Cursor spec: 7-section document covering existing file structure, new Supabase queries, MachineDetails component, ScanFolders component, Server Action imports, env vars, and validation rules

## Decisions Made
- Extended the existing machines query (replacing `id, label, hostname, last_scan_at` with full column set) rather than adding a separate query — cleaner and avoids two round-trips
- ScanFolders uses `useTransition` for pending state instead of a manual boolean — more idiomatic React 18+

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required. Cursor implements from the spec, no env var changes needed.

## Next Phase Readiness
- SCANNER_SETTINGS_UI_SPEC.md is ready to paste into Cursor for implementation
- Cursor will create: `MachineDetails.tsx`, `ScanFolders.tsx`, and modify `page.tsx`
- After Cursor implements, Settings page will show machine hardware/software details and allow approved folder management

---
*Phase: 02-python-scanner*
*Completed: 2026-06-07*

## Self-Check: PASSED

- SCANNER_SETTINGS_UI_SPEC.md found at repo root (370 lines)
- Task commit 3eba3b4 verified in git history
- All 7 spec sections present: What Already Exists, New Supabase Queries, Machine Details, Scan Folders, Server Action Imports, Env Vars, Validation Rules
