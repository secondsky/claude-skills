---
name: project-workflow
description: Project lifecycle automation with 7 slash commands. Use for idea exploration, project planning, session management, safe releases, or encountering /explore-idea, /plan-project, /plan-feature, /continue-session, /wrap-session, /release, /workflow command errors.

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

## Quick Start (5 Minutes)

### New Project from Scratch
```
/explore-idea → /plan-project → work → /wrap-session → /continue-session
```

### Adding Feature to Existing Project
```
/plan-feature → wrap/resume cycle
```

### Ready to Release
```
/release → safety checks → GitHub release
```

**Load `references/workflow-examples.md` for complete patterns.**

---

### 1. `/explore-idea` - Pre-Planning Exploration
Validate ideas through research, challenge assumptions, prevent scope creep. Creates PROJECT_BRIEF.md with validated tech stack. **Time saved: 10-15 min**
**Load `references/command-explore-idea.md` for complete details.**

### 2. `/plan-project` - Generate Project Planning Docs
Automate planning for NEW projects. Generates IMPLEMENTATION_PHASES.md, SESSION.md, and supporting docs. **Time saved: 5-7 min**
**Load `references/command-plan-project.md` for complete details.**

### 3. `/plan-feature` - Add Features to Existing Projects
Integrate new features into existing plans. Handles phase renumbering, updates all planning docs. Requires SESSION.md + IMPLEMENTATION_PHASES.md. **Time saved: 7-10 min**
**Load `references/command-plan-feature.md` for complete details.**

### 4. `/wrap-session` - End-of-Session Checkpoint
Automate session wrap-up. Updates SESSION.md with progress, creates git checkpoint, outputs handoff summary. **Time saved: 2-3 min**
**Load `references/command-wrap-session.md` for complete details.**

### 5. `/continue-session` - Start-of-Session Context Loading
Seamlessly resume work. Loads SESSION.md context, shows recent commits, displays Next Action, asks permission to continue. **Time saved: 1-2 min**
**Load `references/command-continue-session.md` for complete details.**

### 6. `/workflow` - Interactive Workflow Guide
Navigate command system with contextual guidance. Shows decision trees, offers to execute appropriate command. Use when unsure which command to use next.
**Load `references/command-workflow.md` for complete details.**

### 7. `/release` - Pre-Release Safety Checks
Comprehensive safety checks before GitHub publishing. Scans secrets, validates docs, checks configs, runs quality checks, offers auto-fix. **Time saved: 10-15 min**
**Load `references/command-release.md` for complete details.**

---

## Workflow Patterns

Three main patterns: **Full Workflow** (with /explore-idea), **Quick Workflow** (skip exploration), **Helper Workflows** (standalone commands).

**Load `references/workflow-examples.md` when planning complete project lifecycle.**

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

## Command Flow

Commands follow project lifecycle phases: **Exploration** (/explore-idea) → **Planning** (/plan-project) → **Execution** (wrap/resume cycle) → **Release** (/release). Helper command (/workflow) available anytime.

**Load `references/command-relationships.md` when planning optimal command sequence.**

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

**All commands**: Claude Code CLI + Git repository (recommended). **Planning commands**: Existing SESSION.md for /plan-feature. **Release**: Git commits + remote URL configured.

**Load `references/setup-prerequisites.md` when setting up workflow for first time.**

---

## Configuration

Customize planning templates (project-planning skill) and session protocol (project-session-management skill) by installing separately and modifying templates.

**Load `references/configuration-guide.md` when customizing templates or session formats.**

---

## Top 5 Common Errors

### 1. /plan-project: "No project description provided"
**Error**: Command fails without generating planning docs
**Fix**: Discuss project with Claude first, OR use `/explore-idea` to create PROJECT_BRIEF.md
**Prevention**: Always provide context before planning

### 2. /plan-feature: "Prerequisites not met"
**Error**: Command refuses to run, mentions missing files
**Fix**: Run `/plan-project` first to create SESSION.md and IMPLEMENTATION_PHASES.md
**Prevention**: Only use /plan-feature on projects initialized with /plan-project

### 3. /wrap-session: "No git repository found"
**Error**: Command fails when creating checkpoint commit
**Fix**: Initialize git: `git init && git add . && git commit -m "Initial commit"`
**Prevention**: Always work in git-initialized projects

### 4. /continue-session: "SESSION.md not found"
**Error**: Command cannot load session context
**Fix**: Run `/plan-project` to create SESSION.md, OR check you're in project root directory
**Prevention**: Always run /wrap-session at end of sessions

### 5. /release: "Secrets detected"
**Error**: Release blocked due to potential API key/token leaks
**Fix**: Add sensitive files to .gitignore, remove from git history with filter-branch
**Prevention**: Always gitignore .env files, credentials.json, and similar sensitive files

**Load `references/troubleshooting-guide.md` for complete guide with all error scenarios.**

---

## Best Practices

**Key practices**: Use /explore-idea for validation; plan before implementing; wrap sessions before context full (~150k tokens); always resume with /continue-session; use /plan-feature for new features; run /release on feature branches first.

**Load `references/best-practices.md` for detailed patterns and anti-patterns.**

---

## Advanced Usage

**Advanced patterns**: Parallel feature planning (plan multiple, then prioritize); release workflow with feature branches; continuous session management across multi-day projects; phase reordering and splitting.

**Load `references/advanced-usage.md` for complex workflows and power-user patterns.**

---

## When to Load References

Load reference files when working on specific workflow aspects:

### Command Reference Files

**`references/command-explore-idea.md`**:
- First time using /explore-idea
- Need research/validation workflow details
- Want example conversation flow

**`references/command-plan-project.md`**:
- First time using /plan-project
- Need to understand generated files
- Troubleshooting missing planning docs

**`references/command-plan-feature.md`**:
- First time using /plan-feature
- Getting "prerequisites not met" errors
- Need to understand phase integration workflow

**`references/command-wrap-session.md`**:
- First time using /wrap-session
- Need to understand session checkpoint workflow
- Want to see handoff summary format

**`references/command-continue-session.md`**:
- First time using /continue-session
- Need to understand context loading workflow
- Troubleshooting session context issues

**`references/command-workflow.md`**:
- First time using project-workflow skill
- Need to understand command relationships
- Building similar interactive guidance systems

**`references/command-release.md`**:
- First time using /release
- Need to understand release safety phases
- Troubleshooting release blockers

### Workflow & Support Files

**`references/workflow-examples.md`**:
- Planning complete project lifecycle
- Want full workflow patterns (Full, Quick, Helper)
- Understanding when to use which workflow

**`references/command-relationships.md`**:
- Understanding command flow and dependencies
- Planning optimal command sequence
- Learning how commands integrate

**`references/setup-prerequisites.md`**:
- Setting up workflow for first time
- Checking if project meets requirements
- Missing prerequisites errors

**`references/configuration-guide.md`**:
- Customizing planning templates
- Modifying session protocol format
- Need to fork and customize skills

**`references/troubleshooting-guide.md`**:
- Encountering errors with commands
- Debugging workflow issues
- Complete error catalog with solutions

**`references/best-practices.md`**:
- Optimizing workflow efficiency
- Learning recommended patterns
- Avoiding common mistakes

**`references/advanced-usage.md`**:
- Parallel planning workflows
- Continuous session patterns
- Complex release workflows
- Multi-developer coordination

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
