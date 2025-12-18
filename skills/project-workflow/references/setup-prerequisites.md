# Setup Prerequisites

## Overview

This reference lists all prerequisites needed to use the project-workflow commands effectively.

## For All Commands

**Required:**
- Claude Code CLI installed
- Git repository initialized (recommended)

**Why**: All workflow commands operate within the Claude Code CLI environment and benefit from git integration for tracking changes.

## For Planning Commands

### /plan-project
**Required:**
- Project description or requirements

**Optional:**
- PROJECT_BRIEF.md (from /explore-idea) - provides validated tech stack

### /plan-feature
**Required:**
- Existing SESSION.md (from /plan-project)
- Existing IMPLEMENTATION_PHASES.md (from /plan-project)

**Why**: /plan-feature integrates new phases into existing planning, so the base planning docs must exist.

## For Session Commands

### /wrap-session
**Required:**
- SESSION.md file in project root (created by /plan-project)

**Optional:**
- IMPLEMENTATION_PHASES.md (recommended for phase tracking)

### /continue-session
**Required:**
- SESSION.md file in project root (from previous /wrap-session)

**Optional:**
- IMPLEMENTATION_PHASES.md (recommended for phase context)

## For Release Command

### /release
**Required:**
- Git repository with commits
- Remote repository URL configured (for publishing)

**Optional but Validated:**
- package.json (for Node.js projects)
- LICENSE file (will offer to create if missing)
- README.md (will validate completeness)
- .gitignore (will validate patterns)

## Checking Prerequisites

Before starting, verify you have:

```bash
# Check Claude Code CLI
claude --version

# Check git
git status

# Check for planning docs (if resuming)
ls SESSION.md IMPLEMENTATION_PHASES.md

# Check remote (if releasing)
git remote -v
```

## Missing Prerequisites

**If SESSION.md is missing**:
- For new projects: Run `/plan-project` first
- For existing projects: Create SESSION.md manually or run `/plan-project`

**If git is not initialized**:
```bash
git init
git add .
git commit -m "Initial commit"
```

**If remote is not configured**:
```bash
git remote add origin https://github.com/username/repo.git
```

## Optional Tools

These tools enhance the workflow but are not required:

- **gitleaks**: For secret scanning in `/release`
- **npm**: For dependency checks in `/release`
- **Context7 MCP**: For enhanced library documentation research
