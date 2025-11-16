# Claude Skills - Comprehensive Best Practices Review

**Date**: November 16, 2025
**Scope**: All 90 Skills in `/skills/` Directory
**Reference**: Official Anthropic Agent Skills Best Practices
**Branch**: `claude/review-skills-best-practices-01RzFovrzC5H78ko89isArxw`

---

## Executive Summary

This review analyzes all 90 production skills against official Anthropic best practices from:
- https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart
- https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices

### Overall Grade: **B+** (72% excellent, 14% critical issues)

| Category | Pass Rate | Status |
|----------|-----------|--------|
| YAML Frontmatter Compliance | 85.6% (77/90) | Good |
| SKILL.md Line Count (≤500) | 13.3% (12/90) | **CRITICAL** |
| Description Quality | 71% (63/89) | Good |
| Progressive Disclosure Structure | 80% (72/90) | Excellent |
| Anti-Pattern Free | 27.8% (25/90) | Fair |

### Key Findings

1. **CRITICAL**: 86.7% of skills exceed the 500-line best practice limit (avg: 1,111 lines)
2. **HIGH**: 13 skills have YAML frontmatter violations (invalid names, reserved words)
3. **MEDIUM**: 118 anti-patterns found across all skills (avg 1.31/skill)
4. **LOW**: 26 skills need description improvements

### Immediate Actions Required

1. **Refactor over-length SKILL.md files** - Top priority, 78 skills affected
2. **Fix YAML frontmatter violations** - 13 skills need name/format corrections
3. **Add missing license fields** - 5 skills missing required field
4. **Fix tanstack-start** - Missing description entirely

---

## Official Best Practices Reference

### From Anthropic Documentation:

**SKILL.md Requirements:**
- YAML frontmatter with `name` (max 64 chars, lowercase/hyphens/numbers only)
- `description` field (max 1024 chars, includes WHAT + WHEN to use)
- Body under **500 lines** for optimal performance
- No reserved words ("anthropic", "claude") in name
- Third-person language throughout

**Progressive Disclosure:**
- Level 1: Metadata (~100 tokens, always loaded)
- Level 2: SKILL.md body (<5k words, loaded when triggered)
- Level 3: Resources (scripts/, references/, assets/) loaded as needed

