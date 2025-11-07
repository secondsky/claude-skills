# Claude Code Slash Commands

Seven slash commands for automating project exploration, planning, session workflow, and release safety with Claude Code.

## Installation

Copy commands to your `.claude/commands/` directory:

```bash
# From the claude-skills repo
cp commands/explore-idea.md ~/.claude/commands/
cp commands/plan-project.md ~/.claude/commands/
cp commands/plan-feature.md ~/.claude/commands/
cp commands/wrap-session.md ~/.claude/commands/
cp commands/continue-session.md ~/.claude/commands/
cp commands/workflow.md ~/.claude/commands/
cp commands/release.md ~/.claude/commands/
```

Commands are immediately available in Claude Code after copying.

## Commands

### Exploration Command

#### `/explore-idea`

**Purpose**: Collaborative exploration and brainstorming for new project ideas (PRE-planning phase)

**Usage**: Type `/explore-idea` when you have a rough idea and want to validate approach, research options, and create decision-ready brief

**What it does**:
1. Engages in free-flowing conversation to understand your vision
2. Conducts heavy research (Explore agents, Context7 MCP, WebSearch)
3. Validates tech stack and approach
4. Challenges assumptions and prevents scope creep
5. Creates PROJECT_BRIEF.md with validated decisions
6. Recommends: Proceed/Pause/Pivot
7. Seamlessly hands off to /plan-project if proceeding

**Time savings**: 10-15 minutes per project idea (research + validation + scope management)

**When to use**:
- You have rough idea but not validated approach
- Multiple tech options and unsure which fits
- Want research/validation before committing to build
- Need scope management before detailed planning

**When to skip**:
- You have crystal-clear requirements and validated stack (use /plan-project directly)

---

### Planning Commands

#### `/plan-project`

**Purpose**: Automate initial project planning for NEW projects (POST-exploration phase)

**Usage**: Type `/plan-project` after you've decided on project requirements (or after `/explore-idea`)

**What it does**:
1. Checks for PROJECT_BRIEF.md (from /explore-idea) and uses it as context
2. Invokes project-planning skill to generate IMPLEMENTATION_PHASES.md
3. Creates SESSION.md automatically
4. Creates initial git commit with planning docs
5. Shows formatted planning summary
6. Asks permission to start Phase 1
7. Optionally pushes to remote

**Time savings**: 5-7 minutes per new project (15-20 manual steps → 1 command)

---

#### `/plan-feature`

**Purpose**: Add feature to existing project by generating and integrating new phases

**Usage**: Type `/plan-feature` when you want to add a new feature to an existing project

**What it does**:
1. Verifies prerequisites (SESSION.md + IMPLEMENTATION_PHASES.md exist)
2. Checks current phase status (warns if in progress)
3. Gathers feature requirements (5 questions)
4. Generates new phases via project-planning skill
5. Integrates into IMPLEMENTATION_PHASES.md (handles phase renumbering)
6. Updates SESSION.md with new pending phases
7. Updates related docs (DATABASE_SCHEMA.md, API_ENDPOINTS.md if needed)
8. Creates git commit for feature planning
9. Shows formatted summary

**Time savings**: 7-10 minutes per feature addition (25-30 manual steps → 1 command)

---

### Session Management Commands

#### `/wrap-session`

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

### `/continue-session`

**Purpose**: Automate start-of-session context loading

**Usage**: Type `/continue-session` in Claude Code

**What it does**:
1. Uses Explore agent to load session context (SESSION.md + planning docs)
2. Shows recent git history (last 5 commits)
3. Displays formatted session summary (phase, progress, Next Action)
4. Shows verification criteria if in "Verification" stage
5. Optionally opens "Next Action" file
6. Asks permission to continue or adjust direction

**Time savings**: 1-2 minutes per resume (5-8 manual reads → 1 command)

---

### Helper Commands

#### `/workflow`

**Purpose**: Interactive guide to the workflow system

**Usage**: Type `/workflow` when you want to understand or navigate the workflow commands

**What it does**:
1. Shows overview of all 7 commands
2. Asks what you're trying to do
3. Provides context-aware guidance
4. Shows decision trees (when to use which command)
5. Offers to execute the appropriate command
6. Points to comprehensive documentation

**When to use**:
- First time using the workflow system
- Unsure which command to use
- Want to see workflow examples
- Need quick reference

**Output**: Interactive guidance, optional command execution, reference to docs/JEZWEB_WORKFLOW.md

**Time savings**: Instant navigation to correct command (vs reading docs)

---

#### `/release`

**Purpose**: Pre-release safety checks for GitHub publishing

**Usage**: Type `/release` when ready to publish project to GitHub or create public release

**What it does**:

**Phase 1: Critical Safety (BLOCKERS)**
1. Scans for secrets (API keys, tokens, passwords)
2. Checks for personal artifacts (SESSION.md, planning/, screenshots/)
3. Verifies git remote URL (pushing to correct repo)

**Phase 2: Documentation Validation (REQUIRED)**
4. Checks LICENSE file exists (creates if missing)
5. Validates README completeness (>100 words, key sections)
6. Checks CONTRIBUTING.md (recommended for >500 LOC)
7. Checks CODE_OF_CONDUCT (recommended for >1000 LOC)

**Phase 3: Configuration Validation**
8. Validates .gitignore (essential patterns present)
9. Checks package.json completeness (name, version, license, etc.)
10. Verifies git branch (warns if on main/master)

