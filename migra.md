# Plugin Structure Migration Guide for Claude Code

**Purpose**: Guide for migrating skills to the official Claude Code plugin structure when skills are not appearing in Claude's system prompt.

**When to Use**: Your skills exist but aren't visible to Claude Code, or you're converting a skill-based repository to a plugin-based repository.

---

## Table of Contents

1. [Problem Diagnosis](#problem-diagnosis)
2. [Understanding Plugin Structure](#understanding-plugin-structure)
3. [Migration Workflow](#migration-workflow)
4. [Validation Steps](#validation-steps)
5. [Rollback Plan](#rollback-plan)
6. [Best Practices](#best-practices)

---

## Problem Diagnosis

### Symptoms

Your skills are not appearing in Claude's system prompt even though:
- ✅ Skills are installed in `~/.claude/plugins/cache/` or `~/.claude/skills/`
- ✅ Skills have valid YAML frontmatter in SKILL.md files
- ✅ `installed_plugins.json` shows skills as installed
- ❌ Skills don't appear when you ask "what skills do you see?"

### Root Cause

Claude Code expects this structure:
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
└── skills/                   # ← Skills MUST be in this subdirectory!
    └── skill-name/
        └── SKILL.md
```

But you have:
```
skill-name/
├── .claude-plugin/
│   └── plugin.json
└── SKILL.md                  # ← Wrong location! No skills/ parent directory
```

### How to Confirm

1. Check a working official plugin (e.g., `plugin-dev` from Anthropic):
   ```bash
   ls ~/.claude/plugins/cache/claude-plugins-official/plugin-dev/
   # Should show: skills/ directory

   ls ~/.claude/plugins/cache/claude-plugins-official/plugin-dev/skills/
   # Should show: agent-development/, command-development/, etc.
   ```

2. Compare with your skills:
   ```bash
   ls ~/.claude/plugins/cache/your-marketplace/your-skill/
   # If you see SKILL.md at this level (no skills/ subdirectory), that's the problem
   ```

3. Ask Claude: "What skills do you see in your system prompt?"
   - If official plugins appear but yours don't, structure is wrong

---

## Understanding Plugin Structure

### Official Structure (Correct)

```
my-plugin/                           # Plugin root
├── .claude-plugin/
│   └── plugin.json                  # Plugin-level manifest
│       {
│         "name": "my-plugin",
│         "description": "Plugin description",
│         "version": "1.0.0",
│         ...
│       }
└── skills/                          # Skills directory (REQUIRED)
    ├── skill-one/
    │   ├── SKILL.md                # Skill content
    │   ├── .claude-plugin/         # Skill-level manifest (optional)
    │   │   └── plugin.json
    │   ├── references/
    │   ├── templates/
    │   └── scripts/
    └── skill-two/
        └── SKILL.md
```

### Key Rules

1. **Plugin manifest**: `plugin-name/.claude-plugin/plugin.json` (REQUIRED)
2. **Skills directory**: `plugin-name/skills/` (REQUIRED)
3. **Skill subdirectories**: Each skill in `skills/{skill-name}/` (REQUIRED)
4. **SKILL.md location**: `plugin-name/skills/{skill-name}/SKILL.md` (REQUIRED)

### Plugin vs Skill Manifests

- **Plugin manifest** (`.claude-plugin/plugin.json` at plugin root):
  - Describes the entire plugin
  - Lists multiple skills (if grouped)
  - Required for plugin discovery

- **Skill manifest** (`.claude-plugin/plugin.json` in skill subdirectory):
  - Optional (inherits from plugin manifest)
  - Can override plugin-level settings
  - Useful for backward compatibility

---

## Migration Workflow

### Phase 1: Planning

#### Step 1.1: Inventory Your Skills

```bash
# List all skills
find . -name "SKILL.md" -type f

# Count skills
find . -name "SKILL.md" -type f | wc -l
```

#### Step 1.2: Decide on Plugin Strategy

**Option A: One Big Plugin** (simple)
- All skills in one plugin
- Use when: <20 skills, all related

```
my-skills-plugin/
└── skills/
    ├── skill-1/SKILL.md
    ├── skill-2/SKILL.md
    └── skill-3/SKILL.md
```

**Option B: Grouped Plugins** (recommended)
- Group related skills by technology/vendor/purpose
- Use when: 20+ skills, multiple domains

```
plugins/
├── cloudflare/       # All Cloudflare skills
│   └── skills/
│       ├── cloudflare-workers/
│       ├── cloudflare-d1/
│       └── cloudflare-r2/
├── react/            # All React skills
│   └── skills/
│       ├── react-hooks/
│       └── react-state/
└── testing/          # All testing skills
    └── skills/
        ├── jest/
        └── playwright/
```

**Option C: Standalone Plugins** (for unique skills)
- Each skill is its own plugin
- Use when: Skills are completely unrelated

```
plugins/
├── nextjs/
│   └── skills/
│       └── nextjs/SKILL.md      # Same name as plugin
├── zod/
│   └── skills/
│       └── zod/SKILL.md
└── tailwind/
    └── skills/
        └── tailwind/SKILL.md
```

#### Step 1.3: Create Migration Plan

Document your grouping strategy:
```markdown
## Plugin Grouping Plan

### Grouped Plugins (5 plugins, 45 skills)
- **cloudflare** (23 skills): cloudflare-workers, cloudflare-d1, ...
- **react** (12 skills): react-hooks, react-state, ...
- **testing** (10 skills): jest, playwright, vitest

### Standalone Plugins (5 plugins, 5 skills)
- nextjs (1 skill)
- zod (1 skill)
- ...
```

### Phase 2: Backup

**CRITICAL: Always backup before migration!**

```bash
# Create backup of current structure
cp -r skills/ skills.backup/

# Verify backup
ls -la skills.backup/
```

### Phase 3: Create Plugin Structure

#### Step 3.1: Create Plugin Directories

```bash
# For grouped plugins
mkdir -p plugins/cloudflare/.claude-plugin
mkdir -p plugins/cloudflare/skills

mkdir -p plugins/react/.claude-plugin
mkdir -p plugins/react/skills

# For standalone plugins
mkdir -p plugins/nextjs/.claude-plugin
mkdir -p plugins/nextjs/skills
```

#### Step 3.2: Create Plugin Manifests

For each plugin, create `.claude-plugin/plugin.json`:

**Grouped Plugin Example** (plugins/cloudflare/.claude-plugin/plugin.json):
```json
{
  "name": "cloudflare",
  "description": "Complete Cloudflare platform: Workers, D1, R2, KV, and more. Use for serverless edge computing and Cloudflare deployments.",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "repository": "https://github.com/your/repo",
  "keywords": [
    "cloudflare",
    "workers",
    "edge",
    "serverless",
    "d1",
    "r2",
    "kv"
  ]
}
```

**Standalone Plugin Example** (plugins/nextjs/.claude-plugin/plugin.json):
```json
{
  "name": "nextjs",
  "description": "Next.js framework development with App Router, Server Components, and deployment.",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "repository": "https://github.com/your/repo",
  "keywords": ["nextjs", "react", "ssr"]
}
```

### Phase 4: Migrate Skills

#### Step 4.1: Copy Skills to Plugins

```bash
# For grouped plugins - copy multiple skills
cp -r skills/cloudflare-workers plugins/cloudflare/skills/
cp -r skills/cloudflare-d1 plugins/cloudflare/skills/
cp -r skills/cloudflare-r2 plugins/cloudflare/skills/

# For standalone plugins - copy single skill
cp -r skills/nextjs plugins/nextjs/skills/
```

#### Step 4.2: Verify Skill Structure

Each skill should now be at:
```
plugins/cloudflare/skills/cloudflare-workers/SKILL.md  ✅
plugins/cloudflare/skills/cloudflare-d1/SKILL.md       ✅
plugins/nextjs/skills/nextjs/SKILL.md                  ✅
```

Not at:
```
plugins/cloudflare/SKILL.md                            ❌
plugins/cloudflare/cloudflare-workers.md               ❌
```

### Phase 5: Update Marketplace/Registry

If you have a marketplace.json or similar registry:

**OLD (skill-based):**
```json
{
  "plugins": [
    {
      "name": "cloudflare-workers",
      "source": "./skills/cloudflare-workers",
      ...
    },
    {
      "name": "cloudflare-d1",
      "source": "./skills/cloudflare-d1",
      ...
    }
  ]
}
```

**NEW (plugin-based):**
```json
{
  "plugins": [
    {
      "name": "cloudflare",
      "source": "./plugins/cloudflare",
      "description": "Complete Cloudflare platform...",
      "keywords": ["cloudflare", "workers", "edge"]
    },
    {
      "name": "nextjs",
      "source": "./plugins/nextjs",
      "description": "Next.js framework...",
      "keywords": ["nextjs", "react"]
    }
  ]
}
```

### Phase 6: Update Documentation

Update these files:
- **README.md**: Installation instructions
- **Documentation**: Directory structure diagrams
- **Contributing guides**: Template structure

Example changes:
```markdown
<!-- OLD -->
Install individual skills:
```bash
./scripts/install-skill.sh cloudflare-workers
```

<!-- NEW -->
Install plugins (contains multiple related skills):
```bash
claude code plugin install ./plugins/cloudflare
```
```

---

## Validation Steps

### Automated Validation Script

Create `validate-structure.sh`:

```bash
#!/bin/bash

echo "=== Plugin Structure Validation ==="
echo ""

# Count plugins
plugin_count=$(ls -1 plugins/ 2>/dev/null | wc -l)
echo "1. Plugin directories: $plugin_count"

# Count plugin manifests
manifest_count=$(find plugins -maxdepth 2 -path "*/.claude-plugin/plugin.json" 2>/dev/null | wc -l)
echo "2. Plugin manifests: $manifest_count"
[ "$manifest_count" -eq "$plugin_count" ] && echo "   ✅ PASS" || echo "   ❌ FAIL"

# Count SKILL.md files
skill_count=$(find plugins -name "SKILL.md" 2>/dev/null | wc -l)
echo "3. Total skills: $skill_count"

# Check structure samples
echo "4. Structure validation:"
for plugin in plugins/*/; do
  plugin_name=$(basename "$plugin")

  # Check plugin manifest
  if [ ! -f "$plugin/.claude-plugin/plugin.json" ]; then
    echo "   ❌ $plugin_name: Missing plugin manifest"
    continue
  fi

  # Check skills directory
  if [ ! -d "$plugin/skills" ]; then
    echo "   ❌ $plugin_name: Missing skills/ directory"
    continue
  fi

  # Check at least one skill exists
  skill_count=$(find "$plugin/skills" -name "SKILL.md" 2>/dev/null | wc -l)
  if [ "$skill_count" -eq 0 ]; then
    echo "   ❌ $plugin_name: No skills found"
    continue
  fi

  echo "   ✅ $plugin_name: $skill_count skill(s)"
done

echo ""
echo "=== Validation Complete ==="
```

### Manual Checks

#### Check 1: Plugin Manifest
```bash
cat plugins/cloudflare/.claude-plugin/plugin.json
# Should have: name, description, version
```

#### Check 2: Skills Directory
```bash
ls -la plugins/cloudflare/
# Should show: .claude-plugin/ and skills/ directories
```

#### Check 3: Skill Files
```bash
find plugins/cloudflare/skills -name "SKILL.md"
# Should show all skill SKILL.md files
```

#### Check 4: Test Installation

```bash
# Install plugin locally
claude code plugin install ./plugins/cloudflare

# Check if visible
# Ask Claude: "What skills do you see in your system prompt?"
# Should now include your cloudflare skills
```

---

## Rollback Plan

If issues arise during migration:

### Quick Rollback

```bash
# 1. Remove new structure
rm -rf plugins/

# 2. Restore backup
mv skills.backup/ skills/

# 3. Regenerate old marketplace (if applicable)
./scripts/generate-old-marketplace.sh
```

### Partial Rollback

If some plugins work but others don't:

```bash
# Keep working plugins
mv plugins/cloudflare plugins/cloudflare.working

# Restore non-working from backup
cp -r skills.backup/nextjs-skill plugins/nextjs/skills/

# Fix and retry
```

---

## Best Practices

### 1. Naming Conventions

**Plugin Names:**
- Use lowercase with hyphens: `cloudflare-tools`, `react-patterns`
- Be descriptive: `api-development` not just `api`
- Group related: `cloudflare` for all Cloudflare skills

**Skill Names:**
- Can keep original names within plugin
- Example: `plugins/cloudflare/skills/cloudflare-workers/`

### 2. Plugin Grouping Strategy

**Group When:**
- Skills share technology (all React, all Cloudflare)
- Skills share purpose (all testing, all API)
- Skills are commonly used together
- You have 20+ skills total

**Keep Standalone When:**
- Skill is completely unique
- Skill is a major framework (Next.js, Nuxt)
- Skill is frequently updated independently

### 3. Manifest Best Practices

**Plugin-level manifest:**
- ✅ Aggregate keywords from all skills
- ✅ Write description covering all skills in plugin
- ✅ Keep description under 200 characters (system prompt budget)
- ✅ List main technologies/use cases

**Example:**
```json
{
  "name": "cloudflare",
  "description": "Cloudflare platform: Workers, D1, R2, KV, Queues, AI. Use for edge computing and serverless.",
  "keywords": [
    "cloudflare", "workers", "edge", "serverless",
    "d1", "r2", "kv", "queues", "ai"
  ]
}
```

### 4. Migration Testing Checklist

Before committing:
- [ ] Backup created and verified
- [ ] All plugins have `.claude-plugin/plugin.json`
- [ ] All plugins have `skills/` directory
- [ ] All SKILL.md files in `skills/{skill-name}/SKILL.md`
- [ ] Marketplace/registry updated
- [ ] Test installation of 2-3 plugins
- [ ] Verify skills appear in Claude's system prompt
- [ ] Documentation updated

### 5. Documentation Updates

Update these after migration:
- Installation instructions
- Directory structure diagrams
- Contributing guidelines
- Scripts (may need redesign for plugins)
- README badges/stats (plugin count vs skill count)

### 6. Git Commit Strategy

**Recommended: Single migration commit**

```bash
git add plugins/ skills.backup/ .marketplace.json
git commit -m "feat: Restructure to official plugin architecture

Migrate N skills to M plugins following Anthropic standards.

- NEW: plugins/ directory with M plugin structures
- NEW: skills.backup/ preserving original
- UPDATED: marketplace.json (M plugins vs N skills)

Plugins:
- grouped-plugin-1 (X skills)
- grouped-plugin-2 (Y skills)
- standalone-1, standalone-2, ...

Benefits:
- Matches official plugin structure
- Skills now discoverable by Claude Code
- Better organization and maintenance

Testing: Validated structure, tested installations
"
```

### 7. System Prompt Budget Awareness

**Problem**: Claude Code has a 15,000 character budget for skill descriptions in system prompt.

**Solution**:
- Keep plugin descriptions concise (<200 chars)
- With fewer plugins, more fit in budget
- Grouped plugins reduce total descriptions

**Example**:
- Before: 100 skills × 150 chars = 15,000 chars (at limit!)
- After: 20 plugins × 150 chars = 3,000 chars (plenty of room)

---

## Troubleshooting

### Skills Still Not Visible After Migration

**Check 1: Structure**
```bash
# Correct structure?
ls plugins/my-plugin/skills/my-skill/SKILL.md
# Should exist
```

**Check 2: Manifest**
```bash
# Valid JSON?
jq '.' plugins/my-plugin/.claude-plugin/plugin.json
```

**Check 3: Installation**
```bash
# Properly installed?
ls ~/.claude/plugins/cache/
# Should show your plugin

# Check installed_plugins.json
cat ~/.claude/plugins/installed_plugins.json
```

**Check 4: YAML Frontmatter**
```bash
# Valid frontmatter in SKILL.md?
head -20 plugins/my-plugin/skills/my-skill/SKILL.md
# Should have:
# ---
# name: skill-name
# description: ...
# ---
```

### Plugin Installs But Skills Don't Load

**Symptom**: Plugin appears in installed_plugins.json but skills not in system prompt.

**Fix**: Ensure skills/ subdirectory exists and is named exactly `skills` (lowercase, plural):
```bash
mv plugins/my-plugin/skill plugins/my-plugin/skills    # Fix typo
mv plugins/my-plugin/Skills plugins/my-plugin/skills   # Fix case
```

### Marketplace Not Finding Plugins

**Symptom**: Marketplace command doesn't list your plugins.

**Fix**: Update marketplace.json source paths from `./skills/` to `./plugins/`:
```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "source": "./plugins/my-plugin"  // ← Must point to plugin root
    }
  ]
}
```

---

## Example: Complete Migration

### Before (Broken Structure)

```
my-repo/
├── skills/
│   ├── cloudflare-workers/
│   │   ├── .claude-plugin/plugin.json
│   │   └── SKILL.md              ← Wrong location!
│   ├── cloudflare-d1/
│   │   ├── .claude-plugin/plugin.json
│   │   └── SKILL.md              ← Wrong location!
│   └── nextjs/
│       ├── .claude-plugin/plugin.json
│       └── SKILL.md              ← Wrong location!
└── marketplace.json
```

### After (Correct Structure)

```
my-repo/
├── plugins/
│   ├── cloudflare/                     # Grouped plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json            # Plugin manifest
│   │   └── skills/
│   │       ├── cloudflare-workers/
│   │       │   └── SKILL.md           ✅ Correct!
│   │       └── cloudflare-d1/
│   │           └── SKILL.md           ✅ Correct!
│   └── nextjs/                         # Standalone plugin
│       ├── .claude-plugin/
│       │   └── plugin.json            # Plugin manifest
│       └── skills/
│           └── nextjs/
│               └── SKILL.md           ✅ Correct!
├── skills.backup/                      # Backup of original
└── marketplace.json                    # Updated paths
```

### Migration Commands

```bash
# 1. Backup
cp -r skills/ skills.backup/

# 2. Create plugin structures
mkdir -p plugins/cloudflare/.claude-plugin
mkdir -p plugins/cloudflare/skills
mkdir -p plugins/nextjs/.claude-plugin
mkdir -p plugins/nextjs/skills

# 3. Create plugin manifests
cat > plugins/cloudflare/.claude-plugin/plugin.json << 'EOF'
{
  "name": "cloudflare",
  "description": "Cloudflare platform: Workers and D1 database",
  "version": "1.0.0",
  "keywords": ["cloudflare", "workers", "d1"]
}
EOF

cat > plugins/nextjs/.claude-plugin/plugin.json << 'EOF'
{
  "name": "nextjs",
  "description": "Next.js framework development",
  "version": "1.0.0",
  "keywords": ["nextjs", "react"]
}
EOF

# 4. Copy skills
cp -r skills/cloudflare-workers plugins/cloudflare/skills/
cp -r skills/cloudflare-d1 plugins/cloudflare/skills/
cp -r skills/nextjs plugins/nextjs/skills/

# 5. Validate
./validate-structure.sh

# 6. Test
claude code plugin install ./plugins/cloudflare
# Ask Claude: "What skills do you see?"

# 7. Commit
git add plugins/ skills.backup/ marketplace.json
git commit -m "feat: Restructure to official plugin architecture"
```

---

## Summary

**The Fix**: Move skills from plugin root into `skills/` subdirectory.

**Key Pattern**:
```
✅ plugin-name/skills/skill-name/SKILL.md
❌ skill-name/SKILL.md
```

**Benefits**:
- Skills discoverable by Claude Code
- Follows official Anthropic standards
- Better organization
- Reduced system prompt usage

**Safety**: Always backup first, validate structure, test before committing.

---

## Additional Resources

- **Official Standards**: https://github.com/anthropics/claude-plugins-official
- **Plugin Dev Skill**: Use `plugin-dev:plugin-structure` skill for detailed structure guidance
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code/plugins

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Applies To**: Claude Code CLI plugin system
