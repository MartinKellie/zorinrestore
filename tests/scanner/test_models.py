"""Tests for scanner.models — ScanItem and ScanPayload dataclasses."""
import dataclasses
import pytest
from scanner.models import ScanItem, ScanPayload


def test_scan_item_default_fields():
    item = ScanItem(category="ides", tool_name="Cursor")
    assert item.confidence == "high"
    assert item.needs_review is False
    assert item.metadata == {}
    assert item.version is None
    assert item.install_path is None


def test_scan_item_asdict_shape():
    item = ScanItem(category="ides", tool_name="Cursor")
    d = dataclasses.asdict(item)
    assert d == {
        "category": "ides",
        "tool_name": "Cursor",
        "version": None,
        "install_path": None,
        "confidence": "high",
        "needs_review": False,
        "metadata": {},
    }


def test_scan_payload_asdict():
    item = ScanItem(category="ai_tools", tool_name="Claude Code CLI", version="1.0.0")
    payload = ScanPayload(
        machine_hostname="zorin-box",
        machine_os="Linux 6.17.0",
        scanner_version="0.1.0",
        scanned_at="2026-06-07T15:00:00Z",
        items=[item],
    )
    d = dataclasses.asdict(payload)
    assert d["machine_hostname"] == "zorin-box"
    assert d["machine_os"] == "Linux 6.17.0"
    assert d["scanner_version"] == "0.1.0"
    assert isinstance(d["items"], list)
    assert len(d["items"]) == 1
    assert d["items"][0]["tool_name"] == "Claude Code CLI"
    # Optional fields default to None
    assert d["machine_kernel"] is None
    assert d["machine_arch"] is None
    assert d["python_version"] is None
