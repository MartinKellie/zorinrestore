"""Scanner configuration — loads SCANNER_TOKEN and SCANNER_APP_URL from environment."""
import os
import sys


def load_config() -> tuple[str, str]:
    token = os.environ.get("SCANNER_TOKEN", "")
    app_url = os.environ.get("SCANNER_APP_URL", "")
    if not token:
        print("ERROR: SCANNER_TOKEN not set", file=sys.stderr)
        sys.exit(1)
    if not app_url:
        print("ERROR: SCANNER_APP_URL not set", file=sys.stderr)
        sys.exit(1)
    return token, app_url
