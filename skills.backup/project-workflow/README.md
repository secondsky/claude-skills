# project-workflow

**Complete project lifecycle automation with 7 integrated slash commands**

Automate exploration, planning, session management, and release safety for Claude Code projects. Saves **35-55 minutes per project lifecycle**.

## Quick Start

### Installation

```bash
# Via marketplace (recommended)
/plugin marketplace add https://github.com/jezweb/claude-skills
/plugin install project-workflow@claude-skills
```

All 7 slash commands will be immediately available.

### Verify Installation

```bash
# Check commands are available
/workflow
```

## The 7 Commands

| Command | Purpose | Time Saved |
|---------|---------|------------|
| `/explore-idea` | Pre-planning research and validation | 10-15 min |
| `/plan-project` | Generate IMPLEMENTATION_PHASES.md for new projects | 5-7 min |
| `/plan-feature` | Add features to existing projects | 7-10 min |
| `/wrap-session` | Checkpoint progress at end of session | 2-3 min |
| `/continue-session` | Load context at start of session | 1-2 min |
| `/workflow` | Interactive guide to the workflow system | Instant |
| `/release` | Pre-release safety checks and GitHub release | 10-15 min |

## Usage Examples

### Starting a New Project

```bash
# Option 1: Have clear requirements?
/plan-project

# Option 2: Still validating idea?
/explore-idea    # Creates PROJECT_BRIEF.md
/plan-project    # Uses PROJECT_BRIEF.md for context
```

### Session Management

```bash
# End of work session
/wrap-session

# Start of next session
/continue-session
```

### Adding Features

```bash
/plan-feature
# Generates new phases and integrates into existing plan
```

### Preparing for Release

```bash
/release
# Runs safety checks, validates docs, offers to create GitHub release
```

## Complete Workflows

### Full Workflow (with exploration)

```
/explore-idea → /plan-project → Work → /wrap-session → /continue-session → /plan-feature → /release
```

### Quick Workflow (clear requirements)

```
/plan-project → Work → /wrap-session → /continue-session → /release
```

## What Gets Created

### By /explore-idea
- `PROJECT_BRIEF.md` - Validated tech stack, scope, and decisions

### By /plan-project
- `IMPLEMENTATION_PHASES.md` - Phased development plan with verification criteria
- `SESSION.md` - Session tracking and handoff protocol
- `DATABASE_SCHEMA.md` - If project uses a database
- `API_ENDPOINTS.md` - If project has an API
- `ARCHITECTURE.md` - System architecture overview

### By /wrap-session
- Updated `SESSION.md` with progress and Next Action
- Git checkpoint commit

### By /release
- `LICENSE` - If missing (offers to create)
- Updated `README.md` - If incomplete
- Git release preparation commit
- GitHub release (optional)

## Auto-Trigger Keywords

This skill's commands are invoked directly via slash commands, not auto-triggered by keywords.

However, Claude may suggest these commands when you:
- Mention "start new project" → `/plan-project`
- Say "context getting full" → `/wrap-session`
- Say "continue from last session" → `/continue-session`
- Ask "how do I add a feature" → `/plan-feature`
- Say "ready to publish" → `/release`

## Integration with Other Skills

Works seamlessly with:
- **project-planning** - Generates IMPLEMENTATION_PHASES.md (auto-invoked by `/plan-project`)
- **project-session-management** - Provides SESSION.md protocol (used by wrap/continue)

## Prerequisites

- Claude Code CLI installed
- Git repository initialized (recommended)
- For planning: Project description/requirements
- For session management: SESSION.md (created by `/plan-project`)

## Time Savings

**Total per project lifecycle: 35-55 minutes**

| Phase | Manual Time | With Commands | Savings |
|-------|-------------|---------------|---------|
| Exploration | 15-20 min | 3-5 min | 10-15 min |
| Planning | 10-15 min | 3-5 min | 5-7 min |
| Feature Addition | 15-20 min | 5-8 min | 7-10 min |
| Session Checkpoint | 5 min | 2 min | 2-3 min |
| Session Resume | 3 min | 1 min | 1-2 min |
| Release Safety | 20-30 min | 5-10 min | 10-15 min |

## Troubleshooting

### "No project description provided" (/plan-project)
Run `/explore-idea` first or discuss project with Claude before planning.

### "Prerequisites not met" (/plan-feature)
Ensure SESSION.md and IMPLEMENTATION_PHASES.md exist. Run `/plan-project` first.

### "No git repository found" (/wrap-session)
Initialize git: `git init`

### "SESSION.md not found" (/continue-session)
Run `/plan-project` to create SESSION.md.

## Documentation

- **Comprehensive Guide**: See [SKILL.md](SKILL.md) for complete documentation
- **Command Details**: See individual .md files in [commands/](commands/)
- **Workflow Patterns**: Run `/workflow` for interactive guidance

## When to Use This Skill

✅ **Use when:**
- Starting any new project
- Adding features to existing projects
- Context window getting full (>150k tokens)
- Resuming work from previous session
- Ready to publish to GitHub
- Need guidance on workflow

❌ **Don't use when:**
- One-off scripts or experiments (overkill)
- Project already has established planning docs
- Not using git (many commands require git)

## Known Issues

None currently reported.

## Related Skills

- [project-planning](../project-planning/) - Planning doc generation
- [project-session-management](../project-session-management/) - Session handoff protocol
- [github-project-automation](../github-project-automation/) - GitHub Actions and automation
- [open-source-contributions](../open-source-contributions/) - Contributing to OSS projects

## Version

**1.0.0** (2025-11-12)

## Author

**Jeremy Dawes** | [Jezweb](https://jezweb.com.au)
- Email: jeremy@jezweb.net
- GitHub: [@jezweb](https://github.com/jezweb)

## License

MIT - See [LICENSE](../../LICENSE)

## Support

- **Issues**: https://github.com/jezweb/claude-skills/issues
- **Discussions**: https://github.com/jezweb/claude-skills/discussions
- **Documentation**: https://github.com/jezweb/claude-skills
