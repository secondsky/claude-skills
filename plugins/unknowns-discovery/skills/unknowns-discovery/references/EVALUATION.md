# Evaluation Guide

## Selection evals

| User request | Should activate? | Expected mode |
|---|---:|---|
| “Add a new OAuth provider; I’ve never touched auth here. What am I missing?” | Yes | blindspot-pass |
| “Make this dashboard look better; I don’t know what style I want.” | Yes | brainstorm-prototype |
| “Before coding, ask me architecture-changing questions one by one.” | Yes | one-question-interview |
| “Port this Rust retry behavior into TypeScript, but prove you understand it first.” | Yes | reference-semantics-map |
| “Keep a log if implementation diverges from the plan.” | Yes | implementation-notes |
| “Summarize this tiny typo fix.” | No | none |
| “Rename variable `foo` to `bar`.” | No | none |
| “Quiz me before I merge this 14-file diff.” | Yes | merge-readiness-quiz |

## Quality rubric

Score 0–3 for each dimension.

### Unknown discovery
- 0: Repeats the request.
- 1: Lists generic risks.
- 2: Finds task-specific unknowns.
- 3: Finds territory-grounded unknowns with evidence and failure modes.

### Blast-radius prioritization
- 0: No prioritization.
- 1: Convenience-based order.
- 2: Identifies high-risk items.
- 3: Orders by what would change architecture, UX, data, permissions, rollout, or cost.

### Artifact usefulness
- 0: Prose only.
- 1: List without decision support.
- 2: Structured artifact with decisions.
- 3: Directly reusable artifact with prompt upgrades and gates.

### Autonomy calibration
- 0: Blocks unnecessarily or guesses dangerously.
- 1: Asks too many questions at once.
- 2: Reasonable ask/proceed behavior.
- 3: Proceeds conservatively on reversible unknowns and pauses only on high-impact ones.

### Carry-forward discipline
- 0: Discoveries not reused.
- 1: Summarized but not actionable.
- 2: Updates prompt or plan.
- 3: Becomes implementation prompt, tests, notes, reviewer docs, or quiz.

## Regression tests

### Test A: Blindspot pass should not implement

Prompt:

```text
I need to add a new SSO provider in an unfamiliar auth module. Do a blindspot pass first.
```

Pass: agent surfaces unknown unknowns and ends with improved prompt; it does not modify code.

### Test B: Interview should ask one question

Prompt:

```text
Interview me about this ambiguous export feature. Prioritize architecture-changing questions.
```

Pass: agent asks exactly one current question, explains why it matters, and maintains a decision table.

### Test C: Tweakable plan should lead with decisions

Prompt:

```text
Write the plan, but show me the parts I’m likely to tweak first.
```

Pass: plan starts with data model/interface/UX/security/rollout decisions, not mechanical steps.

### Test D: Implementation notes should choose conservative options

Prompt:

```text
Implement from this plan and keep notes. If a low-risk edge case appears, choose conservatively and log it.
```

Pass: deviations are logged with plan said / code revealed / conservative choice / revisit; dangerous unknowns pause.

### Test E: Quiz must test real understanding

Prompt:

```text
Give me a report and quiz before I merge this feature.
```

Pass: quiz tests operational and architectural understanding, not trivia.
