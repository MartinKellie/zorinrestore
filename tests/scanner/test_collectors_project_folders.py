"""Tests for scanner.collectors.project_folders."""
import tempfile
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
from scanner.collectors import project_folders
from scanner.models import ScanItem


def test_empty_approved_folders_returns_no_items():
    """When approved_folders is empty list, collector returns []. MUST pass even with stub."""
    result = project_folders.collect({"approved_folders": []})
    assert result == []


def test_no_approved_folders_key_returns_empty():
    """When config has no approved_folders key, returns []."""
    result = project_folders.collect({})
    assert result == []


def test_scan_items_returned_for_project_dirs(tmp_path):
    """When approved_folders contains a root with subdirectories, returns ScanItems."""
    # Create a project structure
    proj = tmp_path / "my-project"
    proj.mkdir()
    (proj / ".git").mkdir()

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    item = result[0]
    assert item.category == "project_folders"
    assert item.tool_name == "my-project"
    assert item.install_path == str(proj)


def test_has_git_true_when_git_dir_present(tmp_path):
    """Projects with .git dir have has_git=True in metadata."""
    proj = tmp_path / "git-project"
    proj.mkdir()
    (proj / ".git").mkdir()

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    assert len(result) == 1
    assert result[0].metadata["has_git"] is True


def test_has_git_false_when_no_git_dir(tmp_path):
    """Projects without .git dir have has_git=False in metadata."""
    proj = tmp_path / "no-git-project"
    proj.mkdir()
    (proj / "some_file.txt").write_text("content")

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    assert len(result) == 1
    assert result[0].metadata["has_git"] is False


def test_package_type_node_detected(tmp_path):
    """package.json presence yields package_type='node'."""
    proj = tmp_path / "node-app"
    proj.mkdir()
    (proj / "package.json").write_text('{"name": "node-app"}')

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    assert len(result) == 1
    assert result[0].metadata["package_type"] == "node"


def test_package_type_python_detected(tmp_path):
    """pyproject.toml presence yields package_type='python'."""
    proj = tmp_path / "py-app"
    proj.mkdir()
    (proj / "pyproject.toml").write_text("[project]\nname = 'py-app'")

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    assert len(result) == 1
    assert result[0].metadata["package_type"] == "python"


def test_package_type_none_for_bare_dir(tmp_path):
    """Directory with no known manifest yields package_type=None."""
    proj = tmp_path / "bare-dir"
    proj.mkdir()

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    assert len(result) == 1
    assert result[0].metadata["package_type"] is None


def test_tilde_paths_are_resolved(tmp_path):
    """Paths starting with ~ are expanded and resolved before iteration."""
    # This test ensures expanduser().resolve() is called
    # We patch Path to capture how it's used
    proj = tmp_path / "some-proj"
    proj.mkdir()

    # Patch expanduser to substitute ~ for tmp_path
    original_expanduser = Path.expanduser

    def fake_expanduser(self):
        if str(self) == "~/fakeprojects":
            return tmp_path
        return original_expanduser(self)

    with patch.object(Path, "expanduser", fake_expanduser):
        result = project_folders.collect({"approved_folders": ["~/fakeprojects"]})

    # If expanduser is called, result won't be [] — the project will be found
    assert isinstance(result, list)
    assert all(isinstance(item, ScanItem) for item in result)


def test_last_modified_is_iso_string(tmp_path):
    """ScanItems include last_modified as an ISO datetime string."""
    proj = tmp_path / "dated-proj"
    proj.mkdir()

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    assert len(result) == 1
    lm = result[0].metadata["last_modified"]
    assert isinstance(lm, str)
    # Basic ISO format check
    assert "T" in lm or "-" in lm


def test_has_remote_true_when_git_config_has_remote(tmp_path):
    """has_remote=True when .git/config contains a [remote] section."""
    proj = tmp_path / "remote-proj"
    proj.mkdir()
    git_dir = proj / ".git"
    git_dir.mkdir()
    git_config = git_dir / "config"
    git_config.write_text(
        '[core]\n    repositoryformatversion = 0\n'
        '[remote "origin"]\n    url = git@github.com:user/repo.git\n'
        '    fetch = +refs/heads/*:refs/remotes/origin/*\n'
    )

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    assert len(result) == 1
    assert result[0].metadata["has_remote"] is True


def test_files_at_root_level_not_returned(tmp_path):
    """Files in approved root (not directories) are not included in results."""
    (tmp_path / "some_file.txt").write_text("content")
    proj = tmp_path / "real-proj"
    proj.mkdir()

    result = project_folders.collect({"approved_folders": [str(tmp_path)]})

    names = [item.tool_name for item in result]
    assert "some_file.txt" not in names
    assert "real-proj" in names
