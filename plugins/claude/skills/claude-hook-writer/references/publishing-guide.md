# Publishing Hooks as PRPM Packages

Guide for packaging and publishing hooks to the PRPM registry.

---

## Package Structure

```
my-hook/
├── prpm.json          # Package manifest
├── hook.json          # Hook configuration
├── scripts/
│   └── my-hook.sh     # Hook script
└── README.md          # Documentation
```

---

## prpm.json

Package manifest with metadata:

```json
{
  "name": "@yourname/my-hook",
  "version": "1.0.0",
  "description": "Brief description shown in search results",
  "author": "Your Name",
  "format": "claude",
  "subtype": "hook",
  "tags": [
    "formatting",
    "security",
    "automation"
  ],
  "main": "hook.json",
  "scripts": {
    "test": "./test-hook.sh"
  }
}
```

---

## hook.json

Hook configuration with `${CLAUDE_PLUGIN_ROOT}` for portability:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/my-hook.sh",
        "timeout": 5000
      }]
    }]
  }
}
```

**Always use `${CLAUDE_PLUGIN_ROOT}`** to reference scripts.

---

## Advanced Hook Configuration

All hook types support optional fields:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "./my-hook.sh",
        "timeout": 5000,
        "continue": true,
        "stopReason": "string",
        "suppressOutput": false,
        "systemMessage": "string"
      }]
    }]
  }
}
```

### `continue` (boolean, default: true)

Controls whether Claude continues after hook execution.

**When to use `false`**:
- Security hooks that must block operations
- Validation hooks that found critical errors

```json
{
  "continue": false,
  "stopReason": "Security validation failed. Review detected issues."
}
```

### `stopReason` (string)

Message displayed when `continue: false`. Explain why and what action is needed.

### `suppressOutput` (boolean, default: false)

Hides hook stdout from transcript. Stderr always shown.

**When to use `true`**:
- Verbose output not useful to users
- Background operations

### `systemMessage` (string)

Warning shown to user (non-blocking).

**Difference from `stopReason`**:
- `systemMessage`: Informational, continues
- `stopReason`: Critical, requires `continue: false`

---

## README.md Template

```markdown
# My Hook

Brief description of what this hook does.

## What It Does

- Clear bullet points
- Which events it triggers on
- Which tools it matches

## Installation

\`\`\`bash
prpm install @yourname/my-hook
\`\`\`

## Requirements

- prettier (install: `npm install -g prettier`)
- jq (install: `brew install jq`)

## Configuration

Optional: How to customize behavior.

## Examples

Show example output or behavior.

## Troubleshooting

Common issues and fixes.
```

---

## Publishing Commands

```bash
# Test locally first
prpm test

# Publish
prpm publish

# Version bumps
prpm publish patch  # 1.0.0 -> 1.0.1
prpm publish minor  # 1.0.0 -> 1.1.0
prpm publish major  # 1.0.0 -> 2.0.0
```

---

## Pre-Publish Checklist

- [ ] Validates all stdin input
- [ ] Quotes all variables
- [ ] Uses absolute paths for scripts
- [ ] Blocks sensitive files
- [ ] Handles missing tools gracefully
- [ ] Sets reasonable timeout
- [ ] Logs errors to stderr or file
- [ ] Tests with edge cases
- [ ] Tests in real Claude session
- [ ] Documents dependencies
- [ ] README includes examples
- [ ] Semantic version number
- [ ] Clear description and tags

---

## Best Practices

1. **Clear description**: Users find your hook via search
2. **Comprehensive README**: Include examples and troubleshooting
3. **Semantic versioning**: Breaking changes = major version
4. **Test before publishing**: Run `prpm test`
5. **Document dependencies**: List all required tools
6. **Provide examples**: Show expected behavior
7. **Handle errors gracefully**: Don't crash on edge cases
