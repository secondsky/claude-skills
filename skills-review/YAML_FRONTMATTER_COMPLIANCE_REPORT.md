# YAML Frontmatter Compliance Analysis - 90 Skills

**Analysis Date:** November 16, 2025
**Repository:** /home/user/claude-skills
**Total Skills Analyzed:** 90

---

## Executive Summary

**Compliance Rate: 85.6% (77/90 skills passing)**

- **Passed:** 77 skills (85.6%)
- **Failed:** 13 skills (14.4%)

### Critical Issues Found: 4 Categories

| Issue Type | Count | % | Severity |
|-----------|-------|---|----------|
| Invalid Name Characters | 7 | 7.8% | **HIGH** |
| Reserved Words (claude/anthropic) | 3 | 3.3% | **HIGH** |
| Missing YAML Delimiters | 2 | 2.2% | **CRITICAL** |
| Missing SKILL.md File | 1 | 1.1% | **CRITICAL** |

---

## Detailed Findings

### Category 1: RESERVED WORDS VIOLATIONS (3 skills - 3.3%)

**Rule Violated:** Name field must not contain "claude" or "anthropic" (official Anthropic spec)

**Affected Skills:**
1. `claude-agent-sdk`
   - Current name: `claude-agent-sdk`
   - Issue: Contains reserved word "claude"
   - Fix: Rename to remove "claude" or verify with maintainers if exception warranted

2. `claude-api`
   - Current name: `claude-api`
   - Issue: Contains reserved word "claude"
   - Fix: Rename to remove "claude" or verify with maintainers if exception warranted

3. `claude-code-bash-patterns`
   - Current name: `claude-code-bash-patterns`
   - Issue: Contains reserved word "claude"
   - Fix: Rename to remove "claude" or verify with maintainers if exception warranted

**Reference:** [Anthropic Skills Spec](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)

---

### Category 2: INVALID NAME CHARACTERS (7 skills - 7.8%)

**Rule Violated:** Name field must contain ONLY lowercase letters, numbers, and hyphens (a-z, 0-9, -)

**Affected Skills:**
1. `cloudflare-manager`
   - Directory: `/home/user/claude-skills/skills/cloudflare-manager/`
   - Current name field: `Cloudflare Manager` (with spaces and capitals)
   - Should be: `cloudflare-manager`
   - Issues: Contains uppercase letters, spaces

2. `gemini-cli`
   - Directory: `/home/user/claude-skills/skills/gemini-cli/`
   - Current name field: `Gemini CLI` (with spaces and capitals)
   - Should be: `gemini-cli`
   - Issues: Contains uppercase letters, spaces

3. `multi-ai-consultant`
   - Directory: `/home/user/claude-skills/skills/multi-ai-consultant/`
   - Current name field: `Multi-AI Consultant` (with spaces and capitals)
   - Should be: `multi-ai-consultant`
   - Issues: Contains uppercase letters, spaces

4. `nuxt-v4`
   - Directory: `/home/user/claude-skills/skills/nuxt-v4/`
   - Current name field: `Nuxt 4` (with space)
   - Should be: `nuxt-v4`
   - Issues: Contains uppercase letters, space

5. `tanstack-router`
   - Directory: `/home/user/claude-skills/skills/tanstack-router/`
   - Current name field: `TanStack Router` (with spaces and capitals)
   - Should be: `tanstack-router`
   - Issues: Contains uppercase letters, spaces

6. `tanstack-start`
   - Directory: `/home/user/claude-skills/skills/tanstack-start/`
   - Current name field: `TanStack Start` (with spaces and capitals)
   - Should be: `tanstack-start`
   - Issues: Contains uppercase letters, spaces

7. `tanstack-table`
   - Directory: `/home/user/claude-skills/skills/tanstack-table/`
   - Current name field: `TanStack Table` (with spaces and capitals)
   - Should be: `tanstack-table`
   - Issues: Contains uppercase letters, spaces

**Fix Pattern:** Replace uppercase letters with lowercase, remove spaces, keep hyphens
**Frequency:** These appear to be display names instead of proper YAML name field values

---

### Category 3: MISSING YAML DELIMITERS (2 skills - 2.2%)

**Rule Violated:** SKILL.md must start with `---` on line 1 and end with `---` to properly delimit YAML frontmatter

**Affected Skills:**

1. `motion`
   - Current line 1: `# Motion Animation Library` (markdown header)
   - Should be: `---` (YAML delimiter)
   - Issue: Has markdown header before YAML frontmatter
   - Fix: Move markdown content after closing `---`, start file with `---`

