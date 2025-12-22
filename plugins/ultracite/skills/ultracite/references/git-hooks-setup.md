# Ultracite Git Hooks Setup

Complete guide for integrating Ultracite with Husky, Lefthook, and lint-staged for automated pre-commit linting.

**Last Updated**: 2025-11-22

---

## Overview

Git hooks automatically run Ultracite before commits, preventing bad code from entering the repository.

**Benefits**:
- Catch errors before they reach CI
- Enforce code quality standards
- Reduce code review noise
- Faster feedback loop

**Supported Hook Managers**:
- **Husky** (npm-based, most popular)
- **Lefthook** (Go-based, faster)
- **lint-staged** (runs linters on staged files only)

---

## Choosing a Hook Manager

| Feature | Husky | Lefthook | lint-staged |
|---------|-------|----------|-------------|
| **Language** | Node.js | Go | Node.js |
| **Speed** | Medium | Fast | Medium |
| **Configuration** | Shell scripts | YAML | JavaScript |
| **Popularity** | 40k+ stars | 5k+ stars | 13k+ stars |
| **Best For** | General use | Monorepos | Simple linting |
| **Windows Support** | ✅ | ✅ | ✅ |

**Recommendation**:
- **First-time setup**: Husky (most documentation)
- **Performance-critical**: Lefthook (2-3x faster)
- **Simple projects**: lint-staged only

---

## Husky Integration

### Installation

```bash
# Install Husky
bun add -D husky

# Initialize Husky
bunx husky init
```

This creates:
- `.husky/` directory
- `.husky/pre-commit` hook

---

### Basic Setup

**Option 1: Lint all files** (simple, slower):

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

ultracite check --write
```

**Option 2: Lint staged files only** (recommended):

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

ultracite check --staged --write
```

---

### Advanced Setup with lint-staged

**Install lint-staged**:
```bash
bun add -D lint-staged
```

**Configure lint-staged** in `package.json`:
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json,css}": [
      "ultracite check --write --no-errors-on-unmatched --files-ignore-unknown=true"
    ]
  }
}
```

**Update `.husky/pre-commit`**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bunx lint-staged
```

---

### Framework-Specific Examples

**Next.js**:
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "ultracite check --write --no-errors-on-unmatched"
    ],
    "*.{json,css}": [
      "ultracite format --write"
    ]
  }
}
```

**Turborepo Monorepo**:
```json
{
  "lint-staged": {
    "apps/**/*.{js,jsx,ts,tsx}": [
      "ultracite check --write --no-errors-on-unmatched"
    ],
    "packages/**/*.{js,jsx,ts,tsx}": [
      "ultracite check --write --no-errors-on-unmatched"
    ]
  }
}
```

---

### Troubleshooting Husky

**Hook not executing**:
```bash
# Make hook executable
chmod +x .husky/pre-commit

# Verify hook exists
ls -la .husky/
```

**Hook fails silently**:
```bash
# Add debugging
set -x  # Add to top of .husky/pre-commit

# Test hook manually
.husky/pre-commit
```

**Skipping hooks** (emergency only):
```bash
git commit --no-verify -m "Emergency fix"
```

---

## Lefthook Integration

### Installation

```bash
# Install Lefthook
bun add -D lefthook

# Initialize Lefthook
bunx lefthook install
```

This creates:
- `lefthook.yml` configuration
- Git hooks in `.git/hooks/`

---

### Basic Setup

Create `lefthook.yml`:

```yaml
pre-commit:
  commands:
    ultracite:
      glob: "*.{js,jsx,ts,tsx,json,css}"
      run: ultracite check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
```

---

### Advanced Setup

**Multiple commands**:
```yaml
pre-commit:
  parallel: true  # Run commands in parallel
  commands:
    ultracite-lint:
      glob: "*.{js,jsx,ts,tsx}"
      run: ultracite check --write --no-errors-on-unmatched {staged_files}

    ultracite-format:
      glob: "*.{json,css,md}"
      run: ultracite format --write {staged_files}

    type-check:
      glob: "*.{ts,tsx}"
      run: tsc --noEmit {staged_files}
```

---

### Monorepo Setup

**Root `lefthook.yml`**:
```yaml
pre-commit:
  commands:
    ultracite-apps:
      glob: "apps/**/*.{js,jsx,ts,tsx}"
      run: ultracite check --write --config-path=apps/biome.json {staged_files}

    ultracite-packages:
      glob: "packages/**/*.{js,jsx,ts,tsx}"
      run: ultracite check --write --config-path=packages/biome.json {staged_files}
