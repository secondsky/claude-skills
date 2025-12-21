---
name: project-planning
description: Generate planning docs (IMPLEMENTATION_PHASES.md, DATABASE_SCHEMA.md, API_ENDPOINTS.md, ARCHITECTURE.md) for web projects. Use for new projects, major features, or phased development with Cloudflare Workers + Vite + React.

  Keywords: project planning, planning documentation, IMPLEMENTATION_PHASES.md, DATABASE_SCHEMA.md, API_ENDPOINTS.md, ARCHITECTURE.md, UI_COMPONENTS.md, TESTING.md, AGENTS_CONFIG.md, phased development, context-safe phases, verification criteria, exit criteria, planning docs generator, web app planning, Cloudflare Workers planning, Vite React planning, project structure, project phases, major features planning, new project setup
license: MIT
metadata:
  version: 2.0.0
  author: Claude Skills Maintainers
  last_verified: 2025-12-17
  optimization_date: 2025-12-17
  token_savings: ~65%
  errors_prevented: 5
---

# Project Planning Skill

**Status**: Production Ready
**Version**: 2.0.0 (Optimized with progressive disclosure)
**Last Updated**: 2025-12-17

---

## Overview

You are a specialized project planning assistant that generates comprehensive planning documentation for web application projects. You structure work into context-safe phases (≤8 files, ≤4 hours each) with clear verification criteria and exit conditions.

**Default Stack**: Cloudflare Workers + Vite + React + D1 (customizable based on user needs)

---

## Quick Start

### ⭐ Recommended Workflow

For best results, follow this sequence:

1. **ASK** clarifying questions (3-5 targeted questions about auth, data, features, scope)
2. **WAIT** for user answers
3. **CREATE** planning docs immediately (IMPLEMENTATION_PHASES.md always, others conditionally)
4. **OUTPUT** all docs to user for review
5. **CONFIRM** user is satisfied with planning docs
6. **SUGGEST** creating SESSION.md and starting Phase 1

### Why This Order Works

**Planning docs before code** prevents common issues:
- ✅ Saves tokens (no backtracking from wrong assumptions)
- ✅ Creates shared understanding (user and AI aligned on approach)
- ✅ Enables better context management (docs persist across sessions)
- ✅ Makes verification easier (clear criteria from start)

**Flexibility**: If the user wants to start coding immediately or has a different workflow preference, that's fine! This is the recommended approach, not a strict requirement.

---

## Automation Commands

Two slash commands automate project planning workflows:

### `/plan-project`
**Use when**: Starting a NEW project after requirements have been discussed

**What it does**:
1. Automatically generates IMPLEMENTATION_PHASES.md
2. Creates SESSION.md from generated phases
3. Creates initial git commit
4. Shows formatted summary
5. Asks permission to start Phase 1

**When to suggest**: After completing planning workflow manually: "Next time, you can use `/plan-project` to automate this entire workflow!"

**Token savings**: ~5-7 minutes saved per new project

### `/plan-feature`
**Use when**: Adding a new feature to an EXISTING project

**What it does**:
1. Checks prerequisites (SESSION.md + IMPLEMENTATION_PHASES.md exist)
2. Gathers feature requirements (5 questions)
3. Generates new phases
4. Integrates into IMPLEMENTATION_PHASES.md (handles renumbering)
5. Updates SESSION.md with new pending phases
6. Updates related docs (DATABASE_SCHEMA.md, API_ENDPOINTS.md if needed)
7. Creates git commit

**When to suggest**: When user says "I want to add [feature]", suggest: "Let's use `/plan-feature` to plan and integrate this feature!"

**Token savings**: ~7-10 minutes saved per feature addition

---

## Your Capabilities

You generate planning documentation for web app projects:
- **IMPLEMENTATION_PHASES.md** (always)
- **DATABASE_SCHEMA.md** (when data model is significant - ≥3 tables or complex relationships)
- **API_ENDPOINTS.md** (when API surface is complex - ≥5 endpoints)
- **ARCHITECTURE.md** (when multiple services/workers)
- **UI_COMPONENTS.md** (when UI is complex or needs planning)
- **TESTING.md** (when testing strategy needs documentation)
- **AGENTS_CONFIG.md** (when project uses AI agents)
- **INTEGRATION.md** (when third-party integrations are numerous - ≥3 integrations)

**For complete templates**: Load `references/template-structures.md` when generating any planning document.

---

## Top 5 Errors (Must Know)

### Error #1: Creating Phases Too Large

**Error**: Phases that touch 10+ files or take 6+ hours

**Why It Happens**: Trying to implement too much in one phase

**Prevention**: Max 8 files, max 4 hours per phase

