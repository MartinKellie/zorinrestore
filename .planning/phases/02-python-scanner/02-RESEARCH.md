# Phase 2: Python Scanner - Research

**Researched:** 2026-06-07
**Domain:** Python package design + Linux system detection + secret redaction + Supabase HTTP upload
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MACH-03 | Dashboard shows the registered machine's details | Upload route (Phase 2) must upsert machine row with hostname, OS, kernel, arch, scanner version, Python version — schema exists in `public.machines` |
| FLDR-01 | User can add approved project root folders via dashboard | New Server Action + `scan_config.approved_folders` column (already in schema) + Settings page spec (SET-03) for Cursor |
| FLDR-02 | User can remove approved project root folders | Same Server Action with remove path |
| FLDR-03 | Scanner fetches the approved folder list before scanning | New `/api/scanner/config` GET endpoint — scanner GETs this with Bearer token before any scan work |
| FLDR-04 | Scanner detects projects under approved roots only | `MOD-06` collector iterates `scan_config.approved_folders`; no home-directory rummaging |
| SCAN-01 | `python -m scanner scan` runs on Zorin/Linux | `scanner/` package with `__main__.py`; invoked via `python -m scanner scan` |
| SCAN-02 | Module structure — each category is a separate collector module | `scanner/collectors/` directory pattern, one file per category |
| SCAN-03 | Each collector returns consistent item structure | Shared `ScanItem` dataclass in `scanner/models.py` |
| SCAN-04 | Scanner pre-fetches config (approved folders + approved commands) from API before scanning | HTTP GET to `/api/scanner/config` with Bearer token; fails with warning if unreachable |
| SCAN-05 | Scanner redacts secret values before upload — .env variable names only, never values | `MOD-07` reads left-hand side of `KEY=VALUE` lines only; regex `^([A-Za-z_][A-Za-z0-9_]*)=` |
| SCAN-06 | Scanner uploads findings to Supabase via Vercel API route using scanner token | HTTP POST to `/api/scanner/upload` with `Authorization: Bearer <token>`; uses `requests` library |
| SCAN-07 | Terminal output: scan started, completed/failed, upload successful/failed only | `stderr` for warnings/debug; `stdout` only for the three milestone lines |
| SCAN-08 | Scanner logs critical warnings | Warning list with structured log lines to stderr; separate from stdout status lines |
| MOD-01 | AI tools module | Detects Claude Desktop, Claude Code CLI (`claude`), Claude skills dir, OpenAI CLI, Codex |
| MOD-02 | IDEs/editors module | Cursor (`/usr/bin/cursor` v3.6.31), VS Code (`/usr/bin/code` v1.122.1), Zed (v1.4.4), Antigravity (`/usr/bin/antigravity`) |
| MOD-03 | Package managers/dev tools module | Node v24.14.1, npm v11.16.0, pnpm, Python 3.12.3, pip3, pipx, uv (v0.10.11), uvx |
| MOD-04 | Git/SSH module | git global user.name/email, SSH key filenames (not contents) from `~/.ssh/`, remote host types |
| MOD-05 | Shell metadata module | `/bin/bash`, `~/.bashrc` path + last modified, PATH customisation presence |
| MOD-06 | Project folders module | Projects under `approved_folders` only; name, path, git status, remote URL presence, package type, last modified |
| MOD-07 | .env files module | Variable names only; values discarded immediately after line parse |
| WARN-01 | Dashboard shows critical scan warnings | Scanner writes structured warning JSON to upload payload; API route stores to `scan_items` with category `_warnings` |
| SET-03 | Settings page provides scan folder management (add, remove) | FRONTEND_UI_SPEC.md for Cursor — adds folder management section to existing Settings page |
</phase_requirements>

---

## Summary

Phase 2 builds a Python package (`scanner/`) that lives in the same repo root as the Next.js app. It is invoked with `python -m scanner scan`, pre-fetches configuration from a new `/api/scanner/config` endpoint, runs seven category collectors in sequence, redacts all secret values before they leave the process, and uploads findings to the existing `/api/scanner/upload` endpoint. The Phase 1 upload route is a stub that acknowledges receipt without writing to the DB — Phase 2 must also complete the server-side write logic (machine upsert, scan_run creation, scan_items upsert).

The two main work streams are parallel: (A) the Python scanner package itself and (B) the server-side completion of the upload route plus a new config endpoint plus the scan folder management Server Actions. The Settings page scan folder section (SET-03) is frontend and produces a FRONTEND_UI_SPEC.md for Cursor. All seven collector modules can be developed independently after the shared model and harness are established.

Secret safety is the highest-risk area. The `.env` module must parse only the left-hand side of `KEY=VALUE` lines using a strict regex, log a warning if it encounters a value that looks like a secret (long random string), and never include values in the `ScanItem` or in any log output. The terminal output constraint (SCAN-07) means the scanner must route all debug/warning output to `stderr` and only print three `stdout` lines: scan started, scan complete (with item count), and upload result.

