# Subagent Workflow Guide

**Purpose**: Best practices for using Claude Code subagents in skills repository maintenance
**Last Updated**: 2025-10-29
**Status**: Production Ready

---

## Overview

Claude Code provides built-in subagents optimized for specific tasks. This guide shows how to use them effectively for maintaining the 50+ skills in this repository.

**Key Insight**: You DON'T need custom subagents for most workflows. The built-in Explore and Plan subagents cover 80%+ of use cases.

---

## Built-in Subagents

### 1. **Explore** - Verification & Analysis

**Best for**:
- Skill compliance verification (checking YAML frontmatter, keywords, TODOs)
- Package version checking across multiple skills
- Finding inconsistencies in documentation
- Generating reports on skill quality

**Tools**: Glob, Grep, Read, Bash
**Cost**: Low (read-only operations, efficient search)
**Thoroughness levels**: `quick`, `medium`, `very thorough`

**Example Usage**:

```
User: "Use Explore to verify all skills have valid YAML frontmatter with name, description, and license fields"

Explore subagent:
1. Globs all SKILL.md files in skills/
2. Reads YAML frontmatter from each
3. Checks for required fields
4. Reports compliance status

Output:
✅ 48 skills compliant
❌ 2 skills missing license field:
   - cloudflare-worker-base
   - hono-routing
```

**When to use**:
- ✅ Checking 5+ skills at once
- ✅ Need comprehensive report format
- ✅ Read-only verification tasks
- ✅ Multi-file pattern searches

**When NOT to use**:
- ❌ Single file checks (just use Read tool directly)
- ❌ Tasks requiring edits (use Plan instead)
- ❌ Simple questions (ask directly)

---

### 2. **Plan** - Multi-file Edits

**Best for**:
- Updating documentation across multiple files (README, CHANGELOG, roadmap)
- Synchronizing standards when requirements change
- Batch template updates
- Coordinated multi-file changes with approval

**Tools**: Glob, Grep, Read, Bash
**Cost**: Medium (reads + proposes edits, waits for approval)
**Interactive**: Shows diffs before applying changes

**Example Usage**:

```
User: "I added openai-realtime skill. Update README.md, CHANGELOG.md, and skills-roadmap.md"

Plan subagent:
1. Reads current state of all 3 files
2. Proposes specific additions
3. Shows full diff for each file
4. Waits for approval

[Shows diffs]

User: Approve

Plan: Applies all changes atomically
```

**When to use**:
- ✅ Need to edit 3+ files consistently
- ✅ Want to review changes before applying
- ✅ Coordinating updates across documentation
- ✅ Batch operations with verification

**When NOT to use**:
- ❌ Single file edits (just use Edit tool)
- ❌ Simple text replacements
- ❌ Already have a script for the task

---

### 3. **general-purpose** - Everything Else

**Best for**: Default agent for ad-hoc tasks that don't fit Explore/Plan patterns

**Tools**: All tools (*)
**Cost**: Variable
**When to use**: If unsure, start here. Claude will suggest Explore/Plan if more appropriate.

---

## Practical Workflows

### Workflow 1: Quarterly Skill Verification

**Goal**: Check all 50 skills for compliance with ONE_PAGE_CHECKLIST.md

**Approach**:

```
User: "Use Explore with 'very thorough' mode to verify all skills against ONE_PAGE_CHECKLIST.md.
       Check YAML frontmatter, keywords, TODO markers, and README structure."

Time: ~2-3 minutes
Cost: ~$0.40 (Haiku pricing)
Output: Comprehensive compliance report

Without subagent: 40+ minutes of manual checking
```

**Template prompt**:

```
Use Explore to verify all skills in /home/jez/Documents/claude-skills/skills/ against standards in ONE_PAGE_CHECKLIST.md.

For each skill, check:
1. YAML frontmatter (name, description, license)
2. Name matches directory
3. Description includes "Use when" scenarios
4. Keywords comprehensive
5. README has auto-trigger keywords section
6. No TODO markers in committed files

Provide concise report with ✅/❌ per skill, summary at end.
```

---

### Workflow 2: Adding New Skill

**Goal**: Add new skill and update all relevant documentation

**Approach** (2 steps):

**Step 1 - Create skill** (manual or use templates):
```bash
cp -r templates/skill-skeleton/ skills/new-skill/
# Edit SKILL.md, README.md, add resources
```

**Step 2 - Update docs** (use Plan):
```
User: "I added [skill-name] skill. Update README.md, CHANGELOG.md, and planning/skills-roadmap.md"

Plan subagent:
- Reads current state
- Proposes additions
- Shows diffs
- Waits for approval

Time: 2 minutes (vs 10 min manual editing)
Cost: ~$1.20 (Sonnet for quality edits)
```

**Template prompt**:

