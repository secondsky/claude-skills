# Configuration Guide

## Overview

This reference explains how to customize the project-workflow skill's behavior, templates, and session management format.

## Customizing Planning Templates

The planning commands (`/plan-project`, `/plan-feature`) invoke the `project-planning` skill, which generates planning documents from templates.

### How to Customize

**Step 1: Install the project-planning skill separately**
```bash
/plugin install project-planning@claude-skills
```

**Step 2: Modify templates**
Templates are located in: `~/.claude/skills/project-planning/templates/`

**Available templates:**
- `IMPLEMENTATION_PHASES-template.md` - Phase structure and format
- `SESSION-template.md` - Session tracking format
- `DATABASE_SCHEMA-template.md` - Database documentation format
- `API_ENDPOINTS-template.md` - API documentation format
- `ARCHITECTURE-template.md` - Architecture overview format

**Step 3: Restart Claude Code**
Changes take effect in new conversations.

### What You Can Customize

**Phase Structure:**
- Number of default phases
- Phase naming conventions
- Verification criteria format
- Time estimates

**Session Format:**
- Handoff summary structure
- Progress tracking details
- Blocker documentation format
- Next Action format

## Customizing Session Protocol

The session management commands (`/wrap-session`, `/continue-session`) use the `project-session-management` skill to format session handoffs.

### How to Customize

**Step 1: Install the project-session-management skill**
```bash
/plugin install project-session-management@claude-skills
```

**Step 2: Modify templates**
Templates are located in: `~/.claude/skills/project-session-management/templates/`

**Available templates:**
- `session-handoff-template.md` - Session summary format
- `checkpoint-commit-template.md` - Git commit message format
- `context-loading-template.md` - Session resumption format

**Step 3: Restart Claude Code**
Changes take effect in new conversations.

### What You Can Customize

**Handoff Format:**
- Which information to include
- Summary structure
- Formatting style
- Length constraints

**Commit Messages:**
- Message format
- Phase tracking notation
- Tagging conventions

## Default Behavior (No Customization)

If you don't install the separate skills, project-workflow uses built-in defaults:

**Planning:**
- Standard 6-8 phase structure
- Verification criteria per phase
- Basic session tracking

**Session Management:**
- Structured handoff summaries
- Git checkpoint commits
- Next Action guidance

## When to Customize

**Customize Planning when:**
- Your projects have unique phase structures
- You need different documentation formats
- You want specific phase naming conventions
- Your team has established planning patterns

**Customize Session Management when:**
- You have specific handoff requirements
- Your team uses different commit message formats
- You need additional tracking information
- You're integrating with project management tools

**Don't customize when:**
- You're new to the workflow (use defaults first)
- Default formats meet your needs
- You want to maintain portability across projects

## Restoring Defaults

To restore default behavior:

```bash
# Remove customized skills
/plugin remove project-planning
/plugin remove project-session-management

# Restart Claude Code
```

The project-workflow skill will fall back to built-in defaults.

## Advanced: Fork and Modify

For deep customization:

1. Fork the claude-skills repository
2. Modify the project-planning or project-session-management skills
3. Install from your fork:
   ```bash
   /plugin install project-planning@your-github-username
   ```

This allows version control of your customizations.
