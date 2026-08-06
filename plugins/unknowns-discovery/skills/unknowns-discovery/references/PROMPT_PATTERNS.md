# Prompt Patterns

Copy these cards and replace bracketed placeholders.

## Blindspot pass

```text
I'm working on [task] in [codebase/domain], and my familiarity is [none/some/high].
Before implementation, do a blindspot pass:
- inspect [paths/docs/references]
- find relevant unknown unknowns, potholes, prior work, missing concepts, and hidden constraints
- explain why each matters and how it could change the plan
- help me prompt you better
- finish with one improved implementation prompt
Do not change production code yet.
```

## Teach me my unknowns

```text
I need to do [domain task], but I don't know the domain vocabulary or what good looks like.
Teach me enough to prompt like a competent practitioner:
- mental model
- essential vocabulary
- naive phrasing versus precise phrasing
- common mistakes and quality checks
- 3-5 improved prompts I can use next
```

## Brainstorm/prototype directions

```text
I want [artifact/product/UX/design], but I can't describe the style yet and need to react to options.
Create [3-5] wildly different directions using the same sample data/context:
- name each direction by its philosophy
- make the differences obvious
- include what to steal/skip/reject from each
- surface implementation-shaping questions
- produce a concise reply template from my reactions
```

## Mock before wire

```text
Before wiring anything real, create a throwaway [HTML/Markdown/demo/spec] mock of [feature/flow] using fake data.
I want to react to layout and product choices before you touch [real app/API/database/state].
Mark every fake assumption clearly, list open decisions, and end with the real wiring plan.
```

## Option-space brainstorm

```text
Here's my rough problem: [problem].
Search/inspect [codebase/docs/context] and brainstorm [8-12] places we could intervene, from cheapest to most ambitious.
For each option include the existing leverage point, expected impact, effort, risk, reversibility, and the unknown that could change the decision.
I'll tell you which options resonate before we implement.
```

## One-question interview

```text
Interview me one question at a time about anything still ambiguous in [task/feature].
Prioritize questions where my answer would change architecture, data model, permissions, UX, rollout, or risk.
For each question, explain why it matters and what changes based on my answer.
Maintain a decisions table and stop when remaining unknowns are low-risk.
```

## Reference semantics map

```text
[Reference path/link] implements the behavior/design I want for [target].
Read the reference and create a semantics map before implementation:
- what the reference actually does
- which parts translate directly
- which parts cannot be literal and why
- edge cases, invariants, and tests to preserve
- open choices I need to approve
Do not implement until I confirm the map.
```

## Tweakable plan

```text
Write an implementation plan for [task], but lead with the decisions I'm most likely to tweak:
- data model/schema
- type interfaces or public API
- UX/user-facing behavior/copy
- permissions/security/compliance
- rollout and rollback
For each decision, show your default, an alternative, the tradeoff, and a one-line instruction I can send to change it.
Put execution order after those decisions. Put mechanical refactors at the bottom.
```

## Implementation notes

```text
Keep an implementation-notes.md file as you build [task].
If you hit an edge case that forces you to deviate from the plan:
- pick the conservative option if it is reversible and safe
- log it under Deviations with plan said / code revealed / conservative choice / revisit
- keep going only if it does not affect security, data loss, migrations, public API, billing, or compliance
- pause and ask me if it does
At the end, add bullets to fold into the next attempt.
```

## Buy-in doc

```text
Package [prototype/spec/implementation notes/tests] into a single buy-in doc I can send to [reviewers/channel].
Lead with the demo/result.
Then include the ask, why this matters, objections reviewers will raise, evidence, spec/architecture at a glance, risks, rollout, rollback, and exactly who needs to approve what.
```

## Merge-readiness quiz

```text
I want to make sure I understand everything that changed in [branch/diff/feature] before I merge.
Create a merge-readiness report with context, intuition, what was done, non-obvious behaviors, inherited assumptions, operational risks, rollback notes, and a quiz I must pass perfectly.
Wrong answers should point me back to the section I need to reread.
```

## Proceed with assumptions

```text
Proceed with [task] using conservative assumptions.
Before implementation, list assumptions as ASSUMED, mark which ones are reversible, and identify stop conditions.
If you encounter a security/data-loss/migration/public-API/billing/compliance unknown, pause. Otherwise log deviations and continue.
```
