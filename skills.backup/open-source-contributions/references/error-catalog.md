# Open Source Contributions - Common Mistakes Catalog

Complete catalog of 16 mistakes that annoy maintainers, with fixes and prevention strategies.

---

## The 16 Critical Mistakes

### 1. Not Reading CONTRIBUTING.md

**Impact**: Wasted effort, rejected PRs, frustrated maintainers

**Why It Happens**: Contributors rush to code without understanding project requirements

**Fix**:
- ALWAYS read CONTRIBUTING.md first
- Follow instructions exactly
- Check for required PR template, coding standards, testing requirements
- Look for DCO (Developer Certificate of Origin) or CLA requirements

**Prevention**:
```bash
# First thing to do after cloning
cat CONTRIBUTING.md
# or
less CONTRIBUTING.md
```

---

### 2. Including Personal Development Artifacts

**Impact**: Messy PRs, reveals internal workflow, unprofessional appearance

**Why It Happens**: Not cleaning up before submission

**Examples**:
- SESSION.md, NOTES.md, TODO.md
- planning/*, research-logs/*
- screenshots/debug-*.png
- test-manual.js, quick-test.py
- IMPLEMENTATION_PHASES.md
- SCRATCH.md, DEBUGGING.md

**Fix**: Use pre-PR validation script

**Prevention**: Load `templates/cleanup-validation.sh` and run before PR

---

### 3. Submitting Massive Pull Requests

**Impact**: Overwhelming to review, harder to find bugs, delays merge

**Why It Happens**: Trying to fix "everything" in one PR

**Fix**: Break into smaller PRs
- Ideal: <200 lines changed
- Maximum: 500 lines
- Rule: One PR = One Feature

**Prevention**: Create separate feature branches for each logical change

---

### 4. Not Testing Code Before Submitting

**Impact**: CI failures, bugs in production, maintainer has to fix, loss of trust

**Why It Happens**: Assuming code works without verification

**Fix** (RULE 2 - NEVER SKIP):
1. Run full test suite locally
2. Test manually with evidence (screenshots/videos)
3. Verify build succeeds
4. Check linting passes
5. Test edge cases

**Required Evidence**:
```markdown
## Testing Performed

### Automated Tests
- [x] All existing tests pass
- [x] Added new tests for feature
- [x] Coverage: 95%

### Manual Testing
- [x] Tested on Chrome 120, Firefox 121, Safari 17
- [x] Tested with 100+ items (performance)
- [x] Tested error states

### Evidence
- Screenshot: [feature working](link)
- Video demo: [walkthrough](link)
```

**Prevention**: Never submit PR without testing evidence

---

### 5. Working on Already Assigned Issues

**Impact**: Duplicate work, wasted time for both contributors

**Why It Happens**: Not checking issue status before starting

**Fix**:
1. Check issue for "assigned to" field
2. Look for "working on this" comments
3. Comment to claim work before starting
4. Wait for confirmation from maintainers

**Prevention**:
```markdown
<!-- Comment on issue before starting -->
Hi! I'd like to work on this issue. I plan to:
1. [Approach summary]
2. [Expected timeline]

Is this approach acceptable? Is anyone already working on this?
```

---

### 6. Not Discussing Changes First (Large Features)

**Impact**: Unwanted features, rejected PRs, wasted development time

**Why It Happens**: Coding without understanding project vision

**Fix**: For changes >200 lines or new features:
1. Open discussion issue first
2. Describe proposed solution
3. Get maintainer approval
4. Then start coding

**Prevention**:
```markdown
<!-- Issue template for discussion -->
## Proposed Feature: [Name]

**Problem**: [What user problem does this solve?]

**Proposed Solution**: [High-level approach]

**Alternatives Considered**: [Other options]

**Questions**:
- [Any uncertainties]

Is this something the project would accept?
```

---

### 7. Being Impatient or Unresponsive

**Impact**: PRs stall, maintainers move on, contributions abandoned

**Why It Happens**: Mismatched expectations about response time

**Fix**:
- Be patient: Wait 1-2 weeks before pinging
- Be responsive: Reply within 48 hours when maintainer responds
- Be respectful: Maintainers are volunteers

**Prevention**:
```markdown
<!-- After 1-2 weeks of no response -->
Hi! Just wanted to gently ping this PR. No rush - I know maintainers
are busy! Let me know if you need any changes or clarifications.
```

---

### 8. Not Updating Documentation

**Impact**: Users and developers confused by undocumented changes

**Why It Happens**: Focusing only on code, forgetting docs

**Fix**: For every code change, check if these need updates:
- README.md (user-facing features)
- API documentation
- Inline code comments
- CHANGELOG.md
- Migration guides (breaking changes)

**Prevention Checklist**:
- [ ] README.md updated (if user-visible change)
- [ ] API docs updated (if API change)
- [ ] Code comments added (for complex logic)
- [ ] CHANGELOG.md entry added
- [ ] Migration guide (if breaking change)

---

### 9. Ignoring Code Style Standards

**Impact**: Messy codebase, maintainer has to fix formatting

**Why It Happens**: Not running project's formatters/linters

**Fix**:
1. Check for .prettierrc, .eslintrc, etc.
2. Run formatters before committing
3. Match existing code style
4. Use project's pre-commit hooks

**Prevention**:
```bash
# Install and run project formatters
npm run format      # or yarn format
npm run lint        # or yarn lint
npm run lint:fix    # auto-fix issues

# If no scripts, use common tools
npx prettier --write .
npx eslint --fix .
```

---

### 10. Ignoring CI Failures

**Impact**: Can't merge, blocks progress, maintainer has to investigate

**Why It Happens**: Not monitoring PR after submission

**Fix**:
1. Watch for CI status after pushing
2. Click "Details" on failed checks
3. Fix failures immediately
4. Ask for help if stuck

**Prevention**: Set up GitHub notifications for PR activity

---

### 11. Including Unrelated Changes (Violates RULE 3)

**Impact**: Difficult review, harder to revert, scope creep, confusing git history

**Why It Happens**: Making multiple changes on same branch

**Examples**:
- Fixing bug + adding feature in same PR
- Refactoring + new functionality
- Multiple unrelated features

**Fix** (RULE 3):
- One PR = One Feature
- Create separate branches for separate concerns
- If you find a bug while adding a feature, create separate PR for bug fix

**Prevention**:
```bash
# Main feature branch
git checkout -b feature/add-oauth

# Found a bug? Create separate branch
git checkout main
git checkout -b fix/login-redirect-bug
# Fix bug, submit separate PR

# Return to feature work
git checkout feature/add-oauth
```

---

### 12. Not Linking Issues Properly

**Impact**: Lost context, manual issue closing, harder to track

**Why It Happens**: Not using GitHub keywords in PR description

**Fix**: Use magic keywords in PR description:
- `Closes #123`
- `Fixes #456`
- `Resolves #789`

**Prevention**: Load `templates/pr-description.md` - includes issue linking section

---

### 13. Committing Secrets or Sensitive Data

**Impact**: Security risk, requires emergency response, potential breach

**Why It Happens**: Accidentally committing .env, API keys, credentials

**Fix**:
1. Remove from history immediately (git filter-branch or BFG)
2. Rotate all exposed secrets
3. Notify maintainers

**Prevention**:
```bash
# Check .gitignore includes
.env
.env.local
*.key
*.pem
credentials.json
secrets/*

# Use git-secrets to scan
brew install git-secrets
git secrets --install
git secrets --scan
```

---

### 14. Force-Pushing Without Warning

**Impact**: Breaks reviewer's local copies, loses comments

**Why It Happens**: Rewriting history after review starts

**Fix**:
- Avoid force-push after review starts
- If necessary, warn reviewers in comment first
- Use `git push --force-with-lease` (safer)

**Prevention**:
```bash
# Instead of git push --force, use:
git push --force-with-lease

# Better: Just add fixup commits during review
git commit -m "fixup: address review feedback"
```

---

### 15. Not Running Build/Tests Locally

**Impact**: CI failures for obvious issues, wastes CI resources

**Why It Happens**: Relying on CI instead of local testing

**Fix**: ALWAYS run before pushing:
```bash
npm run build       # or yarn build
npm test            # or yarn test
npm run lint        # or yarn lint
```

**Prevention**: Set up pre-commit hook (load `templates/pre-commit-hook.sh`)

---

### 16. Working Directly on main/master Branch (Violates RULE 1)

**Impact**: Messy git history, conflicts with upstream, can't work on multiple features, difficult to sync fork

**Why It Happens**: Not understanding fork/branch workflow

**Fix** (RULE 1 - ALWAYS FOLLOW):
```bash
# NEVER do this:
git checkout main
# make changes
git commit -m "add feature"  # ❌ WRONG

# ALWAYS do this:
git checkout -b feature/my-feature  # ✅ CORRECT
# make changes
git commit -m "add feature"
```

**Prevention**:
- Keep main/master branch clean (only for syncing with upstream)
- Create feature branch for EVERY change
- Use branch naming convention: `feature/`, `fix/`, `docs/`, `refactor/`

---

## The 3 Critical Rules (NEVER SKIP)

### RULE 1: Always Work on Feature Branches

**Never commit directly to main/master**

```bash
# Correct workflow
git checkout main
git pull upstream main  # Sync with upstream
git checkout -b feature/my-feature  # Create feature branch
# Make changes
git commit -m "Add my feature"
git push origin feature/my-feature  # Push to YOUR fork
```

---

### RULE 2: Test Thoroughly with Evidence Before PR

**Never submit untested code**

Required testing:
1. All existing tests pass locally
2. New tests added for new functionality
3. Manual testing with screenshots/videos
4. Build succeeds
5. Linting passes

Required evidence in PR:
- Test results (screenshot or output)
- Manual testing description
- Screenshots/videos of feature working
- Performance testing (if applicable)

---

### RULE 3: Keep PRs Focused on Single Feature

**One PR = One Feature**

Good PRs:
- Fix one bug
- Add one feature
- Refactor one module
- Update one set of related docs

Bad PRs:
- Fix bug + add feature
- Multiple unrelated features
- Refactor + new functionality

---

## Prevention Checklist

Use this before every PR submission:

### Code Quality
- [ ] All tests pass locally
- [ ] Build succeeds
- [ ] Linting passes
- [ ] No TypeScript/compiler errors
- [ ] Code formatted with project formatter

### Git Hygiene
- [ ] Working on feature branch (not main)
- [ ] No personal artifacts included (SESSION.md, planning/*, screenshots)
- [ ] No unrelated changes
- [ ] Commit messages follow project convention
- [ ] No secrets or sensitive data

### Documentation
- [ ] README.md updated (if needed)
- [ ] API docs updated (if needed)
- [ ] Code comments added (for complex logic)
- [ ] CHANGELOG.md entry (if needed)

### PR Quality
- [ ] PR description explains What, Why, How
- [ ] Testing evidence provided
- [ ] Issues linked with "Closes #123"
- [ ] PR size reasonable (<500 lines)
- [ ] Breaking changes noted

### Communication
- [ ] Read CONTRIBUTING.md
- [ ] Checked issue not already assigned
- [ ] Discussed large changes first
- [ ] Ready to respond to feedback

---

## Quick Recovery Guide

### If you committed to main by mistake:

```bash
# Move commits to feature branch
git branch feature/my-feature    # Create branch with commits
git reset --hard origin/main     # Reset main to upstream
git checkout feature/my-feature  # Switch to feature branch
```

### If you included personal artifacts:

```bash
# Remove from last commit
git rm SESSION.md planning/*.md
git commit --amend --no-edit

# Remove from history (if already pushed)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch SESSION.md' \
  --prune-empty --tag-name-filter cat -- --all
```

### If PR is too large:

1. Create separate feature branches
2. Close large PR
3. Submit smaller focused PRs
4. Reference original PR for context

---

**Load `references/workflow-guide.md` for complete fork workflow and best practices.**
