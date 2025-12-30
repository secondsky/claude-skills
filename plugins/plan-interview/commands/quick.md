---
name: plan-interview:quick
description: Quick 3-phase interview for simpler plans (clarifications, technical, phasing)
argument-hint: [plan]
model: opus
---

# Quick Plan Interview

Read the plan file at `$ARGUMENTS` and conduct a streamlined 3-phase interview focusing on the essentials: clarifications, technical design, and phasing.

**Use this when:**
- Plan is straightforward
- Time is limited
- UX/risks/operations are already well-defined

For comprehensive interviews, use `/plan-interview:interview` instead.

---

## Interview Philosophy

- Ask **non-obvious questions** — skip what's clearly stated
- Probe **boundaries** — what's in/out of scope?
- Seek **concrete examples** when answers are abstract
- One question at a time, follow threads

---

## Interview Phases

### Phase 1: Clarifications & Gaps

Focus on:
- Ambiguous terminology or undefined concepts
- Missing pieces the plan assumes but doesn't state
- Scope boundaries — what's explicitly out of scope?

### Phase 2: Technical Deep-Dive

Focus on:
- Architecture decisions and rationale
- Data models, state management, persistence
- APIs, integrations, external dependencies
- Error handling and failure modes
- Security considerations

### Phase 3: Prioritization & Phasing

Focus on:
- MVP vs. full vision — what's truly essential?
- Logical build order
- What can be deferred?

---

## Interview Rules

1. **One focused question at a time**
2. After each answer: probe deeper OR move on
3. Summarize every 3-4 questions
4. Continue until implementation is clear

---

## Output

Write specification to `${ARGUMENTS%.md}-spec.md`:

```markdown
# [Project Name] Specification

> Generated via quick interview (3-phase)

## Overview
- **Problem**: [What problem this solves]
- **Solution**: [High-level approach]
- **Success Criteria**: [How we know it's working]

## Requirements

### Functional Requirements
[Numbered list]

### Non-Functional Requirements
[Performance, security, etc.]

## Technical Design

### Architecture
[System design, components, data flow]

### Data Models
[Key entities and relationships]

### APIs
[Endpoints, contracts]

## Implementation Notes

### Key Decisions
[Decisions from interview with rationale]

## Phasing

### Phase 1: MVP
[Minimum viable scope]

### Future Phases
[Deferred items]

## Out of Scope
[Explicitly excluded]

---
*Note: This spec was generated via quick 3-phase interview. Consider running full `/plan-interview:interview` for comprehensive coverage of UX, risks, and operations.*
```

---

## Execution Flow

1. **Read the plan file** at `$ARGUMENTS`
2. **Phase 1** — Clarify ambiguities (2-4 questions)
3. **Phase 2** — Technical deep-dive (3-5 questions)
4. **Phase 3** — Prioritization (2-3 questions)
5. **Write the spec** — create `${ARGUMENTS%.md}-spec.md`

Begin the interview now.
