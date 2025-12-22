# gemini-coach Helper Functions Reference

Quick reference for all gemini-coach commands

---

## Basic Commands

```bash
gemini-coach review [files...]          # Code review
gemini-coach debug [error-message]      # Root cause analysis  
gemini-coach architect [question] [path] # Architecture advice (Pro)
gemini-coach security [files...]        # Security audit
gemini-coach quick "[question]"         # Fast question, no context
```

## Helper Functions

```bash
gemini-coach review-dir "[prompt]" /path    # Review directory with context
gemini-coach project-review "[prompt]"      # Whole project analysis
gemini-coach compare /path1 /path2          # Compare implementations
gemini-coach security-scan [/path]          # Comprehensive audit (Pro)
```

## Model Selection

```bash
# Use Pro for single command
GEMINI_MODEL=gemini-2.5-pro gemini-coach review src/auth.ts

# Use Pro for session
export GEMINI_MODEL=gemini-2.5-pro
```

---

See SKILL.md for complete documentation with examples.
