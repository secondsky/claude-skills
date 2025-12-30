# Plan Interview Plugin

Interview-driven specification generation with quality review. Transform rough plans into comprehensive, implementation-ready specifications through structured interviews.

## Features

- **Full Interview** (`/plan-interview:interview`) - Rigorous 6-phase interview
- **Quick Interview** (`/plan-interview:quick`) - Streamlined 3-phase for simpler plans
- **Spec Reviewer Agent** - Autonomous quality analysis of specifications
- **Smart Hooks** - Auto-suggests interview after plan creation

## Installation

```bash
/plugin install plan-interview@claude-skills
```

Or add to your project:

```bash
cp -r plugins/plan-interview ~/.claude/plugins/
```

## Commands

### `/plan-interview:interview [plan]`

Full 6-phase interview for comprehensive specifications:

1. **Clarifications & Gaps** - Undefined concepts, missing pieces, scope
2. **Technical Deep-Dive** - Architecture, data models, APIs, security
3. **User Experience** - User flows, UI states, accessibility
4. **Tradeoffs & Risks** - Known compromises, risk mitigation
5. **Operationalization** - Testing, deployment, monitoring
6. **Prioritization & Phasing** - MVP vs full vision, build order

```bash
/plan-interview:interview docs/feature-plan.md
# Output: docs/feature-plan-spec.md
```

### `/plan-interview:quick [plan]`

Streamlined 3-phase interview for simpler plans or time pressure:

1. **Clarifications & Gaps** - Scope and definitions
2. **Technical Deep-Dive** - Architecture and design
3. **Prioritization & Phasing** - MVP and build order

```bash
/plan-interview:quick docs/simple-feature-plan.md
# Output: docs/simple-feature-plan-spec.md
```

## Spec Reviewer Agent

After generating a spec, the `spec-reviewer` agent can analyze quality:

- **Completeness** - All sections populated?
- **Consistency** - No contradictions?
- **Clarity** - No ambiguous language?
- **Edge Cases** - Error handling defined?

Triggers when you:
- Say "review my spec" or "check specification quality"
- Generate a spec (proactively offered)

Output includes quality score (A-F), issues by severity, and recommended fixes.

## Smart Hooks

The plugin includes hooks that:
- Suggest running interview when `*plan*.md` files are created
- Offer spec review before session ends (if spec was generated)

## Interview Philosophy

- Asks **non-obvious questions** — skips what's clearly stated
- Probes **edges and boundaries** — what happens in unusual cases?
- Challenges assumptions — "You mention X, but what if Y?"
- Seeks **concrete examples** when answers are abstract
- Follows threads — digs deeper when complexity emerges

## Spec Output Format

Generated specs include:

- **Overview**: Problem, solution, success criteria
- **Requirements**: Functional and non-functional
- **Technical Design**: Architecture, data models, APIs
- **User Experience**: Flows, states, edge cases
- **Implementation Notes**: Key decisions with rationale
- **Open Questions**: Unresolved items
- **Out of Scope**: Explicitly excluded
- **Phasing**: MVP vs future

## Example Workflow

```bash
# 1. You have a rough plan
cat docs/auth-plan.md

# 2. Run full interview
/plan-interview:interview docs/auth-plan.md

# 3. Answer ~15-20 questions interactively
# Output: docs/auth-plan-spec.md

# 4. Review quality (automatic or manual)
# "Review the spec I just created"
# Output: Quality report with score and issues
```

## When to Use Each Command

| Scenario | Command |
|----------|---------|
| Complex feature with UX/risks | `/plan-interview:interview` |
| Simple backend change | `/plan-interview:quick` |
| Time-constrained | `/plan-interview:quick` |
| Critical system change | `/plan-interview:interview` |

## License

MIT
