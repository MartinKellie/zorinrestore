"""Tests for scanner.collectors.env_files."""
import json
import tempfile
import os
from pathlib import Path
from unittest.mock import patch
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
    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    assert result[0].category == "env_files"


def test_no_values_in_metadata():
    """Values from .env files must NEVER appear in ScanItem metadata. Security critical."""
    with tempfile.TemporaryDirectory() as tmpdir:
        env_path = os.path.join(tmpdir, ".env")
        secret = "sk-ant-api03-" + "x" * 50
        with open(env_path, "w") as f:
            f.write(f"SECRET_KEY={secret}\nAPI_KEY=another_secret_value\n")
        result = env_files.collect({"approved_folders": [tmpdir]})

    # Collector must return at least one item (the .env was found)
    assert len(result) >= 1
    # Check no values leaked into any part of the ScanItem
    for item in result:
        metadata_str = json.dumps(item.metadata)
        assert secret not in metadata_str, "Secret value leaked into metadata"
        assert "another_secret_value" not in metadata_str, "Value leaked into metadata"
    # Only variable names should be present
    assert result[0].metadata["variable_names"] == ["SECRET_KEY", "API_KEY"]


def test_empty_approved_folders_returns_no_items():
    """When approved_folders is empty, collector returns []."""
    result = env_files.collect({"approved_folders": []})
    assert result == []


def test_no_approved_folders_key_returns_empty():
    """When config has no approved_folders key, returns []."""
    result = env_files.collect({})
    assert result == []


def test_variable_names_extracted_correctly():
    """Returned ScanItems have metadata with correct variable_names list."""
    with tempfile.TemporaryDirectory() as tmpdir:
        env_path = os.path.join(tmpdir, ".env")
        with open(env_path, "w") as f:
            f.write("DATABASE_URL=postgres://localhost/mydb\nREDIS_URL=redis://localhost\n")
        result = env_files.collect({"approved_folders": [tmpdir]})

    assert len(result) == 1
    item = result[0]
    assert "DATABASE_URL" in item.metadata["variable_names"]
    assert "REDIS_URL" in item.metadata["variable_names"]
    # Values must not appear
    assert "postgres://localhost/mydb" not in str(item.metadata)
    assert "redis://localhost" not in str(item.metadata)


def test_env_file_in_subdirectory_is_found():
    """Collector finds .env files in subdirectories of approved_folders."""
    with tempfile.TemporaryDirectory() as tmpdir:
        subdir = os.path.join(tmpdir, "subproject")
        os.makedirs(subdir)
        env_path = os.path.join(subdir, ".env")
        with open(env_path, "w") as f:
            f.write("SUBDIR_KEY=subdir_value\n")
        result = env_files.collect({"approved_folders": [tmpdir]})

    assert len(result) >= 1
    all_var_names = [name for item in result for name in item.metadata["variable_names"]]
    assert "SUBDIR_KEY" in all_var_names


def test_no_env_files_returns_empty():
    """When approved_folders has no .env files, returns []."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create some non-.env files
        with open(os.path.join(tmpdir, "readme.txt"), "w") as f:
            f.write("not an env file")
        result = env_files.collect({"approved_folders": [tmpdir]})
    assert result == []


def test_env_file_scan_item_has_correct_category():
    """ScanItems for env_files always have category='env_files'."""
    with tempfile.TemporaryDirectory() as tmpdir:
        env_path = os.path.join(tmpdir, ".env")
        with open(env_path, "w") as f:
            f.write("SOME_KEY=some_value\n")
        result = env_files.collect({"approved_folders": [tmpdir]})

    assert all(item.category == "env_files" for item in result)


def test_comments_and_blank_lines_ignored():
    """Comments and blank lines in .env files are not treated as keys."""
    with tempfile.TemporaryDirectory() as tmpdir:
        env_path = os.path.join(tmpdir, ".env")
        with open(env_path, "w") as f:
            f.write("# This is a comment\n\nREAL_KEY=real_value\n")
        result = env_files.collect({"approved_folders": [tmpdir]})

    assert len(result) == 1
    assert result[0].metadata["variable_names"] == ["REAL_KEY"]
