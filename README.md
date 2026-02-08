# Claude Code Skills Collection

**167 production-ready skills for Claude Code CLI**

Version 3.2.0 | Last Updated: 2026-02-07

<div align="center">

**🔌 Platform Support**

This repository uses **Claude Plugin Patterns** — natively supported by:

| Platform | Status | Notes |
|----------|--------|-------|
| **Claude Code** | ✅ **Native** | Full marketplace support with `/plugin marketplace add` |
| **Factory Droid** | ✅ **Native** | Full marketplace support with direct droid integration |

</div>

---

A curated collection of battle-tested skills for building modern web applications with Cloudflare, AI integrations, React, Tailwind, and more.

---

## Quick Start

### Marketplace Installation (Recommended)

```bash
# Add the marketplace
/plugin marketplace add https://github.com/secondsky/claude-skills

# Install individual skills as needed
/plugin install cloudflare-d1@claude-skills
/plugin install tailwind-v4-shadcn@claude-skills
/plugin install ai-sdk-core@claude-skills
```

See [MARKETPLACE.md](MARKETPLACE.md) for complete catalog of all 167 skills.

### Bulk Installation (Contributors)

```bash
# Clone the repository
git clone https://github.com/secondsky/claude-skills.git
cd claude-skills

# Install all 167 skills at once
./scripts/install-all.sh

# Or install individual skills
./scripts/install-skill.sh cloudflare-d1
```

---

## Repository Structure

This repository contains **167 production-tested skills** for Claude Code, each focused on a specific technology or capability.

**Individual Skills**: Each skill is a standalone unit with:
- `SKILL.md` - Core knowledge and guidance
- Templates - Working code examples
- References - Extended documentation
- Scripts - Helper utilities

**Installation Options**:
1. **Individual** - Install only the skills you need via marketplace
2. **Bulk** - Install all 167 skills using `./scripts/install-all.sh`

---

## Available Skills (167 Individual Skills)

Each skill is individually installable. Install only the skills you need.

**Full Catalog**: See [MARKETPLACE.md](MARKETPLACE.md) for detailed listings.

### Categories

| Category | Skills | Examples |
|----------|--------|----------|
| **tooling** | 28 | turborepo, plan-interview, code-review |
| **frontend** | 25 | nuxt-v4, tailwind-v4-shadcn, tanstack-query, nuxt-studio, maz-ui |
| **cloudflare** | 21 | cloudflare-d1, cloudflare-workers-ai, cloudflare-agents |
| **ai** | 20 | openai-agents, claude-api, ai-sdk-core |
| **api** | 16 | api-design-principles, graphql-implementation |
| **web** | 10 | hono-routing, firecrawl-scraper, web-performance |
| **mobile** | 7 | swift-best-practices, react-native-app, react-native-skills |
| **database** | 6 | drizzle-orm-d1, neon-vercel-postgres |
| **security** | 6 | csrf-protection, access-control-rbac |
| **auth** | 4 | better-auth |
| **testing** | 4 | vitest-testing, playwright-testing |
| **design** | 4 | design-review, design-system-creation |
| **woocommerce** | 4 | woocommerce-backend-dev |
| **cms** | 4 | hugo, sveltia-cms, wordpress-plugin-core |
| **architecture** | 3 | microservices-patterns, architecture-patterns |
| **data** | 3 | sql-query-optimization, recommendation-engine |
| **seo** | 2 | seo-optimizer, seo-keyword-cluster-builder |
| **documentation** | 1 | technical-specification |

---

## How It Works

### Auto-Discovery

Claude Code automatically checks `~/.claude/skills/` for relevant skills before planning tasks:

```
User: "Set up a Cloudflare Worker with D1 database"
           ↓
Claude: [Checks skills automatically]
           ↓
Claude: "Found cloudflare-d1 skills.
         These prevent 12 documented errors. Use them?"
           ↓
User: "Yes"
           ↓
Result: Production-ready setup, zero errors, ~65% token savings
```

