---
name: project-workflow
description: |
  Automate complete project lifecycle from idea exploration to safe deployment with 7
  integrated slash commands. Use when starting projects, planning features, managing
  development sessions, or ensuring safe releases. Includes /explore-idea, /plan-project,
  /add-feature, /start-session, /end-session, /safe-merge, /prepare-release commands.
  Saves 35-55 minutes per project by automating repetitive tasks and enforcing best
  practices for context management, planning documentation, and release safety checks.

  Keywords: project workflow, lifecycle automation, slash commands, planning, session management, release safety, implementation phases
license: MIT
allowed-tools: ["Read", "Write", "Edit", "Bash"]
---

# Project Workflow Skill

**Complete project lifecycle automation for Claude Code**

This skill provides 7 integrated slash commands that automate the entire project lifecycle from initial idea exploration through planning, execution, session management, and release safety checks.

## Overview

The project-workflow skill saves **35-55 minutes per project lifecycle** by automating repetitive tasks and enforcing best practices for context management, planning documentation, and safe releases.

### What This Skill Does

- **Pre-Planning Research** - Validate ideas, research tech stacks, manage scope
- **Automated Planning** - Generate comprehensive IMPLEMENTATION_PHASES.md with verification criteria
- **Feature Addition** - Integrate new features into existing project plans
- **Session Management** - Handle context across multiple Claude Code sessions
- **Release Safety** - Comprehensive checks before publishing to GitHub
- **Interactive Guidance** - Navigate the workflow system with contextual help

## Installation

### Via Marketplace (Recommended)

```bash
# Add the marketplace
/plugin marketplace add https://github.com/jezweb/claude-skills

# Install project-workflow skill
/plugin install project-workflow@claude-skills
```

All 7 slash commands will be automatically available in Claude Code.

### Manual Installation

```bash
# Clone the repository (choose your preferred location)
INSTALL_DIR="${HOME}/claude-skills"  # or your preferred path
git clone https://github.com/jezweb/claude-skills "$INSTALL_DIR"

# Copy commands to your Claude config
cp "$INSTALL_DIR/skills/project-workflow/commands/"*.md ~/.claude/commands/
```

## The 7 Commands

### 1. `/explore-idea` - Pre-Planning Exploration

**Purpose:** Collaborative exploration and validation BEFORE committing to implementation

**When to use:**
- You have a rough idea but haven't validated the approach
- Multiple tech options and unsure which fits best
- Want research/validation before detailed planning
- Need scope management to prevent feature creep

**What it does:**
1. Engages in free-flowing conversation to understand your vision
2. Conducts heavy research (Explore agents, WebSearch, MCP tools)
3. Validates tech stack and architectural decisions
4. Challenges assumptions and prevents scope creep
5. Creates PROJECT_BRIEF.md with validated decisions
6. Recommends: Proceed/Pause/Pivot
7. Seamlessly hands off to /plan-project if proceeding

**Time savings:** 10-15 minutes per project idea

**Example usage:**
```
User: /explore-idea
Claude: Let's explore your project idea! What are you thinking about building?
User: I want to build a chatbot with memory that runs on Cloudflare
Claude: [Conducts research on Cloudflare Durable Objects vs D1 for memory...]
Claude: [Validates approach, creates PROJECT_BRIEF.md]
Claude: Based on research, I recommend proceeding with Durable Objects for memory...
```

---

### 2. `/plan-project` - Generate Project Planning Docs

**Purpose:** Automate initial project planning for NEW projects

**When to use:**
- Starting a new project with clear requirements
- After /explore-idea when you've decided to proceed
- Need structured IMPLEMENTATION_PHASES.md for context-safe execution

**What it does:**
1. Checks for PROJECT_BRIEF.md (from /explore-idea) and uses it as context
2. Invokes project-planning skill to generate IMPLEMENTATION_PHASES.md
3. Creates SESSION.md for tracking progress
4. Creates initial git commit with planning docs
5. Shows formatted planning summary
6. Asks permission to start Phase 1
7. Optionally pushes to remote

**Time savings:** 5-7 minutes per new project

**Example usage:**
```
User: /plan-project
Claude: I found PROJECT_BRIEF.md from /explore-idea. Using it for context...
Claude: [Generates IMPLEMENTATION_PHASES.md with 8 phases]
Claude: [Creates SESSION.md]
Claude: [Git commit: "docs: Add project planning documentation"]
Claude: Ready to start Phase 1: Project Setup?
```

