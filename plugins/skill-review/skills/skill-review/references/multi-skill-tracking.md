# Multi-Skill Review Tracking

**Version**: 1.0.0
**Last Updated**: 2025-11-25
**Purpose**: Template for tracking progress when reviewing multiple skills simultaneously

---

## When to Use This Template

When reviewing 2+ skills in the same session, use this tracking document to:
- **Monitor progress** across all skills in one centralized location
- **Identify bottlenecks** or phases that are taking longer than expected
- **Ensure completeness** - no phase is skipped for any skill
- **Document timestamps** for audit trail and time tracking
- **Prioritize work** by seeing which skills need attention next
- **Track blockers** that require user decisions or external resources

---

## How to Use This Template

### Step 1: Create Tracking Document

Copy the template below to a new file:
```
planning/skill-review-batch-YYYY-MM-DD.md
```

**Example**: `planning/skill-review-batch-2025-11-25.md`

### Step 2: Initialize

1. Fill in batch name (e.g., "Cloudflare Skills Q4 Audit")
2. Add skill names to the Quick Status Overview table
3. Set date started and expected completion date
4. Initialize all skills with Phase 0/14 status

### Step 3: Update Frequently

As you work through each phase:
1. **Start phase**: Change status from ⏳ to 🔄, add timestamp
2. **During phase**: Add notes about findings or issues
3. **Complete phase**: Change status to ✅, add completion timestamp and duration
4. **If blocked**: Change to ⚠️, document blocker in notes
5. **Update Quick Status**: Reflect current phase progress

**Best Practice**: Update after EVERY phase completion, not at end of session.

### Step 4: Reference in Commits

When committing fixes for a skill, link to the tracking document:
```
git commit -m "Fix better-auth v2.0.0 compatibility issues

See: planning/skill-review-batch-2025-11-25.md for full audit trail
Completed Phase 13 (Fix Implementation)
Next: Phase 14 (Post-Fix Verification)"
```

---

## Status Indicators

| Icon | Status | Meaning | Use When |
|------|--------|---------|----------|
| ⏳ | **Pending** | Not started yet | Phase hasn't begun |
| 🔄 | **In Progress** | Currently working on this phase | Active work in this phase |
| ✅ | **Complete** | Phase finished and verified | All work done, verified correct |
| ⚠️ | **Blocked** | Waiting on external dependency | User decision needed, or resource unavailable |
| ❌ | **Skipped** | Not applicable for this skill | Phase doesn't apply (e.g., no dependencies) |

---

## Tracking Template

**Copy everything below this line:**

---

# Skill Review Batch: [BATCH-NAME]

**Date Started**: YYYY-MM-DD
**Expected Completion**: YYYY-MM-DD
**Total Skills**: [N]
**Reviewer**: Claude (Sonnet 4.5) / Human
**Repository**: claude-skills

---

## Quick Status Overview

| Skill | Status | Phase | Critical Issues | High Issues | Last Updated |
|-------|--------|-------|-----------------|-------------|--------------|
| skill-1 | 🔄 In Progress | Phase 5/14 | 2 🔴 | 1 🟡 | 2025-11-25 14:30 |
| skill-2 | ⏳ Pending | Phase 0/14 | - | - | 2025-11-25 10:00 |
| skill-3 | ✅ Complete | Phase 14/14 | 0 | 0 | 2025-11-25 12:00 |

---

## Detailed Phase Tracking

### Skill: [skill-name-1]

**Skill Path**: `skills/skill-name-1/`
**Current Version**: v1.0.0
**Target Version**: v2.0.0 (if breaking changes)

| Phase | Status | Time | Started | Completed | Notes |
|-------|--------|------|---------|-----------|-------|
| 1. Pre-Review Setup | ✅ | 8 min | 10:00 | 10:08 | Installed locally, discovery works |
| 2. Standards Compliance | ✅ | 12 min | 10:08 | 10:20 | YAML valid, 485 lines (under 500) |
| 3. Official Docs Verification | 🔄 | - | 10:20 | - | Checking v2.1.0 API changes via Context7 |
| 4. Code Examples Audit | ⏳ | - | - | - | - |
| 5. Cross-File Consistency | ⏳ | - | - | - | - |
| 6. Dependencies & Versions | ⏳ | - | - | - | - |
| 7. Progressive Disclosure Review | ⏳ | - | - | - | - |
| 8. Conciseness Audit | ⏳ | - | - | - | - |
| 9. Anti-Pattern Detection | ⏳ | - | - | - | - |
| 10. Testing & Evaluation | ⏳ | - | - | - | - |
| 11. Security & MCP | ⏳ | - | - | - | - |
| 12. Issue Categorization | ⏳ | - | - | - | - |
| 13. Fix Implementation | ⏳ | - | - | - | - |
| 14. Post-Fix Verification | ⏳ | - | - | - | - |

