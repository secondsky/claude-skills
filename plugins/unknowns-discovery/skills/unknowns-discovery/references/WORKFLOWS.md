# Workflows

Use these procedures after `SKILL.md` selects a mode. Keep outputs concrete. The goal is not to write essays; it is to make hidden decisions visible early.

## Common setup

1. Restate the task in one sentence.
2. List user starting point: experience, familiarity, confidence, known context.
3. List the territory to inspect: code paths, docs, data, examples, screenshots, references, internet sources, prior work.
4. Fill a minimal unknowns matrix.
5. Identify the highest-blast-radius unknown.
6. Choose the cheapest artifact that can reveal it.
7. End with either a prompt upgrade, a decision request, or a gated implementation plan.

## Mode: blindspot-pass

**Use when:** Starting unfamiliar work, especially codebase areas, design domains, auth/payments/data, or any task where the user might not know the questions to ask.

**Procedure:**

1. Inspect the named territory before planning implementation.
2. Search for hidden constraints: prior attempts, tests, feature flags, conventions, migrations, auth/permission paths, data assumptions, stakeholder rules, and quality standards.
3. Produce blindspot cards with evidence and failure modes.
4. Explain how each blindspot changes the prompt.
5. Assemble one improved implementation prompt.

**Gate:** Do not implement until high-severity blindspots are resolved or explicitly accepted.

## Mode: teach-me-my-unknowns

**Use when:** The user lacks vocabulary or does not know what good looks like.

**Procedure:**

1. Teach the minimum useful mental model.
2. Define essential vocabulary.
3. Show naive wording vs precise wording.
4. Explain common mistakes and quality checks.
5. End with improved prompts the user could not have written before.

**Gate:** Proceed only after the user can choose or accept vocabulary/style/quality defaults.

## Mode: brainstorm-prototype

**Use when:** User criteria are tacit and visual/product/UX/design choices may reshape implementation.

**Procedure:**

1. Hold the core data/scenario constant.
2. Create several deliberately different directions.
3. Label the philosophy of each direction.
4. Include what to steal, skip, or reject.
5. Expose implementation-shaping decisions.
6. Provide a reaction template that turns feedback into a prompt.

**Gate:** Do not wire real app/backend/state until the user reacts or accepts assumptions.

## Mode: mock-before-wire

**Use when:** The user needs to see UI or workflow before touching real code.

**Procedure:**

1. Create a throwaway mock, usually standalone HTML or Markdown.
2. Use fake data and clearly label it.
3. Include key states and open layout/product questions.
4. End with the real wiring plan once approved.

**Gate:** Treat the mock as disposable; do not let prototype code leak into production without a deliberate plan.

## Mode: option-space-brainstorm

**Use when:** The problem framing may be too narrow or too broad.

**Procedure:**

1. Search the territory for possible leverage points.
2. Produce options from cheapest to most ambitious.
3. For each option, include effort, impact, risk, reversibility, and unknowns.
4. Ask which options resonate before implementing.

**Gate:** Do not treat the first idea as the plan until the option space is visible.

## Mode: one-question-interview

**Use when:** Ambiguity remains after exploration.

**Procedure:**

1. Internally rank questions by whether the answer changes architecture, UX, data model, permissions, scope, or rollout.
2. Ask only the top question.
3. Explain why it matters and what changes based on each answer.
4. Record the decision.
5. Ask the next question only after the user answers.

**Gate:** Do not dump a long questionnaire unless the user explicitly asks for one.

## Mode: reference-semantics-map

**Use when:** The desired behavior is better represented by code, component, screenshot, library, or document than by a verbal description.

**Procedure:**

1. Read the reference first.
2. Extract semantics, not syntax.
3. Map direct translations and non-literal translations.
4. Identify edge cases, invariants, tests, and behavior boundaries.
5. Ask for approval on material differences before implementation.

**Gate:** No port/adaptation until the agent can prove it understood the reference.

## Mode: tweakable-plan

**Use when:** Implementation is close but plan review should surface things the human may alter.

**Procedure:**

1. Sort the plan by likelihood of human tweak, not execution order.
2. Lead with data model, type interfaces, public API, UX flow, user-facing copy, permissions, rollout, and rollback.
3. For each tweakable choice, give default, alternative, tradeoff, and one-line override.
4. Put execution order next.
5. Collapse mechanical refactors at the bottom.

**Gate:** Start implementation after high-tweak decisions are approved or intentionally assumed.

## Mode: implementation-notes

**Use when:** Implementation is underway and the agent may discover hidden constraints.

**Procedure:**

1. Create/update `implementation-notes.md` or `.html`.
2. Log plan-confirmed progress briefly.
3. For deviations, record: plan said / code revealed / conservative choice / revisit.
4. Continue only for safe reversible deviations.
5. Pause for security, data loss, migration, public API, billing, or compliance deviations.
6. End with “fold back into next attempt” bullets.

## Mode: buy-in-doc

**Use when:** The work needs review, approval, alignment, or rollout support.

**Procedure:**

1. Lead with demo/result.
2. State the ask.
3. Explain why the work matters.
4. Pre-answer likely reviewer objections with evidence.
5. Include spec/architecture at a glance.
6. Name risk, rollout, rollback, metrics, and signoffs.

**Gate:** A buy-in doc is incomplete if it does not say who needs to approve what.

## Mode: merge-readiness-quiz

**Use when:** The human needs to understand complex agent work before merge/release.

**Procedure:**

1. Explain the mental model before and after.
2. Summarize what changed and why.
3. Highlight non-obvious behavior and inherited assumptions.
4. Include operational risks and rollback.
5. Write a quiz that tests actual understanding, not trivia.
6. Include pass criteria and reread sections for wrong answers.

**Gate:** Merge only after the user passes the quiz or explicitly waives the gate.
