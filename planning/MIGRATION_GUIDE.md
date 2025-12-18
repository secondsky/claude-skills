# Migration Guide: v1.x → v2.0.0

**Date**: 2025-12-18
**Type**: BREAKING CHANGE
**Impact**: All marketplace installations
**Status**: Required for skill discovery

---

## TL;DR

**What Changed**:
Skills are now grouped into **18 suite plugins** instead of 169 individual plugins.

**Why It Matters**:
- ✅ Skills are now **discoverable** by Claude Code
- ✅ **Anthropic-compliant** plugin format
- ✅ Easier installation (18 commands vs 169)

**Migration Time**: ~5-10 minutes

---

## What Happened?

### The Problem (v1.x)

In v1.x, the marketplace.json contained 169 individual plugins:

```json
{
  "plugins": [
    {
      "name": "cloudflare-worker-base",
      "source": "./skills/cloudflare-worker-base",
      "description": "...",
      "version": "1.0.0"
    },
    {
      "name": "zod",
      "source": "./skills/zod",
      "description": "...",
      "version": "1.0.0"
    }
    ... (169 individual entries)
  ]
}
```

**Result**: Claude Code **could not discover these skills**. They were installed but invisible to Claude.

### The Solution (v2.0)

In v2.0, skills are grouped into suite plugins with `skills` arrays:

```json
{
  "plugins": [
    {
      "name": "cloudflare-skills",
      "description": "Complete Cloudflare platform skills...",
      "source": "./",
      "skills": [
        "./skills/cloudflare-worker-base",
        "./skills/cloudflare-d1",
        "./skills/cloudflare-r2",
        ...
      ]
    },
    {
      "name": "tooling-skills",
      "description": "Development tools and utilities...",
      "source": "./",
      "skills": [
        "./skills/zod",
        "./skills/typescript-mcp",
        ...
      ]
    }
    ... (18 suite plugins total)
  ]
}
```

**Result**: Claude Code **now discovers all skills properly**. They appear in system prompts and trigger automatically.

---

## Why This Change?

### 1. Upstream Fix

Our fork is based on `jezweb/claude-skills`. They fixed this issue in commit `43de3d3`:
- https://github.com/jezweb/claude-skills/commit/43de3d3aeede64ade242a9de6568a860ba455c24

We adapted their fix for our 169 skills (they had 90).

### 2. Anthropic Plugin Specification

The suite plugin format with `skills` arrays is the **official Anthropic specification**:
- See: https://github.com/anthropics/skills

Claude Code only discovers skills in this format or via direct symlinks in `~/.claude/skills/`.

### 3. Better Organization

Logical grouping makes it easier to:
- Find related skills
- Install by domain (e.g., all Cloudflare skills)
- Understand the skill catalog
- Maintain and update skills

---

## Who Is Affected?

### ✅ You ARE affected if:

- You installed skills from the claude-skills marketplace (v1.x)
- You use `/plugin install` commands
- You have 90 individual plugins installed from `@claude-skills`

### ❌ You are NOT affected if:

- You manually symlinked skills to `~/.claude/skills/` (this still works)
- You never installed from the marketplace
- You're a new user (just follow the new installation)

---

## Migration Steps

### Step 1: Backup Current Installation (Optional)

```bash
# Backup your settings (optional)
cp ~/.claude/settings.json ~/.claude/settings.json.backup-$(date +%Y%m%d)

# Backup installed plugins list (optional)
cp ~/.claude/plugins/installed_plugins.json ~/.claude/plugins/installed_plugins.json.backup-$(date +%Y%m%d)
```

### Step 2: Check Current Installations

```bash
/plugin list
```

Look for skills with `@claude-skills` suffix. Examples:
- `cloudflare-worker-base@claude-skills`
- `zod@claude-skills`
- `tailwind-v4-shadcn@claude-skills`

### Step 3: Uninstall Old Individual Plugins

You have two options:

**Option A: Uninstall all at once** (if you installed many)

