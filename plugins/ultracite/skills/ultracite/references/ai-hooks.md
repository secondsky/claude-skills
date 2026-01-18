---
title: AI Hooks Reference
description: Automatically format and fix code after AI assistant edits with post-edit hooks
feature: AI Hooks (Auto-format after AI edits)
version: v7.0+
keywords:
  - ai hooks
  - post-edit hooks
  - auto-format
  - cursor
  - claude code
  - copilot
  - windsurf
  - ai assistants
  - automatic linting
  - ultracite fix
---

# AI Hooks Reference

**Feature**: AI Hooks (Auto-format after AI edits)
**Version**: v7.0+
**Purpose**: Automatically run `ultracite fix` after AI code edits

## Overview

AI Hooks automatically format and lint code after AI assistants (Cursor, Claude Code, etc.) make edits. This ensures AI-generated code follows project standards without manual intervention.

## AI Hooks vs AI Rules

**AI Rules** (existing feature):
- Guides AI generation toward better code upfront
- Provides linting guidelines to AI during generation
- Prevents errors before they occur

**AI Hooks** (new in v7):
- Runs `ultracite fix` after AI edits
- Automatically formats AI-generated code
- Fixes linting issues automatically
- Applies import organization, spacing, etc.

**Recommended workflow** (combine both features):
1. AI Rules → Guides AI generation toward clean code
2. AI Hooks → Automatically fixes formatting issues

## Installation

### Cursor

```bash
# Install AI hooks for Cursor
npx ultracite ai-hooks install --editor cursor

# Installs to: .cursor/hooks/post-edit.sh
```

**What it does**:
1. Creates `.cursor/hooks/` directory
2. Adds `post-edit.sh` script that runs `npx ultracite fix` on edited files
3. Configures Cursor to execute hook after AI edits

### Claude Code

```bash
# Install AI hooks for Claude Code
npx ultracite ai-hooks install --editor claude-code

# Installs to: .claude/hooks/post-edit.sh
```

**Configuration** (`.claude/settings.json`):
```json
{
  "hooks": {
    "postEdit": ".claude/hooks/post-edit.sh"
  }
}
```

### Windsurf

```bash
# Install AI hooks for Windsurf
npx ultracite ai-hooks install --editor windsurf

# Installs to: .windsurf/hooks/after-edit.sh
```

### Cline (VS Code Extension)

```bash
# Install AI hooks for Cline
npx ultracite ai-hooks install --editor cline

# Installs to: .vscode/cline-hooks/post-edit.sh
```

### GitHub Copilot (Experimental)

**Note**: GitHub Copilot doesn't natively support hooks. Use editor's format-on-save instead.

**Alternative** (VS Code):
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  }
}
```

## Hook Script Details

### Post-Edit Hook Script

**Location**: `.cursor/hooks/post-edit.sh` (Cursor example)

```bash
#!/bin/bash
# Ultracite AI Hook - Auto-format after AI edits

# Get list of edited files from AI
EDITED_FILES=$1

if [ -z "$EDITED_FILES" ]; then
  echo "No files to format"
  exit 0
fi

# Run Ultracite fix on edited files
npx ultracite fix $EDITED_FILES --quiet

# Exit code 0 = success (allow AI edit to complete)
exit 0
```

### Customization

Edit hook script to customize behavior:

```bash
#!/bin/bash
# Custom Ultracite AI Hook

EDITED_FILES=$1

# Only format TypeScript files
TS_FILES=$(echo "$EDITED_FILES" | grep -E '\.(ts|tsx)$')

if [ -n "$TS_FILES" ]; then
  # Run fix with custom flags
  npx ultracite fix $TS_FILES \
    --no-errors-on-unmatched \
    --skip-gitignored \
    --quiet
fi

