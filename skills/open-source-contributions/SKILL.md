---
name: open-source-contributions
description: |
  Use this skill when contributing code to open source projects. The skill covers proper pull request creation, avoiding common mistakes that annoy maintainers, cleaning up personal development artifacts before submission, writing effective PR descriptions, following project conventions, and communicating professionally with maintainers. It prevents 16 common contribution mistakes including working on main branch, not testing before PR submission, including unrelated changes, submitting planning documents, session notes, temporary test files, screenshots, and other personal artifacts. Includes 3 Critical Workflow Rules that must NEVER be skipped: (1) Always work on feature branches, (2) Test thoroughly with evidence before PR, (3) Keep PRs focused on single feature. The skill includes automation scripts to validate PRs before submission, templates for PR descriptions and commit messages, and comprehensive checklists. This skill should be used whenever creating pull requests for public repositories, contributing to community projects, or submitting code to projects you don't own.

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

## Top 5 Mistakes (See references/error-catalog.md for all 16)

### Mistake #1: Including Personal Development Artifacts

**Problem**: SESSION.md, planning/*, debug screenshots, temp test files

**Examples:**
- SESSION.md, NOTES.md, TODO.md
- planning/*, research-logs/*
- screenshots/debug-*.png
- test-manual.js, quick-test.py

**Fix**: Remove before PR

```bash
# Remove artifacts
git rm SESSION.md NOTES.md TODO.md
git rm -r planning/ research-logs/

# Amend last commit
git commit --amend --no-edit
```

**Prevention**: Load `templates/validate-pr.sh` and run before every PR

---

### Mistake #2: Not Testing Before Submitting (Violates RULE 2)

**Problem**: Submitting code without running tests, causing CI failures

**Fix**: ALWAYS run before pushing

```bash
npm test            # All tests must pass
npm run build       # Build must succeed
npm run lint        # Linting must pass
```

**Include testing evidence in PR** (screenshots, videos, test results)

---

### Mistake #3: Working on main/master Branch (Violates RULE 1)

**Problem**: Committing directly to main branch

**Fix**: ALWAYS create feature branch

```bash
# Correct workflow
git checkout main
git pull upstream main
git checkout -b feature/my-feature  # Create branch
# Make changes
git commit -m "add feature"
```

---

### Mistake #4: Including Unrelated Changes (Violates RULE 3)

**Problem**: Mixing multiple features/fixes in one PR

**Fix**: Create separate branches

```bash
# Found bug while adding feature?
git stash                          # Stash feature work
git checkout main
git checkout -b fix/bug            # Separate branch for bug
# Fix bug, commit, push, create PR

git checkout feature/my-feature    # Return to feature
git stash pop                      # Continue feature work
```

---

### Mistake #5: Submitting Massive Pull Requests

**Problem**: PR with >500 lines is hard to review

**Fix**: Break into smaller PRs
- Ideal: <200 lines
- Maximum: 500 lines
- Split large features into logical chunks

**Example:**

```bash
# Instead of: "Add complete OAuth system" (800 lines)
# Split into:
1. feature/add-oauth-models       # Just data models
2. feature/add-oauth-routes       # Just API routes
3. feature/add-oauth-ui           # Just UI components
```

**Load `references/error-catalog.md` for all 16 mistakes with detailed solutions.**

---

## Common Use Cases

### Use Case 1: Fix Existing Bug

**Quick Pattern:**

```bash
# 1. Sync and create branch
git checkout main && git pull upstream main
git checkout -b fix/pagination-last-page

# 2. Fix bug, test
npm test

# 3. Commit with issue reference
git commit -am "fix(pagination): correct off-by-one error

Fixes #456"

# 4. Validate and push
bash scripts/validate-pr.sh
git push origin fix/pagination-last-page
```

**Load**: `references/workflow-guide.md` → "Workflow: Fix Bug in Existing Issue"

---

### Use Case 2: Add New Feature

**Quick Pattern:**

1. Create issue first (discuss approach)
2. Wait for maintainer approval
3. Create feature branch
4. Implement incrementally (commit often)
5. Final checks: test + build + lint + cleanup
6. Create detailed PR with testing evidence

**Load**: `references/workflow-guide.md` → "Workflow: Add New Feature"

---

### Use Case 3: Update Documentation

**Quick Pattern:**

```bash
git checkout -b docs/update-api-examples
# Edit docs
git commit -am "docs(api): update examples to v2.0

Closes #789"
git push origin docs/update-api-examples
```

**Load**: `references/workflow-guide.md` → "Workflow: Update Documentation"

---

### Use Case 4: First-Time Contribution to Project

**Complete workflow:**

1. Read CONTRIBUTING.md thoroughly
2. Fork and clone repository
3. Add upstream remote
4. Install dependencies and run tests
5. Find good first issue
6. Comment to claim work
7. Follow complete fork-to-PR workflow

**Load**: `references/workflow-guide.md` → "Complete Fork-to-PR Workflow"

---

### Use Case 5: Validate PR Before Submission

**Quick Pattern:**

```bash
# Run validation script
bash scripts/validate-pr.sh  # Load from templates/

# Checks:
# - On feature branch?
# - Personal artifacts removed?
# - Tests passing?
# - Reasonable PR size?
# - Clean commit messages?
```

**Load**: `templates/validate-pr.sh` for automated validation

**Load**: `templates/pre-submission-checklist.md` for manual checklist

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

Quick checklist before submitting PR:

**Code Quality:**
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)

**Git Hygiene:**
- [ ] On feature branch (not main)
- [ ] No personal artifacts (SESSION.md, planning/*, etc.)
- [ ] Only related changes included
- [ ] Clean commit messages

**Documentation:**
- [ ] README updated (if needed)
- [ ] Code comments added
- [ ] CHANGELOG entry (if required)

**PR Quality:**
- [ ] PR title clear and descriptive
- [ ] PR description has What/Why/How/Testing
- [ ] Testing evidence included (screenshots/videos)
- [ ] Issues linked ("Closes #123")
- [ ] PR size <500 lines (or justified)

**Load `templates/pre-submission-checklist.md` for complete checklist.**

---

## Quick Command Reference

```bash
# Initial setup (one time)
git clone https://github.com/YOUR-USERNAME/project.git
cd project
git remote add upstream https://github.com/ORIGINAL-OWNER/project.git

# Before each contribution
git checkout main
git pull upstream main
git push origin main

# Start work
git checkout -b feature/my-feature

# Regular workflow
git add .
git commit -m "feat: add feature"
npm test && npm run build && npm run lint

# Validate and submit
bash scripts/validate-pr.sh  # Load from templates/
git push origin feature/my-feature
# Create PR on GitHub

# Update PR with feedback
git add .
git commit -m "fix: address review feedback"
git push origin feature/my-feature

# After merge
git checkout main
git pull upstream main
git push origin main
git branch -d feature/my-feature
```

**Load `references/workflow-guide.md` → "Quick Command Reference" for detailed commands.**

---

## Communication Best Practices

**When claiming issue:**
```markdown
Hi! I'd like to work on this. I plan to:
1. [Approach summary]
2. [Timeline]

Is this acceptable? Is anyone working on this already?
```

**When receiving feedback:**
```markdown
Thanks for the review! I've made these changes:

✅ Fixed error handling per your suggestion
✅ Added type annotations
✅ Updated documentation

Let me know if you need any other changes!
```

**When following up (after 1-2 weeks):**
```markdown
Hi! Gently pinging this PR. No rush - I know maintainers
are busy volunteers! Let me know if you need clarifications.
```

**Key principles:**
- Be patient (wait 1-2 weeks before follow-up)
- Be responsive (reply within 48 hours)
- Be professional (always courteous)
- Be appreciative (maintainers are volunteers)

---

## Troubleshooting

**Problem: Committed to main by mistake**

```bash
git branch feature/my-feature    # Create branch with commits
git reset --hard upstream/main   # Reset main
git checkout feature/my-feature  # Switch to feature branch
```

**Problem: Need to remove personal artifacts**

```bash
git rm SESSION.md NOTES.md planning/*.md
git commit --amend --no-edit
git push --force-with-lease origin feature/my-feature
```

**Problem: PR too large**

Create separate focused PRs, reference original for context.

**Load `references/workflow-guide.md` → "Troubleshooting" for all scenarios.**

---

## Key Takeaways

**The 3 Critical Rules:**
1. ALWAYS work on feature branches (never main)
2. ALWAYS test thoroughly before PR (with evidence)
3. ALWAYS keep PRs focused (one feature/fix per PR)

**Before Every PR:**
- Run `validate-pr.sh` script
- Remove personal artifacts
- Run all tests/build/lint
- Include testing evidence
- Use PR description template

**Professional Behavior:**
- Read CONTRIBUTING.md first
- Communicate clearly and professionally
- Be patient with maintainers
- Respond to feedback promptly
- Show appreciation

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