```bash
# This will uninstall all individual plugins from claude-skills
# Run in bash (not in Claude Code)
for plugin in $(jq -r 'keys[]' ~/.claude/plugins/installed_plugins.json | grep '@claude-skills'); do
  echo "Uninstalling $plugin..."
  # Manual uninstall or via Claude Code: /plugin uninstall $plugin
done
```

**Option B: Uninstall individually**

```bash
/plugin uninstall cloudflare-worker-base@claude-skills
/plugin uninstall zod@claude-skills
/plugin uninstall tailwind-v4-shadcn@claude-skills
# ... repeat for each skill you installed
```

### Step 4: Update Marketplace (If Already Added)

If you previously added the marketplace:

```bash
/plugin marketplace update claude-skills
```

Or remove and re-add:

```bash
/plugin marketplace remove claude-skills
/plugin marketplace add https://github.com/secondsky/claude-skills
```

### Step 5: Install New Suite Plugins

Install the suites that match your old installations:

```bash
# If you had Cloudflare skills installed:
/plugin install cloudflare-skills@claude-skills

# If you had AI/ML skills installed:
/plugin install ai-skills@claude-skills

# If you had frontend skills installed:
/plugin install frontend-skills@claude-skills

# If you had tooling skills (typescript, zod, etc):
/plugin install tooling-skills@claude-skills

# See MARKETPLACE.md for complete list of 18 suite plugins
```

**Recommended**: Install all suites for full coverage:

```bash
/plugin install cloudflare-skills@claude-skills
/plugin install ai-skills@claude-skills
/plugin install frontend-skills@claude-skills
/plugin install api-skills@claude-skills
/plugin install database-skills@claude-skills
/plugin install testing-skills@claude-skills
/plugin install tooling-skills@claude-skills
/plugin install auth-skills@claude-skills
/plugin install cms-skills@claude-skills
/plugin install web-skills@claude-skills
/plugin install mobile-skills@claude-skills
/plugin install security-skills@claude-skills
/plugin install architecture-skills@claude-skills
/plugin install design-skills@claude-skills
/plugin install data-skills@claude-skills
/plugin install seo-skills@claude-skills
/plugin install woocommerce-skills@claude-skills
/plugin install documentation-skills@claude-skills
```

### Step 6: Verify Installation

```bash
/plugin list
```

You should now see:
- Skills with plugin prefix: `cloudflare-skills:cloudflare-worker-base`
- Skills grouped by suite: `tooling-skills:zod`
- All installed suites listed

### Step 7: Test Skill Discovery

Try using a skill:

```
User: "Set up a Cloudflare Worker with Hono"
Claude: [Should automatically discover and use cloudflare-skills:cloudflare-worker-base]
```

---

## Mapping: Old → New

### Which Suite Plugin Do I Need?

| Old Individual Skill | New Suite Plugin | Install Command |
|---------------------|------------------|-----------------|
| cloudflare-worker-base | cloudflare-skills | `/plugin install cloudflare-skills@claude-skills` |
| cloudflare-d1 | cloudflare-skills | `/plugin install cloudflare-skills@claude-skills` |
| openai-api | ai-skills | `/plugin install ai-skills@claude-skills` |
| google-gemini-api | ai-skills | `/plugin install ai-skills@claude-skills` |
| tailwind-v4-shadcn | frontend-skills | `/plugin install frontend-skills@claude-skills` |
| nextjs | frontend-skills | `/plugin install frontend-skills@claude-skills` |
| zod | tooling-skills | `/plugin install tooling-skills@claude-skills` |
| typescript-mcp | tooling-skills | `/plugin install tooling-skills@claude-skills` |
| drizzle-orm-d1 | database-skills | `/plugin install database-skills@claude-skills` |
| better-auth | auth-skills | `/plugin install auth-skills@claude-skills` |

**Full mapping**: See `planning/SKILL_CATEGORIZATION.md` for complete list of 169 skills.

---

## What's Different After Migration?

### Skill Names

**Before (v1.x)**:
- `cloudflare-worker-base`
- `zod`