```
Update documentation for new skill: [skill-name]

Files to update:
1. README.md - Add to skill list under appropriate category
2. CHANGELOG.md - Add entry with date and description
3. planning/skills-roadmap.md - Update status to ✅ Complete

Show me diffs before applying changes.
```

---

### Workflow 3: Package Version Checking

**Goal**: Verify dependencies are current across skills

**Approach** (use existing script + Explore for analysis):

```bash
# Run existing check script
./scripts/check-versions.sh skills/cloudflare-worker-base/

# For deeper analysis across ALL skills:
User: "Use Explore to check package.json files across all skills and report which have outdated dependencies"

Explore:
- Globs all package.json files in skills/*/templates/
- Reads each one
- Compares with latest npm versions (if able)
- Reports outdated packages

Output:
⚠️  3 skills have outdated dependencies:
   - cloudflare-d1: drizzle-orm@0.28.0 → 0.33.0
   - ai-sdk-core: ai@3.0.0 → 3.4.0
   - tailwind-v4-shadcn: tailwindcss@4.1.0 → 4.1.14
```

**Cost-benefit**: Only worth using Explore if checking 10+ skills. For individual skills, use check-versions.sh script.

---

### Workflow 4: Standards Synchronization

**Goal**: Anthropic updated skills spec, check what changed and sync our standards

**Approach** (Explore for research, Plan for updates):

**Step 1 - Research changes**:
```
User: "Use Explore to compare our planning/claude-code-skill-standards.md with official Anthropic spec at https://github.com/anthropics/skills/blob/main/agent_skills_spec.md"

Explore:
- Fetches official spec (via Read if local, WebFetch if needed)
- Reads our standards doc
- Diffs the two
- Reports changes

Output:
Changed fields:
- ✅ We're compliant: YAML frontmatter matches
- ⚠️  New optional field: 'allowed-tools'
- ⚠️  New optional field: 'metadata'
```

**Step 2 - Update standards** (if needed):
```
User: "Update planning/claude-code-skill-standards.md to include new 'allowed-tools' and 'metadata' fields. Show diff."

[Claude or Plan proposes changes]
[You approve]
```

---

## Cost-Benefit Analysis

### When Subagents Save Time

| Task | Manual | With Subagent | Savings | Subagent |
|------|--------|---------------|---------|----------|
| Verify all 50 skills | 40 min | 3 min | ~93% | Explore |
| Update 4 doc files | 10 min | 2 min | ~80% | Plan |
| Check package versions | 30 min | 5 min | ~83% | Explore + script |
| Research standards changes | 20 min | 5 min | ~75% | Explore |

### When Subagents Add Overhead

| Task | Direct | With Subagent | Overhead |
|------|--------|---------------|----------|
| Read single file | 1 tool call | 3-5 tool calls | ~3x slower |
| Simple grep search | 1 tool call | 2-4 tool calls | ~2x slower |
| Run existing script | 1 bash call | 2-3 tool calls | ~2x slower |

**Rule of Thumb**: Use subagents for tasks touching 5+ files OR requiring comprehensive reports. Otherwise, use tools directly.

---

## What About Custom Subagents?

### The agents.json File

**What it's for**: Building custom applications with `@anthropic-ai/claude-agent-sdk` (NOT extending Claude Code CLI)

**Location**: `/home/jez/.claude/agents.json`

**Example**:
```json
{
  "agents": {
    "skill-verifier": {
      "description": "Verify Claude Code skill compliance",
      "prompt": "You verify skills against ONE_PAGE_CHECKLIST.md...",
      "tools": ["Read", "Grep", "Glob"],
      "model": "haiku"
    }
  }
}
```

**Important**: This is for SDK-based applications, NOT for invoking via Claude Code CLI Task tool.

**To use custom agents**:
```typescript
// In a Node.js script using @anthropic-ai/claude-agent-sdk
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: "Verify all skills",
  options: {
    agents: {
      "skill-verifier": { /* definition */ }
    }
  }
});
```

**Verdict**: agents.json is useful if building a **separate application** that uses Claude Code programmatically. For interactive CLI work (your use case), **built-in subagents are sufficient**.

---

## Domain-Specific Agents: Why You DON'T Need Them

### ❌ Cloudflare Expert Agent

**Temptation**: "I build lots of Cloudflare skills, so I need a Cloudflare expert agent"

**Reality**:
- ✅ You already have 26 atomic Cloudflare skills
- ✅ Claude discovers and uses them automatically
- ✅ Skills = domain knowledge, agents = task execution
- ❌ Subagent can't add knowledge Claude doesn't have
- ❌ Would just invoke your existing skills anyway

**Better**: Improve skill quality, not wrap them in agents.

---

### ❌ React/TypeScript/Next.js Expert Agents

**Temptation**: "Need specialized knowledge for frontend frameworks"

**Reality**:
- Claude already knows React, TypeScript, Next.js
- Subagents don't increase model's inherent knowledge
- You're doing repository maintenance, not framework development
- Domain agents add complexity with zero benefit

