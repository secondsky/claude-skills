# Complete Workflow Examples

## Overview

This reference provides complete workflow patterns showing how the 7 project-workflow commands work together across different project scenarios.

## Full Workflow (with Exploration)

For new projects where you're still validating the approach:

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

**Timeline**: 2-4 weeks for typical full-stack project
**Commands Used**: All 7 commands

## Quick Workflow (Clear Requirements)

For projects with well-defined requirements:

```
1. Clear requirements → /plan-project
   → [Creates planning docs]

2. Work on implementation

3. /wrap-session when context full

4. /continue-session to resume

5. /release when ready to publish
```

**Timeline**: 1-2 weeks for typical feature
**Commands Used**: 4 commands (plan-project, wrap-session, continue-session, release)

## Helper Workflows

### Need Guidance
```
/workflow → [Interactive guide to commands]
```

### Adding Feature to Existing Project
```
/plan-feature → [Generates and integrates new phases]
```

### Ready to Publish
```
/release → [Safety checks + GitHub release]
```

## When to Use Which Workflow

**Use Full Workflow when:**
- Starting brand new project
- Multiple technology options to evaluate
- Need validation before committing
- Complex architecture decisions

**Use Quick Workflow when:**
- Requirements are clear and validated
- Tech stack decided
- Following established patterns
- Time-constrained projects

**Use Helper Workflows when:**
- Adding features to existing projects (/plan-feature)
- First time using the system (/workflow)
- Ready to deploy (/release)
- Just need specific command, not full cycle

## Integration Patterns

All workflows follow the same session cycle:
1. **Start**: /continue-session (or /plan-project for new)
2. **Work**: Implementation with Claude
3. **Checkpoint**: /wrap-session
4. **Repeat**: Until project complete
5. **Publish**: /release

The cycle ensures safe context handoffs and prevents work loss.
