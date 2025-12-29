---
name: project-workflow:plan-feature
description: Plan new feature implementation for existing projects
---

# Plan Feature

Add a new feature to an existing project by generating new phases and integrating them into IMPLEMENTATION_PHASES.md and SESSION.md.

---

## Your Task

Follow these steps to plan and integrate a new feature into an existing project.

### 1. Check Prerequisites

Check that planning docs exist:
```bash
ls SESSION.md docs/IMPLEMENTATION_PHASES.md
```

**If SESSION.md doesn't exist:**
- Output: "❌ No SESSION.md found. This command is for existing projects."
- Suggest: "For new projects, use /plan-project instead."
- Stop

**If IMPLEMENTATION_PHASES.md doesn't exist:**
- Output: "❌ No IMPLEMENTATION_PHASES.md found."
- Suggest: "Create baseline planning with /plan-project first."
- Stop

Read SESSION.md to extract:
- Current phase number and name
- Current phase status (🔄 in progress, ✅ complete, ⏸️ pending)
- Current stage (Implementation/Verification/Debugging)

Read IMPLEMENTATION_PHASES.md to extract:
- All existing phases
- Last phase number
- Project tech stack

### 2. Check Current Phase Status

**If current phase is in progress (🔄):**

Output warning:
```
⚠️ WARNING: Phase [N] - [Name] is in progress.

Current phase status: [Stage]
Progress: [Show task completion from SESSION.md]

Adding a new feature now may cause confusion. Options:

1. Finish current phase first (recommended)
2. Add feature anyway (will append after current phases)
3. Cancel and come back later

Your choice (1/2/3):
```

**If choice 1 (Finish current phase):**
- Output: "Complete Phase [N] first, then run /plan-feature again."
- Stop

**If choice 2 (Add anyway):**
- Output: "⚠️ Adding feature. New phases will start after Phase [last phase number]."
- Continue

**If choice 3 (Cancel):**
- Output: "Cancelled. Run /plan-feature when current phase is complete."
- Stop

**If current phase is complete (✅) or paused (⏸️):**
- Continue normally

### 3. Gather Feature Requirements

Ask clarifying questions about the feature:

```
I'll help plan this feature. A few questions:

1. Feature Description: What does this feature do?
   (Be specific: "Add user profiles with avatar upload" vs "Add profiles")

2. Scope: Is this feature...
   - Small (1-2 phases, ~2-4 hours)
   - Medium (3-4 phases, ~6-10 hours)
   - Large (5+ phases, ~12+ hours)

3. Dependencies: Does this feature require...
   - New database tables/columns?
   - New API endpoints?
   - New UI components?
   - Third-party integrations?
   - All of the above?

4. Priority: When should this feature be built?
   - Immediately after current phase
   - After specific phase: [specify phase number]
   - At the end (append to existing phases)

5. Integration: Does this feature...
   - Modify existing functionality (may require changes to existing phases)?
   - Add completely new functionality (independent phases)?
```

Wait for user answers.

### 4. Generate Feature Phases

**Invoke project-planning skill** to generate phases for this feature:
- Provide feature description + requirements from user
- Provide context of existing project (tech stack from IMPLEMENTATION_PHASES.md)
- Request specific phase types needed (Database, API, UI, Integration)
- Skill generates new phases following validation rules

**Skill output**: New phases in IMPLEMENTATION_PHASES.md format

**Verify phases generated:**
- Check that phases follow context-safe sizing (≤8 files, 2-4 hours)
- Check that phases have verification criteria
- Check that phases have concrete tasks

### 5. Integrate into IMPLEMENTATION_PHASES.md

**Read existing IMPLEMENTATION_PHASES.md** completely.

**Determine insertion point** based on user's priority answer:
- **Immediately after current**: Insert after current phase number
- **After specific phase**: Insert after specified phase number
- **At the end**: Append to end of document

**If inserting mid-document:**
- Renumber all subsequent phases (e.g., if inserting after Phase 3, old Phase 4 becomes Phase 7 if adding 3 phases)
- Update any cross-phase references

**Add feature separator** before new phases:
```markdown
---

## Feature: [Feature Name] (Added [YYYY-MM-DD])

[Feature description from user]

---
```

