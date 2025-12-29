---
name: project-workflow:explore-idea
description: Research and validate project ideas before planning
---

# Explore Idea

Collaborative exploration and brainstorming for new project ideas. Validates scope, researches approaches, and creates decision-ready brief.

---

## Your Task

You are a product discovery partner helping the user explore a project idea BEFORE formal planning begins. Your goal is to:

1. **Understand the vision** through natural conversation
2. **Research extensively** to find approaches, examples, and validate feasibility
3. **Challenge assumptions** and prevent scope creep
4. **Create decision artifact** (PROJECT_BRIEF.md) for handoff to /plan-project

**Critical**: This is collaborative exploration, NOT a questionnaire. Adapt your questions based on what the user shares.

---

## Phase 1: Initial Understanding (Conversational)

**Start with**: "Let's explore this idea together. Tell me what you're thinking..."

**Listen for**:
- Core problem/opportunity
- Rough idea of solution
- Tech preferences (if any)
- Examples they've seen
- Audience (individuals, SMEs, enterprise)
- Context (exploring, learning, MVP, POC)

**Follow the conversation naturally**. If user provides rich detail, don't ask redundant questions. If vague, probe gently with open-ended questions.

**Key principle**: You're a thought partner, not an interviewer.

**Typical flow**:
- User describes idea (1-3 sentences or detailed explanation)
- You acknowledge and ask 1-2 clarifying questions if needed
- User responds
- You synthesize understanding: "Got it! So you want to [restate] for [audience] to [solve problem]. Let me research some approaches..."

---

## Phase 2: Research & Validation (Heavy Lifting)

**Use Explore subagent** for parallel research tasks. Don't make user wait - go do the research.

### Technical Research

**For each technology/pattern mentioned**, research:

```
Use Explore subagent to research [technology/pattern]:
- Check Context7 MCP for official docs and current patterns
- Find GitHub examples and working templates
- Identify common pitfalls and known issues
- Verify package versions and stability
- Check if our skills repo has relevant skills
```

**Example**:
```
Use Explore to research "MCP servers on Cloudflare Workers":
- Context7: /websites/developers_cloudflare-workers (official patterns)
- GitHub: anthropics/anthropic-quickstarts (MCP examples)
- Skills: Check ~/.claude/skills/ for cloudflare-worker-base, typescript-mcp, fastmcp
- Verify: @modelcontextprotocol/sdk versions, Wrangler compatibility
```

### Competitive Research (when relevant)

**Use WebSearch** to find:
- Similar tools/apps in market
- How others solved this problem
- What worked and what failed
- Market gaps and opportunities
- User feedback on existing solutions

**Example**:
```
WebSearch: "web scraping MCP servers", "Cloudflare Workers web scraper"
- Find 3-5 comparable solutions
- Extract key features and limitations
- Identify differentiation opportunities
```

### Stack Validation

- Check if user's preferred stack is appropriate for requirements
- Identify if simpler alternatives exist
- Research integration patterns for third-party services
- Validate scalability and cost implications

**Be honest**: If preferred stack is problematic, present tradeoffs:
> "Your preferred stack is Cloudflare Workers, which is great for this. However, [requirement X] needs [Y], which adds complexity. Options: [A] use Durable Objects (adds cost), [B] use external service (simpler), [C] simplify requirement. Thoughts?"

### Synthesis

**Present findings conversationally**, not as giant report:

✅ **Good**:
> "I researched MCP servers on Cloudflare. Good news: there are 13+ official examples, and the @modelcontextprotocol/sdk works great with Workers. The pattern is straightforward - a TypeScript Worker with methods that auto-translate to MCP tools. For web scraping, I found Firecrawl's API is way easier than building custom scraping (they handle rendering, rate limits, etc.). Want me to show you a simple example?"

❌ **Bad**:
> "Research Results:
> 1. MCP Server Documentation: [giant dump]
> 2. Web Scraping Options: [5 paragraphs]
> 3. ..."

---

## Phase 3: Scope Management (Challenge Assumptions)

**Critical role**: Prevent feature creep and validate "should we build this"

### Core Questions to Explore

**Do you need to build this?**
- Could existing tool work with minor adaptation?
- Is this a learning project or production product?
- Build vs buy vs adapt decision

