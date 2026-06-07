---
phase: 02-python-scanner
verified: 2026-06-07T15:55:20Z
status: gaps_found
score: 3/5 must-haves verified
re_verification: false
gaps:
  - truth: "Martin can add and remove approved project root folders from the Settings page; the scanner fetches this list before scanning and only inspects projects under those roots"
    status: partial
    reason: "Server Actions (addApprovedFolder/removeApprovedFolder) exist and are tested. Scanner fetches config before scanning. BUT the Settings page (app/(dashboard)/settings/page.tsx) does not yet render ScanFolders component — SCANNER_SETTINGS_UI_SPEC.md was delivered for Cursor to implement but Cursor has not implemented it yet. FLDR-01/FLDR-02 are server-side only; no UI yet."
    artifacts:
      - path: "app/(dashboard)/settings/page.tsx"
        issue: "Does not import or render ScanFolders or MachineDetails components. Machines query only selects id, label, hostname, last_scan_at — missing os_name, kernel_version, architecture, scanner_version, python_version."
    missing:
      - "Cursor must implement SCANNER_SETTINGS_UI_SPEC.md: ScanFolders.tsx client component, MachineDetails.tsx server component, and settings/page.tsx updates"

  - truth: "Critical scanner warnings (invalid token, folder inaccessible, secret-like value redacted) are logged by the scanner and surfaced on the dashboard"
    status: failed
    reason: "WARN-01 requires 'Dashboard shows critical scan warnings'. Scanner logs warnings to stderr via Python logging (SCAN-08 satisfied). No warning storage mechanism exists in DB (no scan_warnings table, no warnings column, no _warnings category items sent in upload payload). No dashboard component exists to display warnings. The scanner/warnings.py accumulator module exists but is never called by __main__.py, and warnings are never serialized or sent to the API."
    artifacts:
      - path: "scanner/__main__.py"
        issue: "Collector failures logged to logging.warning() only — not collected into warnings.py accumulator, not added to upload payload, not stored in DB"
      - path: "app/(dashboard)/settings/page.tsx"
        issue: "No warnings section or component exists"
      - path: "supabase/migrations/0001_foundation.sql"
        issue: "No scan_warnings table and no warnings field in scan_items or scan_runs"
    missing:
      - "Mechanism to serialize scanner warnings into the upload payload (either as _warnings category scan_items or a separate warnings array)"
      - "Server-side handling in upload route to persist warnings"
      - "Dashboard component to surface critical scan warnings"

  - truth: "python -m scanner scan completes on Zorin and the terminal shows only start/complete/upload status lines — no credential output, no stack traces on normal runs"
    status: human_needed
    reason: "Code is correct (3-line stdout discipline verified in __main__.py, test_main.py all pass), but live execution on Zorin machine has not been confirmed. Plan 06 checkpoint was auto-approved without real scan. Cannot verify programmatically that the actual scanner runs on the real Zorin machine with real SCANNER_TOKEN and SCANNER_APP_URL."
    artifacts: []
    missing:
      - "Human must run: export SCANNER_TOKEN=<token> && export SCANNER_APP_URL=https://zorinrestore.vercel.app && python -m scanner scan"

human_verification:
  - test: "Live scan on Zorin machine"
    expected: "Terminal shows exactly 3 lines: 'Scan started', 'Scan complete — N items found', 'Upload successful'. No credentials printed. No stack traces."
    why_human: "Plan 06 checkpoint was auto-approved. Real machine + real token required to confirm end-to-end pipeline."
  - test: "Supabase data verification after live scan"
    expected: "scan_items rows exist for categories: ai_tools, ides, package_managers, git_ssh, shell. env_files rows contain only variable_names keys — no values."
    why_human: "Cannot query live Supabase from verifier. Human must run the SQL queries in 02-06-PLAN.md Task 2."
---

# Phase 2: Python Scanner Verification Report

**Phase Goal:** `python -m scanner scan` runs on the Zorin machine, detects dev/AI tools across all categories, redacts secrets, and successfully uploads findings to Supabase via the Phase 1 endpoint
**Verified:** 2026-06-07T15:55:20Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `python -m scanner scan` completes on Zorin — exactly 3 stdout lines, no credentials, no stack traces | ? HUMAN NEEDED | Code correct: 3-line discipline in `__main__.py` verified, test_main.py 5/5 pass. Live Zorin run not confirmed (plan 06 checkpoint was auto-approved). |
| 2 | After a scan, scan_items rows cover ai_tools, ides, package_managers, git_ssh, shell, project_folders, env_files | ? HUMAN NEEDED | All 7 collectors implemented and 72 Python tests pass. Upload route wires to Supabase. Live DB state not verifiable from here. |
| 3 | .env files processed with only variable names stored — no values anywhere in DB or logs | ✓ VERIFIED | `env_files.py` imports `parse_env_keys` and never calls `open()` directly. `parse_env_keys` reads only the LHS of `KEY=VALUE`. test_no_values_in_metadata passes. |
| 4 | Martin can add/remove approved project root folders from Settings page; scanner fetches this list | ✗ FAILED | Server Actions exist and tested (FLDR-01/02 backend done). Scanner calls `fetch_config()` before scanning (FLDR-03/04 done). Settings page does NOT render ScanFolders component — SCANNER_SETTINGS_UI_SPEC.md delivered but Cursor has not implemented it. |
| 5 | Critical scanner warnings logged by scanner and surfaced on the dashboard | ✗ FAILED | Scanner logs to stderr only. No DB storage for warnings. No dashboard component. SCAN-08 (logging) passes; WARN-01 (dashboard display) fails. |