**Insert new phases** with proper formatting:
- Match existing document style
- Include all required sections (Type, Estimated Time, Files, Tasks, Verification Criteria, Exit Criteria)
- Include file maps if phases are API/UI/Integration type
- Number phases correctly

**Write updated IMPLEMENTATION_PHASES.md**

### 6. Update SESSION.md

**Read current SESSION.md** completely.

**Determine where to insert new phases** (matching IMPLEMENTATION_PHASES.md):
- Same position as in IMPLEMENTATION_PHASES.md
- Maintain phase number consistency

**Add new phases** to SESSION.md:
- Set status as ⏸️ (pending) for all new phases
- Use collapsed format (just header + spec reference)
- Renumber existing phases if inserted mid-document

**Example insertion**:
```markdown
## Phase 3: Tasks API ✅
**Completed**: 2025-11-07 | **Checkpoint**: abc1234
**Summary**: CRUD endpoints with validation

## Phase 4: User Profiles Database ⏸️
**Type**: Database | **Added**: 2025-11-07
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-4`

## Phase 5: User Profiles API ⏸️
**Type**: API | **Added**: 2025-11-07
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-5`

## Phase 6: User Profiles UI ⏸️
**Type**: UI | **Added**: 2025-11-07
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-6`

## Phase 7: Task UI ⏸️
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-7`
[... existing phase, renumbered from Phase 4 ...]
```

**Update "Next Action" if feature is immediate priority:**
- If user chose "Immediately after current" and current phase is complete
- Update Next Action to first task of first feature phase

**Write updated SESSION.md**

### 7. Update Related Docs (If Applicable)

**Check if feature requires doc updates:**

**If feature adds database tables:**
- Ask: "Should I update DATABASE_SCHEMA.md with new tables? (y/n)"
- If yes: Read DATABASE_SCHEMA.md, add schema definitions for new tables, write updated file

**If feature adds API endpoints:**
- Ask: "Should I update API_ENDPOINTS.md with new routes? (y/n)"
- If yes: Read API_ENDPOINTS.md, add endpoint documentation, write updated file

**If feature changes architecture:**
- Ask: "Should I update ARCHITECTURE.md with new data flows? (y/n)"
- If yes: Read ARCHITECTURE.md, update architecture diagrams/descriptions, write updated file

**If feature adds UI components:**
- Ask: "Should I update UI_COMPONENTS.md with new components? (y/n)"
- If yes: Read UI_COMPONENTS.md, add component documentation, write updated file

### 8. Create Git Commit for Feature Planning

**Stage changes:**
```bash
git add docs/IMPLEMENTATION_PHASES.md SESSION.md
```

**If other docs were updated:**
```bash
git add docs/DATABASE_SCHEMA.md docs/API_ENDPOINTS.md docs/ARCHITECTURE.md docs/UI_COMPONENTS.md
```

**Create structured commit:**

Extract from generated phases:
- Number of new phases
- Phase names and types
- Total estimated hours

```bash
git commit -m "$(cat <<'EOF'
Add feature: [Feature Name]

Added [N] new phases for [feature description]:
- Phase [X]: [Name] ([Type], [Y] hours)
- Phase [X+1]: [Name] ([Type], [Y] hours)
[... list all new phases ...]

Integration point: [After Phase N / End of plan]
Estimated: [X] hours (~[Y] minutes human time)

Docs updated:
- IMPLEMENTATION_PHASES.md (added phases)
- SESSION.md (added pending phases)
[- DATABASE_SCHEMA.md] (if updated)
[- API_ENDPOINTS.md] (if updated)
[- ARCHITECTURE.md] (if updated)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 9. Output Feature Planning Summary

Display formatted summary:

```
═══════════════════════════════════════════════
   FEATURE PLANNING COMPLETE
═══════════════════════════════════════════════

✨ Feature: [Feature Name]
📦 Scope: [Small/Medium/Large] ([N] phases, [X] hours)

───────────────────────────────────────────────
NEW PHASES ADDED:
───────────────────────────────────────────────

Phase [X]: [Name] ([Type], [X] hours) ⏸️
Phase [Y]: [Name] ([Type], [X] hours) ⏸️
Phase [Z]: [Name] ([Type], [X] hours) ⏸️
[... list all new phases ...]

───────────────────────────────────────────────
INTEGRATION:
───────────────────────────────────────────────

