#!/usr/bin/env python3
"""Validate the radar JSONL database with only the Python standard library."""

from __future__ import annotations

import argparse
import json
import math
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCHEMA = ROOT / "schemas" / "paper.schema.json"
DEFAULT_DATABASE = ROOT / "data" / "papers.jsonl"


class ValidationError(Exception):
    pass


def fail(path: str, message: str) -> None:
    raise ValidationError(f"{path}: {message}")


def matches_type(value: Any, expected: str) -> bool:
    if expected == "null":
        return value is None
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    return True


def validate_format(value: str, format_name: str, path: str) -> None:
    if format_name == "date":
        try:
            date.fromisoformat(value)
        except ValueError as exc:
            fail(path, f"invalid ISO date {value!r}: {exc}")
    elif format_name == "uri":
        parsed = urlparse(value)
        if not parsed.scheme or not (parsed.netloc or parsed.scheme == "file"):
            fail(path, f"invalid URI {value!r}")


def validate(value: Any, schema: dict[str, Any], path: str = "$") -> None:
    expected = schema.get("type")
    if expected is not None:
        choices = expected if isinstance(expected, list) else [expected]
        if not any(matches_type(value, choice) for choice in choices):
            fail(path, f"expected type {choices}, got {type(value).__name__}")

    if "enum" in schema and value not in schema["enum"]:
        fail(path, f"value {value!r} is not in enum {schema['enum']}")

    if isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            fail(path, "string is shorter than minLength")
        if "format" in schema:
            validate_format(value, schema["format"], path)

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if not math.isfinite(value):
            fail(path, "number must be finite")
        if "minimum" in schema and value < schema["minimum"]:
            fail(path, f"number is below minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            fail(path, f"number is above maximum {schema['maximum']}")

    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            fail(path, "array is shorter than minItems")
        if schema.get("uniqueItems"):
            serialized = [json.dumps(item, sort_keys=True, ensure_ascii=False) for item in value]
            if len(serialized) != len(set(serialized)):
                fail(path, "array items are not unique")
        if "items" in schema:
            for index, item in enumerate(value):
                validate(item, schema["items"], f"{path}[{index}]")

    if isinstance(value, dict):
        required = schema.get("required", [])
        for key in required:
            if key not in value:
                fail(path, f"missing required property {key!r}")

        properties = schema.get("properties", {})
        additional = schema.get("additionalProperties", True)
        for key, item in value.items():
            child_path = f"{path}.{key}"
            if key in properties:
                validate(item, properties[key], child_path)
            elif additional is False:
                fail(child_path, "additional property is not allowed")
            elif isinstance(additional, dict):
                validate(item, additional, child_path)


def validate_database(schema_path: Path, database_path: Path) -> int:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    seen_ids: set[str] = set()
    count = 0

    for line_number, raw_line in enumerate(database_path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw_line.strip():
            continue
        try:
            record = json.loads(raw_line)
        except json.JSONDecodeError as exc:
            fail(f"line {line_number}", f"invalid JSON: {exc}")

        validate(record, schema, f"line {line_number}")
        paper_id = record["id"]
        if paper_id in seen_ids:
            fail(f"line {line_number}.id", f"duplicate paper id {paper_id!r}")
        seen_ids.add(paper_id)
        count += 1

    return count


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    args = parser.parse_args()

    try:
        count = validate_database(args.schema, args.database)
    except (OSError, json.JSONDecodeError, ValidationError) as exc:
        print(f"validation failed: {exc}")
        return 1

    print(f"validation passed: {count} paper records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