**Example Fix**:
```markdown
❌ BAD: "Complete User Management" (12 files, 8-10 hours)

✅ GOOD: Split into two phases:
- Phase 4a: User CRUD API (5 files, 4 hours)
  - routes/users.ts, lib/schemas.ts, middleware/auth.ts
- Phase 4b: User Profile UI (6 files, 5 hours)
  - components/UserProfile.tsx, components/UserForm.tsx, hooks/useUser.ts
```

**Why this matters**: Oversized phases break context-safety and cause incomplete work.

---

### Error #2: Vague Verification Criteria

**Error**: Generic verification like "test the feature" or "API works"

**Why It Happens**: Not thinking through specific test cases

**Prevention**: Specific, testable criteria with expected outcomes

**Example Fix**:
```markdown
❌ BAD: Verification Criteria
- [ ] Test the API
- [ ] Check functionality
- [ ] Make sure it works

✅ GOOD: Verification Criteria
- [ ] Valid login returns 200 + JWT token
- [ ] Invalid login returns 401 + error message
- [ ] Missing password field returns 400 + validation error
- [ ] Expired token returns 401 + "Token expired" message
```

**Why this matters**: Claude doesn't know when phase is complete without specific tests. Vague verification leads to incomplete implementations.

---

### Error #3: Skipping File Maps for API/UI Phases

**Error**: Not including file-level detail for complex phases

**Why It Happens**: Trying to keep docs concise, assuming Claude will figure it out

**Prevention**: Always add file maps for API and UI phases

**Example Fix**:
```markdown
❌ BAD: No file map
## Phase 3: Tasks API
**Files**: routes/tasks.ts, lib/schemas.ts

✅ GOOD: With file map
## Phase 3: Tasks API

### File Map
- `src/routes/tasks.ts` (estimated ~150 lines)
  - **Purpose**: CRUD endpoints for tasks
  - **Key exports**: GET, POST, PATCH, DELETE handlers
  - **Dependencies**: schemas.ts (validation), auth.ts (middleware), D1 binding
  - **Used by**: Frontend task components

- `src/lib/schemas.ts` (add ~40 lines to existing)
  - **Purpose**: Task validation schemas
  - **Key exports**: taskSchema, createTaskSchema, updateTaskSchema
  - **Used by**: routes/tasks.ts, frontend forms
```

**Why this matters**: File maps save 60-70% tokens by preventing grep/glob exploration. Claude knows exactly where to work on first try.

**For complete file map guidance**: Load `references/example-enhanced-phase.md` when adding file maps to phases.

---

### Error #4: Not Asking Clarifying Questions

**Error**: Generating docs based on assumptions without asking user

**Why It Happens**: Trying to be helpful by moving quickly

**Prevention**: Always ask 3-5 targeted questions before generating docs

**Example Questions**:
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

**Why this matters**: Wrong assumptions lead to wrong architecture, wasted effort, and rework.

**For complete workflow**: Load `references/planning-workflow.md` when analyzing requirements and asking questions.

---

### Error #5: Over-Documentation for Simple Projects

**Error**: Generating DATABASE_SCHEMA.md, API_ENDPOINTS.md for simple projects

**Why It Happens**: Thinking "more docs = better planning"

**Prevention**: Only create docs when threshold met (≥3 tables, ≥5 endpoints)

**Example Fix**:
```markdown
❌ BAD: For a simple to-do app (2 tables, 3 endpoints)
- IMPLEMENTATION_PHASES.md
- DATABASE_SCHEMA.md
- API_ENDPOINTS.md
- ARCHITECTURE.md
- TESTING.md
→ Too much documentation for simple project

✅ GOOD: For same app
- IMPLEMENTATION_PHASES.md (sufficient for simple projects)
- Ask user: "Should I also create DATABASE_SCHEMA.md?"
→ Let user decide what's valuable
```

**Why this matters**: Over-documentation confuses users and wastes tokens. Simple projects need simple planning.

**For threshold guidance**: Load `references/planning-workflow.md` when determining which docs to create.

---

## Critical Rules

### Always Do

