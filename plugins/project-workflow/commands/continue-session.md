---
name: project-workflow:continue-session
description: Continue work from previous session by loading context from SESSION.md
---

# Continue Session

Quickly continue work by loading context from SESSION.md, showing current state, and continuing from "Next Action".

---

## Your Task

Follow these steps to load session context and resume work efficiently.

### 1. Load Session Context (Use Explore Agent)

Use the Task tool with subagent_type="Explore" and description "Load session context for resuming work" to gather:
- Find and read SESSION.md
- Find and read IMPLEMENTATION_PHASES.md (focus on current phase section)
- Extract current phase number and name
- Extract current stage (Implementation/Verification/Debugging)
- Extract last checkpoint hash and date
- Extract "Next Action" (file + line + what to do)
- Extract known issues
- Extract progress (completed and pending tasks)
- Get list of planning docs mentioned in SESSION.md
- Run `git log --oneline -5` for recent commits
- Run `git status` for uncommitted changes

**If SESSION.md doesn't exist:**
- Output: "❌ No SESSION.md found. Is this a new project?"
- Suggest: "Run project-planning skill to set up session management."
- Stop here

**If IMPLEMENTATION_PHASES.md doesn't exist:**
- Output: "⚠️ Warning: No IMPLEMENTATION_PHASES.md found."
- Output: "Continuing with SESSION.md only. Some context may be limited."
- Continue anyway

### 2. Check for Uncommitted Changes

If `git status` shows uncommitted changes:
- Output warning:
  ```
  ⚠️ WARNING: Uncommitted changes detected!

  Uncommitted files:
  [list files from git status]

  These changes weren't checkpointed. Continue anyway? (y/n)
  ```

**If user says no:**
- Output: "Stopping. Run /wrap-session to checkpoint changes first."
- Stop here

**If user says yes:**
- Output: "⚠️ Proceeding with uncommitted changes. Remember to checkpoint later."
- Continue

### 3. Show Recent Git History

Output formatted git history:

```
📜 Recent Commits (last 5):

[hash] [commit message line 1]
[hash] [commit message line 1]
[hash] [commit message line 1]
[hash] [commit message line 1]
[hash] [commit message line 1]

Current checkpoint: [hash from SESSION.md] ([date])
```

### 4. Display Session Summary

Output formatted summary:

```
═══════════════════════════════════════════════
   WELCOME BACK TO [PROJECT NAME]
═══════════════════════════════════════════════

📋 Current Phase: Phase [N] - [Phase Name] ([Status emoji])
📍 Current Stage: [Implementation/Verification/Debugging]
💾 Last Checkpoint: [hash] ([date])

───────────────────────────────────────────────
PROGRESS THIS PHASE:
───────────────────────────────────────────────

✅ [completed task]
✅ [completed task]
✅ [completed task]
🔄 [current pending task] ← CURRENT
⏸️ [future pending task]
⏸️ [future pending task]

───────────────────────────────────────────────
KNOWN ISSUES:
───────────────────────────────────────────────

• [issue 1]
• [issue 2]
[or "None" if no issues]

───────────────────────────────────────────────
NEXT ACTION:
───────────────────────────────────────────────

[Concrete next action from SESSION.md]
File: [file path]
Line: [line number] (if applicable)
Task: [specific action to take]

───────────────────────────────────────────────
PLANNING DOCS AVAILABLE:
───────────────────────────────────────────────

✅ SESSION.md (loaded)
✅ IMPLEMENTATION_PHASES.md (current phase loaded)
• [other docs from SESSION.md] (available)

═══════════════════════════════════════════════
```

### 5. Stage-Specific Context

**If current stage is "Verification":**
- Read current phase verification criteria from IMPLEMENTATION_PHASES.md
- Output:
  ```
  ───────────────────────────────────────────────
  VERIFICATION CHECKLIST (Current Phase):
  ───────────────────────────────────────────────

  [ ] [verification item 1]
  [ ] [verification item 2]
  [ ] [verification item 3]

  Check these items before marking phase complete.
  ───────────────────────────────────────────────
  ```

**If current stage is "Debugging":**
- Emphasize known issues
- Output:
  ```
  🐛 Currently debugging. Focus on resolving known issues above.
  ```

**If current stage is "Implementation":**
- No special output (normal flow)

### 6. Load Additional Planning Docs (Optional)

Check if SESSION.md references other planning docs (ARCHITECTURE.md, API_ENDPOINTS.md, DATABASE_SCHEMA.md, etc.)

If any are referenced, ask:
```
Additional planning docs available:
• ARCHITECTURE.md
• API_ENDPOINTS.md
• [others...]

Would you like me to load any of these? (Enter doc names or 'none'):
```

**If user specifies docs:**
- Read the specified docs
- Output: "✅ Loaded [doc list]"

**If user says "none":**
- Output: "Continuing with loaded context only."

### 7. Offer to Open "Next Action" File

Extract file path from "Next Action".

Ask user:
```
Next Action file: [file path]

Would you like me to open this file? (y/n)
```

**If yes:**
- Use Read tool to open the file
- If line number specified, focus on that area (offset/limit)
- Output: "✅ Opened [file] at line [line]"

**If no:**
- Output: "File not opened. You can request it when ready."

### 8. Offer to Proceed with Next Action

Ask user:
```
Ready to proceed with Next Action?

Next Action: [action description]

Options:
1. Yes - proceed with this action
2. No - I'll tell you what to do instead
3. Context only - just keep loaded context, don't execute yet

Your choice (1/2/3):
```

**If choice 1 (Yes):**
- Output: "Proceeding with: [Next Action]"
- Begin executing the Next Action
- Use appropriate tools (Edit, Write, Bash, etc.)

**If choice 2 (No):**
- Output: "What would you like to do instead?"
- Wait for user to specify new direction
- Update SESSION.md "Next Action" if user provides new task

**If choice 3 (Context only):**
- Output: "Context loaded. Ready when you are."
- Wait for user instructions

### 9. Final Confirmation

Output:
```
✨ Session resumed successfully!

Current context loaded:
• Phase [N] progress
• Next Action ready
• [X] planning docs loaded

Ready to continue work.
```

---

## Error Handling

**SESSION.md doesn't exist:**
- Output: "❌ No SESSION.md found. Is this a new project?"
- Suggest: "Run project-planning skill or create SESSION.md manually."
- Stop

**IMPLEMENTATION_PHASES.md missing:**
- Warning only, continue with SESSION.md
- Output: "⚠️ IMPLEMENTATION_PHASES.md not found. Limited context available."

**Next Action is vague or missing:**
- Output: "⚠️ Next Action is unclear or missing in SESSION.md."
- Output: "Please update SESSION.md with specific: [file] + [line] + [action]"
- Offer to help: "Would you like me to help you define the Next Action? (y/n)"

**File from Next Action doesn't exist:**
- Output: "⚠️ File [path] from Next Action not found."
- Ask: "Has it been moved or renamed? Should I search for it? (y/n)"

**Git commands fail:**
- Output: "⚠️ Git history unavailable. Continuing without it."
- Show SESSION.md context only

**Phase number mismatch:**
- If SESSION.md phase doesn't match IMPLEMENTATION_PHASES.md:
- Output: "⚠️ Phase mismatch detected between SESSION.md and IMPLEMENTATION_PHASES.md"
- Output: "Using SESSION.md as source of truth."

---

## Success Criteria

✅ User has full context of where they left off
✅ Current phase progress is crystal clear
✅ Next Action is specific and ready to execute
✅ User can immediately continue work or adjust direction
✅ All relevant planning docs are accessible
✅ Recent git history provides continuity
