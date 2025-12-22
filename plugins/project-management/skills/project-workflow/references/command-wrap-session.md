# /wrap-session - End-of-Session Checkpoint

## Overview

**Purpose:** Automate end-of-session workflow for safe handoffs

**When to use:**
- Context window getting full (>150k tokens)
- End of work session
- Before switching to different task
- Need to checkpoint progress

## What It Does

1. Uses Task agent to analyze current session state
2. Updates SESSION.md with:
   - Completed tasks
   - Current phase progress
   - Next Action (what to do when resuming)
   - Blockers/issues encountered
3. Detects and updates relevant docs (CHANGELOG.md, ARCHITECTURE.md, etc.)
4. Creates structured git checkpoint commit
5. Outputs formatted handoff summary
6. Optionally pushes to remote

## Time Savings

**2-3 minutes per wrap-up**

Eliminates manual session documentation and ensures safe context handoffs.

## Example Usage

```
User: /wrap-session
Claude: [Analyzes session work via Task agent]
Claude: [Updates SESSION.md with progress]
Claude: [Git commit: "checkpoint: Complete Phase 3 - Database setup"]
Claude:
SESSION HANDOFF SUMMARY
=======================
Phase: 3/8 - Database Integration (100% complete)
Completed: D1 database setup, migrations, schema
Next Action: Start Phase 4 - API Endpoints (src/routes/api.ts)
Blockers: None
```

## Integration

- **Requires**: SESSION.md (from `/plan-project`)
- **Updates**: SESSION.md, possibly CHANGELOG.md, ARCHITECTURE.md
- **Generates**: Git checkpoint commit
- **Best followed by**: `/continue-session` in next conversation

## When to Load This Reference

Load this reference when:
- First time using /wrap-session
- Need to understand session checkpoint workflow
- Want to see handoff summary format
- Troubleshooting session state updates