**Generated files:**
- `IMPLEMENTATION_PHASES.md` - Phased development plan with verification criteria
- `SESSION.md` - Session tracking and handoff protocol
- `DATABASE_SCHEMA.md` - If project uses a database
- `API_ENDPOINTS.md` - If project has an API
- `ARCHITECTURE.md` - System architecture overview

---

### 3. `/plan-feature` - Add Features to Existing Projects

**Purpose:** Add new features to existing projects by generating and integrating phases

**When to use:**
- Want to add a feature to an existing project
- Need to integrate new functionality into current plan
- Existing SESSION.md and IMPLEMENTATION_PHASES.md already exist

**What it does:**
1. Verifies prerequisites (SESSION.md + IMPLEMENTATION_PHASES.md exist)
2. Checks current phase status (warns if work in progress)
3. Gathers feature requirements (5 questions)
4. Generates new phases via project-planning skill
5. Integrates into IMPLEMENTATION_PHASES.md (handles phase renumbering)
6. Updates SESSION.md with new pending phases
7. Updates related docs (DATABASE_SCHEMA.md, API_ENDPOINTS.md if needed)
8. Creates git commit for feature planning
9. Shows formatted summary

**Time savings:** 7-10 minutes per feature addition

**Example usage:**
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

---

### 4. `/wrap-session` - End-of-Session Checkpoint

**Purpose:** Automate end-of-session workflow for safe handoffs

**When to use:**
- Context window getting full (>150k tokens)
- End of work session
- Before switching to different task
- Need to checkpoint progress

**What it does:**
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

**Time savings:** 2-3 minutes per wrap-up

**Example usage:**
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

---

### 5. `/continue-session` - Start-of-Session Context Loading

**Purpose:** Automate start-of-session context loading for seamless resumption

**When to use:**
- Starting a new Claude Code session
- Continuing work from previous session
- After /wrap-session checkpoint

**What it does:**
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

**Time savings:** 1-2 minutes per resume

**Example usage:**
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

---

### 6. `/workflow` - Interactive Workflow Guide

**Purpose:** Navigate the workflow system with contextual guidance

**When to use:**
- First time using project-workflow commands
- Unsure which command to use next
- Want to see workflow examples
- Need quick reference

**What it does:**
1. Shows overview of all 7 commands
2. Asks what you're trying to do
3. Provides context-aware guidance
4. Shows decision trees (when to use which command)
5. Offers to execute the appropriate command
6. Points to comprehensive documentation

**Example usage:**
```
User: /workflow
Claude:
PROJECT WORKFLOW GUIDE
======================
What would you like to do?

1. Start a new project
2. Add feature to existing project
3. End work session
4. Resume work session
5. Prepare for release
6. Just exploring

User: 1
Claude: For new projects, I recommend:
- Have clear requirements? → /plan-project
- Still validating idea? → /explore-idea

Which applies to you?
```

---

### 7. `/release` - Pre-Release Safety Checks

**Purpose:** Comprehensive safety checks before publishing to GitHub

**When to use:**
- Ready to push project to public GitHub
- Before creating GitHub release
- Want to ensure no secrets leaked
- Need to validate documentation completeness

**What it does:**

**Phase 1: Critical Safety (BLOCKERS)**
- Scans for secrets (API keys, tokens, passwords via gitleaks)
- Checks for personal artifacts (SESSION.md, planning/, screenshots/)
- Verifies git remote URL (pushing to correct repo)

**Phase 2: Documentation Validation (REQUIRED)**
- Checks LICENSE file exists (creates if missing)
- Validates README completeness (>100 words, key sections)
- Checks CONTRIBUTING.md (recommended for >500 LOC)
- Checks CODE_OF_CONDUCT (recommended for >1000 LOC)

**Phase 3: Configuration Validation**
- Validates .gitignore (essential patterns present)
- Checks package.json completeness (name, version, license, etc.)
- Verifies git branch (warns if on main/master)

**Phase 4: Quality Checks (NON-BLOCKING)**
- Tests build (if build script exists)
- Checks dependency vulnerabilities (npm audit)
- Warns about large files (>1MB)

**Phase 5: Release Readiness Report**
- Comprehensive report with blockers/warnings/recommendations
- Safe to release verdict

