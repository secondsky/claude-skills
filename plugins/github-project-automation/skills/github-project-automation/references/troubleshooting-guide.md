# GitHub Actions Troubleshooting Guide

Complete troubleshooting guide for GitHub Actions, CodeQL, and Dependabot issues.

**Last Updated**: 2025-12-17

---

## Table of Contents

1. [Workflow Not Triggering](#workflow-not-triggering)
2. [CodeQL Failing](#codeql-failing)
3. [Secrets Not Available](#secrets-not-available)
4. [Dependabot PRs Failing](#dependabot-prs-failing)
5. [Matrix Builds Failing](#matrix-builds-failing)
6. [YAML Syntax Errors](#yaml-syntax-errors)
7. [Permissions Issues](#permissions-issues)
8. [Advanced Debugging](#advanced-debugging)

---

## Workflow Not Triggering

### Symptoms
- Pushed code but CI doesn't run
- No workflow run in Actions tab
- Expected workflow missing from checks

### Solutions

#### 1. Check workflow directory
```bash
# ✅ CORRECT
.github/workflows/ci.yml

# ❌ WRONG
.github/workflow/ci.yml  # Missing 's'
.github/ci.yml            # Wrong location
workflows/ci.yml          # Missing .github/
```

#### 2. Verify YAML is valid
```bash
# Install yamllint
brew install yamllint  # macOS
sudo apt install yamllint  # Linux

# Validate all workflows
yamllint .github/workflows/*.yml
```

#### 3. Check trigger configuration
```yaml
# Workflow triggers on push to main
on:
  push:
    branches: [main]

# ❌ PROBLEM: You pushed to 'master' but workflow expects 'main'
# ✅ SOLUTION: Update branches list or rename branch
on:
  push:
    branches: [main, master]  # Support both
```

#### 4. Ensure workflow is committed
```bash
# Check if workflow file is tracked
git ls-files .github/workflows/

# If not listed, add it
git add .github/workflows/ci.yml
git commit -m "Add CI workflow"
git push
```

#### 5. Check Actions tab for errors
- Go to GitHub repo → Actions tab
- Look for workflow runs (even failed ones)
- Click on workflow run to see error messages
- Check "Set up job" step for initialization errors

### Common Causes
- Typo in directory name (`workflow` vs `workflows`)
- YAML syntax error (prevents workflow from parsing)
- Branch name mismatch (pushing to wrong branch)
- Workflow file not committed to repository
- Actions disabled in repository settings

---

## CodeQL Failing

### Problem 1: "No code found to analyze"

#### Symptoms
- CodeQL workflow completes but finds nothing
- Analysis step shows "0 files analyzed"
- No results in Security → Code scanning

#### Solutions for Compiled Languages

```yaml
# ❌ WRONG - No build step for Java
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: 'java-kotlin'

- name: Perform CodeQL Analysis  # FAILS - no .class files
  uses: github/codeql-action/analyze@v3

# ✅ CORRECT - Include build
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: 'java-kotlin'

- name: Build project
  run: ./mvnw clean install  # Creates .class files for analysis

- name: Perform CodeQL Analysis  # SUCCESS
  uses: github/codeql-action/analyze@v3
```

#### Solutions for JavaScript/TypeScript

```yaml
# For Node.js projects, CodeQL needs node_modules
- uses: github/codeql-action/init@v3
  with:
    languages: 'javascript-typescript'

# Install dependencies BEFORE autobuild
- run: npm ci

- uses: github/codeql-action/autobuild@v3
- uses: github/codeql-action/analyze@v3
```

### Problem 2: Language not detected

#### Symptoms
- Error: "Language 'X' not found in repository"
- CodeQL skips analysis

#### Solutions

```yaml
# ❌ WRONG - Incorrect language name
matrix:
  language: ['java']  # Should be 'java-kotlin'

# ✅ CORRECT - Use official language identifiers
matrix:
  language: ['java-kotlin']  # For Java/Kotlin
  # Options: c-cpp, csharp, go, java-kotlin,
  #          javascript-typescript, python, ruby, swift
```

### Problem 3: Permission denied

#### Symptoms
- Error: "Resource not accessible by integration"
- CodeQL upload fails

#### Solutions

```yaml
# ❌ MISSING - No permissions specified
jobs:
  analyze:
    runs-on: ubuntu-24.04
    steps:
      # CodeQL steps...

# ✅ CORRECT - Add required permissions
jobs:
  analyze:
    runs-on: ubuntu-24.04
    permissions:
      security-events: write  # REQUIRED for CodeQL
      contents: read
      actions: read
    steps:
      # CodeQL steps...
```

---

## Secrets Not Available

### Symptoms
- Error: `Secret XXX not found`
- Empty variable in workflow
- Workflow logs show blank values

### Solutions

#### 1. Verify secret exists
```bash
# List all secrets
gh secret list

# If secret missing, add it
gh secret set CLOUDFLARE_API_TOKEN
# Paste token when prompted
```

#### 2. Check syntax uses double braces
```yaml
# ❌ WRONG - Missing double braces
env:
  API_TOKEN: $secrets.CLOUDFLARE_API_TOKEN

# ❌ WRONG - Shell syntax (not GitHub Actions)
env:
  API_TOKEN: ${secrets.CLOUDFLARE_API_TOKEN}

# ✅ CORRECT - Proper context syntax
env:
  API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### 3. Verify case-sensitive name
```bash
# Secrets are case-sensitive!
# If you set: CLOUDFLARE_API_TOKEN
# Must use exact name in workflow

# ❌ WRONG
${{ secrets.cloudflare_api_token }}  # Lowercase

# ✅ CORRECT
${{ secrets.CLOUDFLARE_API_TOKEN }}  # Exact match
```

#### 4. Understand fork limitations
**Important**: Secrets are NOT available to forks for security reasons.

```yaml
# Solution: Use environments with protection rules
jobs:
  deploy:
    # Only run on main repo, not forks
    if: github.repository == 'owner/repo'
    environment: production  # Requires manual approval
    steps:
      - run: deploy-script
        env:
          SECRET: ${{ secrets.DEPLOY_SECRET }}
```

---

## Dependabot PRs Failing

### Problem: CodeQL/CI doesn't run on Dependabot PRs

#### Symptoms
- Dependabot PRs created but checks don't run
- Security scans skipped on dependency updates
- Branch protection blocks Dependabot PRs

#### Solutions

```yaml
# ❌ DOESN'T RUN ON DEPENDABOT
on:
  pull_request:
    branches: [main]

# ✅ INCLUDES DEPENDABOT
on:
  pull_request:
    branches: [main]
  # Dependabot creates PRs from special branches
  push:
    branches: [dependabot/**]
```

### Problem: Tests fail with updated dependencies

#### Solutions

```bash
# 1. Check Dependabot logs
# GitHub → Settings → Security → Dependabot alerts
# Click on specific PR to see detailed logs

# 2. Reproduce locally
git fetch origin
git checkout dependabot/npm_and_yarn/axios-1.6.0
npm install  # Install updated dependencies
npm test     # Run tests locally

# 3. Fix tests or update package
# If tests fail due to breaking changes:
# - Update code to handle breaking changes
# - Or ignore major version updates in dependabot.yml
```

### Problem: Branch protection blocks all Dependabot PRs

#### Solutions

```yaml
# dependabot.yml - Configure labels for easier management
labels:
  - "dependencies"
  - "automerge"  # Use with branch protection bypass

# Branch protection rules:
# ☑ Allow specified actors to bypass required pull requests
#   - dependabot[bot]  # For auto-merge of non-major updates
```

---

## Matrix Builds Failing

### Problem: All matrix jobs fail with same error

#### Symptoms
- All Node versions fail (18, 20, 22)
- Error message identical across jobs
- Matrix expansion seems correct

#### Solutions

#### 1. Check variable reference includes `matrix.`
```yaml
# ❌ WRONG - Missing matrix prefix
- uses: actions/setup-node@v4
  with:
    node-version: ${{ node-version }}  # ERROR: undefined

# ✅ CORRECT - Include matrix. prefix
- uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}  # SUCCESS
```

#### 2. Verify matrix values are valid
```yaml
# ❌ WRONG - Invalid Node versions
matrix:
  node-version: [17, 19, 21]  # Non-LTS versions

# ✅ CORRECT - Valid LTS versions
matrix:
  node-version: [18, 20, 22]  # LTS releases
```

#### 3. Use `fail-fast: false` to see all failures
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
  fail-fast: false  # Don't stop on first failure

# Now all 3 jobs run even if one fails
# Easier to debug version-specific issues
```

### Problem: Matrix doesn't expand at all

#### Solutions

```yaml
# ❌ WRONG - Missing matrix values
strategy:
  matrix:
    node-version:  # ERROR: No array provided

# ❌ WRONG - Empty array
strategy:
  matrix:
    node-version: []  # ERROR: No values

# ✅ CORRECT - Array with values
strategy:
  matrix:
    node-version: [18, 20, 22]
```

---

## YAML Syntax Errors

### Common YAML Mistakes

```yaml
# ❌ WRONG - Tab character (use spaces!)
jobs:
	test:  # Tab character causes parse error
	  runs-on: ubuntu-24.04

# ✅ CORRECT - 2-space indentation
jobs:
  test:
    runs-on: ubuntu-24.04

# ❌ WRONG - Inconsistent indentation
jobs:
  test:
      runs-on: ubuntu-24.04  # 6 spaces
    steps:                    # 4 spaces
      - run: npm test         # 6 spaces

# ✅ CORRECT - Consistent 2-space indentation
jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - run: npm test

# ❌ WRONG - Missing space after colon
jobs:
  test:
    runs-on:ubuntu-24.04  # Missing space

# ✅ CORRECT - Space after colon
jobs:
  test:
    runs-on: ubuntu-24.04
```

### Validation Tools

```bash
# Install yamllint
brew install yamllint  # macOS
sudo apt install yamllint  # Linux

# Create .yamllint config
cat > .yamllint << 'EOF'
extends: default
rules:
  line-length:
    max: 120
  indentation:
    spaces: 2
EOF

# Validate workflows
yamllint .github/workflows/
```

---

## Permissions Issues

### Problem: "Resource not accessible by integration"

#### Cause
Missing or incorrect permissions in workflow.

#### Solutions

```yaml
# Default permissions (read-only)
permissions:
  contents: read

# Minimal required permissions
jobs:
  deploy:
    permissions:
      contents: read  # Checkout code
      deployments: write  # Create deployment
      id-token: write  # OIDC for cloud auth

  codeql:
    permissions:
      security-events: write  # Upload CodeQL results
      contents: read
      actions: read
```

### Problem: "403 Forbidden" when pushing to repo

#### Solutions

```yaml
# Option 1: Use GITHUB_TOKEN (default)
- run: git push
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# Option 2: Use Personal Access Token (for protected branches)
- run: git push
  env:
    GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
```

---

## Advanced Debugging

### Enable Debug Logging

```bash
# Set repository secrets for debug output
gh secret set ACTIONS_STEP_DEBUG -b "true"
gh secret set ACTIONS_RUNNER_DEBUG -b "true"
```

### Add Debug Steps

```yaml
- name: Debug - Print Environment
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "Actor: ${{ github.actor }}"
    echo "Repository: ${{ github.repository }}"
    env | sort

- name: Debug - Check Files
  run: |
    pwd
    ls -la
    git status
    git log --oneline -5
```

### Check Runner Environment

```yaml
- name: Debug - System Info
  run: |
    uname -a
    node --version
    npm --version
    git --version
    echo "PATH=$PATH"
```

---

**Last Updated**: 2025-12-17
**Version**: 1.0.0
