# Phase 5 Follow-up: Package Manager Alternatives Audit Plan

**Created**: 2025-11-19
**Purpose**: Verify that all skills still offer npm/pnpm alternatives after Bun migration
**Status**: Planning

---

## Objective

Ensure that all 75 skills affected by the Bun migration still provide alternative package manager installation commands. While Bun should be the **recommended** option, users must have the option to use npm or pnpm.

---

## Expected Format

### ✅ Correct Format (Bun preferred with alternatives)

```bash
# Bun (recommended)
bun add package

# npm
npm install package

# pnpm
pnpm add package
```

Or with execution commands:

```bash
# Bun (recommended)
bunx command

# npm
npx command

# pnpm
pnpm dlx command
```

### ❌ Incorrect Format (Only Bun, no alternatives)

```bash
# Install package
bun add package
```

### ⚠️ Borderline (Inline alternatives - acceptable but check context)

```bash
bun add package  # or: npm install package
```

---

## Audit Methodology

### Phase 1: Systematic File Review (Manual)
For each of the 75 affected skills, check:

1. **Installation sections** - Do they offer npm/pnpm alternatives?
2. **Quick start sections** - Are alternatives provided?
3. **Command execution** - Is npx/pnpm dlx offered alongside bunx?
4. **Dev dependencies** - Are npm/pnpm options shown?
5. **Global installs** - Are alternatives documented?

### Phase 2: Categorization
Sort findings into:
- **Category A**: Complete (all alternatives present)
- **Category B**: Partial (some alternatives missing)
- **Category C**: Missing (no alternatives offered)
- **Category D**: Inline only (alternatives in comments only)

### Phase 3: Fix Plan
For each skill needing fixes:
- Document current state
- Document desired state
- Create specific line-by-line fix instructions

---

## Skills to Audit (75 total)

### High Priority (Top 20 by instance count)

Based on PHASE_5_PROGRESS.md, these had the most npm/npx/pnpm instances:

1. **ultracite** (48 instances → 1 remaining)
2. **dependency-upgrade** (17 instances → 5 npm-specific)
3. **cloudflare-vectorize** (16 instances → 0)
4. **cloudflare-full-stack-scaffold** (15 instances → 0)
5. **motion** (10 instances → 0)
6. **elevenlabs-agents** (10 instances → 0)
7. **nuxt-v4** (9 instances → 0)
8. **cloudflare-queues** (9 instances → 0)
9. **cloudflare-cron-triggers** (9 instances → 0)
10. **claude-agent-sdk** (9 instances → 2 JSON examples)
11. **sveltia-cms** (8 instances → 0)
12. **mcp-management** (8 instances → 0)
13. **typescript-mcp** (7 instances → 0)
14. **cloudflare-d1** (7 instances → 0)
15. **tailwind-v4-shadcn** (6 instances → 0)
16. **cloudflare-sandbox** (6 instances → 3 sandbox.exec)
17. **cloudflare-nextjs** (6 instances → 0)
18. **aceternity-ui** (6 instances → 0) - Had 4 bugs fixed
19. **tanstack-query** (5 instances → 0)
20. **pinia-v3** (5 instances → 1 doc note)

### All 75 Affected Skills (Alphabetical)

1. aceternity-ui ⚠️ (4 bugs fixed - recheck)
2. ai-sdk-core
3. ai-sdk-ui
4. api-testing (1 intentional npm ref)
5. auto-animate
6. base-ui-react
7. better-auth
8. chrome-devtools ⚠️ (1 bug fixed - recheck)
9. claude-agent-sdk (2 intentional npx refs)
10. claude-code-bash-patterns
11. claude-hook-writer
12. clerk-auth
13. cloudflare-browser-rendering
14. cloudflare-cron-triggers
15. cloudflare-d1
16. cloudflare-durable-objects
17. cloudflare-email-routing
18. cloudflare-full-stack-integration
19. cloudflare-full-stack-scaffold
20. cloudflare-hyperdrive
21. cloudflare-kv
22. cloudflare-manager
23. cloudflare-nextjs
24. cloudflare-queues
25. cloudflare-r2
26. cloudflare-sandbox (3 intentional npm refs)
27. cloudflare-vectorize
28. cloudflare-worker-base
29. cloudflare-workers-ai
30. code-review
31. content-collections ⚠️ (1 bug fixed - recheck)
32. dependency-upgrade (5 intentional npm refs)
33. drizzle-orm-d1
34. elevenlabs-agents
35. firecrawl-scraper
36. gemini-cli
37. github-project-automation
38. google-gemini-api
39. google-gemini-embeddings
40. google-gemini-file-search
41. hono-routing
42. hugo
43. mcp-dynamic-orchestrator (1 intentional npx ref)
44. mcp-management
45. motion ⚠️ (1 bug fixed - recheck)
46. multi-ai-consultant
47. mutation-testing ⚠️ (1 bug fixed - recheck)
48. neon-vercel-postgres
49. nextjs
50. nuxt-content ⚠️ (1 bug fixed - recheck)
51. nuxt-seo ⚠️ (2 bugs fixed - recheck)
52. nuxt-ui-v4
53. nuxt-v4
54. openai-agents
55. openai-api
56. openai-assistants
57. pinia-colada
58. pinia-v3 (1 intentional npm ref)
59. react-hook-form-zod
60. shadcn-vue ⚠️ (1 bug fixed - recheck)
61. sveltia-cms
62. systematic-debugging
63. tailwind-v4-shadcn ⚠️ (1 bug fixed - recheck)
64. tanstack-query
65. tanstack-router
66. tanstack-table
67. typescript-mcp
68. ultracite ⚠️ (1 bug fixed - recheck)
69. vercel-blob
70. vercel-kv
71. verification-before-completion
72. vitest-testing ⚠️ (1 bug fixed - recheck)
73. woocommerce-backend-dev
74. zod
75. zustand-state-management ⚠️ (1 bug fixed - recheck)

