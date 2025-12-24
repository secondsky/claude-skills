# Session Management Best Practices

**When to use, how to maintain, and common patterns for successful session management**

---

## When to Use Session Management

### ✅ Use SESSION.md When

- **Multi-phase projects** (3+ phases)
- **Complex implementations** (>8 hours total estimated work)
- **Frequent context clears** (working across multiple sessions)
- **Multiple parallel projects** (need to switch context often)
- **Team collaboration** (others need to understand current state)

### ❌ Skip SESSION.md When

- **Single-phase project** (<2 hours of work)
- **Spike/prototype** (exploratory work, not production)
- **Quick fix** (one-off bug fix or small change)
- **Fully completed project** (all phases done, no active work)

---

## Maintenance Patterns

### Update Frequency

**Update SESSION.md when**:
- ✅ Completing a task within a phase
- ✅ Moving between stages (Implementation → Verification → Debugging)
- ✅ Hitting a blocker or pausing work
- ✅ Completing a phase
- ✅ Context is getting full (need to checkpoint)

**Don't update SESSION.md for**:
- ❌ Every single line of code
- ❌ Minor refactoring during implementation
- ❌ Fixing typos or formatting
- ❌ Temporary debugging experiments

**Rule of thumb**: Update after "significant progress" (completing a checklist item, moving stages, or ending session)

---

## Git Checkpoint Timing

### When to Create Checkpoints

**Always checkpoint when**:
- ✅ Phase complete (all verification passed)
- ✅ Context getting full (>80% of context window)
- ✅ Pausing work (end of day, switching projects)
- ✅ Hit a blocker (waiting for decision or external input)

**Consider checkpointing when**:
- ⚡ Finishing a major task (e.g., all CRUD endpoints done)
- ⚡ Switching stages (Implementation → Verification)
- ⚡ After fixing a complex bug

**Don't checkpoint**:
- ❌ Every commit (checkpoints are milestones, not commits)
- ❌ Work in progress (wait for completed task)
- ❌ Failed experiments (revert instead)

---

## Next Action Quality

### ✅ Good Next Actions (Concrete)

```markdown
**Next Action**: Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47, handle validation and ownership check
```
- File path: `src/routes/tasks.ts`
- Line number: `47`
- Specific action: "Implement PATCH endpoint"
- Context: "handle validation and ownership check"

```markdown
**Next Action**: Fix validation bug in src/middleware/validate.ts:23, add try-catch for Zod errors
```
- Debugging-focused
- Specific file and line
- Clear fix needed

```markdown
**Next Action**: Decide: client-side tag filtering or add SQL query parameter? Then resume at src/routes/tasks.ts:89
```
- Decision point clearly stated
- Resume point provided
- User knows this is blocked on their choice

### ❌ Bad Next Actions (Vague)

```markdown
**Next Action**: Continue working on API
```
- Which API endpoint?
- Which file?
- What specifically needs to be done?

```markdown
**Next Action**: Fix bugs
```
- Which bugs?
- Where are they?
- No concrete starting point

```markdown
**Next Action**: Finish Phase 3
```
- What's left to do?
- No specific task
- No file path

---

## Status Icon Usage

### Phase Status

- **⏸️ Pending** - Not started yet, waiting for earlier phases
- **🔄 In Progress** - Currently working on this phase
- **✅ Complete** - All tasks done, verification passed
- **🚫 Blocked** - Cannot proceed due to external blocker

**Rules**:
- Only ONE phase should be 🔄 at a time (current focus)
- Use 🚫 sparingly (most "blockers" are really pauses)
- Mark ✅ only when verification complete (not just code written)

### Task Status

Within a phase's progress checklist:
- `- [ ]` = Not started
- `- [ ]` with `← **CURRENT**` = Working on this now
- `- [x]` = Completed
- `- [x]` with `✅` = Completed and verified

---

## Common Patterns

### Pattern: Mid-Phase Context Clear

**Scenario**: Implementing Phase 3, context at 85%, still have 3 tasks left

**Action**:
1. Update SESSION.md progress (mark completed tasks with `[x]`)
2. Set "Next Action" to next uncompleted task
3. Create checkpoint commit (status: In Progress)
4. Push to remote
5. Clear context
6. New session: Read SESSION.md, go to "Next Action"

**Example SESSION.md update**:
```markdown
## Phase 3: Tasks API 🔄
**Progress**:
- [x] GET /api/tasks endpoint (commit: abc123)
- [x] POST /api/tasks endpoint (commit: def456)
- [ ] PATCH /api/tasks/:id ← **CURRENT**
- [ ] DELETE /api/tasks/:id
- [ ] Verify all endpoints

**Next Action**: Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47
```

---

### Pattern: Verification Stage Tracking

**Scenario**: Phase 3 code complete, now verifying against criteria

**Action**:
1. Change "Current Stage" to "Verification"
2. Add "Verification Progress" section
3. Check off criteria as you test
4. Note failures with ❌ and description