**Issues Found**:
- 🔴 Critical: 2
  - Non-existent API method `d1Adapter` (file.ts:17)
  - Invalid import statement (file.ts:42)
- 🟡 High: 1
  - Contradictory schema in README vs SKILL.md
- 🟠 Medium: 3
  - Package version 90 days old
  - Missing TypeScript examples
  - Incomplete error documentation
- 🟢 Low: 5
  - Typos in comments
  - Formatting inconsistencies
  - Missing optional metadata fields
  - Suboptimal organization
  - Missing code comments

**Next Action**: Complete Phase 3 (Official Docs Verification), then proceed to Phase 4 (Code Examples Audit)

**Blockers**: None

---

### Skill: [skill-name-2]

**Skill Path**: `skills/skill-name-2/`
**Current Version**: v0.9.0
**Target Version**: v1.0.0 (promoting to stable)

| Phase | Status | Time | Started | Completed | Notes |
|-------|--------|------|---------|-----------|-------|
| 1. Pre-Review Setup | ⏳ | - | - | - | Awaiting completion of skill-1 Phase 5 |
| 2. Standards Compliance | ⏳ | - | - | - | - |
| 3. Official Docs Verification | ⏳ | - | - | - | - |
| 4. Code Examples Audit | ⏳ | - | - | - | - |
| 5. Cross-File Consistency | ⏳ | - | - | - | - |
| 6. Dependencies & Versions | ⏳ | - | - | - | - |
| 7. Progressive Disclosure Review | ⏳ | - | - | - | - |
| 8. Conciseness Audit | ⏳ | - | - | - | - |
| 9. Anti-Pattern Detection | ⏳ | - | - | - | - |
| 10. Testing & Evaluation | ⏳ | - | - | - | - |
| 11. Security & MCP | ⏳ | - | - | - | - |
| 12. Issue Categorization | ⏳ | - | - | - | - |
| 13. Fix Implementation | ⏳ | - | - | - | - |
| 14. Post-Fix Verification | ⏳ | - | - | - | - |

**Issues Found**: TBD (not started)

**Next Action**: Wait for skill-1 to reach Phase 5, then begin Phase 1

**Blockers**: None (queued)

---

### Skill: [skill-name-3]

**Skill Path**: `skills/skill-name-3/`
**Current Version**: v1.5.0
**Target Version**: v1.5.1 (patch - bug fixes only)

| Phase | Status | Time | Started | Completed | Notes |
|-------|--------|------|---------|-----------|-------|
| 1. Pre-Review Setup | ✅ | 5 min | 08:00 | 08:05 | Quick review, minor updates only |
| 2. Standards Compliance | ✅ | 8 min | 08:05 | 08:13 | All checks passed |
| 3. Official Docs Verification | ✅ | 15 min | 08:13 | 08:28 | API patterns current |
| 4. Code Examples Audit | ✅ | 20 min | 08:28 | 08:48 | All examples valid |
| 5. Cross-File Consistency | ✅ | 10 min | 08:48 | 08:58 | No contradictions |
| 6. Dependencies & Versions | ✅ | 8 min | 08:58 | 09:06 | All deps current |
| 7. Progressive Disclosure Review | ✅ | 12 min | 09:06 | 09:18 | Architecture compliant |
| 8. Conciseness Audit | ✅ | 10 min | 09:18 | 09:28 | Minimal verbosity |
| 9. Anti-Pattern Detection | ✅ | 8 min | 09:28 | 09:36 | No anti-patterns found |
| 10. Testing & Evaluation | ✅ | 12 min | 09:36 | 09:48 | 3 test scenarios present |
| 11. Security & MCP | ✅ | 5 min | 09:48 | 09:53 | No security issues |
| 12. Issue Categorization | ✅ | 10 min | 09:53 | 10:03 | 5 low-severity issues |
| 13. Fix Implementation | ✅ | 25 min | 10:03 | 10:28 | All low issues fixed |
| 14. Post-Fix Verification | ✅ | 10 min | 10:28 | 10:38 | Discovery test passed, committed |

