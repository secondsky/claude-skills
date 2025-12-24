# Ultracite Migration Guides

Complete guides for migrating from ESLint, Prettier, and Biome to Ultracite.

**Last Updated**: 2025-11-22

---

## ESLint Migration

### Automatic Migration (Recommended)

```bash
# Install Ultracite
bun add -D ultracite

# Run migration tool
bunx ultracite migrate eslint

# Review changes
git diff
```

**What it does**:
1. Analyzes your `.eslintrc` configuration
2. Maps ESLint rules to Biome equivalents
3. Creates `biome.json` with equivalent rules
4. Generates migration report

---

### Manual Migration

**1. Analyze Current ESLint Config**

```bash
# View your current ESLint rules
cat .eslintrc.json
```

**2. Find Biome Equivalents**

| ESLint Rule | Biome Equivalent |
|-------------|------------------|
| `no-unused-vars` | `noUnusedVariables` |
| `eqeqeq` | `noDoubleEquals` |
| `no-console` | `noConsoleLog` |
| `prefer-const` | `useConst` |
| `no-debugger` | `noDebugger` |
| `no-unreachable` | `noUnreachable` |
| `no-constant-condition` | `noConstantCondition` |

**Full mapping**: https://biomejs.dev/linter/rules/

---

**3. Create `biome.json`**

**From this ESLint config**:
```json
{
  "extends": ["eslint:recommended", "plugin:react/recommended"],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "eqeqeq": "error"
  }
}
```

**To this Biome config**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/react"],

  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "warn",
        "noDoubleEquals": "error"
      },
      "style": {
        "useConst": "error"
      }
    }
  }
}
```

---

**4. Remove ESLint**

```bash
# Remove ESLint packages
bun remove eslint eslint-plugin-react eslint-config-prettier

# Remove config files
rm .eslintrc.json .eslintignore
```

---

**5. Update Scripts**

**Before**:
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  }
}
```

**After**:
```json
{
  "scripts": {
    "lint": "ultracite check",
    "lint:fix": "ultracite check --write"
  }
}
```

---

### ESLint Plugins Without Biome Equivalents

**Common plugins**:
- `eslint-plugin-import` → **No equivalent** (some import rules in Biome core)
- `eslint-plugin-jsx-a11y` → **Partial** (Biome has a11y category)
- `eslint-plugin-testing-library` → **No equivalent**
- `eslint-plugin-jest` → **No equivalent**

**Solution**: Run ESLint alongside Ultracite for unsupported plugins:

```json
{
  "scripts": {
    "lint": "ultracite check && eslint . --ext .test.ts --plugin testing-library"
  }
}
```

---

### Migration Checklist

- [ ] Run `ultracite migrate eslint`
- [ ] Review generated `biome.json`
- [ ] Test linting: `bunx ultracite check`
- [ ] Update package.json scripts
- [ ] Update CI configuration
- [ ] Update pre-commit hooks
- [ ] Remove ESLint dependencies
- [ ] Remove `.eslintrc` and `.eslintignore`
- [ ] Document any ESLint plugins still needed
- [ ] Commit changes

---

## Prettier Migration

### Automatic Migration (Recommended)

```bash
# Install Ultracite
bun add -D ultracite

# Run migration tool
bunx ultracite migrate prettier

# Review changes
git diff
```

**What it does**:
1. Reads your `.prettierrc` configuration
2. Maps Prettier options to Biome equivalents
3. Updates `biome.json` formatter section
4. Generates migration report

---

### Manual Migration

**1. Compare Configurations**

| Prettier Option | Biome Equivalent |
|-----------------|------------------|
| `printWidth` | `formatter.lineWidth` |
| `tabWidth` | `formatter.indentWidth` |
| `useTabs` | `formatter.indentStyle: "tab"` |
| `semi` | `javascript.formatter.semicolons` |
| `singleQuote` | `javascript.formatter.quoteStyle` |
| `trailingComma` | `javascript.formatter.trailingCommas` |
| `arrowParens` | `javascript.formatter.arrowParentheses` |

---

**2. Convert Configuration**

**From this Prettier config**:
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

**To this Biome config**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core"],

  "formatter": {
    "enabled": true,
    "lineWidth": 100,
    "indentWidth": 2,
    "indentStyle": "space"
  },

  "javascript": {
    "formatter": {
      "semicolons": "always",
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  }
}
```

---

**3. Remove Prettier**

```bash
# Remove Prettier
bun remove prettier

# Remove config files
rm .prettierrc .prettierignore
```

---

**4. Update Scripts**

**Before**:
```json
{
  "scripts": {
    "format": "prettier --write ."
  }
}
```

**After**:
```json
{
  "scripts": {
    "format": "ultracite format --write"
  }
}
```

---

### Formatting Differences

**Prettier**:
```javascript
// Object spacing
const obj = {foo: "bar"};