**Example SESSION.md update**:
```markdown
## Phase 3: Tasks API 🔄
**Current Stage**: Verification

**Verification Progress**:
- [x] GET /api/tasks returns 200 ✅
- [x] POST /api/tasks creates task ✅
- [ ] POST with invalid data returns 400 ❌ (returns 500)
- [ ] PATCH updates task
- [ ] DELETE removes task

**Current Issue**: Invalid data returning 500 instead of 400. Need to check validation middleware in src/middleware/validate.ts
```

**Next**: Switch to "Debugging" stage, fix the issue, return to "Verification"

---

### Pattern: Phase Complete

**Scenario**: All verification passed, phase is done

**Action**:
1. Change phase status from 🔄 to ✅
2. Add completion date and checkpoint
3. Collapse to 2-3 lines
4. Change next phase from ⏸️ to 🔄
5. Create checkpoint commit (status: Complete)

**Before**:
```markdown
## Phase 3: Tasks API 🔄
**Progress**:
- [x] GET /api/tasks endpoint
- [x] POST /api/tasks endpoint
- [x] PATCH /api/tasks/:id
- [x] DELETE /api/tasks/:id
- [x] Verify all endpoints ✅

**Next Action**: Verify DELETE endpoint
```

**After**:
```markdown
## Phase 3: Tasks API ✅
**Completed**: 2025-10-23 | **Checkpoint**: ghi789
**Summary**: All CRUD endpoints implemented and verified

## Phase 4: Task UI 🔄
**Type**: UI | **Started**: 2025-10-23
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-4`
**Next Action**: Create TaskList component in src/components/TaskList.tsx
```

---

## Troubleshooting

### Problem: SESSION.md growing too large (>200 lines)

**Solution**: Archive completed phases
1. Create `SESSION_ARCHIVE.md`
2. Move completed phases there
3. Keep only current + next 2-3 phases in SESSION.md

### Problem: Forgot to update SESSION.md, now out of sync

**Solution**: Reconstruct from git history
1. Look at recent commits
2. Update SESSION.md to match actual state
3. Set concrete "Next Action"
4. Create checkpoint commit to establish baseline

### Problem: Next Action is now wrong (changed approach)

**Solution**: Update immediately
1. Change "Next Action" to reflect new approach
2. Add note in "Known Issues" if relevant
3. If significant change, create checkpoint commit

### Problem: Multiple blockers, can't proceed

**Solution**: Use 🚫 status and document
```markdown
## Phase 5: Payments Integration 🚫
**Blocked**: Need 3 decisions:
1. Stripe vs. PayPal? (user preference)
2. Webhook URL for production? (DevOps team)
3. Test credit card limits? (compliance team)

**Resume When**: All 3 decisions made
**Next Action**: Implement chosen payment provider integration
```

---

## Integration with Tools

### With project-planning Skill

1. `project-planning` creates IMPLEMENTATION_PHASES.md
2. `project-session-management` creates SESSION.md from phases
3. Work through phases, updating SESSION.md
4. Checkpoints preserve state

### With Git

- SESSION.md is committed (part of project state)
- Checkpoint commits use structured format
- `git log --grep="checkpoint:"` shows milestones
- SESSION.md refers to checkpoint commits

### With Claude Code

- SESSION.md is small enough to stay in context
- References planning docs (don't duplicate)
- Concrete "Next Action" enables instant resume
- Works across multiple Claude Code sessions

---

## Metrics for Success

### Good Session Management

- ✅ Can resume in <1 minute after context clear
- ✅ SESSION.md always current (<1 day stale)
- ✅ Checkpoint commits every 2-4 hours of work
- ✅ Next Action is always concrete
- ✅ Never lost progress on context clear

### Needs Improvement

- ⚠️ SESSION.md out of sync (>2 days stale)
- ⚠️ Next Actions are vague
- ⚠️ No checkpoints in last 8 hours of work
- ⚠️ Lost progress on context clear
- ⚠️ Confusion about what to do next

---

## Advanced Techniques

### Multi-Branch Workflow

For working on multiple features simultaneously:

```markdown
# Session State

**Current Branch**: feature/auth-refactor
**Current Phase**: Phase 5 (Auth refactor)

## Active Branches

### main (Phase 9 complete)
**Last Checkpoint**: abc123
**Status**: Stable, deployed to production

### feature/auth-refactor (Phase 5 in progress)
**Last Checkpoint**: def456
**Next**: Refactor JWT verification in src/middleware/auth.ts:34

### hotfix/bug-123 (Phase 3 paused)
**Last Checkpoint**: ghi789
**Blocked**: Waiting for API provider fix
```

### Phase Dependencies

When phases have dependencies:

```markdown
## Phase 7: Notifications 🚫
**Blocked By**: Phase 6 (Email Service Setup) must complete first
**Dependency**: Needs email templates and service configured
**Estimated Start**: After Phase 6 complete (2025-10-25)
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-7`
```

---

**Last Updated**: 2025-10-28
**Version**: 1.0
**Author**: Claude Skills Maintainers
