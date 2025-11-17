# Quick Fix Guide - YAML Frontmatter Issues

**Total to fix:** 13 skills | **Estimated time:** ~1 hour

---

## CRITICAL FIXES (Fix First - 15 minutes)

### 1. feature-dev - Create SKILL.md

**Status:** Missing entire SKILL.md file

**Action:**
```bash
# Create file at: /home/user/claude-skills/skills/feature-dev/SKILL.md
```

**Template:**
```yaml
---
name: feature-dev
description: |
  Complete project feature development automation using slash commands.
  Use when starting new features, managing development branches, creating
  pull requests, handling code reviews, and deploying features safely.
license: MIT
---

# Feature Development Automation

[Add content from README.md and flesh out the skill documentation]
```

---

### 2. motion - Fix YAML delimiter

**File:** `/home/user/claude-skills/skills/motion/SKILL.md`

**Current (WRONG):**
```
# Motion Animation Library

---
name: motion
description: |
  ...
```

**Fix (CORRECT):**
```
---
name: motion
description: |
  Production-ready setup for Motion (formerly Framer Motion)...
license: MIT
---

# Motion Animation Library

[Rest of content...]
```

**Change:** Move `# Motion Animation Library` from line 1 to after the closing `---`

---

### 3. project-workflow - Fix YAML delimiter

**File:** `/home/user/claude-skills/skills/project-workflow/SKILL.md`

**Current (WRONG):**
```
# Project Workflow Skill

**Complete project lifecycle automation...**

This skill provides 7 integrated slash commands...
```

**Fix (CORRECT):**
```
---
name: project-workflow
description: |
  Complete project lifecycle automation for Claude Code.
  Use when starting projects, planning features, managing
  development sessions, and ensuring safe releases.
license: MIT
---

# Project Workflow Skill

[Rest of content...]
```

**Change:** Add proper YAML frontmatter at the start

---

## HIGH PRIORITY FIXES (Spec Compliance - ~15 minutes)

### Fix these 7 name field values (all similar pattern):

Each of these needs the `name:` field changed from Title Case to lowercase-kebab-case.

#### 1. cloudflare-manager
**File:** `/home/user/claude-skills/skills/cloudflare-manager/SKILL.md`
**Change line 2 from:**
```yaml
name: Cloudflare Manager
```
**To:**
```yaml
name: cloudflare-manager
```

#### 2. gemini-cli
**File:** `/home/user/claude-skills/skills/gemini-cli/SKILL.md`
**Change line 2 from:**
```yaml
name: Gemini CLI
```
**To:**
```yaml
name: gemini-cli
```

#### 3. multi-ai-consultant
**File:** `/home/user/claude-skills/skills/multi-ai-consultant/SKILL.md`
**Change from:**
```yaml
name: Multi-AI Consultant
```
**To:**
```yaml
name: multi-ai-consultant
```

#### 4. nuxt-v4
**File:** `/home/user/claude-skills/skills/nuxt-v4/SKILL.md`
**Change from:**
```yaml
name: Nuxt 4
```
**To:**
```yaml
name: nuxt-v4
```

#### 5. tanstack-router
**File:** `/home/user/claude-skills/skills/tanstack-router/SKILL.md`
**Change from:**
```yaml
name: TanStack Router
```
**To:**
```yaml
name: tanstack-router
```

#### 6. tanstack-start
**File:** `/home/user/claude-skills/skills/tanstack-start/SKILL.md`
**Change from:**
```yaml
name: TanStack Start
```
**To:**
```yaml
name: tanstack-start
```

#### 7. tanstack-table
**File:** `/home/user/claude-skills/skills/tanstack-table/SKILL.md`
**Change from:**
```yaml
name: TanStack Table
```
**To:**
```yaml
name: tanstack-table
```

---

## REVIEW ITEMS (Discuss with maintainers - 30 minutes)

These contain the reserved word "claude" which violates Anthropic spec.
**Determine:** Keep as exception or rename?

1. **claude-agent-sdk**
   - Current: `name: claude-agent-sdk`
   - Option A: Keep as-is (request exception)
   - Option B: Rename to `agent-sdk` (breaking change)

2. **claude-api**
   - Current: `name: claude-api`
   - Option A: Keep as-is (request exception)
   - Option B: Rename to `anthropic-api` (still problematic)

3. **claude-code-bash-patterns**
   - Current: `name: claude-code-bash-patterns`
   - Option A: Keep as-is (request exception)
   - Option B: Rename to `bash-patterns` or `code-bash-patterns`

---

## Verification Commands

### Test individual file:
```bash
# Check if SKILL.md exists
ls -la /home/user/claude-skills/skills/feature-dev/SKILL.md

# View YAML frontmatter
head -10 /home/user/claude-skills/skills/cloudflare-manager/SKILL.md
```

### Test all skills after fixes:
```bash
cd /home/user/claude-skills
bash /tmp/check_skills.sh  # Re-run compliance checker
```

### Expected result after all fixes:
```
Total skills checked: 90
Passed: 90
Failed: 0
Compliance rate: 100%
```

---

## Commit Message Template

Once all fixes are complete:

```
Fix YAML frontmatter compliance across 13 skills

Changes:
- Create SKILL.md for feature-dev
- Fix YAML delimiters in motion and project-workflow
- Correct name field casing in 7 skills (cloudflare-manager, gemini-cli, 
  multi-ai-consultant, nuxt-v4, tanstack-router, tanstack-start, tanstack-table)
- Now 100% compliant with Anthropic skills spec

Fixes: 13 non-compliant skills
Compliance rate: 85.6% -> 100%
```

---

## File Locations for Quick Reference

- **cloudflare-manager:** `/home/user/claude-skills/skills/cloudflare-manager/SKILL.md` (line 2)
- **feature-dev:** `/home/user/claude-skills/skills/feature-dev/SKILL.md` (create new)
- **gemini-cli:** `/home/user/claude-skills/skills/gemini-cli/SKILL.md` (line 2)
- **motion:** `/home/user/claude-skills/skills/motion/SKILL.md` (reorder lines)
- **multi-ai-consultant:** `/home/user/claude-skills/skills/multi-ai-consultant/SKILL.md` (line 2)
- **nuxt-v4:** `/home/user/claude-skills/skills/nuxt-v4/SKILL.md` (line 2)
- **project-workflow:** `/home/user/claude-skills/skills/project-workflow/SKILL.md` (add frontmatter)
- **tanstack-router:** `/home/user/claude-skills/skills/tanstack-router/SKILL.md` (line 2)
- **tanstack-start:** `/home/user/claude-skills/skills/tanstack-start/SKILL.md` (line 2)
- **tanstack-table:** `/home/user/claude-skills/skills/tanstack-table/SKILL.md` (line 2)

Reserved word skills (review with maintainers):
- **claude-agent-sdk:** `/home/user/claude-skills/skills/claude-agent-sdk/SKILL.md`
- **claude-api:** `/home/user/claude-skills/skills/claude-api/SKILL.md`
- **claude-code-bash-patterns:** `/home/user/claude-skills/skills/claude-code-bash-patterns/SKILL.md`

---

Generated: 2025-11-16