**Note**: Due to token limits, not all skills may be visible at once. See [⚠️ Important: Token Limits](#-important-token-limits) below.

### Skill Structure

Each skill includes:

```
skills/[skill-name]/
├── SKILL.md              # Complete documentation
├── .claude-plugin/
│   └── plugin.json       # Plugin metadata
├── templates/            # Ready-to-copy templates
├── scripts/              # Automation scripts
└── references/           # Extended documentation
```

---

## Recent Additions

### December 2025 - January 2026

**Frontend Expansion**:
- **nuxt-studio** (v1.0.0) - Visual CMS for Nuxt Content with live preview, OAuth auth, and R2 storage integration
- **maz-ui** (v1.0.0) - 50+ Vue/Nuxt components with theming, i18n, form generation, and 14 composables

**Developer Workflow**:
- **plan-interview** (v2.0.0) - Adaptive interview-driven spec generation with autonomous quality review
- **turborepo** (v2.8.0) - Updated to official Vercel skill with enhanced monorepo build optimization

**Mobile Development**:
- **react-native-skills** (v1.0.0) - React Native & Expo best practices with performance optimization patterns

**Enhanced Authentication**:
- **better-auth** (v2.2.0) - Expanded to 18 framework integrations with 30+ authentication plugins

---

## ⚠️ Important: Token Limits

### Skill Visibility Constraint

Claude Code has a **15,000 character limit** for the total size of skill descriptions in the system prompt. This limit also applies to commands and agents.

**What this means:**
- Not all 176 skills may be visible in Claude's context at once
- Skills are loaded based on relevance and available token budget
- You can verify how many skills Claude currently sees by asking: *"How many skills do you see in your system prompt?"*

### Checking Visible Skills

To verify which skills are currently loaded:

```bash
# Ask Claude Code directly
"Check what skills/plugins you see in your system prompt"
```

Claude will report something like: "85 of 176 skills visible due to token limits"

### Workaround: Increase Token Budget

You can double the headroom for skill descriptions by setting an environment variable:

```bash
# Increase limit to 30,000 characters
export SLASH_COMMAND_TOOL_CHAR_BUDGET=30000

# Then launch Claude Code
claude
```

This gives you approximately **2x more skill visibility** in the system prompt.

**Note**: This is a temporary workaround. The Claude Code team is working on better solutions for skill discovery and loading.

---

## Token Efficiency

| Metric | Manual Setup | With Skills | Savings |
|--------|--------------|-------------|---------|
| **Average Tokens** | 12,000-15,000 | 4,000-5,000 | **~65%** |
| **Typical Errors** | 2-4 per service | 0 (prevented) | **100%** |
| **Setup Time** | 2-4 hours | 15-45 minutes | **~80%** |

**Across all 176 skills**: 400+ documented errors prevented.

---

## Contributing

### Prerequisites for Contributors

Install the official plugin development toolkit:

```bash
/plugin install plugin-dev@claude-code-marketplace
```

This provides:
- `/plugin-dev:create-plugin` command (8-phase guided workflow)
- 7 comprehensive skills (hooks, MCP, structure, agents, commands, skills)
- 2 specialized agents (agent-creator, plugin-validator)

### Quick Steps

1. Create skill directory in `plugins/`
2. Add `SKILL.md` with YAML frontmatter
3. Run `./scripts/sync-plugins.sh`
4. Submit pull request

See [CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) and [PLUGIN_DEV_BEST_PRACTICES.md](docs/guides/PLUGIN_DEV_BEST_PRACTICES.md) for detailed guidelines.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [START_HERE.md](docs/getting-started/START_HERE.md) | **Start here!** Quick navigation guide |
| [PLUGIN_DEV_BEST_PRACTICES.md](docs/guides/PLUGIN_DEV_BEST_PRACTICES.md) | **Repository-specific best practices** (marketplace, budget, quality) |
| [MARKETPLACE.md](MARKETPLACE.md) | Full skill catalog and installation guide |
| [MARKETPLACE_MANAGEMENT.md](docs/guides/MARKETPLACE_MANAGEMENT.md) | Technical infrastructure (plugin.json, scripts, validation) |
| [CLAUDE.md](CLAUDE.md) | Project context and development standards |
| [CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) | Contribution guidelines |

---

## Links

- **Repository**: https://github.com/secondsky/claude-skills
- **Issues**: https://github.com/secondsky/claude-skills/issues
- **Claude Code**: https://claude.com/claude-code

---

**Built with ❤️ by Claude Skills Maintainers**
