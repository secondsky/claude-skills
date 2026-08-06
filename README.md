# Claude Code Skills Collection

**142 production-ready skills for Claude Code CLI**

Version 3.6.3 | Last Updated: 2026-08-06

<div align="center">

**🔌 Platform / Harness Support**

These plugins ship as Claude Code marketplace plugins (`.claude-plugin/` manifests) and Codex CLI plugins (`.codex-plugin/` manifests). Other harnesses consume the same skills via [skills.sh](#installing-with-skillssh) — the cross-harness bridge.

| Harness | Marketplace support | How to install |
|---------|---------------------|----------------|
| **Claude Code** | ✅ **Native** (federated) | `/plugin marketplace add secondsky/claude-skills`, then `/plugin install <name>@claude-skills` |
| **ZCode** | ✅ **Native** (reads `.claude-plugin/` manifests) | Add this repo as a marketplace in the ZCode GUI |
| **Codex CLI** | ✅ **Native** (federated) | `codex plugin marketplace add secondsky/claude-skills`, then `/plugins` in the Codex TUI |
| **Cursor** | ⚠️ Adaptation needed | Cursor has an official marketplace, but expects `.cursor-plugin/plugin.json` (UI "Add to Cursor") this repo does not generate yet. Use skills.sh. |
| **opencode** | ❌ No marketplace | npm plugins only (`opencode.json` `plugin[]`). Use skills.sh or vendor manually. |
| **Gemini CLI** | ❌ No marketplace | `gemini extensions install <url>` only. Use skills.sh or vendor manually. |

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
/plugin install gemini-cli@claude-skills
```

See [MARKETPLACE.md](MARKETPLACE.md) for complete catalog of all 142 skills.

### Codex CLI Installation

This repo generates `.codex-plugin/` manifests and a `.agents/plugins/marketplace.json` for all 142 plugins, so Codex CLI can install them natively:

```bash
# Add the marketplace (from GitHub)
codex plugin marketplace add secondsky/claude-skills

# Browse and install plugins in the Codex TUI
#   /plugins          # opens the plugin browser
#   Space             # enable/disable a plugin
```

Skills are auto-discovered from each plugin's `skills/` directory — the same `SKILL.md` files Claude Code uses. Claude-specific slash commands and subagents are not carried into Codex (use Codex's `/import` command for that).

---

## Installing with skills.sh

[skills.sh](https://skills.sh) is an open agent-skills registry and `npx skills` CLI (maintained by Vercel) that auto-detects your coding agent — Claude Code, Cursor, Codex, Copilot, Cline, opencode, and 70+ others — and installs each skill into the correct directory for that harness. It is the **universal cross-harness path** for harnesses without a marketplace (opencode, Gemini CLI) or where this repo's manifest format isn't generated yet (Cursor).

```bash
# Install one skill (auto-detects your agent)
npx skills add secondsky/claude-skills --skill cloudflare-d1

# Install several specific skills
npx skills add secondsky/claude-skills --skill cloudflare-d1 --skill tailwind-v4-shadcn

# Try a skill once without installing (pipes its prompt to your agent)
npx skills use secondsky/claude-skills@cloudflare-d1 | claude

# Target a specific agent explicitly
npx skills add secondsky/claude-skills --skill cloudflare-d1 --agent codex

# List what's installed, search, update, remove
npx skills ls -g
npx skills find cloudflare
npx skills update cloudflare-d1
npx skills remove cloudflare-d1
```

> **Bulk install note:** `npx skills add secondsky/claude-skills --all` installs every discovered skill at once, but discovery walks skills.sh's standard container directories (`skills/`, `.claude/skills/`, …). This repo nests skills under `plugins/<name>/skills/<skill>/`, so `--all` may not pick up everything in one pass — install the skills you need by name with `--skill`, or run `npx skills add secondsky/claude-skills -l` to list what it finds.

### Security scanning caveat

skills.sh runs every published skill through three scanners (Gen Agent Trust Hub, Socket, Snyk) plus an LLM-based meta-analyzer, and publishes the results at [skills.sh/audits](https://skills.sh/audits). The LLM analysis stage has been publicly shown (Trail of Bits, June 2026) to both miss genuinely malicious skills **and** flag unfamiliar version pins (e.g. newest dependency versions) as suspicious false positives. **Treat skills.sh warnings as advisory, not authoritative** — and verify against this repo's own version pins before acting on a warning.

---

## Repository Structure

This repository contains **142 production-tested skills** for Claude Code, each focused on a specific technology or capability.

**Individual Skills**: Each skill is a standalone unit with:
- `SKILL.md` - Core knowledge and guidance
- Templates - Working code examples
- References - Extended documentation
- Scripts - Helper utilities

**Installation Options**:
1. **Marketplace** (recommended) - Install individual skills via `/plugin install <name>@claude-skills`
2. **Cross-harness** - Install into any supported agent with `npx skills add secondsky/claude-skills --skill <name>` (see [Installing with skills.sh](#installing-with-skillssh))

---

## Available Skills (142 Individual Skills)

Each skill is individually installable. Install only the skills you need.

**Full Catalog**: See [MARKETPLACE.md](MARKETPLACE.md) for detailed listings.

### Categories

| Category | Skills | Examples |
|----------|--------|----------|
| **tooling** | 24 | turborepo, plan-interview, code-review |
| **frontend** | 26 | nuxt-v4, nuxt-v5, tailwind-v4-shadcn, tanstack-query, nuxt-studio, maz-ui, threejs |
| **cloudflare** | 21 | cloudflare-d1, cloudflare-workers-ai, cloudflare-agents |
| **api** | 16 | api-design-principles, graphql-implementation |
| **ai** | 7 | gemini-cli, ml-model-training, tanstack-ai |
| **web** | 10 | hono-routing, firecrawl-scraper, web-performance |
| **security** | 6 | csrf-protection, xss-prevention, cybersecurity |
| **mobile** | 5 | react-native-app, react-native-skills |
| **woocommerce** | 4 | woocommerce-backend-dev |
| **testing** | 4 | vitest-testing, playwright-testing |
| **design** | 4 | design-review, design-system-creation |
| **auth** | 4 | better-auth |
| **architecture** | 3 | microservices-patterns, architecture-patterns |
| **data** | 2 | recommendation-engine, recommendation-system |
| **cms** | 2 | hugo, wordpress-plugin-core |
| **database** | 1 | drizzle-orm-d1 |
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

Each plugin is a directory under `plugins/<plugin-name>/` containing one or more skills:

```
plugins/[plugin-name]/
├── .claude-plugin/
│   └── plugin.json       # Plugin manifest (marketplace metadata)
├── README.md
├── skills/
│   └── [skill-name]/
│       ├── SKILL.md          # Core knowledge and guidance
│       ├── templates/        # Ready-to-copy templates
│       ├── scripts/          # Helper utilities
│       └── references/       # Extended documentation
└── (optional) agents/, commands/, hooks/
```

---

## Recent Additions

### July 2026

**Offensive Security** (new category):
- **cybersecurity** — Unified OSS-only cybersecurity skill with progressive disclosure. Fuses 7 community skills (mukul975 business-logic/XSS/host-header/forced-browsing/open-redirect, rysweet/amplihack cybersecurity-analyst, Aradotso security-detections-mcp) ported to fully open-source tooling (OWASP ZAP, Dalfox, ffuf, Nuclei, mitmproxy, interact.sh, Semgrep, Sigma). Covers threat modeling (STRIDE/PASTA/VAST, MITRE ATT&CK), web-vuln testing, SAST, code audit, AI/LLM-app security, and detection engineering. Live-target testing is gated behind an authorization disclaimer; static analysis, code review, and threat modeling are always available. Cross-references the 5 existing defensive security plugins (`csrf-protection`, `xss-prevention`, `vulnerability-scanning`, `security-headers-configuration`, `defense-in-depth-validation`) for remediation. Integrates 20 Aradotso dev-security skills across 5 grouped reference docs.

### May 2026

**Supply Chain Security** (cross-cutting):
- **dependency-upgrade** expanded with **Socket CLI integration** — proactive malicious package detection, typosquatting alerts, and CI/CD security gates. New 418-line reference guide, 2 GitHub Actions templates, and expanded supply chain security comparison (3 tools)
- **31 skills now include "Secure Installation" guidance** — contextually-tailored security sections across all high-risk skill categories (scaffolding, MCP/agent SDKs, multi-provider installs, Docker, CI/CD). Covers 8 Bun skills, 5 Nuxt skills, 6 Cloudflare skills, 4 AI/agent skills, and 8 frontend/tooling skills
- Supply chain security is now a **first-class cross-cutting concern** woven into the skill collection — not a standalone topic

### February - April 2026

**Full-Stack Frameworks**:
- **nuxt-v5** (v1.0.0) - Full Nuxt 5 support with 4 skills (core, data, server, production), 3 diagnostic agents, and interactive setup wizard
- **threejs** (v1.0.0) - 3D web graphics: scenes, geometries, shaders, animations, post-processing

**Infrastructure**:
- **JSON schema validation** - Automated plugin.json validation with CI support
- **GitHub issue templates** - Skill-specific issue templates for bug reports, feature requests, and submissions

**Plugin Enhancements**:
- **mutation-testing** - Added Bun native runner support
- **dependency-upgrade** - Added supply chain security content

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
- Not all 142 skills may be visible in Claude's context at once
- Skills are loaded based on relevance and available token budget
- You can verify how many skills Claude currently sees by asking: *"How many skills do you see in your system prompt?"*

### Checking Visible Skills

To verify which skills are currently loaded:

```bash
# Ask Claude Code directly
"Check what skills/plugins you see in your system prompt"
```

Claude will report something like: "85 of 142 skills visible due to token limits"

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

**Across all 142 skills**: 400+ documented errors prevented.

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
