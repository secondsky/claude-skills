---
name: project-workflow:workflow
description: Interactive guide to the complete project lifecycle workflow system
---

# Workflow

Interactive guide to the Jezweb Workflow: 5 commands for complete project lifecycle automation.

---

## Your Task

Help the user understand and use the 5-command workflow system by providing interactive guidance based on their current context.

### Overview: The 5 Commands

Display this summary first:

```
═══════════════════════════════════════════════
   JEZWEB WORKFLOW - 5 COMMANDS
═══════════════════════════════════════════════

1. /explore-idea     → Research & validate ideas (PRE-planning)
2. /plan-project     → Generate planning docs (NEW projects)
3. /wrap-session     → Checkpoint progress (end of session)
4. /continue-session   → Load context (start of session)
5. /plan-feature     → Add features (EXISTING projects)

Complete Workflow:
Idea → /explore-idea → /plan-project → Work → /wrap-session → /continue-session (cycle)

Quick Workflow (clear requirements):
Idea → /plan-project → Work → /wrap-session → /continue-session (cycle)

Feature Addition:
/plan-feature → Work → /wrap-session → /continue-session (cycle)

═══════════════════════════════════════════════
```

### Step 1: Ask User's Context

Ask the user what they're trying to do:

```
What are you trying to do?

1. Explore a new project idea (not sure about approach yet)
2. Plan a new project (I know what I want)
3. Add a feature to existing project
4. Wrap my current session (context getting full)
5. Resume work on a project
6. Show me the complete workflow guide

Your choice (1-6):
```

### Step 2: Provide Context-Aware Guidance

Based on the user's choice, provide specific guidance:

#### Choice 1: Explore New Idea

```
═══════════════════════════════════════════════
   EXPLORING A NEW IDEA
═══════════════════════════════════════════════

You should use: /explore-idea

What it does:
• Free-flowing conversation (not rigid questionnaire)
• Heavy research (approaches, examples, alternatives)
• Validates tech stack and feasibility
• Challenges assumptions, prevents scope creep
• Sometimes recommends NOT building
• Creates PROJECT_BRIEF.md with validated decisions

When to use:
✅ Rough idea but not validated approach
✅ Multiple tech options, unsure which fits
✅ Want research/validation before committing

When to skip:
❌ Crystal-clear requirements (use /plan-project)

Output: PROJECT_BRIEF.md

Next step: /plan-project (reads the brief automatically)

Time saved: 10-15 minutes

═══════════════════════════════════════════════

Ready to run /explore-idea? (y/n)
```

If yes: Execute `/explore-idea`

---

#### Choice 2: Plan New Project

```
═══════════════════════════════════════════════
   PLANNING A NEW PROJECT
═══════════════════════════════════════════════

You should use: /plan-project

What it does:
• Checks for PROJECT_BRIEF.md (from /explore-idea)
• Invokes project-planning skill
• Generates IMPLEMENTATION_PHASES.md
• Creates SESSION.md automatically
• Creates git commit with planning docs
• Asks permission to start Phase 1

Prerequisites:
• Git repository (recommended)
• Project description OR PROJECT_BRIEF.md

Output:
• docs/IMPLEMENTATION_PHASES.md
• SESSION.md
• Other docs (DATABASE_SCHEMA.md, API_ENDPOINTS.md, etc.)

Next step: Start Phase 1, work through phases

Time saved: 5-7 minutes

═══════════════════════════════════════════════

Do you have a PROJECT_BRIEF.md from /explore-idea? (y/n)
```

If no: "That's fine! /plan-project will ask clarifying questions."

```
Ready to run /plan-project? (y/n)
```

If yes: Execute `/plan-project`

---

#### Choice 3: Add Feature

```
═══════════════════════════════════════════════
   ADDING A FEATURE
═══════════════════════════════════════════════

First: Does this project have SESSION.md? (y/n)
```

**If NO**:
```
❌ This project wasn't set up with the workflow.

Options:
1. Run /plan-project to set up workflow for this project
2. Manually create SESSION.md (see docs/skills_workflow.md)
3. Just work without workflow

Your choice (1-3):
```

**If YES**:
```
Great! Now, do you know HOW to build this feature? (y/n)
```

