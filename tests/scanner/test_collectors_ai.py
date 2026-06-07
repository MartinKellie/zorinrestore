"""Tests for scanner.collectors.ai_tools — RED state (stubs return [])."""
from unittest.mock import patch, MagicMock
from pathlib import Path
import pytest
from scanner.collectors import ai_tools
from scanner.models import ScanItem


def test_ai_collector_returns_scan_items_when_claude_on_path():
    """When 'claude' binary is on PATH, collector returns at least one ScanItem."""
    with patch("shutil.which", return_value="/usr/local/bin/claude"), \
         patch.object(Path, "exists", return_value=False):
        result = ai_tools.collect({})
    # RED: stub returns [] — will fail until Wave 2/3 implementation
    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    assert result[0].category == "ai_tools"


def test_ai_collector_returns_empty_when_nothing_found():
    """When no AI tools are found, collector returns []."""
    with patch("shutil.which", return_value=None), \
         patch.object(Path, "exists", return_value=False):
        result = ai_tools.collect({})
    assert result == []
