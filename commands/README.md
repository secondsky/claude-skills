# Session Management Commands

Two slash commands for automating session workflow with Claude Code.

## Installation

Copy commands to your `.claude/commands/` directory:

```bash
# From the claude-skills repo
cp commands/wrap-session.md ~/.claude/commands/
cp commands/resume-session.md ~/.claude/commands/
```

Commands are immediately available in Claude Code after copying.

## Commands

### `/wrap-session`

**Purpose**: Automate end-of-session workflow

**Usage**: Type `/wrap-session` in Claude Code

**What it does**:
1. Uses Task agent to analyze current session state
2. Updates SESSION.md with progress
3. Detects and updates relevant docs (CHANGELOG.md, ARCHITECTURE.md, etc.)
4. Creates structured git checkpoint commit
5. Outputs formatted handoff summary
6. Optionally pushes to remote

**Time savings**: 2-3 minutes per wrap-up (10-15 manual steps → 1 command)

---

### `/resume-session`

**Purpose**: Automate start-of-session context loading

**Usage**: Type `/resume-session` in Claude Code

**What it does**:
1. Uses Explore agent to load session context (SESSION.md + planning docs)
2. Shows recent git history (last 5 commits)
3. Displays formatted session summary (phase, progress, Next Action)
4. Shows verification criteria if in "Verification" stage
5. Optionally opens "Next Action" file
6. Asks permission to continue or adjust direction

**Time savings**: 1-2 minutes per resume (5-8 manual reads → 1 command)

---

## Requirements

- `SESSION.md` file in project root (created by `project-session-management` skill)
- `IMPLEMENTATION_PHASES.md` in project (optional, created by `project-planning` skill)
- Git repository initialized

## Integration

These commands work with the `project-session-management` skill:
- See: `~/.claude/skills/project-session-management/SKILL.md`
- Commands use Claude Code's built-in Task and Explore agents
- Manual workflow still available if preferred

## Features

**`/wrap-session`**:
- ✅ Auto-updates SESSION.md
- ✅ Smart doc detection
- ✅ Structured git checkpoint format
- ✅ Comprehensive error handling

**`/resume-session`**:
- ✅ Multi-file context loading
- ✅ Stage-aware (shows verification checklist when needed)
- ✅ Detects uncommitted changes
- ✅ Optional "Next Action" file opening

## Total Time Savings

**3-5 minutes per session cycle** (wrap + resume)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-07
**Author**: Jeremy Dawes | Jezweb
