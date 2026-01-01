# Example Specification

This is an annotated example of a high-quality specification produced by the plan-interview process.

---

# Task Assignment System Specification

> **Annotation**: Title is clear and specific. Not "Task System" but "Task Assignment System" - scope is clear.

## Overview

- **Problem**: Team leads spend 30+ minutes daily manually assigning tasks based on team member availability and skills. This is error-prone and creates bottlenecks when leads are unavailable.

- **Solution**: An automated task assignment engine that matches tasks to team members based on skills, current workload, and availability, with human override capability.

- **Success Criteria**:
  - Reduce average assignment time from 30 minutes to under 2 minutes
  - 80% of auto-assignments accepted without modification
  - Team leads report task assignment as "easy" (7+ on 10-point scale)

- **Key Stakeholders**:
  - Primary: Team leads (assign tasks)
  - Secondary: Team members (receive assignments)
  - Impacted: Project managers (visibility into assignments)

> **Annotation**: Success criteria are MEASURABLE. Not "faster" but "under 2 minutes". Not "users like it" but "7+ on 10-point scale".

---

## Detailed Requirements

### Functional Requirements

1. **FR-1**: System MUST display unassigned tasks in priority order
2. **FR-2**: System MUST suggest top 3 team members for each task based on skill match
3. **FR-3**: System MUST show each member's current workload (tasks, hours)
4. **FR-4**: System MUST allow one-click assignment from suggestions
5. **FR-5**: System MUST allow manual override to assign any team member
6. **FR-6**: System MUST notify assigned member within 30 seconds via Slack
7. **FR-7**: System MUST log all assignments with timestamp, assigner, reasoning
8. **FR-8**: System MUST allow reassignment with reason capture
9. **FR-9**: System MUST display assignment history for each task
10. **FR-10**: System MUST support bulk assignment of multiple tasks

> **Annotation**: Each requirement is numbered for traceability. "MUST" vs "SHOULD" vs "MAY" is deliberate. Requirements are testable.

### Non-Functional Requirements

1. **NFR-1**: Page load time MUST be under 2 seconds (p95)
2. **NFR-2**: Assignment suggestions MUST appear within 500ms
3. **NFR-3**: System MUST handle 100 concurrent users
4. **NFR-4**: System MUST be available 99.5% during business hours
5. **NFR-5**: All data MUST be encrypted at rest and in transit
6. **NFR-6**: System MUST meet WCAG 2.1 AA accessibility standards

---

## Technical Design

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Node.js   │────▶│  PostgreSQL │
│   Frontend  │     │   API       │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Slack     │
                    │   Webhook   │
                    └─────────────┘
```

**Components**:
- **Frontend**: React SPA with TypeScript, hosted on Cloudflare Pages
- **API**: Node.js/Express, hosted on Cloudflare Workers
- **Database**: PostgreSQL on Neon Serverless
- **Notifications**: Slack Incoming Webhooks

> **Annotation**: Architecture is visual AND textual. Technology choices are specific with hosting locations.

### Data Models

```sql
-- Core entities
tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority INT (1-5),
  required_skills TEXT[], -- array of skill tags
  estimated_hours DECIMAL,
  status ENUM('unassigned', 'assigned', 'in_progress', 'complete'),
  created_at TIMESTAMP,
  due_date TIMESTAMP
)

team_members (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  skills TEXT[],
  max_weekly_hours INT DEFAULT 40,
  slack_id VARCHAR(50)
)

