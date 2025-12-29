---
name: project-workflow:release
description: Pre-release safety checks and validation before deployment
---

# Release

Safely prepare project for public GitHub release by sanitizing files, checking documentation, and validating configuration.

---

## Your Task

Follow these steps to ensure project is safe to publish publicly. Run comprehensive safety checks before pushing to GitHub or creating public release.

### Phase 1: Critical Safety Checks (BLOCKERS)

These checks MUST pass before release. If any fail, STOP and require manual fixes.

#### 1. Scan for Secrets

**Check for secrets in current files**:

```bash
# Check if gitleaks is installed
which gitleaks
```

**If gitleaks installed**:
```bash
# Scan current files for secrets
gitleaks detect --no-git --source=. --verbose
```

**If gitleaks NOT installed**:
```
⚠️  gitleaks not installed. Skipping automated secrets detection.

To install: brew install gitleaks
Or: wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_[version]_linux_x64.tar.gz

Proceeding with manual checks...
```

**Manual secret checks** (if gitleaks not available):

Check these files for secrets:
```bash
# Check .env files
find . -name ".env*" -o -name "*.env" | grep -v node_modules

# Check wrangler.toml for API keys
grep -i "api_key\|token\|secret\|password" wrangler.toml 2>/dev/null

# Check config files
find . -name "config.ts" -o -name "config.js" -o -name "*.config.*" | head -20
```

**Common secret patterns to look for**:
- API keys: `api_key = "sk_..."`
- Tokens: `token = "ghp_..."`
- Passwords: `password = "..."`
- Private keys: `-----BEGIN PRIVATE KEY-----`

**If secrets found**:
```
❌ BLOCKER: Secrets detected in files

Files with potential secrets:
[List files]

STOP: Do NOT proceed with release.

Actions required:
1. Remove secrets from files
2. Move to environment variables or secrets management
3. Verify not committed to git history: git log -S "secret_value"
4. If in git history: git filter-branch or BFG Repo-Cleaner required

Run /release again after fixing.
```

**If no secrets found**:
```
✅ No secrets detected in current files
```

---

#### 2. Check Personal Artifacts

**Check for personal/session files**:

```bash
# Check for SESSION.md
ls SESSION.md 2>/dev/null

# Check for planning directory
ls -d planning/ 2>/dev/null

# Check for screenshots directory
ls -d screenshots/ 2>/dev/null

# Check for temporary test files
find . -name "test-*.js" -o -name "test-*.ts" -o -name "*.test.local.*" | head -10
```

**If personal artifacts found**:
```
⚠️  Personal artifacts detected:

[List files found]

These files contain your session/planning data and should NOT be published.

Options:
1. Remove them (recommended for clean public repo)
2. Add to .gitignore and keep locally
3. Keep them (if you want public planning docs)

Your choice (1/2/3):
```

**If choice 1 (Remove)**:
```bash
# Confirm removal
echo "Remove these files? (y/n)"
```

If yes:
```bash
# Remove files
rm -f SESSION.md
rm -rf planning/
rm -rf screenshots/
find . -name "test-*.js" -delete
find . -name "test-*.ts" -delete

# Stage deletions
git add -A
```

Output:
```
✅ Personal artifacts removed
```

**If choice 2 (Add to .gitignore)**:
```bash
# Add to .gitignore
echo "" >> .gitignore
echo "# Personal artifacts (not for public release)" >> .gitignore
echo "SESSION.md" >> .gitignore
echo "planning/" >> .gitignore
echo "screenshots/" >> .gitignore
echo "test-*.js" >> .gitignore
echo "test-*.ts" >> .gitignore

git add .gitignore
```

Output:
```
✅ Personal artifacts added to .gitignore
```

**If choice 3 (Keep)**:
```
ℹ️  Keeping personal artifacts. They will be published.

Note: SESSION.md and planning/ may confuse other users.
Consider adding a note to README explaining they're example workflow artifacts.
```

**If no personal artifacts found**:
```
✅ No personal artifacts detected
```

---

#### 3. Verify Remote URL

**Check git remote**:

```bash
git remote -v
```

