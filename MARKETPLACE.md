# Claude Skills Marketplace

Welcome to the **claude-skills** marketplace - a curated collection of **169 production-tested skills** for Claude Code CLI, organized into **18 suite plugins**.

## 🚨 BREAKING CHANGE (v2.0.0)

**As of December 2025, skills are now grouped into suite plugins for better organization and discoverability.**

- **Old format** (individual plugins): ❌ Not discoverable by Claude Code
- **New format** (suite plugins): ✅ Fully discoverable and Anthropic-compliant

See [Migration Guide](#migration-guide) below if you have existing installations.

---

## Quick Start

### Installation

**Step 1: Add the marketplace**

```bash
/plugin marketplace add https://github.com/secondsky/claude-skills
```

**Step 2: Install suite plugins**

Install the skill suites you need:

```bash
# Popular suites
/plugin install cloudflare-skills@claude-skills     # 23 Cloudflare platform skills
/plugin install ai-skills@claude-skills              # 22 AI/ML integration skills
/plugin install frontend-skills@claude-skills        # 22 UI framework skills

# All suites (recommended for full coverage)
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

**Step 3: Use the skills**

Skills are automatically discovered and used when relevant:

```
User: "Set up a Cloudflare Worker with D1 database"
Claude: [Automatically uses cloudflare-skills:cloudflare-worker-base
         and cloudflare-skills:cloudflare-d1]
```

---

## Available Suite Plugins (18)

### 1. cloudflare-skills (23 skills)

Complete Cloudflare platform skills - Workers, D1, R2, KV, AI, Queues, Durable Objects, and more. Production-tested edge computing solutions.

**Installation**: `/plugin install cloudflare-skills@claude-skills`

**Includes**:
- cloudflare-worker-base, cloudflare-d1, cloudflare-r2, cloudflare-kv
- cloudflare-workers-ai, cloudflare-vectorize, cloudflare-queues, cloudflare-workflows
- cloudflare-durable-objects, cloudflare-agents, cloudflare-mcp-server
- cloudflare-nextjs, cloudflare-cron-triggers, cloudflare-email-routing
- cloudflare-hyperdrive, cloudflare-images, cloudflare-browser-rendering
- cloudflare-turnstile, cloudflare-zero-trust-access, cloudflare-manager
- cloudflare-sandbox, cloudflare-full-stack-scaffold, cloudflare-full-stack-integration

### 2. ai-skills (20 skills)

AI and ML integrations - OpenAI, Gemini, Claude API, Eleven Labs, ML pipelines, and model deployment. Complete AI development toolkit.

**Installation**: `/plugin install ai-skills@claude-skills`

**Includes**:
- openai-api, openai-agents, openai-assistants, openai-responses
- google-gemini-api, google-gemini-embeddings, google-gemini-file-search, gemini-cli
- claude-api, claude-agent-sdk, ai-sdk-core, ai-sdk-ui
- thesys-generative-ui, tanstack-ai, elevenlabs-agents, ai-elements-chatbot
- multi-ai-consultant, ml-model-training, ml-pipeline-automation, model-deployment

### 3. frontend-skills (21 skills)

Modern UI frameworks and libraries - React, Vue, Nuxt, Next.js, Tailwind v4, shadcn, TanStack, component libraries, and animations.

**Installation**: `/plugin install frontend-skills@claude-skills`

**Includes**:
- tailwind-v4-shadcn, react-hook-form-zod, shadcn-vue
- nextjs, nuxt-v4, nuxt-ui-v4, nuxt-content, nuxt-seo
- tanstack-query, tanstack-router, tanstack-start, tanstack-table
- pinia-v3, pinia-colada, zustand-state-management
- aceternity-ui, inspira-ui, base-ui-react, ultracite, auto-animate, motion

### 4. api-skills (17 skills)

API design, implementation, and best practices - REST, GraphQL, WebSocket, authentication, versioning, testing, and optimization.

**Installation**: `/plugin install api-skills@claude-skills`

**Includes**:
- api-design-principles, rest-api-design, graphql-implementation, websocket-implementation
- api-authentication, api-security-hardening, api-error-handling
- api-versioning-strategy, api-changelog-versioning, api-pagination, api-filtering-sorting
- api-rate-limiting, api-response-optimization, api-gateway-configuration
- api-testing, api-contract-testing, api-reference-documentation

### 5. tooling-skills (28 skills)

Development tools, utilities, and workflow automation - MCP servers, project planning, code review, debugging tools, and productivity enhancers.

**Installation**: `/plugin install tooling-skills@claude-skills`

**Includes**:
- project-planning, project-session-management, project-workflow
- typescript-mcp, fastmcp, mcp-dynamic-orchestrator, mcp-management
- skill-review, code-review, dependency-upgrade, verification-before-completion
- systematic-debugging, root-cause-tracing, sequential-thinking
- github-project-automation, open-source-contributions
- better-chatbot, better-chatbot-patterns, nano-banana-prompts
- claude-code-bash-patterns, claude-hook-writer
- chrome-devtools, turborepo, feature-dev, frontend-design
- logging-best-practices, idempotency-handling, zod

### 6. database-skills (6 skills)

Database, ORM, and data storage solutions - Drizzle ORM, Neon Postgres, Vercel KV/Blob, schema design, and sharding strategies.

**Installation**: `/plugin install database-skills@claude-skills`

**Includes**:
- drizzle-orm-d1, neon-vercel-postgres
- vercel-kv, vercel-blob
- database-schema-design, database-sharding

### 7. testing-skills (5 skills)

Testing frameworks and quality assurance - Jest, Playwright, Vitest, mutation testing, and test quality analysis tools.

**Installation**: `/plugin install testing-skills@claude-skills`

**Includes**:
- jest-generator, playwright-testing, vitest-testing
- mutation-testing, test-quality-analysis

### 8. auth-skills (3 skills)

Authentication and authorization solutions - Better Auth, Clerk, OAuth implementations. Secure user authentication for modern apps.

**Installation**: `/plugin install auth-skills@claude-skills`

**Includes**:
- better-auth, clerk-auth, oauth-implementation

### 9. cms-skills (4 skills)

Content management systems and static site generators - Sveltia CMS, WordPress, Hugo, Nuxt Content, and content collections.

**Installation**: `/plugin install cms-skills@claude-skills`

**Includes**:
- sveltia-cms, hugo, wordpress-plugin-core, content-collections

### 10. web-skills (11 skills)

Web development, optimization, and performance - Hono routing, image optimization, i18n, PWA, WebSocket, and performance auditing.

**Installation**: `/plugin install web-skills@claude-skills`

**Includes**:
- firecrawl-scraper, hono-routing
- image-optimization, internationalization-i18n, web-performance-audit, web-performance-optimization
- payment-gateway-integration, progressive-web-app, push-notification-setup
- responsive-web-design, session-management

### 11. mobile-skills (8 skills)

Mobile app development for iOS and Android - React Native, Swift, app store deployment, mobile testing, and offline support.

**Installation**: `/plugin install mobile-skills@claude-skills`

**Includes**:
- app-store-deployment, mobile-app-debugging, mobile-app-testing, mobile-first-design
- mobile-offline-support, react-native-app, swift-best-practices, swift-settingskit

### 12. security-skills (6 skills)

Security best practices and vulnerability protection - RBAC, CSRF/XSS prevention, security headers, and vulnerability scanning.

**Installation**: `/plugin install security-skills@claude-skills`

**Includes**:
- access-control-rbac, csrf-protection, xss-prevention
- security-headers-configuration, defense-in-depth-validation
- vulnerability-scanning

### 13. architecture-skills (3 skills)

Software architecture patterns - Architecture patterns, microservices patterns, and health check implementations.

**Installation**: `/plugin install architecture-skills@claude-skills`

**Includes**:
- architecture-patterns, microservices-patterns, health-check-endpoints

### 14. design-skills (4 skills)

UI/UX design and design systems - Design review, design system creation, frontend design, interaction design, and KPI dashboards.

**Installation**: `/plugin install design-skills@claude-skills`

**Includes**:
- design-review, design-system-creation, interaction-design, kpi-dashboard-design

### 15. data-skills (3 skills)

Data processing and optimization - Recommendation engines, recommendation systems, and SQL query optimization.

**Installation**: `/plugin install data-skills@claude-skills`

**Includes**:
- recommendation-engine, recommendation-system, sql-query-optimization

### 16. seo-skills (2 skills)

SEO optimization and keyword research - Keyword cluster building, SEO optimization strategies, and content optimization.

**Installation**: `/plugin install seo-skills@claude-skills`

**Includes**:
- seo-keyword-cluster-builder, seo-optimizer

### 17. woocommerce-skills (4 skills)

WooCommerce development and best practices - Backend development, code review, copywriting guidelines, and development cycle.

**Installation**: `/plugin install woocommerce-skills@claude-skills`

**Includes**:
- woocommerce-backend-dev, woocommerce-code-review
- woocommerce-copy-guidelines, woocommerce-dev-cycle

### 18. documentation-skills (1 skill)

Documentation and technical writing - Technical specification templates and documentation best practices.

**Installation**: `/plugin install documentation-skills@claude-skills`

**Includes**:
- technical-specification

---

## Migration Guide

### Migrating from v1.x (Individual Plugins)

**Old installation (v1.x - no longer works)**:
```bash
/plugin install cloudflare-worker-base@claude-skills
/plugin install zod@claude-skills
# ... (169 separate commands)
```

**New installation (v2.0+)**:
```bash
/plugin install cloudflare-skills@claude-skills  # Gets all 23 Cloudflare skills
/plugin install tooling-skills@claude-skills      # Gets all 26 tooling skills including zod
```

### Migration Steps

1. **Uninstall old individual plugins** (if installed):
   ```bash
   /plugin uninstall cloudflare-worker-base@claude-skills
   /plugin uninstall zod@claude-skills
   # ... repeat for each individually installed skill
   ```

2. **Update marketplace** (if already added):
   ```bash
   /plugin marketplace update claude-skills
   ```

3. **Install new suite plugins**:
   ```bash
   /plugin install cloudflare-skills@claude-skills
   /plugin install ai-skills@claude-skills
   /plugin install frontend-skills@claude-skills
   # ... install other suites as needed
   ```

4. **Verify installation**:
   ```bash
   /plugin list
   ```

   You should see skills with plugin prefix:
   - `cloudflare-skills:cloudflare-worker-base`
   - `tooling-skills:zod`
   - etc.

### What Changed

- **Discovery**: Skills are now properly discovered by Claude Code
- **Naming**: Skills have plugin prefix (e.g., `cloudflare-skills:cloudflare-d1`)
- **Installation**: Install by suite instead of individual skills
- **Count**: 18 suite plugins instead of 169 individual plugins

---

## Benefits

### For Users

- ✅ **Skills are now discoverable**: Claude Code sees and uses them properly
- ✅ **Easier installation**: Install suites instead of 169 individual skills
- ✅ **Logical organization**: Skills grouped by domain
- ✅ **Automatic updates**: Keep skills current with `/plugin update`
- ✅ **Team deployment**: Share via `.claude/settings.json`

### For Projects

- ✅ **60-70% token savings** vs manual implementation
- ✅ **395+ errors prevented** across all skills
- ✅ **Production-tested** patterns and templates
- ✅ **Current packages** (verified quarterly)
- ✅ **Anthropic-compliant** format (official plugin spec)

---

## Managing Skills

### Update Skills

```bash
# Update single suite
/plugin update cloudflare-skills@claude-skills

# Update all suites from marketplace
/plugin update-all@claude-skills
```

### List Installed Skills

```bash
/plugin list
```

### Remove Skills

```bash
# Remove entire suite
/plugin uninstall cloudflare-skills@claude-skills

# Remove individual skill from suite (not recommended)
# Skills are designed to work together within suites
```

---

## Team Deployment

Add to `.claude/settings.json` for automatic marketplace availability:

```json
{
  "extraKnownMarketplaces": [
    {
      "name": "claude-skills",
      "url": "https://github.com/secondsky/claude-skills"
    }
  ]
}
```

Team members will automatically have access to the marketplace.

---

## Alternative: Direct Installation

If you prefer manual installation or want to contribute:

```bash
# Clone repository
git clone https://github.com/secondsky/claude-skills.git
cd claude-skills

# Install single skill (creates symlink to ~/.claude/skills/)
./scripts/install-skill.sh cloudflare-worker-base

# Install all skills
./scripts/install-all.sh
```

See [README.md](README.md) for development workflow.

---

## Support

**Issues**: https://github.com/secondsky/claude-skills/issues
**Email**: maintainers@example.com
**Documentation**: See individual skill directories for detailed guides

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick process**:
1. Fork repository
2. Create new skill in `skills/` directory
3. Run `./scripts/generate-marketplace.sh`
4. Submit pull request

---

## Maintainer Guide

This section documents the technical implementation for maintainers and contributors.

### File Structure

```
claude-skills/
├── .claude-plugin/
│   └── marketplace.json          ← Central registry (auto-generated)
└── skills/[skill-name]/
    ├── .claude-plugin/
    │   └── plugin.json           ← Individual plugin metadata
    ├── SKILL.md                  ← Skill content
    ├── agents/                   ← Optional: Agent definitions (auto-detected)
    └── commands/                 ← Optional: Slash commands (auto-detected)
```

### Plugin.json Schema

Each skill has a `plugin.json` following the Anthropic specification:

```json
{
  "name": "cloudflare-d1",
  "description": "Complete knowledge domain for Cloudflare D1...",
  "version": "3.0.0",
  "author": {
    "name": "Claude Skills Maintainers",
    "email": "maintainers@example.com"
  },
  "license": "MIT",
  "repository": "https://github.com/secondsky/claude-skills",
  "keywords": ["cloudflare-d1", "cloudflare", "sql", "database"],
  "category": "cloudflare",
  "agents": ["./agents/code-reviewer.md"],
  "commands": ["./commands/feature-dev.md"]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique skill identifier |
| `description` | Yes | Skill description with "Use when:" scenarios |
| `version` | Yes | Semantic version (synced from marketplace) |
| `keywords` | Yes | Search terms (auto-generated) |
| `category` | Yes | One of 18 categories (auto-detected) |
| `agents` | No | Agent file paths (auto-detected from `agents/`) |
| `commands` | No | Command file paths (auto-detected from `commands/`) |

### Scripts

**Primary Script: `sync-plugins.sh`** (Single entry point)

```bash
# Full sync - updates all plugin.json files and regenerates marketplace.json
./scripts/sync-plugins.sh

# Preview changes without modifying files
./scripts/sync-plugins.sh --dry-run
```

**What it does:**
1. Reads global version from `marketplace.json` metadata
2. For each skill: syncs version, auto-detects category, scans agents/commands, generates keywords
3. Regenerates `marketplace.json` with all updated data

**Other Scripts:**
- `generate-marketplace.sh` - Regenerates marketplace.json only (used internally by sync-plugins.sh)

### Issues Encountered & Fixes

#### Issue 1: Cache Duplication (18× Bloat)
- **Problem**: Old format used `source: "./"` copying entire repo to cache
- **Fix**: Changed to `source: "./skills/[name]"` to copy only skill directory
- **Impact**: Reduced cache from 3,218 entries to 169

#### Issue 2: Version Mismatch
- **Problem**: marketplace.json had "3.0.0", plugin.json files had "1.0.0"
- **Fix**: sync-plugins.sh reads global version and syncs to all files

#### Issue 3: Duplicate Keywords
- **Problem**: Keywords had both `"openai-agents"` AND `"openai agents"`
- **Fix**: Removed space-separated pair generation from keyword logic

#### Issue 4: Missing Fields
- **Problem**: plugin.json files missing `category`, `agents`, `commands`
- **Fix**: sync-plugins.sh auto-detects and adds these fields

#### Issue 5: Multiple Scripts Confusion
- **Problem**: 3 separate scripts for plugin management
- **Fix**: Consolidated into single `sync-plugins.sh` entry point

### Keyword Generation

Keywords are generated from 3 sources with deduplication:

1. **Name keywords**: `openai-agents` → `["openai-agents", "openai", "agents"]`
2. **Category keywords**: Domain-specific terms (e.g., cloudflare → `["workers", "edge", "serverless"]`)
3. **Description keywords**: Extracted technical terms (ALL-CAPS, CamelCase, valuable terms)

### Validation Commands

```bash
# Check version sync (all should show 3.0.0)
jq -r '.version' skills/*/.claude-plugin/plugin.json | sort -u

# Category distribution
jq -r '.category' skills/*/.claude-plugin/plugin.json | sort | uniq -c | sort -rn

# Marketplace count
jq '.plugins | length' .claude-plugin/marketplace.json

# Find missing descriptions
jq '.plugins[] | select(.description == "") | .name' .claude-plugin/marketplace.json

# Skills with agents/commands
jq -r 'select(.agents != null) | .name' skills/*/.claude-plugin/plugin.json
jq -r 'select(.commands != null) | .name' skills/*/.claude-plugin/plugin.json
```

### Changelog

| Date | Version | Change |
|------|---------|--------|
| 2025-12-19 | 3.0.0 | Fixed duplicate keywords, created unified sync-plugins.sh |
| 2025-12-19 | 3.0.0 | Added category, agents, commands to all plugin.json |
| 2025-12-19 | 3.0.0 | Fixed cache duplication (18× bloat reduction) |
| 2025-12-18 | 2.0.0 | Migrated to suite plugins format |

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Last Updated**: 2025-12-19
**Marketplace Version**: 3.0.0
**Skills**: 169 (organized into 18 suite plugins)
**Format**: Anthropic-compliant suite plugins
**Maintainer**: Claude Skills Maintainers
