# Claude Skills - Project Context

**Repository**: https://github.com/secondsky/claude-skills
**Purpose**: Production-ready skills for Claude Code CLI
**Owner**: Claude Skills Maintainers
**Status**: Active Development | 170 Plugins | 167 Skills Complete
**Last Updated**: 2026-04-08
**Last Audit**: 2026-04-08 (dependency audit)

---

## ⚠️ CRITICAL: Repository Policy - NEVER TOUCH JEZWEB REPO

**🚨 ABSOLUTE RULE: The `jezweb/claude-skills` repository must NEVER be modified under ANY circumstances! 🚨**

**ONLY work in the official repository: https://github.com/secondsky/claude-skills**

### ❌ FORBIDDEN ACTIONS (jezweb repo):
- ❌ NEVER push commits to `jezweb` remote
- ❌ NEVER create PRs to `jezweb/claude-skills`
- ❌ NEVER create branches targeting `jezweb`
- ❌ NEVER make ANY changes to `jezweb` repository
- ❌ NEVER use `git push jezweb` or `git push upstream` (both point to jezweb)
- ❌ NEVER use `gh pr create` without explicitly specifying `--repo secondsky/claude-skills`

### ✅ REQUIRED ACTIONS (secondsky repo):
- ✅ ALWAYS use `origin` remote pointing to `secondsky/claude-skills`
- ✅ ALWAYS push to: `git push origin <branch>`
- ✅ ALWAYS create PRs to: `secondsky/claude-skills` via `gh pr create --repo secondsky/claude-skills`
- ✅ ALWAYS verify remote before pushing: `git remote -v` (check origin = secondsky)

### Why This Matters:
The `jezweb/claude-skills` is a PERSONAL FORK that must remain untouched. All development happens in `secondsky/claude-skills`. Pushing to jezweb would corrupt the fork and cause serious issues.

**If user says "push" or "create PR" without specifying repo, ALWAYS default to secondsky/claude-skills.**

---

## ⚠️ CRITICAL: Plugin Development Prerequisites

### Install Official Plugin-Dev Toolkit (REQUIRED)

```bash
/plugin install plugin-dev@claude-code-marketplace
```

**What it provides**:
- Hook development → `hook-development` skill
- MCP integration → `mcp-integration` skill
- Plugin structure → `plugin-structure` skill
- Agent creation → `agent-creator` agent
- Command creation → `command-development` skill
- Skill creation → `skill-development` skill

**What our documentation provides**:
- Marketplace management (unique to this repository)
- System prompt budget optimization (production issue, 15k char limit)
- Batch operations for 169 skills
- Repository-specific workflows

See [PLUGIN_DEV_BEST_PRACTICES.md](docs/guides/PLUGIN_DEV_BEST_PRACTICES.md) for repository-specific guidance.

---

## What This Repository Is

This is a curated collection of **production-tested Claude Code skills** for building modern web applications. Skills are modular capabilities that extend Claude's knowledge in specific domains, enabling faster development with fewer errors.

**Focus**: Claude Code CLI skills (not claude.ai web interface)

**Target Audience**: Developers building with Cloudflare, React, Tailwind v4, and AI integrations.

---

## Quick Navigation

**👋 First Time Here?** → Read [START_HERE.md](docs/getting-started/START_HERE.md)
**🔨 Building a Skill?** → See [QUICK_WORKFLOW.md](docs/getting-started/QUICK_WORKFLOW.md)
**✅ Verifying Work?** → Check [ONE_PAGE_CHECKLIST.md](docs/getting-started/ONE_PAGE_CHECKLIST.md)
**📂 Need Project Structure?** → See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

## Codebase Exploration

**📖 For detailed project structure, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** (generated with codemap)

