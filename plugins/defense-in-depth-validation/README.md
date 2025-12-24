# Defense-in-Depth Validation Skill

Validate at every layer data passes through to make bugs structurally impossible.

## Overview

This skill teaches adding validation at multiple system layers instead of a single checkpoint. By validating at entry points, business logic, environment guards, and with debug instrumentation, bugs become impossible to reproduce rather than just "fixed."

## The Four Layers

1. **Entry Point Validation** - Reject obviously invalid input at API boundary
2. **Business Logic Validation** - Ensure data makes sense for operations
3. **Environment Guards** - Prevent dangerous operations in specific contexts
4. **Debug Instrumentation** - Capture context for forensics

## When to Use

- Invalid data causes failures deep in execution
- Bug fix required at multiple system layers
- Single validation point proves insufficient
- Need to make bugs structurally impossible
- Refactoring code paths that bypass existing checks

## Key Insight

Single validation: "We fixed the bug"
Multiple layers: "We made the bug impossible"

Different layers catch different cases - entry validation catches most bugs, business logic catches edge cases, environment guards prevent context-specific dangers.

## Auto-Trigger Keywords

- data validation
- input sanitization
- defense in depth
- bug prevention
- layer validation
- structural bugs
- validation patterns
- security boundaries

## Source

Adapted from [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills)
