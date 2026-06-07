"""Project folders collector — scans only approved_folders, never home dir fallback."""
from __future__ import annotations

import configparser
import logging
from datetime import datetime, timezone
from pathlib import Path

from scanner.models import ScanItem

logger = logging.getLogger(__name__)

_PACKAGE_MANIFEST_MAP = [
    ("package.json", "node"),
    ("pyproject.toml", "python"),
    ("Cargo.toml", "rust"),
    ("go.mod", "go"),
]


def _detect_package_type(project_dir: Path) -> str | None:
    """Return package type string for first matching manifest, or None."""
    for manifest, pkg_type in _PACKAGE_MANIFEST_MAP:
        if (project_dir / manifest).exists():
            return pkg_type
    return None


def _detect_has_remote(project_dir: Path) -> bool:
    """Return True if .git/config contains a [remote] section."""
    git_config_path = project_dir / ".git" / "config"
    if not git_config_path.exists():
        return False
    try:
        cfg = configparser.ConfigParser()
        cfg.read(str(git_config_path))
        return any(section.lower().startswith("remote") for section in cfg.sections())
    except Exception as exc:
        logger.warning("GIT_CONFIG_READ_ERROR path=%s error=%s", git_config_path, exc)
        return False


def collect(config: dict) -> list[ScanItem]:
    """Scan immediate children of approved_folders only. Returns [] if approved_folders is empty."""
    approved_folders = config.get("approved_folders", [])

    if not approved_folders:
        logger.warning("NO_APPROVED_FOLDERS_CONFIGURED — project_folders collector returning []")
        return []

    items: list[ScanItem] = []

    for folder in approved_folders:
        root = Path(folder).expanduser().resolve()

        if not root.exists() or not root.is_dir():
            logger.warning("FOLDER_INACCESSIBLE path=%s", root)
            continue

        try:
            children = list(root.iterdir())
        except PermissionError as exc:
            logger.warning("FOLDER_INACCESSIBLE path=%s error=%s", root, exc)
            continue

        for child in children:
            if not child.is_dir():
                continue

            has_git = (child / ".git").is_dir()
            has_remote = _detect_has_remote(child) if has_git else False
            package_type = _detect_package_type(child)

            try:
                mtime = child.stat().st_mtime
                last_modified = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
            except OSError as exc:
                logger.warning("STAT_ERROR path=%s error=%s", child, exc)
                last_modified = None

            items.append(
                ScanItem(
                    category="project_folders",
                    tool_name=child.name,
                    install_path=str(child),
                    confidence="high",
                    metadata={
                        "has_git": has_git,
                        "has_remote": has_remote,
                        "package_type": package_type,
                        "last_modified": last_modified,
                    },
                )
            )

    return items
