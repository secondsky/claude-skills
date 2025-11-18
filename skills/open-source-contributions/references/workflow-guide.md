# Open Source Contribution Workflow Guide

Complete step-by-step workflow for contributing to open source projects, from fork to merge.

---

## Complete Fork-to-PR Workflow

### Phase 1: Initial Setup (One Time)

#### Step 1: Fork the Repository

1. Go to project repository on GitHub
2. Click "Fork" button (top right)
3. Choose your account as fork destination
4. Wait for fork to complete

#### Step 2: Clone Your Fork

```bash
# Clone YOUR fork (not the original repo)
git clone https://github.com/YOUR-USERNAME/project-name.git
cd project-name
```

#### Step 3: Add Upstream Remote

```bash
# Add original repository as "upstream"
git remote add upstream https://github.com/ORIGINAL-OWNER/project-name.git

# Verify remotes
git remote -v
# Output:
# origin    https://github.com/YOUR-USERNAME/project-name.git (fetch)
# origin    https://github.com/YOUR-USERNAME/project-name.git (push)
# upstream  https://github.com/ORIGINAL-OWNER/project-name.git (fetch)
# upstream  https://github.com/ORIGINAL-OWNER/project-name.git (push)
```

#### Step 4: Read Contributing Guidelines

```bash
# Read these files (in order of importance)
cat CONTRIBUTING.md       # Contribution guidelines
cat CODE_OF_CONDUCT.md    # Community standards
cat README.md             # Project overview
cat .github/PULL_REQUEST_TEMPLATE.md  # PR template (if exists)
```

#### Step 5: Install Dependencies & Run Tests

```bash
# Install dependencies (check README for exact commands)
npm install  # or yarn install, pnpm install, etc.

# Run tests to ensure environment works
npm test

# Run build to ensure no errors
npm run build

# Run linter
npm run lint
```

---

### Phase 2: Start Working (For Each Contribution)

#### Step 1: Sync with Upstream

```bash
# ALWAYS sync before starting new work
git checkout main
git pull upstream main
git push origin main  # Update your fork
```

#### Step 2: Find or Create Issue

**If fixing existing issue:**
```bash
# 1. Check issue not already assigned
# 2. Check no one commented "I'm working on this"
# 3. Comment to claim work
```

**If proposing new feature:**
```markdown
<!-- Create new issue first -->
Title: Add OAuth2 authentication support

**Problem**: Users requested social login to simplify onboarding

**Proposed Solution**: Integrate passport.js with Google and GitHub
providers

**Implementation Plan**:
1. Add passport.js dependency
2. Create OAuth routes
3. Update user model
4. Add tests

**Questions**:
- Should we support other providers (Twitter, Facebook)?
- Where should we store OAuth tokens?

Is this something the project would accept? Any concerns with this approach?
```

#### Step 3: Create Feature Branch

```bash
# NEVER work on main branch!
# Use descriptive branch name

# For features
git checkout -b feature/add-oauth-support

# For bug fixes
git checkout -b fix/pagination-last-page

# For documentation
git checkout -b docs/update-api-examples

# For refactoring
git checkout -b refactor/user-service-validation
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Build/tooling changes

---

### Phase 3: Development

#### Step 1: Make Changes

Follow project conventions:
- Match existing code style
- Follow project's architecture patterns
- Use same naming conventions
- Match indentation (spaces vs tabs)

#### Step 2: Test Continuously

```bash
# Run tests after each major change
npm test

# Run specific test file
npm test -- path/to/test.spec.js

# Run linter
npm run lint

# Fix linting issues automatically (if available)
npm run lint:fix
```

#### Step 3: Commit Frequently

```bash
# Stage changes
git add src/auth/oauth.ts

# Commit with clear message
git commit -m "feat(auth): add Google OAuth2 provider"

# More descriptive commit (opens editor)
git commit
```

**Commit message guidelines:**
- First line: 50 chars or less
- Blank line
- Detailed description (wrapped at 72 chars)
- Reference issues: "Fixes #123", "Relates to #456"

---

### Phase 4: Pre-Submission Preparation

#### Step 1: Clean Up Commits (Optional)

```bash
# Interactive rebase to clean up commits
git rebase -i HEAD~5  # Last 5 commits

# Options in interactive rebase:
# pick   = keep commit as-is
# reword = change commit message
# edit   = modify commit
# squash = merge with previous commit
# fixup  = like squash but discard message
# drop   = remove commit
```

#### Step 2: Sync with Upstream Again

```bash
# Get latest changes from upstream
git checkout main
git pull upstream main

# Rebase your feature branch on latest main
git checkout feature/add-oauth-support
git rebase main

