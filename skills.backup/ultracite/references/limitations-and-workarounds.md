# Ultracite Limitations and Workarounds

Known limitations of Ultracite/Biome and practical workarounds for common scenarios.

**Last Updated**: 2025-11-22

---

## CSS/SCSS Linting

### Limitation

**Issue**: Biome does not lint CSS, SCSS, or Less files.

**GitHub Issue**: https://github.com/biomejs/biome/issues/13

**Status**: Planned for Biome v2.0 (no ETA)

---

### Workaround: Use Stylelint

**Install Stylelint**:
```bash
bun add -D stylelint stylelint-config-standard
```

**Configure Stylelint** (`stylelint.config.js`):
```javascript
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'color-hex-length': 'short',
    'declaration-block-no-redundant-longhand-properties': true,
  },
};
```

**Update Scripts**:
```json
{
  "scripts": {
    "lint": "ultracite check && stylelint '**/*.css'",
    "lint:fix": "ultracite check --write && stylelint '**/*.css' --fix"
  }
}
```

**Pre-Commit Hook** (Husky):
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

ultracite check --staged --write
stylelint '**/*.css' --fix
```

---

## Framework Support Gaps

### Angular

**Limitation**: No official Angular preset in Ultracite.

**Workaround**: Use `ultracite/core` and add Angular-specific rules manually:

`biome.json`:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core"],

  "linter": {
    "rules": {
      "style": {
        "useNamingConvention": {
          "level": "error",
          "options": {
            "strictCase": true,
            "conventions": [
              {
                "selector": { "kind": "class" },
                "match": "^[A-Z][a-zA-Z0-9]*$",  // PascalCase for components
                "formats": ["PascalCase"]
              },
              {
                "selector": { "kind": "variable" },
                "match": "^[a-z][a-zA-Z0-9]*$",  // camelCase for variables
                "formats": ["camelCase"]
              }
            ]
          }
        }
      }
    }
  }
}
```

**Alternative**: Keep ESLint with `@angular-eslint` plugin:

```json
{
  "scripts": {
    "lint": "ng lint && ultracite check"
  }
}
```

---

### Astro

**Limitation**: No official Astro preset.

**Workaround**: Use `ultracite/core` for `.js/.ts` files:

`biome.json`:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core"],

  "files": {
    "include": ["src/**/*.js", "src/**/*.ts"],
    "ignore": ["src/**/*.astro"]  // Skip .astro files
  }
}
```

**For `.astro` files**: Use `eslint-plugin-astro`:

```bash
bun add -D eslint eslint-plugin-astro
```

```json
{
  "scripts": {
    "lint": "ultracite check src/**/*.{js,ts} && eslint src/**/*.astro"
  }
}
```

---

### Qwik

**Limitation**: No official Qwik preset.

**Workaround**: Use `ultracite/react` (similar JSX syntax):

`biome.json`:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/react"]
}
```

**Note**: Some Qwik-specific patterns (e.g., `$` suffix for signals) may trigger warnings.

---

### Solid.js

**Limitation**: No official Solid preset.

**Workaround**: Use `ultracite/react` (very similar syntax):