**Phase 6-8: Auto-Fix & Publish**
- Offers to fix issues (create LICENSE, update README, etc.)
- Creates release preparation commit
- Optional: Creates git tag and GitHub release

**Time savings:** 10-15 minutes per release

**Example usage:**
```
User: /release
Claude:
RELEASE SAFETY CHECK
====================
✓ No secrets detected
✓ No personal artifacts found
✓ Remote URL correct (github.com/user/repo)
✗ LICENSE file missing
✓ README.md complete
⚠ No CONTRIBUTING.md (recommended for 2000+ LOC)
✓ .gitignore valid
✓ package.json complete

VERDICT: BLOCKED - Create LICENSE file
Would you like me to create MIT LICENSE?
```

---

## Complete Workflow Examples

### Full Workflow (with Exploration)

```
1. Rough idea → /explore-idea
   → [Creates PROJECT_BRIEF.md with validated tech stack]

2. Decision to proceed → /plan-project
   → [Reads PROJECT_BRIEF.md, creates IMPLEMENTATION_PHASES.md + SESSION.md]

3. Start Phase 1 → Work on implementation

4. Context getting full → /wrap-session
   → [Updates SESSION.md, git checkpoint]

5. New session → /continue-session
   → [Loads context, shows Next Action]

6. Need new feature → /plan-feature
   → [Adds phases to existing plan]

7. Continue wrap → resume cycle until done

8. Ready to publish → /release
   → [Safety checks, docs validation, GitHub release]
```

### Quick Workflow (Clear Requirements)

```
1. Clear requirements → /plan-project
   → [Creates planning docs]

2. Work on implementation

3. /wrap-session when context full

4. /continue-session to resume

5. /release when ready to publish
```

### Helper Workflows

```
Need guidance? → /workflow
   → [Interactive guide to commands]

Adding feature? → /plan-feature
   → [Generates and integrates new phases]

Ready to publish? → /release
   → [Safety checks + GitHub release]
```

---

## Integration with Other Skills

The project-workflow skill works seamlessly with:

### project-planning Skill
- `/plan-project` and `/plan-feature` invoke this skill automatically
- Generates IMPLEMENTATION_PHASES.md with proper structure
- Creates DATABASE_SCHEMA.md, API_ENDPOINTS.md, etc.

### project-session-management Skill
- Provides the SESSION.md protocol used by `/wrap-session` and `/continue-session`
- Defines handoff format and context tracking

### Built-in Claude Code Agents
- `/wrap-session` uses **Task agent** to analyze session state
- `/continue-session` uses **Explore agent** to load context
- `/explore-idea` uses **Explore agent** for research

---

## Command Relationships

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

---

## Time Savings Breakdown

| Command | Time Saved | Tasks Automated |
|---------|------------|-----------------|
| `/explore-idea` | 10-15 min | Research, validation, scope management, tech stack evaluation |
| `/plan-project` | 5-7 min | Planning doc generation, git setup, phase structuring |
| `/plan-feature` | 7-10 min | Feature planning, phase integration, doc updates |
| `/wrap-session` | 2-3 min | SESSION.md updates, git checkpoint, handoff summary |
| `/continue-session` | 1-2 min | Context loading, git history review, next action display |
| `/workflow` | Instant | Navigation, decision trees, command selection |
| `/release` | 10-15 min | Secret scanning, doc validation, build testing, release creation |

**Total per project lifecycle:** 35-55 minutes

---

## Prerequisites

### For All Commands
- Claude Code CLI installed
- Git repository initialized (recommended)

### For Planning Commands (/plan-project, /plan-feature)
- Project description or requirements
- For `/plan-feature`: Existing SESSION.md and IMPLEMENTATION_PHASES.md

### For Session Commands (/wrap-session, /continue-session)
- SESSION.md file in project root (created by /plan-project)
- IMPLEMENTATION_PHASES.md (optional but recommended)

### For Release Command (/release)
- Git repository with commits
- package.json (for Node.js projects)
- Remote repository URL configured (for publishing)

---

## Configuration

### Customizing Planning Templates

The planning commands invoke the `project-planning` skill, which can be customized by:

1. Installing the project-planning skill separately:
   ```bash
   /plugin install project-planning@claude-skills
   ```

2. Modifying templates in `~/.claude/skills/project-planning/templates/` (if skill is installed)

### Customizing Session Protocol

The session management format can be customized by:

1. Installing the project-session-management skill:
   ```bash
   /plugin install project-session-management@claude-skills
   ```

