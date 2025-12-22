---
name: skill-review
description: Comprehensive 15-phase skill audit for claude-skills repository. Use for skill updates, marketplace verification, package currency checks, or encountering standards compliance, dependency, API validation errors.

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

**For complete audit methodology**: Load `references/audit-methodology.md` when performing skill audits - includes detailed descriptions of all 15 phases, official Claude best practices enforced, error prevention catalog, verification methods, and production testing evidence.

**15-Phase Systematic Audit Overview:**

1. **Pre-Review Setup** - Install skill, test discovery, check version
2. **Standards Compliance** - YAML frontmatter validation, line count check, third-person style
3. **Official Docs Verification** - Context7 MCP / WebFetch API validation, GitHub checks, npm registry
4. **Code Examples Audit** - Import statements, API signatures, schema consistency, template testing
5. **Cross-File Consistency** - SKILL.md vs README vs references alignment
6. **Dependencies & Versions** - Package currency checks, breaking changes detection
7. **Progressive Disclosure Review** - Reference depth (ONE level), TOC presence, 3-tier model compliance
8. **Conciseness Audit** - Over-explained concepts, verbosity assessment, degrees of freedom
9. **Anti-Pattern Detection** - Windows paths, inconsistent terminology, time-sensitive info, nested references
10. **Testing & Evaluation** - Test scenarios (minimum 3), multi-model consideration, real problem validation
11. **Security & MCP** - External URLs, MCP tool qualification, error handling, script permissions
12. **Issue Categorization** - Severity classification (🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low) with evidence
12.5. **Resource Inventory** ⚠️ MANDATORY - Inventory existing references, read all files, create coverage matrix BEFORE condensation
13. **Fix Implementation** - Auto-fix unambiguous issues, ask user for architectural decisions
14. **Post-Fix Verification** - Discovery test, template validation, consistency check, commit

**Automated Checks** (`./scripts/review-skill.sh`):
- ✅ YAML syntax, package versions, broken links, TODO markers, file organization, date staleness

**Manual Verification** (AI-powered):
- 🔍 API method validation, GitHub activity, production comparisons, code correctness, schema consistency

---

## Process Workflow

**For complete workflow guide**: Load `references/audit-methodology.md` for detailed verification methods and `references/audit-report-template.md` for full report structure.

**High-Level Workflow:**

1. **Run Automated Checks** - Execute `./scripts/review-skill.sh <skill-name>` for technical validation
2. **Execute Manual Verification** - Use Context7 MCP / WebFetch for API validation, GitHub checks, production comparisons
3. **Categorize Issues** - Classify by severity (🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low) with evidence
4. **Fix Issues** - Auto-fix unambiguous issues, ask user for architectural decisions
5. **Version Bump** - Major (breaking) / Minor (features) / Patch (bugs)
6. **Generate Report** - Document findings, remediation, verification, recommendations

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

## When to Load References

Load reference files when working on specific aspects of skill audits:

### audit-methodology.md
Load when:
- **Process-based**: Need detailed description of all 15 audit phases (Pre-review Setup, Standards Compliance, Official Docs Verification, Code Examples Audit, Cross-File Consistency, Dependencies & Versions, Progressive Disclosure Review, Conciseness Audit, Anti-Pattern Detection, Testing & Evaluation, Security & MCP, Issue Categorization, Resource Inventory, Fix Implementation, Post-Fix Verification)
- **Standards-based**: Verifying YAML frontmatter standards (name 64 chars, description 1024 chars), SKILL.md file standards (<500 lines), code quality standards, reference file standards
- **Error-based**: Need complete error prevention catalog covering documentation issues (SKILL.md too long, YAML errors, version drift, schema inconsistency, Windows paths), technical issues (fake API adapters, non-existent imports, outdated dependencies), structure issues (duplicate extraction, skipping resource inventory, deeply nested references, second-person descriptions)
- **Verification-based**: Understanding automated technical checks (YAML syntax, package versions, broken links, TODO markers, file organization, date staleness), AI-powered verification methods (API validation, GitHub checks, production comparisons, code correctness), output format (severity classification)
- **Example-based**: Need production testing evidence (better-auth v2.0.0 audit with 6 critical/high issues, 665 lines removed, 1931 lines added)

### audit-report-template.md
Load when:
- **Reporting-based**: Need to document skill audit findings in standardized format
- **Template-based**: Need complete report structure (executive summary, quick validation checks, progressive disclosure score, conciseness rating, anti-pattern detection, testing & evaluation review, security & MCP review, detailed findings, remediation summary, version update, post-fix verification, lessons learned, recommendations, appendix)
- **Checklist-based**: Need specific validation checklists (7 quick validation checks: name length/format, reserved words, description length/XML, SKILL.md lines, third-person style; 8 anti-pattern checks; post-fix verification steps)
- **Severity-based**: Need to categorize findings by severity (🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low) with detailed evidence citations

### multi-skill-tracking.md
Load when:
- **Batch-based**: Reviewing 2+ skills simultaneously and need centralized progress tracking across multiple skills
- **Tracking-based**: Need to monitor progress across multiple skills, identify bottlenecks in audit workflow, ensure completeness across all 15 phases, document timestamps for each phase, prioritize work across skills, track blockers
- **Template-based**: Need tracking document structure (quick status overview table, detailed phase tracking per skill with all 15 phases, issues found by severity, batch summary statistics, active blockers, lessons learned, recommendations)
- **Workflow-based**: Need guidance on creating tracking doc, initializing skill entries, updating frequently during audits, referencing in commits
- **Status-based**: Need status indicators (⏳ Pending, 🔄 In Progress, ✅ Complete, ⚠️ Blocked, ❌ Skipped)

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

**For complete error catalog**: Load `references/audit-methodology.md` for all 36+ documented issues with detailed prevention strategies.

**Top 10 Most Common Issues:**

1. **Fake API adapters** - Non-existent imports (prevents broken code examples)
2. **SKILL.md too long** - Body exceeds 500 lines (performance impact)
3. **Duplicate extraction** - Creating reference files for content that already exists
4. **Skipping resource inventory** - Starting condensation without Phase 12.5
5. **YAML errors** - Invalid frontmatter syntax (prevents skill from loading)
6. **Version drift** - Packages >90 days old (stale documentation)
7. **Schema inconsistency** - Different patterns across files (user confusion)
8. **Windows-style paths** - Backslashes instead of forward slashes
9. **Deeply nested references** - More than one level deep from SKILL.md
10. **Second-person descriptions** - "You should..." instead of "This skill should be used when..."
11. **Verbose descriptions** - >200 chars contributing to 15k total budget exhaustion across all skills

---

## Best Practices

1. **Always cite sources** - GitHub URL, docs link, npm changelog
2. **No assumptions** - Verify against current official docs
3. **Be systematic** - Follow all 15 phases (including Phase 12.5)
4. **Inventory before condensation** - Always complete Phase 12.5 before fixing
5. **Fix consistency** - Update all files, not just one
6. **Document thoroughly** - Detailed commit messages
7. **Test after fixes** - Verify skill still works
8. **Keep descriptions concise** - Aim for <100 chars to avoid system prompt budget issues

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
