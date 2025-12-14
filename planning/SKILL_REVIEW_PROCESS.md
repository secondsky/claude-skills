# Skill Review Process

**Version**: 1.0.0
**Last Updated**: 2025-11-08
**Purpose**: Comprehensive deep-dive documentation review for claude-skills
**Usage**: `/review-skill <skill-name>` or invoke `skill-review` skill

---

## Table of Contents

1. [Introduction](#introduction)
2. [When to Run a Review](#when-to-run-a-review)
3. [Phase 1: Pre-Review Setup](#phase-1-pre-review-setup)
4. [Phase 2: Standards Compliance](#phase-2-standards-compliance)
5. [Phase 3: Official Documentation Verification](#phase-3-official-documentation-verification)
6. [Phase 4: Code Examples & Templates Audit](#phase-4-code-examples--templates-audit)
7. [Phase 5: Cross-File Consistency](#phase-5-cross-file-consistency)
8. [Phase 6: Dependencies & Versions](#phase-6-dependencies--versions)
9. [Phase 7: Issue Categorization](#phase-7-issue-categorization)
10. [Phase 8: Fix Implementation](#phase-8-fix-implementation)
11. [Phase 9: Post-Fix Verification](#phase-9-post-fix-verification)
12. [Appendix A: Common Issue Patterns](#appendix-a-common-issue-patterns)
13. [Appendix B: Example Audit Report](#appendix-b-example-audit-report)

---

## Introduction

### Purpose

This document defines the comprehensive process for performing deep-dive documentation reviews of skills in the claude-skills repository. A skill review systematically validates technical accuracy, documentation quality, and standards compliance.

### What This Process Catches

**Critical Issues**:
- Non-existent API methods/adapters
- Incorrect import statements
- Incompatible package versions
- Missing required dependencies
- Invalid YAML frontmatter

**High-Priority Issues**:
- Contradictory examples across files
- Inconsistent schema structures
- Outdated setup scripts
- Broken links to documentation
- API method inconsistencies

**Medium-Priority Issues**:
- Stale package versions (>90 days)
- Missing code comments
- Vague instructions
- Incomplete error documentation

**Low-Priority Issues**:
- Formatting inconsistencies
- Missing optional metadata
- Non-critical typos
- Suboptimal organization

### Design Principles

1. **Official Docs First** - Always verify against official documentation
2. **Evidence-Based** - Every issue must cite a source (GitHub URL, docs link, npm changelog)
3. **No Assumptions** - Verify claims with current data, don't rely on memory
4. **Minimal User Friction** - Fix unambiguous issues automatically, ask only when necessary
5. **Systematic** - Same checklist every time for reproducible results
6. **Documented** - Maintain audit trail in research logs and commit messages

---

## When to Run a Review

### Triggers

**Required**:
- Major package version updates (e.g., better-auth 1.x → 2.x)
- User reports errors following skill instructions
- Before marketplace submission

**Recommended**:
- Skill last verified >90 days ago
- After framework breaking changes
- When adding new features to skill
- Quarterly maintenance (every 3 months)

**On-Demand**:
- Suspected issues or outdated examples
- Investigating user feedback
- Quality assurance before release

### Review Types

**Quick Review** (1-1.5 hours):
- Automated checks only
- Spot verification of key sections
- Version currency check
- Best for: Minor updates, quarterly maintenance

**Deep Review** (2-4 hours):
- All 9 phases completed
- Comprehensive verification
- Full remediation
- Best for: Major updates, suspected issues, new skills

---

## Phase 1: Pre-Review Setup

**Time**: 5-10 minutes
**Purpose**: Establish baseline and prepare environment

### Step 1.1: Install Skill Locally

```bash
./scripts/install-skill.sh <skill-name>
```

**Verify**:
- Skill appears in `~/.claude/skills/<skill-name>/`
- SKILL.md is readable
- No installation errors

### Step 1.2: Identify Current Version

Read `skills/<skill-name>/SKILL.md` and extract:
- `metadata.version` (e.g., 1.0.0, 2.0.0)
- `metadata.last_verified` (date)
- `metadata.production_tested` (evidence)

**Record**:
```
Current version: X.X.X
Last verified: YYYY-MM-DD
Production tested: [evidence or "none"]
```

### Step 1.3: Check Discovery

Test if skill is discoverable by Claude:

```bash
# In Claude Code, type a trigger phrase
"Use the <skill-name> skill to..."
```

**Expected**: Claude should recognize and propose using the skill

**If fails**: Check YAML frontmatter and keywords

### Step 1.4: Gather Context

Read:
- `skills/<skill-name>/README.md` - Quick reference
- `planning/research-logs/<skill-name>.md` - Previous research (if exists)
- GitHub issues related to the underlying package

---

## Phase 2: Standards Compliance

**Time**: 10-15 minutes
**Purpose**: Validate against official Anthropic skill standards

### Step 2.1: YAML Frontmatter Validation

**Location**: `skills/<skill-name>/SKILL.md` (lines 1-50 typically)

**Required fields**:
```yaml
---
name: skill-name           # Must match directory name
description: |             # Multi-line, includes "Use when" scenarios
  [description]
license: MIT               # Required by Anthropic standards
---
```

**Check**:
- ✅ `name` matches directory name exactly
- ✅ `description` is multi-line (>100 words)
- ✅ `description` includes "Use when" scenarios
- ✅ `license` field present (usually MIT)
- ✅ YAML syntax is valid (no tabs, proper indentation)

**Optional but recommended**:
```yaml
metadata:
  version: 1.0.0
  last_verified: 2025-11-08
  production_tested: [evidence]
  package_version: X.X.X
  token_savings: ~XX%
  errors_prevented: XX
  official_docs: [url]
```

**Validation command**:
```bash
# Use script's YAML check
./scripts/review-skill.sh <skill-name> | grep "YAML"
```

### Step 2.2: Keywords Check

**Location**: SKILL.md frontmatter or description

**Required**: Comprehensive keyword list covering:
- Package names (e.g., "better-auth", "drizzle-orm")
- Technology stack (e.g., "cloudflare d1", "typescript")
- Use cases (e.g., "authentication", "self-hosted auth")
- Common searches (e.g., "clerk alternative", "d1 adapter")
- Error patterns (e.g., "session serialization error", "cors auth")

**Check**:
- ✅ 20+ relevant keywords
- ✅ Include package name
- ✅ Include common alternatives/competitors
- ✅ Include error messages users might search

**Bad example**:
```yaml
Keywords: auth, database
```

**Good example**:
```yaml
Keywords: better-auth, authentication, cloudflare d1 auth, drizzle orm auth, kysely auth, self-hosted auth, typescript auth, clerk alternative, auth.js alternative, social login, oauth providers, session management, jwt tokens, 2fa, two-factor, passkeys, webauthn, d1 adapter
```

### Step 2.3: Description Quality

**Location**: SKILL.md frontmatter `description`

**Requirements**:
- Third-person perspective ("This skill..." not "You will...")
- Includes "Use this skill when:" scenarios
- Mentions what it prevents/solves
- 100-200 words
- Lists key features

**Check**:
- ✅ Third-person style
- ✅ Clear use-case scenarios
- ✅ Problem/solution framing
- ✅ Appropriate length

**Bad example**:
```
You should use this when you need auth. It helps you set up authentication.
```

**Good example**:
```
Production-ready authentication framework for TypeScript with Cloudflare D1 support via Drizzle ORM or Kysely. Use this skill when building auth systems as a self-hosted alternative to Clerk or Auth.js, particularly for Cloudflare Workers projects. CRITICAL: better-auth requires Drizzle ORM or Kysely as database adapters - there is NO direct D1 adapter. Supports social providers, email/password, magic links, 2FA, passkeys, organizations, and RBAC. Prevents 12+ common authentication errors including D1 adapter misconfiguration, schema generation issues, session serialization, CORS, OAuth flows, and JWT token handling.
```

### Step 2.4: Directory Structure

**Expected**:
```
skills/<skill-name>/
├── SKILL.md                    # Required
├── README.md                   # Recommended
├── .claude-plugin/
│   └── plugin.json            # Marketplace manifest
├── scripts/                    # Optional: automation scripts
│   └── setup-*.sh
├── references/                 # Optional: deep-dive docs
│   ├── *-example.ts
│   └── *.md
├── templates/                  # Optional: starter templates
│   ├── package.json
│   └── *.ts
└── assets/                     # Optional: diagrams, images
    └── *.md
```

**Check**:
- ✅ SKILL.md exists and is valid
- ✅ README.md exists (recommended)
- ✅ Referenced directories exist (if mentioned in "Bundled Resources")
- ✅ No unexpected files (e.g., `.env`, `node_modules/`)

---

## Phase 3: Official Documentation Verification

**Time**: 15-30 minutes
**Purpose**: Ensure all documented patterns match current official docs

### Step 3.1: Identify Official Documentation

**For each package mentioned in the skill, find**:
- Official documentation URL
- GitHub repository
- npm package page
- Context7 MCP path (if available)

**Example (better-auth)**:
- Official: https://better-auth.com
- GitHub: https://github.com/better-auth/better-auth
- npm: https://www.npmjs.com/package/better-auth
- Context7: (not available)

**Record** these for evidence citations.

### Step 3.2: Verify API Patterns

**Use Context7 MCP** when available:
```
Use Context7 to fetch: /websites/better-auth_com
Search for: "database adapter"
```

**Or use WebFetch**:
```
Fetch: https://better-auth.com/docs/integrations/d1
Look for: Correct adapter usage
```

**Check**:
- ✅ Import statements exist in official docs
- ✅ API method signatures match
- ✅ Configuration objects match structure
- ✅ Example code patterns are current

**Common issues**:
- Non-existent exports (e.g., `d1Adapter` when only `drizzleAdapter` exists)
- Deprecated methods still documented
- Changed API signatures
- Renamed packages

**Document findings**:
```
❌ SKILL.md line 50: import { d1Adapter } from 'better-auth/adapters/d1'
✅ Official docs: import { drizzleAdapter } from 'better-auth/adapters/drizzle'
📎 Source: https://better-auth.com/docs/integrations/drizzle
```

### Step 3.3: Check GitHub for Recent Changes

**Visit**: `https://github.com/<org>/<repo>/commits/main`

**Check**:
- Last commit date (active maintenance?)
- Recent commits related to documented features
- Breaking changes in last 6 months
- Migration guides in docs

**Look for**:
- 🟢 Active (commits in last 30 days)
- 🟡 Maintained (commits in last 90 days)
- 🔴 Stale (no commits in 6+ months)

**Check issues**:
- Visit `https://github.com/<org>/<repo>/issues`
- Search for keywords from skill (e.g., "D1", "adapter", "cloudflare")
- Note any open issues affecting documented patterns

**Document**:
```
GitHub status: Active (last commit: 2025-11-05)
Relevant issues:
- #234: D1 adapter deprecated (closed 2025-09-15) ← We document old pattern!
- #567: Drizzle adapter recommended (open)
```

### Step 3.4: Verify Package Versions

**Use npm**:
```bash
npm view <package> version
npm view <package> time
```

**Example**:
```bash
npm view better-auth version
# Output: 1.3.34

npm view better-auth time
# Output shows last publish date
```

**Check**:
- ✅ Skill documents current or recent version
- ✅ Breaking changes noted if major version jump
- ✅ "Last Verified" date is recent

**Document**:
```
Package: better-auth
Current: 1.3.34 (published 2025-10-28)
Skill docs: 1.2.0 (outdated by 0.1.34)
Breaking changes: Yes (v1.3 changed D1 integration)
```

### Step 3.5: Production Repository Verification

**Find real-world usage**:
```bash
# GitHub code search
site:github.com "<package>" "cloudflare" "d1"
```

**Or use WebSearch**:
```
Search: "better-auth cloudflare d1 github"
Filter: Last year only
```

**Check 2-3 production repositories**:
- What patterns do they use?
- Do they match our skill's documented approach?
- Any workarounds or caveats?

**Document**:
```
Production examples:
1. github.com/user/repo-1 - Uses drizzleAdapter (matches our v2.0.0)
2. github.com/user/repo-2 - Uses Kysely (matches our alternative)
3. github.com/user/repo-3 - Old d1Adapter (deprecated pattern)

✅ Our v2.0.0 matches production best practices
```

---

## Phase 4: Code Examples & Templates Audit

**Time**: 20-40 minutes
**Purpose**: Verify all code examples are correct and consistent

### Step 4.1: Import Statement Consistency

**Check all code examples** in:
- SKILL.md Quick Start
- README.md examples
- `references/*.ts` files
- `templates/*.ts` files

**Verify**:
- ✅ Import statements use correct package names
- ✅ Imports consolidate when from same package
- ✅ No duplicate imports
- ✅ All imports actually exist (verify against official docs)

**Bad**:
```typescript
import { createAuthClient } from 'better-auth/client'
import { useSession } from 'better-auth/client'  // Duplicate source
```

**Good**:
```typescript
import { createAuthClient, useSession } from 'better-auth/client'
```

**Document issues**:
```
❌ references/react-hooks.tsx:15 - Duplicate imports
✅ Fix: Consolidate to single import statement
```

### Step 4.2: API Method Accuracy

**For each API method documented**:
1. Verify it exists in current package version
2. Check signature matches (parameters, return type)
3. Ensure configuration objects are correct

**Example**:
```typescript
// Documented
const session = await auth.getSession(c.req.raw)

// Check against official docs
// ✅ Current: await auth.api.getSession({ headers: c.req.raw.headers })
// ❌ Old pattern documented, API changed
```

**Common issues**:
- Method renamed (`.getSession()` → `.api.getSession()`)
- Parameters changed (raw request → headers object)
- Return type changed
- Async/await requirements changed

**Document**:
```
❌ cloudflare-worker-example.ts:134
   Old: auth.getSession(c.req.raw)
   New: auth.api.getSession({ headers: c.req.raw.headers })
📎 Source: https://better-auth.com/docs/api#getSession
```

### Step 4.3: Schema Consistency

**If skill involves database schemas**, verify:
- Table names consistent across all files
- Column names consistent (camelCase vs snake_case)
- Primary keys match
- Foreign keys match
- Indexes consistent

**Example issue**:
```
❌ Inconsistent table names:
   - database-schema.ts: "user" (singular)
   - drizzle-schema.ts: "users" (plural)

✅ Should all use: "user" (matches better-auth expectations)
```

**Check**:
- `references/database-schema.ts`
- `references/*-schema.ts`
- SKILL.md schema examples
- Migration files in `scripts/`

**Document**:
```
Schema inconsistency:
- File A uses: user, session, account
- File B uses: users, sessions, accounts
- File C uses: user, session, accounts (mixed!)

✅ Fix: Standardize to singular (matches official better-auth schema)
```

### Step 4.4: Template Completeness

**If skill includes templates/**:
1. Check if all required files present
2. Verify package.json is complete
3. Test templates actually work

**Test**:
```bash
# Copy template to temp directory
cp -r skills/<skill>/templates/example-project /tmp/test-template
cd /tmp/test-template

# Install dependencies
npm install

# Try to build/run
npm run build  # Should succeed
npm run dev    # Should start
```

**Document**:
```
✅ Templates tested:
   - example-project builds successfully
   - All dependencies resolve
   - No TypeScript errors

❌ Missing files:
   - wrangler.toml not included in template
   - .gitignore missing
```

### Step 4.5: Hook/Function Usage

**If React/client code**, check:
- `useState` used correctly (not confused with `useEffect`)
- `useEffect` has dependency arrays
- Event handlers properly typed
- No infinite render loops

**Common mistakes**:
```typescript
// ❌ Wrong: useState as useEffect
useState(() => {
  fetchData()
})

// ✅ Correct: useEffect
useEffect(() => {
  fetchData()
}, [])
```

---

## Phase 5: Cross-File Consistency

**Time**: 15-25 minutes
**Purpose**: Ensure all files tell the same story

### Step 5.1: SKILL.md vs README.md

**Compare**:
- Quick Start sections
- Installation steps
- Code examples
- Package versions mentioned

**Check**:
- ✅ Same packages listed
- ✅ Same version numbers
- ✅ Same basic code pattern
- ✅ No contradictions

**Document**:
```
✅ SKILL.md Quick Start matches README.md example
❌ README shows v1.2.0, SKILL.md shows v1.3.34 (inconsistent)
```

### Step 5.2: Bundled Resources List

**Location**: SKILL.md near end

**Verify**:
```markdown
## Bundled Resources

1. `scripts/setup-d1-drizzle.sh` - Setup automation
2. `references/cloudflare-worker-drizzle.ts` - Complete example
...
```

**Check**:
- ✅ All listed files actually exist
- ✅ All existing files are listed (or intentionally excluded)
- ✅ File descriptions are accurate

**Common issue**:
```
❌ SKILL.md lists: scripts/setup-d1.sh
   File exists: scripts/setup-d1-drizzle.sh (renamed)

✅ Fix: Update Bundled Resources section
```

### Step 5.3: Configuration Examples

**Compare all config files**:
- SKILL.md examples
- README.md examples
- `references/` examples
- `templates/` files

**Check**:
- ✅ Environment variables consistent
- ✅ Binding names consistent
- ✅ Configuration structure matches

**Example issue**:
```
❌ Inconsistent binding names:
   - SKILL.md: binding = "DB"
   - Example: binding = "DATABASE"

✅ Fix: Standardize on "DB"
```

### Step 5.4: Error Count Validation

**If skill claims "prevents X errors"**:
1. Count documented errors in SKILL.md
2. Verify each has a solution
3. Confirm number matches claim

**Example**:
```yaml
metadata:
  errors_prevented: 12
```

**Verify**: Count "Issue 1", "Issue 2", etc. in SKILL.md = 12 ✅

---

## Phase 6: Dependencies & Versions

**Time**: 10-15 minutes
**Purpose**: Ensure all dependencies are current and compatible

### Step 6.1: Run Version Check Script

```bash
./scripts/check-versions.sh <skill-name>
```

**Output interpretation**:
```
✓ better-auth@1.3.34 (up-to-date)
⚠ drizzle-orm@0.35.0 → 0.36.0 available
⚠ hono@3.11.0 → 4.0.0 available (major version!)
```

**Document**:
```
Version status:
- better-auth: ✅ Current
- drizzle-orm: 🟡 Minor update available (0.35 → 0.36)
- hono: 🔴 Major update available (3.x → 4.x, breaking changes?)
```

### Step 6.2: Check Breaking Changes

**For packages with updates**:
1. Visit package GitHub
2. Read CHANGELOG.md or RELEASES
3. Identify breaking changes

**Example**:
```
hono v3 → v4 breaking changes:
- API route syntax changed
- Middleware signature different
- Context object restructured

Impact on our skill: HIGH
Action: Review all hono examples, update if adopting v4
```

### Step 6.3: Verify "Last Verified" Date

**Location**: SKILL.md metadata

**Check**:
```yaml
metadata:
  last_verified: 2025-08-15  # 85 days ago
```

**Classification**:
- 🟢 < 30 days: Fresh
- 🟡 30-90 days: Acceptable
- 🔴 > 90 days: Stale

**If stale**: Full verification required (all phases)

### Step 6.4: Dependency Conflicts

**Check for known conflicts**:
- TypeScript version mismatches
- Peer dependency warnings
- Runtime compatibility

**Test**:
```bash
cd /tmp
mkdir test-install
cd test-install
npm init -y

# Install packages from skill
npm install better-auth drizzle-orm drizzle-kit @cloudflare/workers-types

# Check for warnings
# Look for: WARN peer dependencies, WARN deprecated
```

---

## Phase 7: Issue Categorization

**Time**: 10-20 minutes
**Purpose**: Classify all findings by severity and impact

### Severity Levels

**🔴 CRITICAL** - Breaks functionality
- Non-existent API methods
- Incorrect imports
- Invalid configuration
- Missing required dependencies
- Incorrect type definitions

**🟡 HIGH** - Causes confusion or errors
- Contradictory examples
- Inconsistent patterns
- Outdated major versions
- Incorrect setup scripts
- Broken links to critical docs

**🟠 MEDIUM** - Reduces quality
- Stale minor versions
- Missing code comments
- Inconsistent formatting
- Incomplete documentation
- Non-critical broken links

**🟢 LOW** - Polish issues
- Typos
- Missing optional metadata
- Suboptimal organization
- Formatting inconsistencies

### Issue Template

For each issue found, document:

```markdown
### Issue #N: [Short Description]

**Severity**: 🔴 CRITICAL / 🟡 HIGH / 🟠 MEDIUM / 🟢 LOW

**Location**: `file.ts:123` or section in SKILL.md

**Problem**:
[Clear description of what's wrong]

**Evidence**:
- Official docs: [URL]
- GitHub issue: [URL] (if applicable)
- npm: `npm view package version` output
- Production example: [GitHub repo URL]

**Impact**:
[What happens if not fixed]

**Fix**:
```diff
- old code
+ new code
```

**Breaking Change**: Yes/No
```

### Example Issues

```markdown
### Issue #1: Non-existent d1Adapter

**Severity**: 🔴 CRITICAL

**Location**: `references/cloudflare-worker-example.ts:17`

**Problem**:
Code imports `d1Adapter` from `'better-auth/adapters/d1'` but this export doesn't exist in better-auth v1.3.34. better-auth requires Drizzle ORM or Kysely for D1 integration.

**Evidence**:
- Official docs: https://better-auth.com/docs/integrations/drizzle
- GitHub search: No `d1Adapter` export found in codebase
- Production examples: All use `drizzleAdapter` or Kysely

**Impact**:
Users copying this code will get "Module not found" error. Code will not run.

**Fix**:
```diff
- import { d1Adapter } from 'better-auth/adapters/d1'
+ import { drizzleAdapter } from 'better-auth/adapters/drizzle'
+ import { drizzle } from 'drizzle-orm/d1'

- database: d1Adapter(env.DB)
+ const db = drizzle(env.DB, { schema })
+ database: drizzleAdapter(db, { provider: "sqlite" })
```

**Breaking Change**: Yes - Requires v2.0.0 bump
```

---

## Phase 7.5: Resource Inventory & Coverage Audit

**Time**: 10-15 minutes
**Purpose**: Before ANY condensation, map existing resources and determine extraction needs

⚠️ **CRITICAL**: This phase is MANDATORY - never skip it before Phase 8 (Fix Implementation)

### Step 7.5.1: Inventory All Resources

```bash
# List all bundled resources
ls -la skills/<skill>/references/
ls -la skills/<skill>/scripts/
ls -la skills/<skill>/templates/
ls -la skills/<skill>/assets/
```

**Document**:
- Number of files in each directory
- File names and approximate sizes
- What each file covers (from filename/header)

### Step 7.5.2: Read Every Reference File

For each file in references/:
- Read ENTIRE content (not just headers)
- Document what topics/sections it covers
- Note line count and completeness level

**Do NOT skip this step** - you must READ the files, not just list them.

### Step 7.5.3: Create Coverage Matrix

Create a table mapping SKILL.md sections to existing references:

| SKILL.md Section | Lines | Existing Reference | Coverage | Action |
|------------------|-------|-------------------|----------|--------|
| RAG Patterns | 148 | refs/rag-patterns.md | Complete | Pointer only |
| Semantic Search | 94 | NONE | N/A | Extract first |
| Error Handling | 85 | refs/errors.md | Partial | Supplement + pointer |

**Coverage levels**:
- **Complete**: Reference covers all content in SKILL.md section
- **Partial**: Reference covers some but not all content
- **N/A**: No reference exists for this content

### Step 7.5.4: Document Extraction Plan

For each verbose section in SKILL.md, explicitly document:

1. **Content EXISTS in reference** → Condense with pointer (no extraction needed)
   ```
   Section: RAG Patterns (148 lines)
   Reference: references/rag-patterns.md EXISTS (484 lines, complete coverage)
   Action: Add pointer to existing reference, condense SKILL.md section
   ```

2. **Content MISSING from references** → Extract first, then condense
   ```
   Section: Semantic Search (94 lines)
   Reference: DOES NOT EXIST
   Action: Extract to references/semantic-search.md FIRST, then condense
   ```

3. **Content PARTIAL in reference** → Supplement existing file, then condense
   ```
   Section: Error Handling (85 lines)
   Reference: references/errors.md EXISTS but missing 3 errors
   Action: Supplement existing reference with missing errors, then condense
   ```

### Verification Checklist

**MUST complete before Phase 8**:
- [ ] Listed all files in references/ directory
- [ ] READ each reference file (not just listed)
- [ ] Listed all files in scripts/ directory
- [ ] Listed all files in templates/ directory
- [ ] Listed all files in assets/ directory
- [ ] Created coverage matrix
- [ ] Documented extraction plan for each verbose section

### Why This Phase Matters

This phase prevents:
- **Duplicate extraction**: Creating new reference files for content that already exists
- **Data loss**: Deleting content before verifying it exists elsewhere
- **Wasted effort**: Spending time extracting when only pointer is needed
- **Broken references**: Adding pointers to files that don't exist

---

## Phase 8: Fix Implementation

**Time**: Varies (30 minutes to 4 hours)
**Purpose**: Remediate issues systematically

### Decision Tree: Auto-Fix vs Ask User

**Auto-fix** when:
- ✅ Fix is unambiguous (e.g., correct import statement)
- ✅ Evidence is clear (official docs show correct pattern)
- ✅ No architectural impact (doesn't change approach)
- ✅ Low risk (can't break working code)

**Ask user** when:
- ❓ Multiple valid approaches (Drizzle vs Kysely)
- ❓ Breaking change decision (bump to v2.0.0?)
- ❓ Architectural choice (KV vs D1 for sessions?)
- ❓ Unclear requirements from user

**Report only** when:
- 📋 Low priority (user can decide later)
- 📋 Requires manual testing
- 📋 Needs user preference (formatting style)

### Fix Priority Order

1. **🔴 Critical** first - Fix immediately, these break functionality
2. **🟡 High** second - Fix in same session
3. **🟠 Medium** third - Fix if time allows or defer
4. **🟢 Low** last - Batch with other updates or defer

### Breaking Change Assessment

**Requires version bump** if:
- API patterns change (old code won't work)
- File structure changes
- Configuration format changes
- Dependencies have breaking changes

**Version bump rules**:
- Major: v1.0.0 → v2.0.0 (breaking changes)
- Minor: v1.0.0 → v1.1.0 (new features, backward compatible)
- Patch: v1.0.0 → v1.0.1 (bug fixes only)

### Anti-Patterns to Avoid (Lessons Learned)

**Critical mistakes to prevent during fix implementation:**

❌ **DO NOT**:
- **Delete content before creating reference files** - Always create the new reference file FIRST, then condense the original
- **Add pointers to non-existent files** - Create and verify the referenced file exists before adding the pointer
- **Condense Top 3-5 errors to one-liners** - Keep error documentation detailed and actionable in main SKILL.md
- **Focus on speed over correctness** - Take time to verify each change, read affected files, test templates
- **Skip verification steps** - Always check files exist, content is complete, links work, before marking complete
- **Extract content that already exists in reference files** - Creates duplication, check Phase 7.5 coverage matrix first
- **Start condensation without completing Phase 7.5** - Resource Inventory is MANDATORY
- **Assume reference files need to be created** - Check first - they may already exist!
- **Condense SKILL.md before reading ALL reference files** - You must understand what already exists
- **Skip the coverage matrix** - It's required, not optional

✅ **DO**:
- **INVENTORY FIRST** - Complete Phase 7.5 before ANY condensation
- **CHECK COVERAGE** - Map each verbose SKILL.md section to existing references
- **EXTRACT ONLY MISSING** - Only create new reference files for content NOT already covered
- **REUSE EXISTING** - If content exists in reference, just add pointer (no extraction)
- **CREATE COVERAGE MATRIX** - Document what exists vs what's missing before changes
- **READ, DON'T JUST LIST** - Actually read reference file contents, not just filenames
- **CONDENSE SECOND** - Edit the main file to add summary + pointer after verifying extraction needs
- **VERIFY ALWAYS** - Check files exist, content complete, no broken links
- **Keep Top errors DETAILED in main file** - Don't extract critical error documentation
- **Document immediately after completion** - Update tracking doc, commit messages, research logs in real-time

**Why This Matters**:
- Prevents data loss (content deleted before backup created)
- Maintains skill usability (no broken references)
- Preserves critical information (Top errors help Claude avoid mistakes)
- Enables proper review (verification catches mistakes before commit)
- Ensures traceability (documentation provides audit trail)

### Fix Implementation Process

For each issue:

**Step 1: Create fix branch** (if major changes)
```bash
git checkout -b fix/skill-name-v2
```

**Step 2: Fix all occurrences**
- Update SKILL.md
- Update README.md
- Update all `references/*` files
- Update all `templates/*` files
- Update scripts if needed

**Step 3: Update metadata**
```yaml
metadata:
  version: 2.0.0  # Bump if breaking
  last_verified: 2025-11-08  # Today
  breaking_changes: v2.0.0 - Corrected D1 adapter patterns
```

**Step 4: Document in commit message**
```
skill-name v2.0.0 - BREAKING: Correct D1 adapter patterns

Critical fixes:
- Replace fake d1Adapter with drizzleAdapter
- Update all examples to use Drizzle ORM
- Remove contradictory reference files

Files changed: 7
Lines removed: 665 (incorrect patterns)
Lines added: 1,931 (correct patterns)

Breaking change: Yes
Migration: See SKILL.md for new setup workflow

Fixes: #123
Verified: [production repo URLs]
```

---

## Phase 9: Post-Fix Verification

**Time**: 10-15 minutes
**Purpose**: Ensure fixes are correct and complete

### Step 9.1: Discovery Test

Test skill can still be discovered:
```
In Claude Code: "Use the <skill-name> skill to..."
```

**Expected**: Claude recognizes skill and loads correctly

### Step 9.2: Template Test

If skill has templates, test they work:
```bash
cp -r skills/<skill>/templates/example /tmp/verify-template
cd /tmp/verify-template
npm install
npm run build  # Should succeed
```

### Step 9.3: Cross-Reference Verification

**Verify no contradictions remain**:
- Re-check SKILL.md vs README.md
- Ensure all reference files use same patterns
- Confirm "Bundled Resources" list is accurate

### Step 9.4: TODO Markers

Search for any remaining TODOs:
```bash
grep -r "TODO\|FIXME\|XXX" skills/<skill-name>/
```

**Expected**: None (or only intentional placeholders)

### Step 9.5: Commit and Push

```bash
git add skills/<skill-name>
git commit -m "[Detailed message from Phase 8]"
git push origin main
```

**Generate marketplace manifest** if updated:
```bash
./scripts/generate-plugin-manifests.sh
git add skills/<skill-name>/.claude-plugin/
git commit -m "Update marketplace manifest for <skill-name> v2.0.0"
git push
```

---

## Appendix A: Common Issue Patterns

### Pattern 1: Fake Adapters

**Symptom**: Import from non-existent package path
**Example**: `import { d1Adapter } from 'better-auth/adapters/d1'`
**Root cause**: Documentation guessed at API without verifying
**Fix**: Check official docs for actual exports
**Severity**: 🔴 CRITICAL

### Pattern 2: Stale API Methods

**Symptom**: Method signature doesn't match current package
**Example**: `auth.getSession(req)` → `auth.api.getSession({ headers })`
**Root cause**: Package updated after skill created
**Fix**: Verify against latest official docs
**Severity**: 🟡 HIGH

### Pattern 3: Schema Inconsistency

**Symptom**: Table names differ across files
**Example**: `users` vs `user` tables
**Root cause**: Multiple contributors or file copies
**Fix**: Standardize to official schema naming
**Severity**: 🟡 HIGH

### Pattern 4: Outdated Scripts

**Symptom**: Setup script uses deprecated approach
**Example**: Manual SQL vs ORM migrations
**Root cause**: Better tooling released after script written
**Fix**: Update to use official tools (drizzle-kit, etc.)
**Severity**: 🟡 HIGH

### Pattern 5: Version Drift

**Symptom**: Package versions >90 days old
**Example**: Skill docs v1.2.0, current is v1.3.34
**Root cause**: No periodic reviews
**Fix**: Update versions, check for breaking changes
**Severity**: 🟠 MEDIUM

### Pattern 6: Contradictory Examples

**Symptom**: Multiple reference files show different patterns
**Example**: File A uses Drizzle, File B uses fake adapter
**Root cause**: Incomplete refactor or multiple iterations
**Fix**: Remove outdated files, ensure consistency
**Severity**: 🟡 HIGH

---

## Appendix B: Example Audit Report

### better-auth Skill Audit (2025-11-08)

**Audit Type**: Deep review
**Trigger**: User reported D1 integration issues
**Time Spent**: 3.5 hours
**Result**: v2.0.0 with comprehensive fixes

---

#### Executive Summary

**Status**: ❌ FAIL (6 critical/high issues found)

**Findings**:
- 🔴 Critical: 2 issues
- 🟡 High: 3 issues
- 🟠 Medium: 1 issue
- 🟢 Low: 2 issues

**Action Required**: Comprehensive refactor with version bump

**Version Bump**: v1.0.0 → v2.0.0 (breaking changes)

---

#### Detailed Findings

**Issue #1: Non-existent d1Adapter** 🔴 CRITICAL

*Location*: `references/cloudflare-worker-example.ts:17,50`

*Problem*: Imports `d1Adapter` from `'better-auth/adapters/d1'` which doesn't exist. better-auth v1.3.34 requires Drizzle ORM or Kysely for D1.

*Evidence*:
- Official docs: https://better-auth.com/docs/integrations/drizzle
- GitHub: No `d1Adapter` export in better-auth codebase
- Production: 4 repos verified, all use Drizzle/Kysely

*Impact*: Users get "Module not found" error, code won't run

*Fix*: Remove file, create new `cloudflare-worker-drizzle.ts` with correct pattern

---

**Issue #2: Inconsistent Schema Structure** 🔴 CRITICAL

*Location*: `references/drizzle-schema.ts` vs `references/database-schema.ts`

*Problem*: Two schema files with different table names:
- File A: `users`, `sessions`, `accounts`
- File B: `user`, `session`, `account`

*Evidence*: better-auth official schema uses singular names

*Impact*: Confusion, potential database errors if wrong schema used

*Fix*: Delete old `drizzle-schema.ts`, keep only `database-schema.ts` with correct naming

---

**Issue #3: Outdated Setup Script** 🟡 HIGH

*Location*: `scripts/setup-d1.sh`

*Problem*: Generates raw SQL manually instead of using Drizzle Kit migrations

*Evidence*: Drizzle docs recommend `drizzle-kit generate` approach

*Impact*: Users miss benefits of migration tracking, harder to maintain

*Fix*: Replace with `setup-d1-drizzle.sh` using Drizzle Kit workflow

---

**Issue #4: React Hooks Bug** 🟡 HIGH

*Location*: `references/react-client-hooks.tsx:382`

*Problem*: Uses `useState(() => { fetchData() })` instead of `useEffect`

*Evidence*: React docs - useState for state, useEffect for side effects

*Impact*: Code won't work as intended, infinite render potential

*Fix*: Change to `useEffect(() => { fetchData() }, [])`

---

**Issue #5: Misorganized Next.js Example** 🟡 HIGH

*Location*: `references/nextjs-api-route.ts`

*Problem*: Next.js + PostgreSQL example in root of references/ alongside Cloudflare D1 examples

*Evidence*: Skill is D1-focused, causes confusion

*Impact*: Users might use wrong example for their stack

*Fix*: Move to `references/nextjs/postgres-example.ts` with README explaining difference

---

**Issue #6: Stale Version** 🟠 MEDIUM

*Location*: SKILL.md metadata

*Problem*: Last verified 2024-08-15 (85 days ago), docs show v1.2.0 but current is v1.3.34

*Evidence*: `npm view better-auth version` → 1.3.34

*Impact*: Users may encounter issues with newer versions

*Fix*: Update to v1.3.34, verify all examples work

---

#### Remediation Summary

**Files Deleted** (3):
- `references/cloudflare-worker-example.ts` (fake adapter)
- `references/drizzle-schema.ts` (inconsistent)
- `scripts/setup-d1.sh` (outdated)

**Files Created** (3):
- `references/cloudflare-worker-drizzle.ts` (correct pattern)
- `references/cloudflare-worker-kysely.ts` (alternative)
- `scripts/setup-d1-drizzle.sh` (modern approach)

**Files Fixed** (2):
- `references/react-client-hooks.tsx` (hooks bug)
- `references/nextjs-api-route.ts` → moved to `nextjs/postgres-example.ts`

**Files Updated** (2):
- `SKILL.md` (comprehensive rewrite, 1,260 lines)
- `README.md` (updated examples)

**Lines Changed**:
- Removed: 665 (incorrect patterns)
- Added: 1,931 (correct patterns)
- Net: +1,266 lines

---

#### Version Update

**Version**: 1.0.0 → 2.0.0

**Reason**: Breaking changes in adapter approach

**Migration Path**: Documented in SKILL.md v2.0.0

**Changelog**:
```
v2.0.0 (2025-11-08)
BREAKING: Corrected D1 adapter patterns

Critical:
- Removed fake d1Adapter() imports
- Added correct Drizzle/Kysely patterns
- Increased errors prevented: 10 → 12

High:
- Fixed schema inconsistencies
- Updated setup scripts to use Drizzle Kit
- Fixed React hooks bugs
- Reorganized reference files

Medium:
- Updated to better-auth v1.3.34
- Refreshed "Last Verified" date

Migration: See SKILL.md for new Drizzle setup workflow
```

---

#### Post-Fix Verification

✅ Discovery test passed
✅ Templates build successfully
✅ Cross-file consistency verified
✅ No TODO markers remaining
✅ Committed: `3f47f4c`
✅ Pushed to GitHub

---

#### Lessons Learned

1. **Verify API exports exist** - Don't assume package structure
2. **Check production repos** - Real usage reveals correct patterns
3. **Keep reference files minimal** - Fewer files = less chance of contradictions
4. **Regular reviews essential** - 85 days led to significant drift
5. **Breaking changes need major bump** - v2.0.0 appropriate for this scope

---

**Audit Complete**: 2025-11-08
**Auditor**: Claude (Sonnet 4.5)
**Review Time**: 3.5 hours
**Result**: Skill upgraded to v2.0.0, all issues resolved

---

## Conclusion

This process ensures systematic, evidence-based reviews that catch issues before they impact users. Follow all 9 phases for comprehensive audits, or use quick reviews for minor updates. Always document findings with evidence and maintain audit trails.

**Questions?** See claude-skills repository: https://github.com/secondsky/claude-skills
