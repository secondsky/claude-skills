# Systematic Debugging Skill

Four-phase debugging framework ensuring root cause investigation before attempting fixes.

## Overview

This skill enforces a disciplined approach to debugging that prioritizes understanding over quick fixes. Random fixes waste time and create new bugs. Quick patches mask underlying issues. The core principle: ALWAYS find root cause before attempting fixes.

## The Four Phases

1. **Root Cause Investigation** - Read errors, reproduce, check changes, gather evidence
2. **Pattern Analysis** - Find working examples, compare against references, identify differences
3. **Hypothesis and Testing** - Form single hypothesis, test minimally, verify
4. **Implementation** - Create failing test, implement single fix, verify solution

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

- ANY technical issue (test failures, bugs, unexpected behavior)
- Under time pressure (when guessing is tempting)
- "Just one quick fix" seems obvious
- Previous fix didn't work
- You don't fully understand the issue

## Red Flags - STOP

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)

## Auto-Trigger Keywords

- debugging methodology
- root cause investigation
- systematic debugging
- bug investigation
- test failure analysis
- scientific debugging
- evidence-based fixes
- hypothesis testing

## Source

Adapted from [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills)
