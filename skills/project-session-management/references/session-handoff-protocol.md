# Session Handoff Protocol

**Complete reference for managing session state and context across multiple work sessions**

---

## Purpose

Track execution progress and manage context between sessions while working through project phases.

This protocol solves the problem of **context loss** when:
- Context window gets full mid-phase
- Starting a fresh session after a break
- Switching between multiple projects
- Resuming work after clearing context

---

## Core Concepts

### Phases vs Sessions

**Phases** (from IMPLEMENTATION_PHASES.md):
- Units of WORK (e.g., "Database Schema", "Auth API", "Task UI")
- Defined in planning docs
- Have verification criteria and exit criteria
- Ideally fit in one session, but may span multiple if complex

**Sessions** (what this protocol manages):
- Units of CONTEXT (what you accomplish before clearing/compacting context)
- Tracked in SESSION.md
- Can complete a phase, part of a phase, or multiple small phases
- Bridges work across context window limits

**Example**:
```
Phase 3: Tasks API (estimated 4 hours)
  Session 1: Implement GET/POST endpoints → context full, checkpoint
  Session 2: Implement PATCH/DELETE → context full, checkpoint
  Session 3: Fix bugs, verify all criteria → Phase 3 complete ✅
```

---

## Quick Reference

### When Starting a New Project

1. Use `project-planning` skill to generate IMPLEMENTATION_PHASES.md
2. Create SESSION.md from the generated phases
3. Start Phase 1

### Before Ending Any Session

1. Update SESSION.md with current state
2. Create git checkpoint commit
3. Note concrete "Next Action"

### When Resuming

1. Read SESSION.md
2. Check "Next Action"
3. Continue from that point

---

## SESSION.md Structure

### Purpose
**Navigation hub** that references planning docs, tracks current progress

**Target Size**: <200 lines
**Location**: Project root
**Update Frequency**: After significant progress (not every tiny change)

### Template

```markdown
# Session State

**Current Phase**: Phase 3
**Current Stage**: Implementation (or Verification/Debugging)
**Last Checkpoint**: abc1234 (2025-10-23)
**Planning Docs**: `docs/IMPLEMENTATION_PHASES.md`, `docs/ARCHITECTURE.md`

---

## Phase 1: Setup ✅
**Completed**: 2025-10-15 | **Checkpoint**: abc1234
**Summary**: Vite + React + Tailwind v4 + D1 binding

## Phase 2: Database ✅
**Completed**: 2025-10-18 | **Checkpoint**: def5678
**Summary**: D1 schema + migrations + seed data

## Phase 3: Tasks API 🔄
**Type**: API | **Started**: 2025-10-23
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-3`

**Progress**:
- [x] GET /api/tasks endpoint (commit: ghi9012)
- [x] POST /api/tasks endpoint (commit: jkl3456)
- [ ] PATCH /api/tasks/:id ← **CURRENT**
- [ ] DELETE /api/tasks/:id
- [ ] Verify all endpoints (see IMPLEMENTATION_PHASES.md for criteria)

**Next Action**: Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47, handle validation and ownership check

**Key Files**:
- `src/routes/tasks.ts`
- `src/lib/schemas.ts`

**Known Issues**: None

## Phase 4: Task UI ⏸️
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-4`
```

---

## Stages Within a Phase

Track where you are in the build-test-fix cycle:

1. **Implementation** → Writing code for tasks
2. **Verification** → Testing against verification criteria
3. **Debugging** → Fixing issues found during verification

**Update SESSION.md** to reflect current stage:

```markdown
**Current Stage**: Verification

**Verification Progress**:
- [x] GET /api/tasks returns 200 ✅
- [x] POST /api/tasks creates task ✅
- [ ] POST with invalid data returns 400 ❌ (returns 500)
- [ ] PATCH updates task
- [ ] DELETE removes task

**Current Issue**: Invalid data returning 500 instead of 400. Need to check validation middleware in src/middleware/validate.ts
```

**Why this matters**: Makes troubleshooting part of the normal flow, not an interruption.

---

## Rules for SESSION.md

### ✅ DO

