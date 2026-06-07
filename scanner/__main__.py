"""Scanner CLI entry point — python -m scanner scan."""
import argparse
import datetime
import logging
import platform
import sys
from dataclasses import asdict

logging.basicConfig(stream=sys.stderr, level=logging.WARNING, format="%(levelname)s %(message)s")

from scanner import __version__
from scanner.config import load_config
from scanner.api import fetch_config, upload_payload
from scanner.models import ScanPayload
from scanner.collectors import ai_tools, ides, package_managers, git_ssh, shell, project_folders, env_files


def main() -> None:
    parser = argparse.ArgumentParser(prog="scanner", description="Machine inventory scanner")
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("scan", help="Run a full machine scan and upload results")
    args = parser.parse_args()

    if args.command != "scan":
        parser.print_help()
        sys.exit(1)

    token, app_url = load_config()  # exits with error message if env vars missing

    print("Scan started")  # stdout line 1

    config = fetch_config(token, app_url)
    approved_folders = config.get("approved_folders", [])

    collectors = [ai_tools, ides, package_managers, git_ssh, shell, project_folders, env_files]
    all_items = []
    for collector in collectors:
        try:
            all_items.extend(collector.collect({"approved_folders": approved_folders}))
        except Exception as e:
            logging.warning("COLLECTOR_FAILED module=%s error=%s", getattr(collector, "__name__", repr(collector)), e)

    payload = ScanPayload(
        machine_hostname=platform.node(),
        machine_os=f"{platform.system()} {platform.release()}",
        machine_kernel=platform.release(),
        machine_arch=platform.machine(),
        scanner_version=__version__,
        python_version=platform.python_version(),
        scanned_at=datetime.datetime.now(datetime.UTC).isoformat(),
        items=all_items,
    )

    print(f"Scan complete \u2014 {len(all_items)} items found")  # stdout line 2

    payload_dict = asdict(payload)

    ok = upload_payload(payload_dict, token, app_url)

    if ok:
        print("Upload successful")  # stdout line 3
    else:
        print("Upload failed \u2014 check warnings above")
        sys.exit(1)


if __name__ == "__main__":
    main()
