"""Package managers/dev tools collector — detects node, npm, pnpm, uv, uvx, pipx, Python."""
from __future__ import annotations
import shutil
import subprocess
import sys
import platform
import logging
from scanner.models import ScanItem

logger = logging.getLogger(__name__)

# (tool_name, version_command)
_TOOLS: list[tuple[str, list[str]]] = [
    ("node", ["node", "--version"]),
    ("npm", ["npm", "--version"]),
    ("pnpm", ["pnpm", "--version"]),
    ("uv", ["uv", "--version"]),
    ("uvx", ["uvx", "--version"]),
    ("pipx", ["pipx", "--version"]),
]


def collect(config: dict) -> list[ScanItem]:
    items: list[ScanItem] = []
    for tool_name, version_cmd in _TOOLS:
        path = shutil.which(version_cmd[0])
        if path:
            version = _run_version_cmd(version_cmd)
            items.append(ScanItem(
                category="package_managers",
                tool_name=tool_name,
                version=version,
                install_path=path,
                confidence="high",
            ))
    # Python itself — always present
    items.append(ScanItem(
        category="package_managers",
        tool_name="python",
        version=platform.python_version(),
        install_path=sys.executable,
        confidence="high",
    ))
    return items


def _run_version_cmd(cmd: list[str]) -> str | None:
    """Run a version command safely. Returns first line of stdout or None."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        return result.stdout.strip().splitlines()[0] if result.returncode == 0 else None
    except Exception:
        return None
