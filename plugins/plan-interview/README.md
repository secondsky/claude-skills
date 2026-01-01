# Plan Interview Plugin

Interview-driven specification generation with quality review. Transform rough plans into comprehensive, implementation-ready specifications through adaptive, structured interviews.

## Features

- **Adaptive Interview** (`/plan-interview:interview`) - Automatically adjusts depth based on plan complexity
- **Spec Reviewer Agent** - Autonomous quality analysis of specifications
- **Smart Hooks** - Auto-suggests interview after plan creation
- **Reference Library** - Deep-dive resources for each interview phase

## Installation

```bash
/plugin install plan-interview@claude-skills
```

Or add to your project:

```bash
cp -r plugins/plan-interview ~/.claude/plugins/
```

## Command

### `/plan-interview:interview [plan]`

Adaptive interview that calibrates depth based on plan complexity:

| Complexity | Signals | Question Count |
|------------|---------|----------------|
| **Simple** | Single feature, clear scope, minimal integrations | 10-15 questions |
| **Moderate** | Multi-component, some integrations, defined boundaries | 18-23 questions |
| **Complex** | Cross-system, many stakeholders, unclear boundaries | 22-28 questions |

**Interview Phases**:

1. **Foundations & Scope** (4-6 questions)
   - Stakeholder analysis
   - Success/failure criteria
   - Constraint exploration
   - Prior art investigation
   - Dependency mapping
   - MVP scope definition

2. **Technical Deep-Dive** (5-7 questions)
   - Architecture decisions
   - Data models & state
   - Scalability exploration
   - Technical debt assessment
   - Observability planning
   - Security considerations

3. **User Experience** (4-6 questions)
   - User persona depth
   - Cognitive load analysis
   - Emotion mapping
   - Failure recovery UX
   - Onboarding & learning curve

4. **Risks & Tradeoffs** (3-5 questions)
   - Risk categorization
   - Blast radius analysis
   - Reversibility assessment
   - Contingency planning

5. **Operationalization** (2-3 questions)
   - Testing strategy
   - Deployment plan
   - Monitoring & observability

6. **Wrap-Up** (0-1 questions, optional)
   - Only for complex plans with gaps

```bash
/plan-interview:interview docs/feature-plan.md
# Output: docs/feature-plan-spec.md
```

## Spec Reviewer Agent

After generating a spec, the `spec-reviewer` agent analyzes quality across 4 dimensions:

- **Completeness** (25 pts) - All sections populated?
- **Consistency** (25 pts) - No contradictions?
- **Clarity** (25 pts) - No ambiguous language?
- **Edge Cases** (25 pts) - Error handling defined?

**Triggers when you**:
- Say "review my spec" or "check specification quality"
- Generate a spec (proactively offered at session end)

Output includes quality score (A-F), issues by severity, and recommended fixes.

## Reference Library

The plugin includes deep-dive references for each phase:

| Reference | Purpose |
|-----------|---------|
| `references/phase-1-clarifications.md` | 15+ example questions, common pitfalls |
| `references/phase-2-technical.md` | Architecture discussion patterns |
| `references/phase-3-ux.md` | Persona development, UX patterns |
| `references/phase-4-risks.md` | Risk assessment frameworks |
| `references/interview-techniques.md` | Cross-cutting interview skills |
| `references/example-spec.md` | Annotated high-quality spec example |

These are loaded by the interviewer as needed for deeper guidance.

## Smart Hooks

The plugin includes hooks that:
- Suggest running interview when `*plan*.md` files are created
- Offer spec review before session ends (if spec was generated)

## Interview Philosophy

**Core Principle**: Depth over breadth. Better to deeply understand critical aspects than superficially cover everything.

**Key Techniques**:
- **Non-obvious questions** - Skip anything the plan already answers
- **Edge probing** - What happens in unusual cases?
- **Assumption surfacing** - Make implicit beliefs explicit
- **Contradiction detection** - Flag when answers don't align
- **Concrete examples** - "Give me a specific scenario..."
- **Follow-through** - Dig deeper when complexity emerges
- **Adaptive depth** - Probe deeper on complex areas, move faster on clear ones

## Spec Output Format

Generated specs include:

- **Overview**: Problem, solution, success criteria, key stakeholders
- **Requirements**: Functional and non-functional
- **Technical Design**: Architecture, data models, APIs, scalability, security
- **User Experience**: Personas, flows, states, edge cases
- **Risks & Mitigations**: Risk register, accepted tradeoffs, contingency plans
- **Implementation Notes**: Key decisions with rationale, dependencies
- **Operationalization**: Testing, deployment, monitoring
- **Open Questions**: Unresolved items needing decisions
- **Out of Scope**: Explicitly excluded items
- **Phasing**: MVP vs future enhancements

## Example Workflow

```bash
# 1. You have a rough plan
cat docs/auth-plan.md

# 2. Run adaptive interview
/plan-interview:interview docs/auth-plan.md

# 3. Claude assesses complexity and announces approach
# "This looks like a moderate-complexity plan. I'll ask 18-23 questions."

# 4. Answer questions interactively (one at a time)
# Interview adapts depth based on your answers

# 5. Output: docs/auth-plan-spec.md

# 6. Review quality (automatic or manual)
# "Review the spec I just created"
# Output: Quality report with score and issues
```

## Version History

- **v2.0.0** - Adaptive interview (merged interview + quick into single adaptive command)
- **v1.1.0** - Added spec-reviewer agent, smart hooks
- **v1.0.0** - Initial release with interview and quick commands

## License

MIT
