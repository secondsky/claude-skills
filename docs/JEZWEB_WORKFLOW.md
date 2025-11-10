# The Claude Skills Workflow: Complete Project Lifecycle with Claude Code

**Version**: 1.0.0
**Last Updated**: 2025-11-07
**Author**: Claude Skills Maintainers

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [The 5 Commands](#the-5-commands)
3. [Complete Workflows](#complete-workflows)
4. [Command Deep Dives](#command-deep-dives)
5. [Decision Trees](#decision-trees)
6. [Real-World Examples](#real-world-examples)
7. [Troubleshooting](#troubleshooting)
8. [Time Savings](#time-savings)
9. [Comparison to Manual Workflow](#comparison-to-manual-workflow)

---

## Philosophy

### The Problem This Workflow Solves

Building software with AI assistance is incredibly powerful, but faces challenges:

1. **Context Window Limits**: You can't keep an entire project in context forever
2. **Lost Progress**: Switching sessions means losing track of where you were
3. **Planning Overhead**: Setting up projects takes time and is error-prone
4. **Feature Creep**: Easy to over-build or go down wrong paths
5. **Fragmented Workflow**: Exploration → Planning → Execution → Session management all feel disconnected

### The Solution: Integrated Command Suite

The Claude Skills Workflow provides **5 slash commands** that work together as an integrated system:

```
/explore-idea   → Research and validate ideas (PRE-planning)
/plan-project   → Structure validated ideas into phases
/wrap-session   → Checkpoint progress when context fills
/continue-session → Continue exactly where you left off
/plan-feature   → Add features to existing projects
```

**Key Principles**:

- **Exploration BEFORE Commitment**: Validate ideas before building
- **Phased Execution**: Break work into context-safe chunks
- **Session Continuity**: Never lose progress across context clears
- **Scope Management**: Prevent feature creep and over-engineering
- **Documentation-Driven**: Planning docs are navigation, SESSION.md is your bookmark

---

## The 5 Commands

### Overview

| Command | Phase | Purpose | Time Saved |
|---------|-------|---------|------------|
| `/explore-idea` | Pre-Planning | Research, validate, scope new project ideas | 10-15 min |
| `/plan-project` | Planning | Generate IMPLEMENTATION_PHASES.md, create SESSION.md | 5-7 min |
| `/wrap-session` | Session Management | Checkpoint progress, update SESSION.md, git commit | 2-3 min |
| `/continue-session` | Session Management | Load context, show progress, continue work | 1-2 min |
| `/plan-feature` | Feature Addition | Add phases for new features to existing project | 7-10 min |

**Total Time Savings**: 25-40 minutes per project lifecycle

### Installation

```bash
# Copy all commands to your .claude/commands/ directory
cp commands/explore-idea.md ~/.claude/commands/
cp commands/plan-project.md ~/.claude/commands/
cp commands/wrap-session.md ~/.claude/commands/
cp commands/continue-session.md ~/.claude/commands/
cp commands/plan-feature.md ~/.claude/commands/
```

Commands are immediately available in Claude Code after copying.

---

## Complete Workflows

### Workflow 1: New Project from Rough Idea (Full Flow)

**When to use**: You have a rough idea but haven't validated the approach yet.

```
1. Rough Idea
   ↓
2. /explore-idea
   • Free-flowing conversation about what you want
   • Claude researches approaches, examples, alternatives
   • Validates tech stack and feasibility
   • Challenges assumptions, prevents scope creep
   • Sometimes recommends NOT building
   • Creates: PROJECT_BRIEF.md
   ↓
3. Decision Point
   • Proceed → Continue to step 4
   • Pause → Save brief, validate later
   • Pivot → Adjust approach, update brief
   • Don't Build → Use alternative solution
   ↓
4. /plan-project
   • Reads PROJECT_BRIEF.md (if exists)
   • Invokes project-planning skill
   • Creates: IMPLEMENTATION_PHASES.md, SESSION.md, other docs
   • Asks permission to start Phase 1
   ↓
5. Start Phase 1
   • Execute tasks from SESSION.md
   • Build features, write code
   • Context starts filling up...
   ↓
6. /wrap-session
   • Updates SESSION.md with progress
   • Creates git checkpoint commit
   • Notes concrete "Next Action"
   ↓
7. Compact/Clear Context
   • /compact or clear conversation
   • Frees up context window
   ↓
8. /continue-session
   • Loads SESSION.md, planning docs
   • Shows recent git commits
   • Displays current phase, progress, Next Action
   • Continues exactly where you left off
   ↓
9. Continue Phase or Start Next Phase
   • Work through remaining tasks
   • When phase complete: Move to next phase
   • When context full: Return to step 6 (wrap → resume cycle)
   ↓
10. Need New Feature?
    • /plan-feature → Adds phases to existing plan
    • Continue wrap → resume cycle
```

**Time**: ~25-40 minutes saved vs manual workflow

---

### Workflow 2: New Project with Clear Requirements (Quick Flow)

**When to use**: You already know what you want and how to build it.

```
1. Clear Requirements
   ↓
2. /plan-project
   • Asks clarifying questions (tech stack, features, scope)
   • Invokes project-planning skill
   • Creates: IMPLEMENTATION_PHASES.md, SESSION.md
   • Asks permission to start Phase 1
   ↓
3. Work → /wrap-session → /continue-session cycle
   (Same as Workflow 1, steps 5-9)
```

**Time**: ~15-25 minutes saved vs manual workflow

**Why skip /explore-idea?**
- You've already done research
- Tech stack is validated and decided
- Scope is clear and well-defined
- No need for alternatives exploration

---

### Workflow 3: Adding Feature to Existing Project

**When to use**: You have a running project and want to add new functionality.

```
1. Existing Project + Feature Idea
   ↓
2. Need Exploration?

   YES (not sure how to approach):
   • Have conversation with Claude
   • Research approaches, tradeoffs
   • Validate complexity
   • Make decision → Continue to step 3

   NO (clear feature requirements):
   • Skip straight to step 3
   ↓
3. /plan-feature
   • Verifies SESSION.md + IMPLEMENTATION_PHASES.md exist
   • Asks 5 questions about feature
   • Generates new phases via project-planning skill
   • Integrates into IMPLEMENTATION_PHASES.md
   • Updates SESSION.md
   • Creates git commit
   ↓
4. Work → /wrap-session → /continue-session cycle
   (Same as Workflow 1, steps 5-9)
```

**Time**: ~7-10 minutes saved per feature addition

**Note**: For MAJOR architectural changes (basically new project), use /explore-idea instead.

---

## Command Deep Dives

### /explore-idea

**Purpose**: Collaborative exploration partner for PRE-planning phase

**When to Use**:
- ✅ Rough idea but not validated approach
- ✅ Multiple tech options, unsure which fits
- ✅ Want research/validation before committing
- ✅ Need scope management to prevent feature creep

**When to Skip**:
- ❌ Crystal-clear requirements and validated stack
- ❌ Small, obvious project (minor addition)
- ❌ Already researched, ready to plan

**What It Does**:

**Phase 1: Initial Understanding** (Conversational)
- Free-flowing conversation (NOT rigid questionnaire)
- Listens for: problem, solution idea, tech preferences, examples, audience
- Adapts questions based on what you share
- Key principle: Thought partner, not interviewer

**Phase 2: Research & Validation** (Heavy Lifting)
- Uses Explore subagent for technical research
- Checks Context7 MCP for official docs
- Uses WebSearch for competitive analysis
- Finds GitHub examples and working templates
- Identifies common pitfalls and known issues
- Checks if relevant skills exist in ~/.claude/skills/

**Phase 3: Scope Management** (Challenge Assumptions)
- Validates "should we build this?"
- Challenges assumptions productively
- Prevents feature creep
- Sometimes recommends NOT building
- Helps define MVP vs full feature set

**Phase 4: Create PROJECT_BRIEF.md**
- Vision and problem statement
- Target audience and scale
- Core functionality (MVP) vs out-of-scope
- Validated tech stack with rationale
- Research findings and similar solutions
- Known challenges and mitigation
- Estimated effort and success criteria
- Next steps recommendation

**Phase 5: Handoff Decision**
- Recommends: Proceed / Validate First / Don't Build
- Offers 4 options:
  1. Proceed to planning (/plan-project)
  2. Refine the brief
  3. Park this idea
  4. Pivot to different approach

**Output**: PROJECT_BRIEF.md in project root (or planning/ directory)

**Typical Duration**: 5-15 message exchanges (10-20 minutes conversation)

**Example Session**:

```
You: "I want to build an MCP server that scrapes websites"

Claude: "Let's explore this idea together. Tell me more about what you're thinking -
what kind of websites would this scrape, and what would you do with the data?"

You: "Mostly documentation sites and blogs. I want to feed the content into an AI for
research. Thinking Cloudflare Workers since that's my preferred stack."

Claude: "Got it! So you want to scrape docs/blogs on Cloudflare Workers to feed AI
research workflows. Let me research some approaches..."

[Claude uses Explore agent to research MCP patterns, Cloudflare Workers compatibility,
web scraping approaches, finds Firecrawl API as simpler alternative]

Claude: "I researched MCP servers on Cloudflare. Good news: there are 13+ official
examples, and the @modelcontextprotocol/sdk works great with Workers. For web scraping,
I found Firecrawl's API is way easier than building custom scraping (they handle
rendering, rate limits, etc.). Want me to show you a simple example?"

[Conversation continues, explores scope, creates PROJECT_BRIEF.md]

Claude: "✅ I've created PROJECT_BRIEF.md summarizing our exploration.

Based on research and scope analysis, I recommend: ✅ Proceed

Rationale: Validated approach (MCP + Workers + Firecrawl), reasonable scope
(20-30 hours estimated), no major blockers.

What would you like to do?
1. Proceed to planning - Run /plan-project
2. Refine the brief
3. Park this idea
4. Pivot

Your choice:"
```

**Integration**: Seamlessly hands off to /plan-project (reads PROJECT_BRIEF.md as context)

---

### /plan-project

**Purpose**: Automate initial project planning for NEW projects

**When to Use**:
- ✅ After /explore-idea (proceeding with idea)
- ✅ Clear requirements (skip exploration)
- ✅ Starting new project from scratch

**When to Skip**:
- ❌ Adding feature to existing project (use /plan-feature)
- ❌ Still exploring ideas (use /explore-idea first)

**What It Does**:

**Phase 0: Check for PROJECT_BRIEF.md** (Optional)
- Looks for PROJECT_BRIEF.md in root or planning/
- If found: Reads and extracts validated scope, tech stack
- Uses as context for project-planning skill
- Skips redundant questions already answered in brief

**Phase 1: Invoke project-planning Skill**
- If description vague: Asks 1-2 clarifying questions first
- Invokes project-planning skill with description
- Skill handles all requirements gathering
- Skill generates IMPLEMENTATION_PHASES.md + other docs as needed

**Phase 2: Verify Planning Docs**
- Checks docs/IMPLEMENTATION_PHASES.md exists
- Lists other generated docs (DATABASE_SCHEMA.md, API_ENDPOINTS.md, etc.)

**Phase 3: Create SESSION.md**
- Reads IMPLEMENTATION_PHASES.md to extract phases
- Creates SESSION.md in project root
- Lists all phases (current phase expanded, others collapsed)
- Sets concrete "Next Action" for Phase 1

**Phase 4: Create Initial Git Commit**
- Checks if planning docs are already committed
- If not: Creates structured commit
- Commit message format:
  ```
  Initial project planning (or: Add project planning documentation)

  Generated planning documentation:
  - IMPLEMENTATION_PHASES.md (N phases, ~X hours)
  - [other docs...]
  - SESSION.md (session tracking)

  Next: Start Phase 1 - [Phase Name]
  ```

**Phase 5: Output Planning Summary**
- Formatted summary showing:
  - Project name, stack, estimated hours
  - Planning docs created
  - Phases overview with status emoji
  - Next Action (concrete first step)
  - Key files to know

**Phase 6: Ask Permission to Start Phase 1**
- Options:
  1. Yes - proceed with Phase 1 Next Action
  2. Review first - I want to review planning docs
  3. Adjust - I want to refine some phases

**Phase 7: Optional Push to Remote**
- Asks if you want to push planning docs
- If yes: `git push`

**Output**:
- docs/IMPLEMENTATION_PHASES.md (always)
- SESSION.md (always)
- Other docs as needed (DATABASE_SCHEMA.md, API_ENDPOINTS.md, etc.)

**Typical Duration**: 5-7 minutes (15-20 manual steps automated)

**Example Output**:

```
═══════════════════════════════════════════════
   PROJECT PLANNING COMPLETE
═══════════════════════════════════════════════

📋 Project: MCP Web Scraper
📦 Stack: Cloudflare Workers + TypeScript + Firecrawl API
⏱️  Estimated: 25 hours (~25 min human time)

───────────────────────────────────────────────
PLANNING DOCS CREATED:
───────────────────────────────────────────────

✅ IMPLEMENTATION_PHASES.md (6 phases)
✅ SESSION.md (progress tracker)
✅ API_ENDPOINTS.md
✅ ARCHITECTURE.md

───────────────────────────────────────────────
PHASES OVERVIEW:
───────────────────────────────────────────────

Phase 1: Project Setup (Setup, 2 hours) 🔄 ← CURRENT
Phase 2: MCP Server Base (API, 4 hours) ⏸️
Phase 3: Firecrawl Integration (Integration, 5 hours) ⏸️
Phase 4: Tool Implementation (API, 6 hours) ⏸️
Phase 5: Error Handling (Quality, 4 hours) ⏸️
Phase 6: Testing & Deployment (Testing, 4 hours) ⏸️

───────────────────────────────────────────────
NEXT ACTION (Phase 1):
───────────────────────────────────────────────

Initialize Cloudflare Worker with Wrangler
Task: Run `npm create cloudflare@latest mcp-scraper -- --type=worker`

───────────────────────────────────────────────
KEY FILES TO KNOW:
───────────────────────────────────────────────

• SESSION.md - Track progress, current state
• docs/IMPLEMENTATION_PHASES.md - Full phase details
• docs/API_ENDPOINTS.md - API reference
• docs/ARCHITECTURE.md - System design

═══════════════════════════════════════════════

Ready to start Phase 1: Project Setup?

Options:
1. Yes - proceed with Phase 1 Next Action
2. Review first - I want to review planning docs
3. Adjust - I want to refine some phases

Your choice (1/2/3):
```

**Integration**: Reads PROJECT_BRIEF.md from /explore-idea (if exists)

---

### /wrap-session

**Purpose**: Automate end-of-session workflow

**When to Use**:
- ✅ Context window getting full
- ✅ Completing a phase
- ✅ Stopping work for now
- ✅ Hit a blocker and need to pause

**When to Skip**:
- ❌ Just started session (nothing to wrap)
- ❌ Context still has plenty of room

**What It Does**:

**Phase 1: Analyze Current State**
- Uses Task agent to analyze session
- Identifies what was accomplished
- Detects which phase you're in
- Determines stage (Implementation/Verification/Debugging)

**Phase 2: Update SESSION.md**
- Updates current phase progress
- Checks off completed tasks
- Updates "Current Stage" if changed
- Sets concrete "Next Action"
- Documents known issues (if any)
- Marks phase complete if done

**Phase 3: Detect Relevant Docs**
- Checks for related docs that may need updates:
  - CHANGELOG.md (if features completed)
  - ARCHITECTURE.md (if structure changed)
  - API_ENDPOINTS.md (if endpoints added)
  - DATABASE_SCHEMA.md (if schema changed)
- Updates detected docs automatically

**Phase 4: Create Git Checkpoint**
- Creates structured commit:
  ```
  checkpoint: Phase N [Status] - [Brief Description]

  Phase: N - [Name]
  Status: [Complete/In Progress/Paused]
  Session: [What was accomplished]

  Files Changed:
  - path/to/file.ts (what changed)

  Next: [Concrete next action]
  ```

**Phase 5: Output Handoff Summary**
- Formatted summary showing:
  - What was completed this session
  - Current phase and progress
  - Next Action (concrete step)
  - Verification criteria (if in Verification stage)
  - Known issues to address

**Phase 6: Optional Push to Remote**
- Asks if you want to push checkpoint
- If yes: `git push`

**Output**: Updated SESSION.md, git checkpoint commit, handoff summary

**Typical Duration**: 2-3 minutes (10-15 manual steps automated)

**Example Output**:

```
═══════════════════════════════════════════════
   SESSION WRAPPED
═══════════════════════════════════════════════

📝 PROGRESS THIS SESSION
───────────────────────────────────────────────

Phase 3: Firecrawl Integration (In Progress)

Completed:
✅ Set up Firecrawl API client
✅ Implemented scrape() method
✅ Added error handling for API failures

Remaining:
⬜ Add caching layer (R2)
⬜ Implement batch scraping
⬜ Add rate limiting

───────────────────────────────────────────────
CHECKPOINT CREATED
───────────────────────────────────────────────

Commit: abc1234
Message: checkpoint: Phase 3 In Progress - Firecrawl integration

Files Changed:
- src/lib/firecrawl.ts (API client)
- src/tools/scrape.ts (scrape tool)
- wrangler.toml (API key binding)

───────────────────────────────────────────────
NEXT SESSION
───────────────────────────────────────────────

📌 Next Action: Implement R2 caching layer for scraped content

File: src/lib/cache.ts (create)
Task: Set up R2 binding and implement get/set methods with TTL

Known Issues: None

───────────────────────────────────────────────
TO RESUME
───────────────────────────────────────────────

1. Compact or clear context: /compact or /clear
2. Load context: /continue-session
3. Continue from Next Action

═══════════════════════════════════════════════
```

**Integration**: Works with /continue-session to maintain session continuity

---

### /continue-session

**Purpose**: Automate start-of-session context loading

**When to Use**:
- ✅ Starting new session after /wrap-session
- ✅ After compacting or clearing context
- ✅ Returning to project after break

**When to Skip**:
- ❌ First session (nothing to resume)
- ❌ Already have context loaded

**What It Does**:

**Phase 1: Load Session Context**
- Uses Explore agent to load:
  - SESSION.md (current state)
  - IMPLEMENTATION_PHASES.md (full plan)
  - Other planning docs as needed

**Phase 2: Show Recent Git History**
- Displays last 5 commits
- Shows checkpoint progression
- Helps understand recent changes

**Phase 3: Display Session Summary**
- Formatted summary showing:
  - Current phase and stage
  - Progress checklist
  - Next Action (concrete step)
  - Key files for current phase
  - Known issues to address

**Phase 4: Show Verification Criteria** (if in Verification stage)
- Displays verification checklist from IMPLEMENTATION_PHASES.md
- Shows what needs to be tested
- Helps guide next actions

**Phase 5: Optional Open Next Action File**
- Asks if you want to open the file mentioned in Next Action
- If yes: Opens file at relevant line

**Phase 6: Ask Permission to Continue**
- Options:
  1. Continue with Next Action
  2. Adjust direction (different task)
  3. Review planning docs first

**Output**: Session summary, clear next steps

**Typical Duration**: 1-2 minutes (5-8 manual reads automated)

**Example Output**:

```
═══════════════════════════════════════════════
   SESSION RESUMED
═══════════════════════════════════════════════

📊 PROJECT STATUS
───────────────────────────────────────────────

Project: MCP Web Scraper
Current Phase: Phase 3 - Firecrawl Integration
Current Stage: Implementation
Last Checkpoint: abc1234 (2025-11-07)

───────────────────────────────────────────────
RECENT COMMITS (last 5)
───────────────────────────────────────────────

abc1234 checkpoint: Phase 3 In Progress - Firecrawl integration
def5678 checkpoint: Phase 2 Complete - MCP Server Base
ghi9012 checkpoint: Phase 1 Complete - Project Setup
jkl3456 Add project planning documentation
mno7890 Initial commit

───────────────────────────────────────────────
PHASE 3: FIRECRAWL INTEGRATION 🔄
───────────────────────────────────────────────

Type: Integration | Started: 2025-11-07
Spec: docs/IMPLEMENTATION_PHASES.md#phase-3

Progress:
✅ Set up Firecrawl API client
✅ Implemented scrape() method
✅ Added error handling for API failures
⬜ Add caching layer (R2) ← CURRENT
⬜ Implement batch scraping
⬜ Add rate limiting

───────────────────────────────────────────────
NEXT ACTION
───────────────────────────────────────────────

📌 Implement R2 caching layer for scraped content

File: src/lib/cache.ts (create)
Task: Set up R2 binding and implement get/set methods with TTL

───────────────────────────────────────────────
KEY FILES
───────────────────────────────────────────────

• src/lib/firecrawl.ts (API client)
• src/tools/scrape.ts (scrape tool)
• src/lib/cache.ts (to create)
• wrangler.toml (bindings)

Known Issues: None

═══════════════════════════════════════════════

Ready to continue with Next Action?

Options:
1. Yes - implement R2 caching layer
2. Different task - I want to work on something else
3. Review first - show me IMPLEMENTATION_PHASES.md

Your choice (1/2/3):
```

**Integration**: Loads context saved by /wrap-session

---

### /plan-feature

**Purpose**: Add feature to existing project by generating and integrating new phases

**When to Use**:
- ✅ Existing project with SESSION.md and IMPLEMENTATION_PHASES.md
- ✅ Want to add new functionality
- ✅ Clear feature requirements

**When to Skip**:
- ❌ New project (use /plan-project)
- ❌ Exploratory feature work (have conversation first)
- ❌ Major architectural change (might need /explore-idea → new repo)

**What It Does**:

**Phase 1: Verify Prerequisites**
- Checks SESSION.md exists
- Checks IMPLEMENTATION_PHASES.md exists
- If missing: Suggests running /plan-project first

**Phase 2: Check Current Phase Status**
- Reads SESSION.md to see current phase
- Warns if phase in progress (suggest wrapping first)
- Recommends: Finish current phase OR pause and plan feature

**Phase 3: Gather Feature Requirements**
- Asks 5 questions:
  1. What's the feature? (description)
  2. Why is it needed? (value proposition)
  3. What's the scope? (MVP vs full feature)
  4. Dependencies? (on existing code or external services)
  5. Acceptance criteria? (how to verify it works)

**Phase 4: Generate New Phases**
- Invokes project-planning skill with feature context
- Generates new phases (typically 1-3 phases per feature)
- Phases match project structure and standards

**Phase 5: Integrate into IMPLEMENTATION_PHASES.md**
- Handles phase renumbering automatically
- Inserts new phases at appropriate location
- Preserves existing phase structure
- Updates cross-references

**Phase 6: Update SESSION.md**
- Adds new pending phases
- Preserves current phase progress
- Updates with ⏸️ status

**Phase 7: Update Related Docs** (if needed)
- DATABASE_SCHEMA.md (if feature needs DB changes)
- API_ENDPOINTS.md (if feature adds endpoints)
- ARCHITECTURE.md (if feature changes structure)

**Phase 8: Create Git Commit**
- Structured commit:
  ```
  feature: Add [feature name] phases

  Generated N new phases for [feature description]

  Phases added:
  - Phase X: [Name]
  - Phase Y: [Name]

  Updated:
  - IMPLEMENTATION_PHASES.md (integrated new phases)
  - SESSION.md (added pending phases)
  - [other docs if applicable]

  Next: Complete current phase, then start Phase X
  ```

**Phase 9: Show Formatted Summary**
- Feature overview
- New phases added
- Updated docs
- Recommended next steps

**Output**: Updated IMPLEMENTATION_PHASES.md, updated SESSION.md, git commit

**Typical Duration**: 7-10 minutes (25-30 manual steps automated)

**Example Output**:

```
═══════════════════════════════════════════════
   FEATURE PLANNING COMPLETE
═══════════════════════════════════════════════

📦 FEATURE: Team Collaboration
───────────────────────────────────────────────

Description: Add ability for users to share tasks with team members
Scope: MVP - Basic sharing (view only), defer commenting/editing

───────────────────────────────────────────────
NEW PHASES ADDED
───────────────────────────────────────────────

Phase 7: Team Data Model (Database, 3 hours)
- Create teams and memberships tables
- Add foreign keys to tasks
- Migration scripts

Phase 8: Team API (API, 4 hours)
- POST /api/teams (create team)
- POST /api/teams/:id/members (invite)
- GET /api/teams/:id/tasks (view shared tasks)

Phase 9: Team UI (UI, 5 hours)
- Team creation modal
- Member invite form
- Shared tasks view

───────────────────────────────────────────────
DOCS UPDATED
───────────────────────────────────────────────

✅ IMPLEMENTATION_PHASES.md (3 new phases integrated)
✅ SESSION.md (added Phases 7-9 as pending)
✅ DATABASE_SCHEMA.md (teams tables documented)
✅ API_ENDPOINTS.md (team endpoints documented)

───────────────────────────────────────────────
CURRENT STATUS
───────────────────────────────────────────────

Current Phase: Phase 3 - Task UI (In Progress)

Recommendation: Complete Phase 3-6 first, then:
→ Start Phase 7: Team Data Model

Total Project: Now 9 phases (~38 hours estimated)

═══════════════════════════════════════════════

Git commit created: def5678

Ready to continue current phase? (y/n)
```

**Integration**: Works within existing /wrap-session → /continue-session cycle

---

## Decision Trees

### When Should I Use Which Command?

```
START HERE: What are you trying to do?
│
├─ I have a NEW PROJECT idea
│  │
│  ├─ Rough idea, not sure about approach → /explore-idea
│  │  └─ After exploration → /plan-project
│  │
│  └─ Clear requirements, know what I want → /plan-project
│
├─ I'm ADDING A FEATURE to existing project
│  │
│  ├─ Not sure how to approach feature
│  │  └─ Have conversation with Claude → Then /plan-feature
│  │
│  ├─ Clear feature requirements → /plan-feature
│  │
│  └─ Major architectural change (basically new project)
│     └─ /explore-idea → Decide: New repo OR /plan-feature
│
├─ I'm WORKING on a project
│  │
│  ├─ Context getting full → /wrap-session → /continue-session
│  │
│  ├─ Completed a phase → /wrap-session → /continue-session
│  │
│  └─ Need to stop for now → /wrap-session
│
└─ I'm RESUMING work on a project → /continue-session
```

### When Should I Wrap a Session?

```
Should I run /wrap-session?
│
├─ YES if:
│  ├─ Context window >80% full
│  ├─ Completed a phase (all tasks done)
│  ├─ Hit a blocker (need to research or get help)
│  ├─ Stopping work for the day
│  └─ Made significant progress worth checkpointing
│
└─ NO if:
   ├─ Just started the session
   ├─ Context still has plenty of room
   ├─ In the middle of a task (finish first)
   └─ About to fix a bug (fix it first, then wrap)
```

### Explore-Idea vs Plan-Project: Which Do I Need?

```
Do I know WHAT I want to build?
│
├─ NO (rough idea only) → /explore-idea
│  • Helps clarify what you actually want
│  • Researches approaches and alternatives
│  • May discover you don't need to build it
│
└─ YES
   │
   Do I know HOW to build it?
   │
   ├─ NO (unsure about tech stack, approach) → /explore-idea
   │  • Validates your tech choices
   │  • Finds examples and patterns
   │  • Identifies potential issues early
   │
   └─ YES (validated stack and approach) → /plan-project
      • Skip exploration, go straight to structured planning
```

### Explore-Idea vs Conversational Exploration for Features?

```
I want to add a feature to my existing project.
│
├─ Small to medium feature
│  │
│  ├─ Not sure how to approach
│  │  └─ Just ASK Claude conversationally
│  │     • "Should I use WebSockets or Durable Objects?"
│  │     • Claude researches and presents options
│  │     • Then → /plan-feature
│  │
│  └─ Clear how to approach → /plan-feature directly
│
└─ Large/architectural change
   │
   └─ /explore-idea
      • Might need new repo
      • OR massive refactor → /plan-feature with big phases
```

---

## Real-World Examples

### Example 1: MCP Web Scraper (Full Workflow)

**Context**: Building MCP server for web scraping on Cloudflare Workers

**Session 1: Exploration**

```
You: "I want to build an MCP server that scrapes websites using Cloudflare Workers"

[Run /explore-idea]

Claude: [Researches MCP patterns, Cloudflare Workers compatibility, scraping approaches]
Claude: [Finds Firecrawl API as simpler alternative to custom scraping]
Claude: [Creates PROJECT_BRIEF.md with validated approach]
Claude: [Recommends: Proceed]

You: "Yes, let's proceed"

[Run /plan-project]

Claude: [Reads PROJECT_BRIEF.md]
Claude: [Generates IMPLEMENTATION_PHASES.md with 6 phases]
Claude: [Creates SESSION.md with Phase 1 as current]

Output:
- docs/IMPLEMENTATION_PHASES.md (6 phases, ~25 hours)
- SESSION.md
- docs/API_ENDPOINTS.md
- docs/ARCHITECTURE.md

You: "Yes, start Phase 1"

[Work on Phase 1: Project Setup]
- Initialize Cloudflare Worker
- Install dependencies
- Configure Wrangler

Context getting full...

[Run /wrap-session]

Claude: [Updates SESSION.md: Phase 1 complete]
Claude: [Creates git checkpoint]
Claude: [Sets Next Action: "Start Phase 2 - Create MCP server base"]
```

**Session 2: Continue Phase 2**

```
[Clear context, run /continue-session]

Claude: [Loads SESSION.md, IMPLEMENTATION_PHASES.md]
Claude: [Shows: Phase 1 complete, Phase 2 current]
Claude: [Next Action: "Implement MCP server class in src/server.ts"]

You: "Yes, continue"

[Work on Phase 2: MCP Server Base]
- Create server class
- Implement tool registry
- Add request/response handling

Phase 2 complete!

[Run /wrap-session]

Claude: [Updates SESSION.md: Phase 2 complete]
Claude: [Next Action: "Start Phase 3 - Integrate Firecrawl"]
```

**Session 3: Add Caching Feature**

```
[Run /continue-session]

You: "Before Phase 3, I want to add caching with R2"

[Run /plan-feature]

Claude: [Asks 5 questions about caching feature]
You: [Answers: Cache scraped content in R2 with TTL, reduce API calls]

Claude: [Generates 2 new phases]
Claude: [Inserts as Phase 4-5, renumbers existing phases]
Claude: [Updates SESSION.md with new pending phases]

Output:
- IMPLEMENTATION_PHASES.md (now 8 phases, old Phase 4 is now Phase 6)
- SESSION.md (Phases 4-5 added as pending)

You: "Continue with Phase 3 as planned"

[Work continues...]
```

**Total Sessions**: 5-6 sessions, ~2-3 wrap/resume cycles
**Total Time**: ~25 hours of implementation (~25 min human time)
**Time Saved**: ~30-40 minutes on planning and session management

---

### Example 2: Task Manager (Quick Workflow)

**Context**: Simple task manager, clear requirements

**Session 1: Planning and Start**

```
You: "I want to build a task manager with Cloudflare Workers, D1 database, and React frontend"

[Run /plan-project]

Claude: [Asks clarifying questions]
You: [Answers: Basic auth with D1, CRUD tasks, no teams yet]

Claude: [Generates IMPLEMENTATION_PHASES.md with 5 phases]
Claude: [Creates SESSION.md]

Output:
- docs/IMPLEMENTATION_PHASES.md (5 phases, ~18 hours)
- SESSION.md
- docs/DATABASE_SCHEMA.md
- docs/API_ENDPOINTS.md

You: "Yes, start Phase 1"

[Work on Phase 1: Setup + Phase 2: Database]
[Both small phases, done in one session]

[Run /wrap-session]

Claude: [Updates: Phases 1-2 complete, Next: Phase 3 - Tasks API]
```

**Session 2: Tasks API**

```
[Run /continue-session]

You: "Continue"

[Work on Phase 3: Tasks API]
- GET /api/tasks
- POST /api/tasks
- PATCH /api/tasks/:id
- DELETE /api/tasks/:id

Context full...

[Run /wrap-session]

Claude: [Updates: Phase 3 in progress (GET/POST done, PATCH/DELETE remain)]
Claude: [Next Action: "Implement PATCH /api/tasks/:id"]
```

**Session 3: Finish API + Start UI**

```
[Run /continue-session]

You: "Continue"

[Finish Phase 3, start Phase 4: Task UI]

[Run /wrap-session]

[Continue...]
```

**Total Sessions**: 3-4 sessions
**Total Time**: ~18 hours implementation (~18 min human time)
**Time Saved**: ~20 minutes on planning and session management

---

### Example 3: Adding Team Feature (Feature Addition)

**Context**: Task manager running, want to add team collaboration

**Session: Feature Planning**

```
You: "I want to add team collaboration to my task manager"

[Conversational exploration first]

You: "Should I use Durable Objects for real-time sync or just REST API?"

Claude: [Researches approaches]
Claude: "For MVP, REST API is simpler. Durable Objects add complexity
unless you need real-time. Recommend: Start with REST, add DO later
if needed."

You: "OK, REST API for MVP"

[Run /plan-feature]

Claude: [Asks 5 questions]
You: [Answers: Team sharing, view-only access, no commenting yet]

Claude: [Generates 3 new phases]
Claude: [Integrates into IMPLEMENTATION_PHASES.md]
Claude: [Updates SESSION.md]

Output:
- IMPLEMENTATION_PHASES.md (now 8 phases, team phases inserted)
- SESSION.md (Phases 6-8 added as pending)
- DATABASE_SCHEMA.md (teams tables documented)
- API_ENDPOINTS.md (team endpoints documented)

Claude: "Recommendation: Complete current Phase 4 (Task UI),
then start Phase 6 (Team Data Model)"

[Continue work with wrap/resume cycle...]
```

**Total Time for Feature Planning**: ~7-10 minutes (vs 20-30 manually)

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "I ran /plan-project but it didn't create SESSION.md"

**Possible Causes**:
- IMPLEMENTATION_PHASES.md wasn't created (planning failed)
- Permission error writing to project root

**Solution**:
1. Check if docs/IMPLEMENTATION_PHASES.md exists: `ls docs/IMPLEMENTATION_PHASES.md`
2. If missing: Planning skill may have failed, check for errors
3. If exists: Try manually creating SESSION.md template
4. Re-run /plan-project after fixing issue

---

#### Issue: "Context is full but I'm mid-task, should I wrap now?"

**Recommendation**:
- **Finish the current task first** (commit the code)
- Then run /wrap-session
- Reason: Wrapping mid-task creates unclear "Next Action"

**Bad Next Action**: "Continue working on authentication" (vague)
**Good Next Action**: "Implement login endpoint in src/auth.ts:45" (concrete)

---

#### Issue: "/continue-session shows wrong 'Next Action'"

**Possible Causes**:
- SESSION.md wasn't updated in last /wrap-session
- You manually changed code without updating SESSION.md

**Solution**:
1. Manually update SESSION.md:
   - Fix "Next Action" to reflect actual next step
   - Update progress checklist
2. Future: Always run /wrap-session before clearing context

---

#### Issue: "I used /plan-feature but phases got renumbered weirdly"

**Possible Causes**:
- Command inserted phases in wrong location
- Manual edits to IMPLEMENTATION_PHASES.md conflicted

**Solution**:
1. Check git diff to see what changed: `git diff docs/IMPLEMENTATION_PHASES.md`
2. If incorrect: Manually adjust phase numbers
3. Update SESSION.md to reflect new phase numbers
4. Create checkpoint: `git add . && git commit -m "fix: Correct phase numbering"`

---

#### Issue: "Should I use /explore-idea for this feature or just add it?"

**Decision Tree**:

Feature is **small/medium** + you know how to build it:
→ Skip exploration, use /plan-feature directly

Feature is **large/architectural** OR you're unsure about approach:
→ Have conversation with Claude first (research approaches)
→ Then /plan-feature

Feature is SO large it's basically a new project:
→ Use /explore-idea
→ Decide: New repo (/plan-project) OR massive refactor (/plan-feature)

**Example**:
- "Add dark mode toggle" → /plan-feature directly
- "Add real-time collaboration" → Conversation → /plan-feature
- "Turn single-user app into multi-tenant SaaS" → /explore-idea

---

#### Issue: "I'm in Phase 5 but realized Phase 2 has a bug"

**Recommendation**:
1. **Pause Phase 5**: Update SESSION.md status to "Paused"
2. **Create bug fix task**: Add to Phase 5 or create new "Bug Fix" phase
3. **Fix the bug**: Work on Phase 2 code
4. **Document in SESSION.md**:
   ```markdown
   ## Phase 5: Current Work ⏸️ (Paused)
   Paused to fix Phase 2 bug: [description]

   ## Bug Fix: Phase 2 Auth Issue 🔄
   **Issue**: Login endpoint returns 500 on invalid password
   **Fix**: Add proper error handling in src/auth.ts:67
   ```
5. **Run /wrap-session** after bug fix
6. **Resume Phase 5** in next session

**Don't**: Ignore the bug and keep going (technical debt accumulates)

---

#### Issue: "PROJECT_BRIEF.md from /explore-idea is too detailed, do I need it all?"

**Answer**: No! PROJECT_BRIEF.md is a **decision artifact**, not requirements doc.

**What to keep**:
- ✅ Core functionality (MVP)
- ✅ Validated tech stack
- ✅ Known challenges
- ✅ Out-of-scope items (prevents feature creep)

**What you can skip**:
- ❌ Similar solutions reviewed (just reference notes)
- ❌ Extensive research findings (can archive)

**Action**:
- Move PROJECT_BRIEF.md to planning/archive/ after running /plan-project
- Keep only as reference, IMPLEMENTATION_PHASES.md is your active guide

---

#### Issue: "Can I edit IMPLEMENTATION_PHASES.md manually?"

**Answer**: Yes! The planning docs are **yours to edit**.

**Safe to change**:
- ✅ Task descriptions (make them clearer)
- ✅ Estimated hours (adjust based on reality)
- ✅ Verification criteria (add/remove checks)
- ✅ Phase names (rename for clarity)

**Be careful changing**:
- ⚠️ Phase numbers (update SESSION.md if you renumber)
- ⚠️ Phase structure (don't delete phases that are in progress)

**Best practice**:
- Edit planning docs as you learn
- Keep SESSION.md in sync
- Commit changes: `git commit -m "docs: Update Phase 3 tasks based on implementation"`

---

## Time Savings

### Measured Time Savings per Command

| Scenario | Manual Time | With Command | Savings | Savings % |
|----------|-------------|--------------|---------|-----------|
| Explore project idea | 20-30 min | 10-15 min | 10-15 min | 50% |
| Plan new project | 15-25 min | 5-7 min | 10-18 min | 67% |
| Wrap session | 5-8 min | 2-3 min | 3-5 min | 60% |
| Resume session | 3-5 min | 1-2 min | 2-3 min | 60% |
| Plan feature addition | 15-20 min | 7-10 min | 8-10 min | 50% |

**Total per project lifecycle**: 25-40 minutes saved

**Per 5-phase project with 3 sessions**:
- Planning: ~12 min saved (explore + plan)
- Session management: ~15 min saved (3x wrap + 3x resume)
- Feature additions: ~8 min saved (1x plan-feature)
- **Total**: ~35 minutes saved

---

### Hidden Time Savings

**Error Prevention**:
- ❌ Starting project without clear plan → Rebuilding later (30-60 min)
- ❌ Losing context between sessions → Re-reading code (10-15 min per session)
- ❌ Over-scoping project → Building unused features (hours wasted)
- ❌ Missing phase verification → Bugs in production (30+ min debugging)

**With Workflow**:
- ✅ Clear plan from start → No rebuilding
- ✅ SESSION.md preserves context → Instant resume
- ✅ Exploration phase prevents scope creep → Only build what's needed
- ✅ Verification built into phases → Catch bugs early

**Estimated hidden savings**: 1-2 hours per project

---

### Total Value Proposition

**Time Investment**:
- Learning workflow: ~30 minutes (reading this guide)
- Installing commands: ~2 minutes

**Time Return** (per project):
- Direct savings: ~35 minutes
- Hidden savings: ~60-120 minutes
- **Total**: ~95-155 minutes per project

**ROI**: 30 min investment → 95-155 min return = 3-5x return

**Over 10 projects**: 30 min investment → 15-25 hours saved

---

## Comparison to Manual Workflow

### Manual Workflow (Before Commands)

**Starting New Project**:
1. Have idea (10 min thinking)
2. Research approaches (15-30 min web search, reading docs)
3. Manually create planning docs (10-20 min writing)
4. Set up project structure (5-10 min)
5. Start coding
6. Realize you over-scoped → Rebuild (30-60 min wasted)

**Total**: ~70-130 minutes, high error rate

---

**Managing Sessions**:
1. Context fills up mid-task
2. Try to remember where you were (2-5 min)
3. Manually note progress in some doc (3-5 min)
4. Create git commit (2-3 min)
5. Clear context
6. Next session: Re-read code to remember (10-15 min)
7. Find where you left off (5 min)
8. Resume work

**Total per session cycle**: ~22-33 minutes, frequent context loss

---

**Adding Features**:
1. Decide to add feature
2. Manually plan how to integrate (10-15 min)
3. Update planning docs (5-10 min, if you remember)
4. Start coding
5. Realize you forgot to update SESSION.md → Out of sync

**Total**: ~15-25 minutes, docs often outdated

---

### Automated Workflow (With Commands)

**Starting New Project**:
1. /explore-idea → Research done for you (10-15 min automated)
2. PROJECT_BRIEF.md created with validated approach
3. /plan-project → Planning docs generated (5-7 min automated)
4. SESSION.md created automatically
5. Start coding with clear roadmap

**Total**: ~15-22 minutes, zero manual planning, low error rate

---

**Managing Sessions**:
1. Context fills up
2. /wrap-session → Auto-updates SESSION.md, git commit (2-3 min)
3. Clear context
4. /continue-session → Auto-loads context, shows Next Action (1-2 min)
5. Resume work immediately

**Total per session cycle**: ~3-5 minutes, zero context loss

---

**Adding Features**:
1. /plan-feature → Asks questions, generates phases (7-10 min)
2. Phases integrated automatically
3. SESSION.md updated automatically
4. Start coding with clear plan

**Total**: ~7-10 minutes, docs always in sync

---

### Side-by-Side Comparison

| Task | Manual | Automated | Savings |
|------|--------|-----------|---------|
| Start project | 70-130 min | 15-22 min | 55-108 min |
| Session cycle (×3) | 66-99 min | 9-15 min | 57-84 min |
| Add feature | 15-25 min | 7-10 min | 8-15 min |
| **Total** | **151-254 min** | **31-47 min** | **120-207 min** |

**Savings**: 2-3.5 hours per typical 5-phase project

**And**: Lower error rate, better documentation, zero context loss

---

## Getting Started

### Quick Start (5 Minutes)

1. **Install commands** (~1 min):
   ```bash
   cd /path/to/claude-skills
   cp commands/*.md ~/.claude/commands/
   ```

2. **Start new project** (~2 min):
   - If clear requirements: Run `/plan-project`
   - If exploring idea: Run `/explore-idea`

3. **Work through phases** (~varies):
   - Execute tasks from SESSION.md
   - When context full: Run `/wrap-session`

4. **Resume work** (~1 min):
   - Clear context
   - Run `/continue-session`

**That's it!** The workflow guides you from there.

---

### Best Practices

**For Planning**:
- ✅ Use /explore-idea when uncertain about approach
- ✅ Let project-planning skill do the heavy lifting
- ✅ Trust the generated phases, adjust as you learn
- ✅ Keep planning docs updated (edit as needed)

**For Session Management**:
- ✅ Run /wrap-session BEFORE context is 100% full (aim for 80%)
- ✅ Always set concrete "Next Action" (file + line + task)
- ✅ Commit working code, not broken code
- ✅ Run /wrap-session even if phase incomplete (checkpoint progress)

**For Feature Addition**:
- ✅ Finish current phase before planning new feature (or pause it)
- ✅ Have conversation if uncertain, then formalize with /plan-feature
- ✅ Update all related docs (database, API, architecture)

**General**:
- ✅ SESSION.md is your bookmark, IMPLEMENTATION_PHASES.md is your map
- ✅ Git checkpoints are safety net (commit often)
- ✅ Documentation drives workflow (keep docs current)
- ✅ Adjust planning as you learn (plans can change)

---

## Advanced Tips

### Tip 1: Parallel Feature Planning

**Scenario**: Want to plan multiple features at once

**Approach**:
1. Run /plan-feature for Feature A
2. DON'T start implementing yet
3. Run /plan-feature for Feature B
4. Run /plan-feature for Feature C
5. Review all new phases in IMPLEMENTATION_PHASES.md
6. Reorder if needed (dependencies)
7. THEN start implementing

**Benefit**: Plan related features together, see dependencies, optimize order

---

### Tip 2: Checkpoint Frequently

**When to checkpoint** (run /wrap-session):
- ✅ After completing major task (even if phase incomplete)
- ✅ Before attempting risky refactor
- ✅ When switching between unrelated work
- ✅ Before stepping away for break

**Why**: Git checkpoints are restore points. Better to have too many than too few.

---

### Tip 3: Use Verification Stage

**When phase is "done"**, don't just mark complete:

1. Update SESSION.md stage to "Verification"
2. Copy verification criteria from IMPLEMENTATION_PHASES.md
3. Test each criterion systematically
4. Document results in SESSION.md
5. If issues found: Switch stage to "Debugging"
6. When all verified: Mark phase complete

**Benefit**: Catch bugs early, ensure quality, prevent regression

---

### Tip 4: Archive Completed Phases

**After phase complete** and moved to next phase:

SESSION.md collapses completed phases:
```markdown
## Phase 1: Setup ✅
**Completed**: 2025-11-07 | **Checkpoint**: abc1234

## Phase 2: Database ✅
**Completed**: 2025-11-08 | **Checkpoint**: def5678

## Phase 3: API 🔄 ← CURRENT
[Full details here]

## Phase 4: UI ⏸️
## Phase 5: Testing ⏸️
```

**For very long projects** (10+ phases), move completed phases to archive:

Create planning/archive/SESSION_PHASES_1-5.md with full completed phase details

Keep SESSION.md focused on current and upcoming work

---

### Tip 5: Customize Planning Docs

**IMPLEMENTATION_PHASES.md is not sacred**. Customize it!

**Add sections**:
- Performance requirements
- Security considerations
- Accessibility checklist
- Deployment steps

**Adjust structure**:
- Combine small phases
- Split large phases
- Reorder based on dependencies

**Keep SESSION.md in sync** with changes!

---

## Summary

The Claude Skills Workflow provides:

✅ **Exploration Before Commitment** (/explore-idea)
✅ **Automated Planning** (/plan-project)
✅ **Session Continuity** (/wrap-session → /continue-session)
✅ **Feature Integration** (/plan-feature)

**Benefits**:
- 25-40 minutes saved per project lifecycle
- Zero context loss between sessions
- Clear roadmap from idea to deployment
- Prevents scope creep and over-engineering
- Integrated git checkpointing

**Getting Started**:
1. Install 5 commands (~1 min)
2. Run /explore-idea or /plan-project (~10-15 min)
3. Work → Wrap → Resume cycle

**For questions or issues**: See [commands/README.md](../commands/README.md) or ask Claude Code!

---

**Next**: Ready to start your first project with this workflow? Run `/explore-idea` or `/plan-project`!

