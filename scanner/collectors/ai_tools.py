"""AI tools collector — detects Claude Code CLI, Claude Desktop, OpenAI CLI, Codex."""
from __future__ import annotations
import shutil
import logging
from pathlib import Path
from scanner.models import ScanItem

logger = logging.getLogger(__name__)

_FALLBACK_CLAUDE_PATHS = [
    Path.home() / ".local" / "bin" / "claude",
    Path.home() / ".local" / "share" / "pnpm" / "bin" / "claude",
]


def collect(config: dict) -> list[ScanItem]:
    items: list[ScanItem] = []
    items.extend(_detect_claude_code())
    items.extend(_detect_claude_desktop())
    items.extend(_detect_openai_cli())
    items.extend(_detect_codex())
    return items


def _detect_claude_code() -> list[ScanItem]:
    path = shutil.which("claude")
    if not path:
        for fallback in _FALLBACK_CLAUDE_PATHS:
            if fallback.exists():
                path = str(fallback)
                break
    if not path:
        return []
    skills_dir = Path.home() / ".claude" / "skills"
    return [ScanItem(
        category="ai_tools",
        tool_name="Claude Code CLI",
        install_path=path,
        confidence="high",
        metadata={
            "skills_dir": str(skills_dir),
            "has_skills": skills_dir.exists(),
        },
    )]


def _detect_claude_desktop() -> list[ScanItem]:
    cfg = Path.home() / ".config" / "Claude" / "claude_desktop_config.json"
    if not cfg.exists():
        return []
    return [ScanItem(
        category="ai_tools",
        tool_name="Claude Desktop",
        install_path=str(cfg.parent),
        confidence="high",
        metadata={"config_file": str(cfg)},
    )]


def _detect_openai_cli() -> list[ScanItem]:
    path = shutil.which("openai")
    if not path:
        return []
    return [ScanItem(
        category="ai_tools",
        tool_name="OpenAI CLI",
        install_path=path,
        confidence="high",
    )]


def _detect_codex() -> list[ScanItem]:
    path = shutil.which("codex")
    if not path:
        return []
    return [ScanItem(
        category="ai_tools",
        tool_name="Codex",
        install_path=path,
        confidence="high",
    )]
