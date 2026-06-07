"""Tests for scanner.collectors.shell."""
import os
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
from scanner.collectors import shell
from scanner.models import ScanItem


def test_shell_detects_bash_with_config_file(tmp_path):
    """When SHELL=/bin/bash and ~/.bashrc exists, returns ScanItem with correct tool_name and config_file."""
    bashrc = tmp_path / ".bashrc"
    bashrc.write_text("# bash config")

    with patch.dict(os.environ, {"SHELL": "/bin/bash"}), \
         patch("scanner.collectors.shell.Path") as mock_path_cls:
        mock_path_cls.home.return_value = tmp_path
        mock_path_cls.side_effect = lambda x: Path(x)

        result = shell.collect({})

    assert len(result) == 1
    item = result[0]
    assert isinstance(item, ScanItem)
    assert item.category == "shell"
    assert item.tool_name == "bash"
    assert item.install_path == "/bin/bash"
    assert item.metadata["config_file"] is not None
    assert "bashrc" in item.metadata["config_file"]
    assert item.metadata["last_modified"] is not None


def test_shell_detects_zsh_with_zshrc(tmp_path):
    """When SHELL=/usr/bin/zsh and ~/.zshrc exists, returns ScanItem with tool_name=zsh."""
    zshrc = tmp_path / ".zshrc"
    zshrc.write_text("# zsh config")

    with patch.dict(os.environ, {"SHELL": "/usr/bin/zsh"}), \
         patch("scanner.collectors.shell.Path") as mock_path_cls:
        mock_path_cls.home.return_value = tmp_path
        mock_path_cls.side_effect = lambda x: Path(x)

        result = shell.collect({})

    assert len(result) == 1
    item = result[0]
    assert item.category == "shell"
    assert item.tool_name == "zsh"


def test_shell_no_config_file_found(tmp_path):
    """When SHELL is set but no config file exists, still returns ScanItem with config_file=None."""
    with patch.dict(os.environ, {"SHELL": "/bin/bash"}), \
         patch("scanner.collectors.shell.Path") as mock_path_cls:
        mock_path_cls.home.return_value = tmp_path
        mock_path_cls.side_effect = lambda x: Path(x)

        result = shell.collect({})

    assert len(result) == 1
    item = result[0]
    assert item.tool_name == "bash"
    assert item.metadata["config_file"] is None


def test_shell_missing_env_returns_unknown():
    """When SHELL env var is not set, returns ScanItem with tool_name='unknown' and needs_review=True."""
    env = {k: v for k, v in os.environ.items() if k != "SHELL"}
    with patch.dict(os.environ, env, clear=True):
        result = shell.collect({})

    assert len(result) == 1
    item = result[0]
    assert item.tool_name == "unknown"
    assert item.needs_review is True


def test_shell_collect_returns_list():
    """collect({}) always returns a list of ScanItems without raising."""
    result = shell.collect({})
    assert isinstance(result, list)
    for item in result:
        assert isinstance(item, ScanItem)
        assert item.category == "shell"
