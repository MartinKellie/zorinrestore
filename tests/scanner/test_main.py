"""Tests for scanner.__main__ — CLI harness."""
import io
import subprocess
import sys
from unittest.mock import patch, MagicMock
import pytest


def test_help_exits_zero():
    result = subprocess.run(
        [sys.executable, "-m", "scanner", "--help"],
        capture_output=True,
        cwd="/home/martin/Projects/zorinpackages",
    )
    assert result.returncode == 0


def test_missing_token_exits_one():
    env = {"PATH": "/usr/bin:/bin"}  # no SCANNER_TOKEN, no SCANNER_APP_URL
    result = subprocess.run(
        [sys.executable, "-m", "scanner", "scan"],
        capture_output=True,
        env=env,
        cwd="/home/martin/Projects/zorinpackages",
    )
    assert result.returncode == 1
    assert b"SCANNER_TOKEN" in result.stderr


def test_stdout_exactly_three_lines():
    """Mocked full scan run should print exactly 3 stdout lines."""
    from scanner import __main__

    collector_patch_targets = [
        "scanner.__main__.ai_tools",
        "scanner.__main__.ides",
        "scanner.__main__.package_managers",
        "scanner.__main__.git_ssh",
        "scanner.__main__.shell",
        "scanner.__main__.project_folders",
        "scanner.__main__.env_files",
    ]

    mock_collector = MagicMock()
    mock_collector.collect.return_value = []

    captured = io.StringIO()

    with patch("scanner.__main__.fetch_config", return_value={}), \
         patch("scanner.__main__.upload_payload", return_value=True), \
         patch("scanner.__main__.ai_tools", mock_collector), \
         patch("scanner.__main__.ides", mock_collector), \
         patch("scanner.__main__.package_managers", mock_collector), \
         patch("scanner.__main__.git_ssh", mock_collector), \
         patch("scanner.__main__.shell", mock_collector), \
         patch("scanner.__main__.project_folders", mock_collector), \
         patch("scanner.__main__.env_files", mock_collector), \
         patch("scanner.__main__.load_config", return_value=("tok", "https://example.com")), \
         patch("sys.stdout", captured), \
         patch("sys.argv", ["scanner", "scan"]):
        __main__.main()

    lines = [l for l in captured.getvalue().splitlines() if l.strip()]
    assert len(lines) == 3, f"Expected 3 stdout lines, got {len(lines)}: {lines}"
    assert lines[0] == "Scan started"
    assert lines[1] == "Scan complete \u2014 0 items found"
    assert lines[2] == "Upload successful"


def test_failed_upload_exits_one():
    """When upload_payload returns False, main() should exit with code 1."""
    from scanner import __main__
    mock_collector = MagicMock()
    mock_collector.collect.return_value = []

    with patch("scanner.__main__.fetch_config", return_value={}), \
         patch("scanner.__main__.upload_payload", return_value=False), \
         patch("scanner.__main__.ai_tools", mock_collector), \
         patch("scanner.__main__.ides", mock_collector), \
         patch("scanner.__main__.package_managers", mock_collector), \
         patch("scanner.__main__.git_ssh", mock_collector), \
         patch("scanner.__main__.shell", mock_collector), \
         patch("scanner.__main__.project_folders", mock_collector), \
         patch("scanner.__main__.env_files", mock_collector), \
         patch("scanner.__main__.load_config", return_value=("tok", "https://example.com")), \
         patch("sys.argv", ["scanner", "scan"]):
        with pytest.raises(SystemExit) as exc_info:
            __main__.main()
    assert exc_info.value.code == 1


def test_collector_failure_is_logged_not_fatal():
    """A collector that raises Exception should be caught; scan continues."""
    from scanner import __main__
    import logging

    failing_collector = MagicMock()
    failing_collector.collect.side_effect = RuntimeError("simulated crash")
    ok_collector = MagicMock()
    ok_collector.collect.return_value = []

    captured_stdout = io.StringIO()

    with patch("scanner.__main__.fetch_config", return_value={}), \
         patch("scanner.__main__.upload_payload", return_value=True), \
         patch("scanner.__main__.ai_tools", failing_collector), \
         patch("scanner.__main__.ides", ok_collector), \
         patch("scanner.__main__.package_managers", ok_collector), \
         patch("scanner.__main__.git_ssh", ok_collector), \
         patch("scanner.__main__.shell", ok_collector), \
         patch("scanner.__main__.project_folders", ok_collector), \
         patch("scanner.__main__.env_files", ok_collector), \
         patch("scanner.__main__.load_config", return_value=("tok", "https://example.com")), \
         patch("sys.stdout", captured_stdout), \
         patch("sys.argv", ["scanner", "scan"]):
        # Should NOT raise even though one collector fails
        __main__.main()

    # Scan completes despite collector failure
    output = captured_stdout.getvalue()
    assert "Scan started" in output
    assert "Upload successful" in output