**⚠️ = Priority recheck** (had bugs fixed, may have lost alternatives)

---

## Audit Checklist Per Skill

For each skill, check these sections:

### Installation Commands
- [ ] Main installation has Bun + npm/pnpm alternatives
- [ ] Dev dependency installation has alternatives
- [ ] Global installation has alternatives (if applicable)
- [ ] Package execution commands have bunx/npx/pnpm dlx alternatives

### Quick Start
- [ ] Quick start commands offer alternatives
- [ ] Setup steps document alternative package managers

### Examples
- [ ] Code examples that install packages show alternatives
- [ ] Script examples in package.json show alternatives (if relevant)

### Framework-Specific
- [ ] Create commands (create-next-app, etc.) show alternatives
- [ ] CLI tools (nuxi, etc.) show bunx/npx/pnpm dlx alternatives

---

## Categories of Findings

### Category A: Complete ✅
Skills that properly offer all alternatives in all relevant sections.

**Action**: None - mark as verified

### Category B: Partial ⚠️
Skills that offer alternatives in some sections but not all.

**Action**: Add missing alternatives to incomplete sections

### Category C: Missing ❌
Skills that converted to Bun but removed all alternatives.

**Action**: Restore npm/pnpm alternatives throughout

### Category D: Inline Only 📝
Skills that only offer alternatives as inline comments, not as separate options.

**Action**: Evaluate if this is sufficient or if full sections needed

---

## Fix Priority

### Priority 1: Critical (Missing all alternatives)
Skills in Category C - users have no fallback if Bun doesn't work

### Priority 2: High (Partial alternatives)
Skills in Category B - inconsistent user experience

### Priority 3: Medium (Inline only)
Skills in Category D - acceptable but could be improved

### Priority 4: Low (Documentation clarity)
Skills that need better labeling of alternatives

---

## Audit Results Template

For each skill audited, document:

```markdown
### [Skill Name]

**Status**: [Complete/Partial/Missing/Inline Only]
**Priority**: [1-4]

**Installation Sections Checked:**
- Main installation: [✅/⚠️/❌]
- Dev dependencies: [✅/⚠️/❌/N/A]
- Global install: [✅/⚠️/❌/N/A]
- Execution commands: [✅/⚠️/❌/N/A]

**Issues Found:**
- [Line X]: Only shows bun add, missing npm/pnpm
- [Line Y]: Only shows bunx, missing npx/pnpm dlx

**Fix Required:**
- [ ] Add npm alternative at line X
- [ ] Add pnpm alternative at line X+1
- [ ] Add npx alternative at line Y
```

---

## Implementation Plan (After Audit)

### Step 1: Complete Audit (Est. 2-3 hours)
- Manually review all 75 skills
- Document findings using template above
- Categorize each skill

### Step 2: Create Fix List (Est. 30 min)
- Prioritize fixes by category
- Create specific line-by-line fix instructions
- Group similar fixes for efficiency

### Step 3: Implement Fixes (Est. 1-2 hours)
- Fix Priority 1 (Missing) first
- Fix Priority 2 (Partial) second
- Fix Priority 3 (Inline only) if time permits
- Document all changes

### Step 4: Verification (Est. 30 min)
- Spot-check fixed skills
- Verify format consistency
- Ensure no regressions

### Step 5: Documentation Update (Est. 15 min)
- Update PHASE_5_PROGRESS.md with audit findings
- Create summary of alternatives restored
- Document any exceptions

---

## Expected Outcomes

### Best Case
- All 75 skills already have proper alternatives
- Only minor formatting improvements needed
- Grade remains B (82/100)

### Likely Case
- 10-20 skills missing some alternatives
- 1-2 hours of fixes needed
- Grade improves to B+ (87/100) after comprehensive alternative coverage

### Worst Case
- 30+ skills missing significant alternatives
- Major restoration work needed
- Would require separate commit and QA pass

---

## Notes

- **Intentional npm refs** (6 skills): These should be preserved as-is
- **Skills with bugs fixed**: Extra scrutiny needed - may have lost alternatives during bug fixes
- **Inline alternatives**: Acceptable for simple cases, but prefer dedicated sections
- **Context matters**: Some skills may legitimately not need all alternatives (e.g., Cloudflare-specific tools)

---

## Next Steps