```

---

### Performance Optimization

**Skip on merge commits** (faster rebases):
```yaml
pre-commit:
  skip:
    - merge
  commands:
    ultracite:
      run: ultracite check --staged --write
```

**Fail fast** (stop on first error):
```yaml
pre-commit:
  piped: true  # Stop pipeline on error
  commands:
    ultracite:
      run: ultracite check --staged --write
```

---

### Troubleshooting Lefthook

**Hook not found**:
```bash
# Reinstall hooks
bunx lefthook install

# Verify installation
ls -la .git/hooks/pre-commit
```

**YAML syntax errors**:
```bash
# Validate config
bunx lefthook run pre-commit --verbose
```

**Skipping hooks** (emergency only):
```bash
LEFTHOOK=0 git commit -m "Emergency fix"
```

---

## lint-staged (Standalone)

### Installation

```bash
bun add -D lint-staged husky
bunx husky init
```

---

### Configuration Options

**Option 1: `package.json`** (recommended for simple setups):

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "ultracite check --write --no-errors-on-unmatched"
    ],
    "*.{json,css}": [
      "ultracite format --write"
    ]
  }
}
```

**Option 2: `.lintstagedrc.json`** (cleaner):

```json
{
  "*.{js,jsx,ts,tsx}": [
    "ultracite check --write --no-errors-on-unmatched"
  ],
  "*.{json,css}": [
    "ultracite format --write"
  ]
}
```

**Option 3: `lint-staged.config.js`** (dynamic configuration):

```javascript
export default {
  '*.{js,jsx,ts,tsx}': (filenames) => [
    `ultracite check --write --no-errors-on-unmatched ${filenames.join(' ')}`,
  ],
  '*.{json,css}': (filenames) => [
    `ultracite format --write ${filenames.join(' ')}`,
  ],
};
```

---

### Advanced Patterns

**Conditional linting**:
```javascript
export default {
  '*.{js,jsx,ts,tsx}': (filenames) => {
    const isApp = filenames.some(f => f.startsWith('apps/'));
    const config = isApp ? 'apps/biome.json' : 'biome.json';

    return [
      `ultracite check --config-path=${config} --write ${filenames.join(' ')}`,
    ];
  },
};
```

**Multiple commands per file type**:
```json
{
  "*.{js,jsx,ts,tsx}": [
    "ultracite check --write --no-errors-on-unmatched",
    "vitest related --run"
  ]
}
```

---

### Troubleshooting lint-staged

**Files not being linted**:
```bash
# Test manually
bunx lint-staged --debug

# Check staged files
git diff --cached --name-only
```

**Glob patterns not matching**:
```bash
# Test pattern matching
bunx lint-staged --diff="main...HEAD"
```

**Hangs on large changesets**:
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "ultracite check --write --no-errors-on-unmatched --files-max-size=1048576"
    ]
  }
}
```

---

## Detection Logic

Ultracite CLI automatically detects existing hook managers:

```bash
# Check for Husky
ls .husky/pre-commit

# Check for Lefthook
ls lefthook.yml

# Check for lint-staged
cat package.json | grep "lint-staged"
```

**Auto-configuration priority**:
1. If `lefthook.yml` exists → Use Lefthook
2. Else if `.husky/` exists → Use Husky
3. Else → Prompt user to choose

---

## CI Integration

### GitHub Actions

```yaml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run Ultracite
        run: bun ultracite ci
```

---

### GitLab CI

```yaml
lint:
  image: node:20
  script:
    - npm install -g bun
    - bun install
    - bun ultracite ci
```

---

### Cloudflare Pages

```yaml
# .cloudflare/pages.yml
build:
  command: bun run build
  environment:
    NODE_VERSION: 20
  pre_build:
    - bun install
    - bun ultracite ci
```

---

## Best Practices

1. **Use `--staged` flag** to lint only changed files (faster)
2. **Use `--write` flag** to auto-fix issues
3. **Use `--no-errors-on-unmatched`** to ignore unsupported file types
4. **Combine with lint-staged** for maximum performance
5. **Skip hooks sparingly** (only for emergencies)
6. **Test hooks locally** before pushing to CI
7. **Document hook setup** in project README
8. **Use Lefthook for monorepos** (better performance)

---

**See also:**
- `configuration-guide.md` for Ultracite configuration
- `ai-editor-integration.md` for editor hooks
- `troubleshooting.md` for hook failures
