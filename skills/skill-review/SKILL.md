---
name: skill-review
description: |
  Production-ready comprehensive audit skill for claude-skills repository. Use when reviewing skills for updates, investigating documented issues, verifying before marketplace submission, or checking package version currency. Performs systematic 15-phase audit covering standards compliance, dependency verification, API validation, cross-file consistency, and progressive disclosure review. Enforces official Anthropic standards including YAML validation (1,024-char descriptions, 64-char names), SKILL.md line limits (<500), and third-person style. Auto-fixes straightforward issues; asks user only for architectural decisions. Outputs severity-classified results (🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low) with evidence citations and remediation plans. See references/audit-methodology.md for complete methodology.

license: MIT
metadata:
  version: 1.4.0
  last_verified: 2025-12-14
  production_tested: better-auth v2.0.0 audit (2025-11-08)
  token_savings: ~80%
  errors_prevented: 40+
  official_docs: https://github.com/secondsky/claude-skills
  triggers:
    - "review this skill"
    - "review the X skill"
    - "audit the skill"
    - "check if X needs updates"
    - "is X skill current"
    - "verify X documentation"
    - "X skill seems outdated"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - WebFetch
  - WebSearch
  - Edit
  - Write
---

# Skill Review Skill

## Overview

The skill-review skill provides a comprehensive, systematic process for auditing skills in the claude-skills repository. It combines automated technical validation with AI-powered verification to ensure skills remain accurate, current, and high-quality.

**Use this skill when**:
- Investigating suspected issues in a skill
- Major package version updates released (e.g., better-auth 1.x → 2.x)
- Skill last verified >90 days ago
- Before submitting skill to marketplace
- User reports errors following skill instructions
- Examples seem outdated or contradictory

**Production evidence**: Successfully audited better-auth skill (2025-11-08), found 6 critical/high issues including non-existent API imports, removed 665 lines of incorrect code, implemented v2.0.0 with correct patterns.

---

## Quick Start

### Invoke via Slash Command

```
/review-skill <skill-name>
```

**Example**:
```
/review-skill better-auth
```

### Invoke via Skill (Proactive)

When Claude notices potential issues, it can suggest:
```
User: "I'm having trouble with better-auth and D1"

Claude: "I notice the better-auth skill was last verified 6 months ago.
Would you like me to review it? Better-auth recently released v1.3
with D1 changes."
```

---

## What This Skill Does

### 15-Phase Systematic Audit

1. **Pre-Review Setup** (5-10 min)
   - Install skill locally: `./scripts/install-skill.sh <skill-name>`
   - Check current version and last verified date
   - Test skill discovery

2. **Standards Compliance** (10-15 min)
   - Validate YAML frontmatter with **exact rules**:
     - `name`: Max 64 chars, pattern `^[a-z0-9-]+$`, NO "anthropic" or "claude"
     - `description`: Max 1024 chars, NO XML tags (`<tag>`), non-empty
     - `license`: Present and valid (MIT, Apache-2.0, etc.)
   - **SKILL.md line count**: Body should be <500 lines (optimal performance)
   - Check keyword comprehensiveness
   - Verify **third-person description style** (NOT "You should..." but "This skill should be used when...")
   - Ensure gerund form naming (e.g., "processing-pdfs" not "pdf-processor")
   - Ensure directory structure matches spec

3. **Official Documentation Verification** (15-30 min)
   - Use Context7 MCP or WebFetch to verify API patterns
   - Check GitHub for recent updates and issues
   - Verify package versions against npm registry
   - Compare with production repositories

4. **Code Examples & Templates Audit** (20-40 min)
   - Verify import statements exist in current packages
   - Check API method signatures match official docs
   - Ensure schema consistency across files
   - Test templates build and run

5. **Cross-File Consistency** (15-25 min)
   - Compare SKILL.md vs README.md examples
   - Verify "Bundled Resources" section matches actual files
   - Ensure configuration examples consistent

6. **Dependencies & Versions** (10-15 min)
   - Run `./scripts/check-versions.sh <skill-name>`
   - Check for breaking changes in package updates
   - Verify "Last Verified" date is recent