`biome.json`:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/react"]
}
```

**Disable incompatible React rules**:
```jsonc
{
  "linter": {
    "rules": {
      "correctness": {
        "useExhaustiveDependencies": "off"  // Solid doesn't use deps arrays
      }
    }
  }
}
```

---

## ESLint Plugin Ecosystem

### Limitation

**Issue**: Many ESLint plugins have no Biome equivalent:
- `eslint-plugin-import` (import sorting)
- `eslint-plugin-testing-library` (test linting)
- `eslint-plugin-jest` (Jest best practices)
- `eslint-plugin-cypress` (Cypress linting)
- `eslint-plugin-storybook` (Storybook rules)

---

### Workaround 1: Run ESLint Alongside Ultracite

**For test files only**:
```bash
bun add -D eslint eslint-plugin-testing-library eslint-plugin-jest
```

**Configure ESLint for tests** (`.eslintrc.test.json`):
```json
{
  "extends": ["plugin:testing-library/react", "plugin:jest/recommended"],
  "rules": {
    "testing-library/prefer-screen-queries": "error"
  }
}
```

**Update Scripts**:
```json
{
  "scripts": {
    "lint": "ultracite check",
    "lint:tests": "eslint **/*.test.ts --config .eslintrc.test.json"
  }
}
```

---

### Workaround 2: Use Biome's Import Sorting

**For import organization** (partial replacement for `eslint-plugin-import`):

`biome.json`:
```jsonc
{
  "organizeImports": {
    "enabled": true
  }
}
```

**VS Code**:
`.vscode/settings.json`:
```json
{
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit"
  }
}
```

**Limitations**: Biome's import sorting is basic compared to `eslint-plugin-import`.

---

## File Type Support

### Markdown

**Limitation**: Biome does not lint Markdown files.

**Workaround**: Use `markdownlint`:

```bash
bun add -D markdownlint-cli
```

**Configure** (`.markdownlint.json`):
```json
{
  "MD013": false,  // Line length
  "MD033": false   // Inline HTML
}
```

**Update Scripts**:
```json
{
  "scripts": {
    "lint": "ultracite check && markdownlint '**/*.md'"
  }
}
```

---

### YAML

**Limitation**: Biome does not lint YAML files.

**Workaround**: Use `yamllint`:

```bash
bun add -D yamllint
```

**Update Scripts**:
```json
{
  "scripts": {
    "lint": "ultracite check && yamllint '**/*.yml'"
  }
}
```

---

### HTML

**Limitation**: Biome does not lint standalone HTML files (only JSX).

**Workaround**: Use `htmlhint`:

```bash
bun add -D htmlhint
```

**Update Scripts**:
```json
{
  "scripts": {
    "lint": "ultracite check && htmlhint '**/*.html'"
  }
}
```

---

## Language Feature Support

### Decorators

**Limitation**: Biome has limited support for TypeScript decorators (Stage 3 proposal).

**Status**: Partial support added in Biome v1.9.

**Workaround**: Enable unsafe decorators:

`biome.json`:
```jsonc
{
  "javascript": {
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    }
  }
}
```

**If issues persist**: Keep TypeScript compiler for type checking:

```json
{
  "scripts": {
    "lint": "ultracite check && tsc --noEmit"
  }
}
```

---

### JSDoc Validation

**Limitation**: Biome does not validate JSDoc syntax or types.

**Workaround**: Use `eslint-plugin-jsdoc`:

```bash
bun add -D eslint eslint-plugin-jsdoc
```

**Configure ESLint**:
```json
{
  "extends": ["plugin:jsdoc/recommended"],
  "rules": {
    "jsdoc/require-param-description": "error"
  }
}
```

---

## Configuration Limitations

### No `.js` Config Files

**Limitation**: Biome only supports `.json` or `.jsonc` config files, not JavaScript.

**Workaround**: Use environment-specific configs:

**Development**:
```bash
ultracite check --config-path=biome.dev.json
```

**Production/CI**:
```bash
ultracite check --config-path=biome.ci.json
```

**Or**: Use scripts to generate config dynamically:

**`scripts/generate-config.js`**:
```javascript
import fs from 'fs';

const config = {
  $schema: "https://biomejs.dev/schemas/2.3.8/schema.json",
  extends: ["ultracite/core"],
  linter: {
    rules: {
      suspicious: {
        noConsoleLog: process.env.NODE_ENV === 'production' ? 'error' : 'off',
      },
    },
  },
};

