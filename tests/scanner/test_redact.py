"""Tests for scanner.redact — parse_env_keys and redact_if_needed."""
import tempfile
import os
import pytest
from scanner.redact import parse_env_keys, redact_if_needed


def test_parse_env_keys_returns_keys_only():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".env", delete=False) as f:
        f.write("KEY1=value1\nKEY2=value2\n")
        path = f.name
    try:
        result = parse_env_keys(path)
        assert result == ["KEY1", "KEY2"]
        # Values must never appear in output
        for key in result:
            assert "value" not in key
    finally:
        os.unlink(path)


def test_parse_env_keys_ignores_comments():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".env", delete=False) as f:
        f.write("# This is a comment\nKEY1=value1\n# Another comment\nKEY2=value2\n")
        path = f.name
    try:
        result = parse_env_keys(path)
        assert result == ["KEY1", "KEY2"]
        assert len(result) == 2
    finally:
        os.unlink(path)


def test_parse_env_keys_missing_file():
    result = parse_env_keys("/nonexistent/path/.env")
    assert result == []


def test_redact_if_needed_redacts_secret():
    # 40-char base64-like string — matches _SECRET_PATTERN (32+ chars)
    secret = "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    result = redact_if_needed(secret, context="test_key")
    assert result == "REDACTED"


def test_redact_if_needed_passes_short():
    result = redact_if_needed("hello", context="test_key")
    assert result == "hello"


def test_redact_if_needed_logs_warning(caplog):
    import logging
    secret = "A" * 40  # 40-char all-alpha string matches pattern
    with caplog.at_level(logging.WARNING, logger="scanner.redact"):
        result = redact_if_needed(secret, context="SOME_KEY")
    assert result == "REDACTED"
    assert any("SECRET_LIKE_VALUE_REDACTED" in r.message for r in caplog.records)
    # Ensure the secret value itself never appears in any log record
    for record in caplog.records:
        assert secret not in record.message