**Verify**:
- Remote URL is YOUR repository, not someone else's
- Not pushing to upstream of a fork (unless intended)

**If remote looks incorrect**:
```
⚠️  Remote URL verification:

Current remote:
origin  [URL from git remote -v]

Is this YOUR repository where you want to publish? (y/n)
```

**If no**:
```
❌ BLOCKER: Incorrect remote URL

Actions required:
1. Set correct remote: git remote set-url origin [your-repo-url]
2. Verify: git remote -v
3. Run /release again

STOP: Do NOT proceed with release.
```

**If yes**:
```
✅ Remote URL verified
```

---

### Phase 2: Documentation Validation

These checks are REQUIRED but not blockers (can proceed with warnings).

#### 4. LICENSE Check

**Check for LICENSE file**:

```bash
ls LICENSE LICENSE.md LICENSE.txt 2>/dev/null
```

**If LICENSE missing**:
```
❌ REQUIRED: LICENSE file missing

Without a license, your code is NOT open source (all rights reserved by default).

Would you like to add a license? (y/n)
```

**If yes**:
```
Which license?

1. MIT (permissive, most popular)
2. Apache 2.0 (permissive, patent grant)
3. GPL-3.0 (copyleft, derivatives must be open source)
4. BSD-3-Clause (permissive, similar to MIT)
5. I'll add it manually

Your choice (1-5):
```

**If choice 1-4**: Create LICENSE file with chosen license text (use standard templates)

**After creating**:
```bash
git add LICENSE
```

Output:
```
✅ LICENSE created (MIT)
```

**If LICENSE exists**:
```bash
# Detect license type
head -5 LICENSE
```

Output:
```
✅ LICENSE present ([detected type: MIT/Apache/GPL/etc.])
```

---

#### 5. README Check

**Check README completeness**:

```bash
# Check if README exists
ls README.md 2>/dev/null

# Count words
wc -w README.md 2>/dev/null
```

**If README missing**:
```
❌ REQUIRED: README.md missing

A README is essential for public projects.

Create basic README template? (y/n)
```

**If yes**: Create basic README template with project name, description, installation, usage, license sections.

**If README exists but < 100 words**:
```
⚠️  README exists but very short ([X] words)

Consider adding:
- Project description
- Installation instructions
- Usage examples
- License information
```

**If README exists and >= 100 words**:

Check for basic sections:
```bash
# Check for key sections
grep -i "## Install\|## Usage\|## License" README.md
```

**If missing sections**:
```
⚠️  README missing recommended sections:

Missing:
[- Installation instructions (## Installation)]
[- Usage examples (## Usage)]
[- License mention (## License)]

Recommendation: Add these sections for better documentation
```

**If all sections present**:
```
✅ README complete (>100 words, key sections present)
```

---

#### 6. CONTRIBUTING.md Check (Recommended)

**Check project size**:
```bash
# Count lines of code (exclude node_modules, dist, etc.)
find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | \
  grep -v node_modules | grep -v dist | grep -v build | \
  xargs wc -l 2>/dev/null | tail -1
```

**If > 500 lines of code**:

Check for CONTRIBUTING.md:
```bash
ls CONTRIBUTING.md 2>/dev/null
```

**If missing**:
```
ℹ️  CONTRIBUTING.md missing (recommended for projects >500 LOC)

This file helps contributors understand how to contribute.

Create CONTRIBUTING.md template? (y/n)
```

**If yes**: Create basic CONTRIBUTING.md template.

**If < 500 lines of code**:
```
✅ Project small enough to skip CONTRIBUTING.md
```

**If CONTRIBUTING.md exists**:
```
✅ CONTRIBUTING.md present
```

---

#### 7. CODE_OF_CONDUCT Check (Recommended)

**Check project size**:
```bash
# Same LOC count as above
```

**If > 1000 lines of code**:

Check for CODE_OF_CONDUCT:
```bash
ls CODE_OF_CONDUCT.md 2>/dev/null
```

**If missing**:
```
ℹ️  CODE_OF_CONDUCT.md missing (recommended for larger projects)

Create Contributor Covenant template? (y/n)
```

**If yes**: Create standard Contributor Covenant template.

