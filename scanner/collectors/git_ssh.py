"""Git/SSH collector — reads ~/.gitconfig and ~/.ssh key filenames only."""
from __future__ import annotations

import configparser
import logging
from pathlib import Path

from scanner.models import ScanItem

logger = logging.getLogger(__name__)


def _detect_git_config(home: Path) -> list[ScanItem]:
    """Read ~/.gitconfig and return a ScanItem with user fields. Returns [] if missing or unreadable."""
    gitconfig_path = home / ".gitconfig"
    if not gitconfig_path.exists():
        return []
    try:
        cfg = configparser.ConfigParser()
        cfg.read(str(gitconfig_path))
        user_name = cfg.get("user", "name", fallback=None)
        user_email = cfg.get("user", "email", fallback=None)
        default_branch = cfg.get("init", "defaultBranch", fallback=None)
        return [
            ScanItem(
                category="git_ssh",
                tool_name="git_config",
                confidence="high",
                metadata={
                    "user_name": user_name,
                    "user_email": user_email,
                    "default_branch": default_branch,
                },
            )
        ]
    except Exception as exc:
        logger.warning("GIT_CONFIG_PARSE_ERROR path=%s error=%s", gitconfig_path, exc)
        return []


def _detect_ssh_keys(home: Path) -> list[ScanItem]:
    """List filenames (not contents) of private keys in ~/.ssh/. Returns [] if dir missing."""
    ssh_dir = home / ".ssh"
    if not ssh_dir.exists():
        return []
    try:
        key_files = [
            f.name
            for f in ssh_dir.iterdir()
            if f.is_file() and not f.name.endswith(".pub")
        ]
        if not key_files:
            return []
        return [
            ScanItem(
                category="git_ssh",
                tool_name="ssh_keys",
                confidence="high",
                metadata={
                    "key_files": sorted(key_files),
                    "ssh_dir": str(ssh_dir),
                },
            )
        ]
    except OSError as exc:
        logger.warning("SSH_DIR_INACCESSIBLE path=%s error=%s", ssh_dir, exc)
        return []


def collect(config: dict) -> list[ScanItem]:
    """Collect git config user fields and SSH key filenames."""
    home = Path.home()
    items: list[ScanItem] = []
    items.extend(_detect_git_config(home))
    items.extend(_detect_ssh_keys(home))
    return items
