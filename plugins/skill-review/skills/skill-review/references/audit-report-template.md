# Skill Review Audit Report Template

Use this template to document skill audit findings.

---

## Skill Review Report: [SKILL-NAME]

**Date**: YYYY-MM-DD
**Audit Type**: Deep review / Quick check
**Trigger**: [Why review was performed]
**Time Spent**: [Duration]
**Auditor**: Claude (Sonnet 4.5) / Human

---

### Executive Summary

**Status**: ✅ PASS / ⚠️ WARN / ❌ FAIL

**Findings**:
- 🔴 Critical: [N] issues
- 🟡 High: [N] issues
- 🟠 Medium: [N] issues
- 🟢 Low: [N] issues

**Action Required**: [None / Minor fixes / Comprehensive refactor]

**Version Bump**: [None / Patch / Minor / Major]

---

### Quick Validation Checks

| Check | Rule | Status | Actual |
|-------|------|--------|--------|
| Name Length | Max 64 chars | ✅/❌ | [N chars] |
| Name Format | `^[a-z0-9-]+$` | ✅/❌ | [pattern] |
| Reserved Words | No "anthropic"/"claude" | ✅/❌ | [found/none] |
| Description Length | Max 1024 chars | ✅/❌ | [N chars] |
| Description XML Tags | No `<tag>` content | ✅/❌ | [found/none] |
| SKILL.md Lines | <500 lines | ✅/❌ | [N lines] |
| Third-Person Style | "This skill..." not "You should..." | ✅/❌ | [compliant/issues] |

---

### Progressive Disclosure Score

**Architecture Compliance**: [Good / Needs Work / Major Issues]

- **Reference Depth**: ✅/❌ One level deep from SKILL.md
- **TOC for Long Files**: ✅/❌ Files >100 lines have table of contents
- **3-Tier Model**:
  - Level 1 (Metadata): ✅/❌ Concise, always-loaded
  - Level 2 (SKILL.md): ✅/❌ <500 lines, core content
  - Level 3 (Resources): ✅/❌ On-demand loading
- **Nested References**: [N found] (should be 0)

**Token Efficiency Notes**:
- [Observations about context usage]
- [Suggestions for optimization]

---

### Conciseness Rating

**Score**: [1-10] (10 = maximally concise)

**Over-Explained Concepts** (Claude already knows):
- [Concept 1]: [Where found]
- [Concept 2]: [Where found]

**Verbose Sections**:
- [Section]: Could reduce by [N] lines
- [Section]: Duplicates information from [other section]

**Degrees of Freedom Assessment**:
- Task Fragility: [High / Medium / Low]
- Current Freedom Level: [High / Medium / Low]
- Appropriate: ✅/❌

**Terminology Consistency**:
- ✅/❌ Same concept uses same words throughout
- Inconsistencies found: [List if any]

---

### Anti-Pattern Detection

**Count**: [N] anti-patterns found

- ❌/✅ Windows-style paths (`\` instead of `/`)
- ❌/✅ Inconsistent terminology
- ❌/✅ Time-sensitive information ("as of 2024")
- ❌/✅ Too many options without defaults
- ❌/✅ Deeply nested references (>1 level)
- ❌/✅ Vague phrases without examples
- ❌/✅ Missing input/output examples
- ❌/✅ No feedback loops in workflows

**Specific Findings**:
1. [Anti-pattern]: [Location and fix]
2. [Anti-pattern]: [Location and fix]

---

### Testing & Evaluation Review

**Test Coverage**: [Excellent / Good / Needs Improvement / Missing]

- **Test Scenarios**: [N] found (minimum 3 required)
  1. [Scenario 1]
  2. [Scenario 2]
  3. [Scenario 3]

- **Multi-Model Consideration**: ✅/❌
  - Haiku: [Notes]
  - Sonnet: [Notes]
  - Opus: [Notes]

- **Real Problem Validation**: ✅/❌
  - Skill solves actual user pain points: [Evidence]
  - Not theoretical/imagined problems: [Assessment]

- **Production Testing Evidence**:
  - ✅/❌ Evidence provided
  - Details: [What was tested, results]

---

### Security & MCP Review

- **External URL Fetches**: [N] found
  - URLs: [List with risk assessment]
  - Recommendation: [Keep / Remove / Add warning]

- **MCP Tool References**:
  - ✅/❌ All fully qualified (ServerName:tool_name)
  - Issues: [List if any]

- **Error Handling Quality**:
  - ✅/❌ "Solve, don't punt" pattern followed
  - Silent failures: [List if any]

- **Script Security**:
  - Permissions: [Assessment]
  - Warnings: [Any missing warnings]

---

### Detailed Findings

#### Issue #1: [Short Description]

**Severity**: 🔴 CRITICAL / 🟡 HIGH / 🟠 MEDIUM / 🟢 LOW

**Location**: `file.ts:123` or SKILL.md section

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

**Breaking Change**: Yes / No

---

[Repeat for each issue]

---

### Remediation Summary

**Files Deleted** ([N]):
- `path/to/file.ts` (reason)

**Files Created** ([N]):
- `path/to/file.ts` (purpose)

**Files Modified** ([N]):
- `path/to/file.ts` (changes)

**Lines Changed**:
- Removed: [N] lines
- Added: [N] lines
- Net: [±N] lines

---

### Version Update

**Version**: [old] → [new]

**Reason**: [Breaking changes / New features / Bug fixes]

**Migration Path**: [If breaking changes, how to upgrade]

**Changelog**:
```markdown
v[new] (YYYY-MM-DD)
[BREAKING if applicable]: [Summary]

Critical:
- [List critical fixes]

High:
- [List high-priority fixes]

Medium:
- [List medium fixes]

Low:
- [List low fixes]

Migration: [How to upgrade if breaking]
```

---

### Post-Fix Verification

**Discovery Test**:
- ✅ / ❌ Skill recognized by Claude
- ✅ / ❌ Metadata loads correctly

**Template Test** (if applicable):
- ✅ / ❌ Templates build successfully
- ✅ / ❌ No TypeScript errors
- ✅ / ❌ Dependencies resolve

**Consistency Check**:
- ✅ / ❌ SKILL.md vs README.md match
- ✅ / ❌ No contradictions in references/
- ✅ / ❌ Bundled Resources list accurate

**Code Quality**:
- ✅ / ❌ No TODO markers
- ✅ / ❌ No broken links
- ✅ / ❌ All imports valid

**Commit**:
- Hash: [git hash]
- Pushed: ✅ / ❌

---

### Lessons Learned

1. [Key takeaway #1]
2. [Key takeaway #2]
3. [Key takeaway #3]

---

### Recommendations

**Immediate**:
- [Action items that must be done now]

**Future**:
- [Improvements for next review cycle]

**Process**:
- [Suggestions for improving review process]

---

### Appendix

**Automation Output** (`./scripts/review-skill.sh`):
```
[Paste relevant script output]
```

**Manual Verification Notes**:
- [Additional observations]
- [Edge cases discovered]
- [Questions for maintainer]

---

**Audit Complete**: YYYY-MM-DD
**Result**: [Summary of final state]