**If < 1000 lines of code**:
```
✅ Project small enough to skip CODE_OF_CONDUCT
```

**If CODE_OF_CONDUCT exists**:
```
✅ CODE_OF_CONDUCT present
```

---

### Phase 3: Configuration Validation

#### 8. .gitignore Check

**Check if .gitignore exists**:
```bash
ls .gitignore 2>/dev/null
```

**If missing**:
```
⚠️  .gitignore missing

Create .gitignore with common patterns? (y/n)
```

**If yes**: Create .gitignore with common patterns for detected project type.

**If .gitignore exists**:

Check for common patterns:
```bash
# Check for essential patterns
grep -E "node_modules|\.env|\.log|dist/|build/" .gitignore
```

**If missing essential patterns**:
```
⚠️  .gitignore missing recommended patterns:

Missing:
[- node_modules/ (dependencies)]
[- .env* (secrets)]
[- *.log (logs)]
[- dist/ or build/ (build artifacts)]

Add missing patterns? (y/n)
```

**If yes**: Append missing patterns to .gitignore.

**If all patterns present**:
```
✅ .gitignore valid (essential patterns present)
```

---

#### 9. Package Files Check

**Detect project type**:
```bash
ls package.json pyproject.toml setup.py go.mod Cargo.toml 2>/dev/null
```

**If Node.js (package.json)**:

Check required fields:
```bash
# Extract key fields
node -p "const pkg=require('./package.json');
  JSON.stringify({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    license: pkg.license,
    repository: pkg.repository
  }, null, 2)"
```

**If missing fields**:
```
⚠️  package.json missing recommended fields:

Missing:
[- name]
[- version]
[- description]
[- license]
[- repository]

Recommendation: Add these fields for npm compatibility
```

**If Python (pyproject.toml or setup.py)**:

Check for basic metadata.

**If Go (go.mod)**:

Check module path.

**If all fields present**:
```
✅ package.json complete (all required fields present)
```

---

#### 10. Branch Verification

**Check current branch**:
```bash
git branch --show-current
```

**If on main/master**:
```
⚠️  You're on main/master branch

Recommendation: Create a release-prep branch for these changes.

Create release-prep branch? (y/n)
```

**If yes**:
```bash
git checkout -b release-prep
```

Output:
```
✅ Switched to release-prep branch
```

**If on feature/release branch**:
```
✅ On feature branch ([branch name])
```

---

### Phase 4: Quality Checks (Non-Blocking)

These checks provide warnings but don't block release.

#### 11. Build Test

**Detect build command**:
```bash
# Check package.json for build script
grep "\"build\":" package.json 2>/dev/null

# Or check for common build files
ls tsconfig.json vite.config.ts webpack.config.js 2>/dev/null
```

**If build command detected**:
```
Testing build... (this may take a minute)
```

```bash
npm run build 2>&1
```

**If build succeeds**:
```
✅ Build succeeds
```

**If build fails**:
```
⚠️  Build failed

Error: [build error output]

Recommendation: Fix build errors before release.

Continue anyway? (y/n)
```

**If no build command**:
```
ℹ️  No build command detected (skipping build test)
```

---

#### 12. Dependency Vulnerabilities

**If Node.js project**:
```bash
npm audit --audit-level=high
```

**If vulnerabilities found**:
```
⚠️  Dependency vulnerabilities detected:

[npm audit output]

Recommendation: Run `npm audit fix` to resolve.

Continue anyway? (y/n)
```

**If no vulnerabilities**:
```
✅ No critical dependency vulnerabilities
```

**If not Node.js**:
```
ℹ️  Dependency vulnerability check not applicable
```

---

#### 13. Large Files Warning

**Scan for large files (>1MB)**:
```bash
find . -type f -size +1M | grep -v node_modules | grep -v .git | grep -v dist | grep -v build
```

**If large files found**:
```
⚠️  Large files detected (>1MB):

[List files with sizes]

Recommendation: Consider:
- Using Git LFS for binaries
- Moving to external storage (R2, S3)
- Adding to .gitignore if build artifacts

Continue anyway? (y/n)
```

**If no large files**:
```
✅ No large files detected
```

---

