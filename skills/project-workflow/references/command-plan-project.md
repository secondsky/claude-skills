# /plan-project - Generate Project Planning Docs

## Overview

**Purpose:** Automate initial project planning for NEW projects

**When to use:**
- Starting a new project with clear requirements
- After /explore-idea when you've decided to proceed
- Need structured IMPLEMENTATION_PHASES.md for context-safe execution

## What It Does

1. Checks for PROJECT_BRIEF.md (from /explore-idea) and uses it as context
2. Invokes project-planning skill to generate IMPLEMENTATION_PHASES.md
3. Creates SESSION.md for tracking progress
4. Creates initial git commit with planning docs
5. Shows formatted planning summary
6. Asks permission to start Phase 1
7. Optionally pushes to remote

## Time Savings

**5-7 minutes per new project**

Eliminates manual planning doc creation and ensures consistent structure across all projects.

## Example Usage

```
User: /plan-project
Claude: I found PROJECT_BRIEF.md from /explore-idea. Using it for context...
Claude: [Generates IMPLEMENTATION_PHASES.md with 8 phases]
Claude: [Creates SESSION.md]
Claude: [Git commit: "docs: Add project planning documentation"]
Claude: Ready to start Phase 1: Project Setup?
```

## What It Generates

The command automatically creates:

- **`IMPLEMENTATION_PHASES.md`** - Phased development plan with verification criteria
- **`SESSION.md`** - Session tracking and handoff protocol
- **`DATABASE_SCHEMA.md`** - If project uses a database
- **`API_ENDPOINTS.md`** - If project has an API
- **`ARCHITECTURE.md`** - System architecture overview

## Integration

- **Requires**: (Optional) PROJECT_BRIEF.md from `/explore-idea`
- **Uses**: project-planning skill
- **Generates**: Multiple planning documentation files
- **Best followed by**: Starting implementation of Phase 1

## When to Load This Reference

Load this reference when:
- First time using /plan-project
- Need to understand what files are generated
- Want to see the planning workflow
- Troubleshooting missing generated files
