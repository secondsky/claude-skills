# Advanced Usage

## Overview

This reference provides advanced patterns for power users of the project-workflow system, including parallel feature planning, complex release workflows, and continuous session management strategies.

## Parallel Feature Planning

### Use Case
Planning multiple features at once to compare scope and prioritize.

### Pattern
```bash
# Step 1: Plan all features
/plan-feature  # Add authentication (generates Phases 9-11)
/plan-feature  # Add payment processing (generates Phases 12-14)
/plan-feature  # Add email notifications (generates Phases 15-16)

# Step 2: Review generated phases
cat IMPLEMENTATION_PHASES.md

# Step 3: Reorder phases by priority
# (Manually edit IMPLEMENTATION_PHASES.md)
# Move payment to Phases 9-11
# Move auth to Phases 12-14
# Keep email as Phases 15-16

# Step 4: Commit reorganized plan
git add IMPLEMENTATION_PHASES.md
git commit -m "plan: Prioritize payment over auth"
```

### Benefits
- See full scope before committing
- Compare implementation complexity across features
- Reorder by business priority
- Team can review complete feature roadmap

### When to Use
- Multiple features needed, priority unclear
- Need stakeholder input on roadmap
- Planning sprint work allocation
- Building MVP vs full product

## Release Workflow with Branches

### Use Case
Safe release process that catches issues before main branch.

### Complete Pattern
```bash
# Step 1: Create release branch
git checkout -b release/v1.0.0

# Step 2: First release check
/release

# Expected output:
# ✓ Most checks pass
# ✗ Some blockers found (missing LICENSE, etc.)
# ⚠ Some warnings (large files, etc.)

# Step 3: Fix blockers
# Let command auto-fix:
# - LICENSE file creation
# - README enhancement
# - .gitignore additions

# Or manual fixes:
git add .
git commit -m "fix: Address release blockers"

# Step 4: Verify fixes
/release  # Should show ✓ Safe to release

# Step 5: Push feature branch
git push -u origin release/v1.0.0

# Step 6: Create PR to main
gh pr create --title "Release v1.0.0" --body "Production release"

# Step 7: After PR review, merge to main
git checkout main
git merge release/v1.0.0

# Step 8: Final release check and GitHub release
/release  # Creates git tag and GitHub release
```

### Benefits
- Catches issues before main branch
- PR review of release preparations
- Safe rollback if issues found
- Team can review release readiness

### When to Use
- Production releases
- Open source projects (public visibility)
- Team environments (PR reviews required)
- High-stakes deployments

## Continuous Session Management

### Use Case
Multi-day projects with clean context handoffs.

### Complete Pattern
```bash
# ==================
# DAY 1: Project Start
# ==================
/plan-project
# Claude: [Generates 8-phase plan]
# Claude: Ready to start Phase 1: Project Setup?

# Work on Phase 1: Project Setup (Cloudflare Worker scaffolding)
# Work on Phase 2: Database Integration (D1 setup, migrations)

# Watch context usage
# When approaching 150k tokens:
/wrap-session

# Claude: [Updates SESSION.md]
# Claude:
# SESSION HANDOFF SUMMARY
# =======================
# Phase: 2/8 - Database Integration (100% complete)
# Completed: Worker setup, D1 database, migrations
# Next Action: Start Phase 3 - API Endpoints (src/routes/api.ts)
# Blockers: None

# ==================
# DAY 2: Resume Work
# ==================
/continue-session

# Claude: [Loads context from SESSION.md]
# Claude:
# SESSION CONTEXT
# ===============
# Phase: 3/8 - API Endpoints (0% complete)
# Last Session: Completed D1 setup
# Next Action: Implement GET /api/users (src/routes/api.ts:1)
# Blockers: None
#
# Ready to implement GET /api/users?

# Work on Phase 3: API Endpoints
# Work on Phase 4: Authentication (Clerk integration)

/wrap-session

# ==================
# DAY 3: Feature Addition
# ==================
/continue-session

# Realize need email notifications (not in original plan)
/plan-feature

# Claude: What feature do you want to add?
# User: Email notifications for user actions
# Claude: [Generates Phases 9-10 for email feature]
# Claude: [Integrates into IMPLEMENTATION_PHASES.md]

# Work on new phases (email service, templates)
/wrap-session

# ==================
# DAY 4: Completion
# ==================
/continue-session

# Work on Phase 5-8 (remaining phases)
# All phases complete

/release

# Claude: [Runs safety checks]
# Claude: ✓ Safe to release
# Claude: Create GitHub release?
# User: Yes
# Claude: [Creates v1.0.0 release]
```

