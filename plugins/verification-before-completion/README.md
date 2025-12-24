# Verification Before Completion Skill

Run verification commands and confirm output before claiming success.

## Overview

This skill enforces evidence-based completion claims. Claiming work is complete without verification is dishonesty, not efficiency. The core principle: Evidence before claims, always.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

1. **IDENTIFY** - What command proves this claim?
2. **RUN** - Execute the FULL command (fresh, complete)
3. **READ** - Full output, check exit code, count failures
4. **VERIFY** - Does output confirm the claim?
5. **ONLY THEN** - Make the claim

Skip any step = lying, not verifying.

## When to Use

- About to claim tests pass, build succeeds, or work is complete
- Before committing, pushing, or creating PRs
- Moving to next task
- Any statement suggesting success/completion
- Expressing satisfaction with work

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- ANY wording implying success without running verification

## Common Verification Commands

```bash
bun test          # or: npm test
bun run build     # or: npm run build
bun run lint      # or: npm run lint
bunx tsc --noEmit # or: npx tsc --noEmit
```

## Auto-Trigger Keywords

- completion verification
- evidence-based claims
- verification gates
- test verification
- build verification
- pre-commit checks
- success claims
- completion claims

## Source

Adapted from [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills)
