---
name: unknowns-discovery:discover-unknowns
description: Discover missing context, blindspots, and high-blast-radius unknowns before agent work
argument-hint: "[task-or-file]"
allowed-tools: [Read, Glob, Grep, Write, Edit]
---

# Discover Unknowns

Use the Unknowns Discovery skill to choose the cheapest useful unknowns artifact.

## Invocation

```text
/unknowns-discovery:discover-unknowns [task-or-file]
```

## Arguments

The user invoked this command with: $ARGUMENTS

## Instructions

When this command is invoked:

1. Treat `$ARGUMENTS` as the task, file path, area, or rough prompt to investigate.
2. If it looks like a file path, read it before asking questions.
3. Load `skills/unknowns-discovery/SKILL.md` and follow it exactly.
4. Inspect the relevant territory before asking the user anything that can be answered locally.
5. Select the highest-value artifact mode and produce the skill's normal output.

## Output

Use the skill's default output contract: scope read, unknowns found, blast radius, conservative defaults, decisions needed, prompt upgrade, and stop conditions.
