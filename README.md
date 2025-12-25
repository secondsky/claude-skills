# Claude Code Skills Collection

**169 production-ready skills for Claude Code CLI**

Version 3.0.0 | Last Updated: 2025-12-19

A curated collection of battle-tested skills for building modern web applications with Cloudflare, AI integrations, React, Tailwind, and more.

---

## Quick Start

### Marketplace Installation (Recommended)

```bash
# Add the marketplace
/plugin marketplace add https://github.com/secondsky/claude-skills

# Install individual skills as needed
/plugin install cloudflare-worker-base@claude-skills
/plugin install tailwind-v4-shadcn@claude-skills
/plugin install ai-sdk-core@claude-skills
```

See [MARKETPLACE.md](MARKETPLACE.md) for complete catalog of all 169 skills.

### Bulk Installation (Contributors)

```bash
# Clone the repository
git clone https://github.com/secondsky/claude-skills.git
cd claude-skills

# Install all 169 skills at once
./scripts/install-all.sh

# Or install individual skills
./scripts/install-skill.sh cloudflare-worker-base
```

---

## Repository Structure

This repository contains **169 production-tested skills** for Claude Code, each focused on a specific technology or capability.

**Individual Skills**: Each skill is a standalone unit with:
- `SKILL.md` - Core knowledge and guidance
- Templates - Working code examples
- References - Extended documentation
- Scripts - Helper utilities

**Installation Options**:
1. **Individual** - Install only the skills you need via marketplace
2. **Bulk** - Install all 169 skills using `./scripts/install-all.sh`

---

## Available Skills (169 Individual Skills)

Each skill is individually installable. Install only the skills you need.

**Full Catalog**: See [MARKETPLACE.md](MARKETPLACE.md) for detailed listings.

### Categories

| Category | Skills | Examples |
|----------|--------|----------|
| **tooling** | 28 | project-workflow, skill-review, turborepo |
| **cloudflare** | 23 | cloudflare-d1, cloudflare-workers-ai, cloudflare-agents |
| **frontend** | 21 | nuxt-v4, tailwind-v4-shadcn, tanstack-query |
| **ai** | 20 | openai-agents, claude-api, ai-sdk-core |
| **api** | 17 | api-design-principles, graphql-implementation |
| **web** | 11 | hono-routing, firecrawl-scraper, web-performance |
| **mobile** | 8 | swift-best-practices, react-native-app |
| **database** | 6 | drizzle-orm-d1, neon-vercel-postgres |
| **security** | 6 | csrf-protection, access-control-rbac |
| **testing** | 5 | vitest-testing, playwright-testing |
| **design** | 4 | design-review, design-system-creation |
| **woocommerce** | 4 | woocommerce-backend-dev |
| **cms** | 4 | hugo, sveltia-cms, wordpress-plugin-core |
| **data** | 3 | sql-query-optimization, recommendation-engine |
| **auth** | 3 | better-auth, clerk-auth |
| **architecture** | 3 | microservices-patterns, architecture-patterns |
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
Claude: "Found cloudflare-worker-base and cloudflare-d1 skills.
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

## ⚠️ Important: Token Limits

### Skill Visibility Constraint

Claude Code has a **15,000 character limit** for the total size of skill descriptions in the system prompt. This limit also applies to commands and agents.

**What this means:**
- Not all 169 skills may be visible in Claude's context at once
- Skills are loaded based on relevance and available token budget
- You can verify how many skills Claude currently sees by asking: *"How many skills do you see in your system prompt?"*

### Checking Visible Skills

To verify which skills are currently loaded:

```bash
# Ask Claude Code directly
"Check what skills/plugins you see in your system prompt"
```

Claude will report something like: "79 of 96 skills visible due to token limits"

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

**Across all 169 skills**: 395+ documented errors prevented.

---

## Contributing

1. Create skill directory in `skills/`
2. Add `SKILL.md` with YAML frontmatter
3. Run `./scripts/sync-plugins.sh`
4. Submit pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [MARKETPLACE.md](MARKETPLACE.md) | Full skill catalog, installation, maintainer guide |
| [CLAUDE.md](CLAUDE.md) | Project context and standards |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [START_HERE.md](START_HERE.md) | Quick navigation guide |

---

## Links

- **Repository**: https://github.com/secondsky/claude-skills
- **Issues**: https://github.com/secondsky/claude-skills/issues
- **Claude Code**: https://claude.com/claude-code

---

**Built with ❤️ by Claude Skills Maintainers**