### Phase 5: Release Readiness Report

**Output comprehensive report**:

```
═══════════════════════════════════════════════
   RELEASE READINESS REPORT
═══════════════════════════════════════════════

🔐 SECURITY (Blockers)
[✅/❌] No secrets detected
[✅/⚠️/❌] Personal artifacts [removed/ignored/kept]
[✅/❌] Remote URL verified

📄 DOCUMENTATION
[✅/❌] LICENSE ([type])
[✅/⚠️/❌] README ([complete/incomplete/missing])
[✅/ℹ️] CONTRIBUTING.md ([present/not needed])
[✅/ℹ️] CODE_OF_CONDUCT ([present/not needed])

⚙️  CONFIGURATION
[✅/⚠️/❌] .gitignore ([valid/incomplete/missing])
[✅/⚠️] package.json ([complete/incomplete])
[✅/⚠️] On [branch name] ([good/use feature branch])

🧪 QUALITY (Non-Blocking)
[✅/⚠️/ℹ️] Build [succeeds/fails/not applicable]
[✅/⚠️/ℹ️] Dependencies [no vulnerabilities/vulnerabilities/not applicable]
[✅/⚠️] Large files [none/detected]

═══════════════════════════════════════════════

BLOCKERS: [N]
WARNINGS: [N]
RECOMMENDATIONS: [N]

SAFE TO RELEASE: [✅ YES / ⚠️ YES (with warnings) / ❌ NO]

═══════════════════════════════════════════════
```

**If blockers**:
```
❌ Cannot release: [N] blockers must be fixed

Fix blockers and run /release again.
```

STOP here. Do not proceed.

**If warnings but no blockers**:
```
⚠️  Can release with warnings

Warnings:
[List warnings]

Recommendation: Fix warnings before release.

Proceed anyway? (y/n)
```

**If no blockers or warnings**:
```
✅ Ready to release!

All checks passed. Safe to proceed with release.
```

---

### Phase 6: Offer to Fix Issues

For each fixable issue, offer auto-fix:

**Missing LICENSE**:
```
Create LICENSE? (y/n)
[If yes: Create chosen license file]
```

**Incomplete README**:
```
Add missing README sections? (y/n)
[If yes: Open README for editing, show template sections to add]
```

**Missing .gitignore patterns**:
```
Add recommended .gitignore patterns? (y/n)
[If yes: Append patterns]
```

**Personal artifacts**:
```
Remove/ignore personal artifacts? (y/n)
[If yes: Remove or add to .gitignore]
```

**On main branch**:
```
Create release-prep branch? (y/n)
[If yes: git checkout -b release-prep]
```

---

### Phase 7: Git Preparation

**Check for uncommitted changes**:
```bash
git status --short
```

**If changes exist**:
```
You have uncommitted changes from release preparation:

[git status output]

Create release preparation commit? (y/n)
```

**If yes**:
```bash
git add -A

git commit -m "$(cat <<'EOF'
chore: prepare for release

Release preparation changes:
- [LICENSE created (MIT) OR LICENSE verified]
- [README sections added OR README verified]
- [.gitignore patterns added OR .gitignore verified]
- [Personal artifacts removed OR Personal artifacts ignored]
- [Other changes...]

Security: No secrets detected
Documentation: Complete
Configuration: Valid

Ready for public release

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Output:
```
✅ Release preparation commit created
```

**Offer to create git tag**:
```
Create version tag? (y/n)

Version number (e.g., v1.0.0):
```

**If yes**:
```bash
git tag [version]
```

Output:
```
✅ Tag created: [version]
```

**Offer to push**:
```
Push to remote (branch + tags)? (y/n)
```

**If yes**:
```bash
git push origin [branch-name]
git push origin --tags
```

Output:
```
✅ Pushed to remote: origin/[branch-name]
✅ Tags pushed
```

**If no uncommitted changes**:
```
ℹ️  No uncommitted changes to commit
```

---

### Phase 8: GitHub Release (Optional)

**Check if gh CLI available**:
```bash
which gh
```

**If gh CLI available**:
```
Create GitHub release? (y/n)

