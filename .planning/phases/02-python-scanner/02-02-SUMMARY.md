---
phase: 02-python-scanner
plan: "02"
subsystem: testing
tags: [python, pytest, dataclasses, urllib, scanner, tdd]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: upload route stub, scanner_tokens schema, token validation pattern
provides:
  - scanner Python package with models, config, api, redact, warnings modules
  - 7 collector stubs (Wave 2/3 ready to implement)
  - pytest test suite: 26 passing tests, 7 RED collector tests
  - CLI entry point: python -m scanner scan
affects:
  - 02-03 (Wave 2 collector implementation — ai_tools, ides, package_managers)
  - 02-05 (Wave 3 collector implementation — git_ssh, shell, project_folders, env_files)

# Tech tracking
tech-stack:
  added: [pytest 9.0.3, dataclasses (stdlib), urllib.request (stdlib), argparse (stdlib), logging (stdlib)]
  patterns: [TDD RED/GREEN, collector module contract, 3-line stdout discipline, secret redaction pattern]

key-files:
  created:
    - scanner/__init__.py
    - scanner/models.py
    - scanner/config.py
    - scanner/api.py
    - scanner/redact.py
    - scanner/warnings.py
    - scanner/__main__.py
    - scanner/collectors/__init__.py
    - scanner/collectors/ai_tools.py
    - scanner/collectors/ides.py
    - scanner/collectors/package_managers.py
    - scanner/collectors/git_ssh.py
    - scanner/collectors/shell.py
    - scanner/collectors/project_folders.py
    - scanner/collectors/env_files.py
    - pytest.ini
    - conftest.py
    - tests/__init__.py
    - tests/scanner/__init__.py
    - tests/scanner/test_models.py
    - tests/scanner/test_redact.py
    - tests/scanner/test_api.py
    - tests/scanner/test_main.py
    - tests/scanner/test_collectors_ai.py
    - tests/scanner/test_collectors_ides.py
    - tests/scanner/test_collectors_package_managers.py
    - tests/scanner/test_collectors_git_ssh.py
    - tests/scanner/test_collectors_shell.py
    - tests/scanner/test_collectors_project_folders.py
    - tests/scanner/test_collectors_env_files.py
  modified: []

key-decisions:
  - "tests/__init__.py required alongside tests/scanner/__init__.py to prevent namespace collision with scanner/ package (both named 'scanner' would shadow each other)"
  - "Collector stubs return [] (not raise NotImplementedError) so harness can run end-to-end without crashing during Wave 1"
  - "getattr(collector, '__name__', repr(collector)) used instead of collector.__name__ to support mocking in test_main.py"
  - "conftest.py at repo root adds project root to sys.path, combined with pythonpath=. in pytest.ini for reliable import resolution"

patterns-established:
  - "Collector contract: every collector exposes collect(config: dict) -> list[ScanItem] and nothing else"
  - "3-line stdout discipline: harness prints exactly Scan started / Scan complete / Upload successful to stdout; all warnings to stderr via logging"
  - "Secret redaction: parse_env_keys reads only left-hand side of KEY=VALUE lines; redact_if_needed checks 32+ char base64/hex pattern"
  - "TDD discipline: test files written first in RED state before any implementation module created"

requirements-completed: [SCAN-01, SCAN-02, SCAN-03, SCAN-04, SCAN-05, SCAN-07, SCAN-08, WARN-01]

# Metrics
duration: 5min
completed: 2026-06-07
---

# Phase 02 Plan 02: Python Scanner Skeleton Summary

**Python scanner package with ScanItem/ScanPayload dataclasses, api/redact/warnings modules, CLI harness with 3-line stdout contract, 7 collector stubs, and 33-test pytest suite (26 green, 7 RED for Wave 2/3)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-07T15:31:09Z
- **Completed:** 2026-06-07T15:36:50Z
- **Tasks:** 2
- **Files modified:** 30

## Accomplishments

