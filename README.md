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

# Install suite plugins
/plugin install cloudflare-skills@claude-skills   # 23 Cloudflare skills
/plugin install ai-skills@claude-skills           # 20 AI/ML skills
/plugin install frontend-skills@claude-skills     # 21 UI framework skills
```

See [MARKETPLACE.md](MARKETPLACE.md) for all 18 suite plugins and complete installation guide.

### Direct Installation (Contributors)

```bash
# Clone the repository
git clone https://github.com/secondsky/claude-skills.git
cd claude-skills

# Install all skills
./scripts/install-all.sh

# Or install individual skills
./scripts/install-skill.sh cloudflare-worker-base
```

---

## Available Skills (169)

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