**Issues Found**:
- 🔴 Critical: 0
- 🟡 High: 0
- 🟠 Medium: 0
- 🟢 Low: 5 (all fixed)
  - Fixed typos in documentation
  - Updated last_verified date
  - Added missing license field
  - Improved keyword coverage
  - Fixed markdown formatting

**Completion**: ✅ Complete - All phases passed, v1.5.1 released

**Commit**: `abc123f - skill-name-3: Patch release v1.5.1 with documentation fixes`

---

## Batch Summary Statistics

**Overall Progress**: 23% (10/42 total phases complete)

**Breakdown by Skill**:
- skill-1: 21% complete (3/14 phases)
- skill-2: 0% complete (0/14 phases)
- skill-3: 100% complete (14/14 phases) ✅

**Time Tracking**:
- Total time spent: 2.5 hours
- Average per completed skill: 2.5 hours (only skill-3 complete)
- Estimated remaining: 5 hours (for skill-1 and skill-2)
- Estimated total: 7.5 hours

**Issues Summary Across All Skills**:
- Total Critical: 2 (all in skill-1)
- Total High: 1 (in skill-1)
- Total Medium: 3 (in skill-1)
- Total Low: 10 (5 in skill-1, 5 fixed in skill-3)

**Completion Rate**:
- ✅ Completed: 1 skill (33%)
- 🔄 In Progress: 1 skill (33%)
- ⏳ Pending: 1 skill (33%)

---

## Active Blockers

**Blocker #1**: None currently

**Blocker #2**: None currently

**Resolution Strategy**: N/A

---

## Lessons Learned During This Batch

1. **Pattern Observed**: [Example: "All three skills had stale package versions >90 days old - need to set up automated version checks"]

2. **Common Issue Type**: [Example: "Schema inconsistencies between SKILL.md and README.md - should add cross-file validation to review script"]

3. **Process Improvement**: [Example: "Starting with quickest/smallest skill (skill-3) built momentum and established baseline quality"]

4. **Anti-Pattern Detected**: [Example: "Initially tried to condense Top 3 errors to one-liners - remembered anti-pattern and kept them detailed"]

5. **Time Management**: [Example: "Phase 3 (Official Docs Verification) consistently takes 2x longer than estimated - adjust planning"]

---

## Recommendations

**For This Batch**:
1. Complete skill-1 Phase 3 before starting skill-2
2. Consider parallelizing skill-1 Phase 8+ with skill-2 Phase 1-3 if blockers arise
3. Document all adapter choices for future reference

**For Future Batches**:
1. Always start with smallest/quickest skill to establish baseline
2. Budget 20% more time for Phase 3 (Official Docs Verification)
3. Create pre-batch checklist: Context7 access, npm credentials, GitHub API token
4. Set up automated reminders to update tracking doc after each phase

**Process Improvements**:
1. Add cross-file schema validator to `scripts/review-skill.sh`
2. Create automated version check that runs weekly
3. Build library of common fix patterns (e.g., d1Adapter → drizzleAdapter)

---

## Appendix: Phase Definitions

For reference, here are the 15 phases:

1. **Pre-Review Setup** - Install skill, test discovery
2. **Standards Compliance** - YAML, line count, formatting
3. **Official Docs Verification** - API patterns, GitHub activity
4. **Code Examples Audit** - Imports, methods, schemas
5. **Cross-File Consistency** - SKILL.md vs README vs references
6. **Dependencies & Versions** - Package currency, breaking changes
7. **Progressive Disclosure Review** - Reference depth, TOCs
8. **Conciseness Audit** - Verbosity, degrees of freedom
9. **Anti-Pattern Detection** - Windows paths, inconsistent terms
10. **Testing & Evaluation** - Test scenarios, multi-model
11. **Security & MCP** - MCP refs, error handling, permissions
12. **Issue Categorization** - Severity classification with evidence
12.5. **Resource Inventory & Coverage Audit** ⚠️ MANDATORY - Check existing refs before condensation
13. **Fix Implementation** - Auto-fix or ask user (after completing 12.5)
14. **Post-Fix Verification** - Discovery, templates, commit

---

**Tracking Document Last Updated**: YYYY-MM-DD HH:MM
**Tracking Template Version**: 1.1.0
