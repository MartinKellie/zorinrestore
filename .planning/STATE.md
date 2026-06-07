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

Progress: [░░░░░░░░░░] 0%

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-06-07
Stopped at: Roadmap created — Phase 1 ready for /gsd:plan-phase 1
Resume file: None
