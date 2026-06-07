"""Tests for scanner.collectors.ides — RED state (stubs return [])."""
from unittest.mock import patch, MagicMock
from pathlib import Path
import pytest
from scanner.collectors import ides
from scanner.models import ScanItem


def test_ides_collector_returns_scan_items_when_cursor_found():
    """When 'cursor' binary is on PATH, collector returns at least one ScanItem."""
    with patch("shutil.which", return_value="/usr/bin/cursor"):
        result = ides.collect({})
    # RED: stub returns [] — will fail until Wave 2/3 implementation
    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    assert result[0].category == "ides"


def test_ides_collector_returns_empty_when_nothing_found():
    """When no IDEs are found, collector returns []."""
    with patch("shutil.which", return_value=None), \
         patch.object(Path, "exists", return_value=False):
        result = ides.collect({})
    assert result == []
