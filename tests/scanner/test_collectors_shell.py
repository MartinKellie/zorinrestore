"""Tests for scanner.collectors.shell — RED state (stubs return [])."""
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
from scanner.collectors import shell
from scanner.models import ScanItem


def test_shell_collector_returns_scan_items_when_bash_found():
    """When bash binary exists, collector returns at least one ScanItem."""
    with patch("shutil.which", return_value="/bin/bash"), \
         patch.object(Path, "exists", return_value=True):
        result = shell.collect({})
    # RED: stub returns [] — will fail until Wave 2/3 implementation
    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    assert result[0].category == "shell"


def test_shell_collector_returns_empty_when_nothing_found():
    """When no shell is found, collector returns []."""
    with patch("shutil.which", return_value=None), \
         patch.object(Path, "exists", return_value=False):
        result = shell.collect({})
    assert result == []