- `scanner/` Python package with all core modules (models, config, api, redact, warnings) fully tested and passing
- CLI entry point (`python -m scanner scan`) with exactly 3 stdout lines on success, all warnings to stderr
- 7 collector stub files exposing `collect(config: dict) -> list[ScanItem]` returning `[]` — Wave 2/3 plans can implement directly
- 33-test pytest suite: 26 pass (test_models, test_redact, test_api, test_main), 7 fail RED (collector detection tests — expected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Core scanner package — models, config, api, redact, warnings** - `2539aef` (feat)
2. **Task 2: Scanner harness + collector stubs + test scaffolding** - `e6beb1f` (feat)

_Note: Both tasks used TDD discipline (tests written first in RED state, then implementation)_

## Files Created/Modified

- `scanner/__init__.py` - Package marker with `__version__ = "0.1.0"`
- `scanner/models.py` - ScanItem and ScanPayload dataclasses (serialisable via dataclasses.asdict)
- `scanner/config.py` - load_config() reading SCANNER_TOKEN and SCANNER_APP_URL, exits cleanly if missing
- `scanner/api.py` - fetch_config() degrades to empty dict on failure; upload_payload() handles 401 with TOKEN_INVALID_OR_REVOKED warning
- `scanner/redact.py` - parse_env_keys() returns key names only; redact_if_needed() redacts 32+ char secrets
- `scanner/warnings.py` - ScanWarning dataclass with add/get/clear accumulator
- `scanner/__main__.py` - argparse CLI with scan subcommand, 3 stdout lines, collector loop with per-collector try/except
- `scanner/collectors/` - 7 stub files (ai_tools, ides, package_managers, git_ssh, shell, project_folders, env_files)
- `pytest.ini` - testpaths=tests/scanner, pythonpath=.
- `conftest.py` - sys.path insertion for project root
- `tests/__init__.py` - Required to make tests/ a proper package (prevents namespace collision with scanner/)
- `tests/scanner/test_*.py` - 11 test files (4 passing, 7 RED)

## Decisions Made

- `tests/__init__.py` added alongside `tests/scanner/__init__.py` to prevent namespace collision where pytest would treat `tests/scanner/` as the `scanner` package, shadowing the real `scanner/` package
- Collector stubs return `[]` instead of `raise NotImplementedError` so the harness can run end-to-end without crashing in Wave 1
- `getattr(collector, "__name__", repr(collector))` used in the collector failure logging to support mock injection in test_main.py

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added tests/__init__.py to fix pytest namespace collision**
- **Found during:** Task 1 (test_models.py verification)
- **Issue:** `tests/scanner/__init__.py` caused pytest to treat `tests/scanner/` as a package named `scanner`, shadowing the real `scanner/` package — import failed with "No module named 'scanner.models'"
- **Fix:** Added `tests/__init__.py` to make the import path `tests.scanner` (not `scanner`), resolving the namespace conflict
- **Files modified:** `tests/__init__.py` (created)
- **Verification:** `python3 -m pytest tests/scanner/test_models.py -q` → 3 passed
- **Committed in:** `2539aef` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed collector.__name__ AttributeError on MagicMock**
- **Found during:** Task 2 (test_main.py verification)
- **Issue:** `logging.warning("COLLECTOR_FAILED module=%s", collector.__name__, e)` raises `AttributeError: __name__` when collector is a MagicMock (MagicMock does not implement __name__ magic attribute)
- **Fix:** Changed to `getattr(collector, "__name__", repr(collector))` which works for both real modules and mocks
- **Files modified:** `scanner/__main__.py`
- **Verification:** `python3 -m pytest tests/scanner/test_main.py -q` → 5 passed
- **Committed in:** `e6beb1f` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes essential for test infrastructure correctness. No scope creep.

## Issues Encountered

- pytest 9 not installed on system Python — installed with `--break-system-packages` flag (Zorin/Ubuntu managed Python environment)
- pytest `pythonpath = .` in pytest.ini did not resolve the namespace collision alone; needed `tests/__init__.py` to correctly namespace the test package

## User Setup Required

None — no external service configuration required. Scanner runs with SCANNER_TOKEN + SCANNER_APP_URL environment variables (set up in Phase 1 Settings page flow).

## Next Phase Readiness

- Wave 2 plans (02-03) can immediately implement ai_tools, ides, package_managers collectors — stubs in place, RED tests written
- Wave 3 plans (02-05) can implement git_ssh, shell, project_folders, env_files — same pattern
- Run `python3 -m pytest tests/scanner/ -q` to verify: 26 pass, 7 fail (expected RED)

---
*Phase: 02-python-scanner*
*Completed: 2026-06-07*
