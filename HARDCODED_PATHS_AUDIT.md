# Hardcoded Paths Audit Report

**Date**: 2025-11-19
**Status**: 🔴 Issues Found (13 instances across 8 skills)
**Severity**: HIGH - Will break on different environments

---

## Executive Summary

Found **13 hardcoded path references** across **8 skills** that will break portability:
- **6 HIGH priority** - User-specific paths that will fail on other systems
- **5 MEDIUM priority** - Assumed directory structures
- **2 LOW priority** - Minor portability concerns

All issues are in documentation/examples, not in executable scripts.

---

## HIGH PRIORITY 🔴 (Must Fix)

### 1. cloudflare-worker-base/README.md:179
```markdown
- ✅ Research log: `/home/jez/Documents/claude-skills/planning/research-logs/cloudflare-worker-base.md`
```
**Issue**: Developer's personal home directory path
**Impact**: Path doesn't exist for any other user
**Fix**: Use relative path or remove absolute path

---

### 2. root-cause-tracing/SKILL.md:27
```
Error: git init failed in /Users/jesse/project/packages/core
```
**Issue**: Hardcoded macOS user directory in example error message
**Impact**: Not representative of typical user paths
**Fix**: Use generic example like `/path/to/project/packages/core` or `~/project/packages/core`

---

### 3. claude-agent-sdk/SKILL.md:160
```typescript
workingDirectory: "/Users/dev/projects/my-app",
```
**Issue**: Hardcoded macOS-specific path in example code
**Impact**: Windows/Linux users can't relate to example
**Fix**: Use `process.cwd()` or generic `/path/to/my-app`

---

### 4. claude-agent-sdk/SKILL.md:428,436
```typescript
ALLOWED_PATHS: "/Users/developer/projects:/tmp"
GIT_REPO_PATH: "/Users/developer/projects/my-repo"
```
**Issue**: Multiple hardcoded macOS paths in configuration examples
**Impact**: Non-macOS users see irrelevant examples
**Fix**: Use generic paths or environment variables like `$HOME/projects`

---

### 5. claude-hook-writer/SKILL.md:218
```bash
/Users/username/.claude/scripts/my-script.sh
```
**Issue**: Hardcoded macOS path (even though labeled as example)
**Impact**: Should use `$HOME` or relative path
**Fix**: Change to `$HOME/.claude/scripts/my-script.sh`

---

### 6. project-workflow/SKILL.md:56
```bash
cp ~/claude-skills/skills/project-workflow/commands/*.md ~/.claude/commands/
```
**Issue**: Assumes repository cloned to `~/claude-skills`
**Impact**: Breaks if user clones to different location
**Fix**: Use environment variable or make path configurable

---

## MEDIUM PRIORITY 🟡 (Should Fix)

### 7. multi-ai-consultant/SKILL.md:418-420
```csv
2025-11-07T14:23:45-05:00,gemini,gemini-2.5-pro,15420,850,0.1834,/home/user/project
2025-11-07T15:10:22-05:00,codex,gpt-4-turbo,8230,430,0.0952,/home/user/project
2025-11-07T16:05:11-05:00,claude-subagent,claude-sonnet-4-5,0,0,0.00,/home/user/project
```
**Issue**: Generic but assumes Linux filesystem structure
**Impact**: Windows users don't use `/home/user/`
**Fix**: Use `/path/to/project` or `C:\path\to\project` for cross-platform examples

---

### 8. cloudflare-full-stack-scaffold/SKILL.md:449-450
```bash
cp -r scaffold/ ~/projects/my-new-app/
cd ~/projects/my-new-app/
```
**Issue**: Assumes `~/projects/` directory exists
**Impact**: Users may organize projects differently
**Fix**: Use `~/my-new-app/` or instruct to choose location

---

### 9. multi-ai-consultant/SKILL.md:174-175
```bash
cp ~/.claude/skills/multi-ai-consultant/templates/consultation-log-parser.sh ~/bin/
chmod +x ~/bin/consultation-log-parser.sh
```
**Issue**: Assumes `~/bin/` exists and is in PATH
**Impact**: Many systems don't have `~/bin/` by default
**Fix**: Suggest creating directory first or use `/usr/local/bin` with sudo

---