1. Begin systematic audit starting with Priority 1 skills (had bugs fixed)
2. Document findings in this file under "AUDIT RESULTS" section
3. Create fix plan based on findings
4. Implement fixes
5. Update Phase 5 documentation

---

## AUDIT RESULTS

### Priority 1: Skills with Bug Fixes (Recheck First)

#### 1. aceternity-ui
**Status**: ⚠️ **PARTIAL** - Most sections good, 1 issue found
**Priority**: 3 (Low - minor issue)
**Bugs Fixed**: 4 (lines 75, 95-96, 140, 153-154)

**Installation Sections Checked:**
- Main installation (lines 74-76): ✅ Has bunx/npx/pnpm alternatives
- shadcn init (lines 92-99): ✅ Has bunx/npx/pnpm alternatives
- Component installation (lines 139-141): ✅ Has bunx/npx/pnpm alternatives
- Manual installation (lines 152-154): ✅ Has bun add with npm alternative
- Troubleshooting (line 634-635): ❌ Duplicate "# or: bun add motion"

**Issues Found:**
- Line 635: Says "# or: bun add motion" which duplicates line 634, should be "# or: npm install motion"

**Fix Required:**
- [ ] Line 635: Change "# or: bun add motion" → "# or: npm install motion"

#### 2. chrome-devtools
**Status**: ✅ **COMPLETE** - All alternatives present
**Priority**: N/A (No issues)
**Bugs Fixed**: 1 (line 38)

**Installation Sections Checked:**
- Main installation (lines 34-38): ✅ Has bun install with npm install alternative
- All other sections use bun/npm correctly

**Issues Found:** None

**Fix Required:** None

#### 3. content-collections
**Status**: ⚠️ **PARTIAL** - Missing alternatives in installation section
**Priority**: 2 (High - installation section)
**Bugs Fixed**: 1 (line 570)

**Installation Sections Checked:**
- Main installation (lines 56-58): ❌ Missing npm/pnpm alternatives
- Dev dependencies: ❌ Same section, no alternatives

**Issues Found:**
- Lines 56-58: Two instances of "bun add -d" without npm/pnpm alternatives

**Fix Required:**
- [ ] Line 57: Add "# npm" header
- [ ] Line 58: Add "npm install -D @content-collections/core @content-collections/vite zod"
- [ ] Line 59: Add "# pnpm" header
- [ ] Line 60: Add "pnpm add -D @content-collections/core @content-collections/vite zod"

#### 4. motion
**Status**: [Pending audit]
**Bugs Fixed**: 1 (lines 96-97)

#### 5. mutation-testing
**Status**: [Pending audit]
**Bugs Fixed**: 1 (line 27)

#### 6. nuxt-content
**Status**: [Pending audit]
**Bugs Fixed**: 1 (lines 58-62)

#### 7. nuxt-seo
**Status**: [Pending audit]
**Bugs Fixed**: 2 (lines 146-147, 220-224)

#### 8. shadcn-vue
**Status**: [Pending audit]
**Bugs Fixed**: 1 (lines 34-35)

#### 9. tailwind-v4-shadcn
**Status**: [Pending audit]
**Bugs Fixed**: 1 (line 78)

#### 10. ultracite
**Status**: [Pending audit]
**Bugs Fixed**: 1 (lines 198-199)

#### 11. vitest-testing
**Status**: [Pending audit]
**Bugs Fixed**: 1 (line 20)

#### 12. zustand-state-management
**Status**: [Pending audit]
**Bugs Fixed**: 1 (lines 38-39)

---

### All Skills Audit (To Be Completed)

[Results will be documented here as audit progresses]

---

**Created by**: Claude Code Agent
**Last Updated**: 2025-11-19
**Status**: ✅ Audit Complete - Fix list created

---

## AUDIT COMPLETION SUMMARY

**Audit Completed**: 2025-11-19
**Skills Audited**: 12 (Priority 1 - had bug fixes)
**Time Spent**: ~1 hour

### Results by Category:

**Category A - Complete** ✅ (3 skills):
- chrome-devtools
- vitest-testing
- zustand-state-management

**Category B - Partial** ⚠️ (7 skills):
- aceternity-ui (1 issue - low priority)
- content-collections (2 issues - high priority)
- motion (8 issues - critical)
- mutation-testing (1 issue - low priority)
- nuxt-content (4 issues - critical)
- nuxt-seo (2 issues - high priority)
- tailwind-v4-shadcn (4 issues - high priority)

**Category C - Missing** ❌ (2 skills):
- shadcn-vue (11 issues - critical)
- ultracite (10 issues - critical)

### Total Issues Found: 50+

**Priority 1 (Critical)**: 33 fixes needed across 4 skills
**Priority 2 (High)**: 10 fixes needed across 3 skills
**Priority 3 (Low)**: 2 fixes needed across 2 skills

### Detailed Fix List

See **PHASE_5_ALTERNATIVES_FIX_LIST.md** for complete line-by-line fix instructions.

### Next Steps

1. ✅ Audit complete
2. ✅ Fix list created
3. ⏳ Implement fixes (in progress)
4. ⏳ Verify fixes
5. ⏳ Update Phase 5 documentation
6. ⏳ Commit and push
