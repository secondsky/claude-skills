# Pre-Submission Checklist

Complete this checklist before submitting your pull request.

---

## Code Quality

- [ ] All tests pass locally (`npm test`)
- [ ] Build succeeds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] No TypeScript/compiler errors
- [ ] Code formatted with project formatter (`npm run format`)

---

## Git Hygiene

- [ ] Working on feature branch (NOT main/master)
- [ ] Feature branch synced with latest upstream main
- [ ] Commits have clear, descriptive messages
- [ ] No merge commits (rebased if needed)
- [ ] Branch name follows convention (feature/, fix/, docs/, etc.)

---

## Personal Artifacts Removed

- [ ] No SESSION.md, NOTES.md, TODO.md
- [ ] No planning/* or research-logs/* directories
- [ ] No debug screenshots (screenshots/debug-*, screenshots/test-*)
- [ ] No temporary test files (test-manual.js, quick-test.py, etc.)
- [ ] No personal environment files (.env.local, .env.development)
- [ ] No IDE files (.vscode/, .idea/) unless in .gitignore
- [ ] No OS files (.DS_Store, Thumbs.db) unless in .gitignore

---

## Code Changes

- [ ] Only related changes included (no scope creep)
- [ ] PR size reasonable (<500 lines ideal)
- [ ] No commented-out code
- [ ] No debugging console.logs/print statements
- [ ] No hardcoded values (use config/environment variables)
- [ ] No secrets or API keys committed

---

## Documentation

- [ ] README.md updated (if user-visible change)
- [ ] API documentation updated (if API changed)
- [ ] Code comments added (for complex logic)
- [ ] CHANGELOG.md entry added (if required by project)
- [ ] Migration guide (if breaking change)

---

## Testing

- [ ] Added tests for new functionality
- [ ] Updated tests for changed functionality
- [ ] All edge cases covered
- [ ] Error states tested
- [ ] Manual testing performed
- [ ] Testing evidence prepared (screenshots/videos)

---

## Pull Request

- [ ] PR title is clear and descriptive
- [ ] PR description explains What, Why, How
- [ ] Testing section includes evidence
- [ ] Issues linked with "Closes #123" or "Fixes #456"
- [ ] Breaking changes documented (if any)
- [ ] PR template filled completely (if project has one)

---

## Project Conventions

- [ ] Read CONTRIBUTING.md
- [ ] Followed project's coding style
- [ ] Used project's naming conventions
- [ ] Matched project's architecture patterns
- [ ] Followed commit message format (if specified)
- [ ] Signed commits (if required by project)

---

## Communication

- [ ] Checked issue not already assigned
- [ ] Discussed large changes with maintainers first
- [ ] Ready to respond to feedback within 48 hours
- [ ] No expectation of immediate merge

---

## Final Validation

Run this command before submitting:

```bash
# Clean check
git status

# Should show only intended changes
git diff main

# Run project validation (if available)
npm run validate || npm test

# Check for common artifacts
git ls-files | grep -E "(SESSION|NOTES|TODO|planning|research-logs|screenshots/debug)"
# Should return nothing
```

---

## Quick Fixes

### If you find issues:

**Personal artifacts found:**
```bash
git rm SESSION.md NOTES.md planning/*
git commit --amend --no-edit
```

**Need to sync with upstream:**
```bash
git checkout main
git pull upstream main
git checkout your-branch
git rebase main
```

**Tests failing:**
```bash
npm test -- --verbose  # See detailed errors
npm run lint:fix      # Auto-fix linting
```

---

## Ready to Submit

Once ALL boxes are checked:

1. Push to your fork: `git push origin your-branch`
2. Go to GitHub and create pull request
3. Fill PR description using template
4. Click "Create pull request"
5. Monitor for CI results
6. Be ready to respond to feedback

---

**Good luck with your contribution! 🎉**
