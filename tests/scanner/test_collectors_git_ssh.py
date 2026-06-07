"""Tests for scanner.collectors.git_ssh."""
import configparser
import tempfile
import os
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open
import pytest
from scanner.collectors import git_ssh
from scanner.models import ScanItem


def test_git_config_returns_scan_item_with_user_fields(tmp_path):
    """When ~/.gitconfig exists with [user] section, returns ScanItem with user_name and user_email."""
    gitconfig = tmp_path / ".gitconfig"
    gitconfig.write_text("[user]\n    name = Test User\n    email = test@example.com\n")

    with patch("scanner.collectors.git_ssh.Path") as mock_path_cls:
        mock_home = MagicMock()
        mock_path_cls.home.return_value = mock_home
        # Make Path(str) return a real Path for normal construction
        mock_path_cls.side_effect = lambda x: Path(x)
        mock_path_cls.home.return_value = tmp_path

        # Use real configparser reading the real file
        result = git_ssh._detect_git_config(tmp_path)

    assert len(result) == 1
    item = result[0]
    assert isinstance(item, ScanItem)
    assert item.category == "git_ssh"
    assert item.tool_name == "git_config"
    assert item.metadata["user_name"] == "Test User"
    assert item.metadata["user_email"] == "test@example.com"


def test_git_config_missing_returns_empty(tmp_path):
    """When ~/.gitconfig does not exist, _detect_git_config returns []."""
    result = git_ssh._detect_git_config(tmp_path)  # no .gitconfig in tmp_path
    assert result == []


def test_ssh_keys_returns_only_private_keys(tmp_path):
    """~/.ssh/ key listing returns filenames of non-.pub files only."""
    ssh_dir = tmp_path / ".ssh"
    ssh_dir.mkdir()
    (ssh_dir / "id_ed25519").write_text("PRIVATE KEY CONTENT")
    (ssh_dir / "id_ed25519.pub").write_text("PUBLIC KEY CONTENT")
    (ssh_dir / "id_rsa").write_text("PRIVATE RSA CONTENT")
    (ssh_dir / "id_rsa.pub").write_text("PUBLIC RSA CONTENT")
    (ssh_dir / "known_hosts").write_text("hosts")

    result = git_ssh._detect_ssh_keys(tmp_path)

    assert len(result) == 1
    item = result[0]
    assert item.category == "git_ssh"
    assert item.tool_name == "ssh_keys"
    key_files = item.metadata["key_files"]
    assert "id_ed25519" in key_files
    assert "id_rsa" in key_files
    assert "id_ed25519.pub" not in key_files
    assert "id_rsa.pub" not in key_files


def test_ssh_dir_missing_returns_empty(tmp_path):
    """When ~/.ssh/ does not exist, _detect_ssh_keys returns []."""
    result = git_ssh._detect_ssh_keys(tmp_path)
    assert result == []


def test_collect_returns_scan_items_with_real_home():
    """collect({}) uses real home dir — just checks it returns list[ScanItem]."""
    result = git_ssh.collect({})
    assert isinstance(result, list)
    for item in result:
        assert isinstance(item, ScanItem)
        assert item.category == "git_ssh"


def test_collect_with_no_gitconfig_or_ssh_returns_list(tmp_path):
    """When home dir has no .gitconfig or .ssh/, collect returns [] without exception."""
    with patch("scanner.collectors.git_ssh.Path") as mock_path_cls:
        mock_path_cls.home.return_value = tmp_path
        mock_path_cls.side_effect = lambda x: Path(x)
        result = git_ssh.collect({})
    assert isinstance(result, list)
