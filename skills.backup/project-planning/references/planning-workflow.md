# Planning Workflow

This document describes the step-by-step workflow for analyzing project requirements and generating planning documentation.

---

## Step 1: Analyze Project Requirements

When invoked, the user will have described a project. Extract:

1. **Core functionality** - What does the app do?
2. **User interactions** - Who uses it and how?
3. **Data model** - What entities and relationships?
4. **Integrations** - Third-party services needed?
5. **Complexity signals** - Scale, real-time, AI, etc?

---

## Step 2: Ask Clarifying Questions

Ask 3-5 targeted questions to fill gaps. Focus on:

- **Auth**: Public tool, user accounts, social auth, roles/permissions?
- **Data**: Entities, relationships, volume expectations
- **Features**: Real-time, file uploads, email, payments, AI?
- **Integrations**: Specific third-party services?
- **Scope**: MVP or full-featured? Timeline constraints?

### Example Question Set

```
I'll help structure this project. A few questions to optimize the planning:

1. **Authentication**: Do users need accounts, or is this a public tool?
   - If accounts: Social auth (Google/GitHub)? Roles/permissions?

2. **Data Model**: You mentioned [entities]. Any relationships I should know about?
   - One-to-many? Many-to-many? Hierarchical?

3. **Key Features**: Which of these apply?
   - Real-time updates (websockets/Durable Objects)
   - File uploads (images, documents, etc)
   - Email notifications
   - Payment processing
   - AI-powered features

4. **Scope**: Is this an MVP or full-featured app?
   - MVP: Core features only, can iterate
   - Full: Complete feature set from start

5. **Timeline**: Any constraints? (helps with phase sizing)
```

---

## Step 3: Determine Document Set

Based on answers, decide which docs to generate:

### Always Generate
- IMPLEMENTATION_PHASES.md

### Generate If
- **DATABASE_SCHEMA.md** → Project has ≥3 tables OR complex relationships
- **API_ENDPOINTS.md** → Project has ≥5 endpoints OR needs API documentation
- **ARCHITECTURE.md** → Multiple services/workers OR complex data flow
- **UI_COMPONENTS.md** → Complex UI OR needs component planning
- **TESTING.md** → Testing strategy is non-trivial OR user requested
- **AGENTS_CONFIG.md** → Uses AI agents OR LLM features
- **INTEGRATION.md** → ≥3 third-party integrations OR complex webhooks

### Ask User
"I'll generate IMPLEMENTATION_PHASES.md. Should I also create [DATABASE_SCHEMA.md / API_ENDPOINTS.md / etc]?"

Don't over-document small projects - only create docs when they add clear value.

---

## Decision Tree

```
User describes project
↓
Analyze requirements (Step 1)
↓
Ask 3-5 clarifying questions (Step 2)
↓
User answers
↓
Determine which docs to create (Step 3)
├─ Always: IMPLEMENTATION_PHASES.md
├─ If ≥3 tables: DATABASE_SCHEMA.md
├─ If ≥5 endpoints: API_ENDPOINTS.md
├─ If multi-service: ARCHITECTURE.md
├─ If complex UI: UI_COMPONENTS.md
├─ If AI features: AGENTS_CONFIG.md
├─ If ≥3 integrations: INTEGRATION.md
└─ If requested: TESTING.md
↓
Ask user to confirm doc set
↓
Generate all confirmed docs
↓
Output for user review
```

---

## Key Principles

1. **Ask before assuming** - 3-5 questions prevent wasted effort
2. **Don't over-document** - Simple projects need simple planning
3. **Confirm doc set** - Let user decide what's valuable
4. **Create docs immediately** - Don't defer to "TODO" list
5. **Wait for user review** - Ensure alignment before coding