**After (v2.0)**:
- `cloudflare-skills:cloudflare-worker-base`
- `tooling-skills:zod`

Skills now have a **plugin prefix** to indicate which suite they belong to.

### Installation

**Before (v1.x)**:
```bash
/plugin install cloudflare-worker-base@claude-skills  # Individual skill
/plugin install zod@claude-skills                      # Individual skill
```

**After (v2.0)**:
```bash
/plugin install cloudflare-skills@claude-skills  # Gets ALL 23 Cloudflare skills
/plugin install tooling-skills@claude-skills     # Gets ALL 26 tooling skills
```

You install **suites**, which contain **multiple skills**.

### Discovery

**Before (v1.x)**:
- ❌ Skills installed but NOT visible to Claude
- ❌ Skills did NOT appear in system prompts
- ❌ Skills did NOT trigger automatically

**After (v2.0)**:
- ✅ Skills properly discovered by Claude Code
- ✅ Skills appear in system prompts when relevant
- ✅ Skills trigger automatically based on user queries

---

## Troubleshooting

### Issue: "Plugin not found"

```
Error: Plugin cloudflare-worker-base@claude-skills not found
```

**Solution**: You're using the old installation format. Use suite plugins:
```bash
/plugin install cloudflare-skills@claude-skills
```

### Issue: "Marketplace not updated"

**Solution**: Update or re-add the marketplace:
```bash
/plugin marketplace update claude-skills
# OR
/plugin marketplace remove claude-skills
/plugin marketplace add https://github.com/secondsky/claude-skills
```

### Issue: "Skills still not discovered"

**Checklist**:
1. Verify suite plugins are installed: `/plugin list`
2. Check you're using v2.0 marketplace: `/plugin marketplace list`
3. Restart Claude Code (if needed)
4. Check skills appear with plugin prefix (e.g., `cloudflare-skills:cloudflare-d1`)

### Issue: "I want to uninstall a single skill"

**Answer**: Suite plugins install all skills together. You cannot uninstall individual skills from a suite.

**Workaround**: Uninstall the entire suite:
```bash
/plugin uninstall cloudflare-skills@claude-skills
```

If you only need specific skills, consider using manual symlinks instead:
```bash
git clone https://github.com/secondsky/claude-skills.git
cd claude-skills
./scripts/install-skill.sh cloudflare-worker-base
```

---

## For Contributors

If you're contributing to the repository:

### Generating Marketplace

The new script automatically categorizes skills:

```bash
./scripts/generate-marketplace.sh
```

This will:
1. Categorize all 169 skills into 18 suites
2. Generate `.claude-plugin/marketplace.json`
3. Validate JSON structure

### Adding New Skills

When adding a new skill:

1. Create skill directory in `skills/`
2. Add SKILL.md and README.md
3. Run `./scripts/generate-marketplace.sh`
4. Commit both the skill and updated marketplace.json

The script will automatically categorize the skill based on its name:
- `cloudflare-*` → cloudflare-skills
- `api-*` → api-skills
- `openai-*`, `google-gemini-*` → ai-skills
- etc.

### Changing Categorization

Edit `scripts/generate-marketplace.sh` → `categorize_skill()` function:

```bash
categorize_skill() {
  local skill_name="$1"

  if [[ "$skill_name" =~ ^cloudflare- ]]; then
    echo "cloudflare-skills"
  elif [[ "$skill_name" =~ ^new-pattern- ]]; then
    echo "new-suite-skills"
  ...
}
```

---

## References

- **Upstream fix**: https://github.com/jezweb/claude-skills/commit/43de3d3
- **Anthropic skills spec**: https://github.com/anthropics/skills
- **Our categorization**: `planning/SKILL_CATEGORIZATION.md`
- **Marketplace doc**: `MARKETPLACE.md`

---

## Questions?

**Issues**: https://github.com/secondsky/claude-skills/issues
**Email**: maintainers@example.com

---

**Last Updated**: 2025-12-18
**Migration Guide Version**: 1.0.0
**Target**: claude-skills v2.0.0