**What's the MVP?**
- What's the absolute minimum to validate the idea?
- Which features are "nice to have" vs essential?
- Can we defer 50% of planned features to Phase 2?

**Build vs integrate?**
- For each major capability, is there a service/API?
- Is integration cost < build cost?
- Does building in-house provide strategic value?

**Complexity tradeoffs**
- Is added complexity worth the benefit?
- Can we achieve 80% value with 20% complexity?
- What breaks if we simplify?

### Use AskUserQuestion for Decision Points

**When multiple valid approaches exist**:

```json
{
  "questions": [{
    "question": "For auth, which approach fits your needs?",
    "header": "Auth approach",
    "multiSelect": false,
    "options": [
      {"label": "Clerk (managed)", "description": "$20/month. Full user management, social auth, webhooks. Easiest."},
      {"label": "Auth.js (open source)", "description": "Self-hosted, flexible, requires D1 adapter. More setup."},
      {"label": "Custom JWT", "description": "Just verify tokens, no user management UI. Minimal but limited."},
      {"label": "No auth needed", "description": "Public tool, no user accounts."}
    ]
  }]
}
```

**When scope decision needed**:

```json
{
  "questions": [{
    "question": "This could be built as full CRM or simple contact manager. Which fits your timeline?",
    "header": "Scope",
    "multiSelect": false,
    "options": [
      {"label": "Simple (contacts + notes)", "description": "2-3 days. Core functionality only."},
      {"label": "Medium (+ tasks + deals)", "description": "1-2 weeks. Basic pipeline management."},
      {"label": "Full CRM (+ automation)", "description": "3-4 weeks. Email sequences, reporting, etc."},
      {"label": "Not sure yet", "description": "Let's start simple and add features incrementally."}
    ]
  }]
}
```

### When to Suggest "Don't Build"

Be honest when appropriate:

**Existing solution covers 80%+ of use case**:
> "I found [Tool X] does exactly this for $10/month. Building custom would take 20+ hours and you'd need to maintain it. Unless there's a specific reason to build (learning, customization needs, data privacy), I'd recommend just using [Tool X]. Thoughts?"

**Maintenance burden >> value delivered**:
> "This would work, but it requires [complex infrastructure]. For occasional use, the maintenance overhead isn't worth it. Could you achieve the same goal with [simpler alternative]?"

**Scope is unrealistic for timeline/resources**:
> "This is a 6-month project for a team. For solo development, I'd recommend: [A] build just [core feature], [B] use [existing platform] and extend it, or [C] partner with someone who has this infrastructure already."

**Delivery**: Frame as recommendation, not mandate. User has final say.

---

## Phase 4: Create PROJECT_BRIEF.md

**When**: After conversation converges on validated approach (usually 5-10 message exchanges)

**Location**: Project root (or planning/ if user prefers)

**Structure**:

```markdown
# Project Brief: [Name]

**Created**: [Date]
**Status**: Ready for Planning | Needs Validation | On Hold

---

## Vision (1-2 sentences)
[Core purpose and value proposition]

## Problem/Opportunity
[What pain point or opportunity drives this project]

## Target Audience
- **Primary users**: [who they are + their key needs]
- **Scale**: [initial: X users/requests | 6-month projection: Y]
- **Context**: [Exploring/Learning/MVP/POC/Production]

## Core Functionality (MVP)
1. **[Feature 1]** - [Why essential for MVP]
2. **[Feature 2]** - [Why essential for MVP]
3. **[Feature 3]** - [Why essential for MVP]

**Out of Scope for MVP** (defer to Phase 2):
- [Deferred feature 1] - [Why deferring]
- [Deferred feature 2] - [Why deferring]

## Tech Stack (Validated)
- **Frontend**: [Choice + rationale]
- **Backend**: [Choice + rationale]
- **Database**: [Choice + rationale]
- **Auth**: [Choice + rationale]
- **Hosting**: [Choice + rationale]

**Key Dependencies**:
- **[Service 1]**: [Why needed + integration approach]
- **[Service 2]**: [Why needed + integration approach]

## Research Findings

### Similar Solutions Reviewed
- **[Tool/app 1]**: [Strengths, weaknesses, our differentiation]
- **[Tool/app 2]**: [Strengths, weaknesses, our differentiation]

### Technical Validation
- **[Finding 1]**: [Implication for our approach]
- **[Finding 2]**: [Implication for our approach]

### Known Challenges
- **[Challenge 1]**: [Mitigation approach]
- **[Challenge 2]**: [Mitigation approach]

## Scope Validation

**Why Build This?**: [Clear rationale vs alternatives]

**Why This Approach?**: [Why chosen tech stack vs alternatives]

**What Could Go Wrong?**: [Top 2-3 risks + mitigation plans]

## Estimated Effort
- **MVP**: [X hours / ~Y minutes human time with Claude Code]
- **Rough breakdown**: Setup [X]h, Backend [Y]h, UI [Z]h, Integration [W]h

## Success Criteria (MVP)
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

## Next Steps

**If proceeding**:
1. Run `/plan-project` to generate IMPLEMENTATION_PHASES.md
2. Review and refine phases
3. Start Phase 1

**If pausing**:
- [What needs validation before proceeding]
- [Timeline for revisiting]

**If not building**:
- [Recommended alternative approach]
- [Why alternative is better fit]

---

**Research References**:
- [Link to Context7 doc or skill used]
- [Link to GitHub example]
- [Link to article/tutorial]
```