2. `project-workflow`
   - Current line 1: `# Project Workflow Skill` (markdown header)
   - Should be: `---` (YAML delimiter)
   - Issue: Has markdown header before YAML frontmatter
   - Fix: Move markdown content after closing `---`, start file with `---`

**Impact:** These skills may not be properly discovered by Claude Code due to malformed YAML

---

### Category 4: MISSING SKILL.MD FILE (1 skill - 1.1%)

**Rule Violated:** Each skill directory must contain a `SKILL.md` file with valid YAML frontmatter

**Affected Skills:**

1. `feature-dev`
   - Location: `/home/user/claude-skills/skills/feature-dev/`
   - Current contents: 
     - `README.md` (found)
     - `.claude-plugin/` (directory)
     - `agents/` (directory)
     - `commands/` (directory)
   - Missing: `SKILL.md`
   - Fix: Create SKILL.md with valid YAML frontmatter and description

**Impact:** This skill cannot be discovered by Claude Code without a SKILL.md file

---

## Skills Passing All Checks (77/90 - 85.6%)

### Passing Skills by Domain:

**Cloudflare Platform (22/23 passing):**
cloudflare-agents, cloudflare-browser-rendering, cloudflare-cron-triggers, cloudflare-d1, cloudflare-durable-objects, cloudflare-email-routing, cloudflare-full-stack-integration, cloudflare-full-stack-scaffold, cloudflare-hyperdrive, cloudflare-images, cloudflare-kv, cloudflare-mcp-server, cloudflare-nextjs, cloudflare-queues, cloudflare-r2, cloudflare-sandbox, cloudflare-turnstile, cloudflare-vectorize, cloudflare-worker-base, cloudflare-workers-ai, cloudflare-workflows, cloudflare-zero-trust-access
*(1 failing: cloudflare-manager)*

**AI & Machine Learning (14/14 passing):**
ai-elements-chatbot, ai-sdk-core, ai-sdk-ui, elevenlabs-agents, google-gemini-api, google-gemini-embeddings, google-gemini-file-search, openai-agents, openai-api, openai-assistants, openai-responses, thesys-generative-ui, multi-ai-consultant (FAIL - invalid chars)
*(Actually 13 passing)*

**Frontend & UI (22/25 passing):**
aceternity-ui, auto-animate, base-ui-react, firecrawl-scraper, frontend-design, hono-routing, hugo, inspira-ui, nextjs, nuxt-content, nuxt-seo, nuxt-ui-v4, pinia-colada, pinia-v3, react-hook-form-zod, shadcn-vue, sveltia-cms, tailwind-v4-shadcn, tanstack-query, thesys-generative-ui, typescript-mcp, ultracite, zod, zustand-state-management
*(3 failing: motion, tanstack-router, tanstack-start, tanstack-table, nuxt-v4)*

**Auth & Security (2/3 passing):**
better-auth, clerk-auth
*(1 failing: Note: cloudflare-zero-trust-access is in Cloudflare category)*

**Content Management (4/4 passing):**
content-collections, nuxt-content, nuxt-seo, sveltia-cms

**Database & ORM (4/4 passing):**
drizzle-orm-d1, neon-vercel-postgres, vercel-blob, vercel-kv

**Tooling & Planning (11/13 passing):**
dependency-upgrade, fastmcp, github-project-automation, mcp-dynamic-orchestrator, open-source-contributions, project-planning, project-session-management, skill-review, swift-best-practices, claude-code-bash-patterns (FAIL - reserved word)
*(2 failing: feature-dev, project-workflow)*

**AI Chatbots & Prompts (5/5 passing):**
ai-elements-chatbot, better-chatbot, better-chatbot-patterns, nano-banana-prompts

---

## Corrective Actions Required

### Priority 1: CRITICAL (Must Fix - Breaks Discovery)

**Action Items:**
1. **feature-dev** - Create SKILL.md file
   - Add YAML frontmatter with required fields
   - Estimate effort: 15 minutes

2. **motion** - Fix YAML delimiter
   - Move `# Motion Animation Library` to line 5 (after closing `---`)
   - Add `---` as first line
   - Estimate effort: 5 minutes

3. **project-workflow** - Fix YAML delimiter
   - Move `# Project Workflow Skill` to line 5 (after closing `---`)
   - Add `---` as first line
   - Estimate effort: 5 minutes

### Priority 2: HIGH (Spec Compliance)

