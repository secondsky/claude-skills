# Claude Hook Writer Skill

Production-ready skill for writing secure, reliable, and performant Claude Code hooks.

## Auto-Trigger Keywords

- Claude Code hooks
- hook writer
- PreToolUse hook
- PostToolUse hook
- UserPromptSubmit hook
- SessionStart hook
- hook security
- hook validation
- PRPM package
- bash hook
- hook configuration
- hook testing

## When to Use

- Creating new Claude Code hooks
- Reviewing hook code for security issues
- Debugging hook failures
- Optimizing slow hooks
- Publishing hooks as PRPM packages
- Understanding hook exit codes and behavior

## Key Features

- **Security Requirements**: Input validation, path sanitization, sensitive file protection
- **Reliability Patterns**: Handle missing dependencies, set timeouts, log properly
- **Performance Guidelines**: Keep hooks fast, use specific matchers, dedupe operations
- **Code Templates**: Format on save, block sensitive files, command logger, security hooks
- **Testing Strategies**: Manual testing, edge cases, integration testing
- **PRPM Publishing**: Package structure, configuration, advanced options

## Common Pitfalls Covered

- Not quoting variables (breaks on spaces)
- Trusting input without validation
- Blocking operations too long
- Using wrong exit codes
- Logging to stdout instead of stderr
- Assuming tools exist

## Source

Adapted from [PRPM claude-hook-writer](https://github.com/pr-pm/prpm/blob/main/.claude/skills/claude-hook-writer/SKILL.md)

## License

MIT
