# Git Workflows with Claude Code

Production-tested patterns for git automation using Claude Code's Bash tool.

---

## Table of Contents

1. [Intelligent Git Commits](#intelligent-git-commits)
2. [Pull Request Automation](#pull-request-automation)
3. [Branch Management](#branch-management)
4. [Pre-Commit Hook Handling](#pre-commit-hook-handling)
5. [Common Patterns](#common-patterns)

---

## Intelligent Git Commits

### The Three-Step Pattern

**Step 1: Gather Context (Parallel)**

Make 3 parallel Bash calls:
```bash
# Call 1
git status

# Call 2
git diff --staged

# Call 3
git log -5 --oneline
```

**Why Parallel**: Independent operations, 40% faster than sequential.

**Step 2: Analyze Changes**

✅ **Do**:
- Review actual code changes (not just filenames)
- Match commit message style from `git log`
- Focus on "why" not "what"
- Keep message concise (1-2 sentences)
- Follow conventional commits format if project uses it

❌ **Don't**:
- Only look at file names
- Use vague messages ("update code", "fix bug")
- Write commit message before seeing changes

**Step 3: Commit with HEREDOC**

```bash
git add [files] && git commit -m "$(cat <<'EOF'
feat(auth): Add JWT verification middleware

Implement custom JWT template support for Clerk auth.
Extracts email and metadata claims for user context.

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Step 4: Verify**

```bash
git status
```

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance

**Example**:
```
feat(api): Add user authentication endpoint

Implement JWT-based authentication with refresh tokens.
Integrates with Clerk for user management.

Closes #123
```

---

## Pull Request Automation

### The Four-Step Pattern

**Step 1: Understand Branch State (Parallel)**

```bash
# Call 1
git status

# Call 2
git diff main...HEAD

# Call 3
git log main..HEAD --oneline
```

**Key**: Use `main...HEAD` (three dots) to see changes since branch diverged.

**Step 2: Analyze ALL Commits**

❌ **Wrong**: Only look at latest commit
✅ **Correct**: Review entire branch history

Questions to answer:
- What changed since branch diverged from main?
- What's the overall goal?
- What needs testing?
- Are there breaking changes?

**Step 3: Create PR with gh CLI**

```bash
gh pr create --title "feat: User Authentication" --body "$(cat <<'EOF'
## Summary
- Implement JWT verification with Clerk
- Add login/logout endpoints
- Update database schema for users table

## Changes
- New `auth/` directory with middleware
- Database migration for users table
- Integration tests for auth flow

## Test Plan
- [ ] Verify JWT token validation
- [ ] Test login flow (valid credentials)
- [ ] Test login flow (invalid credentials)
- [ ] Test logout flow
- [ ] Confirm database migrations work
- [ ] Check error handling for expired tokens

## Breaking Changes
None

## Deployment Notes
Requires environment variables:
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`

🤖 Generated with Claude Code
EOF
)"
```

**Step 4: Verify PR Created**

```bash
gh pr view --web
```

### PR Templates

Keep templates in `.github/pull_request_template.md`:

```markdown
## Summary
<!-- Brief description of changes -->

## Changes
<!-- Bulleted list of specific changes -->

## Test Plan
<!-- Checkboxes for testing steps -->

## Breaking Changes
<!-- None or description -->

## Deployment Notes
<!-- Any special deployment requirements -->
```

---

## Branch Management

### Creating Feature Branches

```bash
# Create and checkout
git checkout -b feature/user-auth

# Or separate commands
git branch feature/user-auth && git checkout feature/user-auth
```

**Naming Conventions**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation
- `chore/description` - Maintenance

### Syncing with Main

```bash
# Update main first
git checkout main && git pull origin main

# Switch back and rebase
git checkout feature/user-auth && git rebase main
```

**Important**: Never use interactive rebase (`-i`) in Claude Code (requires interactive input).

### Cleaning Up Branches

```bash
# Delete local branch (after merged)
git branch -d feature/user-auth

# Delete remote branch
git push origin --delete feature/user-auth

# Prune deleted remote branches
git fetch --prune
```

---

## Pre-Commit Hook Handling

### The Problem

Pre-commit hooks (like prettier, eslint) modify files after staging, causing commits to fail.

### The Solution

**Step 1: Attempt Commit**

```bash
git add . && git commit -m "Your message"
```

**Step 2: If Fails Due to Hook Changes**

Check if safe to amend:

```bash
# Check authorship
git log -1 --format='%an %ae'

# Check not pushed
git status  # Should show "ahead of origin"
```

**Step 3: Amend or New Commit**

```bash
# If safe (authored by you, not pushed)
git add . && git commit --amend --no-edit

# If not safe (authored by someone else or already pushed)
git add . && git commit -m "Apply pre-commit hook changes"
```

### Important Rules

❌ **Never amend**:
- Commits authored by others
- Commits already pushed to remote
- Commits on main/master branch

✅ **Safe to amend**:
- Your own commits
- Not yet pushed
- On feature branch

---

## Common Patterns

### Squash Commits Before Merge

```bash
# Interactive rebase (manual, not in Claude Code)
# Use GitHub's "Squash and merge" button instead

# Or via gh CLI
gh pr merge 123 --squash --delete-branch
```

### Cherry-Pick Commits

```bash
# Get commit hash
git log --oneline

# Cherry-pick to current branch
git cherry-pick abc1234
```

### Stash Changes

```bash
# Stash uncommitted changes
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and remove from stash list
git stash pop
```

### View File History

```bash
# See commits that modified file
git log --follow -- path/to/file.ts

# See changes to file
git log -p -- path/to/file.ts
```

### Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)

```bash
# ⚠️ Dangerous: Cannot be undone
git reset --hard HEAD~1
```

### View Specific Commit

```bash
git show abc1234
```

### Compare Branches

```bash
# See commits in feature not in main
git log main..feature/user-auth

# See file differences
git diff main...feature/user-auth
```

---

## GitHub CLI (gh) Integration

### Installation

```bash
brew install gh
# or
apt install gh
```

### Authentication

```bash
gh auth login
```

### Common Commands

```bash
# Create PR
gh pr create --title "Title" --body "Body"

# List PRs
gh pr list

# View PR
gh pr view 123

# Merge PR
gh pr merge 123 --squash

# Comment on PR
gh pr comment 123 --body "LGTM! 🚀"

# Create issue
gh issue create --title "Bug" --body "Description"

# View CI status
gh run list --limit 5

# View API
gh api repos/owner/repo/pulls/123/comments
```

---

## Production Examples

### Example 1: Feature Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-search

# 2. Make changes, commit regularly
git add . && git commit -m "feat(search): Add search endpoint"

# 3. Keep in sync with main
git fetch origin main && git rebase origin/main

# 4. Push to remote
git push -u origin feature/add-search

# 5. Create PR
gh pr create --title "feat: Add search functionality" --body "..."

# 6. After approval, merge
gh pr merge --squash --delete-branch
```

### Example 2: Hotfix Workflow

```bash
# 1. Branch from main
git checkout main && git pull && git checkout -b hotfix/critical-bug

# 2. Fix and commit
git add . && git commit -m "fix: Resolve critical auth bug"

# 3. Push and create PR
git push -u origin hotfix/critical-bug
gh pr create --title "fix: Critical auth bug" --body "..." --label "urgent"

# 4. Fast-track merge
gh pr merge --squash --delete-branch --admin
```

### Example 3: Release Workflow

```bash
# 1. Ensure on main
git checkout main && git pull

# 2. Create tag
TAG="v$(date +%Y.%m.%d)"
git tag -a "$TAG" -m "Release $TAG"

# 3. Push tag
git push origin "$TAG"

# 4. Create GitHub release
gh release create "$TAG" --title "Release $TAG" --notes "..."
```

---

## Troubleshooting

### Problem: Merge Conflicts

**Detection**:
```bash
git status  # Shows "both modified" files
```

**Resolution**:
```bash
# 1. Open conflicted files (use Edit tool)
# 2. Resolve conflicts manually
# 3. Stage resolved files
git add path/to/file.ts

# 4. Continue rebase/merge
git rebase --continue
# or
git merge --continue
```

### Problem: Accidentally Committed to Wrong Branch

**Solution**:
```bash
# 1. Note commit hash
git log -1

# 2. Reset branch
git reset --hard HEAD~1

# 3. Switch to correct branch
git checkout correct-branch

# 4. Cherry-pick commit
git cherry-pick <hash>
```

### Problem: Need to Undo Push

**Solution** (if no one else pulled):
```bash
# ⚠️ Dangerous: Rewrites history
git reset --hard HEAD~1
git push --force
```

**Better Solution** (if others may have pulled):
```bash
# Creates new commit that undoes changes
git revert HEAD
git push
```

---

## Best Practices Summary

✅ **Always Do**:
- Commit atomically (one logical change per commit)
- Write clear commit messages
- Pull before pushing
- Review changes before committing
- Use conventional commits format
- Keep commits focused

❌ **Never Do**:
- Commit directly to main (use PRs)
- Force push to shared branches
- Amend commits after pushing
- Commit secrets or credentials
- Use `git add .` without reviewing
- Write vague commit messages

---

**Production Validated**: These patterns are used daily in real-world projects with Claude Code.
