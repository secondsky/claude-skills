---
name: open-source-contributions
description: Open source contribution best practices with PR validation scripts. Use for pull requests, community contributions, or encountering personal artifacts in PRs, working on main branch, untested submissions, unrelated changes, unfocused PRs.

  Keywords: open source contributions, github pull request, PR best practices, contribution guidelines, feature branch workflow, PR description, commit messages, open source etiquette, maintainer-friendly PR, PR checklist, clean PR, avoid personal artifacts, session notes cleanup, planning docs cleanup, test before PR, unrelated changes, working on main branch, focused PR, single feature PR, professional communication, community contributions, public repository contributions, fork workflow, upstream sync
license: MIT
metadata:
  version: "2.0.0"
  last_verified: "2025-11-18"
  production_tested: true
  token_savings: "~70%"
  errors_prevented: 16
  templates_included: 4
  references_included: 3
---

# Open Source Contributions Skill

**Version**: 2.0.0 | **Last Verified**: 2025-11-18 | **Production Tested**: ✅

---

## Quick Start (5 Minutes)

### 1. Read Contribution Guidelines

```bash
cat CONTRIBUTING.md       # ALWAYS read first
cat CODE_OF_CONDUCT.md
```

### 2. Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/project.git
cd project
git remote add upstream https://github.com/ORIGINAL-OWNER/project.git
```

### 3. Create Feature Branch

```bash
# NEVER work on main!
git checkout -b feature/add-oauth-support
```

### 4. Make Changes, Test, Commit

```bash
# Make changes
npm test
npm run build
npm run lint

# Commit
git commit -m "feat(auth): add OAuth2 support"
```

### 5. Validate Before PR

```bash
# Run validation script
bash scripts/validate-pr.sh  # Load from templates/validate-pr.sh

# Push
git push origin feature/add-oauth-support
```

### 6. Create PR on GitHub

Use template from `templates/pr-description.md` - include What/Why/How/Testing/Evidence

**Load `references/workflow-guide.md` for complete step-by-step workflow.**

---

## The 3 Critical Rules (NEVER SKIP)

### RULE 1: Always Work on Feature Branches

**NEVER commit directly to main/master branch**

```bash
# ❌ WRONG: Working on main
git checkout main
git commit -m "add feature"  # DON'T DO THIS

# ✅ CORRECT: Create feature branch
git checkout -b feature/my-feature
git commit -m "add feature"  # This is correct
```

**Why?**
- Keeps main clean for syncing with upstream
- Allows working on multiple features simultaneously
- Makes it easy to discard or restart feature work
- Prevents messy git history

**Recovery if you committed to main:**

```bash
# Move commits to feature branch
git branch feature/my-feature    # Create branch with commits
git reset --hard upstream/main   # Reset main to upstream
git checkout feature/my-feature  # Switch to feature branch
```

---

### RULE 2: Test Thoroughly with Evidence Before PR

**NEVER submit untested code**

**Required testing:**
1. All existing tests pass locally
2. New tests added for new functionality
3. Manual testing with screenshots/videos
4. Build succeeds
5. Linting passes

**Required evidence in PR description:**

```markdown
## Testing

### Automated Tests
- [x] All existing tests pass (450/450)
- [x] Added 15 new tests for feature
- [x] Coverage: 92%

### Manual Testing
- [x] Tested on Chrome, Firefox, Safari
- [x] Tested edge cases and error states
- [x] Performance testing (handles 1000+ items)

### Evidence
- Screenshot: [feature working](link)
- Video: [full walkthrough](link)
```

**Why?**
- Maintainers can't merge untested code
- CI failures waste everyone's time
- Bugs in production damage project reputation
- Shows professionalism and respect

---

### RULE 3: Keep PRs Focused on Single Feature

**One PR = One Feature**

```bash
# ❌ WRONG: Multiple unrelated changes
git checkout -b feature/oauth-and-bugfixes
# Adding OAuth + fixing 5 unrelated bugs