7. **Progressive Disclosure Architecture Review** (10-15 min)
   - Check reference depth: Resources should be **ONE LEVEL DEEP** from SKILL.md
   - Verify files >100 lines have **Table of Contents**
   - Assess 3-tier model compliance:
     - Level 1 (Metadata): Always in context (~100 tokens)
     - Level 2 (SKILL.md body): Loaded when triggered (<500 lines)
     - Level 3 (Bundled resources): On-demand loading
   - Flag deeply nested references (references → sub-references → ❌)

8. **Conciseness & Degrees of Freedom Audit** (15-20 min)
   - Identify **over-explained concepts** (Claude already knows this)
   - Flag verbose sections that could be trimmed
   - Assess **degrees of freedom** appropriateness:
     - High freedom: Exploratory tasks, vague requirements
     - Medium freedom: Conventional solutions, some flexibility
     - Low freedom: Fragile tasks, exact patterns required
   - Check for **defaults with escape hatches** (not endless options)
   - Apply "context window is a public good" mindset
   - Verify consistent terminology (same concept = same words throughout)

9. **Anti-Pattern Detection** (10-15 min)
   - ❌ Windows-style paths (`C:\path\file` → use forward slashes)
   - ❌ Inconsistent terminology (endpoint/URL/path mixed usage)
   - ❌ Time-sensitive information ("as of 2024" → use "old patterns" sections)
   - ❌ Too many options without defaults (decision paralysis)
   - ❌ Deeply nested references (>1 level)
   - ❌ Vague phrases without examples
   - ❌ Missing input/output examples for templates
   - ❌ No feedback loops in complex workflows

10. **Testing & Evaluation Review** (10-15 min)
    - Check for **at least 3 test scenarios/evaluations**
    - Verify **multi-model consideration** (Haiku/Sonnet/Opus may need different detail)
    - Assess if skill solves **real problems** vs imagined ones
    - Check for iterative development evidence (Claude A creates, Claude B tests)
    - Verify production testing claims with evidence

11. **Security & MCP Considerations** (5-10 min)
    - Flag external URL fetches (potential risks)
    - Check for skills from untrusted sources warnings
    - Verify MCP tool references are **fully qualified** (ServerName:tool_name)
    - Review script permissions and error handling
    - Check "solve, don't punt" pattern (explicit error handling, not silent failures)
    - **Marketplace schema compliance**: Only standard fields allowed (name, source, description, version, category, keywords, author, license, repository) - NO custom fields like `lastVerified`

12. **Issue Categorization** (10-20 min)
    - Classify by severity: 🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low
    - Document with evidence (GitHub URL, docs link, npm changelog)

12.5. **Resource Inventory & Coverage Audit** (10-15 min) ⚠️ MANDATORY
    - **Purpose**: Before ANY condensation, map existing resources and determine extraction needs
    - **CRITICAL**: This phase is MANDATORY - never skip it before Phase 13

    **Step 12.5.1: Inventory All Resources**
    ```bash
    ls -la skills/<skill>/references/
    ls -la skills/<skill>/scripts/
    ls -la skills/<skill>/templates/
    ls -la skills/<skill>/assets/
    ```

    **Step 12.5.2: Read Every Reference File**
    - Read ENTIRE content of each file in references/
    - Document topics covered, line count, completeness
    - Do NOT skip this - you must READ the files, not just list them

    **Step 12.5.3: Create Coverage Matrix**
    | SKILL.md Section | Lines | Existing Reference | Coverage | Action |
    |------------------|-------|-------------------|----------|--------|
    | Section A | 148 | refs/x.md | Complete | Pointer only |
    | Section B | 94 | NONE | N/A | Extract first |
    | Section C | 85 | refs/y.md | Partial | Supplement + pointer |

    **Step 12.5.4: Document Extraction Plan**
    - Content EXISTS in reference → Condense with pointer (no extraction needed)
    - Content MISSING from references → Extract first, then condense
    - Content PARTIAL in reference → Supplement existing file, then condense

    **Verification Checklist (MUST complete before Phase 13)**
    - [ ] Listed all files in references/ directory
    - [ ] READ each reference file (not just listed)
    - [ ] Listed all files in scripts/, templates/, assets/ directories
    - [ ] Created coverage matrix
    - [ ] Documented extraction plan for each section

