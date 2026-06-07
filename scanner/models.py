"""Scanner data models — ScanItem and ScanPayload dataclasses."""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ScanItem:
    category: str        # "ai_tools"|"ides"|"package_managers"|"git_ssh"|"shell"|"project_folders"|"env_files"|"_warnings"
    tool_name: str
    version: Optional[str] = None
    install_path: Optional[str] = None
    confidence: str = "high"   # "high"|"medium"|"low"
    needs_review: bool = False
    metadata: dict = field(default_factory=dict)


@dataclass
class ScanPayload:
    machine_hostname: str
    machine_os: str
    scanner_version: str
    scanned_at: str              # ISO 8601 UTC
    items: list[ScanItem]
    machine_kernel: Optional[str] = None
    machine_arch: Optional[str] = None
    python_version: Optional[str] = None
