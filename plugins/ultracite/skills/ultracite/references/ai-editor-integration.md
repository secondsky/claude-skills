# Ultracite AI Editor Integration

Complete guide for integrating Ultracite with AI coding assistants (Cursor, Claude Code, GitHub Copilot, etc.) using AI editor rules.

**Last Updated**: 2025-11-22

---

## Overview

Ultracite generates AI editor rules that teach AI assistants about your project's linting/formatting standards, reducing hallucinations and improving code quality.

**Benefits**:
- AI generates lint-compliant code from the start
- Fewer back-and-forth corrections
- Consistent code style across AI and human contributions
- Automatic synchronization with Ultracite config

**Supported Editors**:
- Cursor
- Claude Code (Windsurf)
- GitHub Copilot
- Continue.dev
- Codeium
- Zed
- VS Code (with Continue extension)

---

## How AI Editor Rules Work

1. **Ultracite analyzes your config** (`biome.json`)
2. **Generates editor-specific rules** (`.cursorrules`, `.windsurfrules`, etc.)
3. **AI editor loads rules** into context window
4. **AI generates compliant code** automatically

**Example flow**:
```
biome.json → ultracite generate-ai-rules → .cursorrules → Cursor → Lint-free code
```

---

## Supported Editors

### Cursor

**File**: `.cursorrules`

**Setup**:
```bash
# Generate rules
bunx ultracite generate-ai-rules

# Rules appear in ~/.cursorrules or project root
cat .cursorrules
```

**Cursor automatically loads** `.cursorrules` on project open.

**Verification**:
1. Open Cursor in your project
2. Ask Cursor to generate a React component
3. Check that code follows your Ultracite config (e.g., no `console.log` if disabled)

---

### Claude Code (Windsurf)

**File**: `.windsurfrules`

**Setup**:
```bash
# Generate rules
bunx ultracite generate-ai-rules

# Rules appear in project root
cat .windsurfrules
```

**Windsurf automatically loads** `.windsurfrules` on project open.

**Verification**:
1. Open Windsurf in your project
2. Ask Claude to write a function
3. Verify code matches your linting rules

---

### GitHub Copilot

**File**: `.github/copilot-instructions.md`

**Setup**:
```bash
# Generate rules
bunx ultracite generate-ai-rules --editor=copilot

# Rules appear in .github/
cat .github/copilot-instructions.md
```

**GitHub Copilot** reads from `.github/copilot-instructions.md` automatically.

**Verification**:
1. Open project in VS Code with Copilot
2. Start typing a function
3. Check that Copilot suggestions follow your rules

---

### Continue.dev

**File**: `.continuerules`

**Setup**:
```bash
# Generate rules
bunx ultracite generate-ai-rules --editor=continue

# Rules appear in project root
cat .continuerules
```

**Continue extension** loads `.continuerules` automatically.

**Verification**:
1. Open Continue panel in VS Code
2. Ask Continue to generate code
3. Verify compliance with linting rules

---

### Codeium

**File**: `.codeiumrules`

**Setup**:
```bash
# Generate rules
bunx ultracite generate-ai-rules --editor=codeium

# Rules appear in project root
cat .codeiumrules
```

**Codeium** reads `.codeiumrules` automatically.

---

### Zed

**File**: `.zedrules`

**Setup**:
```bash
# Generate rules
bunx ultracite generate-ai-rules --editor=zed

# Rules appear in project root
cat .zedrules
```

**Zed assistant** loads `.zedrules` automatically.

---

## Generated Rules Format

### Example `.cursorrules`

```markdown
# Project Linting Rules (Powered by Ultracite)

This project uses Ultracite (built on Biome) for linting and formatting.

## Active Presets
- ultracite/core
- ultracite/react

## Key Rules

### Correctness
- ✅ No unused variables
- ✅ No unreachable code
- ✅ Use === instead of ==
- ✅ No constant conditions

### React-Specific
- ✅ Exhaustive hook dependencies
- ✅ No array index as key
- ✅ Explicit button types
- ✅ No children prop

### Style
- ✅ Prefer const over let when possible
- ✅ Use template literals over concatenation
- ✅ Single variable declarator per statement

### Disabled Rules
- ❌ console.log allowed (noConsoleLog: off)

## When generating code:
1. Follow these rules strictly
2. Use const by default, let only when reassignment needed
3. Use === for all equality checks
4. Include all dependencies in React hooks
5. Avoid array indices as React keys
6. Use template literals for string interpolation

## Formatting
- Indent: 2 spaces
- Line width: 80 characters
- Semicolons: As needed
- Quotes: Single quotes
- Trailing commas: ES5 style
```

---

## Customization

### Global Rules (All Editors)

Generate rules for all supported editors at once:

```bash
bunx ultracite generate-ai-rules --all
```

This creates:
- `.cursorrules`
- `.windsurfrules`
- `.github/copilot-instructions.md`
- `.continuerules`
- `.codeiumrules`
- `.zedrules`

---

### Custom Rule Template

Create a custom template for generated rules:

**.ultracite/ai-rules-template.md**:
```markdown
# {{PROJECT_NAME}} Linting Rules

Generated from biome.json on {{DATE}}.

## Presets
{{PRESETS}}

## Enabled Rules
{{ENABLED_RULES}}

## Disabled Rules
{{DISABLED_RULES}}

## Custom Instructions
- Always use async/await over .then()
- Prefer named exports over default exports
- Add JSDoc comments to all exported functions
```

