#!/usr/bin/env python3
"""Generate a starter Unknowns Discovery artifact.

This helper is deterministic. It does not call an AI model; it creates a Markdown
scaffold that an agent or human can fill in.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path

MODES = [
    "unknowns-matrix",
    "blindspot-pass",
    "teach-me-my-unknowns",
    "brainstorm-prototype",
    "mock-before-wire",
    "option-space-brainstorm",
    "one-question-interview",
    "reference-semantics-map",
    "tweakable-plan",
    "implementation-notes",
    "buy-in-doc",
    "merge-readiness-quiz",
]


def slug(text: str) -> str:
    out, prev_dash = [], False
    for ch in text.lower():
        if ch.isalnum():
            out.append(ch); prev_dash = False
        elif not prev_dash:
            out.append("-"); prev_dash = True
    return "".join(out).strip("-") or "task"


def header(task: str, mode: str, domain: str) -> str:
    return f"# {mode.replace('-', ' ').title()}: {task}\n\nGenerated: {datetime.now(timezone.utc).isoformat()}\nDomain: {domain}\n\n"


def matrix(task: str, domain: str) -> str:
    return header(task, "unknowns-matrix", domain) + """## Known knowns
| Fact / requirement | Source | Must preserve? |
|---|---|---:|
| {task} | user request | yes |

## Known unknowns
| Question | Why it matters | Resolution path | Owner | Needed before implementation? |
|---|---|---|---|---:|
| What constraints are not in the prompt? | May change approach | blindspot pass / inspect territory | agent | yes |

## Unknown knowns
| Tacit criterion | How to make it visible | Artifact |
|---|---|---|
| What the user will recognize as good | show alternatives | prototype/mock/plan |

## Unknown unknown candidates
| Area | Why hidden risk may exist | Discovery method | Severity guess |
|---|---|---|---|
| Code/history/domain prior art | Prior failed attempts or hidden conventions may exist | search files/docs/issues | medium |
| Data/permissions/stakeholders | Invisible rules may alter implementation | inspect policies/tests/reviewers | high |
| UX/taste/output shape | User may need to react, not specify | prototype/interview | medium |

## Highest-blast-radius unknown
[Fill in after inspection.]

## Recommended artifact mode
[Choose one: {modes}]
""".format(task=task, modes=", ".join(MODES))


def artifact(task: str, mode: str, domain: str) -> str:
    if mode == "unknowns-matrix":
        return matrix(task, domain)
    h = header(task, mode, domain)
    if mode == "blindspot-pass":
        return h + """## Scope to inspect
- Paths/docs/links:
- Search terms:
- Prior work:

## Blindspots
| # | Name | Type | Severity | Evidence | Why it bites | Prompt upgrade |
|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |

## Better prompt
```text
[Rewrite implementation prompt with blindspots folded in.]
```
"""
    if mode == "teach-me-my-unknowns":
        return h + """## Mental model
[Explain the domain.]

## Vocabulary ladder
| Term | Plain meaning | Why it matters | Prompt phrase |
|---|---|---|---|
|  |  |  |  |

## Prompts I can now write
1. ```text
   [Improved prompt]
   ```
"""
    if mode in {"brainstorm-prototype", "mock-before-wire"}:
        return h + """## Shared data/scenario
[Hold this constant across variants.]

## Directions / mock states
| Direction/state | Philosophy | What to steal | What to skip | Unknown exposed |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

## Reaction template
```text
Chosen direction:
Steal:
Skip:
Change:
```
"""
    if mode == "option-space-brainstorm":
        return h + """## Option space
| # | Intervention | Existing leverage point | Effort | Impact | Risk | Unknown |
|---|---|---|---|---|---|---|
| 1 |  |  | XS |  |  |  |
| 2 |  |  | S |  |  |  |
| 3 |  |  | M |  |  |  |
| 4 |  |  | L |  |  |  |
"""
    if mode == "one-question-interview":
        return h + """## Current question
[Ask exactly one question.]

## Why this matters
[Explain what changes based on the answer.]

## Decisions so far
| Decision | Answer | Impact |
|---|---|---|
|  |  |  |
"""
    if mode == "reference-semantics-map":
        return h + """## Reference inspected
- Reference:
- Target:

## Behavior map
| Behavior | Reference evidence | Target mapping | Test/invariant |
|---|---|---|---|
|  |  |  |  |
"""
    if mode == "tweakable-plan":
        return h + """## A. Decisions you may want to change
| Decision | Default | Alternative | Tradeoff | One-line override |
|---|---|---|---|---|
|  |  |  |  |  |

## B. Execution order
1. 
2. 

## C. Mechanical work
- 
"""
    if mode == "implementation-notes":
        return h + """## Summary counters
- Entries: 0
- Deviations: 0
- Needs human judgment: 0

## Log
### [time] Deviation: [Name]
- What the plan said:
- What the code revealed:
- Conservative choice:
- Revisit:
"""
    if mode == "buy-in-doc":
        return h + """## Demo / result

## Ask

## Reviewer objections answered
| Objection | Answer | Evidence |
|---|---|---|
|  |  |  |

## Sign-offs
| Person/team | What they approve | Status |
|---|---|---|
|  |  |  |
"""
    if mode == "merge-readiness-quiz":
        return h + """## Mental model
### Before

### After

## What changed
| Area | Change | Why |
|---|---|---|
|  |  |  |

## Quiz
### Question 1
- Correct answer:
- Why it matters:
- Reread if missed:

## Pass criteria
[Define pass criteria.]
"""
    raise ValueError(f"Unknown mode: {mode}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate an Unknowns Discovery Markdown artifact scaffold.")
    parser.add_argument("--task", required=True, help="Task name or short description")
    parser.add_argument("--mode", choices=MODES, default="unknowns-matrix")
    parser.add_argument("--domain", default="general")
    parser.add_argument("--out", help="Output file path. Defaults to ./<mode>-<task>.md")
    args = parser.parse_args()
    out = Path(args.out) if args.out else Path(f"{args.mode}-{slug(args.task)}.md")
    out.write_text(artifact(args.task, args.mode, args.domain), encoding="utf-8")
    print(out)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
