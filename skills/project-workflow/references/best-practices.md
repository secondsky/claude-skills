# Best Practices

## Overview

This reference provides recommended patterns for using project-workflow commands effectively. Following these practices maximizes productivity and prevents common issues.

## 1. Use /explore-idea for New Ideas

### Why
Prevents building on invalid assumptions or choosing wrong tech stack.

### Best Practice
- **Do**: Run `/explore-idea` for any new project concept
- **Do**: Let Claude conduct heavy research and challenge assumptions
- **Do**: Create PROJECT_BRIEF.md with validated decisions before planning
- **Don't**: Skip validation and go straight to `/plan-project`
- **Don't**: Assume your first tech choice is best

### Time Investment vs Savings
- Investment: 10-15 minutes for research
- Savings: Hours or days from avoiding wrong architecture

### Example
```
Bad: "Build a Cloudflare chatbot" → /plan-project → realize memory requirements exceed D1 limits
Good: /explore-idea → research D1 vs Durable Objects → validate approach → /plan-project with correct tech
```

## 2. Plan Before Implementing

### Why
Structured plans prevent scope creep and provide verification criteria for each phase.

### Best Practice
- **Do**: Run `/plan-project` at start of every project
- **Do**: Review IMPLEMENTATION_PHASES.md carefully before Phase 1
- **Do**: Commit planning docs to git before any code
- **Don't**: Start coding without planning
- **Don't**: Keep planning docs local only

### Time Investment vs Savings
- Investment: 5-7 minutes for planning generation
- Savings: Hours from prevented scope creep and clear phase boundaries

### Example
```
Bad: Start coding → realize missing database → realize need auth → scope creep
Good: /plan-project → clear 8 phases → implement systematically → stay on track
```

## 3. Wrap Sessions Before Context Full

### Why
Context window limits (200k tokens) cause errors. Wrapping early ensures safe handoffs.

### Best Practice
- **Do**: Monitor token usage (use `/context` command if available)
- **Do**: Wrap around 150k tokens (75% full)
- **Do**: Wrap at natural stopping points (phase completion, feature done)
- **Don't**: Wait until context maxed out (200k)
- **Don't**: Forget to wrap at session end

### Monitoring Context
```bash
# If /context command exists:
/context

# Look for "Token usage: XXX/200000"
# Wrap when > 150,000
```

### Example
```
Bad: Hit 200k tokens → error → lost work → manual recovery
Good: Notice 150k tokens → /wrap-session → clean handoff → /continue-session next time
```

## 4. Resume with Context

### Why
Starting sessions without context leads to repeated questions and lost efficiency.

### Best Practice
- **Do**: Always start new sessions with `/continue-session`
- **Do**: Review git history shown (last 5 commits)
- **Do**: Confirm Next Action before proceeding
- **Do**: Adjust direction if priorities changed
- **Don't**: Start implementing without loading context
- **Don't**: Ignore the Next Action guidance

### Example
```
Bad: New session → "What were we working on?" → 5 min context recovery
Good: /continue-session → instant context → "Ready to implement POST /api/users?" → proceed
```

## 5. Feature Planning

### Why
Ad-hoc features without planning lead to scope creep and integration issues.

### Best Practice
- **Do**: Use `/plan-feature` for every new feature
- **Do**: Let command handle phase renumbering automatically
- **Do**: Keep IMPLEMENTATION_PHASES.md synchronized with reality
- **Don't**: Add features without updating planning docs
- **Don't**: Manually edit phase numbers (renumbering is error-prone)

### Example
```
Bad: "Add auth feature" → implement → IMPLEMENTATION_PHASES.md outdated → confusion
Good: /plan-feature → generates Phases 9-11 for auth → IMPLEMENTATION_PHASES.md updated → clear path
```

## 6. Release Safely

### Why
Public releases with secrets, missing licenses, or incomplete docs damage credibility.

### Best Practice
- **Do**: Run `/release` on feature branches first (not main)
- **Do**: Fix all blockers before merging to main
- **Do**: Use auto-fix for LICENSE/README issues
- **Do**: Review flagged secrets carefully (false positives happen)
- **Don't**: Push directly to main without release check
- **Don't**: Ignore warnings (address or document why safe)

### Safe Release Workflow
```bash
# 1. Create release branch
git checkout -b release/v1.0.0

# 2. Run release check
/release

# 3. Fix any blockers
# (Let command auto-fix or manual fixes)

# 4. Push feature branch
git push -u origin release/v1.0.0

# 5. Create PR to main
# 6. After review, merge to main
```

### Example
```
Bad: git push origin main → GitHub users find exposed API key → security incident
Good: /release → finds API key → add to .gitignore → remove from history → safe push
```

## 7. Use /workflow When Unsure

### Why
Interactive guidance prevents using wrong command or forgetting commands exist.

### Best Practice
- **Do**: Run `/workflow` when unsure which command to use
- **Do**: Use it to learn command relationships
- **Do**: Share with team members unfamiliar with workflow
- **Don't**: Guess which command to use
- **Don't**: Skip available automation

## 8. Keep Planning Docs in Sync

### Why
Outdated planning docs lead to confusion and repeated questions.

### Best Practice
- **Do**: Let commands update planning docs automatically
- **Do**: Commit planning doc changes with implementation
- **Do**: Review planning docs during /continue-session
- **Don't**: Manually edit SESSION.md unless necessary
- **Don't**: Let IMPLEMENTATION_PHASES.md drift from reality

## 9. Git Best Practices

### Why
Workflow commands rely on git for checkpoints and history.

### Best Practice
- **Do**: Commit frequently (workflow creates checkpoint commits)
- **Do**: Use descriptive commit messages (command-generated ones are good)
- **Do**: Push checkpoints to remote (backup + collaboration)
- **Don't**: Work without git initialized
- **Don't**: Skip git for "small projects" (they grow)

## 10. Document Workflow for Team

### Why
Team consistency improves with shared workflow knowledge.

### Best Practice
- **Do**: Add workflow overview to team README
- **Do**: Document which commands team uses
- **Do**: Share customizations (templates, configurations)
- **Don't**: Assume everyone knows workflow commands
- **Don't**: Let each team member use different approaches

### Team Documentation Template
```markdown
## Project Workflow

This project uses [project-workflow](https://github.com/secondsky/claude-skills) commands:

- New features: `/plan-feature` → implement → `/wrap-session`
- Session start: `/continue-session`
- Session end: `/wrap-session`
- Release: `/release` on feature branch

See `/workflow` for guidance.
```

## Measuring Success

You're using workflow effectively when:
- ✅ No "What were we working on?" at session start
- ✅ Planning docs always match reality
- ✅ Never hit context limits unexpectedly
- ✅ Releases have zero secret leaks
- ✅ Team members can resume each other's work easily
- ✅ Clear Next Actions after every /wrap-session
