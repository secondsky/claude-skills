# unknowns-discovery

Discover and reduce task unknowns — blindspots, missing context, unknown unknowns — before committing to a plan, implementation, review, or merge.

The prompt, ticket, screenshot, and context window are the **map**. The real codebase, product, users, data, constraints, history, and reviewer expectations are the **territory**. The gap between them is the task's **unknowns**. This skill makes the agent surface that gap *before* it guesses.

## What it does

A single router skill (`skills/unknowns-discovery/SKILL.md`) activates on ambiguous, unfamiliar, or high-risk work, then selects one of **11 artifact modes** plus the generic unknowns matrix. Each artifact follows a default output contract: scope read → unknowns found → blast radius → conservative default → decision needed → prompt upgrade → stop conditions.

- **blindspot-pass** — surface hidden constraints, prior art, traps, and missing vocabulary before implementation.
- **teach-me-my-unknowns** — build a mental model and vocabulary ladder when the user lacks domain words.
- **brainstorm-prototype / mock-before-wire** — divergent options and throwaway mocks for taste-dependent decisions.
- **option-space-brainstorm** — re-frame a problem that may be too narrow or too wide.
- **one-question-interview** — one question at a time, ordered by blast radius.
- **reference-semantics-map** — capture existing behavior before porting or adapting.
- **tweakable-plan** — a plan sorted by likely human-tweak points.
- **implementation-notes** — a running log of deviations and conservative choices during the build.
- **buy-in-doc** — a demo-first pitch for stakeholder alignment.
- **merge-readiness-quiz** — a report and quiz a human must pass before merge/release.

Full procedures live in `skills/unknowns-discovery/references/WORKFLOWS.md`; copyable prompt cards in `references/PROMPT_PATTERNS.md`; output schemas in `references/OUTPUT_SCHEMAS.md`.

## Commands

```text
/unknowns-discovery:discover-unknowns [task-or-file]
/unknowns-discovery:blindspot-pass [task-or-area]
/unknowns-discovery:merge-readiness-quiz [change-or-diff]
```

## Contents

```text
unknowns-discovery/
├── .claude-plugin/plugin.json
├── README.md
├── commands/
│   ├── discover-unknowns.md
│   ├── blindspot-pass.md
│   └── merge-readiness-quiz.md
└── skills/unknowns-discovery/
    ├── SKILL.md
    ├── references/        (WORKFLOWS, PROMPT_PATTERNS, OUTPUT_SCHEMAS, EVALUATION, SOURCE_INDEX, TRACEABILITY, ARTICLE_DIGEST)
    ├── assets/templates/  (12 reusable Markdown templates, one per mode)
    ├── examples/          (worked examples across coding, product/design, research)
    └── scripts/           (validate_skill.py, make_unknowns_artifact.py)
```

## Validate

```bash
npm run validate
python plugins/unknowns-discovery/skills/unknowns-discovery/scripts/validate_skill.py \
  plugins/unknowns-discovery/skills/unknowns-discovery
```

## Generate a starter artifact

```bash
python plugins/unknowns-discovery/skills/unknowns-discovery/scripts/make_unknowns_artifact.py \
  --task "Add SSO provider to the auth module" \
  --mode blindspot-pass \
  --domain coding \
  --out blindspot.md
```

## Auto-Trigger Keywords

### Primary
- blindspot pass, blindspots, unknown unknowns, "what am I missing"
- interview me, quiz me, prototype first, implementation notes, buy-in doc
- merge readiness, merge-readiness quiz

### Secondary
- assumptions, assumptions register, reference port, reference-semantics-map
- option space, tweakable plan, domain vocabulary, quality criteria
- unfamiliar codebase, unfamiliar domain, "don't know what good looks like"
- long-horizon implementation, "plan and codebase disagree"

### Error-based
- "merged then it broke", "we reverted this before", diff-skim review
- refactor stalled, "too many unknowns", scope creep mid-implementation
- stakeholder misaligned, surprise data/auth/migration constraint surfaced late

## Provenance

Derived from the article **"A Field Guide to Fable: Finding Your Unknowns"** by Thariq (`@trq212`). The plugin transforms (does not reproduce) the source. See `skills/unknowns-discovery/references/SOURCE_INDEX.md` and `TRACEABILITY.md` for the article→skill mapping.
