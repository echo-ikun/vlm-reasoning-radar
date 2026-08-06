#!/usr/bin/env python3
"""Build static data artifacts for the GitHub Pages radar site."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from email.utils import format_datetime
from html import escape
from pathlib import Path

from validate_radar import DEFAULT_DATABASE, DEFAULT_SCHEMA, validate_database
from validate_analyses import validate_analyses


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
DIGESTS = ROOT / "digests"
SITE_URL = "https://echo-ikun.github.io/vlm-reasoning-radar/"
REPO_URL = "https://github.com/echo-ikun/vlm-reasoning-radar"


def load_papers() -> list[dict]:
    rows = []
    for line in DEFAULT_DATABASE.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return sorted(rows, key=lambda row: (row.get("submitted") or "", row["title"]), reverse=True)


def section(markdown: str, heading: str) -> list[str]:
    lines = markdown.splitlines()
    start = next((index + 1 for index, line in enumerate(lines) if line.strip() == heading), None)
    if start is None:
        return []
    result = []
    for line in lines[start:]:
        if line.startswith("## "):
            break
        result.append(line)
    return result


def latest_digest_payload() -> dict:
    files = sorted(path for path in DIGESTS.glob("*.md") if path.name != "TEMPLATE.md")
    if not files:
        return {"date": None, "bullets": [], "signals": [], "github_url": REPO_URL}

    path = files[-1]
    markdown = path.read_text(encoding="utf-8")
    judgment = [
        line[2:].strip()
        for line in section(markdown, "## 今日判断")
        if line.startswith("- ")
    ]

    signal_lines = section(markdown, "## Research Opportunity Signals")
    signals = []
    for line in signal_lines:
        if line.startswith("### "):
            signals.append(line[4:].strip())

    return {
        "date": path.stem,
        "bullets": judgment[:4],
        "signals": signals[:3],
        "github_url": f"{REPO_URL}/blob/main/digests/{path.name}",
    }


def build_feed(digests: list[Path]) -> str:
    items = []
    for path in reversed(digests[-20:]):
        markdown = path.read_text(encoding="utf-8")
        bullets = [line[2:].strip() for line in section(markdown, "## 今日判断") if line.startswith("- ")]
        description = " ".join(bullets[:2]) or "VLM Reasoning Radar daily digest"
        try:
            published = datetime.fromisoformat(path.stem).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        link = f"{REPO_URL}/blob/main/digests/{path.name}"
        items.append(
            "\n".join(
                [
                    "    <item>",
                    f"      <title>VLM Reasoning Radar — {escape(path.stem)}</title>",
                    f"      <link>{escape(link)}</link>",
                    f"      <guid>{escape(link)}</guid>",
                    f"      <pubDate>{format_datetime(published)}</pubDate>",
                    f"      <description>{escape(description)}</description>",
                    "    </item>",
                ]
            )
        )

    return "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<rss version="2.0">',
            "  <channel>",
            "    <title>VLM Reasoning Radar</title>",
            f"    <link>{SITE_URL}</link>",
            "    <description>Daily research signals for grounded multimodal reasoning.</description>",
            "    <language>zh-cn</language>",
            *items,
            "  </channel>",
            "</rss>",
            "",
        ]
    )


def main() -> int:
    count = validate_database(DEFAULT_SCHEMA, DEFAULT_DATABASE)
    papers = load_papers()
    analyses = validate_analyses()
    for paper in papers:
        analysis = analyses.get(paper["id"])
        if analysis:
            paper["analysis"] = analysis
    campaigns = sorted({campaign for paper in papers for campaign in paper.get("campaigns", [])})
    verdict_counts = {
        verdict: sum(1 for paper in papers if paper.get("verdict") == verdict)
        for verdict in ("must-read", "watchlist", "rejected")
    }

    data_dir = SITE / "data"
    digest_dir = SITE / "digests"
    data_dir.mkdir(parents=True, exist_ok=True)
    digest_dir.mkdir(parents=True, exist_ok=True)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "paper_count": count,
        "deep_read_count": len(analyses),
        "campaigns": campaigns,
        "verdict_counts": verdict_counts,
        "latest_digest": latest_digest_payload(),
        "papers": papers,
    }
    (data_dir / "papers.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    digest_files = sorted(path for path in DIGESTS.glob("*.md") if path.name != "TEMPLATE.md")
    for old_file in digest_dir.glob("*.md"):
        old_file.unlink()
    for source in digest_files:
        shutil.copy2(source, digest_dir / source.name)

    (SITE / "feed.xml").write_text(build_feed(digest_files), encoding="utf-8")
    print(f"site data built: {count} papers, {len(digest_files)} digests")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
