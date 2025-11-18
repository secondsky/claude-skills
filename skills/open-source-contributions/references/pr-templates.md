# Pull Request and Commit Message Templates

Complete templates for creating professional, maintainer-friendly PRs.

---

## PR Description Template (Standard)

Use this for most feature additions and bug fixes.

```markdown
## What?

[Clear, concise description of what changed]

Examples:
- "Adds OAuth2 authentication support with Google and GitHub providers"
- "Fixes pagination bug where last page showed no results"
- "Refactors user service to improve testability"

## Why?

[Explain the motivation and context]

Examples:
- "Users requested social login to simplify onboarding (see #123)"
- "Current pagination breaks with odd number of items (issue #456)"
- "Current code is difficult to test due to tight coupling"

## How?

[Technical details of implementation]

Example:
```
- Added passport.js integration
- Created OAuth callback endpoints
- Updated user model to store provider IDs
- Added environment variables for client IDs/secrets
```

## Testing

[Detailed testing evidence]

### Automated Tests
- [x] All existing tests pass
- [x] Added 15 new tests for OAuth flow
- [x] Coverage increased from 85% to 92%

### Manual Testing
- [x] Tested Google OAuth on Chrome, Firefox, Safari
- [x] Tested GitHub OAuth on Chrome, Firefox, Safari
- [x] Tested error states (denied permission, invalid token)
- [x] Tested existing email/password login still works

### Evidence
- Screenshot: [OAuth flow](https://imgur.com/example.png)
- Video: [Full walkthrough](https://youtube.com/example)

## Breaking Changes

[If any breaking changes, describe them clearly]

- ❌ N/A - No breaking changes
- OR
- ⚠️ YES - User model schema changed (migration script included)

## Related Issues

Closes #123
Fixes #456
Relates to #789
```

---

## PR Description Template (Bug Fix)

Use for bug fixes with clear reproduction steps.

```markdown
## Bug Description

[Clear description of the bug]

## Steps to Reproduce

1. Go to `/users` page
2. Click "Next" button on last page
3. Observe: Empty page shown
4. Expected: Should show message "No more results"

## Root Cause

[Technical explanation of why bug occurred]

Example:
```
Pagination logic used 0-based indexing but API uses 1-based,
causing off-by-one error on last page.
```

## Fix

[Explanation of fix]

Example:
```
- Updated pagination calculation to use 1-based indexing
- Added boundary check for last page
- Added "No results" message component
```

## Testing

### Reproduction
- [x] Confirmed bug exists on main branch
- [x] Bug no longer occurs with fix

### Test Coverage
- [x] Added regression test
- [x] All existing tests pass
- [x] New test fails without fix, passes with fix

### Manual Verification
- [x] Tested with 0 items
- [x] Tested with 1 page of items
- [x] Tested with multiple pages
- [x] Tested boundary: exactly 1 page worth

### Evidence
- Before: [Screenshot showing bug](link)
- After: [Screenshot showing fix](link)

## Related Issues

Fixes #456
```

---

## PR Description Template (Documentation)

Use for documentation updates.

```markdown
## What?

[What documentation changed]

Example:
- "Updates API documentation for v2.0 endpoints"
- "Adds troubleshooting guide for common errors"
- "Fixes typos in getting started guide"

## Why?

[Why documentation needed update]

Example:
- "API v2.0 released but docs still showed v1.0 examples"
- "Users repeatedly asking same questions in issues"
- "Several grammatical errors reported"

## Changes

- [x] Updated all code examples to v2.0 format
- [x] Added 5 new troubleshooting scenarios
- [x] Fixed 12 typos and grammatical errors
- [x] Added table of contents to long docs

## Review Notes

[Special instructions for reviewers]

Example:
- "Best reviewed with 'ignore whitespace' enabled"
- "Focus on technical accuracy in API examples"
- "Please verify links work"

## Related Issues

Closes #789
```

---

## Commit Message Template (Conventional Commits)

Use when project follows Conventional Commits specification.

```bash
# Format: <type>(<scope>): <subject>

# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation only
# style: Formatting, missing semi-colons, etc
# refactor: Code change that neither fixes bug nor adds feature
# perf: Performance improvement
# test: Adding missing tests
# chore: Updating build tasks, package manager configs, etc

# Examples:

feat(auth): add OAuth2 support for Google and GitHub

Adds passport.js integration with Google and GitHub OAuth2 providers.
Users can now sign in with their existing accounts.

Closes #123

---

fix(pagination): correct off-by-one error on last page

The pagination logic used 0-based indexing while API uses 1-based,
causing the last page to display no results.

Changed pagination calculation to use 1-based indexing and added
boundary check.

Fixes #456

---

docs(api): update examples to v2.0 format

All code examples now use v2.0 endpoint format. Added migration
guide for v1.0 to v2.0 upgrade.

Closes #789

---

refactor(user-service): extract validation logic

Moved validation logic to separate validator class to improve
testability and separation of concerns.

No functional changes.

---

test(auth): add missing OAuth error state tests

Added tests for:
- Invalid OAuth token
- Denied permission
- Network timeout during OAuth flow

Increases coverage from 85% to 92%.

---

chore(deps): upgrade React from 17 to 18

Updated React and React-DOM to version 18.2.0.
No breaking changes in our codebase.
```

---

## Commit Message Template (Standard)

Use when project doesn't specify commit format.

