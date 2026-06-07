---
phase: 2
slug: python-scanner
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (Python) + Vitest (existing, TypeScript) |
| **Config file** | `pytest.ini` or `pyproject.toml [tool.pytest.ini_options]` — Wave 0 gap |
| **Quick run command** | `python -m pytest tests/scanner/ -x -q` |
| **Full suite command** | `python -m pytest tests/scanner/ && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest tests/scanner/ -x -q`
- **After every plan wave:** Run `python -m pytest tests/scanner/ && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke test (add folder → run scan → verify DB rows)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-xx-01 | scanner-core | 1 | SCAN-01 | smoke | `python -m scanner --help` | ❌ W0 | ⬜ pending |
| 2-xx-02 | scanner-core | 1 | SCAN-02 | unit | `python -m pytest tests/scanner/test_collectors_*.py -x` | ❌ W0 | ⬜ pending |
| 2-xx-03 | scanner-core | 1 | SCAN-03 | unit | `python -m pytest tests/scanner/test_models.py` | ❌ W0 | ⬜ pending |
| 2-xx-04 | scanner-core | 1 | SCAN-04 | unit | `python -m pytest tests/scanner/test_api.py -k "fetch_config_failure"` | ❌ W0 | ⬜ pending |
| 2-xx-05 | scanner-core | 1 | SCAN-05 | unit | `python -m pytest tests/scanner/test_redact.py -k "env_keys"` | ❌ W0 | ⬜ pending |
| 2-xx-06 | scanner-core | 1 | SCAN-06 | unit | `python -m pytest tests/scanner/test_api.py -k "upload"` | ❌ W0 | ⬜ pending |
| 2-xx-07 | scanner-core | 1 | SCAN-07 | integration | `python -m pytest tests/scanner/test_main.py -k "stdout_lines"` | ❌ W0 | ⬜ pending |
| 2-xx-08 | scanner-core | 1 | SCAN-08 | unit | `python -m pytest tests/scanner/test_api.py -k "token_invalid_warning"` | ❌ W0 | ⬜ pending |
| 2-xx-09 | collectors | 2 | MOD-01 | unit | `python -m pytest tests/scanner/test_collectors_ai.py` | ❌ W0 | ⬜ pending |
| 2-xx-10 | collectors | 2 | MOD-02 | unit | `python -m pytest tests/scanner/test_collectors_ides.py` | ❌ W0 | ⬜ pending |
| 2-xx-11 | collectors | 2 | MOD-03 | unit | `python -m pytest tests/scanner/test_collectors_package_managers.py` | ❌ W0 | ⬜ pending |
| 2-xx-12 | collectors | 2 | MOD-04 | unit | `python -m pytest tests/scanner/test_collectors_git_ssh.py` | ❌ W0 | ⬜ pending |
| 2-xx-13 | collectors | 2 | MOD-05 | unit | `python -m pytest tests/scanner/test_collectors_shell.py` | ❌ W0 | ⬜ pending |
| 2-xx-14 | collectors | 2 | MOD-06 | unit | `python -m pytest tests/scanner/test_collectors_project_folders.py` | ❌ W0 | ⬜ pending |
| 2-xx-15 | collectors | 2 | MOD-07 | unit | `python -m pytest tests/scanner/test_collectors_env_files.py -k "no_values"` | ❌ W0 | ⬜ pending |
| 2-xx-16 | collectors | 2 | FLDR-04 | unit | `python -m pytest tests/scanner/test_collectors_project_folders.py -k "empty_folders"` | ❌ W0 | ⬜ pending |
| 2-xx-17 | server-side | 1 | MACH-03 | unit (TS) | `npx vitest run tests/upload-route.test.ts -t "upserts machine"` | ❌ W0 | ⬜ pending |
| 2-xx-18 | server-side | 1 | FLDR-01 | unit (TS) | `npx vitest run tests/scan-config.test.ts -t "addApprovedFolder"` | ❌ W0 | ⬜ pending |
| 2-xx-19 | server-side | 1 | FLDR-02 | unit (TS) | `npx vitest run tests/scan-config.test.ts -t "removeApprovedFolder"` | ❌ W0 | ⬜ pending |
| 2-xx-20 | server-side | 1 | FLDR-03 | unit (TS) | `npx vitest run tests/scanner-config-route.test.ts` | ❌ W0 | ⬜ pending |
| 2-xx-21 | server-side | 2 | WARN-01 | integration | `python -m pytest tests/scanner/test_main.py -k "warnings_in_payload"` | ❌ W0 | ⬜ pending |
| 2-xx-22 | settings-spec | 3 | SET-03 | manual | Manual smoke test — see Manual-Only section | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pytest.ini` or `pyproject.toml [tool.pytest.ini_options]` — pytest config
- [ ] `tests/scanner/__init__.py` — test package marker
- [ ] `tests/scanner/test_models.py` — covers SCAN-03
- [ ] `tests/scanner/test_redact.py` — covers SCAN-05
- [ ] `tests/scanner/test_api.py` — covers SCAN-04, SCAN-06, SCAN-08
- [ ] `tests/scanner/test_main.py` — covers SCAN-07, WARN-01
- [ ] `tests/scanner/test_collectors_ai.py` — covers MOD-01
- [ ] `tests/scanner/test_collectors_ides.py` — covers MOD-02
- [ ] `tests/scanner/test_collectors_package_managers.py` — covers MOD-03
- [ ] `tests/scanner/test_collectors_git_ssh.py` — covers MOD-04
- [ ] `tests/scanner/test_collectors_shell.py` — covers MOD-05
- [ ] `tests/scanner/test_collectors_project_folders.py` — covers MOD-06, FLDR-04
- [ ] `tests/scanner/test_collectors_env_files.py` — covers MOD-07
- [ ] `tests/scan-config.test.ts` — covers FLDR-01, FLDR-02
- [ ] `tests/scanner-config-route.test.ts` — covers FLDR-03
- [ ] `tests/upload-route.test.ts` (extend existing) — add MACH-03 upsert case
- [ ] Framework install: `pip install pytest requests` — if not already available

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scan folder management UI renders, add/remove works | SET-03 | Frontend UI — produced as FRONTEND_UI_SPEC.md for Cursor; not implemented by Claude | 1. Open Settings page. 2. Add `~/Projects` as approved folder. 3. Verify row appears in `scan_config.approved_folders`. 4. Remove folder. 5. Verify removed from DB. |
| `python -m scanner scan` produces exactly 3 stdout lines on Zorin | SCAN-07 | End-to-end on real machine with real token | Run scan with valid `SCANNER_TOKEN` + `SCANNER_APP_URL`. Pipe stdout to file. Verify exactly 3 lines: "Scan started", "Scan complete — N items found", "Upload successful". |
| Scan_items rows exist in Supabase covering all 7 categories | SCAN-02 | Requires real machine + live DB | After scan, query `scan_items` table. Verify rows with categories: ai_tools, ides, package_managers, git_ssh, shell, project_folders, env_files (or _warnings). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
