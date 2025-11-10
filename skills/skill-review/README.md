# Skill Review Skill

Comprehensive deep-dive documentation review for claude-skills repository.

**Version**: 1.0.0 | **Last Verified**: 2025-11-08

---

## Quick Example

**User**: "Review the better-auth skill"

**Claude** (invokes skill-review):
1. Runs automated checks (`./scripts/review-skill.sh`)
2. Verifies against official docs (Context7/WebFetch)
3. Finds 6 issue categories (2 critical, 3 high, 1 medium)
4. Fixes automatically where clear
5. Reports findings with evidence citations

**Result**: better-auth v2.0.0 with correct D1 patterns

---

## What It Does

### Automated Checks ✅

- YAML frontmatter validity (syntax, required fields)
- Package version currency (vs npm registry)
- Broken links (HTTP status codes)
- TODO markers in code
- File organization (expected directories exist)
- "Last Verified" date staleness (>90 days)

### Manual Verification 🔍

- API method correctness (vs official docs)
- GitHub maintenance status (commits, issues)
- Production repository patterns (real usage)
- Code example accuracy (imports, signatures)
- Schema consistency across files

### Issue Classification 🎯

- 🔴 **CRITICAL**: Breaks functionality (fake imports, invalid config)
- 🟡 **HIGH**: Causes confusion (contradictory examples, outdated major versions)
- 🟠 **MEDIUM**: Reduces quality (stale versions, missing sections)
- 🟢 **LOW**: Polish issues (typos, formatting)

---

## Usage

### Slash Command (Explicit)

```
/review-skill <skill-name>
```

**Examples**:
- `/review-skill better-auth`
- `/review-skill cloudflare-worker-base`

### Skill Invocation (Proactive)

Claude can suggest reviews when it notices:
- "X skill seems outdated"
- "Package Y just released v2.0"
- "Skill last verified 6 months ago"

**Trigger phrases**:
- "review this skill"
- "audit the better-auth skill"
- "check if cloudflare-worker-base needs updates"
- "is tailwind-v4-shadcn current?"

---

## Installation

```bash
./scripts/install-skill.sh skill-review
```

**Verify**:
```
ls ~/.claude/skills/skill-review
```

---

## 9-Phase Process

1. **Pre-Review Setup** - Install, version check, discovery test
2. **Standards Compliance** - YAML, keywords, description
3. **Official Docs Verification** - Context7, GitHub, npm
4. **Code Examples Audit** - Imports, APIs, schemas
5. **Cross-File Consistency** - SKILL.md vs README vs references
6. **Dependencies & Versions** - Currency, breaking changes
7. **Issue Categorization** - Severity classification
8. **Fix Implementation** - Auto-fix or ask user
9. **Post-Fix Verification** - Test, commit

**Detailed guide**: `planning/SKILL_REVIEW_PROCESS.md`

---

## Output Example

```
═══════════════════════════════════════════════
  SKILL REVIEW REPORT: better-auth
═══════════════════════════════════════════════

🔴 CRITICAL (2):
  - Non-existent API: d1Adapter (line 17)
  - Schema inconsistency: users vs user tables

🟡 HIGH (3):
  - Package outdated: v1.2.0 → v1.3.34
  - Contradictory examples in 3 files
  - Setup script uses deprecated pattern

🟠 MEDIUM (1):
  - Last verified 85 days ago

═══════════════════════════════════════════════
RECOMMENDATION: Comprehensive review required
Estimated effort: 3-4 hours
Breaking changes: Yes (v2.0.0 bump)
═══════════════════════════════════════════════
```

---

## When to Use

### Required

- Major package version updates (e.g., better-auth 1.x → 2.x)
- User reports errors following skill
- Before marketplace submission

### Recommended

- Skill last verified >90 days ago
- After framework breaking changes
- When adding new features to skill
- Quarterly maintenance

### On-Demand

- Suspected issues
- Investigating user feedback
- Quality assurance before release

---

## Auto-Trigger Keywords

Claude recognizes these phrases and may suggest review:
- "review this skill"
- "review the X skill"
- "audit [skill-name]"
- "check if X needs updates"
- "is X skill current?"
- "verify X documentation"
- "X skill seems outdated"

---

## Example Audit: better-auth v2.0.0

**Trigger**: User reported D1 integration issues

**Findings**:
- 6 issues found (2 critical, 3 high, 1 medium)
- Main problem: Documented fake `d1Adapter()` API
- Required: Complete refactor with v2.0.0 bump

**Remediation**:
- Deleted: 3 files (665 lines of incorrect code)
- Created: 3 files (correct Drizzle/Kysely patterns)
- Updated: 2 files (SKILL.md, README.md)
- Lines changed: +1,266 net

**Time**: 3.5 hours

**Result**: Skill upgraded with correct patterns, all users unblocked

**Evidence**:
- GitHub: https://github.com/better-auth/better-auth
- Docs: https://better-auth.com/docs/integrations/drizzle
- Production: 4 repos verified using Drizzle/Kysely

---

## Token Efficiency

**Without skill**: ~25,000 tokens
- Trial-and-error verification
- Repeated doc lookups
- Inconsistent fixes
- Missing evidence

**With skill**: ~5,000 tokens
- Systematic process
- Clear decision trees
- Evidence-based fixes
- Comprehensive audit

**Savings**: ~80% (20,000 tokens)

---

## Common Issues Prevented

| Issue Category | Examples | Severity |
|----------------|----------|----------|
| Fake APIs | Non-existent imports/adapters | 🔴 Critical |
| Stale methods | Changed API signatures | 🔴 Critical |
| Schema inconsistency | Different table names | 🟡 High |
| Outdated scripts | Deprecated patterns | 🟡 High |
| Version drift | Packages >90 days old | 🟠 Medium |
| Contradictory examples | Multiple conflicting patterns | 🟡 High |
| Broken links | 404 documentation URLs | 🟡 High |
| YAML errors | Invalid frontmatter | 🔴 Critical |

---

## Scripts & Commands

**Review script** (automated checks):
```bash
./scripts/review-skill.sh <skill-name>
./scripts/review-skill.sh <skill-name> --quick  # Fast check
```

**Slash command** (full process):
```
/review-skill <skill-name>
```

**Skill invocation** (proactive):
```
"Review the better-auth skill"
```

---

## Resources

**Full Process Guide**: `planning/SKILL_REVIEW_PROCESS.md` (~3,500 words)

**Slash Command**: `.claude/commands/review-skill.md`

**Review Script**: `scripts/review-skill.sh`

**Repository**: https://github.com/secondsky/claude-skills

**Example Audit**: See process guide Appendix B

---

## Best Practices

1. ✅ **Always cite sources** - GitHub URL, docs link, npm changelog
2. ✅ **No assumptions** - Verify against current official docs
3. ✅ **Be systematic** - Follow all 9 phases
4. ✅ **Fix consistency** - Update all files, not just one
5. ✅ **Document thoroughly** - Detailed commit messages
6. ✅ **Test after fixes** - Verify skill still works

---

## Contributing

Found an issue with the review process? Suggestions for improvement?

1. Open issue: https://github.com/secondsky/claude-skills/issues
2. Describe: What phase could be improved?
3. Provide: Example where current process fell short

---

## Version History

**v1.0.0** (2025-11-08)
- Initial release
- 9-phase systematic audit process
- Automated script + manual guide
- Slash command + skill wrapper
- Production-tested on better-auth v2.0.0 audit

---

## License

MIT License - See LICENSE file in repository root

---

**Maintained by**: claude-skills project
**Last verified**: 2025-11-08
**Production status**: ✅ Tested (better-auth v2.0.0)
