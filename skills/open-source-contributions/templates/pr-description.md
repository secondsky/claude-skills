# Pull Request Description Template

Copy this template when creating a pull request. Delete sections that don't apply.

---

## What?

[Clear, concise description of what changed]

Example: "Adds OAuth2 authentication support with Google and GitHub providers"

## Why?

[Explain the motivation and context]

Example: "Users requested social login to simplify onboarding (see #123)"

## How?

[Technical details of implementation]

- Bullet point 1
- Bullet point 2
- Bullet point 3

## Testing

### Automated Tests
- [ ] All existing tests pass
- [ ] Added new tests for this feature
- [ ] Test coverage: X%

### Manual Testing
- [ ] Tested on [browser/platform]
- [ ] Tested edge cases
- [ ] Tested error states

### Evidence
- Screenshot: [link]
- Video: [link]

## Breaking Changes

- ❌ N/A - No breaking changes

OR

- ⚠️ YES - [Description of breaking change]
  - Migration guide: [How to migrate]
  - Who's affected: [Which users/systems]

## Related Issues

Closes #[issue-number]
Fixes #[issue-number]
Relates to #[issue-number]

---

## Checklist

Before submitting this PR, verify:

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear
- [ ] No personal development artifacts included
- [ ] PR is focused on single feature/fix
- [ ] Breaking changes documented (if any)
