# Phase Validation Rules

This document describes the constraints and validation rules that every phase must follow to ensure context-safety and successful completion.

---

## Context-Safe Sizing

Every phase must meet these constraints:

### Max Files: 5-8 files touched per phase
**Why**: More files = more context switching = higher chance of errors
**Example**:
- ✅ Good: "Tasks API" touches 3 files (routes/tasks.ts, lib/schemas.ts, middleware/auth.ts)
- ❌ Bad: "Complete user management" touches 12 files across routes, UI, and auth

### Max Dependencies: ≤2 other phases
**Why**: Deep dependency chains make phases hard to understand and implement
**Example**:
- ✅ Good: "Tasks API" depends on Phase 1 (infrastructure) and Phase 2 (database)
- ❌ Bad: Phase 7 depends on Phases 1, 2, 3, 4, and 5 (too many dependencies)

### Max Duration: 2-4 hours per phase
**Why**: Implementation + verification + fixes should fit in one session
**Example**:
- ✅ Good: "User authentication API" estimated at 3 hours
- ❌ Bad: "Complete frontend UI" estimated at 12 hours (should be split)

---

## Required Elements

Every phase MUST have these 6 elements:

### 1. Type
One of: Infrastructure / Database / API / UI / Integration / Testing

**Why**: Helps Claude understand the nature of the work and verification requirements

### 2. Estimated Duration
In hours (and minutes of human time)

**Pattern**: `X hours (~Y minutes human time)`
**Example**: `4 hours (~4 minutes human time)`

**Why**: Sets expectations and helps with session planning

### 3. Files
Specific files that will be created/modified

**Pattern**: `file1.ts` (new), `file2.ts` (modify), `file3.ts` (existing, no changes)

**Why**: Claude knows exactly where to work, prevents wrong file placement

### 4. Task List
Ordered checklist with clear actions

**Pattern**:
```markdown
- [ ] Task 1 (specific action)
- [ ] Task 2 (specific action)
- [ ] Test basic functionality
```

**Why**: Provides step-by-step implementation guidance

### 5. Verification Criteria
Checkbox list of tests to confirm phase works

**Pattern**:
```markdown
- [ ] Specific test 1 (e.g., "Valid login returns 200 + token")
- [ ] Specific test 2 (e.g., "Invalid login returns 401")
- [ ] Specific test 3 (e.g., "Missing password returns 400 + error message")
```

**Why**: Clear definition of "working" prevents incomplete implementations

### 6. Exit Criteria
Clear definition of "done"

**Pattern**: One sentence summarizing what must be true for phase to be complete

**Example**: "All CRUD operations work correctly with proper status codes, validation, authentication, and ownership checks."

**Why**: Prevents ambiguity about phase completion

---

## Verification Requirements by Phase Type

### API Phases
Must test all HTTP status codes:
- [ ] 200: Success cases
- [ ] 201: Resource creation
- [ ] 400: Bad request (validation failed)
- [ ] 401: Unauthorized (no/invalid token)
- [ ] 403: Forbidden (insufficient permissions)
- [ ] 404: Not found
- [ ] 500: Internal server error

### UI Phases
Must test:
- [ ] User flows work end-to-end
- [ ] Form validation (client-side)
- [ ] Error states display correctly
- [ ] Loading states work
- [ ] Responsive design (mobile, tablet, desktop)

### Database Phases
Must test:
- [ ] CRUD operations work
- [ ] Constraints enforced (NOT NULL, UNIQUE, etc.)
- [ ] Relationships work (foreign keys, cascades)
- [ ] Indexes exist for common queries

### Integration Phases
Must test:
- [ ] Service connectivity works
- [ ] Webhooks fire correctly
- [ ] Error handling (service unavailable, timeouts)
- [ ] Configuration is correct

---

## Auto-Split Logic

If a phase violates sizing rules, **automatically suggest splitting**:

### Pattern

```
⚠️ Phase 4 "Complete User Management" is too large (12 files, 8-10 hours).

Suggested split:
- Phase 4a: User CRUD API (5 files, 4 hours)
  - routes/users.ts, lib/schemas.ts, middleware/auth.ts
  - Verification: API endpoints work with correct status codes

- Phase 4b: User Profile UI (6 files, 5 hours)
  - components/UserProfile.tsx, components/UserForm.tsx, etc.
  - Verification: Profile page renders, forms work, updates persist
```

### When to Split

**File count**: >8 files → Split by concern (API vs UI, or by feature area)

**Duration**: >4 hours → Split into logical sub-phases

**Complexity**: Multiple distinct concerns → Split by concern

### How to Split

1. **By layer**: API phase + UI phase
2. **By feature**: User CRUD + User Permissions
3. **By priority**: MVP features + Enhanced features

---

## Validation Checklist

Before outputting a phase, verify:

- [ ] Type is specified (Infrastructure/Database/API/UI/Integration/Testing)
- [ ] Duration is realistic (1-4 hours)
- [ ] Files are listed (≤8 files)
- [ ] Tasks are specific and actionable
- [ ] Verification criteria are testable (not vague)
- [ ] Exit criteria is a clear one-sentence summary
- [ ] Phase doesn't depend on >2 other phases
- [ ] Phase can reasonably fit in one 2-4 hour session

---

## Common Validation Errors

### ❌ Error #1: Vague Verification
**Bad**: "Test the API"
**Good**: "Valid login returns 200 + token, invalid login returns 401"

### ❌ Error #2: Too Many Files
**Bad**: Phase touches 12 files across frontend and backend
**Good**: Split into two phases (API + UI)

### ❌ Error #3: Vague Exit Criteria
**Bad**: "User management is complete"
**Good**: "All CRUD operations work with authentication and ownership checks"

### ❌ Error #4: Unrealistic Duration
**Bad**: "Complete entire app" - 20 hours
**Good**: Multiple focused phases of 2-4 hours each

### ❌ Error #5: Missing Required Elements
**Bad**: Phase has no verification criteria or exit criteria
**Good**: Phase includes all 6 required elements
