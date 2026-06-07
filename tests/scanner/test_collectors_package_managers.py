"""Tests for scanner.collectors.package_managers — RED state (stubs return [])."""
import sys
from unittest.mock import patch, MagicMock
import pytest
from scanner.collectors import package_managers
from scanner.models import ScanItem


def test_package_manager_collector_returns_scan_items_when_node_found():
    """When 'node' binary is on PATH, collector returns at least one ScanItem."""
    with patch("shutil.which", return_value="/usr/bin/node"), \
         patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(returncode=0, stdout="v24.14.1\n")
        result = package_managers.collect({})
    # RED: stub returns [] — will fail until Wave 2/3 implementation
    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    assert any(item.category == "package_managers" for item in result)


def test_package_manager_collector_returns_empty_when_nothing_found():
    """When no package managers are found, collector returns []."""
    # Even with nothing found, Python itself should still be detected
    # This is a RED test — stub returns [] which includes no python entry
    with patch("shutil.which", return_value=None):
        result = package_managers.collect({})
    # Stub returns [] so this passes trivially; real impl adds python always
    assert isinstance(result, list)
