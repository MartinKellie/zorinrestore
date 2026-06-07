---
phase: 02-python-scanner
plan: "05"
subsystem: testing
tags: [python, pytest, configparser, pathlib, scanner, collectors, tdd, security]

# Dependency graph
requires:
  - phase: 02-python-scanner
    plan: "03"
    provides: ai_tools/ides/package_managers collectors passing, shutil.which pattern, ScanItem models
provides:
  - scanner/collectors/git_ssh.py — reads ~/.gitconfig user fields with configparser, lists ~/.ssh key filenames only
  - scanner/collectors/shell.py — detects SHELL env var, finds config file, returns unknown+needs_review when unset
  - scanner/collectors/project_folders.py — scans approved_folders immediate children only, normalises with expanduser().resolve()
  - scanner/collectors/env_files.py — finds .env files, delegates all parsing to parse_env_keys(), values never stored
  - 32 new passing tests across 4 collector test files; full suite 72 pass
affects:
  - 02-06 (report/upload uses all 7 collectors to build ScanPayload)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - configparser.ConfigParser for ~/.gitconfig and .git/config ini parsing
    - Path.expanduser().resolve() for normalising approved_folders paths
    - rglob(".env") + rglob("*.env") with deduplication via set[Path]
    - parse_env_keys() delegation — env_files never calls open() directly

key-files:
  created: []
  modified:
    - scanner/collectors/git_ssh.py
    - scanner/collectors/shell.py
    - scanner/collectors/project_folders.py
    - scanner/collectors/env_files.py
    - tests/scanner/test_collectors_git_ssh.py
    - tests/scanner/test_collectors_shell.py
    - tests/scanner/test_collectors_project_folders.py
    - tests/scanner/test_collectors_env_files.py

key-decisions:
  - "git_ssh exposes _detect_git_config(home) and _detect_ssh_keys(home) as testable helpers — collect() passes Path.home() to them"
  - "env_files.py never calls open() — always delegates to parse_env_keys() from scanner.redact"
  - "project_folders only iterates immediate children (root.iterdir()), no deep recursion"
  - "shell collector always returns a ScanItem (even with tool_name='unknown') — never returns [] for SHELL-unset case"

patterns-established:
  - "Security gating: env_files uses parse_env_keys() indirection — .env values physically cannot reach ScanItem"
  - "Approved-folders gating: both project_folders and env_files return [] when approved_folders is empty/missing"
  - "Path normalisation: Path(folder).expanduser().resolve() on every approved_folders entry before use"
  - "Testable sub-functions: expose _detect_X(home) for unit testing without mocking Path.home()"

requirements-completed: [MOD-04, MOD-05, MOD-06, MOD-07, FLDR-04, SCAN-05, WARN-01]

# Metrics
duration: 8min
completed: 2026-06-07
---

# Phase 02 Plan 05: Git/SSH, Shell, Project Folders, and Env Files Collectors Summary

**Four Wave 3 collector modules with configparser ini parsing, approved_folders gating, and parse_env_keys() security indirection — 72 total tests pass GREEN**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-07T15:45:00Z
- **Completed:** 2026-06-07T15:53:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- `scanner/collectors/git_ssh.py` fully implemented: configparser reads ~/.gitconfig user fields, ~/.ssh private key filenames (not contents, not .pub files)
- `scanner/collectors/shell.py` fully implemented: SHELL env var detection, finds first config file (.bashrc/.zshrc/fish), returns unknown+needs_review when SHELL unset
- `scanner/collectors/project_folders.py` fully implemented: approved_folders gating, expanduser().resolve() normalisation, immediate-children-only iteration, has_git/has_remote/package_type/last_modified metadata
- `scanner/collectors/env_files.py` fully implemented: rglob .env search within approved roots, all parsing via parse_env_keys() — values never stored or logged
- Full scanner test suite: 72 pass, 0 fail (was 68 pass, 4 fail before this plan)

## Task Commits

Each task was committed atomically:

1. **Task 1: git_ssh + shell collectors (MOD-04, MOD-05)** - `9f5ab34` (feat)
2. **Task 2: project_folders + env_files collectors (MOD-06, MOD-07)** - `e78e0c8` (feat)

_Note: Both tasks used TDD discipline — comprehensive test files written first in RED state, then implementation to GREEN_

## Files Created/Modified

- `scanner/collectors/git_ssh.py` — collect() with _detect_git_config()/_detect_ssh_keys() helpers, configparser ini parsing
- `scanner/collectors/shell.py` — collect() reading SHELL env, checking 3 config file candidates
- `scanner/collectors/project_folders.py` — collect() with approved_folders gate, expanduser/resolve, per-child metadata detection
- `scanner/collectors/env_files.py` — collect() with rglob, parse_env_keys() delegation, deduplication via set
- `tests/scanner/test_collectors_git_ssh.py` — 6 tests: user fields, SSH key filtering, missing dirs, collect integration
- `tests/scanner/test_collectors_shell.py` — 5 tests: bash/zsh detection, no config file, missing SHELL env, type check
- `tests/scanner/test_collectors_project_folders.py` — 12 tests: empty gate, has_git, has_remote, package types, tilde resolution, last_modified, file exclusion
- `tests/scanner/test_collectors_env_files.py` — 8 tests: variable extraction, no_values_in_metadata security test, subdirectory search, comments/blanks

## Decisions Made

- `git_ssh` exposes `_detect_git_config(home)` and `_detect_ssh_keys(home)` as testable helpers so tests can pass `tmp_path` directly without mocking `Path.home()` globally
- `shell` always returns a ScanItem (even `tool_name='unknown'`) — the spec says "still return ScanItem with tool_name='unknown' and needs_review=True" when SHELL not in env
- `env_files` never calls `open()` — the only path to file contents is through `parse_env_keys()` which physically discards values before returning
- `project_folders` uses only immediate children (`root.iterdir()`) — no recursive descent per RULE 5 in the plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — the configparser approach for ini files and the parse_env_keys() indirection for security were both clearly specified. Mock patterns for Path.home() via testable sub-functions worked cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 7 collectors implemented and tested (ai_tools, ides, package_managers, git_ssh, shell, project_folders, env_files)
- Full suite: `python3 -m pytest tests/scanner/ -q` → 72 pass, 0 fail
- Scanner is ready for the report/upload phase — all collectors produce ScanItems in the correct format for ScanPayload construction

---
*Phase: 02-python-scanner*
*Completed: 2026-06-07*