# ✅ CORRECT: Separate branches for separate concerns
git checkout -b feature/add-oauth        # Just OAuth
git checkout -b fix/pagination-bug       # Just pagination fix
git checkout -b fix/login-redirect       # Just login fix
```

**Good PRs:**
- Fix one bug
- Add one feature
- Refactor one module
- Update one set of related docs

**Bad PRs:**
- Fix bug + add feature
- Multiple unrelated features
- Refactor + new functionality

**Why?**
- Easier to review (reviewers can focus)
- Easier to revert if issues found
- Clearer git history
- Faster merge (less discussion needed)

**Load `references/error-catalog.md` for all 16 mistakes and detailed fixes.**

---

## Top 5 Mistakes

**For complete catalog**: Load `references/error-catalog.md` when making any contribution to see all 16 mistakes, detailed fixes, and prevention strategies.

**Quick list** (most common):
1. **Including personal artifacts** - SESSION.md, planning/*, debug screenshots, temp test files
2. **Not testing before PR** - Submitting untested code causing CI failures (Violates RULE 2)
3. **Working on main branch** - Committing directly to main instead of feature branch (Violates RULE 1)
4. **Including unrelated changes** - Mixing multiple features/fixes in one PR (Violates RULE 3)
5. **Submitting massive PRs** - PRs >500 lines are hard to review (split into <200 line chunks)

**Prevention**: Run `templates/validate-pr.sh` before every PR to catch these automatically.

**For detailed fixes and code examples**: Load `references/error-catalog.md`

---

## Common Use Cases

**For complete workflows**: Load `references/workflow-guide.md` when implementing any contribution pattern.

**Quick trigger guide**:

1. **Fix existing bug** → Sync main, create `fix/` branch, test, commit with "Fixes #123"
2. **Add new feature** → Create issue first, get approval, create `feature/` branch, implement incrementally
3. **Update documentation** → Create `docs/` branch, edit, commit with "Closes #789"
4. **First-time contribution** → Read CONTRIBUTING.md, fork, clone, add upstream, find good first issue
5. **Validate before PR** → Run `templates/validate-pr.sh` (automated) or `templates/pre-submission-checklist.md` (manual)

**For step-by-step commands and patterns**: Load `references/workflow-guide.md` → specific workflow section

---

## When to Load References

### Load `references/workflow-guide.md` when:
- First-time contributor to open source
- Need complete fork-to-PR walkthrough
- Troubleshooting git issues (merge conflicts, committed to main, etc.)
- Want step-by-step guide for each contribution type
- Need command reference for common operations

### Load `references/error-catalog.md` when:
- Making any type of contribution (prevention)
- PR was rejected/feedback received
- Want to understand all 16 common mistakes
- Need detailed fixes for specific issues
- Want prevention checklist

### Load `references/pr-templates.md` when:
- Creating pull request description
- Need commit message format
- PR includes breaking changes
- Large PR that needs justification
- Reopening old/abandoned PR

---

## What NOT to Include in PRs

**Personal Development Artifacts (NEVER include):**

```
❌ SESSION.md, NOTES.md, TODO.md          # Session notes
❌ planning/*, research-logs/*            # Planning docs
❌ screenshots/debug-*, screenshots/test-* # Debug screenshots
❌ test-manual.js, quick-test.py          # Temp test files
❌ IMPLEMENTATION_PHASES.md               # Project planning
❌ SCRATCH.md, DEBUGGING.md               # Temporary notes
```

**Use validation script to check:**

```bash
bash scripts/validate-pr.sh  # Load from templates/
```

**Load `references/error-catalog.md` → Mistake #2 for complete list.**

---

## Using Bundled Resources

### References (references/)

- **workflow-guide.md** - Complete fork-to-PR workflow (setup → contribution → after merge)
- **error-catalog.md** - All 16 common mistakes with fixes and prevention
- **pr-templates.md** - Templates for PR descriptions, commit messages, breaking changes

### Templates (templates/)

- **pr-description.md** - Copy-paste PR description template
- **pre-submission-checklist.md** - Complete checklist before submitting
- **validate-pr.sh** - Automated validation script (run before every PR)

---

## Pre-Submission Checklist

**For complete checklist**: Load `templates/pre-submission-checklist.md` when validating PR before submission.

**Quick essentials**:
- Code: Tests pass, build succeeds, linting passes
- Git: On feature branch, no personal artifacts, focused changes
- Docs: README/comments/CHANGELOG updated if needed
- PR: Clear title, detailed description with testing evidence, issues linked, <500 lines

**Automated validation**: Run `templates/validate-pr.sh` to check automatically.

---

## Quick Command Reference

**For complete command reference**: Load `references/workflow-guide.md` when setting up fork, syncing with upstream, or managing contribution workflow.

**Essential commands**:
- Setup: `git clone` → `git remote add upstream`
- Sync: `git pull upstream main` → `git push origin main`
- Work: `git checkout -b feature/name` → test → commit → `bash scripts/validate-pr.sh`
- Submit: `git push origin feature/name` → create PR on GitHub
- After merge: sync main → `git branch -d feature/name`

**Load `references/workflow-guide.md` → "Quick Command Reference" for detailed commands.**

---

## Communication Best Practices

**For complete templates**: Load `references/pr-templates.md` when writing PR descriptions or communicating with maintainers.

**Key principles**:
- Be patient (wait 1-2 weeks before follow-up)
- Be responsive (reply within 48 hours)
- Be professional (always courteous)
- Be appreciative (maintainers are volunteers)

**Common scenarios**: Claiming issues, receiving feedback, following up on PRs - all covered in references with example templates.

---

## Troubleshooting

**For complete solutions**: Load `references/workflow-guide.md` → "Troubleshooting" when encountering git issues or PR problems.

**Common problems**:
- Committed to main by mistake
- Need to remove personal artifacts
- PR too large

**All solutions with commands available in workflow-guide.md**

---

## Key Takeaways

**The 3 Critical Rules** (detailed in lines 79-185):
1. ALWAYS work on feature branches (never main)
2. ALWAYS test thoroughly before PR (with evidence)
3. ALWAYS keep PRs focused (one feature/fix per PR)

**Before Every PR**: Run `validate-pr.sh` script, remove artifacts, test thoroughly

**Load `references/error-catalog.md` to avoid all 16 common mistakes.**

---

## Resources

**References** (`references/`):
- `error-catalog.md` - All 16 common mistakes that annoy maintainers with prevention strategies
- `pr-templates.md` - PR description templates and writing best practices
- `workflow-guide.md` - Complete contribution workflow (includes commit message best practices, PR sizing guidelines)

**Templates** (`templates/`):
- `validate-pr.sh` - Pre-PR validation script

---

## Related Skills

- **github-project-automation** - GitHub workflow automation
- **feature-dev** - Feature development best practices
- **claude-code-bash-patterns** - Git command patterns

---

**Questions? Issues?**

1. Check `references/error-catalog.md` for all 16 mistakes
2. Review `references/workflow-guide.md` for complete workflow
3. Use `references/pr-templates.md` for PR descriptions
4. Run `templates/validate-pr.sh` before every PR
