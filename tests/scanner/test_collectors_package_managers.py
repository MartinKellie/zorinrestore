"""Tests for scanner.collectors.package_managers."""
from __future__ import annotations
import sys
import platform
from unittest.mock import patch, MagicMock
import pytest
from scanner.collectors import package_managers
from scanner.models import ScanItem


def _mock_run_with_version(version_str: str):
    mock = MagicMock()
    mock.returncode = 0
    mock.stdout = f"{version_str}\n"
    return mock


def test_node_detected_with_version():
    """When 'node' is on PATH and returns version, ScanItem has correct fields."""
    with patch("scanner.collectors.package_managers.shutil") as mock_shutil, \
         patch("scanner.collectors.package_managers.subprocess") as mock_proc:
        mock_shutil.which.side_effect = lambda name: (
            "/usr/bin/node" if name == "node" else None
        )
        mock_proc.run.return_value = _mock_run_with_version("v24.14.1")
        result = package_managers.collect({})

    node_items = [i for i in result if i.tool_name == "node"]
    assert len(node_items) == 1
    assert node_items[0].category == "package_managers"
    assert node_items[0].install_path == "/usr/bin/node"
    assert node_items[0].version == "v24.14.1"


def test_python_always_emitted():
    """Python ScanItem is always in result even when all other package managers absent."""
    with patch("scanner.collectors.package_managers.shutil") as mock_shutil:
        mock_shutil.which.return_value = None
        result = package_managers.collect({})

    python_items = [i for i in result if i.tool_name == "python"]
    assert len(python_items) == 1
    assert python_items[0].category == "package_managers"
    assert python_items[0].version == platform.python_version()
    assert python_items[0].install_path == sys.executable


def test_python_item_confidence_high():
    """Python ScanItem has confidence='high' and correct install_path."""
    with patch("scanner.collectors.package_managers.shutil") as mock_shutil:
        mock_shutil.which.return_value = None
        result = package_managers.collect({})

    python_items = [i for i in result if i.tool_name == "python"]
    assert python_items[0].confidence == "high"
    assert python_items[0].install_path == sys.executable


def test_pnpm_detected():
    """When 'pnpm' is on PATH, returns ScanItem for pnpm."""
    with patch("scanner.collectors.package_managers.shutil") as mock_shutil, \
         patch("scanner.collectors.package_managers.subprocess") as mock_proc:
        mock_shutil.which.side_effect = lambda name: (
            "/usr/local/bin/pnpm" if name == "pnpm" else None
        )
        mock_proc.run.return_value = _mock_run_with_version("9.15.4")
        result = package_managers.collect({})

    pnpm_items = [i for i in result if i.tool_name == "pnpm"]
    assert len(pnpm_items) == 1
    assert pnpm_items[0].version == "9.15.4"


def test_uv_detected():
    """When 'uv' is on PATH, returns ScanItem for uv."""
    with patch("scanner.collectors.package_managers.shutil") as mock_shutil, \
         patch("scanner.collectors.package_managers.subprocess") as mock_proc:
        mock_shutil.which.side_effect = lambda name: (
            "/home/user/.local/bin/uv" if name == "uv" else None
        )
        mock_proc.run.return_value = _mock_run_with_version("uv 0.5.0 (abc123)")
        result = package_managers.collect({})

    uv_items = [i for i in result if i.tool_name == "uv"]
    assert len(uv_items) == 1


def test_all_items_are_scan_items():
    """All returned items are ScanItem instances with category='package_managers'."""
    with patch("scanner.collectors.package_managers.shutil") as mock_shutil, \
         patch("scanner.collectors.package_managers.subprocess") as mock_proc:
        mock_shutil.which.return_value = "/usr/bin/something"
        mock_proc.run.return_value = _mock_run_with_version("1.0")
        result = package_managers.collect({})
    assert all(isinstance(item, ScanItem) for item in result)
    assert all(item.category == "package_managers" for item in result)


def test_only_python_when_nothing_else_found():
    """When no package managers found, result contains exactly python entry."""
    with patch("scanner.collectors.package_managers.shutil") as mock_shutil:
        mock_shutil.which.return_value = None
        result = package_managers.collect({})
    # Python is always present
    assert len(result) == 1
    assert result[0].tool_name == "python"
