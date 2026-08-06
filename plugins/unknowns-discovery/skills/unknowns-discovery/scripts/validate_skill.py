#!/usr/bin/env python3
"""Validate the basic structure of an Agent Skill directory."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        raise ValueError("SKILL.md must start with YAML frontmatter delimited by ---")
    end = text.find("\n---", 4)
    if end == -1:
        raise ValueError("SKILL.md frontmatter is missing closing ---")
    raw = text[4:end].strip().splitlines()
    body = text[end + len("\n---"):]
    data: dict[str, str] = {}
    current_key: str | None = None
    for line in raw:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line.startswith(" ") and ":" in line:
            key, value = line.split(":", 1)
            current_key = key.strip()
            data[current_key] = value.strip().strip('"')
        elif current_key:
            continue
    return data, body


def validate(skill_dir: Path) -> list[str]:
    errors: list[str] = []
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        return [f"Missing {skill_md}"]
    text = skill_md.read_text(encoding="utf-8")
    try:
        meta, body = parse_frontmatter(text)
    except ValueError as exc:
        return [str(exc)]
    name = meta.get("name", "")
    desc = meta.get("description", "")
    if not name:
        errors.append("frontmatter.name is required")
    elif not NAME_RE.match(name):
        errors.append("frontmatter.name must use lowercase letters, numbers, and single hyphens")
    elif name != skill_dir.name:
        errors.append(f"frontmatter.name ({name}) should match parent directory ({skill_dir.name})")
    if not desc:
        errors.append("frontmatter.description is required")
    elif len(desc) > 1024:
        errors.append(f"frontmatter.description is too long ({len(desc)} > 1024)")
    if len(body.splitlines()) > 500:
        errors.append("SKILL.md body should stay under 500 lines for progressive disclosure")
    for link in LINK_RE.findall(body):
        if "://" in link or link.startswith("#") or link.startswith("mailto:"):
            continue
        target = (skill_dir / link).resolve()
        try:
            target.relative_to(skill_dir.resolve())
        except ValueError:
            errors.append(f"local link escapes skill directory: {link}")
            continue
        if not target.exists():
            errors.append(f"broken local link in SKILL.md: {link}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a basic Agent Skill directory.")
    parser.add_argument("skill_dir", type=Path)
    args = parser.parse_args()
    errors = validate(args.skill_dir)
    if errors:
        print("Skill validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1
    print("Skill validation passed")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
