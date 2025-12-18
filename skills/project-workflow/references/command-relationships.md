# Command Relationships

## Overview

This reference shows how the 7 project-workflow commands relate to each other and the order they're typically used in a project lifecycle.

## Command Flow Diagram

```
EXPLORATION PHASE
/explore-idea (optional)
    ↓
    Creates PROJECT_BRIEF.md
    ↓
PLANNING PHASE
/plan-project (reads PROJECT_BRIEF.md if exists)
    ↓
    Creates IMPLEMENTATION_PHASES.md + SESSION.md
    ↓
EXECUTION PHASE
Work on phases
    ↓
/wrap-session (when context full)
    ↓
    Updates SESSION.md, git checkpoint
    ↓
/continue-session (new session)
    ↓
    Loads SESSION.md, continues work
    ↓
/plan-feature (when need new features)
    ↓
    Adds phases to IMPLEMENTATION_PHASES.md
    ↓
Continue wrap → resume cycle
    ↓
RELEASE PHASE
/release (when ready to publish)
    ↓
    Safety checks → GitHub release

HELPER
/workflow (anytime)
    ↓
    Interactive guidance
```

## Phase Descriptions

### Exploration Phase (Optional)
**Command**: `/explore-idea`
**Purpose**: Validate technology choices and approach before committing
**Output**: PROJECT_BRIEF.md

### Planning Phase (Required)
**Command**: `/plan-project`
**Purpose**: Create structured implementation plan
**Input**: Optional PROJECT_BRIEF.md from exploration
**Output**: IMPLEMENTATION_PHASES.md, SESSION.md

### Execution Phase (Iterative)
**Commands**: Work → `/wrap-session` → `/continue-session` → repeat
**Purpose**: Implement features with safe context handoffs
**Updates**: SESSION.md continuously

**Additional**: `/plan-feature` can be used anytime to add new features to the plan

### Release Phase (Final)
**Command**: `/release`
**Purpose**: Validate safety and publish to GitHub
**Output**: GitHub release (optional)

### Helper (Anytime)
**Command**: `/workflow`
**Purpose**: Navigate command system, get guidance
**Use**: Anytime you're unsure which command to use

## Dependencies

### Required Files
- `/plan-project` creates → SESSION.md, IMPLEMENTATION_PHASES.md
- `/plan-feature` requires → SESSION.md, IMPLEMENTATION_PHASES.md (from /plan-project)
- `/wrap-session` requires → SESSION.md
- `/continue-session` requires → SESSION.md
- `/release` requires → Git repository with commits

### Optional Files
- `/plan-project` can read → PROJECT_BRIEF.md (from /explore-idea)
- All commands can read → Planning docs for context

## Command Independence

**Can be used standalone:**
- `/explore-idea` - Just exploration, no planning needed
- `/workflow` - Guidance without executing anything
- `/release` - Can run on any git repo

**Require planning setup:**
- `/plan-feature` - Needs SESSION.md + IMPLEMENTATION_PHASES.md
- `/wrap-session` - Needs SESSION.md
- `/continue-session` - Needs SESSION.md

## Typical Command Frequency

**Once per project:**
- `/explore-idea` (optional)
- `/plan-project`

**Multiple times per project:**
- `/plan-feature` (every new feature)
- `/wrap-session` (every session end)
- `/continue-session` (every session start)

**Final step:**
- `/release` (when ready to publish)

**As needed:**
- `/workflow` (when unsure)
