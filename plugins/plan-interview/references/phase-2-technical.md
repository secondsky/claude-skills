# Phase 2: Technical Deep-Dive - Deep Dive

Extended guidance for technical architecture and engineering decisions.

---

## Architecture Decision Questions

**High-Level Structure**:
- "Can you draw the system architecture in words? What are the main components?"
- "Why did you choose this architecture over alternatives like [X] or [Y]?"
- "What patterns are we using? (microservices, monolith, event-driven, etc.)"

**Component Breakdown**:
- "What are the responsibilities of each component?"
- "How do components communicate with each other?"
- "Which components are most critical? Which are most complex?"

**Technology Choices**:
- "Why these specific technologies? What were the alternatives?"
- "What's the team's experience level with these technologies?"
- "Are there any technologies we're avoiding? Why?"

---

## Data Model & State Questions

**Core Entities**:
- "What are the key data entities in this system?"
- "How do these entities relate to each other?"
- "What's the cardinality of these relationships? (1:1, 1:many, many:many)"

**State Management**:
- "Where does state live? (client, server, database, cache)"
- "How is state synchronized across components?"
- "What's the source of truth for each piece of data?"

**Data Lifecycle**:
- "How is data created, updated, and deleted?"
- "What's the data retention policy?"
- "How do we handle data migrations?"

---

## Scalability Questions

**Growth Scenarios**:
- "What happens if we get 10x the expected load? 100x?"
- "Where are the bottlenecks in the current design?"
- "What breaks first under load?"

**Scaling Strategy**:
- "How do we scale horizontally vs vertically?"
- "What's the scaling unit? (requests, users, data volume)"
- "What's the cost of scaling? Linear, logarithmic, exponential?"

**Performance Requirements**:
- "What's the target latency? (p50, p95, p99)"
- "What's the expected throughput? (requests/second)"
- "What's the maximum acceptable downtime?"

---

## Integration Questions

**External Systems**:
- "What external APIs or services do we integrate with?"
- "What are the contracts we must honor?"
- "What's the SLA for these integrations?"

**Failure Modes**:
- "What happens when an integration fails?"
- "How do we retry? Circuit break? Fallback?"
- "How do we notify users of integration failures?"

**Data Exchange**:
- "What data do we send/receive from external systems?"
- "What's the data format? (JSON, XML, protobuf, etc.)"
- "How do we handle schema changes in external systems?"

---

## Technical Debt Questions

**Conscious Compromises**:
- "What shortcuts are we taking? Why are they acceptable?"
- "What will we regret in 6 months? 2 years?"
- "What's the plan to address this debt?"

**Cost Assessment**:
- "What's the ongoing cost of this technical debt?"
- "What's the cost to fix it later vs now?"
- "What triggers the decision to pay down debt?"

**Risk of Debt**:
- "What happens if we never address this debt?"
- "Could this debt become a blocking issue?"
- "Who is aware of and accepts this debt?"

---

## Observability Questions

**Monitoring**:
- "What metrics will we track?"
- "What dashboards do we need?"
- "What's the baseline we're comparing against?"

**Alerting**:
- "What conditions trigger alerts?"
- "Who gets alerted? What's the escalation path?"
- "What's the expected response time?"

**Debugging**:
- "How do we debug production issues?"
- "What logs do we need? What format?"
- "How do we trace requests across services?"

---

## Security Questions

**Threat Model**:
- "What are we protecting against?"
- "Who are the potential attackers? What are their capabilities?"
- "What data is most sensitive?"

**Authentication & Authorization**:
- "How do users authenticate?"
- "How do we manage sessions/tokens?"
- "What authorization model? (RBAC, ABAC, etc.)"

**Data Protection**:
- "What data is encrypted? At rest? In transit?"
- "How are secrets managed?"
- "What's the data classification scheme?"

---

## Architecture Discussion Patterns

### The "Why Not" Pattern
When someone proposes architecture A, ask:
- "Why not [simpler alternative]?"
- "What would break if we used [alternative]?"
- "What's the cost of switching later if A doesn't work?"

### The "At Scale" Pattern
For any component, ask:
- "What happens to this at 10x scale?"
- "What's the first thing that breaks?"
- "How would we know it's breaking?"

### The "Failure Mode" Pattern
For any integration or dependency, ask:
- "What happens when this fails?"
- "How do we detect the failure?"
- "How do we recover?"

### The "New Hire" Pattern
Imagine explaining this to a new hire:
- "How would you explain this architecture to someone new?"
- "What's the learning curve?"
- "What documentation do they need?"

---

## Red Flags to Watch For

- **Premature optimization**: Solving scaling problems you don't have yet
- **Résumé-driven development**: Choosing technology for career advancement, not fit
- **Missing error handling**: Happy path only, no failure consideration
- **God components**: One component does too much
- **Distributed monolith**: Microservices without the benefits
- **No observability plan**: "We'll add monitoring later"

When you encounter these, probe deeper and surface the concern explicitly.
