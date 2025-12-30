---
name: plan-interview:interview
description: Interview me about the plan to generate a comprehensive specification
argument-hint: [plan]
model: opus
---

# Plan Interview & Spec Generation

Read the plan file at `$ARGUMENTS` thoroughly, then conduct a rigorous, multi-phase interview using `AskUserQuestion` to extract all implicit knowledge, assumptions, and decisions needed to write a complete specification.

## Interview Philosophy

- Ask **non-obvious questions** — skip anything the plan already answers clearly
- Probe the **edges and boundaries** — what happens in unusual cases?
- Challenge assumptions — "You mention X, but what if Y?"
- Seek **concrete examples** when answers are abstract
- Follow threads — if an answer reveals complexity, dig deeper before moving on

---

## Interview Phases

### Phase 1: Clarifications & Gaps

Focus on:
- Ambiguous terminology or undefined concepts
- Missing pieces the plan assumes but doesn't state
- Scope boundaries — what's explicitly out of scope?

### Phase 2: Technical Deep-Dive

Focus on:
- Architecture decisions and their rationale
- Data models, state management, persistence
- APIs, integrations, external dependencies
- Performance requirements and constraints
- Error handling, failure modes, recovery strategies
- Security considerations, authentication, authorization

### Phase 3: User Experience

Focus on:
- User flows for primary and edge-case scenarios
- UI states: loading, empty, error, success, partial
- Accessibility requirements
- Responsive/multi-platform considerations
- Copy, messaging, and tone

### Phase 4: Tradeoffs & Risks

Focus on:
- Known tradeoffs and why they were chosen
- Technical debt being intentionally accepted
- Risks and mitigation strategies
- Dependencies on external factors or teams
- What could make this fail?

### Phase 5: Operationalization

Focus on:
- Testing strategy (unit, integration, e2e)
- Deployment and rollout plan
- Monitoring, logging, observability
- Migration path if replacing existing functionality
- Documentation needs

### Phase 6: Prioritization & Phasing

Focus on:
- MVP vs. full vision — what's truly essential?
- Logical build order
- What can be deferred without blocking progress?

---

## Interview Rules

1. Ask **one focused question at a time** — no compound questions
2. After each answer, decide: probe deeper OR move to next topic
3. Summarize your understanding periodically to confirm alignment
4. Track open threads — return to them before concluding
5. Continue until you could confidently implement this yourself

---

## Output

When the interview is complete, write a comprehensive specification to `${ARGUMENTS%.md}-spec.md` that includes:

### Spec Structure

```markdown
# [Project Name] Specification

## Overview
- **Problem**: What problem does this solve?
- **Solution**: High-level approach
- **Success Criteria**: How we know it's working

## Detailed Requirements

### Functional Requirements
[Numbered list of what the system must do]

### Non-Functional Requirements
[Performance, security, scalability, accessibility requirements]

## Technical Design

### Architecture
[System architecture, component breakdown, data flow]

### Data Models
[Key entities, relationships, schemas]

### APIs
[Endpoints, contracts, integrations]

## User Experience

### User Flows
[Step-by-step flows for key scenarios]

### UI States
[Loading, empty, error, success states]

### Edge Cases
[How unusual scenarios are handled]

## Implementation Notes

### Key Decisions
[Important decisions made during interview with rationale]

### Tradeoffs Accepted
[Known compromises and why they're acceptable]

### Risks & Mitigations
[Identified risks and how they'll be addressed]

## Open Questions
[Anything still unresolved that needs future decision]

## Out of Scope
[Explicitly excluded items to prevent scope creep]

## Phasing

### Phase 1: MVP
[Minimum viable scope]

### Phase 2+: Future
[Deferred features and enhancements]
```

---

## Execution Flow

1. **Read the plan file** at `$ARGUMENTS`
2. **Analyze** what's clearly specified vs. what's ambiguous
3. **Begin Phase 1** — ask your first clarifying question using `AskUserQuestion`
4. **Progress through phases** — one question at a time, following threads
5. **Periodically summarize** — confirm understanding every 3-5 questions
6. **Complete all phases** — don't rush; thoroughness over speed
7. **Write the spec** — create `${ARGUMENTS%.md}-spec.md` with comprehensive documentation

Begin the interview now.
