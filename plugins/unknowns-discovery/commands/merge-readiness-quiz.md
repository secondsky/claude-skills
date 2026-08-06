---
name: unknowns-discovery:merge-readiness-quiz
description: Create a merge-readiness report and quiz for an important or complex change
argument-hint: "[change-or-diff]"
allowed-tools: [Read, Glob, Grep]
---

# Merge Readiness Quiz

Use the Unknowns Discovery skill in `merge-readiness-quiz` mode.

## Invocation

```text
/unknowns-discovery:merge-readiness-quiz [change-or-diff]
```

## Arguments

The user invoked this command with: $ARGUMENTS

## Instructions

When this command is invoked:

1. Treat `$ARGUMENTS` as the target change, diff, branch, PR notes, or file path.
2. Load `skills/unknowns-discovery/SKILL.md` and follow the `merge-readiness-quiz` mode.
3. Inspect the relevant files and diff context before writing the report.
4. Explain what changed, why it matters, what risks remain, and what the human must understand before merging.
5. Include quiz questions with pass criteria.

## Output

Produce the skill's merge-readiness report and quiz. Do not edit implementation files unless the user separately asks for fixes.
