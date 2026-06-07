"""Scanner API layer — fetch_config and upload_payload using urllib.request (stdlib, zero deps)."""
import json
import logging
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)


def fetch_config(token: str, app_url: str) -> dict:
    """GET /api/scanner/config — returns {approved_folders: [...], approved_commands: [...]}.

    On any exception: logs CONFIG_FETCH_FAILED warning and returns empty safe defaults.
    """
    url = f"{app_url.rstrip('/')}/api/scanner/config"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        logger.warning("CONFIG_FETCH_FAILED error=%s", e)
        return {"approved_folders": [], "approved_commands": []}


def upload_payload(payload: dict, token: str, app_url: str) -> bool:
    """POST /api/scanner/upload — returns True on 200.

    401 → logs TOKEN_INVALID_OR_REVOKED and returns False.
    Other errors → logs UPLOAD_FAILED and returns False.
    """
    url = f"{app_url.rstrip('/')}/api/scanner/upload"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status == 200
    except urllib.error.HTTPError as e:
        if e.code == 401:
            logger.warning("TOKEN_INVALID_OR_REVOKED status=401")
        else:
            logger.warning("UPLOAD_FAILED status=%s", e.code)
        return False
    except Exception as e:
        logger.warning("UPLOAD_FAILED error=%s", e)
        return False