assignments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks,
  member_id UUID REFERENCES team_members,
  assigned_by UUID REFERENCES team_members,
  assigned_at TIMESTAMP,
  assignment_reason TEXT, -- "auto" or free text
  unassigned_at TIMESTAMP, -- null if current
  unassign_reason TEXT
)
```

> **Annotation**: Actual schema, not just "we'll have a tasks table". Shows relationships and key fields.

### APIs & Integrations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/tasks/unassigned | GET | List unassigned tasks |
| /api/tasks/:id/suggestions | GET | Get member suggestions |
| /api/tasks/:id/assign | POST | Assign task |
| /api/tasks/:id/reassign | POST | Reassign task |
| /api/members/:id/workload | GET | Get member workload |

**External Integration**: Slack Incoming Webhook
- Trigger: On assignment (FR-6)
- Payload: task title, due date, link to task
- Retry: 3 attempts with exponential backoff

### Scalability Considerations

- **Current estimate**: 50 concurrent users, 500 tasks/day
- **Bottleneck**: Suggestion algorithm (O(n*m) for n tasks, m members)
- **Mitigation**: Cache member skills/workload, invalidate on change
- **Future scaling**: If >1000 tasks/day, add Redis caching layer

### Security Design

- **Authentication**: SSO via company Okta
- **Authorization**: Role-based (admin, team_lead, member)
- **Data protection**: All PII encrypted, audit log immutable
- **API security**: JWT tokens, 1-hour expiry, refresh tokens

---

## User Experience

### User Personas

**Sarah - Team Lead** (Primary)
- 8 years experience, manages 12 people
- Assigns 20-30 tasks per day
- Values speed and accuracy
- Uses desktop 95% of time
- Quote: "I just want the right person on the right task without thinking about it."

**Alex - Team Member** (Secondary)
- 2 years experience, receives 3-5 tasks per day
- Wants clear expectations and context
- Primarily mobile for notifications
- Quote: "I hate getting tasks with no context."

### User Flows

**Primary Flow: Assign a Single Task**
1. Sarah sees unassigned tasks dashboard (default view)
2. Clicks on high-priority task
3. Sees task details + 3 suggested assignees with skill match %
4. Clicks "Assign" on top suggestion
5. Sees confirmation toast
6. Task moves to "assigned" list

**Time target**: Under 30 seconds for experienced user

### UI States

| State | Appearance | User Action |
|-------|------------|-------------|
| Loading | Skeleton cards | Wait |
| Empty (no tasks) | Illustration + "All caught up!" | None needed |
| Error (API fail) | Red banner + retry button | Click retry |
| Success (assigned) | Green toast, task animates out | Continue or undo |

### Edge Cases

- **No matching skills**: Show all members, sort by workload, display warning
- **All members overloaded**: Show warning banner, allow override with confirmation
- **Member on PTO**: Exclude from suggestions, show PTO badge if selected
- **Task has no skills tagged**: Prompt to add skills before suggesting

---

## Risks & Mitigations

### Risk Register

| Risk | Category | Impact | Prob | Mitigation | Owner |
|------|----------|--------|------|------------|-------|
| Suggestion algorithm biases toward certain members | Business | High | Med | Weekly fairness report, manual override | PM |
| Slack webhook fails | Technical | Low | Med | Queue retry, email fallback | Eng |
| SSO outage blocks access | Technical | High | Low | Emergency bypass procedure documented | Ops |
| Users reject auto-suggestions | Business | Med | Med | Track rejection rate, tune algorithm | PM |
| Performance degrades at scale | Technical | Med | Low | Load testing, caching strategy ready | Eng |

### Accepted Tradeoffs

1. **Skills are self-reported**: We accept potential inaccuracy because surveying all skills would delay launch by 3 weeks. Mitigation: Skill verification in Phase 2.

2. **No mobile-optimized view**: Team leads primarily use desktop. Mobile will wait for Phase 2 based on usage data.

3. **English only**: 95% of users are English speakers. Localization deferred to Phase 3.

### Contingency Plans

- **If adoption <50% after 2 weeks**: Hold feedback sessions, prioritize top 3 complaints
- **If performance unacceptable**: Disable auto-suggestions, fall back to manual assignment

---

## Implementation Notes

### Key Decisions

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| PostgreSQL over DynamoDB | Relational queries simpler, team has experience | DynamoDB (learning curve), MongoDB (less mature) |
| Skill-match algorithm v1: simple tag overlap | Fast to implement, good enough for MVP | ML-based (too complex for MVP) |
| Slack notifications only | 90% of team uses Slack | Email (slower), in-app only (easy to miss) |

### Dependencies

- **External**: Okta SSO (exists), Slack workspace (exists), Neon account (needs setup)
- **Internal**: HR system skill export (needs coordination with HR)
- **Blocking**: Cannot launch until SSO integration complete

### Migration Plan

1. Week 1: Shadow mode - system runs alongside manual process
2. Week 2: Opt-in - team leads can try new system
3. Week 3: Default - new system is default, old available
4. Week 4: Cutover - old system deprecated

---

## Operationalization

### Testing Strategy

- **Unit tests**: 80% coverage for business logic
- **Integration tests**: API endpoints, database operations
- **E2E tests**: Critical paths (assign, reassign, notify)
- **Manual testing**: Accessibility, edge cases

### Deployment Plan

- **Environment**: Staging → Production
- **Feature flag**: `ENABLE_TASK_ASSIGNMENT_V2`
- **Rollout**: 10% → 50% → 100% over 1 week
- **Rollback**: Disable feature flag, no data migration needed

### Monitoring & Observability

- **Metrics**: Assignment time (p50, p95), suggestion acceptance rate, API latency
- **Dashboards**: Datadog - assignment volume, error rates, performance
- **Alerts**: API error rate >1%, latency p95 >2s, Slack webhook failures

---

## Open Questions

1. **Skill taxonomy**: Who owns the master skill list? How do we add new skills?
2. **Cross-team assignments**: Can leads assign tasks to other teams? If so, what approval is needed?
3. **Workload calculation**: Does 40 hours include meetings or just task work?

> **Annotation**: Open questions are genuine unknowns, not forgotten requirements. Each needs a decision before implementation can complete.

---

## Out of Scope

- Time tracking for assigned tasks
- Task creation (use existing system)
- Performance reviews based on assignments
- AI-generated task descriptions
- Mobile app (web responsive only)

> **Annotation**: Clear boundaries prevent scope creep. "Out of scope" is as important as "in scope".

---

## Phasing

### Phase 1: MVP (8 weeks)
- FR-1 through FR-7
- Single team pilot
- Success: 60% suggestion acceptance

### Phase 2: Enhancement (4 weeks)
- FR-8 through FR-10
- Mobile optimization
- Skill verification system
- Expand to all teams

### Phase 3: Future
- Cross-team assignment
- ML-improved suggestions
- Localization
- Advanced analytics
