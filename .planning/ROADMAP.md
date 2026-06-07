# Roadmap: Rebuild Ledger

## Overview

Rebuild Ledger is built in five phases, each delivering a coherent, testable capability. Phase 1 establishes the entire trust boundary — schema, auth, token system, and upload gateway — before any data flows through the system. Phase 2 builds the Python scanner that actually runs on the Zorin machine and produces data. Phase 3 delivers the primary user-facing value: a dashboard that makes sense of that data. Phase 4 adds OpenAI-powered classification to elevate the tool beyond a manual inventory list. Phase 5 closes the loop with AI-assisted discovery, allowing OpenAI to suggest additional scan commands that the user approves before the scanner runs them.

Frontend UI work in Phases 1, 3, 4, and 5 produces `FRONTEND_UI_SPEC.md` files for Cursor to implement — Claude does not write frontend code directly.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Schema, auth, scanner token system, and upload gateway — the trust boundary everything else depends on (completed 2026-06-07)
- [ ] **Phase 2: Python Scanner** - Local scanner that detects dev/AI tools across all categories and uploads via token
- [ ] **Phase 3: Dashboard** - Inventory view, Review Queue, Secrets Checklist, and export — the primary user value
- [ ] **Phase 4: AI Analysis** - Manually triggered OpenAI classification pass that annotates inventory with importance and restore notes
- [ ] **Phase 5: AI-Assisted Discovery** - OpenAI suggests additional scan commands; user approves in dashboard; scanner runs them next time

## Phase Details

### Phase 1: Foundation
**Goal**: The trust boundary is live — Martin can log in, register his machine, generate a scanner token, and the upload endpoint is ready to accept data
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, MACH-01, MACH-02, TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, SET-01, SET-02, SET-04
**Frontend**: Settings page (token management, machine name, auth status) produced as FRONTEND_UI_SPEC.md for Cursor
**Success Criteria** (what must be TRUE):
  1. Martin can sign in via magic-link email and stay logged in across browser refresh; all dashboard routes redirect to sign-in when unauthenticated
  2. Martin can register his machine with a user-facing name and the machine record captures hostname, OS, kernel, architecture, scanner version, Python version, and last scan time
  3. Martin can generate a scanner token from the Settings page and copy the ready-to-run scan command
  4. Martin can revoke a scanner token from the Settings page and the token immediately stops working
  5. The `/api/scanner/upload` endpoint validates the scanner token server-side and rejects any request without a valid token — Supabase credentials are never required on the local machine
**Plans**: 5 plans
Plans:
- [ ] 01-00-PLAN.md — Test infrastructure (Vitest config + failing stubs for all unit-testable requirements)
- [ ] 01-01-PLAN.md — Next.js 16 scaffold + Supabase migration SQL + client utilities
- [ ] 01-02-PLAN.md — Auth layer: proxy.ts, login page, Server Action, /auth/confirm route
- [ ] 01-03-PLAN.md — Token system + upload gateway: lib/tokens.ts, Server Actions, /api/scanner/upload
- [ ] 01-04-PLAN.md — Settings page FRONTEND_UI_SPEC.md for Cursor (SET-01, SET-02, SET-04)

### Phase 2: Python Scanner
**Goal**: `python -m scanner scan` runs on the Zorin machine, detects dev/AI tools across all categories, redacts secrets, and successfully uploads findings to Supabase via the Phase 1 endpoint
**Depends on**: Phase 1
**Requirements**: MACH-03, FLDR-01, FLDR-02, FLDR-03, FLDR-04, SCAN-01, SCAN-02, SCAN-03, SCAN-04, SCAN-05, SCAN-06, SCAN-07, SCAN-08, MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07, WARN-01, SET-03
**Frontend**: Scan folder management UI (add/remove approved roots) produced as FRONTEND_UI_SPEC.md for Cursor
**Success Criteria** (what must be TRUE):
  1. `python -m scanner scan` completes on Zorin and the terminal shows only start/complete/upload status lines — no credential output, no stack traces on normal runs
  2. After a scan, scan_items rows exist in Supabase covering AI tools, IDEs, package managers, git config, shell metadata, project folders, and .env variable names
  3. .env files are processed with only variable names stored — no values appear anywhere in the database or scanner logs
  4. Martin can add and remove approved project root folders from the Settings page; the scanner fetches this list before scanning and only inspects projects under those roots
  5. Critical scanner warnings (invalid token, folder inaccessible, secret-like value redacted) are logged by the scanner and surfaced on the dashboard
