# Git Checkpoint Commit Format

Use this structured format for all checkpoint commits during phased development.

---

## Template

```
checkpoint: Phase [N] [Status] - [Brief Description]

Phase: [N] - [Name]
Status: [Complete/In Progress/Paused/Blocked]
Session: [What was accomplished this session]

Files Changed:
- path/to/file.ts (what changed)
- path/to/another.tsx (what changed)

Next: [Concrete next action with file path + line number]
```

---

## Examples

### Phase Complete

```
checkpoint: Phase 3 Complete - Tasks API

Phase: 3 - Tasks API
Status: Complete
Session: Completed all CRUD endpoints and verified functionality

Files Changed:
- src/routes/tasks.ts (all CRUD operations)
- src/lib/schemas.ts (task validation)
- src/middleware/validate.ts (validation middleware)

Next: Phase 4 - Start building Task List UI component
```

### Context Full Mid-Phase

```
checkpoint: Phase 3 In Progress - Endpoints implemented

Phase: 3 - Tasks API
Status: In Progress
Session: Implemented GET and POST endpoints, need PATCH/DELETE

Files Changed:
- src/routes/tasks.ts (GET, POST endpoints)
- src/lib/schemas.ts (task schema)

Next: Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47
```

### Blocked or Paused

```
checkpoint: Phase 3 Paused - Need design decision

Phase: 3 - Tasks API
Status: Paused
Session: Built endpoints but need to decide on tag filtering approach

Files Changed:
- src/routes/tasks.ts (basic endpoints)

Next: Decide: client-side tag filtering or add SQL query parameter? Then resume at src/routes/tasks.ts:89
```

### Bug Fix During Verification

```
checkpoint: Phase 3 In Progress - Fixed validation bug

Phase: 3 - Tasks API
Status: In Progress (Verification stage)
Session: Fixed invalid data returning 500 instead of 400

Files Changed:
- src/middleware/validate.ts (added try-catch for Zod errors)

Next: Continue verification - test PATCH and DELETE endpoints
```

---

## Guidelines

**Status Values**:
- `Complete` - Phase fully done, all verification passed
- `In Progress` - Active work, may include stage (Implementation/Verification/Debugging)
- `Paused` - Temporarily stopped, waiting for decision or external input
- `Blocked` - Cannot proceed due to blocker (note blocker in Session field)

**Session Field**:
- Focus on WHAT was accomplished, not HOW
- Be specific enough for future resume
- Include stage if not obvious (Verification, Debugging)

**Files Changed**:
- List significant files only (not config changes)
- Briefly note what changed in each file
- Use relative paths from project root

**Next Field**:
- MUST be concrete (file + line + action)
- NOT vague ("Continue working on...")
- Include decision points if relevant
- File paths should be specific

---

## Creating Checkpoints

**When to checkpoint**:
- ✅ End of phase (status: Complete)
- ✅ Context getting full mid-phase (status: In Progress)
- ✅ Pausing for user decision (status: Paused)
- ✅ Hitting a blocker (status: Blocked)

**How to create**:
```bash
# Stage changes
git add path/to/changed/files

# Commit with checkpoint format
git commit -m "$(cat <<'EOF'
checkpoint: Phase 3 In Progress - Endpoints implemented

Phase: 3 - Tasks API
Status: In Progress
Session: Implemented GET and POST endpoints, need PATCH/DELETE

Files Changed:
- src/routes/tasks.ts (GET, POST endpoints)
- src/lib/schemas.ts (task schema)

Next: Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47
EOF
)"
```

**After checkpoint**:
- Update SESSION.md with checkpoint commit hash
- Push to remote if desired
- Clear context if needed
- Resume from "Next" field when continuing
