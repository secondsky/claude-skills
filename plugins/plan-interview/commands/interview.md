---
name: plan-interview:interview
description: Adaptive interview that probes plans with depth proportional to complexity, generating comprehensive specifications
argument-hint: [plan]
model: opus
---

# Adaptive Plan Interview & Spec Generation

Read the plan file at `$ARGUMENTS` thoroughly. Before asking questions, assess the plan's complexity to calibrate interview depth. Then conduct a rigorous, multi-phase interview using `AskUserQuestion` to extract all implicit knowledge, assumptions, and decisions needed to write a complete specification.

---

## Complexity Assessment

**Before starting the interview, classify the plan:**

| Complexity | Signals | Question Depth |
|------------|---------|----------------|
| **Simple** | Single feature, clear scope, minimal integrations, one user type | 10-15 questions total |
| **Moderate** | Multi-component, some integrations, defined boundaries, 2-3 user types | 18-23 questions total |
| **Complex** | Cross-system, many stakeholders, unclear boundaries, multiple user types, high risk | 22-28 questions total |

**Adapt dynamically**: If answers reveal hidden complexity, probe deeper. If an area is well-specified, move faster.

---

## Interview Philosophy

**Core Principle**: Depth over breadth. Better to deeply understand critical aspects than superficially cover everything.

**Key Techniques**:
- **Ask non-obvious questions** — skip anything the plan already answers clearly
- **Probe edges and boundaries** — what happens in unusual cases?
- **Challenge assumptions** — "You mention X, but what if Y?"
- **Seek concrete examples** — "Give me a specific scenario where..."
- **Follow threads** — if an answer reveals complexity, dig deeper before moving on
- **Detect contradictions** — flag when answers don't align with previous statements
- **Surface assumptions** — make implicit beliefs explicit

> **Deep Dive**: Load `references/interview-techniques.md` for advanced probing patterns.

---

## Interview Phases

### Phase 1: Foundations & Scope (CRITICAL)

**Goal**: Establish crystal-clear understanding of who, what, why, and boundaries.

**Focus Areas**:

1. **Ambiguous Terminology**
   - What terms could mean different things to different people?
   - What concepts need explicit definition?

2. **Stakeholder Analysis**
   - Who uses this? Who maintains it? Who is impacted?
   - Who has veto power? Who must approve?
   - Who will complain loudest if this fails?

3. **Success/Failure Criteria**
   - How do we know this succeeded? What metrics matter?
   - What does failure look like? What are early warning signs?
   - What's the minimum viable success?

4. **Constraint Exploration**
   - What CAN'T we do? (regulatory, technical, political)
   - What's fixed vs negotiable?
   - What resources are limited? (time, budget, people, expertise)

5. **Prior Art Investigation**
   - Has this been tried before? Why did it fail/succeed?
   - What similar solutions exist? Why not use them?
   - What can we learn from others' mistakes?

6. **Dependency Mapping**
   - What must exist before this can work?
   - What depends on this completing?
   - What external systems/teams are involved?

7. **MVP Scope Definition**
   - What's the absolute minimum to prove value?
   - What can be deferred without blocking progress?
   - What features seem essential but aren't?

**Example Questions**:
- "Who will be most upset if this doesn't work? Why?"
- "What's one thing you're assuming is true but haven't verified?"
- "If you had to ship in half the time, what would you cut?"
- "What's the worst-case scenario if this fails?"

**Target**: 4-6 questions (simple: 2-3, complex: 5-6)

> **Deep Dive**: Load `references/phase-1-clarifications.md` for 15+ example questions and common pitfalls.

---

### Phase 2: Technical Deep-Dive

**Goal**: Understand the technical approach, architecture, and engineering trade-offs.

**Focus Areas**:

1. **Architecture Decisions**
   - What's the high-level structure?
   - Why this architecture over alternatives?
   - What patterns are we using/avoiding?

2. **Data Models & State**
   - What are the key entities and relationships?
   - Where does state live? How is it synchronized?
   - What's the source of truth for each data type?

3. **APIs & Integrations**
   - What external systems do we touch?
   - What contracts must we honor?
   - What happens when integrations fail?

4. **Scalability Exploration**
   - What happens at 10x, 100x, 1000x scale?
   - Where are the bottlenecks?
   - What breaks first under load?

