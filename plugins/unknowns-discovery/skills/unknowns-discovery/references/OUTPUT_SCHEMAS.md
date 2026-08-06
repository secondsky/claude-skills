# Output Schemas

## Unknowns matrix

```markdown
# Unknowns Matrix: [Task]

## Known knowns
- [Explicit fact/requirement]

## Known unknowns
| Question | Why it matters | Resolution path | Owner |
|---|---|---|---|

## Unknown knowns
| Tacit criterion | Artifact to reveal it | Feedback needed |
|---|---|---|

## Unknown unknown candidates
| Area | Why hidden risk may exist | Discovery method |
|---|---|---|

## Highest-blast-radius unknown
[One sentence]

## Recommended artifact mode
[blindspot-pass / prototype / interview / etc.]
```

## Blindspot card

```markdown
## Blindspot [n]: [Name]
- Type: [landmine / convention / prior failed attempt / missing concept / hidden dependency]
- Severity: [low / medium / high / critical]
- Evidence inspected: [files/docs/commits/tests]
- Map assumption: [what the prompt implied]
- Territory revealed: [constraint]
- Why it bites: [failure mode]
- Conservative instruction: [what to do if proceeding]
- Prompt upgrade sentence: [copyable sentence]
- Stop condition: [when to pause]
```

## Tweakable plan

```markdown
# Tweakable Plan: [Task]

## Summary
- Effort:
- Files touched:
- Risk:
- Migration/API/user-facing changes:

## A. Decisions you may want to change
| Decision | Default | Alternative | Tradeoff | One-line override |
|---|---|---|---|---|

## B. Execution order
1. [step]
2. [step]

## C. Mechanical work I will handle
- [refactor/plumbing]

## Approval gate
[What the user must approve before implementation]
```

## Implementation notes

```markdown
# Implementation Notes: [Task]

## Summary counters
- Entries:
- Deviations:
- Needs human judgment:

## Log

### [time] Plan-confirmed: [Step]
[What matched the plan]

### [time] Deviation: [Name]
- What the plan said:
- What the code revealed:
- Conservative choice:
- Revisit:

## Fold back into next attempt
1. [learning]
```

## Buy-in doc

```markdown
# Ship Proposal: [Feature]

## Demo / result
[Lead with demo, screenshot, GIF, or crisp description]

## Ask
[Who should approve what by when]

## Reviewer objections answered
| Objection | Answer | Evidence |
|---|---|---|

## Rollout and rollback
- Rollout:
- Metrics:
- Rollback:

## Sign-offs
| Person/team | What they approve | Status |
|---|---|---|
```

## Merge-readiness report and quiz

```markdown
# Merge Readiness: [Change]

## Mental model
[Before -> after]

## What changed
| Area | Change | Why |
|---|---|---|

## Non-obvious behaviors
1. [behavior]

## Quiz
1. [question]
   - Correct answer:
   - Why it matters:
   - Reread if missed:

## Pass criteria
[Example: all correct before merge]
```