**Action Items:**
1. **cloudflare-manager** - Fix name field
   - Change `name: Cloudflare Manager` to `name: cloudflare-manager`
   - Estimate effort: 2 minutes

2. **gemini-cli** - Fix name field
   - Change `name: Gemini CLI` to `name: gemini-cli`
   - Estimate effort: 2 minutes

3. **multi-ai-consultant** - Fix name field
   - Change `name: Multi-AI Consultant` to `name: multi-ai-consultant`
   - Estimate effort: 2 minutes

4. **nuxt-v4** - Fix name field
   - Change `name: Nuxt 4` to `name: nuxt-v4`
   - Estimate effort: 2 minutes

5. **tanstack-router** - Fix name field
   - Change `name: TanStack Router` to `name: tanstack-router`
   - Estimate effort: 2 minutes

6. **tanstack-start** - Fix name field
   - Change `name: TanStack Start` to `name: tanstack-start`
   - Estimate effort: 2 minutes

7. **tanstack-table** - Fix name field
   - Change `name: TanStack Table` to `name: tanstack-table`
   - Estimate effort: 2 minutes

### Priority 3: REVIEW (Possible Exception)

**Action Items:**
1. **claude-agent-sdk** - Review reserved word usage
   - Determine if "claude" is acceptable per project standards
   - If not, propose alternative name
   - Estimate effort: 10 minutes (discussion)

2. **claude-api** - Review reserved word usage
   - Determine if "claude" is acceptable per project standards
   - If not, propose alternative name
   - Estimate effort: 10 minutes (discussion)

3. **claude-code-bash-patterns** - Review reserved word usage
   - Determine if "claude" is acceptable per project standards
   - If not, propose alternative name
   - Estimate effort: 10 minutes (discussion)

---

## Validation Checklist

For each failing skill, verify compliance using this checklist:

### YAML Structure
- [ ] Line 1: Starts with exactly `---`
- [ ] Contains field: `name:`
- [ ] Contains field: `description:`
- [ ] Has closing delimiter `---`
- [ ] All fields are valid YAML

### Name Field Validation
- [ ] Value is 1-64 characters
- [ ] Contains ONLY: a-z, 0-9, hyphens (-)
- [ ] No uppercase letters
- [ ] No spaces
- [ ] No XML tags (< or >)
- [ ] Does NOT contain "claude" or "anthropic"
- [ ] Matches directory name (kebab-case)

### Description Field Validation
- [ ] Non-empty (at least 1 character)
- [ ] Max 1024 characters
- [ ] No XML tags (< or >)
- [ ] Clearly describes skill purpose and use cases

---

## Compliance Against Official Standards

### Anthropic Skills Spec Compliance
Reference: https://github.com/anthropics/skills/blob/main/agent_skills_spec.md

**Current Status:**
- YAML frontmatter structure: ✓ (77/90 correct)
- Required fields (name, description): ✓ (77/90 correct)
- Field formatting (name rules): ✗ (84/90 correct - 6 invalid characters)
- Reserved word exclusion: ✗ (87/90 correct - 3 violations)
- Optional fields present: ✓ (license, metadata, allowed-tools)

**Overall Spec Alignment:** 84% (up from 85.6% after corrections)

---

## Statistics Summary

| Metric | Value |
|--------|-------|
| Total Skills | 90 |
| Compliant | 77 (85.6%) |
| Non-Compliant | 13 (14.4%) |
| YAML Structure Issues | 3 |
| Name Field Issues | 10 |
| Missing Files | 1 |
| Average Token Savings* | ~62% |
| Production Tested | 88/90 (97.8%) |

*Based on CLAUDE.md documentation

---

## Recommendations

1. **Immediate:** Fix the 3 critical issues (missing files/delimiters) within 1 day
2. **Short-term:** Fix the 7 name field issues within 1 week
3. **Review:** Discuss with maintainers whether claude/anthropic reserved words should be exceptions
4. **Process:** Add pre-commit hook to validate SKILL.md YAML on all future changes
5. **Documentation:** Update CONTRIBUTING.md with examples of correct YAML format

---

## Files for Reference

- Official Anthropic spec: https://github.com/anthropics/skills/blob/main/agent_skills_spec.md
- Project standards: /home/user/claude-skills/planning/claude-code-skill-standards.md
- Compliance checklist: /home/user/claude-skills/ONE_PAGE_CHECKLIST.md

---

**Report Generated:** 2025-11-16
**Analysis Tool:** Bash/Grep YAML Validator
**Next Review:** 2025-12-16 (Monthly)