**If NO (uncertain)**:
```
Recommendation: Have a conversation with me first.

Tell me about the feature, and I'll:
• Research approaches and patterns
• Present tradeoffs
• Help you decide on approach

Then we'll run /plan-feature to formalize the plan.

What's the feature you want to add?
```

[Continue conversational exploration, then offer /plan-feature]

**If YES (clear approach)**:
```
You should use: /plan-feature

What it does:
• Verifies SESSION.md + IMPLEMENTATION_PHASES.md exist
• Asks 5 questions about feature
• Generates new phases
• Integrates into IMPLEMENTATION_PHASES.md
• Updates SESSION.md
• Creates git commit

Output:
• Updated IMPLEMENTATION_PHASES.md (new phases integrated)
• Updated SESSION.md (new pending phases)
• Updated related docs (if needed)

Time saved: 7-10 minutes

Ready to run /plan-feature? (y/n)
```

If yes: Execute `/plan-feature`

---

#### Choice 4: Wrap Session

```
═══════════════════════════════════════════════
   WRAPPING YOUR SESSION
═══════════════════════════════════════════════

You should use: /wrap-session

What it does:
• Analyzes current session state
• Updates SESSION.md with progress
• Detects and updates relevant docs
• Creates git checkpoint commit
• Sets concrete "Next Action"

When to use:
✅ Context window getting full (>80%)
✅ Completed a phase
✅ Stopping work for now
✅ Hit a blocker

Output:
• Updated SESSION.md
• Git checkpoint commit
• Handoff summary

Next step: Compact/clear context, then /continue-session

Time saved: 2-3 minutes

═══════════════════════════════════════════════

Ready to run /wrap-session? (y/n)
```

If yes: Execute `/wrap-session`

After completion:
```
Session wrapped! ✅

Next steps:
1. Compact context: Type /compact
   OR clear context: Use clear button
2. Resume: Run /continue-session when ready

Your Next Action is documented in SESSION.md
```

---

#### Choice 5: Continue Session

```
═══════════════════════════════════════════════
   RESUMING YOUR SESSION
═══════════════════════════════════════════════

You should use: /continue-session

What it does:
• Loads SESSION.md and planning docs
• Shows recent git history (last 5 commits)
• Displays current phase and progress
• Shows concrete "Next Action"
• Offers to open relevant file

Prerequisites:
• SESSION.md exists (created by /plan-project)
• Previous session wrapped (via /wrap-session)

Output:
• Session summary
• Clear next steps

Time saved: 1-2 minutes

═══════════════════════════════════════════════

Ready to run /continue-session? (y/n)
```

If yes: Execute `/continue-session`

---

#### Choice 6: Show Complete Guide

```
═══════════════════════════════════════════════
   COMPLETE WORKFLOW GUIDE
═══════════════════════════════════════════════

I've created comprehensive documentation at:

📖 docs/skills_workflow.md (~800 lines)

Contents:
• Philosophy (why this workflow exists)
• The 5 commands (deep dives)
• Complete workflows (3 scenarios)
• Decision trees (when to use what)
• Real-world examples (annotated)
• Troubleshooting (common issues)
• Time savings (measured metrics)
• Comparison to manual workflow

═══════════════════════════════════════════════

Would you like me to:
1. Open the complete guide (show full doc)
2. Show decision trees (when to use which command)
3. Show a specific workflow example
4. Answer a specific question

Your choice (1-4):
```

**If Choice 1**: Read and display docs/skills_workflow.md

**If Choice 2**: Show decision trees section from guide

**If Choice 3**: Ask which example (new project full flow, quick flow, or feature addition), then show that section

**If Choice 4**: "What's your question about the workflow?"

---

### Step 3: Offer Related Actions

After providing guidance, offer related next steps:

**After showing /explore-idea guidance**:
```
Related commands:
• After /explore-idea completes → Run /plan-project
• Need to understand planning phase? → Ask about /plan-project
```

**After showing /plan-project guidance**:
```
Related commands:
• After planning complete → Work on Phase 1
• When context full → Run /wrap-session
• Need to understand session management? → Ask about /wrap-session
```

**After showing /wrap-session guidance**:
```
Related commands:
• After wrapping → Compact/clear context
• To resume → Run /continue-session
```

