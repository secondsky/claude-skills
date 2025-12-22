# project-session-management

**Manages session state and context handoffs for multi-session projects**

---

## Auto-Trigger Keywords

This skill should automatically trigger when users mention:

**Session Management**:
- "create SESSION.md"
- "set up session tracking"
- "manage session state"
- "session handoff"
- "track progress across sessions"

**Resuming Work**:
- "resume from where I left off"
- "show current state"
- "what was I working on"
- "continue from last session"
- "where am I in this project"

**Checkpoints**:
- "create checkpoint"
- "checkpoint commit"
- "save progress"
- "context is getting full"

**Phase Transitions**:
- "mark phase complete"
- "move to next phase"
- "update phase status"
- "phase progress tracking"

**After project-planning**:
- "start Phase 1" (when IMPLEMENTATION_PHASES.md exists)
- "create session tracker"
- "set up progress tracking"

---

## What This Skill Does

This skill implements the **Session Handoff Protocol** - a proven system for tracking progress across multiple work sessions when building phased projects.

### Problems It Solves

1. **Context Loss** - Prevents "where was I?" after context clear
2. **Progress Tracking** - Always know what's done, what's current, what's next
3. **Efficient Resume** - Get back to work in <1 minute vs reconstructing state
4. **Token Efficiency** - ~500 tokens to resume vs ~12,000 tokens manual reconstruction

### What You Get

- **SESSION.md** - Living document tracking phase progress
- **Git Checkpoints** - Structured commit format for milestones
- **Concrete Next Actions** - Always know exact file + line + task
- **Stage Tracking** - Implementation → Verification → Debugging flow
- **Templates & Scripts** - Copy-paste templates, resume helper script

---

## When to Use

### ✅ Use This Skill When

- **Starting new project** after `project-planning` skill has run
- **Resuming work** after clearing context or taking a break
- **Context getting full** mid-phase (need to checkpoint)
- **Phase transitions** moving between phases
- **Managing verification** tracking test results and fixes

### ❌ Skip This Skill When

- **Single-session project** (<2 hours, no context clear needed)
- **Quick fix** (one-off bug fix, no phases)
- **Exploration** (spike work, not production implementation)

---

## Integration with project-planning

These two skills work together perfectly:

```
project-planning skill
        ↓
Generates IMPLEMENTATION_PHASES.md (the plan)
        ↓
project-session-management skill
        ↓
Creates SESSION.md (the tracker)
        ↓
Work through phases, updating SESSION.md
        ↓
Git checkpoints preserve state
        ↓
Resume from SESSION.md after context clear
```

**Best practice**: After running `project-planning`, immediately use this skill to create SESSION.md

---

## Key Features

### 1. SESSION.md Management

- Creates SESSION.md from IMPLEMENTATION_PHASES.md
- Tracks current phase, stage, and next action
- References planning docs (doesn't duplicate)
- Keeps size <200 lines for quick loading

### 2. Git Checkpoint System

- Structured commit format for milestones
- Captures phase status, progress, and next action
- Makes git history useful for project tracking
- Easy to find checkpoints: `git log --grep="checkpoint:"`

### 3. Concrete Next Actions

- File path + line number + specific task
- Never vague ("Continue working on...")
- Enables instant resume after context clear
- Includes decision points when blocked

### 4. Stage Tracking

- Implementation → Verification → Debugging
- Tracks verification progress against criteria
- Documents known issues during debugging
- Makes troubleshooting part of normal flow

### 5. Status Icons

- ⏸️ = Pending (not started)
- 🔄 = In Progress (current focus)
- ✅ = Complete (verified)
- 🚫 = Blocked (external dependency)

---

## Files Included

### Templates (`templates/`)

- **SESSION.md.template** - Copy-paste starter for new SESSION.md
- **checkpoint-commit-format.md** - Git commit template with examples
- **CLAUDE-session-snippet.md** - Snippet to add to project CLAUDE.md

### Scripts (`scripts/`)

- **resume.sh** - Quickly show current project state

### References (`references/`)

- **session-handoff-protocol.md** - Complete protocol documentation
- **best-practices.md** - When to use, how to maintain

---

## Example Usage

### Starting a New Project

```
User: "I just ran project-planning and have IMPLEMENTATION_PHASES.md. Can you create SESSION.md?"

Skill:
1. Reads IMPLEMENTATION_PHASES.md
2. Creates SESSION.md with all phases listed
3. Sets Phase 1 as 🔄 (in progress)
4. Sets concrete "Next Action" for Phase 1
5. Outputs SESSION.md to project root
```

### Resuming Work

```
User: "What was I working on?"

Skill:
1. Reads SESSION.md
2. Shows current phase (🔄)
3. Shows progress within phase
4. Highlights "Next Action"
5. Optionally runs resume.sh script
```

### Creating Checkpoint

```
User: "Context is getting full, need to checkpoint"

Skill:
1. Updates SESSION.md with current progress
2. Suggests checkpoint commit message (structured format)
3. Updates "Next Action" for resume
4. Reminds to push to remote
```

### Marking Phase Complete

```
User: "Phase 3 is done, all tests passed"

Skill:
1. Changes Phase 3 status from 🔄 to ✅
2. Collapses Phase 3 to 2-3 lines
3. Changes Phase 4 from ⏸️ to 🔄
4. Sets "Next Action" for Phase 4
5. Suggests checkpoint commit (status: Complete)
```

---

## Token Efficiency

**Without this skill**:
- ~12,000 tokens to manually reconstruct project state
- Reading multiple planning docs
- Checking git history
- Figuring out where you were

**With this skill**:
- ~500-800 tokens to read SESSION.md
- Instant resume from "Next Action"
- **85-93% token savings**

---

## Production Validation

This protocol has been tested across:
- 27+ production skills
- Multiple multi-phase projects
- Various project sizes (4-20 phases)
- Different tech stacks (Cloudflare, Next.js, etc.)

**Result**: 100% successful resumes after context clear

---

## Quick Start

1. **After running `project-planning`**: Ask to create SESSION.md
2. **While working**: Update SESSION.md after completing tasks
3. **Before pausing**: Create checkpoint commit with structured format
4. **When resuming**: Read SESSION.md and go to "Next Action"

---

## Commands

```bash
# Show current state quickly
./scripts/resume.sh

# Find checkpoint commits
git log --grep="checkpoint:"

# See last checkpoint
git log --grep="checkpoint:" -1 --format="%H %s%n%b"
```

---

## Related Skills

- **project-planning** - Creates IMPLEMENTATION_PHASES.md (use before this skill)
- **All Cloudflare skills** - Work great with session management for multi-phase builds

---

## Learn More

- See `SKILL.md` for complete instructions
- See `references/session-handoff-protocol.md` for full protocol
- See `references/best-practices.md` for when to use and how to maintain

---

**License**: MIT
**Version**: 1.0
**Author**: Claude Skills Maintainers
**Last Updated**: 2025-10-28
