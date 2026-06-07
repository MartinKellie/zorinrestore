"""Scanner configuration — loads SCANNER_TOKEN and SCANNER_APP_URL from environment.

Checks environment first, then falls back to .env.local in the repo root
so the scanner works from the project directory without manual exports.
"""
import os
import sys
from pathlib import Path


def _load_dotenv_local() -> None:
    """Parse .env.local and set any missing vars into os.environ."""
    env_file = Path(__file__).parent.parent / ".env.local"
    if not env_file.exists():
        return
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            # Only set if not already in environment
            if key and key not in os.environ:
                os.environ[key] = value


def load_config() -> tuple[str, str]:
    _load_dotenv_local()
    token = os.environ.get("SCANNER_TOKEN", "")
    app_url = os.environ.get("SCANNER_APP_URL", "")
    if not token:
        print("ERROR: SCANNER_TOKEN not set", file=sys.stderr)
        sys.exit(1)
    if not app_url:
        print("ERROR: SCANNER_APP_URL not set", file=sys.stderr)
        sys.exit(1)
    return token, app_url
