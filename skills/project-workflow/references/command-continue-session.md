# /continue-session - Start-of-Session Context Loading

## Overview

**Purpose:** Automate start-of-session context loading for seamless resumption

**When to use:**
- Starting a new Claude Code session
- Continuing work from previous session
- After /wrap-session checkpoint

## What It Does

1. Uses Explore agent to load session context (SESSION.md + planning docs)
2. Shows recent git history (last 5 commits)
3. Displays formatted session summary:
   - Current phase and progress
   - Last completed tasks
   - Next Action
   - Any blockers
4. Shows verification criteria if in "Verification" stage
5. Optionally opens "Next Action" file
6. Asks permission to continue or adjust direction

## Time Savings

**1-2 minutes per resume**

Eliminates manual context loading and ensures you start with full project awareness.

## Example Usage

```
User: /continue-session
Claude: [Loads SESSION.md via Explore agent]
Claude:
SESSION CONTEXT
===============
Phase: 4/8 - API Endpoints (20% complete)
Last Session: Completed /api/users GET endpoint
Next Action: Implement POST /api/users (src/routes/api.ts:45)
Blockers: None

Recent commits:
- checkpoint: Complete Phase 3 - Database setup
- feat: Add D1 migrations

Ready to implement POST /api/users?
```

## Integration

- **Requires**: SESSION.md (from `/wrap-session`)
- **Uses**: Explore agent for context loading
- **Reads**: SESSION.md, IMPLEMENTATION_PHASES.md, recent git history
- **Best follows**: `/wrap-session` from previous conversation

## When to Load This Reference

Load this reference when:
- First time using /continue-session
- Need to understand context loading workflow
- Want to see session resumption format
- Troubleshooting session context issues
