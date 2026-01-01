# Phase 4: Risks & Tradeoffs - Deep Dive

Extended guidance for surfacing, assessing, and mitigating risks.

---

## Risk Categorization Questions

**Technical Risks**:
- "What technical unknowns could derail us?"
- "What parts of the implementation are we least confident about?"
- "What dependencies are most likely to cause problems?"

**Business Risks**:
- "What if users don't want this feature?"
- "What if the market changes while we're building?"
- "What competitive risks are we facing?"

**Operational Risks**:
- "Can we maintain this long-term with our team?"
- "What happens when key people leave?"
- "Do we have the operational capacity for this?"

**Security Risks**:
- "What's the worst-case security breach?"
- "What data could be exposed or corrupted?"
- "What would attackers target?"

**Timeline Risks**:
- "What could cause us to miss the deadline?"
- "What dependencies have we underestimated?"
- "What scope could creep?"

---

## Impact/Probability Assessment

**Impact Assessment**:
- "If this risk materializes, what's the damage?"
- "Is it recoverable or catastrophic?"
- "Who is affected? How many people?"

**Probability Assessment**:
- "How likely is this to happen? (1-10 scale)"
- "What would increase/decrease the probability?"
- "Have we seen this happen before in similar projects?"

**Prioritization Matrix**:
| Impact | High Probability | Low Probability |
|--------|------------------|-----------------|
| **High** | Critical - Must mitigate | Important - Have a plan |
| **Low** | Monitor - Watch closely | Accept - Document only |

**Risk Questions by Priority**:
- "What are our top 3 critical risks?"
- "What are we choosing to accept? Why?"
- "What's our risk appetite for this project?"

---

## Blast Radius Analysis Questions

**Failure Containment**:
- "If this component fails, what else breaks?"
- "Can failures be isolated?"
- "What's the blast radius of a worst-case failure?"

**Cascade Scenarios**:
- "Walk me through a cascade failure scenario."
- "What's the domino effect if [critical component] fails?"
- "How do we prevent cascades?"

**Recovery Time**:
- "How long to recover from a failure?"
- "What's the recovery process?"
- "Who needs to be involved in recovery?"

---

## Reversibility Assessment Questions

**One-Way Doors**:
- "What decisions are irreversible?"
- "What data migrations can't be undone?"
- "What contracts are we locked into?"

**Two-Way Doors**:
- "What decisions can we easily reverse?"
- "What's the cost of reversing each decision?"
- "How long does reversal take?"

**Decision Timing**:
- "When must we commit to irreversible decisions?"
- "Can we defer any one-way decisions?"
- "What information would change our decision?"

---

## Monitoring Triggers Questions

**Early Warning Signs**:
- "What signals indicate a risk is materializing?"
- "What metrics should we watch?"
- "How early can we detect problems?"

**Thresholds & Alerts**:
- "At what threshold do we take action?"
- "Who gets alerted when thresholds are crossed?"
- "What's the response time expectation?"

**Escalation Path**:
- "When do we escalate to leadership?"
- "What decisions can the team make autonomously?"
- "What requires executive approval?"

---

## Contingency Planning Questions

**Plan B Development**:
- "For each critical risk, what's Plan B?"
- "How quickly can we switch to Plan B?"
- "What's the cost of switching?"

**Decision Authority**:
- "Who makes the call to activate Plan B?"
- "What information triggers the decision?"
- "What's pre-approved vs needs approval?"

**Resource Allocation**:
- "Do we have resources reserved for contingencies?"
- "What can we deprioritize to address emergencies?"
- "What's the contingency budget (time, money, people)?"

---

## Known Tradeoffs Questions

**Conscious Compromises**:
- "What are we deliberately choosing NOT to do?"
- "Why is this tradeoff acceptable?"
- "What would change our minds?"

**Tradeoff Documentation**:
- "Who is aware of and has accepted this tradeoff?"
- "Is this documented somewhere?"
- "What's the plan to revisit this decision?"

**Tradeoff Implications**:
- "What are the downstream effects of this tradeoff?"
- "Who is negatively affected? Do they know?"
- "What's the long-term cost?"

---

## Risk Register Template

```markdown
## Risk: [Name]

**Category**: Technical / Business / Operational / Security / Timeline

**Description**: [What could go wrong]

**Probability**: High / Medium / Low
**Impact**: High / Medium / Low
**Priority**: Critical / Important / Monitor / Accept

**Trigger Signs**: [Early warning signals]

**Mitigation Plan**: [How we prevent or reduce this risk]

**Contingency Plan**: [What we do if it happens]

**Owner**: [Who is responsible]

**Last Reviewed**: [Date]
```

---

## Tradeoff Documentation Template

```markdown
## Tradeoff: [Name]

**Decision**: [What we decided]

**Alternatives Considered**:
1. [Alternative A] - Rejected because [reason]
2. [Alternative B] - Rejected because [reason]

**Why This Choice**: [Rationale for the decision]

**Accepted Downsides**:
- [Downside 1]
- [Downside 2]

**Conditions for Revisiting**: [When we would reconsider]

**Stakeholders Consulted**: [Who agreed to this]

**Date**: [When decided]
```

---

## Red Flags to Watch For

- **No identified risks**: Every project has risks
- **All low probability**: Optimism bias
- **No mitigation plans**: "We'll deal with it if it happens"
- **Single point of failure**: One person, one system, one vendor
- **Undocumented tradeoffs**: Decisions made but not recorded
- **No contingency plans**: "What's Plan B?" "We don't need one"

When you encounter these, probe deeper and insist on realistic risk assessment.