```bash
# Format: Short summary (50 chars or less)
#
# Detailed description (wrapped at 72 chars):
# - What changed
# - Why the change was needed
# - Any side effects
#
# Issue references

# Example 1: Feature
Add OAuth2 authentication support

Integrates passport.js with Google and GitHub OAuth2 providers.
Users can now sign in using their existing Google or GitHub accounts,
simplifying the onboarding process.

Implementation:
- Added passport.js and OAuth strategies
- Created /auth/google and /auth/github endpoints
- Updated user model to store provider IDs
- Added environment variables for OAuth credentials

Testing:
- Added 15 new integration tests
- Manually tested on Chrome, Firefox, Safari
- Tested error states (denied, invalid token)

Closes #123

---

# Example 2: Bug fix
Fix pagination off-by-one error on last page

The pagination logic incorrectly used 0-based indexing while the API
uses 1-based indexing, causing the last page to display no results.

Root cause: Mismatch between frontend pagination math and backend API
expectations.

Fix: Updated pagination calculation to use 1-based indexing and added
boundary check for last page.

Fixes #456

---

# Example 3: Refactoring
Refactor user service for better testability

Extracted validation logic from UserService into separate Validator
class. This improves separation of concerns and makes the code easier
to test in isolation.

Changes:
- Created UserValidator class
- Moved all validation logic to UserValidator
- Updated UserService to use UserValidator
- Added tests for UserValidator

No functional changes. All existing tests pass.
```

---

## PR Title Best Practices

### Good Titles

```
✅ Add OAuth2 authentication support
✅ Fix pagination bug on last page
✅ Update API docs to v2.0
✅ Refactor user service for testability
✅ Improve performance of search queries (3x faster)
```

### Bad Titles

```
❌ Update
❌ Fix bug
❌ Changes
❌ WIP
❌ Stuff
❌ Various fixes and improvements
```

### Title Format Guidelines

1. **Start with verb** (Add, Fix, Update, Refactor, Improve)
2. **Be specific** (What exactly changed?)
3. **Keep concise** (50-60 characters ideal)
4. **No period at end**
5. **Use present tense** (Add, not Added)

---

## Breaking Changes Template

Use when PR includes breaking changes.

```markdown
## ⚠️ BREAKING CHANGES

### What's Breaking

[Clear description of what will break]

Example:
```
The User API endpoint `/api/users` now requires authentication.
Previously public endpoint now returns 401 Unauthorized without
valid session or API key.
```

### Who's Affected

[Who will be impacted]

Example:
- All API consumers using `/api/users` endpoint
- Mobile app versions < 2.0
- Third-party integrations without API keys

### Migration Guide

[Step-by-step migration instructions]

Example:
```
1. Obtain API key from Settings > API Keys
2. Add `Authorization: Bearer <api-key>` header to all requests
3. Test authentication works
4. Deploy updated code

For mobile apps:
- Update to app version 2.0+
- Implement OAuth2 flow for authentication
```

### Timeline

[When this will take effect]

Example:
- PR merge: 2024-01-15
- Production deploy: 2024-01-20
- Old API deprecated: 2024-03-01
- Old API removed: 2024-06-01

### Rollback Plan

[How to rollback if issues occur]

Example:
- Keep old endpoint available at `/api/v1/users` (public)
- New endpoint at `/api/v2/users` (authenticated)
- Gradual migration over 3 months
```

---

## Large PR Justification Template

Use when PR is >500 lines and can't be split.

```markdown
## PR Size Justification

**Lines changed**: 873

### Why This Can't Be Split

[Explain why PR must be large]

Example:
```
This PR upgrades React 17 → 18, which requires simultaneous updates
across all components. Splitting would result in broken intermediate
states.

Changes required as atomic unit:
- Update React and ReactDOM packages
- Update all components to new createRoot API
- Update tests to new testing library API
- Update type definitions
```

### Review Strategy

[How to make review easier]

Example:
- Review commit-by-commit (each commit is logical unit)
- Automated tests cover all changes (95% coverage)
- Breaking changes isolated to commits 3-5
- Focus review on high-risk areas: [list specific files]

### Testing Evidence

[Comprehensive testing to build reviewer confidence]

Example:
- [x] All 450 existing tests pass
- [x] Added 35 new tests for React 18 features
- [x] Manual smoke test on staging
- [x] Performance testing (no regressions)
- [x] Accessibility testing (no regressions)
```

---

## Reopening Old PR Template

Use when returning to abandoned PR.

```markdown
## PR Revival

This PR was opened [timeframe] ago and hasn't been updated. I'm
interested in this feature and would like to help finish it.

### Status of Original PR

- Original author: @username
- Last activity: [date]
- Reason stalled: [review feedback not addressed / author inactive]

### Changes Made

[What you changed from original PR]

Example:
- Rebased on current main branch
- Addressed all review feedback from [date]
- Added missing tests
- Updated documentation
- Fixed merge conflicts

### Credit

Original work by @username in #123. I've updated and completed their
excellent start.

### Testing

[All the usual testing sections]

### Ready for Review

This PR is now ready for review. All previous feedback has been
addressed.
```

---

## Templates Summary

**Use the right template for your PR type:**

1. **Standard Feature/Fix**: Use "PR Description Template (Standard)"
2. **Bug Fix**: Use "PR Description Template (Bug Fix)"
3. **Documentation**: Use "PR Description Template (Documentation)"
4. **Breaking Changes**: Add "Breaking Changes Template" section
5. **Large PR**: Add "Large PR Justification Template"
6. **Old PR**: Use "Reopening Old PR Template"

**All templates should include:**
- Clear What/Why/How structure
- Comprehensive testing evidence
- Issue links (Closes #123, Fixes #456)
- Screenshots/videos when applicable

---

**See `templates/pr-description.md` for ready-to-copy template file.**
