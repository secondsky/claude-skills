# Quality Checklist

This document provides validation checklists to ensure planning documentation meets quality standards before being presented to the user.

---

## Pre-Output Validation

Before outputting planning docs, verify ALL items in this checklist:

---

## Phase Quality Checklist

### ✅ Every Phase Has Required Elements

- [ ] **Type specified** (Infrastructure/Database/API/UI/Integration/Testing)
- [ ] **Time estimate** provided (X hours format)
- [ ] **File list** included (specific files, marked as new/modify/existing)
- [ ] **Task checklist** with actionable items
- [ ] **Verification criteria** with specific tests
- [ ] **Exit criteria** as clear one-sentence summary

**Why this matters**: Missing elements make phases ambiguous and incomplete.

---

## Context-Safety Checklist

### ✅ Phases Are Context-Safe

- [ ] **≤8 files** per phase (prevents context overload)
- [ ] **≤2 phase dependencies** (prevents complex dependency chains)
- [ ] **Fits in one session** (2-4 hours including verification)

**Why this matters**: Oversized phases cause context loss and incomplete work.

**If a phase fails**: Auto-suggest splitting into smaller phases.

---

## Verification Specificity Checklist

### ✅ Verification Is Specific and Testable

**Bad examples** (too vague):
- ❌ "Test the feature"
- ❌ "API works"
- ❌ "Check functionality"

**Good examples** (specific and testable):
- ✅ "Valid login returns 200 + JWT token"
- ✅ "Invalid login returns 401 + error message"
- ✅ "Missing password field returns 400 + validation error"

**Checklist**:
- [ ] Each verification criterion is **specific** (not "test X" but "X returns Y when Z")
- [ ] Criteria include **expected outcomes** (status codes, data format, behavior)
- [ ] Criteria are **independently testable** (can verify each one separately)

**Why this matters**: Vague verification leads to incomplete implementations. Claude needs clear pass/fail tests.

---

## Exit Criteria Clarity Checklist

### ✅ Exit Criteria Are Clear

**Bad examples** (too vague):
- ❌ "API is done"
- ❌ "User management complete"
- ❌ "Feature works"

**Good examples** (clear and specific):
- ✅ "All CRUD operations work correctly with proper status codes, validation, authentication, and ownership checks."
- ✅ "Database schema created, migrations run, seed data loaded, and CRUD operations tested."
- ✅ "User can log in, log out, and access protected routes with valid JWT."

**Checklist**:
- [ ] Exit criteria is **one clear sentence** (not multiple paragraphs)
- [ ] Exit criteria mentions **key capabilities** that must work
- [ ] Exit criteria is **measurable** (can objectively determine if met)

**Why this matters**: Clear exit criteria prevents "is this phase done?" ambiguity.

---

## Phase Order Logic Checklist

### ✅ Phases Are Ordered Logically

**Typical correct order**:
1. Infrastructure (scaffolding)
2. Database (schema)
3. API (backend)
4. Integration (third-party services)
5. UI (frontend)
6. Testing (test suite)

