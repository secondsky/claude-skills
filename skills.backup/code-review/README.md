# Code Review Skill

Technical rigor and evidence-based practices for code review workflows.

## Overview

This skill guides proper code review practices emphasizing technical correctness over social comfort, evidence-based claims, and verification before completion. It covers receiving feedback, requesting reviews, and implementing verification gates.

## Core Practices

1. **Receiving Feedback** - Technical evaluation over performative agreement
2. **Requesting Reviews** - Systematic review via code-reviewer subagent
3. **Verification Gates** - Evidence before any completion claims

## When to Use

- Receiving code review comments (unclear or technically questionable)
- Completing tasks or major features requiring review
- Before making any completion/success claims
- Before committing, pushing, or creating PRs
- Subagent-driven development workflows

## Key Principles

- **NO performative agreement** - No "Great point!" or "You're absolutely right!"
- **Verify before implementing** - Check suggestions against codebase reality
- **Evidence before claims** - Run verification commands, read output, THEN claim
- **Push back when wrong** - Technical correctness over social comfort

## Reference Files

- `references/code-review-reception.md` - Receiving feedback protocol
- `references/requesting-code-review.md` - How to request reviews
- `references/verification-before-completion.md` - Verification gates

## Auto-Trigger Keywords

- code review
- pull request review
- technical feedback
- verification gates
- completion claims
- subagent review
- merge requirements
- evidence-based development

## Source

Adapted from [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills)
