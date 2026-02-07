# Claude Skills Repository: Plugin Development Best Practices

**Last Updated**: 2025-12-28
**Version**: 3.0.0
**Target Audience**: Plugin developers contributing to the claude-skills collection

---

## Table of Contents

1. [Background & Rationale](#background--rationale)
2. [Prerequisites (CRITICAL)](#prerequisites-critical)
3. [Marketplace Management](#marketplace-management)
4. [System Prompt Budget Optimization](#system-prompt-budget-optimization)
5. [Quality Assurance at Scale](#quality-assurance-at-scale)
6. [Repository-Specific Workflows](#repository-specific-workflows)
7. [Production Quality Standards](#production-quality-standards)
8. [Integration with Official Plugin-Dev](#integration-with-official-plugin-dev)

---

## Background & Rationale

### Why This Document Exists

After analyzing the official Anthropic `plugin-dev` plugin and our repository's documentation needs, we identified a clear division of responsibilities:

✅ **Official plugin-dev provides**: Comprehensive plugin fundamentals (7 skills, 3 agents, 21k+ words)
✅ **This document provides**: Repository-specific gaps not covered by official plugin-dev

**Recommendation**: Install official `plugin-dev@claude-code-marketplace` as your primary resource, then use this document for claude-skills repository-specific workflows.

---

### What Official Plugin-Dev Covers

The official plugin provides **7 comprehensive skills** with ~21,000+ words of production-tested guidance:

| Skill | Coverage | When to Use |
|-------|----------|-------------|
| **hook-development** | Prompt-based hooks, command hooks, all events, validation | Creating PreToolUse/PostToolUse hooks, blocking dangerous operations |
| **mcp-integration** | Server types (stdio/SSE/HTTP/WS), auth, env vars, tool usage | Adding MCP servers, OAuth configuration, WebSocket connections |
| **plugin-structure** | Directory layout, plugin.json, auto-discovery, components | Organizing plugins, configuring manifests, file naming |
| **plugin-settings** | .local.md pattern, YAML frontmatter parsing, flag files | User-configurable plugins, per-project settings |
| **command-development** | Slash commands, frontmatter, arguments, bash execution | Creating /custom-command with arguments and file references |
| **agent-development** | Agent structure, frontmatter, system prompts, AI-assisted generation | Creating autonomous agents with triggers and tools |
| **skill-development** | SKILL.md structure, progressive disclosure, trigger descriptions | Writing skills with strong auto-discovery |

**Plus**:
- `/plugin-dev:create-plugin` command (8-phase guided workflow)
- 3 agents: agent-creator, plugin-validator
- 10 utility scripts for validation
- 21 reference docs (~11k words)
- 9 working examples

**Total**: ~21,000+ words of comprehensive, production-tested guidance

---

### What We Document (Repository-Specific Gaps)

This repository has **5 critical gaps** not covered by official plugin-dev:

| Gap | Why It's Unique to Us | Where Documented |
|-----|----------------------|------------------|
| **1. Marketplace Management** | Managing 169 skills across 58 plugins with automated category detection and keyword generation | [Section 3](#marketplace-management), [MARKETPLACE_MANAGEMENT.md](MARKETPLACE_MANAGEMENT.md) |
| **2. System Prompt Budget** | Critical 15k char limit causing silent skill omission (production issue) | [Section 4](#system-prompt-budget-optimization) |
| **3. Batch Operations** | Quality workflows for large skill collections (169 skills) | [Section 5](#quality-assurance-at-scale) |
| **4. Repository Workflows** | Installation scripts, version sync, git standards for claude-skills | [Section 6](#repository-specific-workflows) |
| **5. Production Quality at Scale** | Testing evidence requirements, package verification for 169 skills | [Section 7](#production-quality-standards) |

---

### Official vs Repository: Responsibility Matrix

| Area | Official Plugin-Dev | This Document |
|------|-------------------|---------------|
| **Plugin fundamentals** (structure, manifest) | ✅ PRIMARY | Reference only |
| **Hooks** (PreToolUse, PostToolUse, events) | ✅ PRIMARY | Reference only |
| **MCP integration** (stdio, SSE, OAuth) | ✅ PRIMARY | Reference only |
| **Agents** (creation, triggers, tools) | ✅ PRIMARY | Reference only |
| **Commands** (slash commands, arguments) | ✅ PRIMARY | Reference only |
| **Skills** (writing, triggers, discovery) | ✅ PRIMARY | Reference only |
| | | |
| **Marketplace management** (169 skills) | ❌ | ✅ PRIMARY |
| **System prompt budget** (15k char limit) | ❌ | ✅ PRIMARY |
| **Batch operations** (quality workflows) | ❌ | ✅ PRIMARY |
| **Repository workflows** (install, sync) | ❌ | ✅ PRIMARY |
| **Description optimization** (token limits) | ❌ | ✅ PRIMARY |

---

### Critical Knowledge We Preserve

**MUST document in our best practices** (not in official plugin-dev):

1. ✅ System prompt budget (15,000 char limit)
2. ✅ Silent skill omission issue (no warnings when exceeded)
3. ✅ Description optimization (under 100 chars ideal)
4. ✅ Marketplace.json generation and structure
5. ✅ Category system (18 categories with auto-detection)
6. ✅ Keyword generation (3 sources: name, category, description)
7. ✅ Version synchronization (`sync-plugins.sh` for 169 skills)
8. ✅ Batch skill operations and quality workflows
9. ✅ Progressive disclosure optimization workflow
10. ✅ Repository-specific git workflow (secondsky vs jezweb)

**NOT needed** (covered by official plugin-dev):

1. ❌ Hook development basics
2. ❌ MCP integration basics
3. ❌ Agent creation basics
4. ❌ Command development basics
5. ❌ Plugin manifest basics
6. ❌ Skill structure basics
7. ❌ YAML frontmatter basics

---

### Key Principle: Don't Duplicate What Anthropic Maintains

**Our value-add is**:
- Repository-specific workflows (marketplace, installation, versioning)
- Production insights (system prompt budget, silent omission)
- Scale management (169 skills, batch operations, quality workflows)

**We defer to official plugin-dev for**:
- Plugin fundamentals (structure, manifest, components)
- Advanced features (hooks, MCP, agents, commands)
- Core skill writing guidance (triggers, discovery, progressive disclosure)

**Rule**: If plugin-dev covers it, use plugin-dev. If it's repository-specific to claude-skills, use this doc.

---

## Prerequisites (CRITICAL)

### Install Official Plugin-Dev Toolkit (REQUIRED)

**BEFORE creating any plugins in this repository**, you MUST install the official plugin development toolkit:

```bash
/plugin install plugin-dev@claude-code-marketplace
```

### What Official Plugin-Dev Provides

The official plugin-dev plugin is your **primary resource** for all plugin fundamentals:

| Skill | Use When |
|-------|----------|
| **hook-development** | Creating hooks (PreToolUse, PostToolUse, etc.), validating operations |
| **mcp-integration** | Adding MCP servers (stdio, SSE, HTTP, WebSocket), OAuth, env vars |
| **plugin-structure** | Organizing plugin directories, configuring plugin.json manifest |
| **command-development** | Creating slash commands with frontmatter and arguments |
| **agent-development** | Creating autonomous agents with system prompts |
| **skill-development** | Writing skills with progressive disclosure and strong triggers |

**Plus**:
- `/plugin-dev:create-plugin` command (8-phase guided workflow)
- `agent-creator` agent (AI-assisted agent generation)
- `plugin-validator` agent (structure validation)

### What This Document Covers

This document focuses **ONLY on repository-specific gaps** not covered by official plugin-dev:

1. ✅ **Marketplace Management** - Managing 169 skills across 58 plugins (unique to this repo)
2. ✅ **System Prompt Budget** - Critical 15k character limit and optimization (production issue)
3. ✅ **Batch Operations** - Quality workflows for large skill collections (169 skills)
4. ✅ **Repository Workflows** - Installation, versioning, git standards (repo-specific)

**Rule**: If plugin-dev covers it, use plugin-dev. If it's repository-specific, use this doc.

### Quick Decision Tree

```
I want to →
├─ Create plugin structure → Use: /plugin-dev:create-plugin
├─ Add hooks → Use: hook-development skill
├─ Add MCP server → Use: mcp-integration skill
├─ Create agent → Use: agent-creator agent
├─ Create command → Use: command-development skill
├─ Write skill → Use: skill-development skill
│
├─ Manage marketplace → THIS DOC: Section 2
├─ Optimize descriptions → THIS DOC: Section 3
├─ Batch review skills → THIS DOC: Section 4
└─ Install/version skills → THIS DOC: Section 5
```

---

## Marketplace Management

### Overview

The claude-skills repository maintains a **marketplace registry** that allows Claude Code to discover and use production-ready skills. With 169 skills organized into 58 plugins, proper marketplace management is critical.

**Key Components**:
- **marketplace.json** - Central registry listing all 169 skills
- **plugin.json** - Individual plugin metadata (one per skill)
- **Category system** - 18 categories with auto-detection
- **Keyword generation** - Automated from 3 sources
- **Version synchronization** - Global version across all plugins

For comprehensive technical details, see [MARKETPLACE_MANAGEMENT.md](MARKETPLACE_MANAGEMENT.md).

### Primary Script: sync-plugins.sh

**Single entry point for all plugin management.**

```bash
# Full sync - updates all plugin.json files and regenerates marketplace.json
./scripts/sync-plugins.sh

# Preview changes without modifying files
./scripts/sync-plugins.sh --dry-run

# Show help
./scripts/sync-plugins.sh --help
```

**What it does**:
1. Reads global version from marketplace.json metadata
2. Syncs version to all 169 plugin.json files
3. Auto-detects category based on skill name patterns
4. Scans agents/ and commands/ directories → adds to plugin.json
5. Generates keywords from name + category + description
6. Regenerates marketplace.json with updated metadata

**When to run**:
- After adding new skills
- After modifying skill descriptions
- After adding agents/commands to a skill
- Before releases or PRs

### Category System (18 Categories)

Skills are auto-categorized based on name patterns:

| Category | Pattern Match | Examples |
|----------|---------------|----------|
| `cloudflare` | `^cloudflare-` | cloudflare-d1, cloudflare-workers-ai |
| `ai` | `^(ai-\|openai-\|claude-\|google-gemini-)` | ai-sdk-core, openai-agents |
| `frontend` | `^(nextjs\|nuxt-\|react-\|tanstack-)` | nuxt-v4, tailwind-v4-shadcn |
| `auth` | `^(better-auth)` | better-auth |
| `database` | `^(database-\|drizzle-\|neon-\|vercel-)` | drizzle-orm-d1, vercel-kv |
| `api` | `^(api-\|graphql-\|rest-api-)` | api-design-principles |
| `testing` | `^(jest-\|mutation-\|playwright-\|vitest-)` | vitest-testing |
| `mobile` | `^(app-store-\|mobile-\|react-native-\|swift-)` | swift-best-practices |
| `tooling` | Default fallback | turborepo, code-review |

**Distribution** (Current):
- tooling: 28 skills
- cloudflare: 23 skills
- frontend: 21 skills
- ai: 20 skills
- (see MARKETPLACE_MANAGEMENT.md for complete list)

### Keyword Generation (3 Sources)

Keywords are auto-generated from:

1. **Name keywords**: Split skill name by `-` (e.g., `cloudflare-d1` → `["cloudflare-d1", "cloudflare"]`)
2. **Category keywords**: Domain-specific terms (e.g., `cloudflare` → `["workers", "edge", "serverless"]`)
3. **Description keywords**: Technical terms extracted from description

**Best practices**:
- Let the system auto-generate (don't manually edit)
- Keep descriptions keyword-rich for better extraction
- Run sync-plugins.sh to regenerate after description changes

### Common Marketplace Operations

```bash
# Check marketplace plugin count
jq '.plugins | length' .claude-plugin/marketplace.json
# Expected: 169

# Verify all versions match
jq -r '.version' plugins/*/.claude-plugin/plugin.json | sort -u
# Expected: 3.0.0 (one version only)

# Category distribution
jq -r '.category' plugins/*/.claude-plugin/plugin.json | sort | uniq -c

# Find skills without categories (should be empty)
for f in plugins/*/.claude-plugin/plugin.json; do
  if ! jq -e '.category' "$f" > /dev/null 2>&1; then
    echo "Missing category: $f"
  fi
done
```

---

## System Prompt Budget Optimization

### The Critical 15,000 Character Limit

**⚠️ CRITICAL PRODUCTION ISSUE** - This is the #1 cause of skill discovery failures.

#### The Problem

Claude Code has a **15,000 character TOTAL budget** for ALL skill descriptions in the system prompt:

```
Total budget = 15,000 characters (for ALL skills combined)
```

**What happens when exceeded**:
- ❌ Skills are **silently omitted** from the system prompt
- ❌ **No warnings or errors** displayed
- ❌ Claude cannot see or use omitted skills (invisible)
- ❌ User has no idea why skills don't trigger

**With 169 skills**, this means:
```
15,000 chars ÷ 169 skills = ~88 chars per skill (average)
```

**Reality check**: If descriptions average >88 characters, skills WILL be silently dropped.

Source: [Claude Code Skills Not Triggering](https://blog.fsck.com/2025/12/17/claude-code-skills-not-triggering/)

### Description Optimization Strategy

#### Target Lengths

| Priority | Length | Use Case |
|----------|--------|----------|
| **Ideal** | Under 100 chars | Simple, focused skills |
| **Good** | 100-150 chars | Standard skills |
| **Maximum** | 150-200 chars | Complex skills only |
| **Danger Zone** | 200+ chars | Will cause omissions with 169 skills |

#### Optimization Techniques

**1. Remove articles** ("the", "a", "an"):
```yaml
# ❌ 143 chars - Too verbose
description: This skill helps you process and analyze Excel spreadsheets with advanced formatting and data validation capabilities for business reports

# ✅ 87 chars - Optimized
description: Processes Excel files with formatting and validation. Use for business reports.
```

**2. Use active, third-person voice**:
```yaml
# ❌ First person (wastes chars)
description: I can help you build Cloudflare Workers with Hono

# ✅ Third person (concise)
description: Builds Cloudflare Workers with Hono framework
```

**3. Focus on triggers, not features**:
```yaml
# ❌ Feature list (verbose)
description: Provides comprehensive knowledge for React Server Components, streaming, and async rendering patterns

# ✅ Trigger-based (concise)
description: React Server Components, streaming. Use when building RSC apps.
```

**4. Omit redundant context**:
```yaml
# ❌ Redundant (mentions "skill" twice)
description: This skill provides guidance on API design patterns for building RESTful services

# ✅ Direct (assumes it's a skill)
description: API design patterns for RESTful services
```

### Detection & Monitoring

**Check current budget usage**:
```bash
# Count total characters in all descriptions
jq -r '.plugins[].description' .claude-plugin/marketplace.json | \
  awk '{total += length} END {print "Total chars:", total, "/ 15000"}'

# Find longest descriptions (troublemakers)
jq -r '.plugins[] | "\(.name): \(.description | length) chars"' \
  .claude-plugin/marketplace.json | sort -t: -k2 -rn | head -20
```

**Example output**:
```
Total chars: 14,237 / 15000 (Good - 763 chars remaining)

cloudflare-durable-objects: 187 chars
better-auth: 176 chars
nextjs: 165 chars
```

**Warning signs**:
- ✅ **Under 12,000 chars**: Safe zone
- ⚠️ **12,000-14,000 chars**: Warning - optimize long descriptions
- 🚨 **14,000-15,000 chars**: Danger - skills likely being omitted
- ❌ **Over 15,000 chars**: Critical - skills definitely omitted

### Workaround: Increase Budget

**Temporary workaround** (until descriptions are optimized):

```bash
# Set environment variable before launching Claude Code
SLASH_COMMAND_TOOL_CHAR_BUDGET=30000 claude
```

This doubles the budget to 30,000 characters. **However**, this is a workaround, not a solution. Proper optimization is still required for:
- Performance (smaller system prompts load faster)
- Compatibility (future Claude Code versions may not respect this)
- Best practices (concise descriptions are better for discovery)

### Description Review Checklist

Before committing skill changes, verify:

- [ ] Description under 150 characters (ideal: under 100)
- [ ] Third-person active voice ("Builds...", not "I can help...")
- [ ] No articles ("the", "a", "an") unless necessary
- [ ] Trigger phrases included ("Use when...", "For...")
- [ ] Technical keywords present (for discovery)
- [ ] Run `sync-plugins.sh` to regenerate marketplace
- [ ] Check total budget: `jq -r '.plugins[].description' .claude-plugin/marketplace.json | awk '{total += length} END {print total}'`

---

## Quality Assurance at Scale

### Batch Review Workflows

With 169 skills, quality assurance requires systematic batch workflows, not individual reviews.

#### Automated Baseline Validation

**Status**: All 169 skills passed automated validation (2025-11-20)

```bash
# Run baseline validation
./scripts/baseline-audit-all.sh

# Check compliance
# - YAML frontmatter valid
# - Required fields present (name, description)
# - File structure correct
# - No syntax errors
```

**Result**: 100% pass rate (0 critical, 0 high, 0 medium issues)

#### Manual Review Process

**CRITICAL**: Manual review is REQUIRED for quality. Do NOT automate refactoring.

**Why manual**:
1. **Context-aware decisions** - Extracting content requires understanding what's essential
2. **Quality over speed** - 30min-2hrs per skill ensures quality
3. **Judgment required** - Only humans can determine "Quick Start" vs "Advanced Topics"
4. **Error prevention** - Automation can introduce subtle errors that break skills

**Process** (Use ONE_PAGE_CHECKLIST.md):
```bash
# Manual review for individual skill
# Check against: docs/getting-started/ONE_PAGE_CHECKLIST.md
# Verify with: ./scripts/check-versions.sh

# For batch reviews:
# 1. Review Tier 1 skills first (most critical)
# 2. Then Tier 2, Tier 3, etc.
# 3. Document research findings
```

**Time estimates**:
- Simple skill (under 300 lines): 30-60 minutes
- Standard skill (300-500 lines): 1-1.5 hours
- Complex skill (over 500 lines): 1.5-2 hours

#### Progressive Disclosure Optimization

**Goal**: Keep SKILL.md under 500 lines by extracting content to `references/` directory.

**Process** (Manual):
1. **Read entire SKILL.md** - Identify sections >100 lines
2. **Determine what stays** - Quick Start, Top 3-5 errors must stay in SKILL.md
3. **Extract to references/** - Move advanced/detailed content
4. **Update SKILL.md** - Replace with summary + pointer: "Load `references/advanced.md` when..."
5. **Add "When to Load References"** - Critical section for Claude to know what to load when
6. **Verify** - Read final SKILL.md, check <500 lines, test skill triggering

**Example extraction**:
```markdown
<!-- BEFORE (in SKILL.md) - 200 lines -->
## Advanced Configuration (200 lines)
Detailed steps for complex scenarios...
[massive wall of text]

<!-- AFTER (in SKILL.md) - 5 lines -->
## Advanced Configuration
Basic configuration for standard cases...

For complex scenarios: Load `references/advanced-configuration.md`
```

**Example "When to Load References" section**:
```markdown
## When to Load References

Load the following references only when user needs them:

- **references/advanced-configuration.md** - Complex multi-region setups, custom domains
- **references/troubleshooting.md** - Error resolution, debugging patterns
- **references/migration-guide.md** - Upgrading from v1 to v2

Otherwise, use core SKILL.md instructions for standard workflows.
```

### Compliance Verification

**Before committing any skill changes**:

```bash
# Quick checklist verification
# See ONE_PAGE_CHECKLIST.md for complete checklist

# Verify:
# 1. YAML frontmatter valid (name + description)
# 2. Description under 150 chars (ideally under 100)
# 3. SKILL.md under 500 lines
# 4. No [TODO:] markers remaining
# 5. Templates tested and working
# 6. References properly organized
```

---

## Repository-Specific Workflows

### Template-Based Skill Creation

**Standard workflow** (5 minutes):

```bash
# 1. Copy skill template
cp -r templates/skill-skeleton/ plugins/my-plugin/

# 2. Edit SKILL.md and README.md (fill TODOs)
# 3. Add resources (scripts/, references/, templates/)

# 4. Install locally for testing
./scripts/install-skill.sh my-plugin

# 5. Verify discovery
# Ask Claude Code to use the skill - does it trigger?

# 6. Sync marketplace
./scripts/sync-plugins.sh

# 7. Commit
git add plugins/my-plugin .claude-plugin/marketplace.json
git commit -m "Add my-plugin skill"
git push origin <branch>
```

**Alternative: Guided workflow**:
```bash
# Use official plugin-dev guided workflow
/plugin-dev:create-plugin

# Follow 8-phase process:
# 1. Discovery
# 2. Component Planning
# 3. Detailed Design
# 4. Structure Creation
# 5. Component Implementation
# 6. Validation
# 7. Testing
# 8. Documentation
```

### Local Installation

**Install individual skill**:
```bash
./scripts/install-skill.sh my-plugin

# Verify
ls -la ~/.claude/skills/my-plugin
```

**Install all 169 skills**:
```bash
./scripts/install-all.sh

# Takes ~2-3 minutes
# Creates symlinks to ~/.claude/skills/
```

**Uninstall**:
```bash
# Remove symlink
rm ~/.claude/skills/my-plugin
```

### Version Management

**Global version** (applies to all 169 skills):

```bash
# 1. Update version in marketplace.json metadata
jq '.metadata.version = "4.0.0"' .claude-plugin/marketplace.json > tmp.json
mv tmp.json .claude-plugin/marketplace.json

# 2. Run sync to propagate to all plugins
./scripts/sync-plugins.sh

# 3. Verify
jq -r '.version' plugins/*/.claude-plugin/plugin.json | sort -u
# Should show: 4.0.0 (one version only)

# 4. Commit
git add .
git commit -m "Bump version to 4.0.0"
```

**Package version checking**:
```bash
# Verify package versions in skill are current
./scripts/check-versions.sh plugins/my-plugin/

# Check specific package
npm view <package-name> version
```

### Git Workflow Standards

**Branch naming**:
```bash
# New skill
git checkout -b add-my-plugin-skill

# Enhancement
git checkout -b enhance-cloudflare-d1

# Fix
git checkout -b fix-tailwind-v4-description
```

**Commit messages**:
```bash
# Add skill
git commit -m "Add my-plugin skill for [use case]

- Provides [feature]
- Errors prevented: X
- Package versions: <key-package>@X.Y.Z

Production tested: [evidence]"

# Update skill
git commit -m "Optimize cloudflare-d1 description length

- Reduced from 187 to 95 characters
- Maintains trigger phrases
- Improves system prompt budget"

# Sync marketplace
git commit -m "Sync marketplace metadata

- Updated global version to 3.0.0
- Regenerated keywords for 5 skills
- Added categories for 3 new skills"
```

**PR creation** (ALWAYS use secondsky repo):
```bash
# Create PR to secondsky/claude-skills
gh pr create --repo secondsky/claude-skills \
  --title "Add my-plugin skill" \
  --body "Description of changes

Production tested: [evidence]"
```

### Research Protocol

**Before building a new skill** (see [research-protocol.md](../reference/research-protocol.md)):

1. **Check existing skills** - Is this already covered?
2. **Find official docs** - Use Context7 MCP to resolve library docs
3. **Verify package versions** - Check npm for latest stable versions
4. **Build working example** - Start from scratch, document errors
5. **Document research findings** - Document sources, versions, issues

---

## Production Quality Standards

### Production Testing Requirements

**Every skill MUST be production-tested before merging**:

- [ ] Built working example project from scratch using skill templates
- [ ] Documented all errors encountered (these become "Known Issues")
- [ ] Verified package versions are current (within 3 months)
- [ ] Tested skill discovery (Claude suggests skill when relevant)
- [ ] Verified templates work without modification
- [ ] Production deployment successful (if applicable)

**Evidence required**:
- Link to working example project
- Screenshot of Claude discovering skill
- Package version verification
- Known issues documented with GitHub issue links

### Compliance Standards

**Verify against official standards**:

1. **Anthropic Agent Skills Spec**: https://github.com/anthropics/skills/blob/main/agent_skills_spec.md
2. **Our Standards Doc**: [claude-code-skill-standards.md](../reference/claude-code-skill-standards.md)
3. **Comparison**: [STANDARDS_COMPARISON.md](../reference/STANDARDS_COMPARISON.md)

**Key requirements**:
- YAML frontmatter: `name` and `description` (required)
- Third-person descriptions ("This skill should be used when...")
- Imperative/infinitive form in instructions
- Progressive disclosure (SKILL.md < 500 lines)
- Resources organized (scripts/, references/, assets/)

### Common Pitfalls

**See [COMMON_MISTAKES.md](../reference/COMMON_MISTAKES.md) for comprehensive list.**

**Quick list**:
- ❌ Missing YAML frontmatter (skill invisible)
- ❌ Verbose descriptions (>150 chars causes budget issues)
- ❌ Second-person instructions ("You should...")
- ❌ Vague descriptions (no "Use when" scenarios)
- ❌ Outdated package versions
- ❌ Untested templates
- ❌ No production validation

### Package Version Verification

**Quarterly maintenance** (every 3 months):

```bash
# Check all package versions in a skill
./scripts/check-versions.sh plugins/my-plugin/

# Update to latest stable
npm view <package-name> version

# Update skill documentation
# Update "Last Verified" date in metadata
```

**Breaking changes**:
- Review package CHANGELOG for breaking changes
- Update skill templates
- Test thoroughly
- Document migration if needed

---

## Integration with Official Plugin-Dev

### Combined Workflow Example

**Recommended workflow** for creating a new plugin with MCP integration:

```bash
# 1. PREREQUISITES
/plugin install plugin-dev@claude-code-marketplace

# 2. STRUCTURE (Use Official)
/plugin-dev:create-plugin
# Follow 8-phase guided workflow
# Plugin-dev handles: hooks, MCP, agents, commands, structure

# 3. REPOSITORY-SPECIFIC (This Doc)
# a. Install locally
./scripts/install-skill.sh my-plugin

# b. Test discovery
# Ask Claude Code to use the skill

# c. Optimize description (check length)
jq '.description | length' plugins/my-plugin/.claude-plugin/plugin.json
# Should be under 150 chars

# d. Sync marketplace
./scripts/sync-plugins.sh

# e. Verify compliance
# Check ONE_PAGE_CHECKLIST.md

# 4. COMMIT (Repository-Specific)
git add plugins/my-plugin .claude-plugin/marketplace.json
git commit -m "Add my-plugin with MCP integration"
gh pr create --repo secondsky/claude-skills
```

### Task → Resource Mapping

| Task | Resource |
|------|----------|
| **Create plugin structure** | Official: `/plugin-dev:create-plugin` |
| **Add PreToolUse hook** | Official: `hook-development` skill |
| **Configure MCP server** | Official: `mcp-integration` skill |
| **Create autonomous agent** | Official: `agent-creator` agent |
| **Create slash command** | Official: `command-development` skill |
| **Write skill with triggers** | Official: `skill-development` skill |
| **Validate agent structure** | Official: `plugin-validator` agent |
| **Review skill quality** | Repository: ONE_PAGE_CHECKLIST.md |
| | |
| **Manage marketplace** | Repository: [MARKETPLACE_MANAGEMENT.md](MARKETPLACE_MANAGEMENT.md) |
| **Optimize description** | Repository: This doc, Section 3 |
| **Batch review workflows** | Repository: This doc, Section 4 |
| **Install locally** | Repository: `./scripts/install-skill.sh` |
| **Sync versions** | Repository: `./scripts/sync-plugins.sh` |
| **Check compliance** | Repository: [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) |
| **Research protocol** | Repository: [research-protocol.md](../reference/research-protocol.md) |

### Responsibility Matrix

| Responsibility | Official Plugin-Dev | Repository Docs |
|----------------|-------------------|-----------------|
| Plugin fundamentals | ✅ PRIMARY | Reference only |
| Hook development | ✅ PRIMARY | Reference only |
| MCP integration | ✅ PRIMARY | Reference only |
| Agent creation | ✅ PRIMARY | Reference only |
| Command creation | ✅ PRIMARY | Reference only |
| Skill writing | ✅ PRIMARY | Reference only |
| | |
| Marketplace management | ❌ | ✅ PRIMARY |
| System prompt budget | ❌ | ✅ PRIMARY |
| Batch operations | ❌ | ✅ PRIMARY |
| Repository workflows | ❌ | ✅ PRIMARY |
| Description optimization | ❌ | ✅ PRIMARY |

---

## Summary

### Quick Reference

**Prerequisites**:
1. Install plugin-dev: `/plugin install plugin-dev@claude-code-marketplace`
2. Use plugin-dev for ALL plugin fundamentals
3. Use this doc ONLY for repository-specific gaps

**Repository-Specific Essentials**:
1. **Marketplace**: `./scripts/sync-plugins.sh` (before every PR)
2. **Descriptions**: Keep under 100 chars (150 max) to avoid silent omission
3. **Quality**: Manual review required (30min-2hrs per skill)
4. **Installation**: `./scripts/install-skill.sh` for local testing

**Critical Constraints**:
- System prompt budget: 15,000 chars TOTAL for all skill descriptions
- SKILL.md length: Under 500 lines (use progressive disclosure)
- Version sync: Global version applies to all 169 skills
- Git: ALWAYS push to `secondsky/claude-skills` (never jezweb)

### Getting Help

- **Plugin fundamentals**: Use official plugin-dev skills/agents
- **Marketplace issues**: See [MARKETPLACE_MANAGEMENT.md](MARKETPLACE_MANAGEMENT.md)
- **Quality standards**: Check [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)
- **Common mistakes**: Review [COMMON_MISTAKES.md](../reference/COMMON_MISTAKES.md)
- **Research**: Follow [research-protocol.md](../reference/research-protocol.md)

---

**Maintainers**: Claude Skills Maintainers | maintainers@example.com
**Repository**: https://github.com/secondsky/claude-skills
**Version**: 3.0.0 | Last Updated: 2025-12-28