**Plans**: TBD

### Phase 3: Dashboard
**Goal**: Martin can view, filter, edit, and export his full machine inventory — the tool is useful as a rebuild reference without any AI involvement
**Depends on**: Phase 2
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, INV-08, INV-09, REVQ-01, REVQ-02, REVQ-03, SEC-01, SEC-02, SEC-03, SEC-04, EXP-01, EXP-02, EXP-03, EXP-04
**Frontend**: All dashboard views (inventory, review queue, secrets checklist, export) produced as FRONTEND_UI_SPEC.md files for Cursor
**Success Criteria** (what must be TRUE):
  1. Martin can view all inventory items grouped by category and importance tier; ignored items are hidden by default with a "Show ignored" toggle; items can be filtered by category and importance
  2. Martin can open any item and view full details (name, path, version, detection source, confidence, notes, last seen); advanced debug evidence is hidden by default but expandable
  3. Martin can edit restore importance, general notes, and restore notes for any item; edits persist across sessions
  4. Unknown or low-confidence scanner findings appear in the Review Queue; Martin can classify them as Essential/Useful/Optional/Ignore and classified items move into the main inventory
  5. Martin can view the Secrets Checklist showing detected .env variable names and add manual secret reminders; inventory items can be flagged as having secret dependencies with links back to the checklist
  6. Martin can export `machine-inventory.md` and `machine-inventory.json`; the export option to include ignored items works and places them in a separate section
**Plans**: TBD

### Phase 4: AI Analysis
**Goal**: Martin can trigger an OpenAI classification pass from the dashboard and review AI-suggested importance tiers, restore notes, and category classifications for each inventory item
**Depends on**: Phase 3
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, SET-05
**Frontend**: AI analysis trigger and suggestion review UI produced as FRONTEND_UI_SPEC.md for Cursor
**Success Criteria** (what must be TRUE):
  1. Martin can trigger OpenAI analysis from the dashboard and see a status indicator; analysis does not run silently in the background
  2. After analysis completes, each inventory item shows AI-suggested category, importance, and confidence; suggestions are stored as structured data — no raw LLM text in item fields
  3. Martin can accept, edit, or ignore each AI suggestion independently; accepted suggestions update the item; ignored suggestions leave the item unchanged
  4. AI analysis may produce suggested extra scan commands; these appear in a pending state (not executed) for Phase 5 review
  5. Settings page shows OpenAI analysis status (last run, item count analysed)
**Plans**: TBD

### Phase 5: AI-Assisted Discovery
**Goal**: OpenAI-suggested scan commands flow from analysis through Martin's approval in the dashboard to the scanner's next run, with a strict allowlist gate preventing any unsafe command execution
**Depends on**: Phase 4
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05
**Frontend**: Suggested commands review UI produced as FRONTEND_UI_SPEC.md for Cursor
**Success Criteria** (what must be TRUE):
  1. OpenAI-suggested extra scan commands are visible on the dashboard with approve/reject controls; Martin must explicitly approve before any command is stored for execution
  2. Approved commands are fetched by the scanner on the next manual run; rejected commands are discarded and never executed
  3. The scanner only executes approved commands that also match the scanner allowlist (read-only, non-destructive, no arbitrary pipelines); non-matching commands are blocked and logged as warnings
  4. All executed discovery commands and their outputs are logged; any sensitive-looking values in command output are redacted before storage
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete   | 2026-06-07 |
| 2. Python Scanner | 0/TBD | Not started | - |
| 3. Dashboard | 0/TBD | Not started | - |
| 4. AI Analysis | 0/TBD | Not started | - |
| 5. AI-Assisted Discovery | 0/TBD | Not started | - |