13. **Fix Implementation** (30 min - 4 hours)
    - Auto-fix unambiguous issues
    - Ask user only for architectural decisions
    - Update all affected files consistently
    - Bump version if breaking changes

    **Anti-Patterns to Avoid (Lessons Learned)**

    ❌ **DO NOT**:
    - Delete content before creating reference files
    - Add pointers to non-existent files
    - Condense Top 3-5 errors to one-liners
    - Focus on speed over correctness
    - Skip verification steps
    - **Extract content that already exists in reference files** (creates duplication)
    - **Start condensation without completing Phase 12.5** (Resource Inventory)
    - **Assume reference files need to be created** (check first - they may already exist!)
    - **Condense SKILL.md before reading ALL reference files**
    - **Skip the coverage matrix** - it's required, not optional

    ✅ **DO**:
    - **INVENTORY FIRST** - Complete Phase 12.5 before ANY condensation
    - **CHECK COVERAGE** - Map each verbose SKILL.md section to existing references
    - **EXTRACT ONLY MISSING** - Only create new reference files for content NOT already covered
    - **REUSE EXISTING** - If content exists in reference, just add pointer (no extraction)
    - **CREATE COVERAGE MATRIX** - Document what exists vs what's missing before changes
    - **READ, DON'T JUST LIST** - Actually read reference file contents, not just filenames
    - CONDENSE SECOND (Edit main file after verifying extraction needs)
    - VERIFY ALWAYS (Check files exist, content complete)
    - Keep Top errors DETAILED in main file
    - Document immediately after completion

14. **Post-Fix Verification** (10-15 min)
    - Test skill discovery
    - Verify templates work
    - Check no contradictions remain
    - Commit with detailed changelog

### Automated Checks (via script)

The skill runs `./scripts/review-skill.sh <skill-name>` which checks:
- ✅ YAML frontmatter syntax and required fields
- ✅ Package version currency (npm)
- ✅ Broken links (HTTP status)
- ✅ TODO markers in code
- ✅ File organization (expected directories exist)
- ✅ "Last Verified" date staleness

### Manual Verification (AI-powered)

Claude performs:
- 🔍 API method verification against official docs
- 🔍 GitHub activity and issue checks
- 🔍 Production repository comparisons
- 🔍 Code example correctness
- 🔍 Schema consistency validation

---

## Process Workflow

### Step 1: Run Automated Checks

```bash
./scripts/review-skill.sh <skill-name>
```

Interpret output to identify technical issues.

### Step 2: Execute Manual Verification

For **Phase 3: Official Documentation Verification**:

1. Use Context7 MCP (if available):
   ```
   Use Context7 to fetch: /websites/<package-docs>
   Search for: [API method from skill]
   ```

2. Or use WebFetch:
   ```
   Fetch: https://<official-docs-url>
   Verify: [specific patterns]
   ```

3. Check GitHub:
   ```
   Visit: https://github.com/<org>/<repo>/commits/main
   Check: Last commit, recent changes
   Search issues: [keywords from skill]
   ```

4. Find production examples:
   ```
   WebSearch: "<package> cloudflare production github"
   Compare: Do real projects match our patterns?
   ```

For **Phase 4: Code Examples Audit**:

- Verify all imports exist (check official docs)
- Check API method signatures match
- Ensure schema consistency across files
- Test templates actually work

### Step 3: Categorize Issues

**🔴 CRITICAL** - Breaks functionality:
- Non-existent API methods/imports
- Invalid configuration
- Missing required dependencies

**🟡 HIGH** - Causes confusion:
- Contradictory examples across files
- Inconsistent patterns
- Outdated major versions

**🟠 MEDIUM** - Reduces quality:
- Stale minor versions (>90 days)
- Missing documentation sections
- Incomplete error lists

**🟢 LOW** - Polish issues:
- Typos, formatting inconsistencies
- Missing optional metadata

### Step 4: Fix Issues

**Auto-fix** when:
- ✅ Fix is unambiguous (correct import from docs)
- ✅ Evidence is clear
- ✅ No architectural impact

**Ask user** when:
- ❓ Multiple valid approaches
- ❓ Breaking change decision
- ❓ Architectural choice

