---
name: unknowns-discovery:blindspot-pass
description: Run a focused blindspot pass for unfamiliar, ambiguous, or high-risk work
argument-hint: "[task-or-area]"
allowed-tools: [Read, Glob, Grep, Write, Edit]
---

# Blindspot Pass

Use the Unknowns Discovery skill in `blindspot-pass` mode.

## Invocation

```text
/unknowns-discovery:blindspot-pass [task-or-area]
```

## Arguments

The user invoked this command with: $ARGUMENTS

## Instructions

When this command is invoked:

1. Treat `$ARGUMENTS` as the task, code area, design area, or domain to inspect.
2. Load `skills/unknowns-discovery/SKILL.md` and follow the `blindspot-pass` mode.
3. Read relevant files, docs, examples, history, or references before asking questions.
4. Surface hidden constraints, prior art, likely traps, tacit quality standards, and missing vocabulary.
5. End with a better implementation prompt that folds in the discoveries.

## Output

Produce blindspot cards plus the upgraded prompt described by the skill.