**Score:** 1/5 truths fully verified (2 human-needed, 2 failed, 1 verified)

---

## Required Artifacts

### Plan 02-01 Artifacts (Server Side)

| Artifact | Status | Details |
|----------|--------|---------|
| `lib/tokens.ts` | ✓ VERIFIED | Returns `{valid, tokenId, userId}` — confirmed in source |
| `app/api/scanner/upload/route.ts` | ✓ VERIFIED | Full machine upsert + scan_run insert + scan_items upsert — substantive implementation (139 lines) |
| `app/api/scanner/config/route.ts` | ✓ VERIFIED | GET handler returning approved_folders/approved_commands — wired to machines + scan_config tables |
| `lib/actions/scan-config.ts` | ✓ VERIFIED | addApprovedFolder + removeApprovedFolder with path validation and deduplication |
| `tests/upload-route.test.ts` | ✓ VERIFIED | Part of 24/24 TypeScript tests passing |
| `tests/scan-config.test.ts` | ✓ VERIFIED | Part of 24/24 TypeScript tests passing |
| `tests/scanner-config-route.test.ts` | ✓ VERIFIED | Part of 24/24 TypeScript tests passing |

### Plan 02-02 Artifacts (Python Core)

| Artifact | Status | Details |
|----------|--------|---------|
| `scanner/__init__.py` | ✓ VERIFIED | `__version__ = "0.1.0"` confirmed |
| `scanner/models.py` | ✓ VERIFIED | ScanItem + ScanPayload dataclasses with correct fields |
| `scanner/redact.py` | ✓ VERIFIED | parse_env_keys() + redact_if_needed() — values never returned |
| `scanner/api.py` | ✓ VERIFIED | fetch_config() degrades gracefully; upload_payload() handles 401 |
| `scanner/__main__.py` | ✓ VERIFIED | 3-line stdout discipline, argparse scan subcommand, all 7 collectors wired |
| `scanner/warnings.py` | ✓ VERIFIED | ScanWarning dataclass + accumulator functions exist |
| `pytest.ini` | ✓ VERIFIED | testpaths=tests/scanner, pythonpath=. |
| `tests/scanner/` (11 files) | ✓ VERIFIED | All 11 test files present |

### Plan 02-03 Artifacts (Wave 2 Collectors)

| Artifact | Status | Details |
|----------|--------|---------|
| `scanner/collectors/ai_tools.py` | ✓ VERIFIED | 81 lines — shutil.which + fallback paths, Claude CLI/Desktop/OpenAI CLI/Codex |
| `scanner/collectors/ides.py` | ✓ VERIFIED | 89 lines — Cursor, VS Code, Zed, Antigravity with _run_version_cmd |
| `scanner/collectors/package_managers.py` | ✓ VERIFIED | 53 lines — 6-tool _TOOLS list + Python always-emitted |

### Plan 02-04 Artifacts (UI Spec)

| Artifact | Status | Details |
|----------|--------|---------|
| `SCANNER_SETTINGS_UI_SPEC.md` | ✓ VERIFIED (spec only) | 370 lines — references exact Server Action signatures, settings/page.tsx insertion points, Tailwind patterns. NOT yet implemented by Cursor. |

### Plan 02-05 Artifacts (Wave 3 Collectors)

