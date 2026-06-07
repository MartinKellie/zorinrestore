"""Environment files collector — returns only variable names, never values."""
from __future__ import annotations

import logging
from pathlib import Path

from scanner.models import ScanItem
from scanner.redact import parse_env_keys

logger = logging.getLogger(__name__)


def collect(config: dict) -> list[ScanItem]:
    """Find .env files under approved_folders and return ScanItems with variable names only.

    CRITICAL SAFETY CONTRACT: Values are never read or stored.
    parse_env_keys() from scanner.redact handles all .env parsing.
    open() is never called directly in this module.
    """
    approved_folders = config.get("approved_folders", [])

    if not approved_folders:
        return []

    items: list[ScanItem] = []
    seen_paths: set[Path] = set()

    for folder in approved_folders:
        root = Path(folder).expanduser().resolve()

        if not root.exists() or not root.is_dir():
            logger.warning("FOLDER_INACCESSIBLE path=%s", root)
            continue

        # Find all .env files (both named ".env" and ending in ".env")
        found: set[Path] = set()
        try:
            for env_file in root.rglob(".env"):
                if env_file.is_file():
                    found.add(env_file.resolve())
            for env_file in root.rglob("*.env"):
                if env_file.is_file():
                    found.add(env_file.resolve())
        except PermissionError as exc:
            logger.warning("FOLDER_INACCESSIBLE path=%s error=%s", root, exc)
            continue

        for env_file in sorted(found):
            if env_file in seen_paths:
                continue
            seen_paths.add(env_file)

            # parse_env_keys() reads only key names — values are discarded immediately
            keys = parse_env_keys(str(env_file))

            items.append(
                ScanItem(
                    category="env_files",
                    tool_name=str(env_file),
                    metadata={"variable_names": keys},
                )
            )

    return items