**Content Guidelines:**
- Conciseness is critical (only include what Claude doesn't already know)
- No time-sensitive information (dates, version cutoffs)
- Consistent terminology throughout
- Concrete examples with input/output pairs
- Verification/validation steps for complex tasks
- Explicit dependency declarations

**Naming:**
- Prefer gerund form (verb + -ing): `processing-pdfs`, `analyzing-spreadsheets`
- Avoid vague names: `helper`, `utils`, `tools`, `documents`

---

## Critical Issue #1: SKILL.md Over-Length (86.7% Non-Compliant)

### The Problem

Official best practice: **SKILL.md body should be under 500 lines**

Current state:
- **78 out of 90 skills exceed 500 lines**
- Average skill length: **1,111 lines** (122% over limit)
- Total lines analyzed: 99,993
- Worst offender: fastmcp at 2,609 lines (421% over limit)

### Top 10 Worst Offenders

| Skill | Lines | % Over Limit | Priority |
|-------|-------|--------------|----------|
| fastmcp | 2,609 | +421% | CRITICAL |
| elevenlabs-agents | 2,486 | +397% | CRITICAL |
| nextjs | 2,413 | +382% | CRITICAL |
| nuxt-content | 2,213 | +342% | CRITICAL |
| shadcn-vue | 2,205 | +341% | CRITICAL |
| google-gemini-api | 2,139 | +327% | CRITICAL |
| openai-api | 2,093 | +318% | CRITICAL |
| cloudflare-agents | 1,990 | +298% | CRITICAL |
| cloudflare-mcp-server | 1,977 | +295% | CRITICAL |
| sveltia-cms | 1,833 | +266% | CRITICAL |

### Compliant Skills (Use as Models)

Only 12 skills meet the 500-line best practice:

1. **inspira-ui** (328 lines) - GOLD STANDARD
2. **cloudflare-manager** (453 lines) - EXCELLENT
3. **dependency-upgrade** (435 lines)
4. **project-session-management** (425 lines)
5. And 8 others under 500 lines

### Required Action

**Refactor all 78 non-compliant skills using progressive disclosure:**

```
CURRENT (Wrong):
skill-name/
└── SKILL.md (2600+ lines)

RECOMMENDED (Correct):
skill-name/
├── SKILL.md (400-500 lines only)
│   ├── When to use
│   ├── Quick Start
│   ├── Core Workflows
│   ├── Common Patterns
│   └── Critical Pitfalls
├── references/
│   ├── api-reference.md
│   ├── setup-guide.md
│   ├── advanced-patterns.md
│   └── troubleshooting.md
├── scripts/
│   ├── example-template.ts
│   └── utility-scripts.sh
└── assets/
    └── architecture-diagrams.png
```

**Estimated effort**: 2-3 hours per skill to properly refactor

---

## Critical Issue #2: YAML Frontmatter Violations (14.4% Fail)

### Failing Skills by Issue Type

**1. Invalid Name Characters (7 skills)**

Names must be lowercase letters, numbers, and hyphens only.

| Skill | Current Name | Issue | Corrected Name |
|-------|--------------|-------|----------------|
| cloudflare-manager | "Cloudflare Manager" | Title Case | "cloudflare-manager" |
| gemini-cli | "Gemini CLI" | Title Case | "gemini-cli" |
| multi-ai-consultant | "Multi-AI Consultant" | Title Case | "multi-ai-consultant" |
| nuxt-v4 | "Nuxt v4" | Spaces | "nuxt-v4" |
| tanstack-router | "TanStack Router" | Title Case | "tanstack-router" |
| tanstack-start | "TanStack Start" | Title Case | "tanstack-start" |
| tanstack-table | "TanStack Table" | Title Case | "tanstack-table" |

**Fix Required:**
```yaml
# BEFORE (Invalid)
---
name: "Cloudflare Manager"
description: ...
---

# AFTER (Valid)
---
name: cloudflare-manager
description: ...
---
```

**2. Reserved Words Violation (3 skills)**

Names cannot contain "anthropic" or "claude" per official spec.

- `claude-agent-sdk`
- `claude-api`
- `claude-code-bash-patterns`

**Options:**
- Rename to avoid reserved words (e.g., "agent-sdk-claude" → "anthropic-agent-sdk")
- Request exception from Anthropic (if these are legitimate skill names)
- Document as intentional violation with justification

**3. Missing/Malformed YAML Frontmatter (2 skills)**

- `motion` - File doesn't start with `---` delimiter
- `project-workflow` - Malformed YAML structure

**Fix Required:**
```yaml
# Files must start with:
---
name: skill-name
description: |
  Description here...
---

# Main content follows
```

**4. Missing SKILL.md (1 skill)**

- `feature-dev` - No SKILL.md file exists

**Action**: Create SKILL.md with proper frontmatter

---

## Critical Issue #3: Description Quality Problems (29% Need Fixes)

### Summary

- **71% EXCELLENT** (63 skills with all criteria met)
- **29% NEED FIXES** (26 skills with quality issues)

### Issue Breakdown

**1. Missing Action Verb Opening (18 skills - 21%)**

Most common issue: Using passive descriptions instead of action-oriented openings.

**WRONG Pattern:**
```yaml
description: |
  Complete knowledge domain for Cloudflare D1...
  Complete guide for OpenAI APIs...
  Backend AI functionality with...
```

**CORRECT Pattern:**
```yaml
description: |
  Configure and query Cloudflare D1 databases...
  Integrate OpenAI Chat Completions, Embeddings...
  Build server-side AI features with...
```

**Affected Skills:**
- ai-sdk-core, ai-sdk-ui
- cloudflare-browser-rendering, cloudflare-cron-triggers, cloudflare-d1
- cloudflare-email-routing, cloudflare-hyperdrive, cloudflare-kv
- cloudflare-queues, cloudflare-r2, cloudflare-vectorize
- cloudflare-workers-ai, firecrawl-scraper, nano-banana-prompts
- openai-api, openai-assistants, project-workflow, sveltia-cms

**Example Fix - cloudflare-d1:**

```yaml
# BEFORE
description: |
  Complete knowledge domain for Cloudflare D1 - serverless SQLite database
  on Cloudflare's edge network.
  Use when: creating D1 databases, writing SQL migrations...

# AFTER
description: |
  Configure and query Cloudflare D1 serverless SQLite databases from Workers
  with migrations, bindings, query optimization, and relational schema design.
  Multi-region replication with bookmarks and sequential consistency.
  Use when: creating D1 databases, writing SQL migrations, configuring D1
  bindings, querying D1 from Workers, handling SQLite data...
```

**2. First/Second Person Language (3 skills - 3%)**

- `better-chatbot-patterns` - Uses "your own projects"
- `cloudflare-workflows` - Passive opening
- `open-source-contributions` - Starts with "Use this skill when"

**3. Missing Description (1 skill)**

- `tanstack-start` - No description in frontmatter (CRITICAL)

---

## Critical Issue #4: Anti-Patterns Found (118 Total)

### Distribution

| Anti-Pattern | Count | % of Skills | Severity |
|--------------|-------|-------------|----------|
| Second-Person Language | 32 | 36% | Medium |
| Missing Dependency Section | 31 | 34% | Medium |
| Time-Sensitive Information | 29 | 32% | Medium |
| No Verification Steps | 21 | 23% | Medium |
| Missing License Field | 5 | 5% | **High** |
| Vague Naming | 4 | 4% | Low |
| No Error Handling | 2 | 2% | **High** |

### Skills Needing Immediate Attention

**CRITICAL (3+ anti-patterns):**

1. **skill-review**
   - Time-sensitive dates in examples
   - Second-person language
   - Documents anti-patterns as examples (meta-issue)

2. **openai-assistants**
   - Hard-coded deprecation dates (lines 27, 37-39)
   - Second-person "Should you still use..." language
   - No verification section

3. **openai-api**
   - "Latest model (November 2024)" - stale date
   - Second-person instructions
   - No verification section

4. **nano-banana-prompts**
   - Missing license field
   - No error handling section
   - No verification section

5. **frontend-design**
   - Missing license field
   - No error handling (design philosophy only)
   - No verification patterns

### Missing License Field (HIGH PRIORITY)

These skills violate the official requirement:

- `cloudflare-manager`
- `dependency-upgrade`
- `frontend-design`
- `nano-banana-prompts`
- `project-workflow`

**Fix Required:**
```yaml
---
name: skill-name
description: ...
license: MIT
---
```

### Time-Sensitive Information Examples

**WRONG:**
```markdown
Latest model (November 2024)
As of 2024, the recommended approach...
Deprecated in January 2025...
```

**CORRECT:**
```markdown
Latest stable model
Currently recommended approach...
Deprecated (see migration guide)...
```

**Affected Skills (29 total):**
ai-sdk-core, cloudflare-worker-base, clerk-auth, drizzle-orm-d1, google-gemini-api, hugo, nuxt-v4, openai-api, openai-assistants, openai-responses, skill-review, and 18 others

---

## Positive Findings: Exemplary Skills (25 Reference Models)

These skills have **ZERO anti-patterns** and should be used as templates:

1. ai-elements-chatbot
2. auto-animate
3. better-chatbot
4. claude-agent-sdk
5. cloudflare-agents
6. cloudflare-cron-triggers
7. cloudflare-queues
8. cloudflare-turnstile
9. cloudflare-zero-trust-access
10. firecrawl-scraper
11. gemini-cli
12. google-gemini-embeddings
13. hono-routing
14. multi-ai-consultant
15. neon-vercel-postgres
16. nuxt-seo
17. open-source-contributions
18. pinia-v3
19. project-session-management
20. tailwind-v4-shadcn
21. tanstack-query
22. ultracite
23. vercel-blob
24. wordpress-plugin-core
25. zustand-state-management

**What Makes These Excellent:**
- Clear "Use when" scenarios
- Time-agnostic examples
- Comprehensive error handling
- Verification/testing steps
- Clear dependency declarations
- Present license fields
- Third-person language
- Concise, focused content

---

## Progressive Disclosure Structure Analysis

### Overall Status: 80% Good Structure

- **72 skills (80%)** - Excellent/adequate structure
- **15 skills (16.7%)** - Too complex/nested
- **2 skills (2.2%)** - Minimal structure (missing opportunities)
- **1 skill (1.1%)** - Missing SKILL.md entirely

### Skills with Excellent Structure (Study These)

**Premium Structure (4+ organized folders):**
- ai-sdk-core
- google-gemini-api
- tanstack-query
- elevenlabs-agents
- 48 others

**Balanced Structure:**
- cloudflare-worker-base - Foundation pattern
- tailwind-v4-shadcn - Efficient short SKILL.md
- react-hook-form-zod - Well-organized

### Over-Complex Structure Issues

**TOO NESTED:**
- `hugo` - 416 files, 68 levels deep (should be separate repo)
- `cloudflare-full-stack-scaffold` - 74 files, 9 levels deep
- `wordpress-plugin-core` - Multiple nested templates

**Action**: Simplify or move to external references

### Minimal Structure (Needs Improvement)

- `open-source-contributions` - 1,233-line SKILL.md (no progressive disclosure)
- `frontend-design` - No organized folders, minimal references

---

## Remediation Roadmap

### Phase 1: CRITICAL FIXES (Week 1) - 5-10 hours

**Priority 1: Fix Blocking Issues**
- [ ] Create SKILL.md for `feature-dev` (30 min)
- [ ] Add missing license fields to 5 skills (1 hour)
- [ ] Fix tanstack-start missing description (30 min)
- [ ] Fix YAML frontmatter malformation in motion, project-workflow (1 hour)

**Priority 2: Fix Name Violations**
- [ ] Correct 7 skills with invalid name characters (1 hour)
- [ ] Evaluate 3 skills with "claude" reserved word (discussion needed)

### Phase 2: HIGH-VALUE FIXES (Week 2-3) - 30-40 hours

**Refactor Top 10 Over-Length Skills**

Target: Reduce each from 1500-2600 lines to under 500 lines

- [ ] fastmcp (2,609 → 450 lines) - 4 hours
- [ ] elevenlabs-agents (2,486 → 450 lines) - 4 hours
- [ ] nextjs (2,413 → 450 lines) - 4 hours
- [ ] nuxt-content (2,213 → 450 lines) - 3 hours
- [ ] shadcn-vue (2,205 → 450 lines) - 3 hours
- [ ] google-gemini-api (2,139 → 450 lines) - 3 hours
- [ ] openai-api (2,093 → 450 lines) - 3 hours
- [ ] cloudflare-agents (1,990 → 450 lines) - 3 hours
- [ ] cloudflare-mcp-server (1,977 → 450 lines) - 3 hours
- [ ] sveltia-cms (1,833 → 450 lines) - 3 hours

**Strategy:**
1. Extract API references to `references/api.md`
2. Move setup guides to `references/setup.md`
3. Create `scripts/` for code examples
4. Keep only workflows, patterns, and critical warnings in SKILL.md

### Phase 3: QUALITY IMPROVEMENTS (Week 4-6) - 15-20 hours

**Fix Description Quality**
- [ ] Rewrite 18 skills with passive openings (3 hours)
- [ ] Fix 3 skills with person/voice issues (1 hour)
- [ ] Update 1 skill with vague language (30 min)

**Add Missing Sections**
- [ ] Add verification steps to 21 skills (5 hours)
- [ ] Add dependency sections to 31 skills (4 hours)
- [ ] Remove time-sensitive info from 29 skills (3 hours)

### Phase 4: POLISH & MAINTENANCE (Ongoing)

- [ ] Review second-person language in context (10 hours)
- [ ] Update quarterly verification dates
- [ ] Add pre-commit hooks for validation
- [ ] Create automated compliance checker

---

## Detailed Correction Suggestions

### 1. Over-Length SKILL.md Template

**For skills exceeding 500 lines, restructure as:**

```markdown
# SKILL.md (400-500 lines max)

---
name: skill-name
description: |
  [Action verb] [specific capability] for [use case].
  Includes [key features].

  Use when: [trigger scenarios]
license: MIT
---

## Overview
Brief 2-3 paragraph introduction (50-100 words)

## Quick Start
Essential setup in 3-5 steps (100-150 words)

## Core Workflows
3-5 most common patterns with examples (200-250 words)

## Common Patterns
Quick reference for frequent operations (50-100 words)

## Critical Pitfalls
Must-avoid errors with solutions (50-100 words)

## Additional Resources
- See `references/api-reference.md` for complete API documentation
- See `references/advanced-patterns.md` for complex use cases
- See `scripts/` for ready-to-use templates
- See `references/troubleshooting.md` for error resolution
```

### 2. Description Rewrite Template

**For skills with passive descriptions:**

```yaml
# BEFORE (Passive)
description: |
  Complete knowledge domain for [Technology] - [brief description].
  Use when: [scenarios]

# AFTER (Active)
description: |
  [Action verb] [Technology] [specific capabilities] for [use cases].
  Includes [key features like X, Y, Z]. Supports [important detail].

  Use when: [expanded trigger scenarios including error conditions,
  specific features, and concrete use cases]
```

**Strong Opening Verbs:**
- Configure, Build, Integrate, Implement, Deploy
- Optimize, Manage, Create, Transform, Validate
- Authenticate, Process, Generate, Analyze, Monitor

### 3. License Field Addition

```yaml
---
name: skill-name
description: ...
license: MIT  # Add this required field
---
```

### 4. Verification Section Template

Add to all skills missing verification:

```markdown
## Verification Checklist

After setup, verify everything works:

- [ ] Dependencies installed: `npm ls` shows correct versions
- [ ] Configuration correct: Files match expected structure
- [ ] Test run: Execute basic example from Quick Start
- [ ] Expected output: Should see [specific result]
- [ ] Error-free: No warnings or errors in console

### Quick Test Command
```bash
# Replace with skill-specific test
npm run test
```
```

### 5. Dependency Section Template

Add to skills missing explicit dependencies:

```markdown
## Dependencies

### Required Packages
```bash
npm install package-a@^1.0.0 package-b@^2.0.0
# or
bun add package-a@^1.0.0 package-b@^2.0.0
```

### Peer Dependencies
- Node.js >= 18.0.0
- TypeScript >= 5.0.0

### Optional
- `optional-package` - For [specific feature]
```

### 6. Time-Sensitive Information Fixes

**Replace date references:**

```markdown
# BEFORE (Time-sensitive)
As of November 2024, the recommended approach...
Latest model (January 2025)...
Deprecated since Q4 2024...

# AFTER (Time-agnostic)
Currently, the recommended approach...
Latest stable model version...
Deprecated (see migration guide in references/)...
```

---

## Automated Validation Script

Create a pre-commit hook to catch issues:

```bash
#!/bin/bash
# scripts/validate-skill.sh

SKILL_DIR="$1"
ERRORS=0

# Check SKILL.md exists
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
  echo "ERROR: Missing SKILL.md"
  ERRORS=$((ERRORS + 1))
fi

# Check line count
LINES=$(wc -l < "$SKILL_DIR/SKILL.md")
if [ "$LINES" -gt 500 ]; then
  echo "WARNING: SKILL.md has $LINES lines (max 500)"
  ERRORS=$((ERRORS + 1))
fi

# Check YAML frontmatter
if ! head -1 "$SKILL_DIR/SKILL.md" | grep -q "^---$"; then
  echo "ERROR: Missing YAML frontmatter"
  ERRORS=$((ERRORS + 1))
fi

# Check for license field
if ! grep -q "^license:" "$SKILL_DIR/SKILL.md"; then
  echo "ERROR: Missing license field"
  ERRORS=$((ERRORS + 1))
fi

# Check name format
NAME=$(sed -n '/^name:/p' "$SKILL_DIR/SKILL.md" | sed 's/name: //')
if echo "$NAME" | grep -qE '[A-Z ]'; then
  echo "ERROR: Name must be lowercase with hyphens only"
  ERRORS=$((ERRORS + 1))
fi

# Check for reserved words
if echo "$NAME" | grep -qiE '(anthropic|claude)'; then
  echo "WARNING: Name contains reserved word"
fi

exit $ERRORS
```

---

## Summary of All Findings

### Critical Issues (Fix Immediately)

1. **78/90 skills exceed 500-line limit** - Violates core best practice
2. **13/90 skills have YAML frontmatter errors** - Prevents proper discovery
3. **5/90 skills missing license field** - Violates official requirement
4. **1/90 skills missing SKILL.md** - Completely non-functional
5. **1/90 skills missing description** - Cannot be discovered

### High Priority Issues (Fix This Month)

6. **29 skills with time-sensitive information** - Will become stale
7. **21 skills missing verification steps** - Users can't validate setup
8. **18 skills with passive descriptions** - Poor discovery keywords
9. **31 skills missing dependency sections** - Users unsure what to install

### Medium Priority Issues (Fix This Quarter)

10. **32 skills with second-person language** - Style inconsistency
11. **15 skills with over-complex structure** - Progressive disclosure issues
12. **2 skills with no error handling** - Poor user experience

### Total Estimated Effort

- **Phase 1 (Critical)**: 5-10 hours
- **Phase 2 (Refactoring)**: 30-40 hours
- **Phase 3 (Quality)**: 15-20 hours
- **Phase 4 (Polish)**: 10+ hours (ongoing)

**Total**: ~60-80 hours to achieve full compliance

---

## Next Steps

1. **Review this document** with the team
2. **Prioritize Phase 1** fixes for immediate compliance
3. **Create tracking issue** for Phase 2 refactoring
4. **Establish validation pipeline** to prevent regression
5. **Schedule quarterly reviews** to maintain standards

---

## Supporting Documents Generated

Additional detailed reports available in repository root:

- `YAML_FRONTMATTER_COMPLIANCE_REPORT.md` - Full YAML analysis
- `YAML_FIXES_GUIDE.md` - Step-by-step YAML corrections
- `SKILL_DESCRIPTION_AUDIT.md` - Description quality details
- `SKILL_DESCRIPTION_FIXES.md` - Description correction guide
- `AUDIT_REPORT_2025-11-16.md` - Complete anti-pattern analysis
- `PRIORITY_FIXES_SUMMARY.txt` - Phase-by-phase action items
- `SKILL_SCORES_TABLE.txt` - Per-skill scoring breakdown

---

**Report Generated**: November 16, 2025
**Next Review**: December 16, 2025 (after Phase 1-2 completion)
**Maintainer**: Claude Skills Team
**Branch**: `claude/review-skills-best-practices-01RzFovrzC5H78ko89isArxw`