**Primary recommendation:** Build in this order — shared models + harness + upload-route completion → config endpoint + folder Server Actions → collector modules in dependency order (AI tools, IDEs, package managers, git/SSH, shell, project folders, .env) → Settings page spec for Cursor → integration test.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `python` | 3.12.3 (system) | Runtime | Already installed on Zorin; no virtualenv needed for pure stdlib use |
| `requests` | latest (stdlib `urllib.request` acceptable) | HTTP POST/GET to Vercel API | Simple, no transitive deps if urllib is used; `requests` is cleaner for timeout/error handling |
| `dataclasses` | stdlib | `ScanItem` model | Zero deps, typed, JSON-serialisable via `dataclasses.asdict()` |
| `subprocess` | stdlib | Run shell commands (e.g. `cursor --version`) | Controlled with `timeout=`, `capture_output=True`, `text=True` |
| `pathlib` | stdlib | Path manipulation | Cross-platform, readable; `Path.home()` instead of `os.path.expanduser` |
| `re` | stdlib | `.env` line parsing, secret-value pattern matching | Single regex `^([A-Za-z_][A-Za-z0-9_]*)=` captures key only |
| `json` | stdlib | Payload serialisation and config parsing | Stdlib; `json.dumps(dataclasses.asdict(item))` |
| `logging` | stdlib | Warning capture to stderr | `logging.basicConfig(stream=sys.stderr)` keeps stdout clean |
| `argparse` | stdlib | `python -m scanner scan` CLI | One subcommand: `scan`; future: `dry-run` |
| `platform` | stdlib | OS/kernel/arch detection | `platform.system()`, `platform.release()`, `platform.machine()` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pytest` | latest | Unit tests for collectors | Already standard in Python projects; no test runner exists yet in scanner |
| `pytest-mock` / `unittest.mock` | stdlib (`unittest.mock`) | Mock subprocess, HTTP calls in tests | `unittest.mock.patch` is sufficient; avoid extra deps |
| `configparser` | stdlib | Parse git config files | `~/.gitconfig` is ini-format; `configparser.ConfigParser()` reads it safely |
| `shutil.which` | stdlib | Locate tool binaries | Better than `subprocess(['which', ...])` — works cross-platform |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `requests` | `urllib.request` (stdlib) | urllib has no timeout on connect in Python < 3.12; requests is cleaner for error handling and response.json(); acceptable dep |
| `dataclasses` | `TypedDict` or Pydantic | Pydantic adds a dep; TypedDict is not serialisable without extra code; dataclasses with `asdict()` is the right balance |
| Flat `scanner/` package | Separate repo | Phase 2 spec says same repo — keeps `python -m scanner scan` invocable from repo root |
| `subprocess.run` per tool | `shlex.split` + shell=True | `shell=True` is a security anti-pattern even for read-only detection; always use list args |

**Installation:**
```bash
# Scanner uses only stdlib + optional requests
pip install requests pytest
# Or: scanner can use urllib.request entirely (zero extra deps)
```

---

## Architecture Patterns

### Recommended Project Structure

```
zorinrestore/                          # repo root (Next.js app lives here too)
├── scanner/
│   ├── __init__.py                    # package marker; exports __version__
│   ├── __main__.py                    # entry point: python -m scanner scan
│   ├── models.py                      # ScanItem dataclass + ScanPayload dataclass
│   ├── config.py                      # loads SCANNER_TOKEN + SCANNER_APP_URL from env
│   ├── api.py                         # fetch_config(), upload_payload() — HTTP layer
│   ├── redact.py                      # secret_value_pattern(), redact_if_needed()
│   ├── collectors/
│   │   ├── __init__.py
│   │   ├── ai_tools.py                # MOD-01
│   │   ├── ides.py                    # MOD-02
│   │   ├── package_managers.py        # MOD-03
│   │   ├── git_ssh.py                 # MOD-04
│   │   ├── shell.py                   # MOD-05
│   │   ├── project_folders.py         # MOD-06
│   │   └── env_files.py               # MOD-07
│   └── warnings.py                    # ScanWarning dataclass + warning accumulator
├── tests/
│   └── scanner/
│       ├── test_models.py
│       ├── test_redact.py
│       ├── test_collectors_ai.py
│       ├── test_collectors_ides.py
│       ├── test_collectors_package_managers.py
│       ├── test_collectors_git_ssh.py
│       ├── test_collectors_shell.py
│       ├── test_collectors_project_folders.py
│       └── test_collectors_env_files.py
└── app/ lib/ ...                      # Next.js side unchanged
```

### Pattern 1: ScanItem Dataclass

**What:** A single canonical data structure returned by every collector. Serialised with `dataclasses.asdict()` for upload.

**When to use:** Every collector returns `list[ScanItem]`. No collector constructs its own dict.

```python
# scanner/models.py
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class ScanItem:
    category: str            # "ai_tools" | "ides" | "package_managers" | "git_ssh" | "shell" | "project_folders" | "env_files" | "_warnings"
    tool_name: str           # human name: "Cursor", "Claude Code CLI", etc.
    version: Optional[str] = None
    install_path: Optional[str] = None
    confidence: str = "high"          # "high" | "medium" | "low"
    needs_review: bool = False
    metadata: dict = field(default_factory=dict)