# Resolve conflicts if any
# After resolving: git rebase --continue
```

#### Step 3: Run Final Checks

```bash
# Run all tests
npm test

# Run build
npm run build

# Run linter
npm run lint

# Check for TypeScript errors (if applicable)
npx tsc --noEmit

# Run any project-specific checks
npm run verify  # if exists
```

#### Step 4: Clean Personal Artifacts

```bash
# Remove personal development files
rm SESSION.md NOTES.md TODO.md
rm -rf planning/ screenshots/debug-*

# Check what you're about to commit
git status
git diff main

# Use cleanup validation script
bash scripts/validate-pr.sh  # Load from templates/
```

---

### Phase 5: Submit Pull Request

#### Step 1: Push to Your Fork

```bash
# Push feature branch to YOUR fork
git push origin feature/add-oauth-support

# If branch already exists and you rebased
git push --force-with-lease origin feature/add-oauth-support
```

#### Step 2: Create Pull Request on GitHub

1. Go to YOUR fork on GitHub
2. GitHub shows "Compare & pull request" button - click it
3. Or: Go to "Pull requests" tab → "New pull request"
4. Ensure base repository is ORIGINAL, base branch is main
5. Ensure head repository is YOUR FORK, compare branch is your feature

#### Step 3: Fill PR Description

Use template from `references/pr-templates.md`:

```markdown
## What?

Adds OAuth2 authentication support with Google and GitHub providers

## Why?