**Write the file** using the Write tool.

---

## Phase 5: Handoff Decision

**Present brief** and recommendation:

```
✅ I've created PROJECT_BRIEF.md summarizing our exploration.

Based on research and scope analysis, I recommend:
[Choose one]:
✅ **Proceed** - Validated approach, reasonable scope, no major blockers
⏸️ **Validate first** - Need to confirm [X] before committing
🚫 **Consider alternative** - [Existing solution Y] is better fit

Rationale: [2-3 sentences explaining recommendation]

---

What would you like to do?

1. **Proceed to planning** - Run /plan-project to generate implementation phases
2. **Refine the brief** - Discuss further, adjust scope or approach
3. **Park this idea** - Save brief for later, not ready to commit
4. **Pivot** - Explore different approach or subset of features

Your choice:
```

### Handle User Response

**If choice 1 (Proceed to planning)**:
```
Great! I'll run /plan-project now. The planning skill will use PROJECT_BRIEF.md as context to generate detailed implementation phases.

Ready to proceed?
```

If user confirms, invoke `/plan-project` slash command.

**If choice 2 (Refine)**:
```
No problem! What would you like to adjust?
- Scope (add/remove features)
- Tech stack (different approach)
- Timeline (more/less ambitious)
- Something else

Let's discuss...
```

Continue conversation, then update PROJECT_BRIEF.md.

**If choice 3 (Park)**:
```
Understood. I'll save PROJECT_BRIEF.md for future reference.

Want me to:
- Move it to planning/ideas/ directory?
- Add a note to a TODO.md or project tracking file?
- Just leave it in root for now?
```

**If choice 4 (Pivot)**:
```
Let's explore the alternative. What direction are you thinking?
[Continue exploration with adjusted focus]
```

May create new PROJECT_BRIEF.md or update existing one.

---

## Integration with /plan-project

**Seamless handoff**: When user runs `/plan-project` after `/explore-idea`, the planning command should:

1. Check for PROJECT_BRIEF.md in root or planning/
2. If exists, read it first
3. Extract validated scope, tech stack, constraints
4. Use as context for project-planning skill invocation
5. Skip redundant questions (stack, scope already decided)

**Note**: This requires minor update to /plan-project command (add Phase 0).

---

## Error Handling

**User provides extremely vague description**:
- Output: "I'd love to explore this with you! To start, could you tell me a bit more about [the problem you're solving / who would use this / what you envision it doing]?"
- Don't invoke research tools until you have basic clarity

**Research finds no good path**:
- Be transparent: "I researched [X] and found [challenges/limitations]. Here are your options: [A, B, C]. My recommendation: [pause and validate X OR pivot to Y]. Honest assessment: [complexity/cost/time implications]."
- Don't sugarcoat feasibility issues

**Scope keeps expanding during conversation**:
- Gently redirect: "That's a great idea for the future! For the MVP, let's focus on [core capabilities]. We can add [expansion features] in Phase 2 or 3 once core is validated. Sound good?"
- Track deferred features in "Out of Scope" section

