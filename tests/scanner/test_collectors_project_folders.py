"""Tests for scanner.collectors.project_folders — RED state except empty_approved_folders test."""
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
from scanner.collectors import project_folders
from scanner.models import ScanItem


def test_empty_approved_folders_returns_no_items():
    """When approved_folders is empty, collector returns []. This MUST pass with stub."""
    result = project_folders.collect({"approved_folders": []})
    assert result == []


def test_items_detected_under_approved_roots():
    """When approved_folders contains a valid path with subdirs, returns ScanItems."""
    mock_subdir = MagicMock(spec=Path)
    mock_subdir.is_dir.return_value = True
    mock_subdir.name = "my-project"
    mock_subdir.__str__ = lambda s: "/home/martin/Projects/my-project"

    mock_root = MagicMock(spec=Path)
    mock_root.expanduser.return_value = mock_root
    mock_root.resolve.return_value = mock_root
    mock_root.exists.return_value = True
    mock_root.iterdir.return_value = [mock_subdir]

    with patch("pathlib.Path.__new__", return_value=mock_root):
        result = project_folders.collect({"approved_folders": ["/home/martin/Projects"]})

    # RED: stub returns [] — will fail until Wave 2/3 implementation
    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    assert result[0].category == "project_folders"