Users requested social login to simplify onboarding (see #123). Current
email/password-only login creates friction for new users.

## How?

- Integrated passport.js for OAuth2 flow
- Added /auth/google and /auth/github endpoints
- Updated user model to store provider IDs and tokens
- Added environment variables for OAuth credentials
- Implemented account linking for existing users

## Testing

### Automated Tests
- [x] All existing tests pass (450/450)
- [x] Added 15 new integration tests for OAuth flow
- [x] Coverage increased from 85% to 92%

### Manual Testing
- [x] Tested Google OAuth on Chrome, Firefox, Safari
- [x] Tested GitHub OAuth on Chrome, Firefox, Safari
- [x] Tested account linking (existing user links Google account)
- [x] Tested error states:
  - User denies permission
  - Invalid OAuth token
  - Network timeout during flow
- [x] Verified existing email/password login still works

### Evidence
- Screenshot: [OAuth flow](https://imgur.com/oauth-flow.png)
- Video: [Full walkthrough](https://youtube.com/oauth-demo)

## Breaking Changes

❌ N/A - No breaking changes

## Related Issues

Closes #123
```

#### Step 4: Submit PR

- Click "Create pull request"
- Wait for automated checks to run
- Monitor for CI failures
- Respond to feedback promptly

---

### Phase 6: Code Review

#### Step 1: Respond to Feedback

**When reviewer requests changes:**

```bash
# Make requested changes
# Edit files as requested

# Commit changes
git add .
git commit -m "fix: address review feedback

- Updated error handling per @reviewer suggestion
- Added missing type annotations
- Fixed typo in documentation
"

# Push updates
git push origin feature/add-oauth-support
```

**Response on GitHub:**
```markdown
Thanks for the review! I've made the following changes:

✅ Updated error handling to use custom error class
✅ Added TypeScript type annotations to OAuth functions
✅ Fixed typo in README

The latest commit addresses all feedback. Please let me know if you'd
like any other changes!
```

#### Step 2: Keep PR Updated

If main branch advances while your PR is under review:

```bash
# Sync main
git checkout main
git pull upstream main

# Update feature branch
git checkout feature/add-oauth-support
git rebase main

# Push updates (use force-with-lease after rebase)
git push --force-with-lease origin feature/add-oauth-support
```

#### Step 3: Be Patient but Available

- **Response time**: Aim to respond within 48 hours
- **Follow-up time**: Wait 1-2 weeks before gentle ping
- **Professional tone**: Always courteous and appreciative

**Gentle follow-up example:**
```markdown
Hi! Just wanted to gently ping this PR. No rush - I know maintainers
are busy volunteers!

If there's anything I can clarify or improve, please let me know.
Happy to make any changes needed.
```

---

### Phase 7: After Merge

#### Step 1: Clean Up

```bash
# Sync main with upstream
git checkout main
git pull upstream main
git push origin main

# Delete feature branch locally
git branch -d feature/add-oauth-support

# Delete feature branch on your fork
git push origin --delete feature/add-oauth-support
```

#### Step 2: Update Your Fork

```bash
# Make sure your fork's main stays in sync
git checkout main
git pull upstream main
git push origin main
```

---

## Common Workflows

### Workflow: Fix Bug in Existing Issue

```bash
# 1. Sync with upstream
git checkout main
git pull upstream main

# 2. Create fix branch
git checkout -b fix/pagination-last-page

# 3. Make fix
# Edit files...

# 4. Test
npm test
npm run build

# 5. Commit
git commit -am "fix(pagination): correct off-by-one error on last page

The pagination logic used 0-based indexing while API uses 1-based,
causing last page to display no results.

Fixes #456"

# 6. Push
git push origin fix/pagination-last-page

# 7. Create PR
# Go to GitHub and create PR
```

### Workflow: Add New Feature

```bash
# 1. Create issue first (discuss approach)
# Wait for maintainer approval

# 2. Sync with upstream
git checkout main
git pull upstream main

# 3. Create feature branch
git checkout -b feature/add-oauth-support

# 4. Implement feature incrementally
# Make changes, test, commit, repeat

# 5. Final checks
npm test
npm run build
npm run lint

# 6. Clean artifacts
rm SESSION.md planning/*

# 7. Push
git push origin feature/add-oauth-support

# 8. Create detailed PR with testing evidence
```

### Workflow: Update Documentation

```bash
# 1. Sync with upstream
git checkout main
git pull upstream main

# 2. Create docs branch
git checkout -b docs/update-api-examples

# 3. Make changes
# Edit documentation files

# 4. Preview (if docs have preview)
npm run docs:preview

# 5. Check links work
# Verify all links in documentation

# 6. Commit
git commit -am "docs(api): update examples to v2.0 format

All code examples now use v2.0 endpoint format.
Added migration guide for v1.0 to v2.0 upgrade.

Closes #789"

# 7. Push and create PR
git push origin docs/update-api-examples
```

---

## Troubleshooting

### Problem: Committed to main by mistake

**Solution: Move commits to feature branch**

```bash
# Create branch with commits
git branch feature/my-feature

# Reset main to upstream
git reset --hard upstream/main

# Switch to feature branch
git checkout feature/my-feature

# Continue work on feature branch
```

### Problem: Merge conflicts during rebase

**Solution: Resolve conflicts**

```bash
# During rebase, conflicts appear
# Edit conflicted files, resolve conflicts

# Stage resolved files
git add path/to/resolved/file.ts

# Continue rebase
git rebase --continue

# If stuck, abort and ask for help
git rebase --abort
```

### Problem: Need to update PR after force-pushing

**Solution: Use --force-with-lease**

```bash
# After rebasing, push with force-with-lease
# (safer than --force)
git push --force-with-lease origin feature/my-feature
```

### Problem: Accidentally included personal files

**Solution: Remove and amend**

```bash
# Remove files
git rm SESSION.md planning/*.md

# Amend last commit
git commit --amend --no-edit

# Force push (if already pushed)
git push --force-with-lease origin feature/my-feature
```

### Problem: CI failing but passes locally

**Solution: Check environment differences**

```bash
# Check CI logs for errors
# Common issues:
# - Node version mismatch
# - Missing environment variables
# - Platform-specific test failures

# Match CI environment locally
nvm use 18  # Use same Node version as CI
npm ci      # Clean install (not npm install)
npm test    # Run tests
```

---

## Best Practices Summary

### DO ✅

1. Read CONTRIBUTING.md first
2. Create feature branches for all work
3. Test thoroughly before submitting
4. Write clear PR descriptions with evidence
5. Keep PRs focused and small (<500 lines)
6. Respond to feedback within 48 hours
7. Update documentation with code changes
8. Clean personal artifacts before PR
9. Link issues with "Closes #123"
10. Be patient and professional

### DON'T ❌

1. Don't work on main/master branch
2. Don't submit untested code
3. Don't include personal development artifacts
4. Don't make massive PRs (>500 lines)
5. Don't include unrelated changes
6. Don't ignore CI failures
7. Don't be impatient or unresponsive
8. Don't force-push without warning
9. Don't commit secrets or sensitive data
10. Don't skip documentation updates

---

## Quick Command Reference

```bash
# Setup (one time)
git clone https://github.com/YOUR-USERNAME/project.git
git remote add upstream https://github.com/ORIGINAL/project.git

# Before each contribution
git checkout main
git pull upstream main
git push origin main

# Start work
git checkout -b feature/my-feature

# Regular commits
git add .
git commit -m "feat: add feature"

# Final checks
npm test && npm run build && npm run lint

# Submit
git push origin feature/my-feature
# Then create PR on GitHub

# Update PR with changes
git add .
git commit -m "fix: address review feedback"
git push origin feature/my-feature

# After merge
git checkout main
git pull upstream main
git push origin main
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

**See `references/pr-templates.md` for PR description templates.**
**See `references/error-catalog.md` for all 16 common mistakes to avoid.**