### Benefits
- Never lose context between sessions
- Clear stopping points
- Safe handoffs to other developers
- Progress tracking built-in

### When to Use
- Multi-day projects (>1 session)
- Team environments (handoffs between developers)
- High-complexity projects (requires breaks)
- Learning/experimenting (can pause/resume)

## Advanced Phase Management

### Skipping Phases
Sometimes phases become unnecessary:

```bash
# Original plan has Phase 5: Legacy API Migration
# Decided to skip this phase

# Option 1: Mark as "SKIPPED" in IMPLEMENTATION_PHASES.md
# (Manually edit, add "SKIPPED:" prefix)

# Option 2: Remove phase entirely
# (Manually edit, delete section)

# Update SESSION.md to reflect skip
/wrap-session  # Will see updated phase list
```

### Splitting Phases
Large phases can be split:

```bash
# Phase 3 is too large: "API Endpoints"
# Want to split into:
# - Phase 3a: User Endpoints
# - Phase 3b: Admin Endpoints

# Manually edit IMPLEMENTATION_PHASES.md
# Split Phase 3 into two sections

# Use /plan-feature to regenerate phase numbers
/plan-feature  # Add dummy feature
# Delete the dummy feature phases
# Keep the renumbered user/admin phases
```

## Integration with CI/CD

### Pre-commit Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check if SESSION.md is up to date
if [ -f "SESSION.md" ]; then
  LAST_COMMIT=$(git log -1 --format=%cd)
  LAST_SESSION=$(grep "Last Updated:" SESSION.md | cut -d: -f2)

  # Warn if session outdated
  if [ "$LAST_COMMIT" != "$LAST_SESSION" ]; then
    echo "⚠️  SESSION.md may be outdated. Consider running /wrap-session"
  fi
fi
```

### Pre-push Hooks
```bash
# .git/hooks/pre-push
#!/bin/bash

# If pushing to main, require release check
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  echo "⚠️  Pushing to main. Have you run /release?"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

## Multi-Developer Coordination

### Handoff Protocol
```bash
# Developer A (end of day):
/wrap-session
git push origin feature-branch

# Developer A → Slack:
# "Wrapped session on feature-branch. Next: Implement POST /api/users (src/routes/api.ts:45)"

# Developer B (next day):
git pull origin feature-branch
/continue-session

# Claude shows exactly where to continue
```

### Parallel Development
```bash
# Project structure:
# - main (protected)
# - develop (integration branch)
# - feature/auth (Developer A)
# - feature/payments (Developer B)

# Each developer:
/continue-session  # On their feature branch
# Work independently
/wrap-session
git push origin feature/their-branch

# Integration:
git checkout develop
git merge feature/auth
git merge feature/payments
/release  # Check integration
```

## Customizing Automation Level

### Minimal Automation
```bash
# Use only planning, no session management:
/plan-project  # Get phases
# Manually track progress
# No wrap/resume cycle
/release  # Only for final safety check
```

### Maximum Automation
```bash
# Full workflow with all commands:
/explore-idea
/plan-project
# Work + /wrap-session + /continue-session cycle
/plan-feature  # For every new feature
/release  # With auto-fix enabled
```

### Custom Workflow
```bash
# Mix and match based on needs:
/plan-project  # Want planning
# Skip wrap/continue (short project)
/release  # Want safety checks
```

## Measuring Workflow Efficiency

Track these metrics to optimize:

- **Session count**: How many wrap/resume cycles?
- **Phase drift**: How many phases added via /plan-feature?
- **Release blockers**: How many issues found by /release?
- **Context fills**: How often hitting 150k+ tokens?
- **Manual interventions**: How often manually editing planning docs?

**Healthy metrics:**
- Session count: 3-6 per project
- Phase drift: <30% additional phases
- Release blockers: 0-2 per release
- Context fills: Every 2-4 hours of work
- Manual interventions: <5% of time

## Troubleshooting Advanced Scenarios

### Merge Conflicts in SESSION.md
```bash
# Two developers both wrapped sessions
git pull  # Conflict in SESSION.md

# Resolution:
# 1. Accept one version (usually newer)
# 2. Re-run /wrap-session to generate fresh
git add SESSION.md
git commit
```

### Complex Phase Reordering
Use spreadsheet for planning:
1. Export phases to CSV
2. Reorder in spreadsheet
3. Import back to IMPLEMENTATION_PHASES.md
4. Validate with /continue-session

### Lost SESSION.md
```bash
# SESSION.md accidentally deleted
# Recovery:
git checkout HEAD -- SESSION.md  # Restore from git
# Or:
/plan-project  # Regenerate (loses progress tracking)
```
