# Session Handoff Protocol Snippet for Project CLAUDE.md

Copy this section into your project's `CLAUDE.md` file to enable session management for that project.

---

## Session Handoff Protocol

**Purpose**: Track execution progress and manage context between sessions.

### Quick Reference

**Before ending any session**:
1. Update SESSION.md with current state
2. Create git checkpoint commit (see format in SESSION.md notes)
3. Note concrete "Next Action"

**When resuming**:
1. Read SESSION.md
2. Check "Next Action"
3. Continue from that point

### SESSION.md Location

**File**: `SESSION.md` (project root)
**Purpose**: Navigation hub that references planning docs, tracks current progress
**Update**: After significant progress (not every tiny change)

### Status Icons

- ⏸️ = Not started (pending)
- 🔄 = In progress
- ✅ = Complete
- 🚫 = Blocked

### Stages Within a Phase

- **Implementation** → Writing code for tasks
- **Verification** → Testing against verification criteria
- **Debugging** → Fixing issues found during verification

Update SESSION.md to reflect current stage.

---

**For full protocol details, see `~/.claude/skills/project-session-management/`**
