"""Tests for scanner.collectors.ides."""
from __future__ import annotations
from unittest.mock import patch, MagicMock
from pathlib import Path
import subprocess
import pytest
from scanner.collectors import ides
from scanner.models import ScanItem


def _mock_run_with_version(version_str: str):
    mock = MagicMock()
    mock.returncode = 0
    mock.stdout = f"{version_str}\n"
    return mock


def test_cursor_detected_with_version():
    """When 'cursor' is on PATH and returns version, ScanItem has correct fields."""
    with patch("scanner.collectors.ides.shutil") as mock_shutil, \
         patch("scanner.collectors.ides.subprocess") as mock_proc:
        mock_shutil.which.side_effect = lambda name: (
            "/usr/bin/cursor" if name == "cursor" else None
        )
        mock_proc.run.return_value = _mock_run_with_version("3.6.31")
        mock_proc.TimeoutExpired = subprocess.TimeoutExpired
        result = ides.collect({})

    cursor_items = [i for i in result if i.tool_name == "Cursor"]
    assert len(cursor_items) == 1
    item = cursor_items[0]
    assert item.category == "ides"
    assert item.install_path == "/usr/bin/cursor"
    assert item.version == "3.6.31"


def test_cursor_metadata_has_config_path():
    """Cursor ScanItem has config_path in metadata."""
    with patch("scanner.collectors.ides.shutil") as mock_shutil, \
         patch("scanner.collectors.ides.subprocess") as mock_proc:
        mock_shutil.which.side_effect = lambda name: (
            "/usr/bin/cursor" if name == "cursor" else None
        )
        mock_proc.run.return_value = _mock_run_with_version("3.6.31")
        mock_proc.TimeoutExpired = subprocess.TimeoutExpired
        result = ides.collect({})

    cursor_items = [i for i in result if i.tool_name == "Cursor"]
    assert len(cursor_items) == 1
    assert "config_path" in cursor_items[0].metadata


def test_vscode_detected():
    """When 'code' is on PATH, returns ScanItem for VS Code."""
    with patch("scanner.collectors.ides.shutil") as mock_shutil, \
         patch("scanner.collectors.ides.subprocess") as mock_proc:
        mock_shutil.which.side_effect = lambda name: (
            "/usr/bin/code" if name == "code" else None
        )
        mock_proc.run.return_value = _mock_run_with_version("1.122.1")
        mock_proc.TimeoutExpired = subprocess.TimeoutExpired
        result = ides.collect({})

    vscode_items = [i for i in result if i.tool_name == "VS Code"]
    assert len(vscode_items) == 1
    assert vscode_items[0].category == "ides"
    assert vscode_items[0].version == "1.122.1"


def test_zed_detected():
    """When 'zed' is on PATH, returns ScanItem for Zed."""
    with patch("scanner.collectors.ides.shutil") as mock_shutil, \
         patch("scanner.collectors.ides.subprocess") as mock_proc:
        mock_shutil.which.side_effect = lambda name: (
            str(Path.home() / ".local" / "bin" / "zed") if name == "zed" else None
        )
        mock_proc.run.return_value = _mock_run_with_version("1.4.4")
        mock_proc.TimeoutExpired = subprocess.TimeoutExpired
        result = ides.collect({})

    zed_items = [i for i in result if i.tool_name == "Zed"]
    assert len(zed_items) == 1
    assert zed_items[0].category == "ides"


def test_antigravity_detected_with_none_version_on_timeout():
    """Antigravity: if version command times out, version=None and needs_review=True."""
    with patch("scanner.collectors.ides.shutil") as mock_shutil, \
         patch("scanner.collectors.ides.subprocess") as mock_proc:
        mock_shutil.which.side_effect = lambda name: (
            "/usr/bin/antigravity" if name == "antigravity" else None
        )
        mock_proc.TimeoutExpired = subprocess.TimeoutExpired
        mock_proc.run.side_effect = subprocess.TimeoutExpired(cmd="antigravity", timeout=3)
        result = ides.collect({})

    anti_items = [i for i in result if i.tool_name == "Antigravity"]
    assert len(anti_items) == 1
    assert anti_items[0].version is None
    assert anti_items[0].needs_review is True
    assert anti_items[0].confidence == "medium"


def test_empty_when_no_ides_found():
    """When no IDE binaries are on PATH, collect() returns []."""
    with patch("scanner.collectors.ides.shutil") as mock_shutil:
        mock_shutil.which.return_value = None
        result = ides.collect({})
    assert result == []


def test_all_items_are_scan_items_and_category_ides():
    """All returned items are ScanItem with category='ides'."""
    with patch("scanner.collectors.ides.shutil") as mock_shutil, \
         patch("scanner.collectors.ides.subprocess") as mock_proc:
        mock_shutil.which.return_value = "/usr/bin/something"
        mock_proc.run.return_value = _mock_run_with_version("1.0")
        mock_proc.TimeoutExpired = subprocess.TimeoutExpired
        result = ides.collect({})
    assert all(isinstance(item, ScanItem) for item in result)
    assert all(item.category == "ides" for item in result)
