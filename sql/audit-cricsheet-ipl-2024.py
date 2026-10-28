#!/usr/bin/env python3
"""Audit Cricsheet's downloadable IPL JSON archive for 2024 match coverage."""

import argparse
import hashlib
import json
import subprocess
import tempfile
import zipfile
from pathlib import Path


SOURCE_URL = "https://cricsheet.org/downloads/ipl_json.zip"
EXPECTED_LEAGUE_MATCH_NUMBERS = set(range(1, 71))


def download_archive(destination: Path) -> None:
    subprocess.run(
        [
            "curl",
            "--fail",
            "--location",
            "--silent",
            "--show-error",
            "--retry",
            "2",
            "--output",
            str(destination),
            SOURCE_URL,
        ],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--archive",
        type=Path,
        help="Use an existing Cricsheet IPL JSON zip instead of downloading it.",
    )
    args = parser.parse_args()

    temporary_directory = None
    archive_path = args.archive
    if archive_path is None:
        temporary_directory = tempfile.TemporaryDirectory(prefix="cricsheet-ipl-")
        archive_path = Path(temporary_directory.name) / "ipl_json.zip"
        download_archive(archive_path)

    try:
        archive_bytes = archive_path.read_bytes()
        numbered_matches = set()
        unnumbered_matches = 0
        matching_paths = []

        with zipfile.ZipFile(archive_path) as archive:
            json_paths = [
                name for name in archive.namelist()
                if name.lower().endswith(".json") and not name.endswith("/")
            ]
            for name in json_paths:
                match = json.loads(archive.read(name))
                info = match.get("info", {})
                event = info.get("event") or {}
                dates = info.get("dates") or []
                if (
                    event.get("name") != "Indian Premier League"
                    or not dates
                    or not str(dates[0]).startswith("2024-")
                ):
                    continue

                matching_paths.append(name)
                match_number = event.get("match_number")
                if isinstance(match_number, int):
                    numbered_matches.add(match_number)
                else:
                    unnumbered_matches += 1

        missing = sorted(EXPECTED_LEAGUE_MATCH_NUMBERS - numbered_matches)
        print(f"Source: {SOURCE_URL}")
        print(f"Archive SHA-256: {hashlib.sha256(archive_bytes).hexdigest()}")
        print(f"JSON files in archive: {len(json_paths)}")
        print(f"IPL match files dated 2024: {len(matching_paths)}")
        print(
            "Numbered league matches present: "
            f"{len(numbered_matches & EXPECTED_LEAGUE_MATCH_NUMBERS)}/70"
        )
        print(f"Missing league match numbers: {', '.join(map(str, missing)) or 'none'}")
        print(f"Unnumbered 2024 playoff match files: {unnumbered_matches}")
        print("Coverage is incomplete for a full-season streak result." if missing else "All 70 league matches are present.")
    finally:
        if temporary_directory is not None:
            temporary_directory.cleanup()


if __name__ == "__main__":
    main()