exit 0
```

## Configuration Options

### Hook Behavior

Configure hook execution in `.ultracite/hooks.json`:

```json
{
  "aiHooks": {
    "enabled": true,
    "runOn": "post-edit",
    "filePatterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "excludePatterns": ["**/*.test.ts", "**/dist/**"],
    "timeoutMs": 5000,
    "showNotifications": true
  }
}
```

**Options**:
- `enabled`: Enable/disable hooks
- `runOn`: When to run (`post-edit`, `pre-commit`)
- `filePatterns`: Which files to format
- `excludePatterns`: Files to skip
- `timeoutMs`: Max hook execution time
- `showNotifications`: Show toast notifications

### Per-Editor Configuration

**Cursor** (`.cursor/hooks/config.json`):
```json
{
  "hooks": {
    "postEdit": {
      "enabled": true,
      "script": "./post-edit.sh",
      "timeout": 5000
    }
  }
}
```

**Claude Code** (`.claude/settings.json`):
```json
{
  "hooks": {
    "postEdit": ".claude/hooks/post-edit.sh",
    "postEditTimeout": 5000
  }
}
```

## Usage

### Automatic Execution

Once installed, hooks run automatically:

1. **AI makes edit** → File is modified
2. **Hook triggers** → `post-edit.sh` runs
3. **Ultracite fixes** → Auto-format, organize imports, fix lint issues
4. **User sees result** → Formatted code

### Manual Testing

Test hook manually:

```bash
# Simulate AI edit on file
.cursor/hooks/post-edit.sh src/index.ts

# Test multiple files
.cursor/hooks/post-edit.sh "src/**/*.ts"
```

### Disable Temporarily

```bash
# Disable hooks for single AI session
ULTRACITE_HOOKS_DISABLED=true cursor

# Or edit config
# .ultracite/hooks.json
{
  "aiHooks": {
    "enabled": false  // Disable
  }
}
```

## Workflow Examples

### Example 1: React Component Generation

**Before AI Hooks**:
1. Ask AI: "Create a React button component"
2. AI generates code
3. **Manual step**: Run `npx ultracite fix src/Button.tsx`
4. Code is formatted

**After AI Hooks**:
1. Ask AI: "Create a React button component"
2. AI generates code
3. **Hook auto-runs**: `npx ultracite fix src/Button.tsx`
4. Code is formatted automatically ✨

### Example 2: Large Refactoring

**Before AI Hooks**:
1. Ask AI: "Refactor these 10 files to use hooks"
2. AI edits 10 files
3. **Manual step**: Run `npx ultracite fix src/**/*.tsx`
4. All files formatted

**After AI Hooks**:
1. Ask AI: "Refactor these 10 files to use hooks"
2. AI edits 10 files
3. **Hook auto-runs**: Formats each file as edited
4. All files automatically formatted ✨

## Performance Considerations

### Hook Execution Time

Typical hook execution times:
- **Single file**: 50-200ms
- **5 files**: 200-500ms
- **10+ files**: 500ms-2s

### Optimization Tips

**1. Only format changed files**:
```bash
# In hook script
CHANGED_FILES=$(echo "$EDITED_FILES" | grep -E '\.(ts|tsx)$')
npx ultracite fix $CHANGED_FILES  # Not all files
```

**2. Skip tests and generated files**:
```json
{
  "excludePatterns": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.generated.ts",
    "**/dist/**",
    "**/node_modules/**"
  ]
}
```

**3. Use cache**:
```bash
# Ultracite automatically caches results
npx ultracite fix $FILES --use-cache
```

**4. Set timeout**:
```json
{
  "timeoutMs": 3000  // Kill if takes >3s
}
```

## Troubleshooting

### Hook Not Running

**Problem**: AI edits don't trigger hook

**Check**:
1. Hook script exists: `ls .cursor/hooks/post-edit.sh`
2. Script is executable: `chmod +x .cursor/hooks/post-edit.sh`
3. Hooks enabled: Check `.ultracite/hooks.json`

**Solution**:
```bash
# Reinstall hooks
npx ultracite ai-hooks install --editor cursor --force

# Make executable
chmod +x .cursor/hooks/post-edit.sh

# Test manually
.cursor/hooks/post-edit.sh src/test.ts
```

### Hook Fails Silently

**Problem**: Hook runs but doesn't format

**Debug**:
```bash
# Run hook with debug output
DEBUG=ultracite:hooks .cursor/hooks/post-edit.sh src/test.ts

# Check Ultracite can run
npx ultracite fix src/test.ts --verbose
```

**Common issues**:
- Ultracite not installed: `bun add -D ultracite`
- Invalid configuration: `npx ultracite doctor`
- File not matched by patterns: Check `filePatterns`

### Hook Timeout

**Problem**: Hook takes too long, gets killed

**Solution**: Increase timeout

```json
{
  "aiHooks": {
    "timeoutMs": 10000  // 10 seconds
  }
}
```

Or optimize hook:
```bash
# Skip slow operations
npx ultracite fix $FILES \
  --skip-typecheck \
  --no-verify \
  --quiet
```

### Conflicting Format Changes

**Problem**: Hook reverts some of AI's formatting

**Cause**: AI uses different format style than Ultracite

**Solution**: Align AI rules with Ultracite config

**1. Update AI Rules** (`.cursor/rules/ultracite.mdc`):
```markdown
- Use 2 spaces for indentation (matches Ultracite)
- Use single quotes for strings (matches Ultracite)
- No semicolons (matches Ultracite Biome config)
```

**2. Update Ultracite config** to match AI preferences:
```jsonc
{
  "formatter": {
    "indentWidth": 2,
    "quoteStyle": "single",
    "semicolons": false
  }
}
```

## Advanced Usage

### Conditional Formatting

Format only if file changed significantly:

```bash
#!/bin/bash
EDITED_FILES=$1

for file in $EDITED_FILES; do
  # Check if file changed >10 lines
  CHANGED_LINES=$(git diff --numstat "$file" | awk '{print $1 + $2}')

  if [ "$CHANGED_LINES" -gt 10 ]; then
    npx ultracite fix "$file" --quiet
  fi
done
```

### Pre-Commit Integration

Combine AI hooks with Git hooks:

```bash
# .husky/pre-commit
#!/bin/bash

# Format staged files (from AI edits or manual)
npx lint-staged

# Or use Ultracite directly
npx ultracite fix --staged --quiet
```

### Multi-Provider Support

Use different providers based on file type:

```bash
#!/bin/bash
EDITED_FILES=$1

for file in $EDITED_FILES; do
  case "$file" in
    *.css|*.scss)
      # Use ESLint provider for CSS
      npx ultracite fix "$file" --provider eslint
      ;;
    *.ts|*.tsx)
      # Use Oxlint for TypeScript
      npx ultracite fix "$file" --provider oxlint
      ;;
    *)
      # Default to Biome
      npx ultracite fix "$file"
      ;;
  esac
done
```

## Best Practices

### 1. Combine with AI Rules
- Use AI Rules to guide generation
- Use AI Hooks to polish result

### 2. Set Reasonable Timeouts
- Keep hooks fast (<2s)
- Avoid blocking AI workflow

### 3. Exclude Generated Files
- Don't format lock files, dist, node_modules
- Focus on source files only

### 4. Use Notifications
- Enable toast notifications to see hook status
- Helps debug when hooks fail

### 5. Test Hooks Locally
- Run hook manually before committing
- Verify it works on sample files

## Resources

- AI Hooks Guide: https://www.ultracite.ai/guides/ai-hooks
- Cursor Hooks Docs: https://cursor.sh/docs/hooks
- Claude Code Hooks: https://docs.anthropic.com/claude/docs/hooks
- Hook Examples: https://github.com/ultracite/ultracite/tree/main/examples/hooks
- Troubleshooting: https://www.ultracite.ai/troubleshooting/ai-hooks
