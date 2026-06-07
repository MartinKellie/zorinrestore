---
phase: 02-python-scanner
plan: "03"
subsystem: testing
tags: [python, pytest, shutil, subprocess, scanner, collectors, tdd]

# Dependency graph
requires:
  - phase: 02-python-scanner
    plan: "02"
    provides: collector stubs (ai_tools, ides, package_managers returning []), ScanItem/ScanPayload models, RED test files
provides:
  - scanner/collectors/ai_tools.py — collect() detecting Claude Code CLI, Claude Desktop, OpenAI CLI, Codex
  - scanner/collectors/ides.py — collect() detecting Cursor, VS Code, Zed, Antigravity
  - scanner/collectors/package_managers.py — collect() detecting node, npm, pnpm, uv, uvx, pipx, python
  - 22 passing tests across 3 collector test files
affects:
  - 02-05 (Wave 3 collector implementation — git_ssh, shell, project_folders, env_files use same pattern)
  - 02-04 (report/upload phase — collectors produce ScanItems it formats and uploads)

# Tech tracking
tech-stack:
  added: []
  patterns: [shutil.which binary detection, _run_version_cmd with timeout=5, fallback path list for missing PATH entries, module-level mock via patch("scanner.collectors.X.shutil")]

key-files:
  created: []
  modified:
    - scanner/collectors/ai_tools.py
    - scanner/collectors/ides.py
    - scanner/collectors/package_managers.py
    - tests/scanner/test_collectors_ai.py
    - tests/scanner/test_collectors_ides.py
    - tests/scanner/test_collectors_package_managers.py

key-decisions:
  - "Mock shutil as module attribute (patch('scanner.collectors.ai_tools.shutil')) not global shutil.which — required because each collector imports shutil at module level"
  - "Antigravity gets confidence='medium' and needs_review=True when version command times out — reflects GUI launcher uncertainty"
  - "Python ScanItem always emitted in package_managers regardless of which tools are absent — sys.executable is always valid"
  - "_FALLBACK_CLAUDE_PATHS checked when shutil.which('claude') returns None — covers pnpm-global and .local/bin installs"

patterns-established:
  - "Module-level mock: patch('scanner.collectors.MODULE.shutil') not patch('shutil.which') — scopes mock to target collector"
  - "Timeout handling: subprocess.TimeoutExpired caught separately from generic Exception to allow targeted logging"
  - "_run_version_cmd pattern: returns first line of stdout or None; never raises; always uses timeout parameter"

requirements-completed: [MOD-01, MOD-02, MOD-03]

# Metrics
duration: 2min
completed: 2026-06-07
---

# Phase 02 Plan 03: AI Tools, IDEs, and Package Managers Collectors Summary

**Three Wave 2 collector modules implemented — shutil.which + subprocess version detection for Claude Code CLI, Claude Desktop, Cursor, VS Code, Zed, Antigravity, node, npm, pnpm, uv, uvx, pipx, and Python — 22 tests pass GREEN**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-07T15:39:38Z
- **Completed:** 2026-06-07T15:41:55Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `scanner/collectors/ai_tools.py` fully implemented: detects Claude Code CLI (shutil.which + 2 fallback paths), Claude Desktop (config file check), OpenAI CLI, Codex
- `scanner/collectors/ides.py` fully implemented: Cursor, VS Code, Zed, Antigravity — each via shutil.which + _run_version_cmd with timeout=3
- `scanner/collectors/package_managers.py` fully implemented: 6 tools via _TOOLS list + Python always emitted via sys.executable
- 22 tests pass GREEN across 3 test files; Wave 3 RED stubs still fail as expected (4 fails)

## Task Commits

Each task was committed atomically:

1. **Task 1: AI tools collector (MOD-01)** - `51297e5` (feat)
2. **Task 2: IDEs + package_managers collectors (MOD-02, MOD-03)** - `17f21b2` (feat)

_Note: Both tasks used TDD discipline (comprehensive tests written in RED state, then implementation)_

## Files Created/Modified

- `scanner/collectors/ai_tools.py` — collect() with _detect_claude_code/_detect_claude_desktop/_detect_openai_cli/_detect_codex
- `scanner/collectors/ides.py` — collect() with _detect_cursor/_detect_vscode/_detect_zed/_detect_antigravity + _run_version_cmd
- `scanner/collectors/package_managers.py` — collect() iterating _TOOLS list + always-appended Python ScanItem
- `tests/scanner/test_collectors_ai.py` — 8 tests covering PATH detection, fallback paths, desktop config, OpenAI CLI, Codex
- `tests/scanner/test_collectors_ides.py` — 7 tests covering each IDE, version extraction, timeout handling, empty case
- `tests/scanner/test_collectors_package_managers.py` — 7 tests covering node, pnpm, uv, Python always-present, empty case

## Decisions Made

- Mocking pattern: `patch("scanner.collectors.ai_tools.shutil")` not `patch("shutil.which")` — scopes mock to the target module only, avoids leaking into other modules loaded in same process
- Antigravity: `confidence="medium"` and `needs_review=(version is None)` — version command may open GUI with no stdout; needs_review signals to the UI layer that this entry warrants human confirmation
- Python ScanItem: always emitted using `sys.executable` and `platform.python_version()` — not gated on shutil.which since it's always the active interpreter
- Claude Code fallback paths `[~/.local/bin/claude, ~/.local/share/pnpm/bin/claude]` checked when shutil.which returns None — covers pnpm global installs and manual installs that aren't on PATH

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — test structure and mock patterns were clear from the plan. Module-level shutil mock approach was specified in the plan's anti-patterns and interface section.

## User Setup Required

None — no external service configuration required. Collectors run entirely with stdlib (shutil, subprocess, pathlib, sys, platform).

## Next Phase Readiness

- Wave 3 collectors (git_ssh, shell, project_folders, env_files) use identical contract — same shutil.which + _run_version_cmd pattern
- Full suite: `python3 -m pytest tests/scanner/ -q` → 45 pass, 4 fail (expected Wave 3 RED stubs)
- Run `python3 -m scanner scan` to exercise all implemented collectors end-to-end

---
*Phase: 02-python-scanner*
*Completed: 2026-06-07*