**Generate with custom template**:
```bash
bunx ultracite generate-ai-rules --template=.ultracite/ai-rules-template.md
```

---

### Per-Editor Customization

**Cursor-specific additions**:

`.cursorrules`:
```markdown
# ... (auto-generated rules)

## Cursor-Specific
- Use Cmd+K to generate code snippets
- Prefer inline completions for simple expressions
- Use chat for complex refactorings
```

**Copilot-specific additions**:

`.github/copilot-instructions.md`:
```markdown
# ... (auto-generated rules)

## GitHub Copilot Tips
- Accept suggestions with Tab
- Use Alt+] for next suggestion
- Use Copilot Chat for explanations
```

---

## Automatic Updates

### Git Hook Integration

Automatically regenerate rules when `biome.json` changes:

**Husky** (`.husky/post-merge`):
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Check if biome.json changed
if git diff HEAD@{1} HEAD --name-only | grep -q "biome.json"; then
  bunx ultracite generate-ai-rules
  git add .cursorrules .windsurfrules
fi
```

**Lefthook** (`lefthook.yml`):
```yaml
post-merge:
  commands:
    update-ai-rules:
      files: biome.json
      run: bunx ultracite generate-ai-rules && git add .cursorrules .windsurfrules
```

---

### CI Integration

Ensure rules are up-to-date in CI:

**GitHub Actions**:
```yaml
name: Check AI Rules

on: [pull_request]

jobs:
  check-rules:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install Ultracite
        run: bun add -D ultracite

      - name: Generate AI rules
        run: bunx ultracite generate-ai-rules

      - name: Check if rules are up-to-date
        run: |
          git diff --exit-code .cursorrules .windsurfrules || \
          (echo "AI rules are out of date. Run 'ultracite generate-ai-rules'" && exit 1)
```

---

## Best Practices

### 1. Commit AI Rules to Git

```bash
git add .cursorrules .windsurfrules .github/copilot-instructions.md
git commit -m "Add AI editor rules for Ultracite"
```

**Why**: Ensures all team members have consistent AI behavior.

---

### 2. Regenerate After Config Changes

```bash
# After editing biome.json
bunx ultracite generate-ai-rules
```

**Why**: Keeps AI rules synchronized with linting config.

---

### 3. Test AI Compliance

**Cursor**:
1. Ask: "Generate a React component with a form"
2. Verify: No `console.log`, correct hook dependencies, proper key usage

**GitHub Copilot**:
1. Start typing: `function fetchUser(`
2. Verify: Copilot suggests `async` keyword, uses `===`, avoids deprecated APIs

---

### 4. Use Editor-Specific Rules

Don't rely on auto-generated rules alone. Add project-specific conventions:

```markdown
# .cursorrules

## Project Conventions
- Use Tailwind classes, avoid inline styles
- Prefer server components in Next.js App Router
- Use Zod for all form validation
- Fetch data with React Query, not useEffect
```

---

### 5. Document Rule Rationale

Explain **why** rules exist:

```markdown
## Disabled Rules

- `noConsoleLog: off` - Allowed in development for debugging
- `noUnusedVariables: warn` - Warning only to support WIP code
```

---

## Troubleshooting

### Rules Not Loading

**Cursor**:
- Reload: Cmd+Shift+P → "Reload Window"
- Check: `.cursorrules` in project root
- Verify: Settings → Cursor → "Load project rules"

**GitHub Copilot**:
- Restart: VS Code → Developer → Reload Window
- Check: `.github/copilot-instructions.md` exists
- Verify: Copilot extension enabled

**Continue.dev**:
- Reload: Continue panel → Refresh
- Check: `.continuerules` in project root

---

### AI Ignoring Rules

**Increase rule prominence**:

```markdown
# .cursorrules

## ⚠️ CRITICAL RULES (NEVER IGNORE)

1. **NO console.log in production code**
2. **ALWAYS use === for equality**
3. **REQUIRED: Exhaustive React hook dependencies**
```

**Be specific**:

```markdown
# ❌ Vague
- Follow best practices

# ✅ Specific
- Use React.memo for components that render frequently
- Debounce search inputs with 300ms delay
- Always validate user input with Zod schemas
```

---

### Rules Out of Sync

**Symptom**: AI generates code that fails linting

**Fix**: Regenerate rules
```bash
bunx ultracite generate-ai-rules
```

**Verify**:
```bash
git diff .cursorrules  # Check what changed
```

---

## Advanced Patterns

### Conditional Rules by File Type

```markdown
# .cursorrules

## TypeScript Files
- Always use explicit return types
- Prefer interfaces over types for objects
- Use const assertions for literal types

## React Components
- Use function declarations, not arrow functions
- Separate container and presentational components
- Always use React.FC for component types

## Test Files
- Use describe/it blocks (not test/it)
- Mock external dependencies
- Aim for 80%+ coverage
```

---

### Framework-Specific Rules

**Next.js**:
```markdown
## Next.js Conventions
- Use `<Link>` from next/link, never `<a>`
- Use `<Image>` from next/image, never `<img>`
- Server Components by default, 'use client' only when needed
- Fetch data in Server Components, not useEffect
```

**Nuxt 3**:
```markdown
## Nuxt 3 Conventions
- Use `<NuxtLink>` instead of `<a>`
- Use `<NuxtImg>` for optimized images
- Prefer Composition API over Options API
- Use auto-imports, avoid manual imports
```

---

**See also:**
- `configuration-guide.md` for Ultracite setup
- `git-hooks-setup.md` for hook integration
- `troubleshooting.md` for common issues
