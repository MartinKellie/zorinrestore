"""Tests for scanner.api — fetch_config and upload_payload."""
import json
import urllib.error
from unittest.mock import patch, MagicMock
import pytest
from scanner.api import fetch_config, upload_payload


def test_fetch_config_returns_empty_on_failure():
    with patch("urllib.request.urlopen", side_effect=Exception("connection refused")):
        result = fetch_config(token="test-token", app_url="https://example.com")
    assert result == {"approved_folders": [], "approved_commands": []}


def test_upload_payload_returns_true_on_200():
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.__enter__ = lambda s: s
    mock_response.__exit__ = MagicMock(return_value=False)

    with patch("urllib.request.urlopen", return_value=mock_response):
        result = upload_payload(
            payload={"items": []},
            token="test-token",
            app_url="https://example.com",
        )
    assert result is True


def test_upload_payload_returns_false_on_401():
    http_error = urllib.error.HTTPError(
        url="https://example.com/api/scanner/upload",
        code=401,
        msg="Unauthorized",
        hdrs=None,
        fp=None,
    )
    with patch("urllib.request.urlopen", side_effect=http_error):
        result = upload_payload(
            payload={"items": []},
            token="bad-token",
            app_url="https://example.com",
        )
    assert result is False


def test_token_invalid_warning_logged(caplog):
    import logging
    http_error = urllib.error.HTTPError(
        url="https://example.com/api/scanner/upload",
        code=401,
        msg="Unauthorized",
        hdrs=None,
        fp=None,
    )
    with patch("urllib.request.urlopen", side_effect=http_error):
        with caplog.at_level(logging.WARNING, logger="scanner.api"):
            upload_payload(
                payload={"items": []},
                token="bad-token",
                app_url="https://example.com",
            )
    assert any("TOKEN_INVALID_OR_REVOKED" in r.message for r in caplog.records)