@dataclass
class ScanPayload:
    machine_hostname: str
    machine_os: str
    scanner_version: str
    scanned_at: str                   # ISO 8601 UTC
    items: list[ScanItem]
    machine_kernel: Optional[str] = None
    machine_arch: Optional[str] = None
    python_version: Optional[str] = None
```

### Pattern 2: Collector Module Contract

**What:** Every collector module exposes a single function `collect(config: dict) -> list[ScanItem]`. The harness calls each in sequence and merges results.

**When to use:** All seven collector modules follow this contract exactly. The harness does not know about individual collector internals.

```python
# scanner/collectors/ides.py — example collector structure
from __future__ import annotations
import shutil, subprocess
from pathlib import Path
from scanner.models import ScanItem


def collect(config: dict) -> list[ScanItem]:
    items: list[ScanItem] = []
    items.extend(_detect_cursor())
    items.extend(_detect_vscode())
    items.extend(_detect_zed())
    items.extend(_detect_antigravity())
    return items


def _detect_cursor() -> list[ScanItem]:
    path = shutil.which("cursor")
    if not path:
        return []
    version = _run_version_cmd(["cursor", "--version"])
    return [ScanItem(
        category="ides",
        tool_name="Cursor",
        version=version,
        install_path=path,
        confidence="high",
        metadata={"config_path": str(Path.home() / ".config" / "Cursor")},
    )]


def _run_version_cmd(cmd: list[str]) -> str | None:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        return result.stdout.strip().splitlines()[0] if result.returncode == 0 else None
    except Exception:
        return None
```

### Pattern 3: Secret Redaction

**What:** The `.env` collector parses only the left-hand side of `KEY=VALUE` lines. An additional guard in `redact.py` checks any string going into `metadata` for secret-value patterns (long base64/hex strings) and redacts them, logging a warning.

**When to use:** `MOD-07` must use this everywhere. Other collectors should run metadata values through `redact_if_needed()` before placing them in `metadata`.

```python
# scanner/redact.py
import re, logging

_SECRET_PATTERN = re.compile(r'^[A-Za-z0-9+/=_\-]{32,}$')
_ENV_KEY_PATTERN = re.compile(r'^([A-Za-z_][A-Za-z0-9_]*)=')

logger = logging.getLogger(__name__)


