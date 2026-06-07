"""Tests for scanner.collectors.git_ssh — RED state (stubs return [])."""
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
from scanner.collectors import git_ssh
from scanner.models import ScanItem


def test_git_ssh_collector_returns_scan_items_when_git_config_exists():
    """When ~/.gitconfig exists, collector returns at least one ScanItem."""
    with patch.object(Path, "exists", return_value=True), \
         patch("configparser.ConfigParser") as mock_cp:
        mock_cp.return_value.read.return_value = None
        mock_cp.return_value.__getitem__ = MagicMock(
            return_value={"name": "MartinKellie", "email": "martin@example.com"}
        )
        result = git_ssh.collect({})
    # RED: stub returns [] — will fail until Wave 2/3 implementation
    assert len(result) >= 1
    assert all(isinstance(item, ScanItem) for item in result)
    assert result[0].category == "git_ssh"


def test_git_ssh_collector_returns_empty_when_nothing_found():
    """When no git config or SSH keys exist, collector returns []."""
    with patch.object(Path, "exists", return_value=False), \
         patch("pathlib.Path.iterdir", side_effect=OSError):
        result = git_ssh.collect({})
    assert result == []
