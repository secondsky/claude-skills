# /plan-feature - Add Features to Existing Projects

## Overview

**Purpose:** Add new features to existing projects by generating and integrating phases

**When to use:**
- Want to add a feature to an existing project
- Need to integrate new functionality into current plan
- Existing SESSION.md and IMPLEMENTATION_PHASES.md already exist

## What It Does

1. Verifies prerequisites (SESSION.md + IMPLEMENTATION_PHASES.md exist)
2. Checks current phase status (warns if work in progress)
3. Gathers feature requirements (5 questions)
4. Generates new phases via project-planning skill
5. Integrates into IMPLEMENTATION_PHASES.md (handles phase renumbering)
6. Updates SESSION.md with new pending phases
7. Updates related docs (DATABASE_SCHEMA.md, API_ENDPOINTS.md if needed)
8. Creates git commit for feature planning
9. Shows formatted summary

## Time Savings

**7-10 minutes per feature addition**

Eliminates manual phase creation and ensures proper integration with existing planning docs.

## Example Usage

```
User: /plan-feature
Claude: Found existing planning docs. What feature do you want to add?
User: Add user authentication with Clerk
Claude: [Asks 5 clarifying questions about the feature]
Claude: [Generates 3 new phases for authentication]
Claude: [Integrates into existing IMPLEMENTATION_PHASES.md as Phases 9-11]
Claude: [Updates SESSION.md with new phases]
Claude: [Git commit: "docs: Add authentication feature phases"]
```

## Prerequisites

**Required files:**
- `SESSION.md` - Existing session tracking
- `IMPLEMENTATION_PHASES.md` - Existing phase documentation

**Warning:** Command will fail if these files don't exist. Use `/plan-project` first for new projects.

## Integration

- **Requires**: SESSION.md, IMPLEMENTATION_PHASES.md (from `/plan-project`)
- **Uses**: project-planning skill for feature phase generation
- **Updates**: IMPLEMENTATION_PHASES.md, SESSION.md, possibly DATABASE_SCHEMA.md and API_ENDPOINTS.md
- **Generates**: Git commit with feature planning changes

## When to Load This Reference

Load this reference when:
- First time using /plan-feature
- Getting "prerequisites not met" errors
- Need to understand the feature integration workflow
- Want to see how phase renumbering works
