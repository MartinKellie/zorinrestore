"""Tests for scanner.collectors.env_files — RED state (stubs return [])."""
import tempfile
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
from scanner.collectors import env_files
from scanner.models import ScanItem


def test_env_files_collector_returns_scan_items_when_env_found():
    """When .env files are found under approved_folders, returns ScanItems."""
    with tempfile.TemporaryDirectory() as tmpdir:
        env_path = os.path.join(tmpdir, ".env")
        with open(env_path, "w") as f:
            f.write("KEY1=value1\nKEY2=value2\n")
        result = env_files.collect({"approved_folders": [tmpdir]})
    # RED: stub returns [] — will fail until Wave 2/3 implementation
    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    assert result[0].category == "env_files"


def test_no_values_in_metadata():
    """Values must never appear in ScanItem.metadata. RED test."""
    with tempfile.TemporaryDirectory() as tmpdir:
        env_path = os.path.join(tmpdir, ".env")
        secret = "sk-ant-api03-" + "x" * 50
        with open(env_path, "w") as f:
            f.write(f"SECRET_KEY={secret}\nAPI_KEY=another_secret_value\n")
        result = env_files.collect({"approved_folders": [tmpdir]})

    # RED: stub returns [] so there are no metadata to check
    # Real implementation must pass this check
    for item in result:
        metadata_str = str(item.metadata)
        assert secret not in metadata_str, "Secret value leaked into metadata"
        assert "another_secret_value" not in metadata_str, "Value leaked into metadata"


def test_empty_approved_folders_returns_no_items():
    """When approved_folders is empty, collector returns []."""
    result = env_files.collect({"approved_folders": []})
    assert result == []
