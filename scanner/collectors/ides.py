"""IDEs/editors collector — detects Cursor, VS Code, Zed, Antigravity."""
from __future__ import annotations
import shutil
import subprocess
import logging
from pathlib import Path
from scanner.models import ScanItem

logger = logging.getLogger(__name__)


def collect(config: dict) -> list[ScanItem]:
    items: list[ScanItem] = []
    items.extend(_detect_cursor())
    items.extend(_detect_vscode())
    items.extend(_detect_zed())
    items.extend(_detect_antigravity())
    return items


def _run_version_cmd(cmd: list[str], timeout: int = 5) -> str | None:
    """Run a version command safely. Returns first line of stdout or None."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip().splitlines()[0] if result.returncode == 0 else None
    except subprocess.TimeoutExpired:
        logger.warning("VERSION_CMD_TIMEOUT cmd=%s", cmd[0])
        return None
    except Exception:
        return None


def _detect_cursor() -> list[ScanItem]:
    path = shutil.which("cursor")
    if not path:
        return []
    return [ScanItem(
        category="ides",
        tool_name="Cursor",
        version=_run_version_cmd(["cursor", "--version"], timeout=3),
        install_path=path,
        confidence="high",
        metadata={"config_path": str(Path.home() / ".config" / "Cursor")},
    )]


def _detect_vscode() -> list[ScanItem]:
    path = shutil.which("code")
    if not path:
        return []
    return [ScanItem(
        category="ides",
        tool_name="VS Code",
        version=_run_version_cmd(["code", "--version"], timeout=3),
        install_path=path,
        confidence="high",
        metadata={"config_path": str(Path.home() / ".config" / "Code")},
    )]


def _detect_zed() -> list[ScanItem]:
    path = shutil.which("zed")
    if not path:
        return []
    return [ScanItem(
        category="ides",
        tool_name="Zed",
        version=_run_version_cmd(["zed", "--version"], timeout=3),
        install_path=path,
        confidence="high",
        metadata={"config_path": str(Path.home() / ".config" / "zed")},
    )]


def _detect_antigravity() -> list[ScanItem]:
    path = shutil.which("antigravity")
    if not path:
        return []
    version = _run_version_cmd(["antigravity", "--version"], timeout=3)
    # Antigravity may open GUI — version=None is expected
    return [ScanItem(
        category="ides",
        tool_name="Antigravity",
        version=version,
        install_path=path,
        confidence="medium",
        needs_review=(version is None),
        metadata={"config_path": str(Path.home() / ".config" / "Antigravity")},
    )]