// Arrow function parentheses (default)
const fn = x => x + 1;
```

**Biome**:
```javascript
// Object spacing
const obj = { foo: "bar" };

// Arrow function parentheses (configurable)
const fn = (x) => x + 1;
```

**To match Prettier**:
```jsonc
{
  "javascript": {
    "formatter": {
      "arrowParentheses": "asNeeded"  // Same as Prettier default
    }
  }
}
```

---

### Migration Checklist

- [ ] Run `ultracite migrate prettier`
- [ ] Review generated formatter config
- [ ] Test formatting: `bunx ultracite format --write .`
- [ ] Compare output with Prettier (spot check)
- [ ] Update package.json scripts
- [ ] Update CI configuration
- [ ] Update pre-commit hooks
- [ ] Remove Prettier dependencies
- [ ] Remove `.prettierrc` and `.prettierignore`
- [ ] Commit formatted code

---

## Biome Migration

**Note**: Ultracite is built on Biome, so migration is minimal.

### Automatic Migration

```bash
# Install Ultracite
bun add -D ultracite

# Ultracite automatically detects biome.json
bunx ultracite check
```

---

### Manual Migration

**1. Install Ultracite**

```bash
bun add -D ultracite
```

---

**2. Use Ultracite Presets**

**Before** (vanilla Biome):
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",

  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      // ... 50+ manual rule configurations
    }
  }
}
```

**After** (Ultracite preset):
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/react"],

  // Only customize what differs from preset
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"  // Single override
      }
    }
  }
}
```

---

**3. Update Package Name**

**Before**:
```json
{
  "scripts": {
    "lint": "biome check",
    "format": "biome format --write"
  }
}
```

**After**:
```json
{
  "scripts": {
    "lint": "ultracite check",
    "format": "ultracite format --write"
  }
}
```

---

**4. Remove Biome (Optional)**

```bash
# Ultracite includes Biome internally
bun remove @biomejs/biome
```

---

### Benefits of Migration

| Feature | Vanilla Biome | Ultracite |
|---------|---------------|-----------|
| **Configuration** | Manual (~200 rules) | Presets (3-10 lines) |
| **Framework Support** | Generic | React/Next.js/Vue/Svelte |
| **Git Hooks** | Manual setup | Auto-detection + setup |
| **AI Editor Rules** | Manual | Auto-generation |
| **Monorepo Support** | Basic | Turborepo-optimized |

---

### Migration Checklist

- [ ] Install Ultracite: `bun add -D ultracite`
- [ ] Replace rules with presets in `biome.json`
- [ ] Update package.json scripts
- [ ] Test linting: `bunx ultracite check`
- [ ] Test formatting: `bunx ultracite format --write .`
- [ ] Remove Biome dependency (optional)
- [ ] Commit changes

---

## Post-Migration

### Verify Everything Works

```bash
# 1. Lint entire codebase
bunx ultracite check

# 2. Format entire codebase
bunx ultracite format --write .

# 3. Run tests
bun test

# 4. Commit formatted code
git add .
git commit -m "chore: migrate to Ultracite"
```

---

### Update CI

**GitHub Actions**:
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

### Update Pre-Commit Hooks

**Husky**:
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

ultracite check --staged --write
```

**Lefthook**:
```yaml
# lefthook.yml
pre-commit:
  commands:
    ultracite:
      glob: "*.{js,jsx,ts,tsx,json}"
      run: ultracite check --write --no-errors-on-unmatched {staged_files}
```

---

### Update Editor Settings

**VS Code** (`.vscode/settings.json`):

**Before** (ESLint/Prettier):
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**After** (Ultracite/Biome):
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit"
  }
}
```

---

## Troubleshooting

### Rules Not Equivalent

**Issue**: Biome doesn't have exact equivalent for an ESLint rule

**Solution**: Document missing rules and keep ESLint for those specific checks:

```json
{
  "scripts": {
    "lint": "ultracite check && eslint . --plugin testing-library --ext .test.ts"
  }
}
```

---

### Formatting Differences

**Issue**: Biome formats code differently than Prettier

**Solution 1**: Adjust Biome config to match Prettier:
```jsonc
{
  "javascript": {
    "formatter": {
      "arrowParentheses": "asNeeded",  // Match Prettier
      "quoteStyle": "single"
    }
  }
}
```

**Solution 2**: Accept Biome's style (often more consistent)

---

### Migration Breaks CI

**Issue**: CI fails after migration due to formatting changes

**Solution**: Commit formatted code first:
```bash
bunx ultracite format --write .
git add .
git commit -m "chore: format code with Ultracite"
```

---

**See also:**
- `configuration-guide.md` for Ultracite setup
- `troubleshooting.md` for common issues
- `limitations-and-workarounds.md` for feature gaps
