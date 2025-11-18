# MASTER IMPLEMENTATION PLAN - CLAUDE SKILLS ENHANCEMENT
## Comprehensive Skill-by-Skill Fix Plan with Progress Tracking

**Date Created**: 2025-11-17
**Branch**: `claude/skills-review-improvements-01YUMHnsgHJaDcVi3DAfSEBu`
**Total Skills**: 90
**Total Issues**: 118 anti-patterns + 78 length violations = 196 total issues
**Estimated Total Effort**: 150-180 hours

---

## QUICK NAVIGATION

- [Phase 1: Critical Fixes (Week 1)](#phase-1-critical-fixes-week-1---5-10-hours)
- [Phase 2: Top 10 Critical Skills (Weeks 2-3)](#phase-2-top-10-critical-skills-weeks-2-3---40-50-hours)
- [Phase 3: High Priority Skills (Week 4)](#phase-3-high-priority-skills-week-4---25-hours)
- [Phase 4: Medium Priority Skills (Week 5)](#phase-4-medium-priority-skills-week-5---20-hours)
- [Phase 5: Low Priority Skills (Week 6)](#phase-5-low-priority-skills-week-6---15-hours)
- [Phase 6: Polish & Automation (Week 7)](#phase-6-polish--automation-week-7---10-hours)

---

## PHASE 1: CRITICAL FIXES (Week 1) - 5-10 hours

### BLOCKING ISSUES - Fix First

---

#### 1. feature-dev - MISSING ENTIRE SKILL.MD FILE
**Priority**: CRITICAL ❗❗❗
**File**: `/home/user/claude-skills/skills/feature-dev/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 30-45 minutes

**Issues**:
- [ ] No SKILL.md file exists - skill completely invisible to Claude
- [ ] Has README.md, agents/, commands/ but no discovery mechanism

**Actions**:
1. [ ] Create `/home/user/claude-skills/skills/feature-dev/SKILL.md`
2. [ ] Add YAML frontmatter with name, description, license
3. [ ] Extract content from README.md
4. [ ] Add "Use when" scenarios
5. [ ] Document 7 slash commands
6. [ ] Add verification section

**Template**:
```yaml
---
name: feature-dev
description: |
  Automate complete feature development lifecycle with 7 integrated slash commands
  for planning, development, testing, and deployment. Use when starting new features,
  managing development branches, creating pull requests, handling code reviews, and
  deploying features safely. Includes feature planning, session management, safe
  merges, and deployment validation.

  Keywords: feature development, slash commands, git workflow, pr automation, feature branches
license: MIT
allowed-tools: ["Read", "Write", "Edit", "Bash"]
---
```

**Verification**:
- [ ] File exists: `ls -la skills/feature-dev/SKILL.md`
- [ ] YAML valid: `head -20 skills/feature-dev/SKILL.md`
- [ ] Skill discoverable by Claude

---

#### 2. cloudflare-manager - MISSING LICENSE FIELD
**Priority**: CRITICAL ❗❗
**File**: `/home/user/claude-skills/skills/cloudflare-manager/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 2 minutes

**Issues**:
- [ ] Missing `license: MIT` field in YAML frontmatter (line 2)
- [ ] Violates official Anthropic spec

**Actions**:
1. [ ] Open file: `skills/cloudflare-manager/SKILL.md`
2. [ ] After line 2 (`name: cloudflare-manager`), add: `license: MIT`
3. [ ] Verify YAML parses correctly

**Before**:
```yaml
---
name: Cloudflare Manager
description: |
  ...
---
```

**After**:
```yaml
---
name: cloudflare-manager
description: |
  ...
license: MIT
---
```

**Note**: Also fix name format from `Cloudflare Manager` → `cloudflare-manager`

---

#### 3. dependency-upgrade - MISSING LICENSE FIELD
**Priority**: CRITICAL ❗❗
**File**: `/home/user/claude-skills/skills/dependency-upgrade/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 2 minutes

**Issues**:
- [ ] Missing `license: MIT` field

**Actions**:
1. [ ] Add `license: MIT` after line 2

---

#### 4. frontend-design - MISSING LICENSE + ERROR HANDLING + VERIFICATION
**Priority**: CRITICAL ❗❗
**File**: `/home/user/claude-skills/skills/frontend-design/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 2-3 hours

**Issues**:
- [ ] Missing `license: MIT` field
- [ ] No error handling section (only 42 lines - design philosophy)
- [ ] No verification/validation patterns

**Actions**:
1. [ ] Add `license: MIT` to frontmatter
2. [ ] Add section: "## Common Design Issues"
   - [ ] Inconsistent spacing/sizing
   - [ ] Poor color contrast
   - [ ] Accessibility violations
   - [ ] Responsive breakpoint failures
3. [ ] Add section: "## Design Validation Checklist"
   - [ ] Color contrast meets WCAG AA
   - [ ] Responsive at 320px, 768px, 1024px, 1440px
   - [ ] Focus states visible
   - [ ] Typography scale consistent

**Verification**:
- [ ] License field present
- [ ] Error handling section exists (>50 lines)
- [ ] Validation checklist present

---

#### 5. nano-banana-prompts - MISSING LICENSE + ERROR HANDLING + VERIFICATION
**Priority**: CRITICAL ❗❗
**File**: `/home/user/claude-skills/skills/nano-banana-prompts/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 2-3 hours

**Issues**:
- [ ] Missing `license: MIT` field
- [ ] No error handling/troubleshooting
- [ ] No prompt validation guidance

**Actions**:
1. [ ] Add `license: MIT` to frontmatter
2. [ ] Add section: "## Prompt Validation"
   - [ ] Check prompt length limits
   - [ ] Validate image parameters
   - [ ] Test prompt effectiveness
3. [ ] Add section: "## Common Issues"
   - [ ] Prompt too vague/generic
   - [ ] Parameter conflicts
   - [ ] Image generation failures
4. [ ] Improve description opening (currently weak)

**Current Description Opening**:
> "Generate optimized prompts for Gemini..."

**Improved**:
> "Generate production-ready image generation prompts optimized for Google Gemini
> with nano-banana prompt engineering framework..."

---

#### 6. project-workflow - MISSING YAML FRONTMATTER ENTIRELY
**Priority**: CRITICAL ❗❗
**File**: `/home/user/claude-skills/skills/project-workflow/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 15 minutes

**Issues**:
- [ ] File starts with `# Project Workflow Skill` instead of YAML
- [ ] No frontmatter at all
- [ ] Missing license field

**Current Structure**:
```markdown
# Project Workflow Skill

**Complete project lifecycle automation...**
```

**Fixed Structure**:
```yaml
---
name: project-workflow
description: |
  Automate complete project lifecycle from planning to deployment with 7 integrated
  slash commands. Use when starting projects, planning features, managing development
  sessions, ensuring safe releases, and coordinating multi-phase workflows. Includes
  /start-project, /plan-feature, /safe-merge, /prepare-release, and session management.

  Keywords: project workflow, lifecycle automation, slash commands, release management
license: MIT
allowed-tools: ["Read", "Write", "Edit", "Bash"]
---

# Project Workflow Skill

[Rest of content...]
```

---

#### 7. motion - FIX YAML DELIMITER ORDER
**Priority**: CRITICAL ❗❗
**File**: `/home/user/claude-skills/skills/motion/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 5 minutes

**Issues**:
- [ ] H1 heading appears BEFORE YAML frontmatter
- [ ] Invalid structure breaks parsing

**Current (WRONG)**:
```markdown
# Motion Animation Library

---
name: motion
description: |
  ...
license: MIT
---

[Content...]
```

**Fixed (CORRECT)**:
```markdown
---
name: motion
description: |
  Production-ready setup for Motion (formerly Framer Motion)...
license: MIT
---

# Motion Animation Library

[Content...]
```

**Actions**:
1. [ ] Move line 1 (`# Motion Animation Library`) to after closing `---`
2. [ ] Ensure YAML frontmatter is first content in file

---

### YAML NAME FORMAT FIXES (7 skills)

All need `name:` field changed from Title Case to lowercase-kebab-case.

---

#### 8. cloudflare-manager - FIX NAME FORMAT
**File**: `skills/cloudflare-manager/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 1 minute

- [ ] Change line 2: `name: Cloudflare Manager` → `name: cloudflare-manager`

---

#### 9. gemini-cli - FIX NAME FORMAT
**File**: `skills/gemini-cli/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 1 minute

- [ ] Change line 2: `name: Gemini CLI` → `name: gemini-cli`

---

#### 10. multi-ai-consultant - FIX NAME FORMAT
**File**: `skills/multi-ai-consultant/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 1 minute

- [ ] Change line 2: `name: Multi-AI Consultant` → `name: multi-ai-consultant`

---

#### 11. nuxt-v4 - FIX NAME FORMAT
**File**: `skills/nuxt-v4/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 1 minute

- [ ] Change line 2: `name: Nuxt 4` → `name: nuxt-v4`

---

#### 12. tanstack-router - FIX NAME FORMAT
**File**: `skills/tanstack-router/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 1 minute

- [ ] Change line 2: `name: TanStack Router` → `name: tanstack-router`

---

#### 13. tanstack-start - FIX NAME FORMAT + MISSING DESCRIPTION
**File**: `skills/tanstack-start/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 15 minutes

- [ ] Change line 2: `name: TanStack Start` → `name: tanstack-start`
- [ ] Add complete description field:

```yaml
description: |
  Build full-stack applications with TanStack Start framework combining TanStack Router,
  Server Functions, and integrated styling. Use when building full-stack apps with
  TanStack ecosystem, implementing Server Functions for API routes, creating file-based
  routing patterns, or configuring deployments for Cloudflare Workers, Node.js, and
  edge runtimes.

  Keywords: tanstack start, full-stack framework, server functions, tanstack router
```

---

#### 14. tanstack-table - FIX NAME FORMAT
**File**: `skills/tanstack-table/SKILL.md`
**Status**: ⬜ NOT STARTED
**Effort**: 1 minute

- [ ] Change line 2: `name: TanStack Table` → `name: tanstack-table`

---

### PHASE 1 SUMMARY

**Total Skills Fixed**: 14
**Total Issues Resolved**: 22
**Estimated Effort**: 5-10 hours
**Deliverables**:
- [ ] All 5 missing license fields added
- [ ] feature-dev SKILL.md created
- [ ] All 7 name format issues fixed
- [ ] 2 YAML structure issues resolved
- [ ] 2 skills have error handling sections
- [ ] All critical blocking issues resolved

**Verification Commands**:
```bash
# Check all Phase 1 fixes
cd /home/user/claude-skills

# Verify license fields
grep -l "license: MIT" skills/cloudflare-manager/SKILL.md
grep -l "license: MIT" skills/dependency-upgrade/SKILL.md
grep -l "license: MIT" skills/frontend-design/SKILL.md
grep -l "license: MIT" skills/nano-banana-prompts/SKILL.md
grep -l "license: MIT" skills/project-workflow/SKILL.md
grep -l "license: MIT" skills/feature-dev/SKILL.md

# Verify name formats
head -5 skills/cloudflare-manager/SKILL.md | grep "name: cloudflare-manager"
head -5 skills/gemini-cli/SKILL.md | grep "name: gemini-cli"
head -5 skills/tanstack-start/SKILL.md | grep "name: tanstack-start"

# Verify YAML structure
head -1 skills/motion/SKILL.md | grep "^---$"
head -1 skills/project-workflow/SKILL.md | grep "^---$"

# Overall compliance check
./scripts/check-yaml-compliance.sh
```

---

## PHASE 2: TOP 10 CRITICAL SKILLS (Weeks 2-3) - 40-50 hours

### These skills have the most severe length violations and highest token waste

**Strategy**: Extract content to `references/` and `templates/`, condense SKILL.md to <500 lines

---

### SKILL 1/10: fastmcp - WORST IN ENTIRE REPO
**Priority**: CRITICAL ❗❗❗
**File**: `/home/user/claude-skills/skills/fastmcp/SKILL.md`
**Current**: 2,609 lines (522% over limit)
**Target**: 400 lines
**Savings**: 2,209 lines (85% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 6 hours

**Issues**:
- [ ] 2,609 lines - worst skill in entire repository
- [ ] Missing keywords separator in frontmatter
- [ ] Non-standard metadata structure
- [ ] No progressive disclosure despite massive size
- [ ] Time-sensitive information embedded

**Refactoring Plan**:

**Step 1: Analysis** (30 min)
- [ ] Read entire file, identify major sections
- [ ] Map content to references vs templates vs core
- [ ] Identify duplication

**Step 2: Create Directory Structure** (15 min)
```bash
cd skills/fastmcp
mkdir -p references templates/examples scripts
```

**Step 3: Extract API Reference** (2 hours)
- [ ] Lines 150-600 → `references/api-reference.md`
- [ ] Lines 850-1200 → `references/advanced-patterns.md`
- [ ] Lines 1400-1800 → `references/error-handling.md`
- [ ] Update SKILL.md with references: "See `references/api-reference.md`"

**Step 4: Extract Code Examples** (2 hours)
- [ ] All complete code blocks (50+ lines) → `templates/examples/`
- [ ] Create:
  - `templates/basic-server.py`
  - `templates/advanced-server.py`
  - `templates/tool-definitions.py`
  - `templates/error-handling.py`

**Step 5: Condense SKILL.md** (1 hour)
- [ ] Keep Quick Start (100 lines)
- [ ] Keep Core Patterns (150 lines)
- [ ] Keep Top 3 Errors (100 lines)
- [ ] Add References section (50 lines)
- [ ] Target: ~400 lines total

**Step 6: Fix Frontmatter** (30 min)
- [ ] Fix keywords separator
- [ ] Standardize metadata
- [ ] Add `allowed-tools`
- [ ] Remove time-sensitive dates

**Expected Structure**:
```
fastmcp/
├── SKILL.md (400 lines)
├── README.md
├── references/
│   ├── api-reference.md (~450 lines)
│   ├── advanced-patterns.md (~400 lines)
│   ├── error-handling.md (~350 lines)
│   └── best-practices.md (~300 lines)
├── templates/
│   ├── basic-server.py
│   ├── advanced-server.py
│   ├── tool-definitions.py
│   └── examples/
│       ├── context-integration.py
│       └── streaming-responses.py
└── scripts/
    ├── setup.sh
    └── check-fastmcp-version.sh
```

**Verification**:
- [ ] SKILL.md < 500 lines
- [ ] All references load correctly
- [ ] Templates executable
- [ ] No content duplication
- [ ] Skill still discoverable

---

### SKILL 2/10: elevenlabs-agents
**Priority**: CRITICAL ❗❗
**File**: `/home/user/claude-skills/skills/elevenlabs-agents/SKILL.md`
**Current**: 2,487 lines (497% over limit)
**Target**: 450 lines
**Savings**: 2,037 lines (82% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 6 hours

**Issues**:
- [ ] 2,487 lines total
- [ ] 17 errors embedded inline (339 lines of error docs!)
- [ ] Complete API documentation duplicated
- [ ] Time-sensitive references

**Key Extractions**:
- [ ] Lines 500-838 (17 errors) → `references/common-errors.md`
- [ ] Lines 150-420 (API setup) → `references/api-reference.md`
- [ ] Lines 950-1450 (conversation flow) → `references/conversation-patterns.md`
- [ ] Lines 1600-2100 (complete examples) → `templates/`

**Actions**:
1. [ ] Create references/ directory
2. [ ] Extract all 17 errors to common-errors.md
3. [ ] Keep only top 3 errors in SKILL.md
4. [ ] Extract API docs to references
5. [ ] Move complete examples to templates
6. [ ] Condense to 450 lines

---

### SKILL 3/10: nextjs
**Priority**: CRITICAL ❗❗
**File**: `/home/user/claude-skills/skills/nextjs/SKILL.md`
**Current**: 2,414 lines (483% over limit)
**Target**: 450 lines
**Savings**: 1,964 lines (81% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 5 hours

**Issues**:
- [ ] 2,414 lines
- [ ] Description starts with "Use this skill for..." instead of explaining what
- [ ] Missing "when to use" clarity
- [ ] Time-sensitive version info
- [ ] Second-person language throughout

**Key Extractions**:
- [ ] App Router documentation → `references/app-router.md`
- [ ] Server Components guide → `references/server-components.md`
- [ ] All routing examples → `templates/routing/`
- [ ] API route examples → `templates/api-routes/`

**Description Fix**:

**Current**:
> "Use this skill for building Next.js 15 applications..."

**Fixed**:
> "Build production Next.js applications with App Router, Server Components, Server Actions,
> and ISR. Use when creating Next.js projects, implementing file-based routing, building
> React Server Components, configuring API routes, or deploying to Vercel/Cloudflare."

---

### SKILL 4/10: nuxt-content
**Priority**: HIGH ❗
**File**: `/home/user/claude-skills/skills/nuxt-content/SKILL.md`
**Current**: 2,213 lines (443% over limit)
**Target**: 450 lines
**Savings**: 1,763 lines (80% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 5 hours

**Key Extractions**:
- [ ] Content parsing docs → `references/content-parsing.md`
- [ ] Query builder reference → `references/query-builder.md`
- [ ] Markdown extensions → `references/markdown-extensions.md`
- [ ] Complete examples → `templates/`

---

### SKILL 5/10: shadcn-vue
**Priority**: HIGH ❗
**File**: `/home/user/claude-skills/skills/shadcn-vue/SKILL.md`
**Current**: 2,205 lines (441% over limit)
**Target**: 450 lines
**Savings**: 1,755 lines (80% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 5 hours

**Key Extractions**:
- [ ] Component catalog → `references/component-catalog.md`
- [ ] Theming guide → `references/theming.md`
- [ ] Each component example → `templates/components/`

---

### SKILL 6/10: google-gemini-api
**Priority**: HIGH ❗
**File**: `/home/user/claude-skills/skills/google-gemini-api/SKILL.md`
**Current**: 2,126 lines (425% over limit)
**Target**: 450 lines
**Savings**: 1,676 lines (79% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 4 hours

**Special Issue**: **1,656 lines of pure duplication**
- [ ] Has 15 templates + 11 references already created
- [ ] Problem: 1,656 lines duplicate those files
- [ ] **Quick win**: Remove duplicates → 470 lines (78% savings, 2 hours)

**Actions**:
1. [ ] Identify all duplicated content
2. [ ] Remove inline duplicates
3. [ ] Add references to existing files
4. [ ] Verify all templates still work

---

### SKILL 7/10: openai-api
**Priority**: HIGH ❗
**File**: `/home/user/claude-skills/skills/openai-api/SKILL.md`
**Current**: 2,113 lines (423% over limit)
**Target**: 450 lines
**Savings**: 1,663 lines (79% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 4 hours

**Issues**:
- [ ] 2,113 lines
- [ ] Acts as API documentation clone
- [ ] Time-sensitive: "Latest model (November 2024)" on line 1285
- [ ] Second-person language
- [ ] No verification section

**Key Extractions**:
- [ ] Chat Completions API → `references/chat-api.md`
- [ ] Embeddings API → `references/embeddings-api.md`
- [ ] Vision API → `references/vision-api.md`
- [ ] All errors → `references/common-errors.md`

**Actions**:
1. [ ] Remove date reference on line 1285
2. [ ] Extract API docs to references
3. [ ] Add verification section
4. [ ] Fix third-person voice

---

### SKILL 8/10: cloudflare-agents
**Priority**: HIGH ❗
**File**: `/home/user/claude-skills/skills/cloudflare-agents/SKILL.md`
**Current**: 2,066 lines (413% over limit)
**Target**: 450 lines
**Savings**: 1,616 lines (78% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 4 hours

**Issues**:
- [ ] 2,066 lines
- [ ] Claims progressive disclosure but doesn't use it
- [ ] Lists references on lines 383-407 but embeds content inline anyway
- [ ] "False progressive disclosure" anti-pattern

**Actions**:
1. [ ] Actually extract content to listed references
2. [ ] Remove inline content
3. [ ] Keep only references in SKILL.md
4. [ ] Verify all reference files exist and are correct

---

### SKILL 9/10: cloudflare-mcp-server
**Priority**: HIGH ❗
**File**: `/home/user/claude-skills/skills/cloudflare-mcp-server/SKILL.md`
**Current**: 1,977 lines (395% over limit)
**Target**: 450 lines
**Savings**: 1,527 lines (77% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 4 hours

**Key Extractions**:
- [ ] MCP protocol reference → `references/mcp-protocol.md`
- [ ] Tool definitions → `references/tool-definitions.md`
- [ ] Complete server examples → `templates/`

---

### SKILL 10/10: thesys-generative-ui
**Priority**: HIGH ❗
**File**: `/home/user/claude-skills/skills/thesys-generative-ui/SKILL.md`
**Current**: 1,877 lines (375% over limit)
**Target**: 450 lines
**Savings**: 1,427 lines (76% reduction)
**Status**: ⬜ NOT STARTED
**Effort**: 4 hours

**Issues**:
- [ ] 1,877 lines
- [ ] 175 lines of tool calling implementation inline
- [ ] Has templates/ directory but doesn't use it

**Actions**:
1. [ ] Extract tool calling implementation to `templates/tool-calling.tsx`
2. [ ] Extract UI generation patterns to `templates/ui-patterns/`
3. [ ] Move complete examples to templates
4. [ ] Reference templates in SKILL.md

---

### PHASE 2 SUMMARY

**Total Skills Fixed**: 10
**Total Lines Reduced**: 17,633 lines → ~4,500 lines
**Average Reduction**: 79%
**Estimated Effort**: 40-50 hours

**Deliverables**:
- [ ] All 10 skills under 500 lines
- [ ] ~55 new reference documents created
- [ ] ~80 new template files created
- [ ] All duplicated content removed
- [ ] Progressive disclosure fully implemented
- [ ] Token savings: ~13,000 lines (60% of total excess)

**Verification**:
```bash
# Check line counts
wc -l skills/fastmcp/SKILL.md  # Should be ~400
wc -l skills/elevenlabs-agents/SKILL.md  # Should be ~450
wc -l skills/nextjs/SKILL.md  # Should be ~450

# Verify references exist
ls -la skills/fastmcp/references/
ls -la skills/elevenlabs-agents/references/
ls -la skills/nextjs/references/

# Verify templates exist
ls -la skills/fastmcp/templates/
ls -la skills/google-gemini-api/templates/

# Test skill discovery
# Ask Claude: "Help me set up FastMCP server"
# Verify skill is proposed and loads correctly
```

---

## PHASE 3: HIGH PRIORITY SKILLS (Week 4) - 25 hours

### 23 Skills: 800-1,500 lines each

Similar refactoring pattern to Phase 2 but less extreme.

---

### SKILL 11: ai-sdk-core
**File**: `skills/ai-sdk-core/SKILL.md`
**Current**: 1,432 lines | **Target**: 450 lines | **Savings**: 982 lines
**Status**: ⬜ NOT STARTED | **Effort**: 3 hours

**Issues**:
- [ ] Time-sensitive info (lines 617-618)
- [ ] No verification section
- [ ] Description uses passive "Backend AI functionality with..."

**Actions**:
1. [ ] Fix description: "Build server-side AI features with Vercel AI SDK v5..."
2. [ ] Remove time-sensitive references
3. [ ] Add verification section
4. [ ] Extract to references/

---

### SKILL 12: openai-assistants
**File**: `skills/openai-assistants/SKILL.md`
**Current**: 1,419 lines | **Target**: 450 lines | **Savings**: 969 lines
**Status**: ⬜ NOT STARTED | **Effort**: 3 hours

**Issues**:
- [ ] Hard-coded deprecation dates (lines 27, 37-39)
- [ ] Second-person: "Should you still use this skill?" (lines 41-45)
- [ ] No verification section
- [ ] Description: "Complete guide for..." (passive)

**Actions**:
1. [ ] Move dates to metadata
2. [ ] Rewrite in third-person
3. [ ] Fix description: "Build stateful conversational AI with OpenAI Assistants API..."
4. [ ] Add verification section
5. [ ] Extract API docs to references

---

### SKILL 13-33: Remaining High Priority Skills

All follow similar pattern. Details in separate tracking document.

Quick list:
- [ ] ai-sdk-ui (1,330 lines → 450)
- [ ] openai-responses (1,297 lines → 450)
- [ ] sveltia-cms (1,833 lines → 450)
- [ ] project-planning (1,231 lines → 450)
- [ ] nuxt-ui-v4 (1,183 lines → 450)
- [ ] cloudflare-d1 (1,130 lines → 450)
- [ ] cloudflare-workflows (1,063 lines → 450)
- [ ] cloudflare-sandbox (998 lines → 450)
- [ ] cloudflare-full-stack-scaffold (983 lines → 450)
- [ ] drizzle-orm-d1 (935 lines → 450)
- [ ] tailwind-v4-shadcn (932 lines → 450)
- [ ] google-gemini-file-search (922 lines → 450)
- [ ] cloudflare-vectorize (900 lines → 450)
- [ ] cloudflare-workers-ai (890 lines → 450)
- [ ] nuxt-v4 (867 lines → 450)
- [ ] cloudflare-kv (852 lines → 450)
- [ ] github-project-automation (846 lines → 450)
- [ ] cloudflare-r2 (834 lines → 450)
- [ ] hugo (818 lines → 450)
- [ ] cloudflare-worker-base (777 lines → 450)
- [ ] aceternity-ui (751 lines → 450)

---

## PHASE 4: MEDIUM PRIORITY SKILLS (Week 5) - 20 hours

### 18 Skills: 600-800 lines each

---

### SKILL 34-51: Medium Priority List

- [ ] clerk-auth (726 lines → 450)
- [ ] cloudflare-email-routing (711 lines → 450)
- [ ] cloudflare-hyperdrive (710 lines → 450)
- [ ] better-auth (699 lines → 450)
- [ ] typescript-mcp (697 lines → 450)
- [ ] cloudflare-zero-trust-access (685 lines → 450)
- [ ] cloudflare-browser-rendering (683 lines → 450)
- [ ] openai-agents (682 lines → 450)
- [ ] google-gemini-embeddings (668 lines → 450)
- [ ] skill-review (663 lines → 450)
- [ ] claude-api (641 lines → 450)
- [ ] content-collections (632 lines → 450)
- [ ] cloudflare-durable-objects (619 lines → 450)
- [ ] base-ui-react (617 lines → 450)
- [ ] cloudflare-queues (615 lines → 450)
- [ ] inspira-ui (601 lines → 450)
- [ ] shadcn-vue (2,205 lines → 450) - duplicate from Phase 2?
- [ ] cloudflare-images (580 lines → 450)

---

## PHASE 5: LOW PRIORITY SKILLS (Week 6) - 15 hours

### 15 Skills: 500-600 lines each

Minor optimization needed.

---

### SKILL 52-66: Low Priority List

- [ ] nuxt-seo (572 lines → 450)
- [ ] better-chatbot-patterns (565 lines → 450)
- [ ] zod (558 lines → 450)
- [ ] vercel-kv (556 lines → 450)
- [ ] dependency-upgrade (554 lines → 450)
- [ ] nuxt-content (2,213 lines → 450) - duplicate from Phase 2?
- [ ] swift-best-practices (276 lines) - ✅ Already under limit
- [ ] react-hook-form-zod (524 lines → 450)
- [ ] wordpress-plugin-core (521 lines → 450)
- [ ] pinia-colada (517 lines → 450)
- [ ] cloudflare-cron-triggers (515 lines → 450)
- [ ] cloudflare-full-stack-integration (411 lines) - ✅ Already under limit
- [ ] tanstack-query (502 lines → 450)
- [ ] cloudflare-manager (454 lines) - ✅ Already under limit
- [ ] firecrawl-scraper (446 lines) - ✅ Already under limit

---

## PHASE 6: POLISH & AUTOMATION (Week 7) - 10 hours

### Quality Assurance & Automation

---

### 1. Description Quality Fixes (23 skills)

**Reference**: `SKILL_FILES_TO_FIX.txt`

**GROUP 1: Missing "What Does" Opening (18 skills)**

- [ ] ai-sdk-core - "Build server-side AI features with..."
- [ ] ai-sdk-ui - "Create AI chat interfaces with..."
- [ ] cloudflare-browser-rendering - "Automate browser tasks with..."
- [ ] cloudflare-cron-triggers - "Schedule Workers with cron..."
- [ ] cloudflare-d1 - "Configure and query D1 databases..."
- [ ] cloudflare-email-routing - "Set up email routing and delivery..."
- [ ] cloudflare-hyperdrive - "Connect Workers to PostgreSQL/MySQL..."
- [ ] cloudflare-kv - "Store and retrieve data with KV..."
- [ ] cloudflare-queues - "Build reliable message queues..."
- [ ] cloudflare-r2 - "Store and serve files with R2..."
- [ ] cloudflare-vectorize - "Build RAG systems with embeddings..."
- [ ] cloudflare-workers-ai - "Run ML models on Workers..."
- [ ] firecrawl-scraper - "Scrape and extract web content..."
- [ ] nano-banana-prompts - "Generate production-ready prompts..."
- [ ] openai-api - "Integrate OpenAI Chat, Embeddings, Vision..."
- [ ] openai-assistants - "Build stateful AI with Assistants API..."
- [ ] project-workflow - [Add complete description]
- [ ] sveltia-cms - "Manage Git-backed content with Sveltia..."

**GROUP 2: First/Second Person Issues (3 skills)**

- [ ] better-chatbot-patterns - Change "your own projects" to "custom codebases"
- [ ] cloudflare-workflows - "Build durable workflows on Workers..."
- [ ] open-source-contributions - "Guide developers through OSS contributions..."

**GROUP 3: Missing "When to Use" (1 skill)**

- [ ] nextjs - Restructure to explain capabilities first, then scenarios

**GROUP 4: Vague Language (1 skill)**

- [ ] multi-ai-consultant - Change "suggests" to "routes queries to"

---

### 2. Time-Sensitive Information Removal (29 skills)

**Strategy**:
- Replace "as of 2024" → "currently"
- Replace "Latest model (November 2024)" → "Latest production model"
- Move deprecation dates to metadata
- Use version numbers instead of dates

**Affected Skills**:
- [ ] ai-sdk-core
- [ ] better-auth
- [ ] claude-api
- [ ] clerk-auth
- [ ] cloudflare-d1
- [ ] cloudflare-durable-objects
- [ ] cloudflare-email-routing
- [ ] cloudflare-hyperdrive
- [ ] cloudflare-manager
- [ ] cloudflare-mcp-server
- [ ] cloudflare-r2
- [ ] cloudflare-sandbox
- [ ] cloudflare-vectorize
- [ ] cloudflare-worker-base
- [ ] cloudflare-workflows
- [ ] drizzle-orm-d1
- [ ] github-project-automation
- [ ] google-gemini-api
- [ ] hugo
- [ ] nuxt-content
- [ ] nuxt-ui-v4
- [ ] nuxt-v4
- [ ] openai-api
- [ ] openai-assistants
- [ ] openai-responses
- [ ] skill-review
- [ ] zod

**Effort**: 15-30 min per skill | **Total**: ~20 hours

---

### 3. Add Verification Sections (21 skills)

**Template**:
```markdown
## Verification Checklist

After setup, verify the installation:

- [ ] Dependencies installed correctly
  ```bash
  npm ls [package-name]
  # Should show version matching requirements
  ```

- [ ] Configuration files present
  - Check: [list config files]
  - Verify: Settings match templates

- [ ] Test execution
  ```bash
  [command to run test]
  ```

- [ ] Expected output
  - Should see: [describe success output]
  - No errors in console
  - [Feature] working as expected
```

**Skills Missing Verification**:
- [ ] ai-sdk-core
- [ ] ai-sdk-ui
- [ ] cloudflare-d1
- [ ] cloudflare-full-stack-scaffold
- [ ] cloudflare-kv
- [ ] cloudflare-nextjs
- [ ] cloudflare-vectorize
- [ ] cloudflare-workers-ai
- [ ] dependency-upgrade
- [ ] frontend-design
- [ ] mcp-dynamic-orchestrator
- [ ] motion
- [ ] nano-banana-prompts
- [ ] openai-api
- [ ] openai-assistants
- [ ] openai-responses
- [ ] project-workflow
- [ ] react-hook-form-zod
- [ ] tanstack-router
- [ ] tanstack-start
- [ ] tanstack-table
- [ ] vercel-kv
- [ ] zod

**Effort**: 30-45 min per skill | **Total**: ~20 hours

---

### 4. Add Dependency Declarations (31 skills)

**Template**:
```markdown
## Dependencies & Installation

### Required Packages

- `package-name@^1.0.0` - What it does
- `another-package@^2.0.0` - What it does

### Installation

```bash
# Using Bun (recommended)
bun add package-name another-package

# Using npm
npm install package-name another-package

# Using pnpm
pnpm add package-name another-package
```

### Version Requirements

- Node.js: >=18.0.0
- [Framework]: ^X.Y.Z
```

**Skills Missing Dependencies Section**:
All 31 skills listed in AUDIT_REPORT_2025-11-16.md

**Effort**: 15-30 min per skill | **Total**: ~15 hours

---

### 5. Pre-Commit Hook & Automation

**Create Pre-Commit Hook**:

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Validating skills..."

ERRORS=0

# Check all SKILL.md files
for skill in skills/*/SKILL.md; do
  if [ -f "$skill" ]; then
    # Check license field
    if ! grep -q "license:" "$skill"; then
      echo "❌ Missing license: $skill"
      ERRORS=$((ERRORS + 1))
    fi

    # Check YAML starts file
    if ! head -1 "$skill" | grep -q "^---$"; then
      echo "❌ Invalid YAML: $skill"
      ERRORS=$((ERRORS + 1))
    fi

    # Check line count
    LINES=$(wc -l < "$skill")
    if [ "$LINES" -gt 500 ]; then
      echo "⚠️  Over 500 lines ($LINES): $skill"
    fi
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Found $ERRORS errors. Fix before committing."
  exit 1
fi

echo "✅ All skills valid"
exit 0
```

**Tasks**:
- [ ] Create `.git/hooks/pre-commit`
- [ ] Make executable: `chmod +x .git/hooks/pre-commit`
- [ ] Test with intentional error
- [ ] Document in CONTRIBUTING.md

---

### 6. Automated Testing

**Create Skill Discovery Test**:

```bash
#!/bin/bash
# scripts/test-skill-discovery.sh

# Test that all skills are discoverable

echo "Testing skill discovery..."

FAILED=0

for skill_dir in skills/*/; do
  skill_name=$(basename "$skill_dir")
  skill_file="$skill_dir/SKILL.md"

  if [ ! -f "$skill_file" ]; then
    echo "❌ Missing SKILL.md: $skill_name"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Extract name from YAML
  yaml_name=$(grep "^name:" "$skill_file" | cut -d: -f2 | xargs)

  if [ "$yaml_name" != "$skill_name" ]; then
    echo "❌ Name mismatch: directory=$skill_name yaml=$yaml_name"
    FAILED=$((FAILED + 1))
  fi
done

if [ $FAILED -eq 0 ]; then
  echo "✅ All $(($(ls -d skills/*/ | wc -l))) skills discoverable"
  exit 0
else
  echo "❌ $FAILED skills failed discovery test"
  exit 1
fi
```

**Tasks**:
- [ ] Create `scripts/test-skill-discovery.sh`
- [ ] Make executable
- [ ] Run test suite
- [ ] Add to CI/CD if available

---

### 7. Update Documentation

**Tasks**:
- [ ] Update CLAUDE.md with new stats
- [ ] Update README.md
- [ ] Update ONE_PAGE_CHECKLIST.md
- [ ] Update planning/skills-roadmap.md
- [ ] Create REFACTORING_GUIDE.md for future skills

---

### 8. Regenerate Marketplace

```bash
cd /home/user/claude-skills
./scripts/generate-marketplace.sh
```

**Tasks**:
- [ ] Run marketplace generation
- [ ] Verify count: `jq '.plugins | length' .claude-plugin/marketplace.json`
- [ ] Should show: 90
- [ ] Commit marketplace.json

---

### 9. Final Compliance Check

```bash
# Run complete audit
./scripts/check-yaml-compliance.sh > audit-final.txt

# Compare before/after
diff skills-review/AUDIT_REPORT_2025-11-16.md audit-final.txt
```

**Expected Results**:
- YAML compliance: 85.6% → 100%
- Skills under 500 lines: 13.3% → 100%
- Zero anti-patterns: 27.8% → 100%
- Average skill length: 1,017 lines → ~400 lines

**Tasks**:
- [ ] Run final audit
- [ ] Compare metrics
- [ ] Document improvements
- [ ] Celebrate! 🎉

---

## PROGRESS TRACKING

### Overall Completion

**Phase 1: Critical Fixes**
- Progress: ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0/14 skills (0%)
- Estimated: 5-10 hours | Actual: ___ hours

**Phase 2: Top 10 Critical**
- Progress: ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0/10 skills (0%)
- Estimated: 40-50 hours | Actual: ___ hours

**Phase 3: High Priority**
- Progress: ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0/23 skills (0%)
- Estimated: 25 hours | Actual: ___ hours

**Phase 4: Medium Priority**
- Progress: ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0/18 skills (0%)
- Estimated: 20 hours | Actual: ___ hours

**Phase 5: Low Priority**
- Progress: ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0/15 skills (0%)
- Estimated: 15 hours | Actual: ___ hours

**Phase 6: Polish & Automation**
- Progress: ⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0/9 tasks (0%)
- Estimated: 10 hours | Actual: ___ hours

**TOTAL PROGRESS**: 0/90 skills (0%)
**Total Estimated**: 150-180 hours
**Total Actual**: ___ hours

---

## COMMIT STRATEGY

### After Each Phase

**Phase 1 Commit**:
```bash
git add skills/*/SKILL.md
git commit -m "Phase 1: Fix critical YAML and license issues

- Create feature-dev SKILL.md
- Add missing license fields to 5 skills
- Fix YAML frontmatter in motion and project-workflow
- Fix name format in 7 skills (Title Case → kebab-case)
- Add error handling to frontend-design and nano-banana-prompts

Fixes: 22 critical issues
Skills affected: 14
Compliance rate: 85.6% → 95%"

git push -u origin claude/skills-review-improvements-01YUMHnsgHJaDcVi3DAfSEBu
```

**Phase 2 Commit** (after each skill):
```bash
git add skills/fastmcp/
git commit -m "Refactor fastmcp skill: 2,609 → 400 lines (85% reduction)

- Extract API reference to references/api-reference.md
- Extract advanced patterns to references/advanced-patterns.md
- Extract error handling to references/error-handling.md
- Move code examples to templates/
- Fix frontmatter metadata
- Remove time-sensitive information

Token savings: ~2,200 lines (11% of total excess)
Skill now compliant with 500-line best practice"

git push
```

Continue this pattern for each skill.

**Final Commit**:
```bash
git add .
git commit -m "Complete skills refactoring: 100% compliance achieved

Summary:
- All 90 skills refactored
- Total line reduction: 55,530 lines (61%)
- Average skill length: 1,017 → 400 lines
- YAML compliance: 85.6% → 100%
- Skills under 500 lines: 13.3% → 100%
- Zero anti-patterns: 27.8% → 100%

Token savings: ~266,580 tokens (61% reduction)
Estimated cost savings: $24,000/month at scale

All skills now comply with official Anthropic best practices."

git push
```

---

## RISK MITIGATION

### Potential Issues & Solutions

**Risk 1: Breaking Skill Discovery**
- **Mitigation**: Test each skill after refactoring
- **Test**: Ask Claude to use the skill
- **Rollback**: Keep original in `skills-backup/` during Phase 1-2

**Risk 2: Breaking References**
- **Mitigation**: Verify all reference paths exist
- **Test**: `find skills -name "references" -type d | xargs ls -la`
- **Validation**: Check for 404-style missing refs

**Risk 3: Content Loss**
- **Mitigation**: Git commit after each skill
- **Backup**: Tag before starting: `git tag pre-refactor-backup`
- **Recovery**: `git reset --hard pre-refactor-backup` if needed

**Risk 4: Time Overrun**
- **Mitigation**: Start with Phase 1-2, reassess
- **Priority**: Can stop after Phase 2 for 79% of benefits
- **Defer**: Phases 3-5 can be done over time

---

## SUCCESS METRICS

### Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total lines | 91,530 | ~36,000 | -55,530 (61%) |
| Avg skill length | 1,017 lines | 400 lines | -617 (61%) |
| Skills < 500 lines | 12 (13.3%) | 90 (100%) | +78 skills |
| YAML compliance | 77 (85.6%) | 90 (100%) | +13 skills |
| Zero anti-patterns | 25 (27.8%) | 90 (100%) | +65 skills |
| Token usage | 439,380 | 172,800 | -266,580 (61%) |
| Cost per load | $1.32 | $0.52 | -$0.80 (61%) |
| Monthly cost (1k loads/day) | $39,600 | $15,600 | -$24,000 |

---

## NEXT STEPS

1. **Review this plan** with team
2. **Schedule Phase 1** (Week 1)
3. **Create backup**: `git tag pre-refactor-backup`
4. **Start with feature-dev** (30 min quick win)
5. **Proceed systematically** through phases
6. **Test continuously** after each skill
7. **Commit frequently** (after each skill in Phase 2+)
8. **Track progress** in this document

---

**Document Version**: 1.0
**Created**: 2025-11-17
**Last Updated**: 2025-11-17
**Maintained By**: Claude Skills Review Team
**Status**: READY FOR IMPLEMENTATION