This will create a public release on GitHub with release notes.
```

**If yes**:
```
Version tag (e.g., v1.0.0): [use tag from Phase 7 or ask for new one]
Release title (e.g., "Initial Release" or "v1.0.0 - Feature Name"):
```

**Generate release notes from recent commits**:
```bash
# Get commits since last tag (or all if no previous tags)
git log --oneline --no-merges $(git describe --tags --abbrev=0 2>/dev/null || echo "")..HEAD
```

**Show draft release notes**:
```
───────────────────────────────────────────────
DRAFT RELEASE NOTES
───────────────────────────────────────────────

## What's New

[Auto-generated from commit messages]

## Installation

```bash
npm install [package-name]
# or
git clone [repo-url]
```

## Documentation

See [README.md](README.md) for full documentation.

───────────────────────────────────────────────

Edit release notes? (y/n)
```

**If yes**: Open for editing.

**Create release**:
```bash
gh release create [tag] \
  --title "[title]" \
  --notes "[release notes]" \
  [--draft] \
  [--prerelease]
```

Output:
```
✅ GitHub release created: [URL]
```

**If gh CLI not available**:
```
ℹ️  GitHub CLI not installed

To create release manually:
1. Go to: https://github.com/[user]/[repo]/releases/new
2. Tag version: [tag]
3. Release title: [title]
4. Description: [release notes from above]

Or install gh CLI: brew install gh
```

---

### Phase 9: Final Summary

**Output final summary**:

```
═══════════════════════════════════════════════
   RELEASE COMPLETE ✅
═══════════════════════════════════════════════

📦 PACKAGE: [Project Name]
🏷️  VERSION: [tag]
🌐 REMOTE: [repo URL]

CHANGES MADE:
[✅ LICENSE created (MIT)]
[✅ README verified]
[✅ Personal artifacts removed]
[✅ .gitignore updated]
[✅ Release commit created]
[✅ Tag created: [version]]
[✅ Pushed to origin/[branch]]
[✅ GitHub release created]

───────────────────────────────────────────────
NEXT STEPS
───────────────────────────────────────────────

1. If on feature branch: Create PR to merge to main
   gh pr create --title "Release [version]"

2. After merge: Create GitHub release (if not done)
   gh release create [version]

3. If npm package: Publish to npm
   npm publish

4. Share your release!
   - Post on social media
   - Add to README badges
   - Announce in relevant communities

═══════════════════════════════════════════════

🎉 Your project is ready for public release!

═══════════════════════════════════════════════
```

---

## Error Handling

**Not a git repository**:
```
❌ Not a git repository

Run /release in a git repository.

Initialize git? (y/n)
```

If yes: `git init`

---

**No remote configured**:
```
⚠️  No git remote configured

Add remote URL:
git remote add origin [URL]

Then run /release again.
```

---

**Git push fails**:
```
⚠️  Push failed: [error message]

Common fixes:
- Set upstream: git push -u origin [branch]
- Check permissions: gh auth status
- Verify remote: git remote -v

Fix the issue and push manually, or run /release again.
```

---

**GitHub release creation fails**:
```
⚠️  GitHub release creation failed: [error]

Create manually: https://github.com/[user]/[repo]/releases/new

Or: gh auth login (authenticate GitHub CLI)
```

---

**Build test fails**:
```
⚠️  Build failed

This is not a blocker, but recommended to fix before release.

Continue anyway? (y/n)
```

---

## Success Criteria

✅ No secrets detected in files
✅ Personal artifacts handled (removed or gitignored)
✅ Remote URL verified
✅ LICENSE file present
✅ README complete (>100 words, key sections)
✅ .gitignore valid
✅ User has clear next steps
✅ User knows exact release status (blockers, warnings, recommendations)
✅ User can proceed with confidence

---

## Notes

**Purpose**: Safety checks before public release, not a substitute for security audits

**Philosophy**: Prevent embarrassing mistakes (secrets leak, missing LICENSE, poor documentation)

**Integration**: Works alongside existing `open-source-contributions` skill (which focuses on contributing TO other projects, not releasing YOUR projects)

**Scope**: GitHub releases (not npm publish, PyPI, Docker, etc. - those are separate workflows)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-07
