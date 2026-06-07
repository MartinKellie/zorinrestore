---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 03-dashboard/03-03-PLAN.md
last_updated: "2026-06-07T21:07:59.533Z"
last_activity: 2026-06-07 — Roadmap created; ready for Phase 1 planning
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 18
  completed_plans: 14
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-07)

**Core value:** A developer can scan their machine and immediately know what AI/dev things are installed, where they live, and what would need to happen to rebuild from scratch.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-06-07 — Roadmap created; ready for Phase 1 planning

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: n/a
- Trend: n/a

*Updated after each plan completion*
| Phase 01-foundation P00 | 2 | 2 tasks | 7 files |
| Phase 01-foundation P01 | 3 | 2 tasks | 13 files |
| Phase 01-foundation P02 | 8 | 2 tasks | 6 files |
| Phase 01-foundation P03 | 3 | 2 tasks | 5 files |
| Phase 01-foundation P04 | 2 | 1 tasks | 1 files |
| Phase 02-python-scanner P01 | 3 | 2 tasks | 7 files |
| Phase 02-python-scanner P02 | 6 | 2 tasks | 30 files |
| Phase 02-python-scanner P04 | 1 | 1 tasks | 1 files |
| Phase 02-python-scanner P03 | 2 | 2 tasks | 6 files |
| Phase 02-python-scanner P05 | 8 | 2 tasks | 8 files |
| Phase 02-python-scanner P06 | 1 | 2 tasks | 0 files |
| Phase 03-dashboard P01 | 2 | 2 tasks | 5 files |
| Phase 03-dashboard P02 | 5 | 2 tasks | 3 files |
| Phase 03-dashboard P03 | 2 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Scanner uploads via Vercel API route — scanner holds only opaque token + app URL, never Supabase credentials
- Phase 1: scan_run_id FK must be in schema from day one even though MVP only shows latest scan (expensive to retrofit)
- Phase 1: New Supabase project (post 2026-05-30) — every migration needs explicit GRANTs to anon and authenticated roles
- Phase 1: Always use getUser() in server code, never getSession() — prevents auth bypass
- Phase 1: Opaque token stored as SHA-256 hash in DB (not JWT) — hard revocability without denylist overhead
- All phases: Frontend UI work produces FRONTEND_UI_SPEC.md for Cursor — Claude does not implement frontend directly
- [Phase 01-foundation]: 01-00: @ alias set to repo root — resolves correctly once Next.js app scaffolded in 01-01
- [Phase 01-foundation]: 01-00: Dynamic import() used in test stubs for natural RED state (module-not-found) without explicit fail hacks
- [Phase 01-foundation]: 01-00: MACH-02 upload test hard-coded to fail — Phase 2 is correct implementation home for scanner upload
- [Phase 01-foundation]: Manual scaffold instead of create-next-app due to existing .planning/ and package.json conflicts
- [Phase 01-foundation]: Tailwind v4 with @tailwindcss/postcss plugin (CSS-first config, no tailwind.config.js)
- [Phase 01-foundation]: scanner_tokens: only SELECT granted to authenticated — insert/update/delete via service_role only
- [Phase 01-foundation]: 01-02: proxy.ts exports proxy function (not middleware) — Next.js 16 renamed convention
- [Phase 01-foundation]: 01-02: getUser() used in proxy.ts (not getSession()) to prevent auth bypass
- [Phase 01-foundation]: 01-02: Settings page is a stub — full UI via FRONTEND_UI_SPEC.md per CLAUDE.md frontend rule
- [Phase 01-foundation]: Zod v4 requires z.record(z.string(), z.unknown()) — key schema arg required (changed from v3 z.record(z.unknown()))
- [Phase 01-foundation]: Vitest setup.ts mocks adminSupabase and next/headers globally so Server Actions import cleanly in JSDOM test environment
- [Phase 01-foundation]: FRONTEND_UI_SPEC.md follows CLAUDE.md frontend rule: Claude writes spec, Cursor implements Settings page
- [Phase 02-python-scanner]: vitest vi.mock hoisting: top-level mock + mockResolvedValueOnce per test — nested beforeEach mocks are hoisted to file scope by vitest
- [Phase 02-python-scanner]: addApprovedFolder uses read-then-upsert (TypeScript dedup) not SQL array_append — clearer and testable
- [Phase 02-python-scanner]: tests/__init__.py required alongside tests/scanner/__init__.py to prevent namespace collision with scanner/ package
- [Phase 02-python-scanner]: Collector stubs return [] (not raise NotImplementedError) so harness can run end-to-end without crashing during Wave 1
- [Phase 02-python-scanner]: getattr(collector, '__name__', repr(collector)) used instead of collector.__name__ to support mocking in test_main.py
- [Phase 02-python-scanner]: 02-04: Extended machines query (adds os_name, kernel_version, architecture, scanner_version, python_version) rather than adding a second parallel query
- [Phase 02-python-scanner]: 02-04: ScanFolders uses useTransition for pending state — more idiomatic React 18+ than manual boolean
- [Phase 02-python-scanner]: Mock shutil as module attribute (patch collector's shutil) not global shutil.which — scopes mock to target collector only
- [Phase 02-python-scanner]: Antigravity: confidence=medium + needs_review=True when version cmd times out — GUI launcher may not emit version to stdout
- [Phase 02-python-scanner]: Python ScanItem always emitted in package_managers using sys.executable — not gated on shutil.which since interpreter is always present
- [Phase 02-python-scanner]: git_ssh exposes _detect_git_config(home) helper for testability without mocking Path.home() globally
- [Phase 02-python-scanner]: env_files never calls open() — delegates all .env parsing to parse_env_keys() so values cannot reach ScanItem
- [Phase 02-python-scanner]: project_folders iterates only immediate children (no deep recursion) and gates on empty approved_folders
- [Phase 02-python-scanner]: 02-06: Auto-approved checkpoint:human-verify per auto_advance config — programmatic suite gate (72 Python + 24 TS tests, 0 type errors) substitutes for live scan verification in this execution context
- [Phase 03-dashboard]: 03-01: secret_reminders uses plain CREATE TABLE (not IF NOT EXISTS) — migrations run exactly once
- [Phase 03-dashboard]: 03-01: GRANT only on new secret_reminders table — scan_items already GRANT-ed in 0001_foundation.sql
- [Phase 03-dashboard]: 03-01: Dynamic import() used in Phase 3 test stubs for natural RED state (module-not-found) without explicit fail hacks
- [Phase 03-dashboard]: 03-02: Validation (ImportanceSchema.safeParse) runs BEFORE getUser() — invalid input rejected without Supabase round-trip
- [Phase 03-dashboard]: 03-02: setup.ts createClient mock changed to vi.fn() — enables mockResolvedValueOnce per-test overrides for all Phase 3 test files
- [Phase 03-dashboard]: 03-02: beforeEach mockReset pattern in inventory tests prevents mock queue bleed when implementation short-circuits before calling createClient
- [Phase 03-dashboard]: 03-03: beforeEach mockReset required in review and secrets tests — ClassificationSchema.safeParse returns early (before createClient) on invalid input, leaving queued mocks to contaminate subsequent tests

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-06-07T21:07:59.531Z
Stopped at: Completed 03-dashboard/03-03-PLAN.md
Resume file: None