fs.writeFileSync('biome.json', JSON.stringify(config, null, 2));
```

**Usage**:
```bash
node scripts/generate-config.js && ultracite check
```

---

### No Per-File Overrides (Yet)

**Limitation**: Biome doesn't support per-file rule overrides like ESLint's `overrides`.

**GitHub Issue**: https://github.com/biomejs/biome/issues/2228

**Workaround**: Use separate configs per directory:

**`src/biome.json`**:
```jsonc
{
  "extends": ["../biome.json"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"  // Allow in src/
      }
    }
  }
}
```

**`tests/biome.json`**:
```jsonc
{
  "extends": ["../biome.json"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"  // Allow in tests/
      }
    }
  }
}
```

---

## Editor Integration

### IntelliJ IDEA / WebStorm

**Limitation**: No official Biome plugin for JetBrains IDEs.

**Workaround 1**: Use File Watcher

**Settings → Tools → File Watchers → Add**:
- **File type**: JavaScript/TypeScript
- **Program**: `$ProjectFileDir$/node_modules/.bin/ultracite`
- **Arguments**: `check --write $FilePath$`
- **Output paths to refresh**: `$FilePath$`

**Workaround 2**: Use "Run on Save" plugin

Install: https://plugins.jetbrains.com/plugin/7177-run-on-save

**Configure**:
```
Command: node_modules/.bin/ultracite check --write {file}
```

---

### Neovim

**Limitation**: No official Biome plugin.

**Workaround**: Use `null-ls.nvim` with Biome:

**Install**:
```lua
-- In your neovim config
use {
  'jose-elias-alvarez/null-ls.nvim',
  requires = { 'nvim-lua/plenary.nvim' },
}
```

**Configure**:
```lua
local null_ls = require("null-ls")

null_ls.setup({
  sources = {
    null_ls.builtins.formatting.biome,
    null_ls.builtins.diagnostics.biome,
  },
})
```

---

## Monorepo Limitations

### No Global Config Override

**Limitation**: Can't override root config for all packages at once.

**Workaround**: Use shared config file:

**`.ultracite/shared.json`**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"
      }
    }
  }
}
```

**Each package extends shared config**:

**`apps/web/biome.json`**:
```jsonc
{
  "extends": ["../../.ultracite/shared.json", "ultracite/nextjs"]
}
```

**`packages/ui/biome.json`**:
```jsonc
{
  "extends": ["../../.ultracite/shared.json", "ultracite/react"]
}
```

---

## Performance Limitations

### Large File Handling

**Limitation**: Biome can be slow on very large files (>10,000 lines).

**Workaround**: Exclude large generated files:

`biome.json`:
```jsonc
{
  "files": {
    "ignore": [
      "**/*.generated.ts",
      "**/*.bundle.js"
    ],
    "maxSize": 1048576  // 1 MB limit
  }
}
```

---

### Memory Usage in CI

**Limitation**: Biome can use significant memory in large codebases.

**Workaround**: Increase Node memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" ultracite check
```

---

## Migration Limitations

### No Auto-Fix for All ESLint Rules

**Limitation**: `ultracite migrate eslint` doesn't convert all ESLint rules.

**Workaround**: Manual mapping required for complex rules:

**ESLint** (`no-restricted-syntax`):
```json
{
  "rules": {
    "no-restricted-syntax": ["error", "ForInStatement"]
  }
}
```

**Biome** (no direct equivalent):
```jsonc
{
  "linter": {
    "rules": {
      "suspicious": {
        "noForInLoop": "error"  // Manually add equivalent rule
      }
    }
  }
}
```

---

## Future Improvements

**Planned in Biome v2.0**:
- CSS/SCSS linting
- Per-file rule overrides
- Plugin system for custom rules
- More framework presets (Angular, Astro, etc.)

**Track progress**: https://github.com/biomejs/biome/issues

---

## Best Practices

1. **Combine tools strategically**: Use Ultracite for JS/TS, Stylelint for CSS, markdownlint for docs
2. **Document limitations**: Keep this guide updated as you discover gaps
3. **Stay updated**: Follow Biome releases for new features
4. **Contribute**: Report missing features to Biome GitHub
5. **Use ESLint selectively**: Only for plugins without Biome equivalents
6. **Test migrations**: Verify all rules work after migrating from ESLint/Prettier

---

**See also:**
- `migration-guides.md` for ESLint/Prettier migration
- `configuration-guide.md` for Ultracite setup
- `troubleshooting.md` for common issues
