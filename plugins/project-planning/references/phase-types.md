# Phase Types Guide

This document describes the standard phase types used in IMPLEMENTATION_PHASES.md and when to use each type.

---

## Phase Type: Infrastructure

**When**: Project start, deployment setup

**Scope**: Scaffolding, build config, initial deployment

**Files**: 3-5 files
- package.json
- wrangler.jsonc
- vite.config.ts
- tsconfig.json
- Initial folder structure

**Duration**: 1-3 hours

**Verification**: Dev server runs, can deploy to Cloudflare, basic "Hello World" works

**Example**: "Set up Cloudflare Worker with Vite frontend"

---

## Phase Type: Database

**When**: Data model setup, schema changes

**Scope**: Migrations, schema definition, seed data

**Files**: 2-4 files
- Migration SQL files (e.g., `migrations/0001_initial.sql`)
- Schema TypeScript definitions
- Seed data scripts

**Duration**: 2-4 hours

**Verification**: CRUD operations work, constraints enforced, relationships correct, migrations run cleanly

**Example**: "Create users and tasks tables with relationships"

---

## Phase Type: API

**When**: Backend endpoints needed

**Scope**: Routes, middleware, validation, error handling

**Files**: 3-6 files
- Route handler files (e.g., `routes/tasks.ts`)
- Middleware (auth, validation)
- Schema definitions (Zod)

**Duration**: 3-6 hours (per endpoint group)

**Verification**: All HTTP methods tested (200, 400, 401, 500), CORS configured, authentication works

**Example**: "Tasks CRUD API with pagination and ownership checks"

---

## Phase Type: UI

**When**: User interface components needed

**Scope**: Components, forms, state management, styling

**Files**: 4-8 files
- Component files (.tsx)
- Form components
- State management hooks/stores
- CSS/Tailwind styling

**Duration**: 4-8 hours (per feature)

**Verification**: User flows work end-to-end, forms validate, state updates correctly, responsive design works

**Example**: "Task management dashboard with create/edit/delete forms"

---

## Phase Type: Integration

**When**: Third-party services needed (auth, payments, AI, etc)

**Scope**: API setup, webhooks, configuration, error handling

**Files**: 2-4 files
- Integration service files (e.g., `lib/clerk.ts`)
- Webhook handlers
- Configuration files
- Middleware for integration

**Duration**: 3-5 hours (per integration)

**Verification**: Service connectivity works, webhooks fire correctly, errors handled gracefully, authentication flows work

**Example**: "Clerk authentication with custom JWT claims"

---

## Phase Type: Testing

**When**: Formal test suite needed (optional)

**Scope**: E2E tests, integration tests, test infrastructure

**Files**: Test files
- E2E test specs (e.g., `tests/tasks.spec.ts`)
- Test fixtures
- Test configuration

**Duration**: 3-6 hours

**Verification**: Tests pass, coverage meets threshold (e.g., 80%), CI/CD integration works

**Example**: "E2E tests for task management workflows"

---

## Choosing the Right Phase Type

Use this flowchart to determine phase type:

```
Is it project scaffolding or deployment setup?
├─ Yes → Infrastructure
└─ No → Is it data modeling or database changes?
    ├─ Yes → Database
    └─ No → Is it backend API endpoints?
        ├─ Yes → API
        └─ No → Is it user interface components?
            ├─ Yes → UI
            └─ No → Is it third-party service integration?
                ├─ Yes → Integration
                └─ No → Is it test suite creation?
                    ├─ Yes → Testing
                    └─ No → Classify as closest match
```

---

## Typical Phase Sequence

Most projects follow this order:

1. **Infrastructure** - Set up project scaffolding
2. **Database** - Define data model
3. **API** - Build backend endpoints
4. **Integration** - Add third-party services (auth, payments, etc.)
5. **UI** - Build user interface
6. **Testing** - Add test suite (optional)

This order ensures dependencies flow correctly (e.g., can't build UI before API exists).

---

## Phase Naming Conventions

Good phase names are:
- **Specific**: "Tasks CRUD API" not "API endpoints"
- **Actionable**: "Set up Clerk authentication" not "Authentication"
- **Scoped**: "User profile UI" not "Entire frontend"

Poor phase names:
- Too vague: "Backend work", "Frontend stuff"
- Too broad: "Complete user management" (should be split)
- Non-actionable: "Considerations for scaling"
