# Requirements: Rebuild Ledger

**Defined:** 2026-06-07
**Core Value:** A developer can scan their machine and immediately know what AI/dev things are installed, where they live, and what would need to happen to rebuild from scratch.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign in to dashboard with magic-link (email link, no password)
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: All dashboard pages are protected and redirect unauthenticated users to sign-in

### Machine

- [x] **MACH-01**: User can register a machine with a user-facing name (e.g. "Zorin 18 Pro Laptop")
- [x] **MACH-02**: Machine record captures hostname, OS name/version, kernel version, architecture, scanner version, Python version used, last scan time
- [x] **MACH-03**: Dashboard shows the registered machine's details

### Scanner Token

- [x] **TOKEN-01**: User can generate a scanner token from the dashboard
- [x] **TOKEN-02**: Dashboard shows a ready-to-run setup/scan command the user can copy
- [x] **TOKEN-03**: User can revoke a scanner token from the dashboard
- [x] **TOKEN-04**: Scanner authenticates via token sent to Vercel API route — no Supabase credentials on local machine

### Scan Folders

- [x] **FLDR-01**: User can add approved project root folders via dashboard (e.g. ~/Projects)
- [x] **FLDR-02**: User can remove approved project root folders
- [x] **FLDR-03**: Scanner fetches the approved folder list before scanning
- [ ] **FLDR-04**: Scanner detects projects under approved roots only — does not rummage through home directory

### Scanner Core

- [x] **SCAN-01**: Scanner runs on Zorin/Linux from repo with `python -m scanner scan`
- [x] **SCAN-02**: Scanner uses a module structure — each category is a separate collector module
- [x] **SCAN-03**: Each collector returns a consistent item structure (name, version, path, category, confidence, importance estimate)
- [x] **SCAN-04**: Scanner pre-fetches config (approved folders + any approved extra commands) from API before scanning
- [x] **SCAN-05**: Scanner redacts secret values before upload — stores .env variable names only, never values
- [x] **SCAN-06**: Scanner uploads redacted findings to Supabase via Vercel API route using scanner token
- [x] **SCAN-07**: Scanner terminal output is minimal: scan started, scan completed/failed, upload successful/failed
- [x] **SCAN-08**: Scanner logs critical warnings (token invalid, sync failed, folder inaccessible, secret-like value redacted)

### Scanner Modules

- [ ] **MOD-01**: AI tools module — detects Claude Desktop/Code, Claude skills, Codex, OpenAI CLI/config, MCP servers, AI-related scripts/repos
- [ ] **MOD-02**: IDEs/editors module — detects Cursor, Zed, VS Code, Antigravity; captures version, executable path, config path, extension list (where safely available)
- [ ] **MOD-03**: Package managers/dev tools module — detects Node (node, npm, pnpm, yarn), Python tooling (python versions, pipx), system dev tools from fixed allowlist
- [ ] **MOD-04**: Git/SSH module — captures git username/email, default branch, SSH key presence (filenames only, never contents), remote host types from approved projects
- [ ] **MOD-05**: Shell metadata module — captures detected shell, config file paths, PATH customisation presence, last modified dates
- [ ] **MOD-06**: Project folders module — detects projects under approved roots: name, path, git status, remote URL presence, package type, key files, last modified date
- [ ] **MOD-07**: .env files module — reads variable names only (left-hand side of assignments), immediately discards values, records which files were found and what variable names existed

### Inventory

- [ ] **INV-01**: Dashboard shows inventory grouped by category
- [ ] **INV-02**: Inventory shows restore importance (Essential / Useful / Optional / Ignore) for each item
- [ ] **INV-03**: Ignored items are hidden by default with a "Show ignored" toggle
- [ ] **INV-04**: User can filter inventory by category and importance
- [ ] **INV-05**: User can view full item details (name, category, subcategory, path, version, detection source, importance, confidence, notes, last seen)
- [ ] **INV-06**: User can edit restore importance for any item
- [ ] **INV-07**: User can edit general note for any item (what it is / why used)
- [ ] **INV-08**: User can edit restore note for any item (what needs to happen during rebuild)
- [ ] **INV-09**: Advanced/debug evidence (detection command, config path, redacted output, scanner rule) is hidden by default but viewable

