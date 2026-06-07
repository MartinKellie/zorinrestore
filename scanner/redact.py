"""Scanner secret redaction — parse_env_keys and redact_if_needed."""
import re
import logging

_SECRET_PATTERN = re.compile(r'^[A-Za-z0-9+/=_\-]{32,}$')
_ENV_KEY_PATTERN = re.compile(r'^([A-Za-z_][A-Za-z0-9_]*)=')

logger = logging.getLogger(__name__)


def parse_env_keys(filepath: str) -> list[str]:
    """Return only variable names from a .env file. Values are never read or stored."""
    keys: list[str] = []
    try:
        with open(filepath, "r", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = _ENV_KEY_PATTERN.match(line)
                if m:
                    keys.append(m.group(1))
    except OSError as e:
        logger.warning("FOLDER_INACCESSIBLE path=%s error=%s", filepath, e)
    return keys


def redact_if_needed(value: str, context: str = "") -> str:
    """Replace value with 'REDACTED' if it looks like a secret. Logs a warning with context only."""
    if _SECRET_PATTERN.match(value):
        logger.warning("SECRET_LIKE_VALUE_REDACTED context=%s", context)
        return "REDACTED"
    return value
