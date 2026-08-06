# Article-to-Skill Traceability

This file maps the supplied article sections to the package components that implement them.

| Supplied article section / idea | Skill implementation |
|---|---|
| “The map is not the territory” | `SKILL.md` core idea and `ARTICLE_DIGEST.md` central thesis |
| Unknowns as the gap between prompt/context and real work | `SKILL.md` core loop; `assets/templates/unknowns-matrix.md` |
| Known knowns, known unknowns, unknown knowns, unknown unknowns | `SKILL.md` unknown types table; `OUTPUT_SCHEMAS.md` unknowns matrix |
| Balance between too-specific and too-vague instructions | `SKILL.md` autonomy rules; `PROMPT_PATTERNS.md` proceed-with-assumptions card |
| Give the agent context about your starting point | `WORKFLOWS.md` common setup; all templates include user starting point/scope |
| Blind Spot Pass | `blindspot-pass` mode; `assets/templates/blindspot-pass.md`; `examples/coding-auth-provider.md` |
| Teach domain unknowns, e.g. color grading | `teach-me-my-unknowns` mode; `assets/templates/domain-vocabulary-ladder.md` |
| Brainstorms and prototypes for unknown knowns | `brainstorm-prototype` mode; `assets/templates/brainstorm-prototype.md`; `examples/product-design-dashboard.md` |
| Mock before wiring backend/app state | `mock-before-wire` mode; prompt card and workflow gate |
| Search codebase and brainstorm interventions | `option-space-brainstorm` mode; prompt card and workflow |
| Interviews one question at a time | `one-question-interview` mode; `assets/templates/one-question-interview.md` |
| References, especially source code, as best descriptions | `reference-semantics-map` mode; `assets/templates/reference-semantics-map.md` |
| Implementation plans focused on tweakable decisions | `tweakable-plan` mode; `assets/templates/tweakable-plan.md` |
| Implementation notes during work | `implementation-notes` mode; `assets/templates/implementation-notes.md` |
| Pitches and explainers for buy-in | `buy-in-doc` mode; `assets/templates/buy-in-doc.md` |
| Quizzes before merge | `merge-readiness-quiz` mode; `assets/templates/merge-readiness-quiz.md` |
| Fable launch video as end-to-end example | `ARTICLE_DIGEST.md` end-to-end example extracted from the article |
| “Every explainer, brainstorm, interview, prototype, and reference is cheap” | `SKILL.md` core loop and default output contract |

## Design choices made while packaging

- The article is transformed into an operational skill rather than copied verbatim.
- `SKILL.md` is kept as the routing layer; detailed procedures live in `references/`.
- Reusable work products live in `assets/templates/`.
- Example applications demonstrate the same patterns in coding, design, and research.
- Optional scripts are deterministic only; they scaffold artifacts and validate package structure but do not call external services.
