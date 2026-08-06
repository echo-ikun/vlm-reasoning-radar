#!/usr/bin/env python3
"""Validate deep-analysis JSON files with the repository's zero-dependency validator."""

from __future__ import annotations

import json
from pathlib import Path

from validate_radar import ValidationError, validate


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCHEMA = ROOT / "schemas" / "analysis.schema.json"
DEFAULT_DIRECTORY = ROOT / "data" / "analyses"


def validate_analyses(schema_path: Path = DEFAULT_SCHEMA, directory: Path = DEFAULT_DIRECTORY) -> dict[str, dict]:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    analyses: dict[str, dict] = {}
    for path in sorted(directory.glob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        validate(record, schema, path.name)
        paper_id = record["paper_id"]
        if paper_id in analyses:
            raise ValidationError(f"{path.name}: duplicate paper_id {paper_id!r}")
        analyses[paper_id] = record
    return analyses


def main() -> int:
    try:
        analyses = validate_analyses()
    except (OSError, json.JSONDecodeError, ValidationError) as exc:
        print(f"analysis validation failed: {exc}")
        return 1
    print(f"analysis validation passed: {len(analyses)} deep reads")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
