# Claude Skills - Project Structure

**Generated**: 2025-12-22
**Repository**: https://github.com/secondsky/claude-skills

---

## Repository Overview

**Total Size**: 19.8MB | **Files**: 2,588
**Top File Types**: `.md` (1,156), `.ts` (337), `.json` (299), `.html` (127), `.sh` (124)

This document provides a comprehensive overview of the claude-skills repository structure, generated using [codemap](https://github.com/JordanCoin/codemap).

---

## Top-Level Structure

```
claude-skills/
├── .claude-plugin/          # Plugin marketplace configuration
├── commands/                # Slash commands for Claude Code CLI
├── docs/                    # Additional documentation
├── examples/                # Working example projects
├── planning/                # Planning & research documents
├── plugins/                 # 58 plugin directories containing 169 skills
├── scripts/                 # Automation & utility scripts
├── skills-review/           # Quality review documentation
├── templates/               # Skill creation templates
└── *.md                     # Root documentation files
```

---

## Directory Details

### `.claude-plugin/` (181.3KB, 2 files)

Plugin marketplace configuration for Claude Code.

```
.claude-plugin/
├── marketplace.json         # Main marketplace manifest (255KB)
└── marketplace.json.backup  # Backup of marketplace
```

**Purpose**: Defines 58 plugins containing 169 skills for Claude Code's plugin marketplace.

---

### `commands/` (102.8KB, 8 files)

Slash commands for interactive Claude Code workflows.

```
commands/
├── README.md               # Command documentation
├── continue-session.md     # Resume previous work sessions
├── explore-idea.md         # Pre-planning exploration
├── plan-feature.md         # Feature planning workflow
├── plan-project.md         # Project planning generator
├── release.md              # Pre-release safety checks
├── workflow.md             # Interactive guidance
└── wrap-session.md         # Session checkpoint/summary
```

**Usage**: Type `/plan-project`, `/explore-idea`, etc. in Claude Code CLI.

---

### `docs/` (49.5KB, 1 file)

Additional documentation resources.

```
docs/
└── skills_workflow.md      # Skill development workflow guide
```

---

### `examples/` (463.6KB, 18 files)

Working example projects demonstrating skill usage.

```
examples/
└── cloudflare-worker-base-test/
    ├── public/             # Static assets (HTML, CSS, JS)
    ├── src/                # TypeScript source (index.ts)
    ├── test/               # Test files (Vitest)
    ├── package.json        # Dependencies
    ├── wrangler.jsonc      # Cloudflare Worker configuration
    ├── vite.config.ts      # Vite build configuration
    └── vitest.config.mts   # Vitest test configuration
```

**Purpose**: Production-ready examples that validate skill templates and patterns.

---

### `planning/` (183.7KB, 13 files)

Planning documents, research protocols, and standards.

```
planning/
├── COMMON_MISTAKES.md                # Learn from past failures
├── COMPLETED_REVIEWS.md              # Completed skill reviews log
├── MIGRATION_GUIDE.md                # Migration documentation
├── SKILL_CATEGORIZATION.md           # Skill organization system
├── SKILL_COUNT_RECONCILIATION.md     # Plugin/skill count tracking
├── SKILL_REVIEW_PROCESS.md           # Review workflow
├── SKILLS_REVIEW_PROGRESS.md         # Review progress tracking
├── STANDARDS_COMPARISON.md           # Official vs our standards
├── claude-code-skill-standards.md    # Our skill standards
├── lost-info.md                      # Information recovery tracking
├── research-protocol.md              # Research methodology
├── subagent-workflow.md              # Subagent usage patterns
└── verification-checklist.md         # Quality verification checklist
```

**Key Documents**:
- `claude-code-skill-standards.md` - Primary standards reference
- `STANDARDS_COMPARISON.md` - Alignment with official Anthropic standards
- `research-protocol.md` - How to research new skills

---

### `plugins/` (18.2MB, 2,498 files)

**58 plugins** organizing **169 individual skills** by domain.

Each plugin follows this structure:
```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json         # Plugin manifest
├── scripts/                # Shared scripts (optional)
└── skills/                 # Individual skill directories
    └── <skill-name>/
        ├── .claude-plugin/
        │   └── plugin.json # Skill manifest
        ├── SKILL.md        # Main skill content
        ├── README.md       # Public documentation
        ├── references/     # Extended documentation
        ├── templates/      # Code templates
        ├── scripts/        # Helper scripts
        └── assets/         # Images, diagrams, data
```

#### Plugin Categories (58 plugins)

##### **Cloudflare** (3.1MB, 456 files, 23 skills)
- cloudflare-worker-base, cloudflare-d1, cloudflare-r2, cloudflare-kv
- cloudflare-workers-ai, cloudflare-vectorize, cloudflare-queues
- cloudflare-durable-objects, cloudflare-agents, cloudflare-mcp-server
- cloudflare-nextjs, cloudflare-cron-triggers, cloudflare-email-routing
- cloudflare-hyperdrive, cloudflare-images, cloudflare-browser-rendering
- cloudflare-turnstile, cloudflare-zero-trust-access, cloudflare-workflows
- cloudflare-full-stack-scaffold, cloudflare-full-stack-integration
- cloudflare-manager, cloudflare-sandbox

##### **AI Tools** (855.8KB, 139 files, 5 skills)
- ai-sdk-core, ai-sdk-ui
- elevenlabs-agents
- multi-ai-consultant, thesys-generative-ui

##### **OpenAI** (687.6KB, 106 files, 6 skills)
- openai-api, openai-agents, openai-assistants
- openai-responses, openai-real-time-api, openai-structured-outputs

##### **Google** (456.9KB, 72 files, 5 skills)
- google-gemini-api, google-gemini-embeddings
- google-gemini-file-search, gemini-cli, nano-banana-prompts

##### **Claude** (467.3KB, 73 files, 3 skills)
- claude-api, claude-agent-sdk, claude-code-bash-patterns

##### **Nuxt** (730.9KB, 106 files, 4 skills)
- nuxt-v4, nuxt-ui-v4, nuxt-content, nuxt-seo

##### **Tanstack** (342.2KB, 87 files, 4 skills)
- tanstack-query, tanstack-router, tanstack-start, tanstack-table

##### **Vercel** (261.6KB, 40 files, 3 skills)
- neon-vercel-postgres, vercel-kv, vercel-blob

##### **Database** (390.0KB, 63 files, 4 skills)
- database-schema-design, database-sharding
- drizzle-orm-d1, sql-query-optimization

##### **MCP** (511.2KB, 64 files, 4 skills)
- typescript-mcp, fastmcp, mcp-dynamic-orchestrator, mcp-management

##### **Testing** (35.5KB, 18 files, 5 skills)
- jest-generator, playwright-testing, vitest-testing
- mutation-testing, test-quality-analysis

##### **Security** (70.2KB, 23 files, 7 skills)
- access-control-rbac, api-security-hardening, csrf-protection
- defense-in-depth-validation, security-headers-configuration
- vulnerability-scanning, xss-prevention

##### **Auth** (322.9KB, 50 files, 5 skills)
- api-authentication, better-auth, clerk-auth
- oauth-implementation, session-management

##### **Content Management** (5.7MB, 467 files, 3 skills)
- sveltia-cms, content-collections, hugo

##### **API** (76.8KB, 33 files, 13 skills)
- api-changelog-versioning, api-contract-testing, api-design-principles
- api-error-handling, api-filtering-sorting, api-gateway-configuration
- api-pagination, api-rate-limiting, api-reference-documentation
- api-response-optimization, api-testing, api-versioning-strategy
- rest-api-design

##### **Architecture** (32.8KB, 10 files, 3 skills)
- architecture-patterns, microservices-patterns, technical-specification

##### **Chatbot** (202.2KB, 40 files, 3 skills)
- ai-elements-chatbot, better-chatbot, better-chatbot-patterns

##### **Design** (212.9KB, 31 files, 7 skills)
- design-review, frontend-design, interaction-design
- kpi-dashboard-design, mobile-first-design, responsive-web-design
- design-system-creation

##### **Machine Learning** (141.8KB, 16 files, 2 skills)
- recommendation-engine, recommendation-system

##### **Mobile** (22.8KB, 10 files, 2 skills)
- mobile-ui-implementer, react-native-app

##### **Project Management** (464.1KB, 67 files, 4 skills)
- project-planning, project-session-management, project-workflow
- feature-dev

##### **UI Components** (multiple plugins)
- **tailwind-v4-shadcn** (56.7KB, 15 files)
- **shadcn-vue** (107.2KB, 15 files)
- **aceternity-ui** (65.2KB, 6 files)
- **inspira-ui** (65.1KB, 10 files)
- **base-ui-react** (125.3KB, 19 files)
- **auto-animate** (91.0KB, 18 files)
- **motion** (196.3KB, 17 files)
- **ultracite** (125.9KB, 20 files)

##### **State Management**
- **zustand-state-management** (94.7KB, 23 files)
- **pinia** (222.1KB, 28 files, 2 skills: pinia-v3, pinia-colada)

##### **Other Notable Plugins**
- **nextjs** (209.0KB, 20 files)
- **react-hook-form-zod** (203.0KB, 23 files)
- **hono-routing** (175.6KB, 21 files)
- **zod** (125.6KB, 15 files)
- **firecrawl-scraper** (65.1KB, 10 files)
- **chrome-devtools** (37.1KB, 13 files)
- **turborepo** (103.4KB, 20 files)
- **wordpress-plugin-core** (273.9KB, 38 files)
- **woocommerce** (68.8KB, 25 files, 4 skills)
- **swift** (279.8KB, 27 files, 3 skills)
- **skill-review** (48.3KB, 7 files)
- **code-quality** (52.4KB, 20 files, 5 skills)
- **github-project-automation** (156.3KB, 38 files)
- **open-source-contributions** (95.4KB, 10 files)
- **seo** (58.2KB, 9 files, 2 skills)
- **recommendations** (166.1KB, 13 files, 2 skills)
- **internationalization** (8.9KB, 4 files)
- **logging-best-practices** (10.1KB, 4 files)
- **idempotency-handling** (6.5KB, 3 files)
- **web-performance** (27.8KB, 9 files, 3 skills)
- **websocket-implementation** (18.9KB, 4 files)
- **graphql-implementation** (8.5KB, 4 files)
- **health-check-endpoints** (10.1KB, 4 files)
- **payments** (10.7KB, 4 files)
- **app-store-deployment** (4.1KB, 3 files)

---

### `scripts/` (104.1KB, 15 files)

Automation and utility scripts for managing skills and plugins.

```
scripts/
├── sync-plugins.sh                # ⭐ Main entry point - syncs all plugin data
├── generate-marketplace.sh        # Generate marketplace.json
├── generate-plugin-manifests.sh   # [DEPRECATED] Use sync-plugins.sh
├── populate-keywords.sh           # [DEPRECATED] Use sync-plugins.sh
├── install-skill.sh               # Install single skill to ~/.claude/skills/
├── install-all.sh                 # Install all skills
├── check-versions.sh              # Verify package versions are current
├── review-skill.sh                # Automated skill review
├── audit-keywords.sh              # Audit keyword quality
├── baseline-audit-all.sh          # Baseline validation for all skills
├── release-check.sh               # Pre-release verification
├── count-npm-instances.sh         # Count npm vs bun usage
├── migrate-to-bun.sh              # Migrate to Bun runtime
├── migrate-to-bun-simple.sh       # Simple Bun migration
└── renumber-skills.py             # Renumber skill ordering
```

**Key Scripts**:
- `sync-plugins.sh` - **Main workflow**: Sync versions, categories, keywords, agents, commands
- `install-skill.sh` - Test individual skills locally
- `generate-marketplace.sh` - Rebuild marketplace.json (called by sync-plugins.sh)
- `baseline-audit-all.sh` - Validate all 169 skills

---

### `skills-review/` (224.7KB, 11 files)

Quality review reports and analysis.

```
skills-review/
├── MASTER_IMPLEMENTATION_PLAN.md               # Overall review strategy
├── NEW_APPROACH_SUMMARY.md                     # Updated review methodology
├── PHASE_5_ALTERNATIVES_AUDIT_PLAN.md          # Audit planning
├── SKILLS_BEST_PRACTICES_MASTER_REPORT.md      # Best practices analysis
├── SKILLS_QUALITY_MATRIX.md                    # Quality metrics
├── SKILL_DESCRIPTION_AUDIT.md                  # Description review
├── SKILL_DESCRIPTION_FIXES.md                  # Description improvements
├── TOOLING_PLANNING_SKILLS_ANALYSIS.md         # Tooling skills analysis
├── YAML_FIXES_GUIDE.md                         # YAML frontmatter fixes
├── YAML_FRONTMATTER_COMPLIANCE_REPORT.md       # Compliance status
└── turborepo-skill-review.md                   # Example skill review
```

**Purpose**: Track quality improvements, compliance, and review progress.

---

### `templates/` (23.1KB, 7 files)

Templates for creating new skills.

```
templates/
├── skill-skeleton/          # Complete skill directory structure
│   ├── .claude-plugin/
│   │   └── plugin.json     # Template plugin manifest
│   ├── assets/             # Asset directory (empty)
│   ├── references/         # Reference docs directory (empty)
│   ├── scripts/            # Scripts directory (empty)
│   ├── SKILL.md            # Main skill template with TODOs
│   └── README.md           # Public doc template with TODOs
├── README-TEMPLATE.md       # Standalone README template
└── SKILL-TEMPLATE.md        # Standalone SKILL template
```

**Usage**:
```bash
cp -r templates/skill-skeleton/ plugins/<plugin-name>/skills/<skill-name>/
# Fill in TODOs in SKILL.md and README.md
```

---

## Root Documentation Files

```
claude-skills/
├── START_HERE.md                   # ⭐ First-time user guide
├── CLAUDE.md                       # ⭐ Project context (this file's sibling)
├── README.md                       # Public repository overview
├── QUICK_WORKFLOW.md               # 5-minute skill creation guide
├── ONE_PAGE_CHECKLIST.md           # Quality verification checklist
├── CONTRIBUTING.md                 # Contribution guidelines
├── CHANGELOG.md                    # Version history
├── MIGRATION_SUMMARY.md            # Migration tracking
├── CLAUDE_SKILLS_DOCUMENTATION.md  # Comprehensive documentation
├── MARKETPLACE.md                  # Marketplace overview
├── MARKETPLACE_MANAGEMENT.md       # Marketplace management details
├── LICENSE                         # MIT License
├── migra.md                        # Migration notes
└── plan.md                         # Planning notes
```

**Navigation**:
- **New to repo?** → Read [START_HERE.md](START_HERE.md)
- **Building skills?** → Read [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md)
- **Verifying work?** → Read [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)
- **Project context?** → Read [CLAUDE.md](CLAUDE.md)

---

## Standard Skill Structure

Every skill follows this canonical structure:

```
<skill-name>/
├── .claude-plugin/
│   └── plugin.json              # Auto-generated manifest
│       {
│         "name": "skill-name",
│         "description": "...",
│         "version": "3.0.0",
│         "category": "cloudflare",
│         "keywords": [...],
│         "agents": [],
│         "commands": []
│       }
│
├── SKILL.md                     # ⭐ Main skill content (<500 lines)
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
├── README.md                    # Public documentation
│   (Auto-trigger keywords, installation, examples)
│
├── references/                  # Extended documentation (loaded as needed)
│   ├── setup-guide.md
│   ├── advanced-features.md
│   ├── error-catalog.md
│   ├── troubleshooting.md
│   └── [domain-specific].md
│
├── templates/                   # Code templates
│   ├── basic-setup.ts
│   ├── advanced-example.tsx
│   └── package.json
│
├── scripts/                     # Helper scripts
│   ├── setup.sh
│   ├── check-versions.sh
│   └── install-dependencies.sh
│
└── assets/                      # Images, diagrams, data
    ├── architecture-diagram.png
    └── sample-data.json
```

---

## File Type Distribution

**Total**: 2,588 files across 19.8MB

| Extension | Count | Purpose |
|-----------|-------|---------|
| `.md` | 1,156 | Documentation (SKILL.md, README.md, references/) |
| `.ts` | 337 | TypeScript templates and examples |
| `.json` | 299 | Config files (plugin.json, package.json, wrangler.jsonc) |
| `.html` | 127 | HTML templates and examples |
| `.sh` | 124 | Shell scripts for automation |
| `.tsx` | ~200 | React/Vue component templates |
| `.js` | ~150 | JavaScript examples and helpers |
| Other | ~195 | CSS, Python, Swift, config files |

---

## Plugin vs Skill Distinction

**Important**: This repository uses a two-tier architecture:

### 58 Plugins (Marketplace Categories)
- **What**: Logical groupings of related skills
- **Where**: `plugins/<plugin-name>/`
- **Purpose**: Organize skills by domain for discoverability
- **Discovery**: Listed in `.claude-plugin/marketplace.json`
- **Installation**: `/plugin install <plugin-name>@claude-skills`

### 169 Skills (Individual Capabilities)
- **What**: Individual knowledge units Claude loads
- **Where**: `plugins/<plugin-name>/skills/<skill-name>/`
- **Purpose**: Provide specific domain expertise
- **Discovery**: Auto-loaded when relevant to user tasks
- **Content**: SKILL.md, templates, references, scripts

**Example**:
```
Plugin: "cloudflare" (1 of 58)
  ↓ contains
Skills: cloudflare-worker-base (1 of 23 in this plugin)
        cloudflare-d1
        cloudflare-r2
        ... (20 more cloudflare skills)
```

---

## Key Workflows

### 1. Creating a New Skill

```bash
# Copy template
cp -r templates/skill-skeleton/ plugins/<plugin>/skills/<skill-name>/

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

# Manual checklist
# Open ONE_PAGE_CHECKLIST.md
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

### Using tree

```bash
# Plugin overview
tree -L 3 plugins/

# Specific plugin
tree plugins/cloudflare/

# Scripts only
tree scripts/
```

---

## Common Paths

**Frequently accessed locations**:

| Path | Description |
|------|-------------|
| `plugins/cloudflare/` | Cloudflare skills (23 skills) |
| `plugins/ai-tools/` | AI SDK skills (5 skills) |
| `plugins/nextjs/` | Next.js skill |
| `templates/skill-skeleton/` | New skill template |
| `scripts/sync-plugins.sh` | Main sync script |
| `.claude-plugin/marketplace.json` | Marketplace manifest |
| `planning/claude-code-skill-standards.md` | Standards |
| `ONE_PAGE_CHECKLIST.md` | Quality checklist |

---

## Statistics Summary

**Repository**:
- Total Size: 19.8MB
- Total Files: 2,588
- Total Plugins: 58
- Total Skills: 169

**File Types**:
- Markdown: 1,156 files (documentation)
- TypeScript: 337 files (templates)
- JSON: 299 files (config)
- HTML: 127 files (templates)
- Shell: 124 files (automation)

**Skills by Category**:
- Cloudflare: 23 skills
- API: 13 skills
- AI/ML: 19 skills
- Frontend: 25+ skills
- Testing: 5 skills
- Security: 7 skills
- Auth: 5 skills
- Database: 4 skills
- [See plugins/ for complete breakdown]

---

## Next Steps

1. **First time here?** → Read [START_HERE.md](START_HERE.md)
2. **Want to create a skill?** → Read [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md)
3. **Need project context?** → Read [CLAUDE.md](CLAUDE.md)
4. **Quality verification?** → Read [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)

---

**Last Updated**: 2025-12-22
**Generated with**: [codemap](https://github.com/JordanCoin/codemap)
**Maintained by**: Claude Skills Team
