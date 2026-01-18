---
title: ESLint Provider Reference
description: ESLint + Prettier + Stylelint provider for maximum compatibility
provider: ESLint
speed: Moderate (JavaScript-based)
bestFor: Maximum compatibility, existing ESLint plugin ecosystem, advanced CSS/SCSS linting
---

# ESLint Provider Reference

**Provider**: ESLint + Prettier + Stylelint
**Speed**: Moderate (JavaScript-based)
**Best for**: Maximum compatibility, existing ESLint plugin ecosystem, advanced CSS/SCSS linting

## Overview

The ESLint provider integrates ESLint, Prettier, and Stylelint into Ultracite's unified workflow. This provider is ideal for projects that require specific ESLint plugins or advanced CSS linting capabilities.

## Installation

```bash
# Install with ESLint provider
bun x ultracite init --linter eslint

# Installs: eslint, prettier, stylelint, and necessary plugins
```

## Configuration Files

ESLint provider uses three configuration files:

### `.eslintrc.js` (or `.eslintrc.json`)

```javascript
module.exports = {
  extends: [
    'ultracite/eslint/core',
    'ultracite/eslint/react',  // Framework preset
    'ultracite/eslint/prettier' // Prettier integration
  ],
  rules: {
    // Custom rule overrides
  }
};
```

### `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### `.stylelintrc.json` (if using CSS/SCSS)

```json
{
  "extends": ["ultracite/stylelint/core"],
  "rules": {
    // CSS-specific rules
  }
}
```

## Available Presets

### Core Preset
- `ultracite/eslint/core` - Base ESLint rules
  - TypeScript support
  - Import/export rules
  - Code quality rules

### Framework Presets
- `ultracite/eslint/react` - React + JSX
- `ultracite/eslint/next` - Next.js
- `ultracite/eslint/vue` - Vue 3
- `ultracite/eslint/solid` - Solid.js

### Integration Presets
- `ultracite/eslint/prettier` - Prettier integration
- `ultracite/eslint/jest` - Jest testing
- `ultracite/eslint/vitest` - Vitest testing

### Stylelint Presets
- `ultracite/stylelint/core` - Base CSS rules
- `ultracite/stylelint/scss` - SCSS support
- `ultracite/stylelint/css-modules` - CSS Modules

## Adding ESLint Plugins

The ESLint provider allows you to use any ESLint plugin:

```javascript
// .eslintrc.js
module.exports = {
  extends: ['ultracite/eslint/core'],
  plugins: [
    'security',        // eslint-plugin-security
    'sonarjs',         // eslint-plugin-sonarjs
    'jsx-a11y'         // eslint-plugin-jsx-a11y
  ],
  rules: {
    'security/detect-object-injection': 'warn',
    'sonarjs/cognitive-complexity': ['error', 15]
  }
};
```

Install additional plugins:

```bash
bun add -D eslint-plugin-security eslint-plugin-sonarjs eslint-plugin-jsx-a11y
```

## Editor Integration

### VS Code

Install extensions:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension stylelint.vscode-stylelint
```

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

## CLI Commands

```bash
# Lint with ESLint
npx ultracite lint .

# Format with Prettier
npx ultracite format .

# Fix ESLint issues
npx ultracite fix .

# Lint CSS with Stylelint
npx stylelint "**/*.css"

# Fix Stylelint issues
npx stylelint "**/*.css" --fix
```

## Performance Optimization

### Enable Caching

```javascript
// .eslintrc.js
module.exports = {
  extends: ['ultracite/eslint/core'],
  cache: true,
  cacheLocation: '.eslintcache'
};
```

### Parallel Linting

Ultracite automatically runs ESLint with `--max-workers` based on CPU cores.

### Ignore Patterns

```javascript
// .eslintrc.js
module.exports = {
  extends: ['ultracite/eslint/core'],
  ignorePatterns: [
    'dist',
    'build',
    'node_modules',
    '*.generated.ts'
  ]
};
```

## Advanced CSS Linting

The ESLint provider includes Stylelint for comprehensive CSS/SCSS linting:

```json
// .stylelintrc.json
{
  "extends": ["ultracite/stylelint/scss"],
  "rules": {
    "property-no-unknown": true,
    "selector-class-pattern": "^[a-z][a-zA-Z0-9]+$",
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-properties": true,
    "order/properties-alphabetical-order": true
  }
}
```

## Diagnostics

```bash
# Check ESLint configuration
npx eslint --debug src/**/*.ts

# Check Prettier configuration
npx prettier --check .

# Check Stylelint configuration
npx stylelint "**/*.css" --formatter verbose
```

## Advantages Over Biome

### ESLint Plugin Ecosystem
- Access to 1000+ ESLint plugins
- Security plugins (e.g., `eslint-plugin-security`)
- Framework-specific plugins (e.g., `eslint-plugin-react-hooks`)
- Custom company/team plugins

### Advanced CSS Linting
- Property ordering enforcement
- BEM methodology validation
- SCSS/Less/Stylus support
- CSS-in-JS linting

### Mature Ecosystem
- Extensive documentation
- Large community support
- Well-established best practices

## Disadvantages vs Biome

### Performance
- 10-100x slower than Biome (JavaScript vs Rust)
- Requires separate tools (ESLint + Prettier + Stylelint)

### Configuration Complexity
- More configuration files to manage
- Potential conflicts between tools
- Requires plugin management

## Migration from ESLint to Ultracite ESLint Provider

If you have existing ESLint configuration:

```bash
# Ultracite will detect and merge existing config
bun x ultracite init --linter eslint --migrate eslint
```

Steps:
1. Backs up existing `.eslintrc.*` files
2. Merges custom rules into Ultracite presets
3. Adds Prettier integration
4. Optionally adds Stylelint for CSS

## Troubleshooting

### Prettier vs ESLint Conflicts

**Problem**: ESLint reports formatting errors that Prettier should handle

**Solution**: Ensure `ultracite/eslint/prettier` preset is loaded last:

```javascript
module.exports = {
  extends: [
    'ultracite/eslint/core',
    'ultracite/eslint/react',
    'ultracite/eslint/prettier'  // MUST be last
  ]
};
```

### Stylelint Not Running

**Problem**: CSS files not being linted

**Solution**: Add glob pattern:

```bash
npx stylelint "**/*.{css,scss,sass}"
```

### Slow Linting Performance

**Solutions**:
1. Enable ESLint cache: `cache: true`
2. Reduce `ignorePatterns` scope
3. Consider switching to Biome provider for speed

## Resources

- [ESLint Official Docs](https://eslint.org/)
- [Prettier Official Docs](https://prettier.io/)
- [Stylelint Official Docs](https://stylelint.io/)
- [Ultracite ESLint Docs](https://www.ultracite.ai/providers/eslint)
- [ESLint Plugin Registry](https://www.npmjs.com/search?q=keywords:eslint-plugin)