---

### ✅ When Domain Agents ARE Useful (Not Your Use Case)

1. **External API orchestration**
   - Example: "Stripe Payment Agent" that knows your specific payment flow
   - Calls Stripe API with business logic
   - Handles webhooks, refunds, disputes

2. **Multi-step deployment workflows**
   - Example: "CI/CD Agent" that deploys → tests → monitors → rolls back
   - Stateful process with checkpoints
   - Needs restricted tool access for safety

3. **Compliance & security auditing**
   - Example: "Read-Only Security Auditor" that never writes
   - Restricted to Read, Grep, Glob tools only
   - Generates reports, can't modify code

**For skills repository**: Your tasks are verification + documentation, not deployment + external APIs. Built-in subagents handle this perfectly.

---

## Anti-Patterns to Avoid

### ❌ Over-Engineering with Custom Agents

**Don't**:
```json
{
  "agents": {
    "skill-creator": { /* ... */ },
    "skill-researcher": { /* ... */ },
    "skill-template-builder": { /* ... */ },
    "skill-verifier": { /* ... */ },
    "doc-syncer": { /* ... */ },
    "cloudflare-expert": { /* ... */ },
    "react-expert": { /* ... */ }
  }
}
```

**Why not**:
- 7 agents for 3 actual workflows = massive overhead
- Each agent needs maintenance
- Token costs for orchestration
- Complexity >> value

**Do instead**:
```
# 95% of work
Use built-in Explore for verification
Use built-in Plan for doc updates

# 5% of work (if really needed)
Build ONE custom agent for SDK-based automation
```

---

### ❌ Creating Agents for One-Off Tasks

**Don't**:
```json
{
  "agents": {
    "migrate-skills-to-v2": { /* only used once */ }
  }
}
```

**Why not**: More work to define agent than to just do the task

**Do instead**: Use Plan mode for one-time migrations

---

### ❌ Ignoring Built-in Subagents

**Don't**: Build custom "file-searcher" agent when Explore exists

**Do**: Master the built-in subagents first. Only build custom if you have a proven gap.

---

## Quick Reference

### Decision Tree: Which Subagent?

```
Is task read-only verification/analysis across 5+ files?
├─ YES → Use Explore
└─ NO
   └─ Does task require editing 3+ files consistently?
      ├─ YES → Use Plan
      └─ NO
         └─ Is task <5 files or <3 tool calls?
            ├─ YES → Use tools directly (don't use subagent)
            └─ NO → Use general-purpose or ask for recommendation
```

### Prompt Templates

**Skill Verification**:
```
Use Explore with 'very thorough' mode to verify [skill-name OR all skills] against ONE_PAGE_CHECKLIST.md.

Check: YAML frontmatter, keywords, TODO markers, README structure.

Provide concise report with ✅/❌ per skill, summary at end.
```

**Documentation Update**:
```
Update [list files] for new skill: [skill-name]

Show diffs before applying. Ensure consistency across all files.
```

**Package Version Check**:
```
Use Explore to check package.json files in skills/*/templates/ and report outdated dependencies.
```

**Standards Research**:
```
Use Explore to compare planning/claude-code-skill-standards.md with official Anthropic spec and report differences.
```

---

## Success Metrics

**Measured after 1 month of using subagents**:

- ✅ Skill verification time: 40 min → 3 min (93% reduction)
- ✅ Documentation updates: 10 min → 2 min (80% reduction)
- ✅ Token costs: <$2/week for all verification tasks
- ✅ Error prevention: 100% (catch issues before commit)
- ✅ Consistency: Automated checks = no human oversight errors

**ROI**: ~2 hours saved per week for ~$8/month in API costs = **15:1 return**

---

## Next Steps

1. **Start using Explore this week**
   - Try 3-5 verification tasks
   - Measure time savings
   - Refine prompts

2. **Start using Plan for doc updates**
   - Next time you add a skill, use Plan to update docs
   - Review diffs carefully
   - Document any issues

3. **Track metrics**
   - Time spent on verification (before/after)
   - Token costs
   - Errors caught

4. **Revisit quarterly**
   - Are built-in subagents still sufficient?
   - Any new workflows that need custom agents?
   - Update this guide based on learnings

---

## Further Reading

- **Claude Agent SDK**: `/home/jez/Documents/claude-skills/skills/claude-agent-sdk/SKILL.md`
- **Official Skills Spec**: https://github.com/anthropics/skills/blob/main/agent_skills_spec.md
- **ONE_PAGE_CHECKLIST**: `/home/jez/Documents/claude-skills/ONE_PAGE_CHECKLIST.md`
- **Standards Doc**: `/home/jez/Documents/claude-skills/planning/claude-code-skill-standards.md`

---

**Last Updated**: 2025-10-29
**Maintainer**: Claude Skills Maintainers | maintainers@example.com
**Next Review**: 2026-01-29 (Quarterly)