5. **Technical Debt Assessment**
   - What compromises are we making? Why?
   - What will we regret in 6 months?
   - What's the cost of not fixing this later?

6. **Observability Planning**
   - How do we know it's working in production?
   - What metrics matter? What alerts trigger action?
   - How do we debug issues at 3am with only logs?

7. **Migration Strategy**
   - How do we get from current to new safely?
   - What's the rollback plan if things go wrong?
   - Data migration requirements?

8. **Security Considerations**
   - What's the threat model?
   - How is authentication/authorization handled?
   - What data is sensitive? How is it protected?

**Example Questions**:
- "If this gets 100x more traffic tomorrow, what breaks first?"
- "What's the one technical decision you're least confident about?"
- "How would you debug this at 3am with only logs?"
- "What existing system will this integration disrupt?"

**Target**: 5-7 questions (simple: 3-4, complex: 6-7)

> **Deep Dive**: Load `references/phase-2-technical.md` for architecture discussion patterns.

---

### Phase 3: User Experience

**Goal**: Understand how users will interact with and perceive the system.

**Focus Areas**:

1. **User Persona Depth**
   - Who specifically uses this? (not just "users")
   - How do novice vs expert needs differ?
   - What do power users need that casual users don't?

2. **User Flows**
   - What's the primary happy path?
   - What are the edge-case flows?
   - Where do users get stuck or confused?

3. **UI States**
   - What are all possible states? (loading, empty, error, success, partial)
   - How do transitions between states feel?
   - What feedback do users get at each step?

4. **Cognitive Load Analysis**
   - What mental models do users need to build?
   - What's confusing? What requires learning?
   - How much context must users hold in memory?

5. **Emotion Mapping**
   - How should users feel at each step?
   - Where might users feel frustrated, confused, or delighted?
   - What builds trust? What erodes it?

6. **Failure Recovery UX**
   - When things go wrong, how do users recover?
   - What error messages do users see? Are they helpful?
   - Can users undo mistakes?

7. **Onboarding & Learning Curve**
   - How do new users get started?
   - What's the "aha moment"?
   - How long until users are productive?

8. **Accessibility**
   - What accessibility standards must be met?
   - How will screen readers interact with this?
   - Keyboard navigation requirements?

**Example Questions**:
- "Walk me through a new user's first 5 minutes. What do they see and do?"
- "What's the single most frustrating thing about the current experience?"
- "When a user sees an error, what information do they need to fix it?"
- "What would a power user wish existed that doesn't?"

**Target**: 4-6 questions (simple: 2-3, complex: 5-6)

> **Deep Dive**: Load `references/phase-3-ux.md` for persona development and UX patterns.

---

### Phase 4: Risks & Tradeoffs

**Goal**: Surface known risks, accepted compromises, and contingency plans.

**Focus Areas**:

1. **Risk Categorization**
   - Technical risks — will the code work?
   - Business risks — will users want it?
   - Operational risks — can we maintain it?
   - Security risks — can it be exploited?
   - Timeline risks — will we ship on time?

2. **Impact/Probability Assessment**
   - Which risks are high impact + high probability? (critical)
   - Which risks are worth accepting vs must mitigate?
   - What's the expected cost if each risk materializes?

3. **Blast Radius Analysis**
   - If this fails, what else fails?
   - Can failures be contained?
   - What's the worst cascade scenario?

4. **Reversibility Assessment**
   - Can we undo this decision if it's wrong?
   - What decisions are one-way doors?
   - What's locked in forever vs changeable later?

5. **Monitoring Triggers**
   - What signals tell us a risk is materializing?
   - When do we escalate?
   - What thresholds trigger action?

6. **Contingency Planning**
   - If X fails, what's Plan B?
   - Who makes the call to pivot?
   - What's pre-approved vs needs approval?

7. **Known Tradeoffs**
   - What compromises have been consciously made?
   - Why are they acceptable?
   - What would change the calculus?

**Example Questions**:
- "What's the one thing that could kill this project entirely?"
- "If you're wrong about [assumption], what's the fallback?"
- "What decision are you making now that you can't easily change later?"
- "What would make you stop and reconsider the whole approach?"

**Target**: 3-5 questions (simple: 2-3, complex: 4-5)

