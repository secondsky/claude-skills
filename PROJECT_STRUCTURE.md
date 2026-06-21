# Claude Skills - Project Structure

**Generated**: 2026-06-21
**Repository**: https://github.com/secondsky/claude-skills

---

## Repository Overview

**Total Size**: 20.9MB | **Files**: 2,712
**Top File Types**: `.md` (1,419), `.ts` (281), `.json` (214), `.sh` (137), `.html` (123)

This document provides a comprehensive overview of the claude-skills repository structure, generated using [codemap](https://github.com/JordanCoin/codemap).

---

## Top-Level Structure

```
claude-skills/
├── .claude-plugin/          # Plugin marketplace configuration
├── .githooks/               # Git hooks (pre-commit, pre-push)
├── .github/                 # GitHub CI workflows & issue templates
├── docs/                    # Documentation (5 subdirectories)
├── plugins/                 # 156 plugin directories containing 197 skills
├── schemas/                 # JSON schema validation files
├── scripts/                 # Automation & utility scripts
├── templates/               # Skill creation templates
└── *.md                     # Root documentation files
```

---

## Directory Details

### `.claude-plugin/` (76.0KB, 1 file)

Plugin marketplace configuration for Claude Code.

```
.claude-plugin/
└── marketplace.json         # Main marketplace manifest
```

**Purpose**: Defines 156 plugins containing 197 skills for Claude Code's plugin marketplace.

---

### `.githooks/` (8.2KB, 3 files)

Custom Git hooks for repository quality enforcement.

```
.githooks/
├── README.md                # Git hooks documentation
├── pre-commit               # Pre-commit validation
└── pre-push                 # Pre-push checks
```

---

### `.github/` (36.2KB, 9 files)

GitHub configuration for CI/CD and issue management.

```
.github/
├── ISSUE_TEMPLATE/          # Issue templates (7 files)
│   ├── config.yml
│   ├── marketplace-issue.yml
│   ├── new-skill-proposal.yml
│   ├── skill-bug-report.yml
│   ├── skill-documentation.yml
│   ├── skill-enhancement.yml
│   └── skill-optimization.yml
└── workflows/               # GitHub Actions (2 files)
    ├── validate-frontmatter.yml
    └── validate-json-schemas.yml
```

**Purpose**: Automated CI validation for YAML frontmatter and JSON schemas, plus structured issue templates for skill proposals, bug reports, and enhancements.

---

### `docs/` (191.7KB, 16 files across 5 subdirectories)

Comprehensive documentation organized by purpose.

```
docs/
├── archive/                            # Archived documents
│   └── lost-info.md                    # Information recovery tracking
├── getting-started/                    # Onboarding guides (3 files, 28.2KB)
│   ├── ONE_PAGE_CHECKLIST.md           # Quality verification checklist
│   ├── QUICK_WORKFLOW.md               # 5-minute skill creation guide
│   └── START_HERE.md                   # First-time user guide
├── guides/                             # Process guides (4 files, 65.4KB)
│   ├── CONTRIBUTING.md                 # Contribution guidelines
│   ├── ISSUE_TEMPLATES_GUIDE.md        # Issue template usage
│   ├── MARKETPLACE_MANAGEMENT.md       # Marketplace management details
│   └── PLUGIN_DEV_BEST_PRACTICES.md    # Plugin development best practices
├── reference/                          # Standards & reference (5 files, 45.2KB)
│   ├── COMMON_MISTAKES.md              # Learn from past failures
│   ├── SKILL_CATEGORIZATION.md         # Skill organization system
│   ├── STANDARDS_COMPARISON.md         # Official vs our standards
│   ├── claude-code-skill-standards.md  # Our skill standards
│   └── research-protocol.md            # Research methodology
└── validation/                         # Validation docs (3 files, 31.9KB)
    ├── IMPLEMENTATION.md               # Implementation details
    ├── README.md                       # Validation overview
    └── json-schema-validation.md       # JSON schema validation guide
```

**Key Documents**:
- `getting-started/START_HERE.md` - New user onboarding
- `reference/claude-code-skill-standards.md` - Primary standards reference
- `reference/STANDARDS_COMPARISON.md` - Alignment with official Anthropic standards

---

### `plugins/` (20.3MB, 2,649 files)

**156 plugins** organizing **197 individual skills** by domain.

Each plugin follows this structure:
```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json         # Plugin manifest
├── agents/                 # Agent definitions (optional)
├── commands/               # Plugin commands (optional)
├── hooks/                  # Hook scripts (optional)
└── skills/                 # Individual skill directories
    └── <skill-name>/
        ├── SKILL.md        # Main skill content
        ├── README.md       # Public documentation
        ├── references/     # Extended documentation
        ├── templates/      # Code templates
        ├── scripts/        # Helper scripts
        └── assets/         # Images, diagrams, data
```

#### Multi-Skill Plugins

| Plugin | Skills | Description |
|--------|--------|-------------|
| **bun** | 27 | Bundler, Cloudflare Workers, Docker, Drizzle, FFI, File I/O, Hono, Hot Reloading, HTTP Server, Jest Migration, Macros, Next.js, Nuxt, Package Manager, React SSR, Redis, Runtime, Shell, SQLite, SvelteKit, TanStack Start, Test Basics/Coverage/Lifecycle/Mocking, WebSocket Server, Workers |
| **cloudflare-workers** | 10 | Workers runtime, security, performance, CI/CD, dev experience, frameworks, migration, multi-lang, observability, runtime APIs |
| **nuxt-v4** | 4 | Nuxt 4 core, UI, Content, SEO |
| **nuxt-v5** | 4 | Nuxt 5 core, UI, Content, SEO |

#### Plugin Categories (156 plugins)

##### **Cloudflare** (21 plugins, 30 skills)
- cloudflare-workers (10 skills), cloudflare-d1, cloudflare-r2, cloudflare-kv
- cloudflare-workers-ai, cloudflare-vectorize, cloudflare-queues, cloudflare-workflows
- cloudflare-durable-objects, cloudflare-agents, cloudflare-mcp-server, cloudflare-turnstile
- cloudflare-nextjs, cloudflare-cron-triggers, cloudflare-email-routing
- cloudflare-hyperdrive, cloudflare-images, cloudflare-browser-rendering
- cloudflare-zero-trust-access, cloudflare-manager, cloudflare-sandbox

##### **Bun** (1 plugin, 27 skills)
- bun (bundler, cloudflare-workers, docker, drizzle, ffi, file-io, hono, hot-reloading, http-server, jest-migration, macros, nextjs, nuxt, package-manager, react-ssr, redis, runtime, shell, sqlite, sveltekit, tanstack-start, test-basics, test-coverage, test-lifecycle, test-mocking, websocket-server, workers)

##### **AI & Machine Learning** (13 plugins, 13 skills)
- ai-sdk-core, ai-sdk-ui
- claude-api, claude-agent-sdk
- elevenlabs-agents, thesys-generative-ui
- ai-elements-chatbot, better-chatbot, better-chatbot-patterns
- multi-ai-consultant, nano-banana-prompts
- gemini-cli, tanstack-ai

##### **Nuxt** (6 plugins, 12 skills)
- nuxt-v4 (4 skills), nuxt-v5 (4 skills), nuxt-ui-v4, nuxt-content, nuxt-seo, nuxt-studio

##### **Frontend & UI** (30+ plugins)
- **Component Libraries**: tailwind-v4-shadcn, shadcn-vue, aceternity-ui, inspira-ui, base-ui-react, maz-ui
- **Animation**: auto-animate, motion
- **State Management**: zustand-state-management, pinia-v3, pinia-colada
- **React**: react-best-practices, react-composition-patterns, react-hook-form-zod, react-native-skills
- **Design**: frontend-design, design-review, design-system-creation, interaction-design, kpi-dashboard-design, mobile-first-design, responsive-web-design
- **3D**: threejs
- **Tooling**: ultracite, zod

##### **Next.js & Frameworks** (5 plugins)
- nextjs, hono-routing, tanstack-query, tanstack-router, tanstack-start, tanstack-table

##### **API** (15 plugins, 15 skills)
- api-changelog-versioning, api-contract-testing, api-design-principles
- api-error-handling, api-filtering-sorting, api-gateway-configuration
- api-pagination, api-rate-limiting, api-reference-documentation
- api-response-optimization, api-testing, api-versioning-strategy
- rest-api-design, api-authentication, api-security-hardening

##### **Security** (7 plugins, 7 skills)
- access-control-rbac, api-security-hardening, csrf-protection
- defense-in-depth-validation, security-headers-configuration
- vulnerability-scanning, xss-prevention

##### **Auth** (4 plugins, 4 skills)
- better-auth, api-authentication, oauth-implementation, session-management

##### **Database & ORM** (4 plugins, 4 skills)
- database-schema-design, database-sharding
- drizzle-orm-d1, sql-query-optimization

##### **Content Management** (2 plugins, 2 skills)
- content-collections, hugo

##### **MCP & Integration** (4 plugins, 4 skills)
- typescript-mcp, fastmcp, mcp-dynamic-orchestrator, mcp-management

##### **Testing** (6 plugins, 6 skills)
- jest-generator, playwright, vitest-testing
- mutation-testing, test-quality-analysis, api-testing

##### **Mobile** (5 plugins, 5 skills)
- react-native-skills, mobile-app-debugging, mobile-app-testing, mobile-offline-support
- app-store-deployment

##### **Architecture & Patterns** (3 plugins, 3 skills)
- architecture-patterns, microservices-patterns, technical-specification

##### **SEO & Web Performance** (4 plugins, 4 skills)
- seo-optimizer, seo-keyword-cluster-builder, web-performance-optimization, web-performance-audit

##### **ML & Data** (5 plugins, 5 skills)
- ml-model-training, ml-pipeline-automation, model-deployment
- recommendation-engine, recommendation-system

##### **WordPress & WooCommerce** (5 plugins, 5 skills)
- wordpress-plugin-core
- woocommerce-backend-dev, woocommerce-code-review, woocommerce-copy-guidelines, woocommerce-dev-cycle

##### **Tooling & Dev Workflow** (remaining plugins)
- code-review, dependency-upgrade, verification-before-completion
- github-project-automation, claude-code-bash-patterns, claude-hook-writer
- systematic-debugging, root-cause-tracing, sequential-thinking
- feature-dev, design-review, plan-interview
- firecrawl-scraper, chrome-devtools, turborepo
- internationalization-i18n, logging-best-practices, idempotency-handling
- graphql-implementation, websocket-implementation, health-check-endpoints
- payment-gateway-integration, app-store-deployment
- progressive-web-app, push-notification-setup
- image-optimization

---

### `schemas/` (11.5KB, 2 files)

JSON Schema validation files for plugin and marketplace manifests.

```
schemas/
├── marketplace.schema.json  # Marketplace JSON schema
└── plugin.schema.json       # Plugin JSON schema
```

**Usage**: Validated by `scripts/validate-json-schemas.sh` and `.github/workflows/validate-json-schemas.yml`.

---

### `scripts/` (114.2KB, 16 files + lib/)

Automation and utility scripts for managing skills and plugins.

```
scripts/
├── lib/                           # Shared script libraries
│   └── categorize.sh              # Plugin categorization helper
├── sync-plugins.sh                # Main entry point - syncs all plugin data
├── generate-marketplace.sh        # Generate marketplace.json
├── install-skill.sh               # Install single skill to ~/.claude/skills/
├── install-all.sh                 # Install all skills
├── check-versions.sh              # Verify package versions are current
├── review-skill.sh                # Automated skill review
├── audit-keywords.sh              # Audit keyword quality
├── baseline-audit-all.sh          # Baseline validation for all skills
├── release-check.sh               # Pre-release verification
├── validate-frontmatter.sh        # Validate YAML frontmatter in SKILL.md files
├── validate-json-schemas.sh       # Validate plugin.json against schemas
├── remove-category-from-plugins.sh # Remove category field from plugin manifests
├── extract-keywords.rb            # Extract keywords from SKILL.md descriptions (Ruby)
├── fix-frontmatter.mjs            # Repair YAML frontmatter programmatically (Node)
└── renumber-skills.py             # Renumber skill ordering (Python)
```

**Key Scripts**:
- `sync-plugins.sh` - **Main workflow**: Sync versions, categories, keywords, agents, commands
- `install-skill.sh` - Test individual skills locally
- `generate-marketplace.sh` - Rebuild marketplace.json (called by sync-plugins.sh)
- `baseline-audit-all.sh` - Validate all 197 skills

---

### `templates/` (22.2KB, 7 files)

Templates for creating new skills.

```
templates/
├── skill-skeleton/                    # Complete skill directory structure
│   ├── skills/
│   │   └── skill-name/                # Placeholder skill directory (rename to <skill-name>)
│   │       ├── assets/                # Asset directory (with example template)
│   │       ├── references/            # Reference docs directory (with example)
│   │       ├── scripts/               # Scripts directory (with example)
│   │       └── SKILL.md               # Main skill template with TODOs
│   └── README.md                      # Template usage instructions
├── README-TEMPLATE.md                 # Standalone README template
└── SKILL-TEMPLATE.md                  # Standalone SKILL template
```

**Note**: The skeleton ships only the `skills/<skill-name>/` subtree. When wiring up a real plugin, add the parent `.claude-plugin/plugin.json` and plugin-level `README.md` (see "Standard Skill Structure" below).

**Usage**:
```bash
cp -r templates/skill-skeleton/skills/skill-name/ plugins/<plugin-name>/skills/<skill-name>/
# Rename skill-name/ to your actual skill name
# Fill in TODOs in SKILL.md
# Add .claude-plugin/plugin.json at plugins/<plugin-name>/ root
```

---

## Root Documentation Files

```
claude-skills/
├── CHANGELOG.md               # Version history
├── CLAUDE.md                  # Project context for Claude Code
├── LICENSE                    # MIT License
├── MARKETPLACE.md             # Marketplace overview
├── PROJECT_STRUCTURE.md       # This file
├── README.md                  # Public repository overview
├── package.json               # Node package config
└── plan.md                    # Planning notes
```

**Navigation**:
- **New to repo?** → Read [docs/getting-started/START_HERE.md](docs/getting-started/START_HERE.md)
- **Building skills?** → Read [docs/getting-started/QUICK_WORKFLOW.md](docs/getting-started/QUICK_WORKFLOW.md)
- **Verifying work?** → Read [docs/getting-started/ONE_PAGE_CHECKLIST.md](docs/getting-started/ONE_PAGE_CHECKLIST.md)
- **Project context?** → Read [CLAUDE.md](CLAUDE.md)

---

## Standard Skill Structure

Every production skill follows this canonical structure:

```
<plugin-name>/
├── .claude-plugin/
│   └── plugin.json              # Auto-generated manifest
│       {
│         "name": "skill-name",
│         "description": "...",
│         "version": "3.3.0",
│         "keywords": [...],
│         "agents": [],
│         "commands": []
│       }
│
├── README.md                    # Plugin-level public documentation
│
└── skills/
    └── <skill-name>/
        ├── SKILL.md             # Main skill content (<500 lines)
        │   ---
        │   name: skill-name
        │   description: Brief description with "Use when" scenarios
        │   license: MIT
        │   ---
        │
        │   ## Quick Start
        │   ## When to Load References (how to use references/)
        │   ## Top 3-5 Errors (most critical issues)
        │   ## [Condensed sections with pointers to references/]
        │
        ├── README.md            # Public documentation
        │   (Auto-trigger keywords, installation, examples)
        │
        ├── references/          # Extended documentation (loaded as needed)
        │   ├── setup-guide.md
        │   ├── advanced-features.md
        │   ├── error-catalog.md
        │   ├── troubleshooting.md
        │   └── [domain-specific].md
        │
        ├── templates/           # Code templates
        │   ├── basic-setup.ts
        │   ├── advanced-example.tsx
        │   └── package.json
        │
        ├── scripts/             # Helper scripts
        │   ├── setup.sh
        │   ├── check-versions.sh
        │   └── install-dependencies.sh
        │
        └── assets/              # Images, diagrams, data
            ├── architecture-diagram.png
            └── sample-data.json
```

---

## File Type Distribution

**Total**: 2,712 files across 20.9MB

| Extension | Count | Purpose |
|-----------|-------|---------|
| `.md` | 1,419 | Documentation (SKILL.md, README.md, references/) |
| `.ts` | 281 | TypeScript templates and examples |
| `.json` | 214 | Config files (plugin.json, package.json, schemas) |
| `.sh` | 137 | Shell scripts for automation |
| `.html` | 123 | HTML templates and examples |
| `.js` | — | JavaScript examples, scripts, and helpers |
| `.tsx` | — | React component templates |
| Other | — | CSS, Python, Ruby, Swift, YAML, PHP, config files |

---

## Dependency Flow

Generated by `codemap --deps`:

**JavaScript Dependencies**: ai, openai, anthropic, google, workers-ai-provider, zod, react, react-dom, next, tailwindcss, vite, eslint, puppeteer, claude-agent-sdk, vitest, workers-types, wrangler, hono, cloudflare, drizzle-orm, drizzle-kit, playwright, bun, react-hook-form, react-query, react-router, react-table, genui-sdk, postcss, autoprefixer

**Python Dependencies**: fastmcp, httpx, python-dotenv, pydantic, openai, fastapi, uvicorn, flask, flask-cors

**Import Hubs** (most-referenced files):
1. `plugins/drizzle-orm-d1/.../templates/schema` (5 importers)
2. `plugins/chrome-devtools/.../scripts/lib/browser` (5 importers)
3. `plugins/chrome-devtools/.../scripts/lib/selector` (3 importers)
4. `plugins/mcp-dynamic-orchestrator/.../src/orchestrator` (2 importers)
5. `plugins/tanstack-query/.../examples/react-native` (2 importers)

**Stats**: 562 files, 5,900 functions, 21 dependencies

---

## Plugin vs Skill Distinction

This repository uses a two-tier architecture:

### 156 Plugins (Marketplace Categories)
- **What**: Logical groupings of related skills
- **Where**: `plugins/<plugin-name>/`
- **Purpose**: Organize skills by domain for discoverability
- **Discovery**: Listed in `.claude-plugin/marketplace.json`
- **Installation**: `/plugin install <plugin-name>@claude-skills`

### 197 Skills (Individual Capabilities)
- **What**: Individual knowledge units Claude loads
- **Where**: `plugins/<plugin-name>/skills/<skill-name>/`
- **Purpose**: Provide specific domain expertise
- **Discovery**: Auto-loaded when relevant to user tasks
- **Content**: SKILL.md, templates, references, scripts

**Example**:
```
Plugin: "bun" (1 of 156)
  ↓ contains
Skills: bun-bundler, bun-cloudflare-workers, bun-docker, ... (27 total)

Plugin: "cloudflare-workers" (1 of 156)
  ↓ contains
Skills: workers-runtime-apis, workers-security, workers-performance, ... (10 total)
```

---

## Key Workflows

### 1. Creating a New Skill

```bash
# Copy template
cp -r templates/skill-skeleton/skills/skill-name/ plugins/<plugin>/skills/<skill-name>/

# Edit SKILL.md and README.md (fill TODOs)
# Add templates, references, scripts

# Test locally
./scripts/install-skill.sh <skill-name>

# Sync plugin data
./scripts/sync-plugins.sh

# Commit
git add plugins/<plugin>/skills/<skill-name>
git commit -m "Add <skill-name> skill"
```

### 2. Updating Marketplace

```bash
# Automatic (recommended)
./scripts/sync-plugins.sh

# Manual (if needed)
./scripts/generate-marketplace.sh
```

### 3. Quality Verification

```bash
# Check package versions
./scripts/check-versions.sh plugins/<plugin>/skills/<skill-name>/

# Review skill quality
./scripts/review-skill.sh <skill-name>

# Baseline audit
./scripts/baseline-audit-all.sh

# Validate frontmatter
./scripts/validate-frontmatter.sh

# Validate JSON schemas
./scripts/validate-json-schemas.sh
```

### 4. Installing Skills Locally

```bash
# Single skill
./scripts/install-skill.sh <skill-name>

# All skills
./scripts/install-all.sh

# Verify
ls -la ~/.claude/skills/
```

---

## Browsing the Repository

### Using codemap

```bash
# Full tree
codemap .

# Limit depth
codemap --depth 2 .

# Show dependencies
codemap --deps .

# Files changed vs main
codemap --diff

# Check importers
codemap --importers <file>

# Filter by extension
codemap --only ts,tsx,md .
```

### Using find

```bash
# All SKILL.md files
find plugins -name "SKILL.md"

# All plugin.json manifests
find plugins -name "plugin.json"

# All templates
find plugins -name "templates" -type d

# TypeScript templates
find plugins/*/skills/*/templates -name "*.ts"
```

---

## Common Paths

**Frequently accessed locations**:

| Path | Description |
|------|-------------|
| `plugins/bun/` | Bun skills (27 skills) |
| `plugins/cloudflare-workers/` | Cloudflare Workers skills (10 skills) |
| `plugins/cloudflare-d1/` | Cloudflare D1 database skill |
| `plugins/nextjs/` | Next.js skill |
| `plugins/better-auth/` | Better Auth skill (largest single-skill plugin) |
| `templates/skill-skeleton/` | New skill template |
| `scripts/sync-plugins.sh` | Main sync script |
| `.claude-plugin/marketplace.json` | Marketplace manifest |
| `docs/reference/claude-code-skill-standards.md` | Standards |
| `docs/getting-started/ONE_PAGE_CHECKLIST.md` | Quality checklist |
| `schemas/plugin.schema.json` | Plugin JSON schema |
| `.github/workflows/` | CI validation workflows |

---

## Statistics Summary

**Repository**:
- Total Size: 20.9MB (2,712 files)
- Total Plugins: 156
- Total Skills: 197
- Marketplace Version: 3.4.0

**File Types** (top 5 by count):
- Markdown: 1,419 files (documentation)
- TypeScript: 281 files (templates)
- JSON: 214 files (config)
- Shell: 137 files (automation)
- HTML: 123 files (templates)

**Skills by Category**:
- Cloudflare: 30 skills (21 plugins)
- Bun: 27 skills (1 plugin)
- AI/ML: 20 skills (20 plugins)
- Nuxt: 12 skills (6 plugins)
- API: 15 skills (15 plugins)
- Frontend & UI: 30+ skills
- Database: 8 skills (8 plugins)
- Testing: 6 skills (6 plugins)
- Mobile: 5 skills (5 plugins)
- ML/Data: 5 skills (5 plugins)
- Security: 7 skills (7 plugins)
- Auth: 4 skills (4 plugins)
- SEO/Perf: 4 skills (4 plugins)
- WooCommerce: 4 skills (5 plugins with WordPress core)
- Swift: 2 skills (2 plugins)

**Largest Plugins** (by file count):
1. playwright (539 files, 13MB)
2. hugo (423 files, 6.7MB)
3. cloudflare-workers (119 files, 1.3MB)
4. nuxt-ui-v4 (78 files, 656KB)
5. react-best-practices (65 files, 328KB)
6. cloudflare-images (63 files, 640KB)
7. cloudflare-durable-objects (49 files, 632KB)
8. maz-ui (46 files, 668KB)
9. bun (46 files, 324KB)
10. better-auth (45 files, 500KB)

---

## Next Steps

1. **First time here?** → Read [docs/getting-started/START_HERE.md](docs/getting-started/START_HERE.md)
2. **Want to create a skill?** → Read [docs/getting-started/QUICK_WORKFLOW.md](docs/getting-started/QUICK_WORKFLOW.md)
3. **Need project context?** → Read [CLAUDE.md](CLAUDE.md)
4. **Quality verification?** → Read [docs/getting-started/ONE_PAGE_CHECKLIST.md](docs/getting-started/ONE_PAGE_CHECKLIST.md)

---

**Last Updated**: 2026-06-21
**Generated with**: [codemap](https://github.com/JordanCoin/codemap)
**Maintained by**: Claude Skills Team