**After showing /continue-session guidance**:
```
Related commands:
• After resuming → Continue with Next Action
• When context full again → Run /wrap-session
• Need to add feature? → Run /plan-feature
```

**After showing /plan-feature guidance**:
```
Related commands:
• After feature planned → Continue work
• When context full → Run /wrap-session
```

---

### Decision Tree Helper

If user asks "which command should I use?" or seems uncertain:

Show this decision tree:

```
═══════════════════════════════════════════════
   DECISION TREE: WHICH COMMAND?
═══════════════════════════════════════════════

What are you trying to do?

NEW PROJECT:
├─ Rough idea, not sure about approach
│  └─ /explore-idea → /plan-project
│
└─ Clear requirements, know what I want
   └─ /plan-project

EXISTING PROJECT:
├─ Add new feature
│  ├─ Not sure how → Conversation → /plan-feature
│  └─ Clear approach → /plan-feature
│
├─ Continue working
│  ├─ Context getting full → /wrap-session
│  ├─ Resuming work → /continue-session
│  └─ Just keep working (no command needed)
│
└─ Major architectural change
   └─ /explore-idea → Decide: New repo OR /plan-feature

═══════════════════════════════════════════════

Does this help? Which path matches your situation?
```

---

### Quick Reference Card

If user asks for "quick reference" or "cheat sheet":

```
═══════════════════════════════════════════════
   WORKFLOW QUICK REFERENCE
═══════════════════════════════════════════════

COMMAND          | WHEN TO USE               | OUTPUT
───────────────────────────────────────────────
/explore-idea    | Rough idea, need research | PROJECT_BRIEF.md
/plan-project    | New project, clear reqs   | IMPLEMENTATION_PHASES.md, SESSION.md
/wrap-session    | Context full, end session | Updated SESSION.md, git commit
/continue-session  | Start session, load state | Session summary, Next Action
/plan-feature    | Add feature to project    | Updated phases, SESSION.md

───────────────────────────────────────────────
TYPICAL WORKFLOWS
───────────────────────────────────────────────

Full: /explore-idea → /plan-project → Work → /wrap-session → /continue-session

Quick: /plan-project → Work → /wrap-session → /continue-session

Feature: /plan-feature → Work → /wrap-session → /continue-session

───────────────────────────────────────────────
TIME SAVINGS
───────────────────────────────────────────────

Exploration:  10-15 min saved
Planning:      5-7 min saved
Wrap cycle:    2-3 min saved (per wrap)
Resume cycle:  1-2 min saved (per resume)
Feature:       7-10 min saved

Total per project: 25-40 minutes saved

───────────────────────────────────────────────
DOCS
───────────────────────────────────────────────

📖 Complete guide: docs/skills_workflow.md
📋 Commands README: commands/README.md
🚀 Project README: README.md

═══════════════════════════════════════════════
```

---

### Error Handling

**If user asks about workflow but no commands installed**:
```
❌ Workflow commands not found in ~/.claude/commands/

To install:
cd /path/to/claude-skills
cp commands/*.md ~/.claude/commands/

Then commands will be available immediately.
```

**If user asks about workflow for project without SESSION.md**:
```
ℹ️  This project wasn't set up with the workflow.

Options:
1. Run /plan-project to set up workflow (creates SESSION.md)
2. Manually create SESSION.md (see docs/skills_workflow.md for template)
3. Continue without workflow

Which would you prefer?
```

**If user is confused about which command to use**:
```
No problem! Let me help you figure it out.

Tell me about your situation:
• Are you starting a new project or working on existing one?
• Do you have SESSION.md in your project?
• What are you trying to accomplish right now?

Based on your answers, I'll recommend the right command.
```

---

### Success Criteria

✅ User understands when to use each command
✅ User knows which command fits their current situation
✅ User has access to complete documentation
✅ User can execute the appropriate command
✅ User understands how commands integrate
✅ User knows where to find detailed examples

---

## Notes

**Purpose of this command**: Interactive guidance, NOT a replacement for comprehensive docs

**For detailed info**: Point user to docs/skills_workflow.md

**For command details**: Point user to commands/README.md

**Keep it conversational**: Adapt to user's level of familiarity

**Always offer to execute**: Don't just explain, offer to run the command

---

**Version**: 1.0.0
**Last Updated**: 2025-11-07