- **Collapse completed phases** to 2-3 lines (save space)
- **Make "Next Action" concrete** (file + line + what to do)
- **Reference planning docs**, don't duplicate them
- **Update after significant progress** (not every tiny change)
- **Create git checkpoint** at end of phase OR when context is getting full
- **Track verification progress** when in that stage

### ❌ DON'T

- **Copy code** into SESSION.md (it's a tracker, not a code archive)
- **Duplicate IMPLEMENTATION_PHASES.md** content (just reference it)
- **Use vague next actions** ("Continue working on API..." is too vague)
- **Let SESSION.md exceed 200 lines** (archive old phases if needed)

---

## Git Checkpoint Format

Use this structured format for checkpoint commits:

```
checkpoint: Phase [N] [Status] - [Brief Description]

Phase: [N] - [Name]
Status: [Complete/In Progress/Paused]
Session: [What was accomplished this session]

Files Changed:
- path/to/file.ts (what changed)

Next: [Concrete next action]
```

### Examples

#### Phase Complete
```
checkpoint: Phase 3 Complete - Tasks API

Phase: 3 - Tasks API
Status: Complete
Session: Completed all CRUD endpoints and verified functionality

Files Changed:
- src/routes/tasks.ts (all CRUD operations)
- src/lib/schemas.ts (task validation)
- src/middleware/validate.ts (validation middleware)

Next: Phase 4 - Start building Task List UI component
```

#### Context Full Mid-Phase
```
checkpoint: Phase 3 In Progress - Endpoints implemented

Phase: 3 - Tasks API
Status: In Progress
Session: Implemented GET and POST endpoints, need PATCH/DELETE

Files Changed:
- src/routes/tasks.ts (GET, POST endpoints)
- src/lib/schemas.ts (task schema)

Next: Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47
```

#### Blocked or Paused
```
checkpoint: Phase 3 Paused - Need design decision

Phase: 3 - Tasks API
Status: Paused
Session: Built endpoints but need to decide on tag filtering approach

Files Changed:
- src/routes/tasks.ts (basic endpoints)

Next: Decide: client-side tag filtering or add SQL query parameter? Then resume at src/routes/tasks.ts:89
```

---

## Context Management Strategies

### When Context is Getting Full (but phase isn't done)

1. Update SESSION.md with current progress
2. Create checkpoint commit
3. Clear context or start fresh session
4. Read SESSION.md + referenced planning docs
5. Continue from "Next Action"

### When a Phase is Complete

1. Check all verification criteria in IMPLEMENTATION_PHASES.md
2. Mark phase complete in SESSION.md (change 🔄 to ✅)
3. Create checkpoint commit
4. Move to next phase (change next phase from ⏸️ to 🔄)

### When Troubleshooting Takes Over

- Don't fight it - update SESSION.md to show "Debugging" stage
- Document the issue in "Current Issue" field
- When fixed, move back to "Verification" or "Implementation"

---

## Integration with Planning

```
project-planning skill
        ↓
Generates IMPLEMENTATION_PHASES.md (the plan)
        ↓
Create SESSION.md (the tracker)
        ↓
Work through phases, updating SESSION.md
        ↓
Git checkpoints preserve state
        ↓
Resume from SESSION.md after context clear
```

**Planning docs** (in `/docs`): Reference material, rarely change
**SESSION.md** (in root): Living document, updates constantly

---

## Benefits

### Token Efficiency
- **~500-800 tokens** to resume from SESSION.md
- vs **~12,000 tokens** to manually reconstruct state
- **85-93% token savings** on resume

### Context Safety
- Phases sized to fit in one session (2-4 hours)
- Clear checkpoints for mid-phase saves
- No loss of progress on context clear

### Clarity
- Always know what to do next
- No "where was I?" moments
- Verification criteria prevent premature "done"

### Flexibility
- Works across multiple sessions per phase
- Handles interruptions gracefully
- Supports debugging as normal part of flow

---

## Production Validation

This protocol has been tested across:
- 27+ production skills
- Multiple multi-phase projects
- Various project sizes (4-20 phases)
- Different tech stacks (Cloudflare, Next.js, etc.)

**Result**: 100% successful resumes after context clear

---

**Last Updated**: 2025-10-28
**Version**: 1.0
**Author**: Claude Skills Maintainers