### 10-11. project-workflow/SKILL.md:531,542
```
2. Modifying templates in `~/.claude/skills/project-planning/templates/`
2. Modifying templates in `~/.claude/skills/project-session-management/templates/`
```
**Issue**: References to other skill paths without verifying they exist
**Impact**: Assumes multiple skills installed
**Fix**: Add existence check or conditional instructions

---

## LOW PRIORITY 🟢 (Consider)

### 12. Multiple skills using `/tmp/`
**Files**: claude-hook-writer, chrome-devtools, claude-agent-sdk
**Issue**: Uses `/tmp/` instead of `$TMPDIR` or `os.tmpdir()`
**Impact**: Minor - `/tmp/` works on most Unix systems but not optimal
**Fix**: Use `$TMPDIR` environment variable for better portability

---

### 13. Framework-specific path aliases
**Files**: inspira-ui, nuxt-v4 (using `~/components/`)
**Issue**: Tilde aliases like `~/components/`
**Impact**: None - these are framework-specific import aliases, not filesystem paths
**Status**: ✅ ACCEPTABLE - Framework convention

---

## Recommendations

### Immediate Actions (HIGH Priority)
1. ✅ Fix all user-specific paths (`/Users/jesse`, `/home/jez`)
2. ✅ Replace with generic examples (`/path/to/project`, `$HOME/project`)
3. ✅ Use environment variables where appropriate (`$HOME`, `$TMPDIR`, `$PWD`)

### Short-term Actions (MEDIUM Priority)
1. ⚠️ Add instructions to create assumed directories
2. ⚠️ Make paths configurable or relative
3. ⚠️ Add cross-platform path examples (Windows + Unix)

### Best Practices Going Forward
```bash
# ❌ BAD - Hardcoded user path
/Users/username/project

# ✅ GOOD - Environment variable
$HOME/project

# ✅ GOOD - Generic example
/path/to/project

# ✅ GOOD - Relative to current directory
./project

# ✅ GOOD - Relative to skill directory
$CLAUDE_SKILL_ROOT/templates/

# ✅ GOOD - Cross-platform
${HOME}/project  # Unix
%USERPROFILE%\project  # Windows
```

---

## Affected Skills Summary

| Priority | Skill | Issues | Lines |
|----------|-------|--------|-------|
| 🔴 HIGH | cloudflare-worker-base | 1 | README:179 |
| 🔴 HIGH | root-cause-tracing | 1 | SKILL:27 |
| 🔴 HIGH | claude-agent-sdk | 3 | SKILL:160,428,436 |
| 🔴 HIGH | claude-hook-writer | 1 | SKILL:218 |
| 🔴 HIGH | project-workflow | 1 | SKILL:56 |
| 🟡 MEDIUM | multi-ai-consultant | 2 | SKILL:174,418-420 |
| 🟡 MEDIUM | cloudflare-full-stack-scaffold | 1 | SKILL:449-450 |
| 🟡 MEDIUM | project-workflow | 2 | SKILL:531,542 |

**Total**: 8 skills, 13 instances

---

## Path Pattern Guidelines

### Acceptable Patterns
- ✅ `~/.claude/skills/` - Standard skill installation location
- ✅ `~/.claude/commands/` - Standard commands directory
- ✅ Framework aliases (`~/components/` in Nuxt/Vue)
- ✅ Generic examples (`/path/to/project`)
- ✅ Environment variables (`$HOME`, `$PWD`, `$TMPDIR`)

### Problematic Patterns
- ❌ User-specific paths (`/Users/jesse`, `/home/jez`)
- ❌ Assumed directory structures (`~/projects/`, `~/bin/`)
- ❌ Hardcoded repo locations (`~/claude-skills/`)
- ❌ Platform-specific paths without alternatives

---

## Testing Checklist

Before merging path fixes:
- [ ] Verify examples work on macOS
- [ ] Verify examples work on Linux
- [ ] Verify examples work on Windows (WSL + native)
- [ ] Check all uses of `~` are appropriate
- [ ] Check all absolute paths are necessary
- [ ] Ensure environment variables are documented
- [ ] Test with users who have non-standard setups

---

**Next Steps**: Proceed with fixes for HIGH priority items first, then MEDIUM priority.

**Estimated Fix Time**:
- HIGH priority: ~30 minutes
- MEDIUM priority: ~20 minutes
- Total: ~50 minutes