### Review Queue

- [ ] **REVQ-01**: Unknown or low-confidence scanner findings appear in Review Queue
- [ ] **REVQ-02**: User can classify items in Review Queue as Essential, Useful, Optional, or Ignore
- [ ] **REVQ-03**: Classified items move into the main inventory view

### Secrets Checklist

- [ ] **SEC-01**: Dashboard shows a central Secrets Checklist with detected .env variable names and manual reminders
- [ ] **SEC-02**: User can add manual secret reminders (e.g. "recreate GitHub token") — values are never stored
- [ ] **SEC-03**: Each inventory item can be flagged as having a secret dependency
- [ ] **SEC-04**: Items with secret dependencies link back to the Secrets Checklist

### OpenAI Analysis

- [ ] **AI-01**: User can trigger OpenAI analysis manually from the dashboard
- [ ] **AI-02**: OpenAI classifies inventory items — suggests category, importance, confidence
- [ ] **AI-03**: OpenAI suggests general notes (what the item is/does) and restore notes (what to do during rebuild)
- [ ] **AI-04**: User can accept, edit, or ignore any OpenAI suggestion
- [ ] **AI-05**: OpenAI may suggest extra safe read-only scan commands as part of analysis
- [ ] **AI-06**: Analysis uses structured outputs — no raw LLM text stored in item fields

### AI-Assisted Discovery

- [ ] **DISC-01**: OpenAI-suggested extra scan commands are shown in the dashboard for user review
- [ ] **DISC-02**: User can approve or reject each suggested command
- [ ] **DISC-03**: Approved commands are stored and fetched by the scanner on the next manual run
- [ ] **DISC-04**: Scanner executes approved commands only if they match the scanner allowlist (read-only, non-destructive, no arbitrary pipelines)
- [ ] **DISC-05**: All executed commands are logged; output is redacted before storage if it contains sensitive-looking values

### Export

- [ ] **EXP-01**: User can export `machine-inventory.md` (human-readable, rebuild reference)
- [ ] **EXP-02**: User can export `machine-inventory.json` (structured, for backup/future import)
- [ ] **EXP-03**: Export includes an option to include ignored items (default: excluded)
- [ ] **EXP-04**: When ignored items are included, they appear in a separate section

### Scan Warnings

- [x] **WARN-01**: Dashboard shows critical scan warnings: invalid token, failed sync, inaccessible folder, redacted secret-like value, blocked non-allowlisted command, missing expected config folder

### Settings

- [x] **SET-01**: Settings page shows auth status / logged-in email
- [x] **SET-02**: Settings page provides scanner token management (create, view, revoke)
- [ ] **SET-03**: Settings page provides scan folder management (add, remove)
- [x] **SET-04**: Settings page shows machine name with ability to edit
- [ ] **SET-05**: Settings page shows OpenAI analysis status

## v2 Requirements

### Machine

- **MACH-V2-01**: Support for multiple machines with machine switcher
- **MACH-V2-02**: Windows 11 scanner support

### History

- **HIST-V2-01**: Scan history tracking (multiple scans over time)
- **HIST-V2-02**: Diff/change tracking between scans

### Scanner

- **SCAN-V2-01**: Scheduled local scans (not manual-only)
- **SCAN-V2-02**: Dry-run mode
- **SCAN-V2-03**: Import from previous machine-inventory.json
- **SCAN-V2-04**: Docker and Docker Compose module
- **SCAN-V2-05**: NAS/Synology/Portainer module

### IDEs

- **IDE-V2-01**: Deeper editor restore profiles (keybindings, snippets, AI rules, profiles)

### Shell

- **SHELL-V2-01**: Shell config content parsing (aliases, functions, exports)

### Restore

