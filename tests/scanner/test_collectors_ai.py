"""Tests for scanner.collectors.ai_tools."""
from __future__ import annotations
from unittest.mock import patch, MagicMock
from pathlib import Path
import pytest
from scanner.collectors import ai_tools
from scanner.models import ScanItem


def test_claude_code_detected_when_on_path():
    """When 'claude' binary is on PATH via shutil.which, returns ScanItem for Claude Code CLI."""
    with patch("scanner.collectors.ai_tools.shutil") as mock_shutil, \
         patch.object(Path, "exists", return_value=False):
        mock_shutil.which.side_effect = lambda name: (
            "/usr/local/bin/claude" if name == "claude" else None
        )
        result = ai_tools.collect({})
    assert len(result) >= 1
    assert result[0].tool_name == "Claude Code CLI"
    assert result[0].category == "ai_tools"
    assert result[0].install_path == "/usr/local/bin/claude"


def test_claude_code_metadata_has_skills_dir():
    """Claude Code CLI ScanItem has skills_dir and has_skills in metadata."""
    with patch("scanner.collectors.ai_tools.shutil") as mock_shutil, \
         patch.object(Path, "exists", return_value=False):
        mock_shutil.which.side_effect = lambda name: (
            "/usr/local/bin/claude" if name == "claude" else None
        )
        result = ai_tools.collect({})
    assert len(result) >= 1
    item = result[0]
    assert "skills_dir" in item.metadata
    assert "has_skills" in item.metadata
    assert isinstance(item.metadata["has_skills"], bool)


def test_claude_code_fallback_path_used_when_not_on_path():
    """When shutil.which returns None but fallback path exists, still returns ScanItem."""
    fallback = Path.home() / ".local" / "bin" / "claude"

    def fake_exists(self):
        return str(self) == str(fallback)

    with patch("scanner.collectors.ai_tools.shutil") as mock_shutil, \
         patch.object(Path, "exists", fake_exists):
        mock_shutil.which.return_value = None
        result = ai_tools.collect({})

    claude_items = [i for i in result if i.tool_name == "Claude Code CLI"]
    assert len(claude_items) == 1
    assert claude_items[0].install_path == str(fallback)


def test_claude_desktop_detected_when_config_exists():
    """When claude_desktop_config.json exists, returns ScanItem for Claude Desktop."""
    config_path = Path.home() / ".config" / "Claude" / "claude_desktop_config.json"

    def fake_exists(self):
        return str(self) == str(config_path)

    with patch("scanner.collectors.ai_tools.shutil") as mock_shutil, \
         patch.object(Path, "exists", fake_exists):
        mock_shutil.which.return_value = None
        result = ai_tools.collect({})

    desktop_items = [i for i in result if i.tool_name == "Claude Desktop"]
    assert len(desktop_items) == 1
    assert desktop_items[0].category == "ai_tools"
    assert desktop_items[0].install_path == str(config_path.parent)


def test_empty_when_nothing_found():
    """When no AI tools are found, collect() returns []."""
    with patch("scanner.collectors.ai_tools.shutil") as mock_shutil, \
         patch.object(Path, "exists", return_value=False):
        mock_shutil.which.return_value = None
        result = ai_tools.collect({})
    assert result == []


def test_openai_cli_detected():
    """When 'openai' is on PATH, returns ScanItem for OpenAI CLI."""
    with patch("scanner.collectors.ai_tools.shutil") as mock_shutil, \
         patch.object(Path, "exists", return_value=False):
        mock_shutil.which.side_effect = lambda name: (
            "/usr/local/bin/openai" if name == "openai" else None
        )
        result = ai_tools.collect({})
    openai_items = [i for i in result if i.tool_name == "OpenAI CLI"]
    assert len(openai_items) == 1
    assert openai_items[0].category == "ai_tools"


def test_codex_detected():
    """When 'codex' is on PATH, returns ScanItem for Codex."""
    with patch("scanner.collectors.ai_tools.shutil") as mock_shutil, \
         patch.object(Path, "exists", return_value=False):
        mock_shutil.which.side_effect = lambda name: (
            "/usr/local/bin/codex" if name == "codex" else None
        )
        result = ai_tools.collect({})
    codex_items = [i for i in result if i.tool_name == "Codex"]
    assert len(codex_items) == 1
    assert codex_items[0].category == "ai_tools"


def test_all_items_are_scan_items():
    """All returned items are ScanItem instances."""
    with patch("scanner.collectors.ai_tools.shutil") as mock_shutil, \
         patch.object(Path, "exists", return_value=False):
        mock_shutil.which.side_effect = lambda name: "/usr/local/bin/" + name
        result = ai_tools.collect({})
    assert all(isinstance(item, ScanItem) for item in result)