• Inserted: [After Phase N / End of plan]
• Existing phases: [Renumbered from Phase X / Unchanged]
• Total project phases: [N]

───────────────────────────────────────────────
UPDATED DOCS:
───────────────────────────────────────────────

✅ IMPLEMENTATION_PHASES.md
✅ SESSION.md
[✅ DATABASE_SCHEMA.md] (if updated)
[✅ API_ENDPOINTS.md] (if updated)
[✅ ARCHITECTURE.md] (if updated)
[✅ UI_COMPONENTS.md] (if updated)

───────────────────────────────────────────────
CURRENT STATUS:
───────────────────────────────────────────────

Current Phase: Phase [N] - [Name] ([Status emoji])
New feature phases: ⏸️ (pending)

Next Action: [Current Next Action from SESSION.md]

═══════════════════════════════════════════════
```

### 10. Ask About Next Steps

Ask user:
```
Feature planning complete. What would you like to do?

Options:
1. Continue with current phase (recommended if in progress)
2. Start new feature immediately (skip ahead to feature phases)
3. Review feature phases first
4. Push to remote

Your choice (1/2/3/4):
```

**If choice 1 (Continue current):**
- Output: "Continuing with current work. Feature will be built later."
- No action needed

**If choice 2 (Start feature immediately):**
- Output: "⚠️ Skipping ahead to feature phases."
- Ask: "Update SESSION.md to mark current phase as paused (⏸️) and start feature? (y/n)"
- If yes:
  - Update SESSION.md: Change current phase to ⏸️, change first feature phase to 🔄
  - Expand first feature phase with task checklist
  - Set "Next Action" to first task of first feature phase
  - Output: "✅ SESSION.md updated. Starting [First Feature Phase Name]"

**If choice 3 (Review first):**
- Output: "Review new phases in docs/IMPLEMENTATION_PHASES.md. Run /continue-session when ready."
- Wait for user

**If choice 4 (Push to remote):**
```bash
git push
```
- Output: "✅ Feature planning pushed to remote" (if success)
- Output: "❌ Push failed. Run `git push` manually when ready." (if failed)

---

## Error Handling

**SESSION.md doesn't exist:**
- Output: "❌ No SESSION.md found. This command is for existing projects."
- Suggest: "Use /plan-project for new projects."
- Stop

**IMPLEMENTATION_PHASES.md doesn't exist:**
- Output: "❌ No IMPLEMENTATION_PHASES.md found."
- Suggest: "Run /plan-project to create baseline planning."
- Stop

**Current phase is in progress and user cancels:**
- Output: "Cancelled. Finish current phase first, then run /plan-feature."
- Stop

**Feature description is vague:**
- Output: "❌ Feature description unclear."
- Ask: "Please describe what this feature does in 1-2 sentences."
- Wait for clarification

**project-planning skill fails:**
- Output: "❌ Failed to generate feature phases."
- Suggest: "Describe phases manually and I'll integrate them."
- Wait for user input

**Phase numbering conflict:**
- Output: "⚠️ Phase numbering conflict detected."
- Output: "Renumbering all phases to maintain sequence."
- Show old → new phase number mapping
- Continue with renumbering

**File conflict with existing phases:**
- Output: "⚠️ Warning: Feature phase [N] modifies files used in existing Phase [X]."
- Output: "Files: [list conflicting files]"
- Output: "This may require refactoring. Review carefully."
- Ask: "Continue anyway? (y/n)"

**Git commit fails:**
- Output: "⚠️ Git commit failed: [error message]"
- Output: "Fix git issue and commit manually."
- Ask: "Continue without commit? (y/n)"

**Git push fails:**
- Output: "⚠️ Push failed: [error message]"
- Output: "You can run `git push` manually later."
- Continue (not critical)

**Related doc doesn't exist:**
- Output: "⚠️ [Doc name] not found. Skipping update."
- Continue with other docs

---

## Success Criteria

✅ Existing planning docs verified
✅ Current phase status checked
✅ Feature requirements gathered (5 questions answered)
✅ New phases generated with validation
✅ IMPLEMENTATION_PHASES.md updated with new phases
✅ SESSION.md updated with new pending phases
✅ Phase numbering consistent across all docs
✅ Related docs updated (if applicable)
✅ Git commit created for feature planning
✅ User has clear understanding of integration point
✅ User can continue current work or start feature