- **REST-V2-01**: Restore checklist generation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Docker scanning | Deferred to Phase 2 |
| Browser extensions, profiles, bookmarks | Out of MVP scope |
| Passwords, cookies | Never — security boundary |
| Desktop themes, fonts, wallpapers, Zorin/GNOME appearance | Out of MVP scope |
| VPN settings, startup apps | Out of MVP scope |
| Full Linux package inventory | Dev/AI tools only, not all packages |
| Deep project summarisation | Detect presence only — no content reading |
| Full IDE restore profiles (keybindings, snippets, AI rules) | Deferred to v2 |
| Shell config content reading (aliases, functions, PATH parsing) | Deferred to v2 |
| Multiple machines | One machine in MVP; data model must not block this |
| Scheduled scans | Manual only in MVP |
| Scan history / diffing / change tracking | Latest scan only in MVP |
| Full restore wizard | Awareness tool only — no automated restore |
| Public multi-user SaaS | Personal tool only |
| Productisation / subscriptions | Out of scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| MACH-01 | Phase 1 | Complete |
| MACH-02 | Phase 1 | Complete |
| MACH-03 | Phase 2 | Complete |
| TOKEN-01 | Phase 1 | Complete |
| TOKEN-02 | Phase 1 | Complete |
| TOKEN-03 | Phase 1 | Complete |
| TOKEN-04 | Phase 1 | Complete |
| FLDR-01 | Phase 2 | Complete |
| FLDR-02 | Phase 2 | Complete |
| FLDR-03 | Phase 2 | Complete |
| FLDR-04 | Phase 2 | Pending |
| SCAN-01 | Phase 2 | Complete |
| SCAN-02 | Phase 2 | Complete |
| SCAN-03 | Phase 2 | Complete |
| SCAN-04 | Phase 2 | Complete |
| SCAN-05 | Phase 2 | Complete |
| SCAN-06 | Phase 2 | Complete |
| SCAN-07 | Phase 2 | Complete |
| SCAN-08 | Phase 2 | Complete |
| MOD-01 | Phase 2 | Pending |
| MOD-02 | Phase 2 | Pending |
| MOD-03 | Phase 2 | Pending |
| MOD-04 | Phase 2 | Pending |
| MOD-05 | Phase 2 | Pending |
| MOD-06 | Phase 2 | Pending |
| MOD-07 | Phase 2 | Pending |
| INV-01 | Phase 3 | Pending |
| INV-02 | Phase 3 | Pending |
| INV-03 | Phase 3 | Pending |
| INV-04 | Phase 3 | Pending |
| INV-05 | Phase 3 | Pending |
| INV-06 | Phase 3 | Pending |
| INV-07 | Phase 3 | Pending |
| INV-08 | Phase 3 | Pending |
| INV-09 | Phase 3 | Pending |
| REVQ-01 | Phase 3 | Pending |
| REVQ-02 | Phase 3 | Pending |
| REVQ-03 | Phase 3 | Pending |
| SEC-01 | Phase 3 | Pending |
| SEC-02 | Phase 3 | Pending |
| SEC-03 | Phase 3 | Pending |
| SEC-04 | Phase 3 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 4 | Pending |
| AI-05 | Phase 4 | Pending |
| AI-06 | Phase 4 | Pending |
| DISC-01 | Phase 5 | Pending |
| DISC-02 | Phase 5 | Pending |
| DISC-03 | Phase 5 | Pending |
| DISC-04 | Phase 5 | Pending |
| DISC-05 | Phase 5 | Pending |
| EXP-01 | Phase 3 | Pending |
| EXP-02 | Phase 3 | Pending |
| EXP-03 | Phase 3 | Pending |
| EXP-04 | Phase 3 | Pending |
| WARN-01 | Phase 2 | Complete |
| SET-01 | Phase 1 | Complete |
| SET-02 | Phase 1 | Complete |
| SET-03 | Phase 2 | Pending |
| SET-04 | Phase 1 | Complete |
| SET-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 66 total
- Mapped to phases: 66
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-07*
*Last updated: 2026-06-07 after initial definition*