**Format for questions**:
```
I found [issue]. There are [N] approaches:

1. [Approach A] - [Pros/Cons]
2. [Approach B] - [Pros/Cons]

Recommendation: [Default based on evidence]

Which would you prefer?
```

### Step 5: Version Bump Assessment

If breaking changes:
- Major: v1.0.0 → v2.0.0 (API patterns change)
- Minor: v1.0.0 → v1.1.0 (new features, backward compatible)
- Patch: v1.0.0 → v1.0.1 (bug fixes only)

### Step 6: Generate Audit Report

```markdown
## Skill Review Report: <skill-name>

**Date**: YYYY-MM-DD
**Trigger**: [Why review performed]
**Time Spent**: [Duration]

### Findings

🔴 CRITICAL (N): [List with evidence]
🟡 HIGH (N): [List with evidence]
🟠 MEDIUM (N): [List with evidence]
🟢 LOW (N): [List with evidence]

### Remediation

**Files Modified**: [List]
**Version Update**: [old] → [new]
**Breaking Changes**: Yes/No

### Verification

✅ Discovery test passed
✅ Templates work
✅ Committed: [hash]

### Recommendation

[Final assessment]
```

---

## Example: better-auth Audit

### Findings

**Issue #1: Non-existent d1Adapter** 🔴 CRITICAL

*Location*: `references/cloudflare-worker-example.ts:17`

*Problem*: Imports `d1Adapter` from `'better-auth/adapters/d1'` which doesn't exist

*Evidence*:
- Official docs: https://better-auth.com/docs/integrations/drizzle
- GitHub: No `d1Adapter` export in codebase
- Production: 4 repos use Drizzle/Kysely

*Fix*: Replace with `drizzleAdapter` from `'better-auth/adapters/drizzle'`

### Result

- **Files deleted**: 3 (obsolete patterns)
- **Files created**: 3 (correct patterns)
- **Lines changed**: +1,266 net
- **Version**: v1.0.0 → v2.0.0
- **Time**: 3.5 hours

---

## Bundled Resources

This skill references:

1. **`planning/SKILL_REVIEW_PROCESS.md`** - Complete 14-phase manual guide
2. **`scripts/review-skill.sh`** - Automated validation script
3. **`.claude/commands/review-skill.md`** - Slash command definition
4. **`references/multi-skill-tracking.md`** - Template for tracking multiple concurrent skill reviews
   Load when: User asks to review 2+ skills simultaneously or wants progress tracking

---

## When Claude Should Invoke This Skill

**Proactive triggers**:
- User mentions skill seems outdated
- Package major version mentioned
- User reports errors following skill
- Checking metadata shows >90 days since verification

**Explicit triggers**:
- "review the X skill"
- "audit better-auth skill"
- "is cloudflare-worker-base up to date?"
- "check if tailwind-v4-shadcn needs updating"

---

## Token Efficiency

**Without this skill**: ~25,000 tokens
- Trial-and-error verification
- Repeated doc lookups
- Inconsistent fixes across files
- Missing evidence citations

**With this skill**: ~5,000 tokens
- Systematic process
- Clear decision trees
- Evidence-based fixes
- Comprehensive audit trail

**Savings**: ~80% (20,000 tokens)

---

## Common Issues Prevented

### Content & API Issues
1. **Fake API adapters** - Non-existent imports
2. **Stale API methods** - Changed signatures
3. **Schema inconsistency** - Different table names
4. **Outdated scripts** - Deprecated approaches
5. **Contradictory examples** - Multiple conflicting patterns
6. **Incomplete bundled resources** - Listed files don't exist

### Structure & Standards Issues
7. **YAML errors** - Invalid frontmatter syntax
8. **Name too long** - Exceeds 64 char limit
9. **Description too long** - Exceeds 1024 char limit
10. **Invalid name format** - Not lowercase/hyphens only
11. **Reserved words** - Contains "anthropic" or "claude"
12. **Second-person descriptions** - "You should..." instead of "This skill should be used when..."
13. **SKILL.md too long** - Body exceeds 500 lines (performance impact)

### Architecture Issues
14. **Deeply nested references** - More than one level deep from SKILL.md
15. **Missing table of contents** - Files >100 lines without navigation
16. **Over-explained concepts** - Claude already knows this content