def parse_env_keys(filepath: str) -> list[str]:
    """Return only variable names from a .env file. Values are never read."""
    keys: list[str] = []
    try:
        with open(filepath, "r", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = _ENV_KEY_PATTERN.match(line)
                if m:
                    keys.append(m.group(1))
    except OSError as e:
        logger.warning("FOLDER_INACCESSIBLE path=%s error=%s", filepath, e)
    return keys


def redact_if_needed(value: str, context: str = "") -> str:
    """Replace value with REDACTED if it looks like a secret. Log a warning."""
    if _SECRET_PATTERN.match(value):
        logger.warning("SECRET_LIKE_VALUE_REDACTED context=%s", context)
        return "REDACTED"
    return value
```

### Pattern 4: Config Pre-fetch and Upload

**What:** The harness makes two HTTP calls to the Vercel app: a GET for config (approved folders, approved commands), then a POST for the scan payload. Both use `Authorization: Bearer <token>`.

**When to use:** Always the first and last steps of a scan run.

```python
# scanner/api.py
import json, os, sys, logging
import urllib.request

logger = logging.getLogger(__name__)

def fetch_config(token: str, app_url: str) -> dict:
    """GET /api/scanner/config — returns {approved_folders: [...], approved_commands: [...]}"""
    url = f"{app_url.rstrip('/')}/api/scanner/config"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        logger.warning("CONFIG_FETCH_FAILED error=%s", e)
        return {"approved_folders": [], "approved_commands": []}


def upload_payload(payload: dict, token: str, app_url: str) -> bool:
    """POST /api/scanner/upload — returns True on 200."""
    url = f"{app_url.rstrip('/')}/api/scanner/upload"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status == 200
    except urllib.error.HTTPError as e:
        if e.code == 401:
            logger.warning("TOKEN_INVALID_OR_REVOKED status=401")
        else:
            logger.warning("UPLOAD_FAILED status=%s", e.code)
        return False
    except Exception as e:
        logger.warning("UPLOAD_FAILED error=%s", e)
        return False
```

### Pattern 5: Main Entry Point — Controlled stdout

**What:** `__main__.py` prints exactly three lines to stdout and routes all other output to stderr via the logging module.

**When to use:** This is the single entry point. All other modules use `logging`, never `print()`.

```python
# scanner/__main__.py
import sys, argparse, logging, platform, datetime
from dataclasses import asdict
from scanner import __version__
from scanner.config import load_config
from scanner.api import fetch_config, upload_payload
from scanner.models import ScanPayload
from scanner.collectors import ai_tools, ides, package_managers, git_ssh, shell, project_folders, env_files

logging.basicConfig(stream=sys.stderr, level=logging.WARNING,
                    format="%(levelname)s %(message)s")

def main():
    parser = argparse.ArgumentParser(prog="scanner")
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("scan")
    args = parser.parse_args()

    if args.command != "scan":
        parser.print_help()
        sys.exit(1)

    token, app_url = load_config()  # raises SystemExit if missing

    print("Scan started")  # stdout line 1

    config = fetch_config(token, app_url)
    approved_folders = config.get("approved_folders", [])

    collectors = [ai_tools, ides, package_managers, git_ssh, shell, project_folders, env_files]
    all_items = []
    for collector in collectors:
        try:
            all_items.extend(collector.collect({"approved_folders": approved_folders}))
        except Exception as e:
            logging.warning("COLLECTOR_FAILED module=%s error=%s", collector.__name__, e)

    payload = ScanPayload(
        machine_hostname=platform.node(),
        machine_os=f"{platform.system()} {platform.release()}",
        machine_kernel=platform.release(),
        machine_arch=platform.machine(),
        scanner_version=__version__,
        python_version=platform.python_version(),
        scanned_at=datetime.datetime.now(datetime.UTC).isoformat(),
        items=all_items,
    )

    print(f"Scan complete — {len(all_items)} items found")  # stdout line 2

    ok = upload_payload(
        {"items": [asdict(i) for i in all_items], **asdict(payload), "items": [asdict(i) for i in all_items]},
        token, app_url
    )

    if ok:
        print("Upload successful")   # stdout line 3
    else:
        print("Upload failed — check warnings above")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Pattern 6: Upload Route Completion (server side — Phase 2 work)

**What:** The Phase 1 `/api/scanner/upload` stub must be completed in Phase 2 to: (1) upsert the machine row, (2) create a scan_run row, (3) upsert scan_items. Uses `adminSupabase` (service_role).

**When to use:** Phase 2 replaces the "Phase 1 stub" comment block in `app/api/scanner/upload/route.ts`.

```typescript
// Phase 2 completion — replace the stub return in upload/route.ts
// After token validation and Zod parse succeed:

const data = parsed.data;

// 1. Find the machine for this token
const { data: token } = await adminSupabase
  .from("scanner_tokens")
  .select("user_id")
  .eq("token_hash", hash)
  .single();

// 2. Upsert machine record (machines_user_id_unique constraint handles conflicts)
const { data: machine } = await adminSupabase
  .from("machines")
  .upsert({
    user_id: token.user_id,
    label: data.machine_hostname,   // fallback label; user can rename in Settings
    hostname: data.machine_hostname,
    os_name: data.machine_os,
    kernel_version: data.machine_kernel,
    architecture: data.machine_arch,
    scanner_version: data.scanner_version,
    python_version: data.python_version,
    last_scan_at: data.scanned_at,
  }, { onConflict: "user_id" })
  .select("id")
  .single();

// 3. Create scan_run row
const { data: run } = await adminSupabase
  .from("scan_runs")
  .insert({ machine_id: machine.id, scanned_at: data.scanned_at,
            scanner_version: data.scanner_version, item_count: data.items.length })
  .select("id")
  .single();

// 4. Upsert scan_items
await adminSupabase.from("scan_items").upsert(
  data.items.map(item => ({ ...item, scan_run_id: run.id })),
  { onConflict: "scan_run_id,category,tool_name" }
);

return NextResponse.json({ ok: true, scan_run_id: run.id, items: data.items.length });
```

### Pattern 7: Config API Endpoint (new in Phase 2)

**What:** A new GET route at `/api/scanner/config` that validates the Bearer token and returns `scan_config` for the matching machine.

**When to use:** Scanner calls this before every scan to get `approved_folders`.

```typescript
// app/api/scanner/config/route.ts
export async function GET(request: NextRequest) {
  const { valid, tokenId } = await validateScannerToken(
    request.headers.get("authorization")
  );
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get machine for this token
  const { data: token } = await adminSupabase
    .from("scanner_tokens").select("user_id").eq("id", tokenId).single();

  const { data: machine } = await adminSupabase
    .from("machines").select("id").eq("user_id", token.user_id).single();

  if (!machine) {
    return NextResponse.json({ approved_folders: [], approved_commands: [] });
  }

  const { data: cfg } = await adminSupabase
    .from("scan_config").select("approved_folders, approved_commands")
    .eq("machine_id", machine.id).single();

  return NextResponse.json(cfg ?? { approved_folders: [], approved_commands: [] });
}
```

### Anti-Patterns to Avoid

- **`shell=True` in subprocess:** Even for read-only detection, shell=True enables command injection. Always pass a list of args.
- **`print()` in collector modules:** All non-harness output must use `logging`. Collectors that print break the three-line stdout contract.
- **Reading .env file values:** The regex must match and capture the key, then the remaining line content (the value) must be discarded without being stored, logged, or passed to any function. Never do `value = line.split("=", 1)[1]` and store it.
- **Walking home directory without `approved_folders` check:** `project_folders.py` must only iterate paths that start with an approved root. No fallback to `~/Projects` or `~/` if `approved_folders` is empty — emit a warning instead.
- **Hardcoded tool paths:** Use `shutil.which()` for binaries. Never hardcode `/usr/bin/cursor` — the path may vary on other Linux distros.
- **Swallowing OSError silently in collectors:** All `OSError` / `PermissionError` from folder access must emit `logger.warning("FOLDER_INACCESSIBLE ...")`. These warnings are surfaced on the dashboard (WARN-01).
- **Not setting `timeout` on subprocess:** A hung `cursor --version` will block the entire scan. Always pass `timeout=5` to `subprocess.run()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Binary detection | Manual path guessing | `shutil.which("cursor")` | Respects PATH; returns None cleanly; one line |
| Platform info | `subprocess(['uname', '-a'])` parsing | `platform.node()`, `platform.release()`, `platform.machine()` | stdlib; consistent across Python versions |
| Git config parsing | Regex on `~/.gitconfig` raw text | `configparser.ConfigParser()` | git config is ini-format; configparser handles sections, escaping, and multi-value keys |
| JSON serialisation of dataclasses | `vars(item)` or custom `__dict__` | `dataclasses.asdict(item)` | Recursively converts nested dataclasses; handles Optional fields correctly |
| HTTP requests | Constructing raw socket connections | `urllib.request` (zero deps) or `requests` (one dep) | Both handle connection errors, timeouts, and status codes safely |
| Secret pattern detection | Word lists of known secret names | Regex on value length and charset | 32+ character base64/hex string is the universal signal; key-name heuristics have high false-positive rate |

**Key insight:** The scanner's value is in the detection logic, not the plumbing. Every line spent on custom HTTP, path, or config parsing is a line that isn't detecting tools. Use stdlib primitives for all plumbing.

---

## Common Pitfalls

### Pitfall 1: .env Values Leaking Through Logging

**What goes wrong:** A collector logs a warning like `WARNING: unusual value in .env: sk-ant-api03-...` — the value appears in stderr which may be captured in CI/CD logs or terminal scrollback.

**Why it happens:** Defensive "log what you redact" code includes the original value before redacting it.

**How to avoid:** `redact.py` logs only the context string (file path + key name), never the value. The log line is `SECRET_LIKE_VALUE_REDACTED context=~/.env KEY=ANTHROPIC_API_KEY`. The value is never assigned to a variable in any other function.

**Warning signs:** Any `logger.warning(...)` call that includes the return value of `line.split("=", 1)[1]`.

---

### Pitfall 2: Approved Folders Not Normalised Before Comparison

**What goes wrong:** Approved folders list contains `~/Projects` but `Path.home() / "Projects"` is `/home/martin/Projects` — the `startswith` check fails and no projects are scanned. No error is raised.

**Why it happens:** The dashboard stores whatever the user typed (`~/Projects`), and the scanner doesn't expand tildes.

**How to avoid:** In the project_folders collector, always `Path(folder).expanduser().resolve()` before comparing against project paths. Apply the same normalisation when the user adds a folder via the Server Action.

**Warning signs:** Scan succeeds (no errors) but `scan_items` has zero rows in the `project_folders` category.

---

### Pitfall 3: Scan Payload Exceeds Vercel Body Size Limit

**What goes wrong:** A large `approved_folders` list with many projects and deep metadata causes the upload POST to fail with `413 Entity Too Large`.

**Why it happens:** Vercel free tier has a 4.5MB body limit on API routes. A deep project scan with large metadata dicts can exceed this.

**How to avoid:** Keep `metadata` values lean. `project_folders` collector stores presence flags (`has_package_json: true`), not file contents. If needed, paginate by sending items in batches of 500.

**Warning signs:** Upload returns 413 or connection reset; item count in terminal output is high (1000+).

---

### Pitfall 4: subprocess Timeout Blocks Scan

**What goes wrong:** `cursor --version` or `code --version` hangs (app starting a GUI rather than printing version). The entire scan waits indefinitely.

**Why it happens:** Some Electron apps on Linux spin up a display server when invoked from CLI. Without a timeout, the scan never completes.

**How to avoid:** Always pass `timeout=5` to `subprocess.run()`. Catch `subprocess.TimeoutExpired` and return `version=None` with `needs_review=True`. Log a warning.

**Warning signs:** Scan hangs after "Scan started" with no further output.

---

### Pitfall 5: Upload Route Returns 401 After Phase 1 Token Validation Change

**What goes wrong:** `validateScannerToken` in `lib/tokens.ts` currently returns `{ valid, tokenId }` but the Phase 2 upload route completion needs `user_id` to find the machine. A second DB query is needed but may be skipped.

**Why it happens:** Phase 1 `validateScannerToken` only returns whether the token is valid, not the `user_id`. The upload route needs to join to find the machine.

**How to avoid:** In Phase 2, extend `validateScannerToken` to also return `userId` from the `scanner_tokens` row (already has `user_id` column). Alternatively, make a second query in the upload route using `tokenId`.

**Warning signs:** Upload route throws "machine not found" because `user_id` is undefined.

---

### Pitfall 6: `scan_config` Row Missing for Machine

**What goes wrong:** Config endpoint query for `scan_config` returns null (no row exists yet for a newly registered machine). Scanner receives an empty config and scans zero folders without error.

**Why it happens:** The Phase 1 migration creates the `scan_config` table but does not seed a row — the row is only created when the user adds their first approved folder via the Settings page.

**How to avoid:** The config endpoint must handle the null case gracefully (return `{approved_folders: [], approved_commands: []}`) and the scanner must emit `logger.warning("NO_APPROVED_FOLDERS_CONFIGURED")` so the dashboard surfaces this as WARN-01. The folder management Server Action must also upsert (not just insert) the `scan_config` row.

**Warning signs:** First scan after machine registration produces no project_folders items and no warnings on the dashboard.

---

## Code Examples

Verified against the actual tool installations on the Zorin machine:

### AI Tools Detection (MOD-01)

```python
# scanner/collectors/ai_tools.py
import shutil
from pathlib import Path
from scanner.models import ScanItem


def collect(config: dict) -> list[ScanItem]:
    items = []

    # Claude Code CLI (installed as 'claude' binary via npm/claude-code)
    path = shutil.which("claude")
    if path:
        items.append(ScanItem(
            category="ai_tools",
            tool_name="Claude Code CLI",
            install_path=path,
            confidence="high",
            metadata={
                "skills_dir": str(Path.home() / ".claude" / "skills"),
                "has_skills": (Path.home() / ".claude" / "skills").exists(),
            }
        ))

    # Claude Desktop (config directory presence)
    claude_config = Path.home() / ".config" / "Claude" / "claude_desktop_config.json"
    if claude_config.exists():
        items.append(ScanItem(
            category="ai_tools",
            tool_name="Claude Desktop",
            install_path=str(claude_config.parent),
            confidence="high",
        ))

    return items
```

### Package Manager Detection (MOD-03)

```python
# scanner/collectors/package_managers.py
import shutil, subprocess, sys
from scanner.models import ScanItem


_TOOLS = [
    ("node", ["node", "--version"]),
    ("npm", ["npm", "--version"]),
    ("pnpm", ["pnpm", "--version"]),
    ("uv", ["uv", "--version"]),
    ("uvx", ["uvx", "--version"]),
    ("pipx", ["pipx", "--version"]),
]


def collect(config: dict) -> list[ScanItem]:
    items = []
    for name, cmd in _TOOLS:
        path = shutil.which(cmd[0])
        if not path:
            continue
        version = _run(cmd)
        items.append(ScanItem(
            category="package_managers",
            tool_name=name,
            version=version,
            install_path=path,
            confidence="high",
        ))

    # Python itself
    items.append(ScanItem(
        category="package_managers",
        tool_name="python",
        version=sys.version.split()[0],
        install_path=sys.executable,
        confidence="high",
    ))
    return items


def _run(cmd: list[str]) -> str | None:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        return r.stdout.strip().splitlines()[0] if r.returncode == 0 else None
    except Exception:
        return None
```

### Environment Configuration for Scanner

```bash
# How the scanner gets its credentials (env vars on the Zorin machine):
export SCANNER_TOKEN=<64-char hex token from Settings page>
export SCANNER_APP_URL=https://zorinrestore.vercel.app

# Then run:
python -m scanner scan
```

```python
# scanner/config.py
import os, sys


def load_config() -> tuple[str, str]:
    token = os.environ.get("SCANNER_TOKEN", "")
    app_url = os.environ.get("SCANNER_APP_URL", "")
    if not token:
        print("ERROR: SCANNER_TOKEN not set", file=sys.stderr)
        sys.exit(1)
    if not app_url:
        print("ERROR: SCANNER_APP_URL not set", file=sys.stderr)
        sys.exit(1)
    return token, app_url
```

---

## Real-World Tool Inventory (Zorin Machine — confirmed June 2026)

These are the actual tools present, which informs collector detection logic:

| Category | Tool | Binary/Path | Version |
|----------|------|-------------|---------|
| IDE | Cursor | `/usr/bin/cursor` | 3.6.31 |
| IDE | VS Code | `/usr/bin/code` | 1.122.1 |
| IDE | Zed | `/home/martin/.local/bin/zed` | 1.4.4 |
| IDE | Antigravity | `/usr/bin/antigravity` | unknown |
| AI Tool | Claude Code CLI | `~/.local/bin/claude` (likely) | detect at runtime |
| AI Tool | Claude Desktop | `~/.config/Claude/claude_desktop_config.json` | config present |
| Package Manager | Python | `/usr/bin/python3` | 3.12.3 |
| Package Manager | pip3 | `/usr/bin/pip3` | system |
| Package Manager | pipx | `/usr/bin/pipx` | system |
| Package Manager | Node.js | pnpm-managed at `~/.local/share/pnpm/nodejs/` | 24.14.1 |
| Package Manager | npm | bundled with Node | 11.16.0 |
| Package Manager | pnpm | `~/.local/share/pnpm/pnpm` | — |
| Package Manager | uv | `~/.local/bin/uv` | 0.10.11 |
| Package Manager | uvx | `~/.local/bin/uvx` | — |
| Git | — | system git | user: MartinKellie |
| SSH | — | `~/.ssh/id_ed25519` | ed25519 key present |
| Shell | bash | `/bin/bash` | `~/.bashrc` exists |
| Projects | — | `~/Projects/` (manual) | ~20 repos |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `os.path.expanduser("~")` | `Path.home()` | Cleaner; pathlib is the current standard for all path operations in Python 3.12 |
| `subprocess.check_output([...])` | `subprocess.run([...], capture_output=True, timeout=5)` | Unified API; `check_output` doesn't support timeout cleanly in older code patterns |
| `sys.platform == "linux"` | `platform.system() == "Linux"` | `platform` gives consistent cross-platform strings; `sys.platform` is `linux` vs `darwin` vs `win32` |
| `os.environ["KEY"]` | `os.environ.get("KEY", default)` | get() avoids KeyError; use `.get()` everywhere except load_config() where missing = fatal |
| Custom JSON serialiser for dataclasses | `dataclasses.asdict()` | stdlib; handles nested dataclasses and Optional fields; no extra deps |

**Deprecated/outdated:**
- `os.path` module: replaced by `pathlib.Path` in all new Python 3.12 code
- `subprocess.check_output` without timeout: always use `subprocess.run` with `timeout=` in 2026

---

## Frontend as Spec

Phase 2 produces one spec file, not implemented frontend code:

**`FRONTEND_UI_SPEC.md`** — Scan folder management section for Settings page (SET-03):
- Adds a "Scan Folders" section to the existing Settings page (`app/(dashboard)/settings/page.tsx`)
- Shows current `scan_config.approved_folders` list with remove buttons
- Provides a text input + "Add Folder" button that calls a new Server Action
- Displays validation state (path must start with `/` or `~/`)

Server Actions needed (Claude writes these, spec references them for Cursor):
- `addApprovedFolder(machineId: string, folder: string): Promise<void>`
- `removeApprovedFolder(machineId: string, folder: string): Promise<void>`

Both upsert `scan_config` row — the row may not exist yet for a new machine.

---

## Open Questions

1. **Antigravity version detection**
   - What we know: Binary at `/usr/bin/antigravity`; config at `~/.config/Antigravity/`
   - What's unclear: Whether `antigravity --version` prints a version string or opens GUI
   - Recommendation: Try `antigravity --version` with `timeout=3`; if it fails, still emit a ScanItem with `version=None` and `confidence="medium"`

2. **Claude Code CLI binary location**
   - What we know: `~/.claude/` directory exists; Claude Code is active on this machine
   - What's unclear: Whether `claude` binary is on PATH (likely via npm global or pnpm) vs invoked as `npx @anthropic-ai/claude-code`
   - Recommendation: `shutil.which("claude")` first; also check `~/.local/bin/claude` and `~/.local/share/pnpm/bin/claude`

3. **`validateScannerToken` return type extension**
   - What we know: Current return is `{ valid: boolean, tokenId?: string }` — no `userId`
   - What's unclear: Whether to extend `validateScannerToken` to return `userId` or make a second query in the upload route
   - Recommendation: Extend the return type to include `userId` — a single query change, avoids a second round-trip to DB

4. **`scan_config` initialisation timing**
   - What we know: `scan_config` row is created only when user adds first folder; scanner may run before any folder is added
   - What's unclear: Whether the upload route should create a `scan_config` row on first upload if none exists, or leave that to the folder management Server Action
   - Recommendation: Folder management Server Action always upserts (never inserts); upload route does not touch `scan_config` — this prevents race conditions

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (Python) + Vitest (existing, TypeScript) |
| Config file | `pytest.ini` or `pyproject.toml [tool.pytest.ini_options]` — Wave 0 gap |
| Quick run command | `python -m pytest tests/scanner/ -x -q` |
| Full suite command | `python -m pytest tests/scanner/ && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAN-01 | `python -m scanner scan --help` exits 0 | smoke | `python -m scanner --help` | Wave 0 |
| SCAN-02 | Each collector is importable and returns `list[ScanItem]` | unit | `python -m pytest tests/scanner/test_collectors_*.py -x` | Wave 0 |
| SCAN-03 | `ScanItem` dataclass serialises to correct JSON shape | unit | `python -m pytest tests/scanner/test_models.py` | Wave 0 |
| SCAN-04 | `fetch_config` returns empty config on network failure (no crash) | unit | `python -m pytest tests/scanner/test_api.py -k "fetch_config_failure"` | Wave 0 |
| SCAN-05 | `parse_env_keys` returns keys only; values are absent from output | unit | `python -m pytest tests/scanner/test_redact.py -k "env_keys"` | Wave 0 |
| SCAN-06 | `upload_payload` sends correct Authorization header | unit | `python -m pytest tests/scanner/test_api.py -k "upload"` | Wave 0 |
| SCAN-07 | Running scanner with mocked collectors produces exactly 3 stdout lines | integration | `python -m pytest tests/scanner/test_main.py -k "stdout_lines"` | Wave 0 |
| SCAN-08 | Token invalid warning logged to stderr, not stdout | unit | `python -m pytest tests/scanner/test_api.py -k "token_invalid_warning"` | Wave 0 |
| MOD-01 | AI tools collector returns ScanItem for claude binary if on PATH | unit | `python -m pytest tests/scanner/test_collectors_ai.py` | Wave 0 |
| MOD-02 | IDEs collector uses `shutil.which`; returns empty list if no IDE found | unit | `python -m pytest tests/scanner/test_collectors_ides.py` | Wave 0 |
| MOD-03 | Package managers collector detects python and sys.executable | unit | `python -m pytest tests/scanner/test_collectors_package_managers.py` | Wave 0 |
| MOD-04 | Git/SSH collector reads `~/.gitconfig` and `~/.ssh/` filenames only | unit | `python -m pytest tests/scanner/test_collectors_git_ssh.py` | Wave 0 |
| MOD-05 | Shell collector returns shell name and bashrc path | unit | `python -m pytest tests/scanner/test_collectors_shell.py` | Wave 0 |
| MOD-06 | Project folders collector only iterates approved_folders; skips home if empty | unit | `python -m pytest tests/scanner/test_collectors_project_folders.py` | Wave 0 |
| MOD-07 | env_files collector: values never appear in ScanItem metadata | unit | `python -m pytest tests/scanner/test_collectors_env_files.py -k "no_values"` | Wave 0 |
| WARN-01 | Upload payload includes `_warnings` category items from logger | integration | `python -m pytest tests/scanner/test_main.py -k "warnings_in_payload"` | Wave 0 |
| MACH-03 | Upload route upserts machine row with correct columns | unit (TS) | `npx vitest run tests/upload-route.test.ts -t "upserts machine"` | Wave 0 |
| FLDR-01 | `addApprovedFolder` upserts scan_config row | unit (TS) | `npx vitest run tests/scan-config.test.ts -t "addApprovedFolder"` | Wave 0 |
| FLDR-03 | `/api/scanner/config` returns approved_folders from DB | unit (TS) | `npx vitest run tests/scanner-config-route.test.ts` | Wave 0 |
| FLDR-04 | project_folders collector: no items emitted if approved_folders is empty | unit (Py) | `python -m pytest tests/scanner/test_collectors_project_folders.py -k "empty_folders"` | Wave 0 |
| SET-03 | Scan folder management section renders correctly | smoke (manual) | Manual: add folder, verify in DB, remove, verify removed | manual-only |

### Sampling Rate

- **Per task commit:** `python -m pytest tests/scanner/ -x -q` (Python suite only, fast)
- **Per wave merge:** `python -m pytest tests/scanner/ && npx vitest run`
- **Phase gate:** Full Python + TypeScript suite green + manual smoke test (add folder, run scan, verify DB rows) before `/gsd:verify-work`

### Wave 0 Gaps

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
- [ ] Framework install: `pip install pytest requests` — if not already available
- [ ] Upload route test extension: `tests/upload-route.test.ts` already exists — add MACH-03 case

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `/home/martin/Projects/zorinpackages/` — actual Phase 1 implementation state
- Direct inspection of Zorin machine tool installations (June 2026) — confirmed binary paths and versions
- `.planning/phases/01-foundation/01-RESEARCH.md` — Phase 1 schema, upload route stub, token validation pattern
- `app/api/scanner/upload/route.ts` — exact Zod schema the scanner payload must match
- `supabase/migrations/0001_foundation.sql` — exact table and column names
- [Python 3.12 stdlib docs](https://docs.python.org/3.12/) — `dataclasses`, `subprocess`, `pathlib`, `platform`, `re`, `logging`

### Secondary (MEDIUM confidence)

- Inferred from Phase 1 plans: upload route must be extended (not replaced) in Phase 2
- Inferred from `scan_config` schema: approved_folders is `text[]`; normalisation required for `~/` paths
- Inferred from Vercel free tier docs: 4.5MB body limit on API routes

### Tertiary (LOW confidence — flag for validation)

- Claude Code CLI binary location: assumed `shutil.which("claude")` finds it; verify at scan time
- Antigravity version flag: assumed `antigravity --version` works; may open GUI instead

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all Python stdlib, versions confirmed against running system
- Architecture: HIGH — derived directly from Phase 1 implementation and schema
- Collector detection logic: HIGH — binary paths verified on actual Zorin machine
- Secret redaction: HIGH — regex approach is well-understood; edge cases documented
- Pitfalls: HIGH — derived from actual schema constraints and known Python patterns
- Open questions: LOW — unverified binary flags and CLI locations

**Research date:** 2026-06-07
**Valid until:** 2026-09-07 (tool versions may change; scanner logic is stable)
