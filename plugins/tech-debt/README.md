# tech-debt

A two-mode skill for managing technical debt across its lifecycle. The skill **routes** between the two modes based on whether the user is making a change right now.

## What it does

- **Mode A — Prevent:** while making a change (feature/fix/refactor), rework it toward the intended end state. Delete dead compatibility paths instead of preserving them; prefer one clear component over mode flags. (Stance: `zero-tech-debt`.)
- **Mode B — Triage:** while assessing existing code, categorize debt (code / architecture / test / dependency / documentation / infrastructure), score it by Impact × Risk × inverse-Effort, and produce a phased remediation plan that runs alongside feature work. (Stance: `anthropics/tech-debt`.)

The router lives in `skills/tech-debt/SKILL.md`. Each mode's full steps, rules, and examples live in its own reference:

- `skills/tech-debt/references/prevent-during-change.md` — Mode A
- `skills/tech-debt/references/triage-backlog.md` — Mode B

## Auto-Trigger Keywords

### Primary
- tech debt, technical debt, tech-debt audit, tech-debt assessment
- refactor, refactoring, rework this change
- zero tech debt, "no bandaids", "do this properly"

### Secondary
- dead code, compatibility cruft, mode flag, wrapper, fallback, alias, route alias
- code health, code quality, maintenance backlog, remediation plan
- architecture debt, dependency debt, test debt, documentation debt, infrastructure debt
- "what should we refactor", prioritize, prioritization

### Error-based
- "this change got messy", "too many conditionals", "why is this still here"
- regressions shipping (test debt), flaky tests
- security vulnerability from an outdated dependency, CVE
- onboarding pain, tribal knowledge, "nobody knows how this works"
- manual deploy broke (infra debt), no monitoring caught the incident
