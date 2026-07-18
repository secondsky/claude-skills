# Plans

This directory holds **hand-authored, multi-phase engineering plans** for substantial pieces of work in this repo.

## How this differs from `.zcode/plans/`

| Directory | Purpose | Authoring |
|---|---|---|
| `.zcode/plans/` | Session-scoped plans auto-managed by the ZCode CLI during an interactive planning turn (`plan-sess_<uuid>.md`) | Auto-generated, ephemeral |
| `plans/` (here) | Long-lived, human/agent-authored engineering plans covering a project-sized effort, broken into one orchestration doc + phased subplans | Hand-authored, version-controlled |

## Structure convention

Each plan is a directory named after the work it describes:

```
plans/
└── <effort-name>/
    ├── ORCHESTRATION.md       # Master doc: vision, decisions, phase index, guardrails
    ├── phase-1-<topic>.md     # One file per phase, ordered by dependency
    ├── phase-2-<topic>.md
    └── ...
```

Each phase doc is self-contained and states its **depends-on** at the top so phases can be executed in dependency order, not strictly sequentially.

## Style

- Terse, first-person, engineering-focused (matching `.zcode/plans/` voice).
- Every plan ends with a **"Things I will NOT do"** section listing explicit guardrails.
- No marketing voice (that belongs in `README.md`).

## Current plans

- [`cybersecurity-skill/`](cybersecurity-skill/ORCHESTRATION.md) — Plan to fuse 7 paid-tool-dependent cybersecurity skills (from skills.sh) plus selected Aradotso dev-security skills into a single OSS-only `cybersecurity` plugin with progressive disclosure.