| Artifact | Status | Details |
|----------|--------|---------|
| `scanner/collectors/git_ssh.py` | ✓ VERIFIED | 76 lines — configparser gitconfig, SSH key filenames (no contents) |
| `scanner/collectors/shell.py` | ✓ VERIFIED | 52 lines — SHELL env var, config file candidates |
| `scanner/collectors/project_folders.py` | ✓ VERIFIED | 96 lines — approved_folders gating, expanduser().resolve(), immediate children only |
| `scanner/collectors/env_files.py` | ✓ VERIFIED | 64 lines — delegates entirely to parse_env_keys(), open() never called directly |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scanner/__main__.py` | `scanner/api.py` | `fetch_config()` then `upload_payload()` | ✓ WIRED | Both calls present at lines 32 and 58 |
| `scanner/__main__.py` | `scanner/collectors/` | `collector.collect(config)` for each | ✓ WIRED | All 7 collectors imported and called in loop at line 35-41 |
| `scanner/collectors/env_files.py` | `scanner/redact.py` | `parse_env_keys()` | ✓ WIRED | Imported at line 8, called at line 54 |
| `scanner/collectors/project_folders.py` | `config['approved_folders']` | expanduser().resolve() on each | ✓ WIRED | Line 45 check, line 54 normalization |
| `app/api/scanner/upload/route.ts` | `adminSupabase` | machines.upsert + scan_runs.insert + scan_items.upsert | ✓ WIRED | All three DB calls confirmed in source |
| `app/api/scanner/config/route.ts` | `lib/tokens.ts` | `validateScannerToken` returning userId | ✓ WIRED | Confirmed at line 7 of config/route.ts |
| `lib/actions/scan-config.ts` | `adminSupabase` | scan_config upsert with machine_id | ✓ WIRED | upsert confirmed in both actions |
| `scanner/__main__.py` | `scanner/warnings.py` | warnings accumulated and uploaded | ✗ NOT WIRED | `warnings.py` module exists but `__main__.py` never imports it or calls `add_warning()`/`get_warnings()`. Warning codes only emitted via `logging.warning()` to stderr — not persisted or uploaded. |
| `SCANNER_SETTINGS_UI_SPEC.md` | `app/(dashboard)/settings/page.tsx` | ScanFolders + MachineDetails rendered | ✗ NOT WIRED | Spec references the file correctly but Cursor has not implemented the components. Settings page still shows only Phase 1 sections. |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MACH-03 | 02-01, 02-04 | Dashboard shows registered machine's details | ✗ PARTIAL | Upload route correctly writes all machine fields to DB. Settings page only queries `id, label, hostname, last_scan_at` and has no MachineDetails component. Spec delivered, Cursor implementation pending. |
| FLDR-01 | 02-01, 02-04 | User can add approved project root folders | ✗ PARTIAL | addApprovedFolder Server Action implemented and tested. No UI yet (ScanFolders component not implemented by Cursor). |
| FLDR-02 | 02-01, 02-04 | User can remove approved project root folders | ✗ PARTIAL | removeApprovedFolder Server Action implemented and tested. No UI yet. |
| FLDR-03 | 02-01 | Scanner fetches approved folder list before scanning | ✓ SATISFIED | fetch_config() called before collector loop in __main__.py; GET /api/scanner/config returns approved_folders |
| FLDR-04 | 02-05 | Scanner only inspects projects under approved roots | ✓ SATISFIED | project_folders.py gates on approved_folders, env_files.py same gate; no fallback to home dir |
| SCAN-01 | 02-02 | `python -m scanner scan` runs on Zorin | ? HUMAN NEEDED | CLI implemented; `python3 -m scanner --help` exits 0; live Zorin run not confirmed |
| SCAN-02 | 02-02 | Module structure — each category is separate collector | ✓ SATISFIED | 7 collector modules in scanner/collectors/ |
| SCAN-03 | 02-02 | Consistent ScanItem structure | ✓ SATISFIED | ScanItem dataclass with all required fields |
| SCAN-04 | 02-02 | Pre-fetches config before scanning | ✓ SATISFIED | fetch_config() called at harness start |
| SCAN-05 | 02-05 | Redacts secret values — .env key names only | ✓ SATISFIED | parse_env_keys() + redact_if_needed() verified; test_no_values_in_metadata passes |
| SCAN-06 | 02-01 | Uploads to Supabase via Vercel API using scanner token | ✓ SATISFIED | upload_payload() + upload route both implemented and tested |
| SCAN-07 | 02-02 | Minimal terminal output — 3 lines | ✓ SATISFIED | 3-line stdout discipline in __main__.py; test_main.py confirms |
| SCAN-08 | 02-02 | Logs critical warnings to scanner output | ✓ SATISFIED | logging.warning() calls in api.py (TOKEN_INVALID_OR_REVOKED, UPLOAD_FAILED, CONFIG_FETCH_FAILED), redact.py (SECRET_LIKE_VALUE_REDACTED, FOLDER_INACCESSIBLE), project_folders.py (NO_APPROVED_FOLDERS_CONFIGURED, FOLDER_INACCESSIBLE) |
| MOD-01 | 02-03 | AI tools module | ✓ SATISFIED | ai_tools.py: Claude Code CLI, Desktop, OpenAI CLI, Codex |
| MOD-02 | 02-03 | IDEs/editors module | ✓ SATISFIED | ides.py: Cursor, VS Code, Zed, Antigravity |
| MOD-03 | 02-03 | Package managers/dev tools | ✓ SATISFIED | package_managers.py: node, npm, pnpm, uv, uvx, pipx, Python |
| MOD-04 | 02-05 | Git/SSH module | ✓ SATISFIED | git_ssh.py: gitconfig user fields, SSH key filenames only |
| MOD-05 | 02-05 | Shell metadata module | ✓ SATISFIED | shell.py: SHELL env var, config file path + last modified |
| MOD-06 | 02-05 | Project folders module | ✓ SATISFIED | project_folders.py: immediate children, has_git/remote/package_type/last_modified |
| MOD-07 | 02-05 | .env files module — key names only | ✓ SATISFIED | env_files.py: parse_env_keys() delegation, never direct open() |
| WARN-01 | 02-02, 02-06 | Dashboard shows critical scan warnings | ✗ FAILED | Scanner logs to stderr (SCAN-08 covered). No DB storage for warnings. No dashboard warning component. warnings.py accumulator exists but is disconnected from harness. |
| SET-03 | 02-01, 02-04 | Settings page provides scan folder management | ✗ PARTIAL | Backend ready (addApprovedFolder/removeApprovedFolder). UI spec delivered. Settings page not updated by Cursor yet. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scanner/__main__.py` | 41 | `logging.warning("COLLECTOR_FAILED ...")` — warnings never accumulated in warnings.py | ⚠️ Warning | WARN-01 gap: warning codes exist in logs but not in DB or dashboard |
| `scanner/warnings.py` | — | Module created but never imported by `__main__.py` | ⚠️ Warning | ScanWarning accumulator is dead code relative to current harness |
| `app/(dashboard)/settings/page.tsx` | 19-23 | machines query selects only `id, label, hostname, last_scan_at` — missing 5 columns for MACH-03 | ✗ Blocker | Settings page cannot show machine details until extended |

