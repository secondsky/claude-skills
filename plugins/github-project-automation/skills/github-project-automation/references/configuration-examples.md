# GitHub Configuration Examples

Complete, production-ready configuration files for GitHub automation.

**Last Updated**: 2025-12-17

---

## Table of Contents

1. [Dependabot Configuration](#dependabot-configuration)
2. [CodeQL Security Scanning](#codeql-security-scanning)
3. [GitHub Actions Version Pinning](#github-actions-version-pinning)
4. [Branch Protection Rules](#branch-protection-rules)
5. [CODEOWNERS File](#codeowners-file)
6. [Issue Templates (YAML)](#issue-templates-yaml)

---

## Dependabot Configuration

### Complete dependabot.yml

```yaml
version: 2
updates:
  # npm dependencies (includes both prod and devDependencies)
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Australia/Sydney"
    open-pull-requests-limit: 10  # GitHub hard limit
    reviewers:
      - "secondsky"  # ← Change to your GitHub username
    assignees:
      - "secondsky"  # ← Change to your GitHub username
    labels:
      - "dependencies"
      - "npm"
    commit-message:
      prefix: "chore"
      prefix-development: "chore"
      include: "scope"
    ignore:
      # Ignore major version updates for these packages
      - dependency-name: "webpack"
        update-types: ["version-update:semver-major"]

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "10:00"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "github-actions"
    commit-message:
      prefix: "ci"

  # Python dependencies (if applicable)
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "python"
```

**Why these settings:**
- **Weekly schedule**: Reduces noise vs daily, manageable PR volume
- **10 PR limit**: Matches GitHub maximum for npm
- **Includes devDependencies**: Security vulnerabilities can exist in devDependencies
- **Reviewers auto-assigned**: Faster triage and review
- **Conventional commit prefixes**: `chore:` for deps, `ci:` for Actions
- **Ignore major updates**: For packages with breaking changes (optional)

---

## CodeQL Security Scanning

### Complete security-codeql.yml

```yaml
name: CodeQL Security Scan

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sundays at midnight UTC

jobs:
  analyze:
    name: Analyze (${{ matrix.language }})
    runs-on: ubuntu-24.04

    permissions:
      # REQUIRED for CodeQL uploads
      security-events: write
      # REQUIRED for checkout
      contents: read
      # REQUIRED for Actions
      actions: read

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript-typescript']
        # Supported languages: c-cpp, csharp, go, java-kotlin,
        # javascript-typescript, python, ruby, swift

    steps:
      - name: Checkout repository
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

      - name: Initialize CodeQL
        uses: github/codeql-action/init@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f  # v3.27.4
        with:
          languages: ${{ matrix.language }}
          # Optional: Override automatic query selection
          # queries: security-extended,security-and-quality

      # For compiled languages (Java, C++, C#), add build steps here
      # Example for Java:
      # - name: Build project
      #   run: ./mvnw clean install

      # For interpreted languages (JavaScript, Python), autobuild works
      - name: Autobuild
        uses: github/codeql-action/autobuild@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f
        with:
          category: "/language:${{ matrix.language }}"
```

**Critical permissions:**
- `security-events: write` - **REQUIRED** for CodeQL uploads (without it, workflow fails silently)
- `contents: read` - REQUIRED for checkout
- `actions: read` - REQUIRED for Actions

### CodeQL for Compiled Languages

```yaml
# Example: Java with Maven build
steps:
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

  - uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'

  - uses: github/codeql-action/init@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f
    with:
      languages: 'java-kotlin'

  - name: Build with Maven
    run: ./mvnw clean install  # Creates .class files for analysis

  - uses: github/codeql-action/analyze@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f
```

---

## GitHub Actions Version Pinning

### Current Verified Versions (2025-11-06)

**Core Actions (SHA-pinned for security):**

```yaml
# Checkout code
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# Setup Node.js
- uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af  # v4.1.0

# Setup Python
- uses: actions/setup-python@0b93645e9fea7318ecaed2b359559ac225c90a2b  # v5.3.0

# Upload artifacts
- uses: actions/upload-artifact@b4b15b8c7c6ac21ea08fcf65892d2ee8f75cf882  # v4.4.3

# Download artifacts
- uses: actions/download-artifact@fa0a91b85d4f404e444e00e005971372dc801d16  # v4.1.8

# CodeQL initialization
- uses: github/codeql-action/init@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f  # v3.27.4

# CodeQL analysis
- uses: github/codeql-action/analyze@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f  # v3.27.4

# Code coverage (Codecov)
- uses: codecov/codecov-action@5c47607acb93fed5485fdbf7232e8a31425f672a  # v5.0.2
```

### Verification Commands

```bash
# Check latest version of an action
gh api repos/actions/checkout/releases/latest

# Check all releases
gh api repos/actions/checkout/releases

# Get SHA for specific tag
gh api repos/actions/checkout/git/ref/tags/v4.2.2
```

### Version Pinning Best Practices

```yaml
# ✅ BEST - SHA-pinned with version comment
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# ✅ GOOD - Semantic version pinning
- uses: actions/checkout@v4.2.2

# ❌ RISKY - Major version only
- uses: actions/checkout@v4  # Can break on minor/patch updates

# ❌ DANGEROUS - Latest tag
- uses: actions/checkout@latest  # Unpredictable updates

# ❌ VERY DANGEROUS - Main branch
- uses: actions/checkout@main  # Can change at any time
```

---

## Branch Protection Rules

### Recommended Settings (via GitHub UI)

**Settings → Branches → Add branch protection rule**

```
Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☐ Dismiss stale pull request approvals when new commits are pushed
  ☐ Require review from Code Owners

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Required checks:
    - test (from ci.yml)
    - build (from ci.yml)
    - CodeQL (from codeql.yml)

☑ Require conversation resolution before merging

☑ Do not allow bypassing the above settings (recommended for teams)
☐ Allow force pushes (disable for production branches)
☐ Allow deletions (disable for main/master)
```

### Example via API (Advanced)

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  repos/:owner/:repo/branches/main/protection \
  -f required_status_checks='{"strict":true,"checks":[{"context":"test"},{"context":"CodeQL"}]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f restrictions=null
```

---

## CODEOWNERS File

### Basic CODEOWNERS

```
# .github/CODEOWNERS

# Default owner for everything in repo
* @secondsky

# Specific directories
/docs/ @secondsky @docs-team
/.github/ @secondsky @devops-team

# Specific file types
*.ts @secondsky @frontend-team
*.py @secondsky @backend-team

# Specific files
package.json @secondsky
wrangler.jsonc @secondsky @devops-team
```

### Advanced CODEOWNERS

```
# .github/CODEOWNERS

# Order is important: last matching pattern takes precedence

# Default: Entire repo owned by core team
* @org/core-team

# Frontend code
/src/components/ @org/frontend-team
/src/pages/ @org/frontend-team
*.tsx @org/frontend-team
*.css @org/design-team

# Backend code
/api/ @org/backend-team
/workers/ @org/cloudflare-team

# CI/CD and infrastructure
/.github/ @org/devops-team
/scripts/ @org/devops-team
wrangler.jsonc @org/devops-team
Dockerfile @org/devops-team

# Security-sensitive files (require security team review)
/auth/ @org/security-team
*.env.example @org/security-team

# Documentation
/docs/ @org/docs-team
*.md @org/docs-team
```

**Note**: Teams must have write access to repo. Use `@username` for individuals, `@org/team-name` for teams.

---

## Issue Templates (YAML)

### Bug Report Template

```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml

name: Bug Report
description: Report a bug or unexpected behavior
title: "[Bug]: "
labels: ["bug", "needs-triage"]
assignees:
  - secondsky  # ← Change to your username

body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!

  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: A clear and concise description of the bug
      placeholder: When I click the submit button, the form doesn't validate...
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Detailed steps to reproduce the behavior
      placeholder: |
        1. Go to '/dashboard'
        2. Click on 'Submit' button
        3. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What you expected to happen
      placeholder: Form should validate and submit successfully
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options:
        - Critical (Blocks major functionality)
        - High (Significant impact)
        - Medium (Moderate impact)
        - Low (Minor inconvenience)
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: Version
      description: What version are you using?
      placeholder: e.g., 1.2.3
    validations:
      required: false

  - type: dropdown
    id: browser
    attributes:
      label: Browser
      options:
        - Chrome
        - Firefox
        - Safari
        - Edge
        - Other
    validations:
      required: false
```

### Feature Request Template

```yaml
# .github/ISSUE_TEMPLATE/feature_request.yml

name: Feature Request
description: Suggest an idea for this project
title: "[Feature]: "
labels: ["enhancement", "needs-triage"]
assignees:
  - secondsky

body:
  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: Describe the problem this feature would solve
      placeholder: I'm always frustrated when...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you'd like
      placeholder: I would like to see...
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Describe alternatives you've considered
      placeholder: I also thought about...
    validations:
      required: false

  - type: checkboxes
    id: terms
    attributes:
      label: Contribution
      options:
        - label: I am willing to submit a PR for this feature
          required: false
```

---

**Last Updated**: 2025-12-17
**Version**: 1.0.0
