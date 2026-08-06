# Claude Skills - Project Structure

**Generated**: 2026-08-05
**Repository**: https://github.com/secondsky/claude-skills

---

## Repository Overview

**Total Size**: 20.0MB | **Files**: 2,495
**Top File Types**: `.md` (1,330), `.ts` (234), `.json` (197), `.html` (122), `.sh` (121)

This document provides a comprehensive overview of the claude-skills repository structure, generated using [codemap](https://github.com/JordanCoin/codemap).

> Counts above are codemap's tracked view (respects `.gitignore`, excludes `node_modules/`, `.git/`, and the local-only `.audit/`, `.superpowers/`, `.zcode/`, `.worktrees/` directories). See [File Type Distribution](#file-type-distribution) for a fuller enumeration including assets.

---

## Top-Level Structure

```
claude-skills/
├── .claude-plugin/          # Plugin marketplace configuration
├── .githooks/               # Git hooks (pre-commit, pre-push)
├── .github/                 # GitHub CI workflows & issue templates
├── docs/                    # Documentation (6 subdirectories)
├── plans/                   # In-progress skill planning docs
├── plugins/                 # 142 plugin directories containing 183 skills
├── schemas/                 # JSON schema validation files
├── scripts/                 # Automation & utility scripts
├── templates/               # Skill creation templates
└── *.md                     # Root documentation files
```

---

## Directory Details

### `.claude-plugin/` (78.6KB, 12 files)

Plugin marketplace configuration for Claude Code.

```
.claude-plugin/
├── marketplace.json                 # Main marketplace manifest (142 plugins)
└── marketplace.json.backup-*        # 11 timestamped backups
```

**Purpose**: Defines 142 plugins containing 183 skills for Claude Code's plugin marketplace. Marketplace `.metadata.version`, all 142 plugin entries, all 142 `plugin.json` manifests, and `package.json` are lockstep at **3.6.0**.

---

### `.githooks/` (9.4KB, 3 files)

Custom Git hooks for repository quality enforcement.

```
.githooks/
├── README.md                # Git hooks documentation
├── pre-commit               # Pre-commit validation
└── pre-push                 # Pre-push checks
```

---

### `.github/` (39.5KB, 13 files)

GitHub configuration for CI/CD and issue management.

```
.github/
├── ISSUE_TEMPLATE/          # Issue templates (8 files)
│   ├── config.yml
│   ├── marketplace-issue.yml
│   ├── new-skill-proposal.yml
│   ├── security-advisory.md
│   ├── skill-bug-report.yml
│   ├── skill-documentation.yml
│   ├── skill-enhancement.yml
│   └── skill-optimization.yml
├── workflows/               # GitHub Actions (4 files)
│   ├── codeql.yml
│   ├── dependency-review.yml
│   ├── validate-frontmatter.yml
│   └── validate-json-schemas.yml
└── dependabot.yml
```

**Purpose**: Automated CI for YAML frontmatter, JSON schema validation, CodeQL security scanning, and dependency review; plus structured issue templates for skill proposals, bug reports, and security advisories.

---

### `docs/` (372.4KB, 25 files across 6 subdirectories)

Comprehensive documentation organized by purpose.

```
docs/
├── archive/                            # Archived documents
│   └── lost-info.md                    # Information recovery tracking
├── getting-started/                    # Onboarding guides (3 files, 28.2KB)
│   ├── ONE_PAGE_CHECKLIST.md           # Quality verification checklist
│   ├── QUICK_WORKFLOW.md               # 5-minute skill creation guide
│   └── START_HERE.md                   # First-time user guide
├── guides/                             # Process guides (5 files, 76.2KB)
│   ├── CONTRIBUTING.md                 # Contribution guidelines
│   ├── ISSUE_TEMPLATES_GUIDE.md        # Issue template usage
│   ├── MARKETPLACE_MANAGEMENT.md       # Marketplace management details
│   ├── PLUGIN_DEV_BEST_PRACTICES.md    # Plugin development best practices
│   └── PLUGIN_SECURITY_REVIEW.md       # Plugin security review process
├── reference/                          # Standards & reference (5 files, 44.7KB)
│   ├── COMMON_MISTAKES.md              # Learn from past failures
│   ├── SKILL_CATEGORIZATION.md         # Skill organization system
│   ├── STANDARDS_COMPARISON.md         # Official vs our standards
│   ├── claude-code-skill-standards.md  # Our skill standards
│   └── research-protocol.md            # Research methodology
├── security-audit/                     # v3.6.0 dependency audit (8 files, 170.5KB)
│   ├── DEPENDENCY-AUDIT-2026-08-03.md  # Audit report (2026-08-03)
│   ├── REPORT.md                       # Summary report
│   └── findings/                       # 6 audit tracks
│       ├── track-a-hooks.md
│       ├── track-b-subprocess.md
│       ├── track-c-secrets.md
│       ├── track-d-filesystem.md
│       ├── track-e-cicd.md
│       └── track-f-content.md
└── validation/                         # Validation docs (3 files, 31.9KB)
    ├── IMPLEMENTATION.md               # Implementation details
    ├── README.md                       # Validation overview
    └── json-schema-validation.md       # JSON schema validation guide
```

**Key Documents**:
- `getting-started/START_HERE.md` - New user onboarding
- `reference/claude-code-skill-standards.md` - Primary standards reference
- `reference/STANDARDS_COMPARISON.md` - Alignment with official Anthropic standards
- `security-audit/REPORT.md` - v3.6.0 dependency audit findings

---

### `plans/` (150.8KB, 12 files)

In-progress planning documents for skills under development.

```
plans/
├── README.md                # Plans index
└── cybersecurity-skill/     # Cybersecurity skill spec (11 files)
```

---

### `plugins/` (19.0MB, 2,403 files)

**142 plugins** organizing **183 individual skills** by domain.

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
| **nuxt-v4** | 4 | Nuxt 4 core, data, production, server |
| **nuxt-v5** | 4 | Nuxt 5 core, data, production, server |

All other 138 plugins contain exactly 1 skill. The 4 multi-skill plugins contribute 45 of the 183 SKILL.md files; the remaining 138 plugins contribute the other 138 (183 total).

#### Plugin Categories (142 plugins)

Official `category` field distribution (from `marketplace.json`): frontend (26), tooling (24), cloudflare (21), api (16), web (10), ai (7), security (6), mobile (5), woocommerce (4), testing (4), design (4), auth (4), architecture (3), seo (2), data (2), cms (2), documentation (1), database (1).

##### **Cloudflare** (21 plugins, 30 skills)
- cloudflare-workers (10 skills), cloudflare-d1, cloudflare-r2, cloudflare-kv
- cloudflare-workers-ai, cloudflare-vectorize, cloudflare-queues, cloudflare-workflows
- cloudflare-durable-objects, cloudflare-agents, cloudflare-mcp-server, cloudflare-turnstile
- cloudflare-nextjs, cloudflare-cron-triggers, cloudflare-email-routing
- cloudflare-hyperdrive, cloudflare-images, cloudflare-browser-rendering
- cloudflare-zero-trust-access, cloudflare-manager, cloudflare-sandbox

##### **Bun** (1 plugin, 27 skills)
- bun (bundler, cloudflare-workers, docker, drizzle-integration, ffi, file-io, hono-integration, hot-reloading, http-server, jest-migration, macros, nextjs, nuxt, package-manager, react-ssr, redis, runtime, shell, sqlite, sveltekit, tanstack-start, test-basics, test-coverage, test-lifecycle, test-mocking, websocket-server, workers)

##### **API** (16 plugins, 16 skills)
- api-authentication, api-changelog-versioning, api-contract-testing, api-design-principles
- api-error-handling, api-filtering-sorting, api-gateway-configuration
- api-pagination, api-rate-limiting, api-reference-documentation
- api-response-optimization, api-security-hardening, api-testing
- api-versioning-strategy, rest-api-design, security-headers-configuration

##### **AI & Machine Learning** (7 plugins, 7 skills)
- gemini-cli, multi-ai-consultant
- thesys-generative-ui, tanstack-ai
- ml-model-training, ml-pipeline-automation, model-deployment

##### **Nuxt** (6 plugins, 12 skills)
- nuxt-v4 (4 skills), nuxt-v5 (4 skills), nuxt-ui-v4, nuxt-content, nuxt-seo, nuxt-studio

##### **Frontend & UI** (26 plugins)
- **Component Libraries**: tailwind-v4-shadcn, shadcn-vue, aceternity-ui, inspira-ui, base-ui-react, maz-ui
- **Animation**: auto-animate, motion
- **State Management**: zustand-state-management, pinia-v3, pinia-colada
- **React**: react-best-practices, react-composition-patterns, react-hook-form-zod
- **Design**: frontend-design, design-review, design-system-creation, interaction-design, kpi-dashboard-design, mobile-first-design, responsive-web-design
- **3D**: threejs
- **Tooling**: ultracite, zod

##### **Next.js & Frameworks** (5 plugins)
- nextjs, hono-routing, tanstack-query, tanstack-router, tanstack-start, tanstack-table

##### **Security** (6 plugins, 6 skills)
- csrf-protection, defense-in-depth-validation
- security-headers-configuration, vulnerability-scanning, xss-prevention
- cybersecurity

##### **Auth** (4 plugins, 4 skills)
- better-auth, oauth-implementation, session-management (plus api-authentication, listed under API)

##### **Database & ORM** (1 plugin, 1 skill)
- drizzle-orm-d1

##### **Content Management** (2 plugins, 2 skills)
- hugo, wordpress-plugin-core

##### **MCP & Integration** (2 plugins, 2 skills)
- mcp-dynamic-orchestrator, mcp-management

##### **Testing** (4 plugins, 4 skills)
- jest-generator, playwright, vitest-testing
- mutation-testing, test-quality-analysis (plus api-testing, listed under API)

##### **Mobile** (5 plugins, 5 skills)
- react-native-skills, mobile-app-debugging, mobile-app-testing, mobile-offline-support
- app-store-deployment

##### **Architecture & Patterns** (3 plugins, 3 skills)
- architecture-patterns, microservices-patterns, technical-specification

##### **SEO & Web Performance** (4 plugins, 4 skills)
- seo-optimizer, seo-keyword-cluster-builder, web-performance-optimization, web-performance-audit

##### **ML & Data** (5 plugins, 5 skills)
- recommendation-engine, recommendation-system
- (also ml-model-training, ml-pipeline-automation, model-deployment listed under AI/ML)

##### **WordPress & WooCommerce** (5 plugins, 5 skills)
- woocommerce-backend-dev, woocommerce-code-review, woocommerce-copy-guidelines, woocommerce-dev-cycle
- (plus wordpress-plugin-core, listed under CMS)

##### **Tooling & Dev Workflow** (remaining plugins)
- code-review, dependency-upgrade
- github-project-automation, claude-code-bash-patterns, claude-hook-writer
- systematic-debugging, root-cause-tracing, sequential-thinking
- feature-dev, design-review, plan-interview
- firecrawl-scraper, turborepo
- internationalization-i18n, logging-best-practices, idempotency-handling
- graphql-implementation, websocket-implementation, health-check-endpoints
- payment-gateway-integration, delegate-my-work, typescript-migration
- progressive-web-app, push-notification-setup
- image-optimization, nano-banana-prompts

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

### `scripts/` (126.3KB, 16 files + lib/)

Automation and utility scripts for managing skills and plugins.

```
scripts/
├── lib/                           # Shared script libraries
│   └── categorize.sh              # Plugin categorization helper
├── sync-plugins.sh                # Main entry point - syncs all plugin data
├── generate-marketplace.sh        # Generate marketplace.json
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
- `generate-marketplace.sh` - Rebuild marketplace.json (called by sync-plugins.sh)
- `review-skill.sh` - Automated single-skill review
- `baseline-audit-all.sh` - Validate all 183 skills

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
├── SECURITY.md                # Security policy
├── package.json               # Node package config
├── package-lock.json          # Lockfile
├── skills-lock.json           # External skill lockfile (e.g. grill-me)
├── .gitignore                 # Ignored paths
└── .gitleaks.toml             # Secret-scanning config
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
│         "version": "3.6.0",
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

**Total**: 2,495 files across 20.0MB (codemap tracked view)

| Extension | Count | Purpose |
|-----------|-------|---------|
| `.md` | 1,330 | Documentation (SKILL.md, README.md, references/) |
| `.ts` | 234 | TypeScript templates and examples |
| `.json` | 197 | Config files (plugin.json, package.json, schemas) |
| `.html` | 122 | HTML templates and examples |
| `.sh` | 121 | Shell scripts for automation |
| `.js` | — | JavaScript examples, scripts, and helpers |
| `.tsx` | — | React component templates |
| `.yaml`/`.yml` | — | CI/CD and config files |
| `.vue` | — | Vue component templates (Nuxt plugins) |
| `.css` | — | Stylesheet templates |
| Other | — | Python, Ruby, Swift, PHP, fonts, images, data files |

> Full filesystem enumeration (excluding `node_modules/`, `.git/`, and local-only dirs) shows additional asset types: `.ttf` (22), `.woff2` (20), `.woff` (20), `.jsonc` (30), `.vue` (37), `.css` (31). Markdown is the dominant content type.

---

## Dependency Flow

Generated by `codemap --deps`:

**JavaScript Dependencies**: ajv-cli, ajv-formats, workers-types, wrangler, typescript, hono, cloudflare-worker-jwt, sdk, agents, zod, next, react, react-dom, cloudflare, node, eslint, eslint-config-next, drizzle-orm, drizzle-kit, tsx, bun, react-hook-form, vite, plugin-react, react-query, react-query-devtools, react-router, router-devtools, router-plugin, react-table, match-sorter-utils, react-virtual, genui-sdk, react-ui, react-core, stream, react-error-boundary, openai, zod-to-json-schema, tailwindcss, postcss, autoprefixer, vitest, playwright

**Python Dependencies**: thesys-genui-sdk, openai, python-dotenv, fastapi, uvicorn, pydantic, flask, flask-cors, python-multipart

**Import Hubs** (most-referenced files):
1. `plugins/drizzle-orm-d1/skills/drizzle-orm-d1/templates/schema` (5 importers)
2. `plugins/mcp-dynamic-orchestrator/src/orchestrator` (2 importers)

**Stats**: 402 files · 5,261 functions · 10 dependency roots

---

## Plugin vs Skill Distinction

This repository uses a two-tier architecture:

### 142 Plugins (Marketplace Categories)
- **What**: Logical groupings of related skills
- **Where**: `plugins/<plugin-name>/`
- **Purpose**: Organize skills by domain for discoverability
- **Discovery**: Listed in `.claude-plugin/marketplace.json`
- **Installation**: `/plugin install <plugin-name>@claude-skills`

### 183 Skills (Individual Capabilities)
- **What**: Individual knowledge units Claude loads
- **Where**: `plugins/<plugin-name>/skills/<skill-name>/`
- **Purpose**: Provide specific domain expertise
- **Discovery**: Auto-loaded when relevant to user tasks
- **Content**: SKILL.md, templates, references, scripts

**Example**:
```
Plugin: "bun" (1 of 142)
  ↓ contains
Skills: bun-bundler, bun-cloudflare-workers, bun-docker, ... (27 total)

Plugin: "cloudflare-workers" (1 of 142)
  ↓ contains
Skills: cloudflare-workers-runtime-apis, cloudflare-workers-security, cloudflare-workers-performance, ... (10 total)
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
/plugin install <skill-name>@claude-skills

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
# Single skill (Claude Code)
/plugin install <skill-name>@claude-skills

# Cross-harness (Cursor, opencode, Gemini CLI, ...)
npx skills add secondsky/claude-skills --skill <skill-name>

# Codex CLI (native marketplace — .codex-plugin/ manifests for all 142 plugins)
codex plugin marketplace add secondsky/claude-skills
# Then /plugins in the Codex TUI to browse/install

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
| `plugins/better-auth/` | Better Auth skill (largest single-skill plugin by file count) |
| `templates/skill-skeleton/` | New skill template |
| `scripts/sync-plugins.sh` | Main sync script |
| `.claude-plugin/marketplace.json` | Marketplace manifest |
| `docs/reference/claude-code-skill-standards.md` | Standards |
| `docs/getting-started/ONE_PAGE_CHECKLIST.md` | Quality checklist |
| `docs/security-audit/REPORT.md` | v3.6.0 dependency audit |
| `schemas/plugin.schema.json` | Plugin JSON schema |
| `.github/workflows/` | CI validation workflows |

---

## Statistics Summary

**Repository**:
- Total Size: 20.0MB (2,495 files, codemap tracked view)
- Total Plugins: 142
- Total Skills: 183
- Plugin/Package Version: 3.6.0

**File Types** (top 5 by count, codemap view):
- Markdown: 1,330 files (documentation)
- TypeScript: 234 files (templates)
- JSON: 197 files (config)
- HTML: 122 files (templates)
- Shell: 121 files (automation)

**Skills by Category** (from marketplace.json `category` field):
- Frontend: 26 plugins
- Tooling: 24 plugins
- Cloudflare: 21 plugins (30 skills)
- API: 16 plugins
- Web: 10 plugins
- AI: 7 plugins
- Security: 6 plugins
- Mobile: 5 plugins
- WooCommerce: 4 plugins
- Testing: 4 plugins
- Design: 4 plugins
- Auth: 4 plugins
- Architecture: 3 plugins
- SEO: 2 plugins
- Data: 2 plugins
- CMS: 2 plugins
- Documentation: 1 plugin
- Database: 1 plugin

**Largest Plugins** (by file count):
1. playwright (539 files, 13MB)
2. hugo (423 files, 6.7MB)
3. cloudflare-workers (119 files, 1.4MB)
4. nuxt-ui-v4 (78 files, 656KB)
5. react-best-practices (65 files, 154KB)
6. cloudflare-images (63 files, 648KB)
7. cloudflare-durable-objects (49 files, 636KB)
8. maz-ui (46 files, 668KB)
9. bun (46 files, 248KB)
10. better-auth (45 files, 504KB)

---

## Next Steps

1. **First time here?** → Read [docs/getting-started/START_HERE.md](docs/getting-started/START_HERE.md)
2. **Want to create a skill?** → Read [docs/getting-started/QUICK_WORKFLOW.md](docs/getting-started/QUICK_WORKFLOW.md)
3. **Need project context?** → Read [CLAUDE.md](CLAUDE.md)
4. **Quality verification?** → Read [docs/getting-started/ONE_PAGE_CHECKLIST.md](docs/getting-started/ONE_PAGE_CHECKLIST.md)

---

**Last Updated**: 2026-08-05
**Generated with**: [codemap](https://github.com/JordanCoin/codemap)
**Maintained by**: Claude Skills Team