### Quality & Testing Issues
17. **Missing keywords** - Poor discoverability
18. **Version drift** - Packages >90 days old
19. **Broken links** - 404 documentation URLs
20. **No test scenarios** - Missing evaluation cases
21. **No multi-model consideration** - Only tested with one model

### Anti-Patterns
22. **Windows-style paths** - Backslashes instead of forward slashes
23. **Inconsistent terminology** - Same concept, different words
24. **Time-sensitive info** - "As of 2024" instead of version-based
25. **Too many options** - No defaults provided
26. **No feedback loops** - Complex workflows without validation steps

### Security & MCP Issues
27. **Unqualified MCP references** - Missing ServerName:tool_name format
28. **Silent error handling** - "Punt" instead of "solve"
29. **Unvalidated external URLs** - Fetching from untrusted sources
30. **Missing permissions warnings** - Scripts without clear scope
31. **Non-standard marketplace fields** - Custom fields rejected by schema (e.g., lastVerified)

### Resource Inventory Issues (NEW in v1.4.0)
32. **Duplicate extraction** - Creating reference files for content that already exists
33. **Skipping resource inventory** - Starting condensation without Phase 12.5
34. **Coverage matrix omitted** - No documentation of what exists vs needs extraction
35. **Listing without reading** - Knowing reference files exist but not reading their content
36. **Unnecessary file creation** - Creating new references when existing ones suffice

---

## Best Practices

1. **Always cite sources** - GitHub URL, docs link, npm changelog
2. **No assumptions** - Verify against current official docs
3. **Be systematic** - Follow all 15 phases (including Phase 12.5)
4. **Inventory before condensation** - Always complete Phase 12.5 before fixing
5. **Fix consistency** - Update all files, not just one
6. **Document thoroughly** - Detailed commit messages
7. **Test after fixes** - Verify skill still works

---

## Known Limitations

- Link checking requires network access
- Package version checks need npm installed
- Context7 MCP availability varies by package
- Production repo search may need GitHub API
- Manual phases require human judgment

---

## Version History

**v1.4.0** (2025-12-14)
- CRITICAL: Added Phase 12.5 "Resource Inventory & Coverage Audit" (MANDATORY before condensation)
- Added mandatory verification checklist before any condensation work
- Expanded anti-patterns with 5 new duplication prevention rules
- Added 6 new best practices for resource inventory workflow
- Added coverage matrix template for tracking existing vs needed references
- Errors prevented: 40+ (was 36+)

New errors prevented:
- Duplicate extraction (content already in references)
- Skipping resource inventory phase
- Coverage matrix omitted
- Listing without reading reference files
- Unnecessary file creation

**v1.3.0** (2025-11-25)
- Added anti-patterns section to Phase 13 (Fix Implementation) with explicit DO/DON'T guidance
- Created multi-skill tracking template (`references/multi-skill-tracking.md`) for batch reviews
- Added 5 critical anti-patterns to prevent destructive refactoring workflows
- Errors prevented: 36+ (was 31+)

**v1.2.0** (2025-11-16)
- Added marketplace schema compliance check (no custom fields like lastVerified)
- Errors prevented: 31+ (was 30+)

**v1.1.0** (2025-11-16)
- Enhanced with official Claude best practices documentation
- 14-phase systematic audit process (was 9-phase)
- Added exact YAML validation rules (name: 64 chars, description: 1024 chars)
- Added SKILL.md line count check (<500 lines)
- Added progressive disclosure architecture review
- Added conciseness & degrees of freedom audit
- Added anti-pattern detection (Windows paths, inconsistent terminology)
- Added testing & evaluation review (multi-model, 3+ test scenarios)
- Added security & MCP considerations

**v1.0.0** (2025-11-08)
- Initial release
- 9-phase systematic audit process
- Automated script + manual guide
- Slash command + skill wrapper
- Production-tested on better-auth v2.0.0 audit

---

## Additional Resources

- **Full Process Guide**: `planning/SKILL_REVIEW_PROCESS.md`
- **Repository**: https://github.com/secondsky/claude-skills
- **Example Audit**: See process guide Appendix B (better-auth v2.0.0)

---

**Last verified**: 2025-12-14 | **Version**: 1.4.0