**Checklist**:
- [ ] **Dependencies flow correctly** (can't build UI before API exists)
- [ ] **No circular dependencies** (Phase A needs B, B needs A)
- [ ] **Foundation before features** (infrastructure before specific features)

**Why this matters**: Wrong order causes blockers and rework.

---

## Time Estimation Checklist

### ✅ Time Estimates Are Realistic

**Guidelines**:
- Infrastructure: 1-3 hours
- Database: 2-4 hours
- API (per endpoint group): 3-6 hours
- UI (per feature): 4-8 hours
- Integration (per service): 3-5 hours
- Testing: 3-6 hours

**Checklist**:
- [ ] Estimates include **implementation time**
- [ ] Estimates include **verification time**
- [ ] Estimates include **expected fixes time** (bugs, adjustments)
- [ ] Total estimate is **realistic** (not overly optimistic)

**Rule of thumb**: Multiply initial estimate by 1.5 to account for verification and fixes.

**Why this matters**: Unrealistic estimates cause frustration and incomplete phases.

---

## File-Level Detail Checklist

### ✅ File Maps Included for Complex Phases

**When to include file maps**:
- [ ] API phases (routes, middleware, schemas)
- [ ] UI phases (components, state, forms)
- [ ] Integration phases (service files, webhooks)

**What file maps should include**:
- [ ] **File path** (e.g., `src/routes/tasks.ts`)
- [ ] **Purpose** (what the file does)
- [ ] **Key exports** (functions, components, types)
- [ ] **Dependencies** (what it imports)
- [ ] **Used by** (what imports it)
- [ ] **Line estimate** for new files

**When to skip file maps**:
- Infrastructure phases (obvious from scaffolding)
- Database phases (schema files are self-documenting)
- Very small phases (<3 files)

**Why this matters**: File maps save 60-70% tokens by preventing grep/glob exploration.

---

## Documentation Set Appropriateness Checklist

### ✅ Only Generate Docs That Add Value

**Always generate**:
- [ ] IMPLEMENTATION_PHASES.md

**Generate DATABASE_SCHEMA.md if**:
- [ ] Project has ≥3 tables
- [ ] OR has complex relationships (many-to-many, hierarchical)

**Generate API_ENDPOINTS.md if**:
- [ ] Project has ≥5 endpoints
- [ ] OR needs formal API documentation

**Generate ARCHITECTURE.md if**:
- [ ] Multiple services/workers
- [ ] OR complex data flow between components

**Generate UI_COMPONENTS.md if**:
- [ ] Complex component hierarchy
- [ ] OR UI needs planning before implementation

**Generate TESTING.md if**:
- [ ] Formal testing strategy needed
- [ ] OR user specifically requested

**Generate AGENTS_CONFIG.md if**:
- [ ] Project uses AI agents or LLM features

**Generate INTEGRATION.md if**:
- [ ] ≥3 third-party integrations
- [ ] OR complex webhook handling

**Why this matters**: Over-documentation confuses users and wastes tokens. Only create docs that provide clear value.

---

## Final Validation Summary

Before presenting planning docs to user, confirm:

- [ ] All phases meet quality checklist
- [ ] All phases meet context-safety checklist
- [ ] All phases have specific verification criteria
- [ ] All phases have clear exit criteria
- [ ] Phases are logically ordered
- [ ] Time estimates are realistic
- [ ] File maps included for complex phases
- [ ] Only valuable docs were generated

**If any items fail**: Fix before outputting. Don't present incomplete or ambiguous planning docs.

---

## Common Quality Issues and Fixes

### Issue #1: Vague Verification
**Problem**: "Test the API"
**Fix**: "Valid request returns 200 + data, invalid request returns 400 + error, unauthorized request returns 401"

### Issue #2: Oversized Phase
**Problem**: Phase touches 12 files, takes 8 hours
**Fix**: Split into two phases (e.g., API + UI, or CRUD + Advanced features)

###Issue #3: Unclear Exit Criteria
**Problem**: "Feature complete"
**Fix**: "All CRUD operations work with authentication, validation, and error handling"

### Issue #4: Missing File Maps
**Problem**: API phase with no file-level detail
**Fix**: Add file map showing routes, schemas, middleware with dependencies

### Issue #5: Unrealistic Time
**Problem**: "Complete frontend" - 2 hours
**Fix**: Split into multiple phases or increase estimate to 6-8 hours

---

## Quality Standards

**Good planning docs are**:
- **Clear**: No ambiguity about what to do
- **Specific**: Concrete tasks and verification criteria
- **Context-safe**: Fit in one session with verification
- **Ordered**: Logical dependency flow
- **Realistic**: Accurate time estimates
- **Complete**: All required elements present

**Poor planning docs have**:
- **Vague**: "Make it work" style tasks
- **Oversized**: >8 files or >4 hours per phase
- **Ambiguous**: Unclear when phase is done
- **Unrealistic**: Overly optimistic estimates
- **Incomplete**: Missing verification or exit criteria

Use this checklist to ensure all planning docs meet the "good" standard.
