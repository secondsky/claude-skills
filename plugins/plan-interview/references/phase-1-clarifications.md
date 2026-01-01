# Phase 1: Foundations & Scope - Deep Dive

Extended guidance for the most critical interview phase. Phase 1 establishes the foundation for everything that follows.

---

## Stakeholder Analysis Questions

**Primary Stakeholders**:
- "Who is the primary user of this feature? Describe a typical day in their life."
- "Who will maintain this after it's built? What's their technical level?"
- "Who signs off on this being 'done'? What are their success criteria?"

**Affected Parties**:
- "Who else interacts with the systems this touches? How will they be affected?"
- "Who will complain loudest if this breaks? Why?"
- "Are there any regulatory bodies or compliance requirements we need to satisfy?"

**Power Dynamics**:
- "Who has veto power over decisions? What would trigger a veto?"
- "Are there any political considerations we should be aware of?"
- "Who controls the budget and timeline? What are their constraints?"

---

## Success/Failure Criteria Questions

**Defining Success**:
- "How will we measure success 30 days after launch? 90 days?"
- "What specific metric would tell you this is working as intended?"
- "What does 'good enough' look like vs 'excellent'?"

**Defining Failure**:
- "What would make you consider this project a failure?"
- "What are the early warning signs that we're heading in the wrong direction?"
- "If this fails, what's the fallback plan?"

**Minimum Viability**:
- "What's the absolute minimum this needs to do to be useful?"
- "If we could only ship one feature, which would it be?"
- "What would users do without this? How painful is the current workaround?"

---

## Constraint Exploration Questions

**Hard Constraints**:
- "What absolutely cannot change? (deadline, budget, technology stack, etc.)"
- "Are there regulatory or compliance requirements we must meet?"
- "What technical limitations are we working within?"

**Soft Constraints**:
- "What would be difficult but possible to change?"
- "What's the cost of extending the timeline by 2 weeks? 4 weeks?"
- "What resources could we get if we really needed them?"

**Resource Limits**:
- "What's the budget? Is there flexibility?"
- "How many people can work on this? What are their skill levels?"
- "What's the hard deadline? What happens if we miss it?"

---

## Prior Art Investigation Questions

**Previous Attempts**:
- "Has anyone tried to solve this problem before? What happened?"
- "What can we learn from those attempts?"
- "Why is now the right time to try again?"

**Existing Solutions**:
- "What solutions exist in the market? Why aren't we using them?"
- "What would it cost to buy vs build?"
- "Have competitors solved this? How?"

**Lessons Learned**:
- "What mistakes have we made in similar projects?"
- "What worked well that we should repeat?"
- "Who in the organization has relevant experience we should tap?"

---

## Dependency Mapping Questions

**Prerequisites**:
- "What must exist before we can start building?"
- "What infrastructure, data, or systems do we need?"
- "Are there any blocking dependencies?"

**Downstream Impact**:
- "What other systems or teams depend on this completing?"
- "What breaks if we're late?"
- "Who needs to be notified when we ship?"

**External Dependencies**:
- "What external APIs or services do we rely on?"
- "What's the SLA for those dependencies?"
- "What happens if they change or go down?"

---

## MVP Scope Definition Questions

**Core Value**:
- "What's the one thing this MUST do to be valuable?"
- "If you had to ship tomorrow, what would you include?"
- "What's the simplest version that would solve the problem?"

**Deferrable Features**:
- "What features seem essential but could actually wait?"
- "What's the cost of not having feature X in v1?"
- "What would users do as a workaround?"

**Scope Boundaries**:
- "Where exactly does this feature end?"
- "What adjacent problems are we explicitly NOT solving?"
- "What requests should we expect to push back on?"

---

## Common Pitfalls to Avoid

1. **Assuming Shared Understanding**
   - Terms like "user", "performance", "fast" mean different things to different people
   - Always ask: "When you say X, what specifically do you mean?"

2. **Accepting Vague Success Criteria**
   - "Make it better" is not a success criterion
   - Push for specific, measurable outcomes

3. **Ignoring Political Constraints**
   - Technical solutions can be politically impossible
   - Ask about stakeholder dynamics early

4. **Skipping Prior Art**
   - Someone has probably tried this before
   - Learning from their failures saves time

5. **Underestimating Dependencies**
   - Dependencies always take longer than expected
   - Ask about what's blocking and what's blocked

---

## Red Flags to Watch For

- **Conflicting stakeholder goals**: Different people want different things
- **No clear success criteria**: "We'll know it when we see it"
- **Unrealistic constraints**: Impossible timeline, budget, or scope
- **Ignored prior failures**: "This time will be different" without explanation
- **Circular dependencies**: A depends on B depends on A

When you encounter these, probe deeper and surface the conflict explicitly.