No `shell=True`, `print()` in collectors, hardcoded paths, or missing `timeout` parameters found.

---

## Human Verification Required

### 1. Live Scan on Zorin Machine

**Test:** Set `SCANNER_TOKEN` and `SCANNER_APP_URL`, then run `python -m scanner scan` from the repo root on the Zorin machine.
**Expected:**
```
Scan started
Scan complete — N items found
Upload successful
```
No credentials or stack traces to stdout. Warnings (if any) to stderr only.
**Why human:** Plan 06 auto-approved the checkpoint without a real scan. This is the final end-to-end integration that no automated test substitutes for.

### 2. Supabase Data Verification

**Test:** After live scan, run in Supabase SQL editor:
```sql
SELECT category, count(*) FROM scan_items
JOIN scan_runs ON scan_items.scan_run_id = scan_runs.id
GROUP BY category ORDER BY category;

SELECT metadata FROM scan_items WHERE category = 'env_files' LIMIT 5;

SELECT hostname, os_name, kernel_version, scanner_version, last_scan_at FROM machines LIMIT 1;
```
**Expected:** Rows for ai_tools, ides, package_managers, git_ssh, shell. env_files metadata contains only variable_names arrays. machines row has non-null hardware/software columns.
**Why human:** Cannot query live Supabase from this environment.

---

## Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — Settings UI not implemented (FLDR-01, FLDR-02, MACH-03, SET-03):**
The server-side foundation is complete — addApprovedFolder, removeApprovedFolder, and the config endpoint all work and are tested. SCANNER_SETTINGS_UI_SPEC.md (370 lines) has been delivered for Cursor. However, Cursor has not yet implemented the MachineDetails and ScanFolders components on the Settings page. The `settings/page.tsx` still shows only Phase 1 sections. The spec is ready to paste into Cursor — this is a handoff/execution gap, not a design gap.

**Gap 2 — WARN-01 dashboard warning surfacing not implemented:**
SCAN-08 (scanner logs warnings) is satisfied — warning codes are emitted to stderr via Python `logging`. But WARN-01 ("Dashboard shows critical scan warnings") requires warnings to be stored in the database and displayed on the dashboard. No mechanism exists for this in the current codebase:
- `scanner/warnings.py` accumulator exists but `__main__.py` never imports it
- The upload payload schema has no warnings field
- The upload route does not persist warnings
- No DB table or column stores warnings
- No dashboard component displays warnings

This is a genuine implementation gap that needs a plan to: (1) collect warnings in the harness, (2) serialize and upload them, (3) persist server-side, (4) display in dashboard.

**One pending human verification item (not a gap):**
The live scan has not been run. All automated checks pass (72 Python + 24 TypeScript tests, 0 type errors), but the end-to-end pipeline with real Supabase credentials on the real Zorin machine remains unconfirmed.

---

_Verified: 2026-06-07T15:55:20Z_
_Verifier: Claude (gsd-verifier)_
