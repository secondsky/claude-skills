#!/usr/bin/env python3
"""Validate YAML frontmatter in every SKILL.md under plugins/.

Exit 0 if all frontmatter parses cleanly, exit 1 otherwise — safe to run in CI.
"""
import os
import re
import sys

import yaml


def main() -> int:
    broken = []
    total = 0
    for root, _, files in os.walk("plugins"):
        for fname in files:
            if fname != "SKILL.md":
                continue
            total += 1
            path = os.path.join(root, fname)
            with open(path) as fp:
                content = fp.read()
            m = re.match(r"^---\n(.*?)\n---\n", content, re.DOTALL)
            if not m:
                broken.append((path, "missing frontmatter delimiters"))
                continue
            try:
                yaml.safe_load(m.group(1))
            except yaml.YAMLError as e:
                first = str(e).split("\n")[0]
                broken.append((path, first))

    if broken:
        print(f"::error::Invalid YAML frontmatter in {len(broken)}/{total} SKILL.md files:")
        for path, err in broken:
            print(f"  {path}")
            print(f"    → {err}")
        return 1

    print(f"All {total} SKILL.md frontmatter blocks parse cleanly.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
