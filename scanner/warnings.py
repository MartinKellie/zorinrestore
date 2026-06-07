"""Scanner warning accumulator — ScanWarning dataclass and warning helpers."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class ScanWarning:
    code: str        # e.g. "TOKEN_INVALID", "FOLDER_INACCESSIBLE"
    message: str
    context: Optional[str] = None


_warnings: list[ScanWarning] = []


def add_warning(code: str, message: str, context: Optional[str] = None) -> None:
    _warnings.append(ScanWarning(code=code, message=message, context=context))


def get_warnings() -> list[ScanWarning]:
    return list(_warnings)


def clear_warnings() -> None:
    _warnings.clear()