**Phase 4: Quality Checks (NON-BLOCKING)**
11. Tests build (if build script exists)
12. Checks dependency vulnerabilities (npm audit)
13. Warns about large files (>1MB)

**Phase 5: Release Readiness Report**
- Comprehensive report with blockers/warnings/recommendations
- Safe to release verdict

**Phase 6-8: Auto-Fix & Publish**
- Offers to fix issues (create LICENSE, update README, etc.)
- Creates release preparation commit
- Optional: Creates git tag and GitHub release

**Time savings**: 10-15 minutes per release (comprehensive checks + automation)

**When to use**:
- Ready to push project to public GitHub
- Before creating GitHub release
- Want to ensure no secrets leaked
- Need to validate documentation

**When to skip**:
- Private repository (some checks less critical)
- Already manually verified everything

**Output**: Release readiness report, optional auto-fixes, git commit, GitHub release

---

## Requirements

**Planning Commands**:
- Project description (discussed with Claude)
- Git repository initialized (recommended)
- For `/plan-feature`: Existing SESSION.md and IMPLEMENTATION_PHASES.md

**Session Management Commands**:
- `SESSION.md` file in project root (created by `/plan-project` or `project-session-management` skill)
- `IMPLEMENTATION_PHASES.md` in project (optional but recommended)
- Git repository initialized

## Integration

These commands work together and integrate with planning/session skills:
- **Planning**: `project-planning` skill generates IMPLEMENTATION_PHASES.md
- **Session**: `project-session-management` skill provides SESSION.md protocol
- **Agents**: Commands use Claude Code's built-in Task, Explore, and Plan agents
- Manual workflow still available if preferred

## Complete Workflow

**Full workflow** (with exploration):
```
1. Rough idea → /explore-idea → [Creates PROJECT_BRIEF.md] → Decision
2. If proceeding → /plan-project → [Reads brief, creates IMPLEMENTATION_PHASES.md + SESSION.md]
3. Start Phase 1 → Work on phases
4. Context full → /wrap-session → [Updates SESSION.md, git checkpoint]
5. New session → /continue-session → [Loads context, continues from "Next Action"]
6. Need feature → /plan-feature → [Adds phases to existing plan]
7. Repeat wrap → resume cycle
8. Ready to publish → /release → [Safety checks, sanitize, docs] → GitHub release
```

**Quick workflow** (clear requirements):
```
Clear requirements → /plan-project → Work → /wrap-session → /continue-session → /release
```

**Helper workflows**:
```
Need guidance? → /workflow → [Interactive guide to commands]
Release project? → /release → [Safety checks + GitHub release]
```

**Complete Documentation**: See `docs/JEZWEB_WORKFLOW.md` for comprehensive guide with examples, decision trees, troubleshooting, and real-world workflows.

## Features

**`/explore-idea`**:
- ✅ Free-flowing conversational exploration (not rigid questionnaire)
- ✅ Heavy automated research (Explore agents, Context7 MCP, WebSearch)
- ✅ Tech stack validation
- ✅ Scope management and assumption challenges
- ✅ Creates PROJECT_BRIEF.md with validated decisions
- ✅ Recommends proceed/pause/pivot
- ✅ Seamless handoff to /plan-project

**`/plan-project`**:
- ✅ Checks for PROJECT_BRIEF.md (from /explore-idea)
- ✅ Invokes project-planning skill automatically
- ✅ Creates SESSION.md from generated phases
- ✅ Structured git commit format
- ✅ Formatted planning summary
- ✅ Asks permission before starting Phase 1

**`/plan-feature`**:
- ✅ Checks current phase status
- ✅ Gathers requirements (5 questions)
- ✅ Generates new phases via skill
- ✅ Handles phase renumbering automatically
- ✅ Updates all relevant docs
- ✅ Smart integration into existing plan

**`/wrap-session`**:
- ✅ Auto-updates SESSION.md
- ✅ Smart doc detection
- ✅ Structured git checkpoint format
- ✅ Comprehensive error handling

**`/continue-session`**:
- ✅ Multi-file context loading
- ✅ Stage-aware (shows verification checklist when needed)
- ✅ Detects uncommitted changes
- ✅ Optional "Next Action" file opening

**`/workflow`**:
- ✅ Interactive guidance based on user context
- ✅ Shows decision trees (which command to use)
- ✅ Offers to execute appropriate command
- ✅ Quick reference card
- ✅ Points to comprehensive documentation

**`/release`**:
- ✅ Comprehensive secrets scanning (gitleaks integration)
- ✅ Personal artifacts detection and cleanup
- ✅ Remote URL verification (prevent wrong repo push)
- ✅ LICENSE file validation (creates if missing)
- ✅ README completeness checks
- ✅ .gitignore validation
- ✅ package.json completeness
- ✅ Build testing
- ✅ Dependency vulnerability scanning
- ✅ Large file warnings
- ✅ Release readiness report
- ✅ Auto-fix capabilities
- ✅ GitHub release creation (optional)

## Total Time Savings

**35-55 minutes per project lifecycle**:
- Exploration: 10-15 minutes (explore-idea)
- Planning: 5-7 minutes (plan-project)
- Feature additions: 7-10 minutes each (plan-feature)
- Session cycles: 3-5 minutes each (wrap + resume)
- Release safety: 10-15 minutes (release)
- Workflow navigation: Instant (workflow)

---

**Version**: 4.0.0
**Last Updated**: 2025-11-07
**Author**: Jeremy Dawes | Jezweb
