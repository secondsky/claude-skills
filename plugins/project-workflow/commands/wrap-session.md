---
name: project-workflow:wrap-session
description: Checkpoint current session progress and save context
---

# Wrap Session

Automate end-of-session workflow: update SESSION.md, create git checkpoint, and prepare for context clear.

---

## Your Task

Follow these steps to wrap up the current session and prepare for a clean handoff.

### 1. Analyze Current State (Use Task Agent)

Use the Task tool with description "Analyze session state for wrap-up" to gather:
- Read SESSION.md completely
- Run `git status` to see uncommitted changes
- Run `git log -1 --oneline` to see last commit
- Run `git diff --stat` to see what changed
- Extract current phase number, name, and status
- Extract current stage (Implementation/Verification/Debugging)
- Extract "Next Action"
- Extract "Known Issues"

If SESSION.md doesn't exist:
- Stop and output: "❌ No SESSION.md found. Run project-planning skill first to set up session management."
- Do not proceed further

### 2. Update SESSION.md

**Update the following sections:**

**a) Current Stage**
- If tasks completed and ready for verification: Change to "Verification"
- If verification done and ready for next phase: Keep as current
- If debugging: Keep as "Debugging"

**b) Progress Section**
- Mark any completed tasks with `[x]`
- Add new tasks discovered during session
- Reorder if priorities changed

**c) Known Issues**
- Add any new issues discovered this session
- Remove resolved issues
- Update issue descriptions if changed

**d) Next Action**
- Update to be concrete and specific:
  - Must include: file path + line number (if applicable) + specific action
  - Example: "Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47, handle validation and ownership check"
  - NOT vague like: "Continue working on API..."

**e) Last Checkpoint**
- Update date to today (YYYY-MM-DD format)
- Checkpoint hash will be updated after git commit (step 4)

**f) If Phase Complete**
- Change phase status from 🔄 to ✅
- Add "Completed" date
- Add "Summary" with 2-3 line accomplishment description
- Collapse phase section to 2-3 lines
- Move to next phase:
  - Change next phase from ⏸️ to 🔄
  - Expand next phase with initial task list
  - Set new "Next Action"

### 3. Check for Doc Updates

**Analyze what changed** this session using git diff output.

**Ask user about updating these docs** (only if relevant changes detected):

**If phase completed:**
- "Phase [N] complete! Should I add entry to CHANGELOG.md? (y/n)"

**If architecture changed** (new patterns, major refactoring):
- "Architecture changes detected. Update ARCHITECTURE.md? (y/n)"

**If API endpoints added/modified:**
- "API changes detected. Update API_ENDPOINTS.md? (y/n)"

**If database schema changed:**
- "Schema changes detected. Update DATABASE_SCHEMA.md? (y/n)"

**If README needs updates** (new features, changed usage):
- "User-facing changes detected. Update README.md? (y/n)"

**For each "yes":**
- Read the relevant doc
- Update with session changes
- Confirm update was made

**Note:** Don't ask about docs that don't exist or aren't relevant to changes.

### 4. Create Git Checkpoint

**a) Stage all changes:**
```bash
git add .
```

**b) Check if there are changes to commit:**
```bash
git status --short
```

If no changes:
- Output: "ℹ️ No changes to commit. SESSION.md updated, no checkpoint created."
- Skip to step 5

**c) Determine checkpoint status:**
- If phase complete: Status = "Complete"
- If significant progress: Status = "In Progress"
- If blocked/paused: Status = "Paused"
- Otherwise: Status = "In Progress"

**d) Get phase info from SESSION.md:**
- Phase number
- Phase name
- What was accomplished this session (from progress updates)
- Files that changed (from git status)

**e) Create structured commit message:**

```bash
git commit -m "$(cat <<'EOF'
checkpoint: Phase [N] [Status] - [Brief Description]

Phase: [N] - [Phase Name]
Status: [Complete/In Progress/Paused]
Session: [1-2 sentence summary of what was accomplished]

Files Changed:
- path/to/file.ts ([what changed])
- path/to/file2.ts ([what changed])
[... list all significant files]

Next: [Concrete next action from SESSION.md]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**f) Get commit hash:**
```bash
git log -1 --format="%h"
```

**g) Update SESSION.md "Last Checkpoint" with new hash**

### 5. Output Handoff Summary

Display a formatted summary:

```
═══════════════════════════════════════════════
   SESSION WRAP-UP COMPLETE
═══════════════════════════════════════════════

📋 Phase: [N] - [Phase Name] ([Status emoji])
📍 Stage: [Implementation/Verification/Debugging]

✅ Completed This Session:
   • [accomplishment 1]
   • [accomplishment 2]
   • [accomplishment 3]

🎯 Next Action:
   [Concrete next action from SESSION.md]

💾 Checkpoint: [hash] ([date])

📄 Docs Updated:
   • SESSION.md
   • [CHANGELOG.md] (if updated)
   • [other docs] (if updated)

═══════════════════════════════════════════════
```

### 6. Ask About Git Push

Ask user: "Push checkpoint to remote? (y/n)"

**If yes:**
```bash
git push
```

**If push succeeds:**
- Output: "✅ Pushed to remote successfully"

**If push fails:**
- Output: "❌ Push failed. Run `git push` manually when ready."

### 7. Final Message

Output:
```
✨ Session wrapped successfully!

Ready to clear context or continue working.

To resume: Run `/continue-session` in your next session.
```

---

## Error Handling

**SESSION.md doesn't exist:**
- Stop immediately
- Output: "❌ No SESSION.md found. Create it first with project-planning skill."

**No IMPLEMENTATION_PHASES.md:**
- Warning: "⚠️ No IMPLEMENTATION_PHASES.md found. Continuing with SESSION.md only."
- Proceed without phase verification

**Git commit fails:**
- Output error message
- Output: "Fix git issue and try again, or commit manually."

**Git push fails:**
- Output: "⚠️ Push failed. You can run `git push` manually later."
- Continue (not critical)

**Docs update fails:**
- Output: "⚠️ Failed to update [doc]. You can update it manually."
- Continue with other updates

---

## Success Criteria

✅ SESSION.md updated with current progress
✅ Git checkpoint created with structured message
✅ Relevant docs updated (if needed)
✅ Clear "Next Action" for resuming
✅ User knows exactly what to do next
