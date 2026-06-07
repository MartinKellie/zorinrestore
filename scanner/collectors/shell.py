"""Shell metadata collector — detects shell binary and config file."""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from scanner.models import ScanItem

logger = logging.getLogger(__name__)

_CONFIG_CANDIDATES = [".bashrc", ".zshrc", (".config", "fish", "config.fish")]


def collect(config: dict) -> list[ScanItem]:
    """Detect the active shell and its config file location."""
    shell_path = os.environ.get("SHELL", "")
    shell_name = Path(shell_path).name if shell_path else "unknown"

    home = Path.home()
    config_file: str | None = None
    last_modified: str | None = None

    for candidate in _CONFIG_CANDIDATES:
        if isinstance(candidate, tuple):
            candidate_path = home.joinpath(*candidate)
        else:
            candidate_path = home / candidate
        if candidate_path.exists():
            try:
                mtime = candidate_path.stat().st_mtime
                dt = datetime.fromtimestamp(mtime, tz=timezone.utc)
                last_modified = dt.isoformat()
                config_file = str(candidate_path)
                break
            except OSError as exc:
                logger.warning("SHELL_CONFIG_STAT_ERROR path=%s error=%s", candidate_path, exc)

    return [
        ScanItem(
            category="shell",
            tool_name=shell_name,
            install_path=shell_path if shell_path else None,
            confidence="high",
            needs_review=(not shell_path),
            metadata={
                "config_file": config_file,
                "last_modified": last_modified,
            },
        )
    ]