Use the `codemap` CLI tool ([github.com/JordanCoin/codemap](https://github.com/JordanCoin/codemap)) to quickly understand the project structure:

```bash
# Generate project tree with file stats
codemap .

# Show dependency flow (imports/exports)
codemap --deps .

# Files changed vs main branch
codemap --diff

# Check impact of a file (who imports it)
codemap --importers lib/accounting/ledger.ts

# Limit tree depth
codemap --depth 2 .

# Filter by extension
codemap --only ts,tsx .
```

Install: `brew tap JordanCoin/tap && brew install codemap`

## Skill Review Process

When reviewing skills, use manual review with the ONE_PAGE_CHECKLIST:

**Manual Review Steps**:
1. Check against [ONE_PAGE_CHECKLIST.md](docs/getting-started/ONE_PAGE_CHECKLIST.md)
2. Verify package versions: `scripts/check-versions.sh`
3. Test installation: `./scripts/install-skill.sh <skill-name>`
4. Validate YAML frontmatter and structure
5. Check compliance with [claude-code-skill-standards.md](docs/reference/claude-code-skill-standards.md)

**Advanced Validation**:
Use official plugin-dev toolkit: `/plugin install plugin-dev@claude-code-marketplace`

---

## ⚠️ CRITICAL: Manual Review & Refactoring Process

**ALWAYS use MANUAL approaches when reviewing and refactoring skills.**

### What This Means:

**✅ ALLOWED:**
- Using existing scripts in `scripts/` directory (e.g., `review-skill.sh`, `check-versions.sh`)
- Using standard tools: Read, Edit, Write, Grep, Glob, Bash
- Manual analysis and judgment
- Reading files to understand structure
- Using ONE_PAGE_CHECKLIST.md for manual review

**❌ FORBIDDEN:**
- Creating NEW Python/shell scripts to automate refactoring
- Using sed/awk to programmatically rewrite large sections
- Batch processing multiple files without human review of each change
- Auto-generating content via scripts
- ANY automation that bypasses manual review of changes

### Why Manual Process is Required:

1. **Human Judgment**: Skills require context-aware decisions about what to extract vs keep
2. **Quality Control**: Each change must be reviewed for accuracy and clarity
3. **Consistency**: Manual review ensures adherence to skill standards
4. **Traceability**: Manual changes are easier to review in PRs
5. **Error Prevention**: Automation can introduce subtle errors that break skills

### Correct Refactoring Process (Manual):

**Refactoring Process**:

1. **Read & Analyze** (Manual):
   - Read entire SKILL.md
   - Identify sections >100 lines that can be extracted
   - Determine what MUST stay in SKILL.md (Quick Start, Top 3-5 errors)

2. **Extract Sections** (Manual):
   - Read the section to extract
   - Copy content to new `references/<name>.md` file using Write tool
   - Review extracted content for completeness

3. **Update SKILL.md** (Manual):
   - Read current section in SKILL.md
   - Use Edit tool to replace with:
     - Brief summary (2-3 sentences)
     - Pointer: "Load `references/<name>.md` when..."
   - Review the edit to ensure clarity

4. **Add "When to Load References"** (Manual):
   - Use Edit tool to add new section explaining WHEN to load each reference
   - This is the KEY section for Claude to know what to load when

5. **Verify** (Manual):
   - Read final SKILL.md
   - Count lines: should be <500
   - Check all pointers are correct
   - Ensure "When to Load References" section is clear

**Time Estimate**: 30 min - 2 hours per skill (depending on complexity)
**This is INTENTIONAL** - quality over speed!

---

## Official Standards We Follow

This repo aligns with **official Anthropic standards**:

- **Official Skills Repo**: https://github.com/anthropics/skills
- **Agent Skills Spec**: [agent_skills_spec.md](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
- **Skill Creator Guide**: [skill-creator/SKILL.md](https://github.com/anthropics/skills/blob/main/skill-creator/SKILL.md)
- **Our Standards Doc**: [docs/reference/claude-code-skill-standards.md](docs/reference/claude-code-skill-standards.md)
- **Comparison**: [docs/reference/STANDARDS_COMPARISON.md](docs/reference/STANDARDS_COMPARISON.md)

**Last Verified**: 2025-10-29

---

## Directory Structure

**📖 For comprehensive structure details, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**

**Total**: 2,528 files | 19.8MB
**Top Extensions**: .md (1,155), .ts (337), .json (242), .html (127), .sh (123)

```
claude-skills/
├── .claude/                      # Claude Code config
│   └── settings.local.json
├── .claude-plugin/               # Plugin marketplace
│   └── marketplace.json # 169 plugins containing 167 skills
├── commands/                     # Slash commands (8 files)
│   ├── explore-idea.md          # Pre-planning exploration
│   ├── plan-project.md          # Project planning generator
│   ├── plan-feature.md          # Feature planning
│   ├── continue-session.md      # Session resumption
│   ├── wrap-session.md          # Session checkpoint
│   ├── release.md               # Pre-release safety checks
│   └── workflow.md              # Interactive guidance
├── docs/                         # Documentation
│   └── skills_workflow.md
├── examples/                     # Working examples
│   └── cloudflare-d1-test/
│       ├── public/              # Static assets
│       ├── src/                 # Source code
│       ├── test/                # Tests
│       └── wrangler.jsonc       # Cloudflare config
├── docs/                         # Documentation (consolidated)
│   ├── COMMON_MISTAKES.md       # Learn from failures
│   ├── STANDARDS_COMPARISON.md  # Official vs our standards
│   ├── claude-code-skill-standards.md
│   ├── research-protocol.md
│   ├── verification-checklist.md
│   ├── SKILL_CATEGORIZATION.md
│   ├── SKILL_REVIEW_PROCESS.md
│   └── ... (7 more files)
├── scripts/                      # Automation (15 files)
│   ├── sync-plugins.sh          # ⭐ Single entry point
│   ├── generate-marketplace.sh  # Marketplace generation
│   ├── install-skill.sh         # Install single skill
│   ├── install-all.sh           # Install all skills
│   ├── check-versions.sh        # Verify package versions
│   ├── review-skill.sh          # Skill review automation
│   ├── audit-keywords.sh        # Keyword auditing
│   ├── baseline-audit-all.sh    # Baseline validation
│   └── ... (7 more scripts)
├── plugins/                      # ⭐ 169 production plugins (18.2MB)
│   ├── cloudflare-*/            # 23 Cloudflare plugins
│   │   ├── .claude-plugin/      # Plugin manifest
│   │   │   └── plugin.json
│   │   ├── README.md            # Public documentation
│   │   └── skills/              # Skill subdirectory
│   │       └── cloudflare-*/    # Skill name matches plugin
│   │           ├── SKILL.md     # Main skill file
│   │           ├── references/  # Extended docs
│   │           ├── templates/   # Code templates
│   │           ├── scripts/     # Helper scripts
│   │           └── assets/      # Images, data
│   ├── ai-*/                    # 20 AI/ML plugins
│   ├── api-*/                   # 17 API plugins
│   ├── mobile-*/                # 8 Mobile plugins
│   ├── *-testing/               # 5 Testing plugins
│   └── ... (96 more plugins)    # Run: ls plugins/
├── skills-review/                # Review documentation
│   └── ... (11 comprehensive reports)
├── templates/                    # ⭐ Skill templates
│   ├── SKILL-TEMPLATE.md        # Copy-paste starter
│   ├── README-TEMPLATE.md       # Public doc starter
│   └── skill-skeleton/          # Complete skeleton
│       ├── SKILL.md
│       ├── README.md
│       ├── .claude-plugin/
│       ├── scripts/
│       ├── references/
│       └── assets/
└── *.md                          # Root documentation
    ├── CLAUDE.md                # ← You are here
    ├── README.md                # Public overview
    ├── CHANGELOG.md             # Version history
    └── LICENSE                  # MIT License
```

**Plugin Directory Structure** (standard for all plugins):
```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── README.md                    # Public documentation
└── skills/                      # Skills subdirectory (required)
    └── <plugin-name>/           # Skill name matches plugin name
        ├── SKILL.md             # ⭐ Main skill content
        ├── references/          # Extended docs (loaded as needed)
        │   ├── command-<name>.md
        │   ├── troubleshooting.md
        │   └── advanced-usage.md
        ├── templates/           # Code templates
        │   ├── basic-setup.ts
        │   └── advanced-example.tsx
        ├── scripts/             # Helper scripts
        │   ├── setup.sh
        │   └── validate.sh
        └── assets/              # Images, data
            └── diagram.png
```

**Important**: Per official Claude Code plugin structure, SKILL.md files **MUST** be in a `skills/<skill-name>/` subdirectory for auto-discovery to work.

---

## Repository Architecture: Plugins vs Skills

This repository uses a **two-tier structure**:

### 172 Plugins (Marketplace Categories)
Plugins are **logical groupings** that organize related skills by domain:
- Each plugin appears in `.claude-plugin/marketplace.json`
- Plugins have names like "cloudflare-d1", "ai-sdk-core", "tailwind-v4-shadcn", etc.
- Users install plugins via: `/plugin install <plugin-name>@claude-skills`

### 170 Skills (Individual Capabilities)
Skills are the **actual knowledge units** that Claude loads:
- Each skill has its own directory in `plugins/<plugin-name>/skills/`
- Each skill has `SKILL.md`, `README.md`, templates, references
- Skills are discovered automatically when relevant to user tasks

### Example Structure
```
Plugin: "cloudflare-d1" (1 of 169 plugins)
  ↓ contains
Skills: cloudflare-d1 (1 skill per plugin, some multi-skill like bun with 27)
```

**Total**: 169 plugins organize 167 skills for optimal discoverability.

---

## Current Status (2025-11-20)

### ✅ Repository Status

- **169 plugins** in marketplace (`.claude-plugin/marketplace.json`)
- **167 individual skills** in repository (`plugins/` directory)
- Most plugins contain 1 skill; some contain multiple (bun: 27, cloudflare-workers: 10, nuxt-v4: 4)

**Baseline Audit (2026-02-07):** 167 skills validated after removal of 9 redundant plugins. All remaining skills production-ready with zero critical issues.

All 167 skills are production-ready and organized by domain:

**Cloudflare Platform** (20 skills):
- cloudflare-d1, cloudflare-r2, cloudflare-kv
- cloudflare-workers-ai, cloudflare-vectorize, cloudflare-queues, cloudflare-workflows
- cloudflare-durable-objects, cloudflare-agents, cloudflare-mcp-server, cloudflare-turnstile
- cloudflare-nextjs, cloudflare-cron-triggers, cloudflare-email-routing
- cloudflare-hyperdrive, cloudflare-images, cloudflare-browser-rendering
- cloudflare-zero-trust-access, cloudflare-manager, cloudflare-sandbox

**AI & Machine Learning** (19 skills):
- ai-sdk-core, ai-sdk-ui, openai-api, openai-agents, openai-assistants, openai-responses
- google-gemini-api, google-gemini-embeddings, google-gemini-file-search, gemini-cli
- claude-api, claude-agent-sdk, thesys-generative-ui, elevenlabs-agents
- ai-elements-chatbot, better-chatbot, better-chatbot-patterns
- multi-ai-consultant, nano-banana-prompts

**Frontend & UI** (25 skills):
- tailwind-v4-shadcn, react-hook-form-zod, tanstack-query, zustand-state-management
- nextjs, hono-routing, firecrawl-scraper, inspira-ui, aceternity-ui, shadcn-vue
- base-ui-react, auto-animate, motion, nuxt-v4, nuxt-ui-v4, frontend-design
- tanstack-router, tanstack-start, tanstack-table, pinia-v3, pinia-colada
- ultracite, zod, hugo, wordpress-plugin-core

**Auth & Security** (1 skill):
- better-auth

**Content Management** (4 skills):
- sveltia-cms, nuxt-content, nuxt-seo, content-collections

**Database & ORM** (4 skills):
- drizzle-orm-d1, neon-vercel-postgres, vercel-kv, vercel-blob

**Tooling & Development** (33 skills):
- **MCP & Integration**: typescript-mcp, fastmcp, mcp-dynamic-orchestrator, mcp-management
- **Code Quality**: code-review, dependency-upgrade, verification-before-completion
- **Testing**: jest-generator, playwright-testing, vitest-testing, mutation-testing, test-quality-analysis, api-testing
- **Architecture & Patterns**: api-design-principles, architecture-patterns, microservices-patterns
- **Debugging & Analysis**: systematic-debugging, root-cause-tracing, sequential-thinking, defense-in-depth-validation
- **Automation**: github-project-automation, claude-code-bash-patterns
- **Tools**: chrome-devtools, swift-best-practices, claude-hook-writer, turborepo
- **Feature Development**: feature-dev, design-review
- **WooCommerce**: woocommerce-backend-dev, woocommerce-code-review, woocommerce-copy-guidelines, woocommerce-dev-cycle

**Quality Standards**:
- ✅ All production-tested
- ✅ Fully compliant with official Anthropic standards
- ✅ 100% pass rate on automated baseline audit (2025-11-20)
- ✅ Package versions verified current
- ✅ Average token savings: 60-70%
- ✅ 395+ documented errors prevented across all skills

**Audit Details:**
- Last Baseline Audit: 2026-02-07
- Automated validation: 167/167 skills passed
- Issues found: 0 Critical, 0 High, 0 Medium
- 6 plugins removed to streamline collection
- Full report: See CHANGELOG.md v3.2.0

**Recent Optimizations:**
- **Tier 7 Optimization** (2025-12-17): 11 Tooling & Planning skills optimized
  - Total reduction: 9,558 → 4,764 lines (-50.1%)
  - Progressive disclosure implemented across all 11 skills
  - "When to Load References" sections added for better discovery
  - Skills optimized: better-chatbot, claude-hook-writer, github-project-automation, turborepo, typescript-mcp, design-review, multi-ai-consultant, better-chatbot-patterns
  - Full summary: `docs/archive/TIER_7_OPTIMIZATION_SUMMARY.md` (if exists)
  - Note: project-planning, project-session-management, project-workflow removed in v3.2.0 (replaced by commands/)

---

## Development Workflow

### Official Plugin-Dev Workflow (Recommended for First-Timers)

**Use the official `/plugin-dev:create-plugin` command for guided plugin creation**:

```bash
# Already installed if you followed prerequisites above
/plugin-dev:create-plugin
```

**Provides**:
- 8-phase guided workflow with validation
- Automatic scaffolding (SKILL.md, plugin.json, README.md)
- Access to official skills for hooks, MCP, agents, commands
- Built-in quality checks

**When to use**: First time creating plugins, need structure guidance, want to add hooks/MCP/agents

**When to use manual workflow below**: Building 2nd+ skill, fast iteration, repository-specific needs

See [PLUGIN_DEV_BEST_PRACTICES.md](docs/guides/PLUGIN_DEV_BEST_PRACTICES.md) Section 7 for integration.

---

### Standard Workflow (From Scratch)

```
1. RESEARCH
   • Read docs/reference/research-protocol.md
   • Check Context7 MCP for library docs
   • Verify latest package versions (npm view)
   • Document research findings

2. TEMPLATE
   • Copy: cp -r templates/skill-skeleton/ skills/new-skill/
   • Fill TODOs in SKILL.md
   • Fill TODOs in README.md
   • Add resources (scripts/, references/, assets/)

3. TEST
   • Install: ./scripts/install-skill.sh new-skill
   • Test discovery: Ask Claude Code to use skill
   • Build example project to verify templates work

4. VERIFY
   • Check docs/getting-started/ONE_PAGE_CHECKLIST.md
   • Compare with docs/reference/claude-code-skill-standards.md
   • Run check-versions.sh if applicable

5. COMMIT
   • git add skills/new-skill
   • git commit -m "Add new-skill for [use case]"
   • Update roadmap documentation if needed
   • git push

6. MARKETPLACE
   • Generate marketplace: ./scripts/generate-marketplace.sh
   • Verify: jq '.plugins | length' .claude-plugin/marketplace.json
   • git add .claude-plugin/marketplace.json scripts/generate-marketplace.sh
   • git commit -m "Update marketplace with new-skill"
   • git push
```

### Quick Workflow (Experienced)

```bash
# 1. Copy template
cp -r templates/skill-skeleton/ skills/my-skill/

# 2. Edit SKILL.md and README.md (fill TODOs)
# 3. Add resources

# 4. Test
./scripts/install-skill.sh my-skill

# 5. Verify & Commit
git add skills/my-skill && git commit -m "Add my-skill" && git push

# 6. Update marketplace
./scripts/generate-marketplace.sh
git add .claude-plugin/marketplace.json && git commit -m "Update marketplace with my-skill" && git push
```

---

## Plugin Management Workflow

**Single Entry Point**: `./scripts/sync-plugins.sh`

This script consolidates all plugin management into one command:

### What It Does
1. **Syncs version** from marketplace.json to all 169 plugin.json files
2. **Adds category** field based on skill name patterns
3. **Detects agents** in `agents/` directory → adds agents array
4. **Detects commands** in `commands/` directory → adds commands array
5. **Generates keywords** from skill name, category, and description
6. **Regenerates marketplace.json** with all updated data

### Usage

```bash
# Full sync (updates all plugin.json files + regenerates marketplace)
./scripts/sync-plugins.sh

# Preview changes without modifying files
./scripts/sync-plugins.sh --dry-run

# Show help
./scripts/sync-plugins.sh --help
```

### When to Run

- After adding new skills
- After modifying skill descriptions in SKILL.md
- After adding agents or commands to a skill
- Before releasing/pushing changes
- To sync version across all skills

### Plugin.json Schema

Each skill's plugin.json follows the [official Claude Code plugin schema](https://docs.claude.com/en/docs/claude-code/plugins-reference). Only `name` is required:

```json
{
  "name": "feature-dev",
  "description": "...",
  "version": "3.0.0",
  "author": {"name": "...", "email": "...", "url": "..."},
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/secondsky/claude-skills",
  "license": "MIT",
  "keywords": ["feature", "dev", "workflow"],
  "agents": ["./agents/code-reviewer.md"],
  "commands": ["./commands/feature-dev.md"],
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json",
  "userConfig": {},
  "channels": []
}
```

Component path fields (`commands`, `agents`, `skills`, `outputStyles`) accept `string | array` and **replace** the default directory. Fields `hooks`, `mcpServers`, `lspServers` accept `string | array | object` and **merge** from multiple sources.

**Note**: The `category` field is NOT valid in plugin.json (causes installation errors). Categories are only used in `marketplace.json` for organization purposes.

Validation schema: `schemas/plugin.schema.json` — run `./scripts/validate-json-schemas.sh` to check.

### Note on Script Consolidation

All plugin management has been consolidated into `sync-plugins.sh`. The `scripts/generate-marketplace.sh` is still used internally by `sync-plugins.sh`.

---

## Key Principles

### 1. Atomic Skills Philosophy
- **One skill = One domain** (e.g., D1 database, not "all Cloudflare services")
- **Composable**: Claude combines skills automatically
- **Reusable**: Same skill works across different frameworks
- **Maintainable**: Update one skill, benefits all use cases

### 2. Production Quality
- All skills must be **tested in production**
- Package versions must be **current** (verified regularly)
- Known issues must be **documented with sources** (GitHub issues, etc.)

### 3. Official Standards Compliance
- YAML frontmatter: `name` and `description` (required)
- Optional fields: `license`, `allowed-tools`, `metadata`
- Directory structure: `scripts/`, `references/`, `assets/` (official)
- Writing style: Imperative/infinitive form, third-person descriptions
- See [docs/reference/STANDARDS_COMPARISON.md](docs/reference/STANDARDS_COMPARISON.md)

### 4. Progressive Disclosure
- **Metadata** (name + description): Always in context (~100 words)
- **SKILL.md body**: Loaded when skill triggers (<5k words)
- **Bundled resources**: Loaded as needed by Claude

---

## Commands & Scripts

Note: Bun is the preferred runtime and package manager for Node-based workflows in this repo. npm/pnpm examples remain supported equivalents.

### Installing Skills

```bash
# Install single skill (creates symlink to ~/.claude/skills/)
./scripts/install-skill.sh cloudflare-d1

# Install all skills
./scripts/install-all.sh

# Verify installation
ls -la ~/.claude/skills/
```

### Development

```bash
# Check package versions
./scripts/check-versions.sh plugins/cloudflare-d1/

# Create new skill from template
cp -r templates/skill-skeleton/ skills/new-skill-name/
```

### Testing

```bash
# After installing skill, ask Claude Code:
"Use the cloudflare-d1 skill to set up a new project"

# Claude should discover and propose using the skill automatically
```

### Git Workflow

```bash
# Create feature branch
git checkout -b add-new-skill

# Make changes
git add skills/new-skill/
git commit -m "Add new-skill for [use case]

- Description of what it does
- Errors prevented: X

Production tested: [evidence]"

# Push and create PR
git push origin add-new-skill
```

---

## Quality Standards

### Before Committing (Checklist)

Use [ONE_PAGE_CHECKLIST.md](docs/getting-started/ONE_PAGE_CHECKLIST.md) to verify:

- [ ] YAML frontmatter valid (name + description)
- [ ] Description includes "Use when" scenarios
- [ ] **Description is concise** (<100 chars ideal, <300 chars max)
- [ ] Keywords comprehensive (technologies, use cases, errors)
- [ ] Third-person description style
- [ ] Instructions in imperative form
- [ ] Resources organized (scripts/, references/, assets/)
- [ ] Templates tested and working
- [ ] Package versions current
- [ ] Known issues documented with sources
- [ ] LICENSE field present (MIT)
- [ ] README.md has auto-trigger keywords
- [ ] Tested in ~/.claude/skills/

### Compliance Verification

Compare against:
1. [docs/reference/claude-code-skill-standards.md](docs/reference/claude-code-skill-standards.md) - Our standards
2. [docs/reference/STANDARDS_COMPARISON.md](docs/reference/STANDARDS_COMPARISON.md) - Official vs ours
3. [CLOUDFLARE_SKILLS_AUDIT.md](CLOUDFLARE_SKILLS_AUDIT.md) - Example audit
4. https://github.com/anthropics/skills - Official reference

---

## Common Pitfalls to Avoid

See [docs/reference/COMMON_MISTAKES.md](docs/reference/COMMON_MISTAKES.md) for detailed examples.

**Quick List**:
- ❌ Missing YAML frontmatter (skill invisible to Claude)
- ❌ Non-standard frontmatter fields (use only name, description, license, allowed-tools, metadata)
- ❌ Second-person descriptions ("You should..." instead of "This skill should be used when...")
- ❌ Vague descriptions (no "Use when" scenarios)
- ❌ **Verbose descriptions** (keep concise for better discoverability)
- ❌ Missing keywords (reduces discoverability)
- ❌ Outdated package versions
- ❌ Untested templates
- ❌ No production validation

---

## External Resources

### Official Anthropic
- **Skills Repository**: https://github.com/anthropics/skills
- **Skills Spec**: https://github.com/anthropics/skills/blob/main/agent_skills_spec.md
- **Skill Creator**: https://github.com/anthropics/skills/blob/main/skill-creator/SKILL.md
- **Engineering Blog**: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

### Support Articles
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [Creating custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)

### Claude Code Docs
- **Skills Documentation**: https://docs.claude.com/en/docs/claude-code/skills
- **Overview**: https://docs.claude.com/en/docs/claude-code/overview

---

## Maintenance

### Regular Tasks

**Quarterly** (Every 3 months):
- Check package versions: `scripts/check-versions.sh`
- Update to latest stable versions
- Re-test all skills
- Update "Last Verified" dates

**When Package Updates**:
- Check breaking changes in changelog
- Update skill templates
- Test thoroughly
- Document migration if needed

**When Standards Change**:
- Review official Anthropic skills repo
- Update docs/reference/claude-code-skill-standards.md
- Update docs/reference/STANDARDS_COMPARISON.md
- Audit existing skills for compliance

---

## Getting Help

**Documentation Issues?**
- Check [START_HERE.md](docs/getting-started/START_HERE.md) for navigation
- Read [COMMON_MISTAKES.md](docs/reference/COMMON_MISTAKES.md)
- Review working examples in `plugins/` directory

**Technical Issues?**
- Open issue: https://github.com/secondsky/claude-skills/issues
- Email: maintainers@example.com
- Check official Claude Code docs

**Want to Contribute?**
- Read [CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)
- Use templates in `templates/`
- Follow [QUICK_WORKFLOW.md](docs/getting-started/QUICK_WORKFLOW.md)
- Verify with [ONE_PAGE_CHECKLIST.md](docs/getting-started/ONE_PAGE_CHECKLIST.md)

---

## Project Goals

### Short Term (Next 3 Months)
- Complete Batch 2 skills (hono-routing, react-hook-form-zod)
- Add Batch 3 (tanstack-query)
- Maintain 100% compliance with official standards
- Keep all package versions current

### Long Term (Next Year)
- Expand to 20+ production skills
- Community contributions
- Validation/packaging scripts (à la Anthropic)
- Automated testing for skill discovery
- Public skill marketplace compatibility

---

## Success Metrics

**Quality**:
- ✅ 100% compliance with official Anthropic standards
- ✅ All skills production-tested
- ✅ Package versions current (checked quarterly)
- ✅ Zero reported errors from documented issues

**Efficiency**:
- ✅ Average 60%+ token savings
- ✅ 100% error prevention (vs manual setup)
- ✅ Sub-5-minute skill creation (with templates)
- ✅ First-try skill discovery rate: 95%+

**Adoption**:
- ✅ 9 skills in production
- ✅ GitHub stars: Growing
- ✅ Community contributions: Welcome
- ✅ Deployed examples: Verified working

---

**Last Updated**: 2025-11-12
**Next Review**: 2026-02-12 (Quarterly)
**Maintainer**: Claude Skills Maintainers | maintainers@example.com | https://github.com/secondsky/claude-skills
- if you condense skills, never remove info first (unless incorrect), always first extract the info into reference files or samples, then condense the old info in the skill.md and link to ref files. basically use best practices for skill creation.