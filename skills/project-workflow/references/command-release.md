# /release - Pre-Release Safety Checks

## Overview

**Purpose:** Comprehensive safety checks before publishing to GitHub

**When to use:**
- Ready to push project to public GitHub
- Before creating GitHub release
- Want to ensure no secrets leaked
- Need to validate documentation completeness

## What It Does

### Phase 1: Critical Safety (BLOCKERS)
- Scans for secrets (API keys, tokens, passwords via gitleaks)
- Checks for personal artifacts (SESSION.md, planning/, screenshots/)
- Verifies git remote URL (pushing to correct repo)

### Phase 2: Documentation Validation (REQUIRED)
- Checks LICENSE file exists (creates if missing)
- Validates README completeness (>100 words, key sections)
- Checks CONTRIBUTING.md (recommended for >500 LOC)
- Checks CODE_OF_CONDUCT (recommended for >1000 LOC)

### Phase 3: Configuration Validation
- Validates .gitignore (essential patterns present)
- Checks package.json completeness (name, version, license, etc.)
- Verifies git branch (warns if on main/master)

### Phase 4: Quality Checks (NON-BLOCKING)
- Tests build (if build script exists)
- Checks dependency vulnerabilities (npm audit)
- Warns about large files (>1MB)

### Phase 5: Release Readiness Report
- Comprehensive report with blockers/warnings/recommendations
- Safe to release verdict

### Phase 6-8: Auto-Fix & Publish
- Offers to fix issues (create LICENSE, update README, etc.)
- Creates release preparation commit
- Optional: Creates git tag and GitHub release

## Time Savings

**10-15 minutes per release**

Eliminates manual safety checks and prevents accidental secret leaks or incomplete documentation.

## Example Usage

```
User: /release
Claude:
RELEASE SAFETY CHECK
====================
✓ No secrets detected
✓ No personal artifacts found
✓ Remote URL correct (github.com/user/repo)
✗ LICENSE file missing
✓ README.md complete
⚠ No CONTRIBUTING.md (recommended for 2000+ LOC)
✓ .gitignore valid
✓ package.json complete

VERDICT: BLOCKED - Create LICENSE file
Would you like me to create MIT LICENSE?
```

## Integration

- **Requires**: Git repository with commits
- **Uses**: gitleaks (if available), git commands, file system scans
- **Updates**: LICENSE, README.md, .gitignore, package.json (if fixing issues)
- **Generates**: Release preparation commit, optional GitHub release

## When to Load This Reference

Load this reference when:
- First time using /release
- Need to understand release safety phases
- Want to see complete check criteria
- Troubleshooting release blockers
- Building similar safety automation