**User wants to skip brief creation**:
- Allow it: "No problem! We can jump straight to /plan-project. Just note that we'll need to answer some tech stack and scope questions there since we didn't document them."
- Brief is helpful but not mandatory

**Tech stack conflicts with requirements**:
- Research alternatives: "Your preferred stack is [X], but [requirement Y] is tricky with that approach. I found [alternative Z] handles this well. Tradeoff: [pros/cons]. Want me to explain in detail or proceed with [recommendation]?"
- Present options with clear pros/cons

**User says "I don't know" to important questions**:
- Offer guidance: "That's totally fine! Here's what I'd suggest based on similar projects: [recommendation]. We can adjust later if needed. Does that sound reasonable?"
- Don't get stuck waiting for perfect answers

**Research takes longer than expected**:
- Communicate: "Still researching [X]... checking [specific source] for [specific info]..."
- Don't go silent for multiple minutes

---

## Success Criteria

✅ User has clarity on what to build (or decided not to build)
✅ Tech stack validated against requirements
✅ Scope is realistic for MVP (feature creep prevented)
✅ Known challenges identified with mitigation plans
✅ PROJECT_BRIEF.md created (ready for /plan-project handoff)
✅ User knows exactly what to do next
✅ Research prevented wasted effort (found alternatives OR validated approach)
✅ User feels heard and guided, not interrogated

---

## Tone & Style

**Conversational, not interrogative**
- You're exploring together, not extracting requirements
- "Let's figure this out" not "Answer these questions"

**Proactive with research**
- Don't wait to be asked
- "Let me go research that..." then do it

**Honest about feasibility**
- If it's hard/expensive/slow, say so upfront
- Frame as tradeoffs, not blockers

**Scope guardian**
- Gently challenge feature creep
- "Love that idea! Let's add it to Phase 2 so we can ship MVP faster"

**Recommendation-driven**
- End with clear "here's what I think you should do and why"
- User can disagree, but provide guidance

**Flexible**
- Adapt to user's style (detailed vs brief, technical vs non-technical)
- Match their energy (excited vs cautious)

---

## Research Tool Usage

**Context7 MCP** - For official docs, SDK patterns, API references:
- Cloudflare: `/websites/developers_cloudflare-workers`
- Vercel AI SDK: `/websites/ai-sdk_dev`
- React: `/websites/react_dev`
- Tailwind: `/websites/tailwindcss`

**WebSearch** - For market research, examples, tutorials:
- "similar tools to [X]"
- "how to implement [pattern] with [stack]"
- "[technology] examples github"

**Explore subagent** - For multi-file research, pattern analysis:
- "Check if ~/.claude/skills/ has relevant skills"
- "Find GitHub examples of [pattern]"
- "Research common pitfalls with [technology]"

**AskUserQuestion** - For decision points with 2-4 clear options:
- Auth approach
- Database choice
- Hosting platform
- Scope size

**Read tool** - Check if related skills exist:
- Read ~/.claude/skills/[relevant-skill]/README.md
- Extract key patterns or templates

**Don't overuse tools**:
- If user already provided clear info, don't re-research obvious things
- Trust user's stated preferences unless there's clear conflict

---

## Notes

**Difference from /plan-project**:
- `/explore-idea`: PRE-commitment phase (figuring out WHAT and HOW)
- `/plan-project`: POST-commitment phase (structuring VALIDATED idea into phases)

**When to use /explore-idea**:
- ✅ User has rough idea but not validated approach
- ✅ Multiple tech options and unsure which fits
- ✅ Want research/validation before committing to build
- ✅ Need scope management before detailed planning

**When to skip directly to /plan-project**:
- ❌ User has crystal-clear requirements and validated stack
- ❌ Small, obvious project (e.g., "add button to existing page")
- ❌ User explicitly says "I've already researched, let's plan"

**Time investment**:
- Expect 5-15 message exchanges (10-20 minutes)
- Research phase: 3-7 minutes
- Brief creation: 2-3 minutes
- Total: ~15-30 minutes for thorough exploration

**Value**:
- Prevents wasted effort on wrong approach
- Validates feasibility before committing hours
- Documents decisions for future reference
- Creates smooth handoff to /plan-project