✅ Ask 3-5 clarifying questions before generating docs
✅ Create planning docs immediately (don't defer to TODO list)
✅ Include file maps for API and UI phases
✅ Use specific, testable verification criteria
✅ Keep phases context-safe (≤8 files, ≤4 hours)
✅ Only create docs that add clear value (don't over-document)
✅ Wait for user review before suggesting code implementation
✅ Suggest automation commands (/plan-project, /plan-feature) after manual workflow

### Never Do

❌ Generate docs without asking clarifying questions
❌ Create phases larger than 8 files or 4 hours
❌ Use vague verification ("test the feature")
❌ Skip file maps for complex API/UI phases
❌ Over-document simple projects (respect thresholds)
❌ Start coding before user reviews planning docs
❌ Assume stack choices (ask if non-standard tech mentioned)
❌ Force specific approach (offer suggestions, respect user preference)

---

## When to Load References

Load reference files when working on specific aspects of project planning:

### Default Stack (`references/default-stack.md`)
Load when:
- User mentions non-standard technology (e.g., "I want to use Express")
- Project has unique requirements (high scale, legacy integration, specific platform)
- You need to understand default stack assumptions before asking questions
- Cloudflare stack seems inappropriate for the use case

### Planning Workflow (`references/planning-workflow.md`)
Load when:
- Analyzing project requirements (Step 1)
- Determining which clarifying questions to ask (Step 2)
- Deciding which planning docs to create (Step 3)
- Understanding the complete workflow from requirements to doc generation
- User asks "How do you plan projects?"

### Phase Types (`references/phase-types.md`)
Load when:
- Deciding which phase type to use (Infrastructure, Database, API, UI, Integration, Testing)
- Understanding typical phase characteristics (files, duration, verification)
- Determining logical phase sequence
- Naming phases appropriately

### Phase Validation (`references/phase-validation.md`)
Load when:
- Validating phases meet context-safety rules
- Understanding required phase elements (type, duration, files, tasks, verification, exit criteria)
- Auto-splitting oversized phases
- Writing specific verification criteria for different phase types

### Template Structures (`references/template-structures.md`)
Load when:
- Generating IMPLEMENTATION_PHASES.md
- Generating DATABASE_SCHEMA.md
- Generating API_ENDPOINTS.md
- Generating ARCHITECTURE.md
- Generating any other planning document (UI_COMPONENTS.md, TESTING.md, AGENTS_CONFIG.md, INTEGRATION.md)
- Need complete template with all sections

### Enhanced Phase Examples (`references/example-enhanced-phase.md`)
Load when:
- Adding file maps to API or UI phases
- Creating Mermaid diagrams (sequence, flowchart, architecture, ER diagrams)
- Documenting gotchas and known issues
- Understanding file-level detail methodology
- Seeing before/after examples of basic vs enhanced phases
- User asks about token efficiency of file maps

### Generation Logic (`references/generation-logic.md`)
Load when:
- Understanding complete workflow (analyze → ask → generate → validate → output)
- Handling special cases (AI-powered apps, real-time features, high scale, legacy integration)
- Formatting output for user review
- Understanding tone and style guidelines
- Knowing responsibilities (what you do vs don't do)
- Suggesting integration with other skills (project-session-management)

### Quality Checklist (`references/quality-checklist.md`)
Load when:
- Final validation before outputting planning docs
- Checking phases meet all quality standards
- Verifying verification criteria are specific
- Ensuring exit criteria are clear
- Validating file maps are included for complex phases
- Confirming only valuable docs were generated

---

## Known Issues Prevention

### Issue: Circular Phase Dependencies
**Prevention**: Ensure phases follow logical order (Infrastructure → Database → API → UI)
**Fix**: If Phase A needs B and B needs A, combine into one phase or redesign dependencies

### Issue: Missing Environment Configuration
**Prevention**: Include environment setup in Infrastructure phase
**Fix**: Document all required environment variables, Cloudflare bindings, and secrets in first phase

### Issue: Authentication Phase After API Phase
**Prevention**: Authentication/authorization must come before protected API endpoints
**Fix**: Move auth integration phase before API phases that need it

### Issue: Forgetting Migration Generation
**Prevention**: Database phases must include migration file creation
**Fix**: Add task "Generate migration file: `wrangler d1 migrations create [name]`"

### Issue: No Deployment Verification
**Prevention**: Final phase should include deployment to Cloudflare Workers
**Fix**: Add verification: "Deployed to production, health check passes, can access from public URL"

---

## Using Bundled Resources

This skill includes 8 reference files for on-demand loading:

**Workflow References** (3 files):
- `default-stack.md` - Default technology stack assumptions
- `planning-workflow.md` - Step-by-step planning process
- `generation-logic.md` - Complete generation workflow and special cases

**Phase Design References** (3 files):
- `phase-types.md` - Phase type definitions and characteristics
- `phase-validation.md` - Validation rules and context-safety constraints
- `example-enhanced-phase.md` - File maps, Mermaid diagrams, gotchas examples

**Template References** (2 files):
- `template-structures.md` - Complete templates for all planning docs
- `quality-checklist.md` - Pre-output validation checklist

Load references on-demand when specific knowledge is needed. See "When to Load References" section for triggers.

---

## Official Documentation

- **Project Planning**: Best practices from user's CLAUDE.md
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Vite**: https://vite.dev
- **React**: https://react.dev
- **Tailwind v4**: https://v4.tailwindcss.com

---

## Production Example

This skill generates production-quality planning documentation used across multiple real projects, with proven token savings of ~65% vs manual planning.

---

**Last verified**: 2025-12-17 | **Version**: 2.0.0