> **Deep Dive**: Load `references/phase-4-risks.md` for risk assessment frameworks.

---

### Phase 5: Operationalization

**Goal**: Understand how this will be built, tested, deployed, and maintained.

**Focus Areas**:

1. **Testing Strategy**
   - Unit, integration, e2e coverage?
   - What's hard to test? How will we handle it?
   - What testing tools/frameworks?

2. **Deployment & Rollout**
   - How will this be deployed?
   - Gradual rollout or big bang?
   - Feature flags needed?

3. **Monitoring & Observability**
   - What metrics will we track?
   - What alerts will we set up?
   - How will we know if it's working?

4. **Migration Path**
   - If replacing existing functionality, how do we transition?
   - Data migration needs?
   - User communication plan?

5. **Documentation**
   - What documentation is needed?
   - Who is the audience?
   - How will it be maintained?

**Target**: 2-3 questions (consistent across complexity levels)

---

### Phase 6: Wrap-Up (Optional)

**Goal**: Catch anything missed.

Only ask if the plan is complex AND you sense gaps remain.

**Single Question**: "Is there anything important we haven't covered that could affect implementation?"

**Target**: 0-1 questions (skip for simple/moderate plans)

---

## Interview Rules

1. **One focused question at a time** — no compound questions
2. **Adapt depth dynamically** — probe deeper when answers reveal complexity
3. **Summarize periodically** — confirm understanding every 3-5 questions
4. **Track open threads** — return to them before concluding
5. **Detect contradictions** — "Earlier you said X, but now you're saying Y. Which is correct?"
6. **Request examples** — "Can you give me a specific scenario where that would happen?"
7. **Continue until confident** — you could implement this yourself

---

## Output

When the interview is complete, write a comprehensive specification to `${ARGUMENTS%.md}-spec.md`:

### Spec Structure

```markdown
# [Project Name] Specification

## Overview
- **Problem**: What problem does this solve?
- **Solution**: High-level approach
- **Success Criteria**: How we know it's working
- **Key Stakeholders**: Who uses, maintains, and is impacted

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

### APIs & Integrations
[Endpoints, contracts, external dependencies]

### Scalability Considerations
[How the system handles growth]

### Security Design
[Authentication, authorization, data protection]

## User Experience

### User Personas
[Specific user types and their needs]

### User Flows
[Step-by-step flows for key scenarios]

### UI States
[Loading, empty, error, success states]

### Edge Cases
[How unusual scenarios are handled]

## Risks & Mitigations

### Risk Register
| Risk | Category | Impact | Probability | Mitigation | Owner |
|------|----------|--------|-------------|------------|-------|
| ... | Technical/Business/Operational/Security/Timeline | High/Medium/Low | High/Medium/Low | ... | ... |

### Accepted Tradeoffs
[Known compromises and why they're acceptable]

### Contingency Plans
[Plan B for critical risks]

## Implementation Notes

### Key Decisions
[Important decisions made during interview with rationale]

### Dependencies
[What must exist before this can work]

### Migration Plan
[How to transition from current to new state]

## Operationalization

### Testing Strategy
[Unit, integration, e2e approach]

### Deployment Plan
[Rollout strategy, feature flags]

### Monitoring & Observability
[Metrics, alerts, dashboards]

## Open Questions
[Anything still unresolved that needs future decision]

## Out of Scope
[Explicitly excluded items to prevent scope creep]

## Phasing

### Phase 1: MVP
[Minimum viable scope with success criteria]

### Phase 2+: Future
[Deferred features and enhancements]
```

---

## Execution Flow

1. **Read the plan file** at `$ARGUMENTS`
2. **Assess complexity** — classify as simple/moderate/complex
3. **Announce approach** — tell the user your assessment and expected depth
4. **Begin Phase 1** — ask your first clarifying question using `AskUserQuestion`
5. **Progress through phases** — one question at a time, following threads
6. **Adapt dynamically** — probe deeper when complexity emerges
7. **Summarize periodically** — confirm understanding every 3-5 questions
8. **Complete phases 1-5** — skip Phase 6 unless needed
9. **Write the spec** — create `${ARGUMENTS%.md}-spec.md` with comprehensive documentation

Begin the interview now.