2. Modifying templates in `~/.claude/skills/project-session-management/templates/` (if skill is installed)

---

## Troubleshooting

### /plan-project: "No project description provided"
**Solution:** Discuss your project with Claude first, or use `/explore-idea` to create PROJECT_BRIEF.md

### /plan-feature: "Prerequisites not met"
**Solution:** Ensure SESSION.md and IMPLEMENTATION_PHASES.md exist (run `/plan-project` first)

### /wrap-session: "No git repository found"
**Solution:** Initialize git: `git init`

### /continue-session: "SESSION.md not found"
**Solution:** Run `/plan-project` to create SESSION.md

### /release: "Secrets detected"
**Solution:** Review the flagged files, add sensitive files to .gitignore, remove from git history

---

## Best Practices

### 1. Use /explore-idea for New Ideas
- Don't skip research validation
- Let Claude challenge assumptions
- Create PROJECT_BRIEF.md before planning

### 2. Plan Before Implementing
- Run `/plan-project` at start of every project
- Review IMPLEMENTATION_PHASES.md before Phase 1
- Get planning docs in git early

### 3. Wrap Sessions Before Context Full
- Watch token usage (/context command)
- Wrap around 150k tokens
- Don't wait until maxed out (200k)

### 4. Resume with Context
- Always start new sessions with `/continue-session`
- Review git history shown
- Confirm Next Action before proceeding

### 5. Feature Planning
- Use `/plan-feature` instead of ad-hoc implementation
- Let it handle phase renumbering
- Keep IMPLEMENTATION_PHASES.md synchronized

### 6. Release Safely
- Run `/release` on feature branches first
- Fix all blockers before main branch
- Use auto-fix for LICENSE/README issues

---

## Advanced Usage

### Parallel Feature Planning

```bash
# Plan multiple features, then prioritize
/plan-feature  # Add authentication
/plan-feature  # Add payment processing
/plan-feature  # Add email notifications

# Review IMPLEMENTATION_PHASES.md
# Reorder phases by priority
# Git commit the reorganized plan
```

### Release Workflow with Branches

```bash
# On feature branch
/release  # Check for issues

# Fix any blockers
git add .
git commit -m "fix: Address release blockers"

# Merge to main
git checkout main
git merge feature-branch

# Final release check
/release  # Create GitHub release
```

### Continuous Session Management

```bash
# Day 1
/plan-project
# Work on Phase 1-2
/wrap-session

# Day 2
/continue-session
# Work on Phase 3-4
/wrap-session

# Day 3
/continue-session
# Need new feature
/plan-feature
# Work on new phases
/wrap-session

# Day 4
/continue-session
# Finish implementation
/release
```

---

## FAQ

**Q: Can I use these commands without other skills?**
A: Yes, but `/plan-project` and `/plan-feature` work best with the `project-planning` skill installed.

**Q: Do I need to use all 7 commands?**
A: No. Use `/plan-project` + `/wrap-session` + `/continue-session` for minimum workflow. Add others as needed.

**Q: Can I modify the commands?**
A: Yes. Commands are .md files. Copy to ~/.claude/commands/ and edit.

**Q: What if I don't want to use git?**
A: Most commands work without git, but `/wrap-session`, `/continue-session`, and `/release` heavily integrate with git.

**Q: Can I use this with non-Cloudflare projects?**
A: Yes. The planning system is framework-agnostic. Works with any tech stack.

**Q: How do I see what's in SESSION.md?**
A: Ask Claude: "show me SESSION.md" or use `cat SESSION.md`

---

## Related Skills

- **project-planning** - Generates IMPLEMENTATION_PHASES.md (used by /plan-project)
- **project-session-management** - SESSION.md protocol (used by /wrap-session)
- **github-project-automation** - GitHub Actions, issue templates, CI/CD
- **open-source-contributions** - Contributing to open source projects

---

## Version History

**1.0.0** (2025-11-12)
- Initial release
- 7 integrated slash commands
- Plugin marketplace distribution
- Command bundling via plugin.json

---

## Support

- **Issues**: https://github.com/jezweb/claude-skills/issues
- **Documentation**: https://github.com/jezweb/claude-skills
- **Author**: Jeremy Dawes (jeremy@jezweb.net)
- **Website**: https://jezweb.com.au

---

## License

MIT License - See LICENSE file in repository
