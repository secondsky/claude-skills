# Claude Skills Marketplace

Welcome to the **claude-skills** marketplace - a curated collection of 60 production-tested skills for Claude Code CLI.

## Quick Start

### Installation

**Step 1: Add the marketplace**

```bash
/plugin marketplace add https://github.com/secondsky/claude-skills
```

**Step 2: Install skills**

```bash
# Install a single skill
/plugin install cloudflare-worker-base@claude-skills

# Install multiple skills
/plugin install tailwind-v4-shadcn@claude-skills openai-agents@claude-skills
```

**Step 3: Use the skills**

Once installed, Claude Code automatically discovers and uses skills when relevant:

```
User: "Set up a new Cloudflare Worker project with Hono"
Claude: [Automatically uses cloudflare-worker-base skill]
```

---

## Available Skills (60)

### Cloudflare Platform (22 skills)

Core infrastructure and services for edge computing:

| Skill | Description |
|-------|-------------|
| `cloudflare-worker-base` | Production Workers setup with Hono, Vite, Static Assets |
| `cloudflare-d1` | SQLite database with migrations and schemas |
| `cloudflare-r2` | Object storage (S3-compatible) |
| `cloudflare-kv` | Key-value storage for caching |
| `cloudflare-workers-ai` | LLM inference and embeddings |
| `cloudflare-vectorize` | Vector search and embeddings storage |
| `cloudflare-queues` | Async message processing |
| `cloudflare-workflows` | Multi-step process orchestration |
| `cloudflare-durable-objects` | Stateful coordination and WebSockets |
| `cloudflare-agents` | AI agents on the edge |
| `cloudflare-mcp-server` | Deploy MCP servers on Workers |
| `cloudflare-nextjs` | Next.js on Cloudflare Pages |
| `cloudflare-cron-triggers` | Scheduled tasks |
| `cloudflare-email-routing` | Handle incoming emails |
| `cloudflare-hyperdrive` | Accelerated Postgres connections |
| `cloudflare-images` | Image optimization and delivery |
| `cloudflare-browser-rendering` | Headless browser automation |
| `cloudflare-turnstile` | CAPTCHA-free bot protection |
| `cloudflare-zero-trust-access` | Secure authentication |
| `cloudflare-full-stack-scaffold` | Complete full-stack template |
| `cloudflare-full-stack-integration` | Integrate multiple CF services |
| `cloudflare-sandbox` | Testing and development environment |

### AI & Machine Learning (13 skills)

LLM integrations, agents, and AI frameworks:

| Skill | Description |
|-------|-------------|
| `ai-sdk-core` | Vercel AI SDK for unified LLM integration |
| `ai-sdk-ui` | AI SDK UI for chat interfaces |
| `openai-api` | OpenAI GPT models and embeddings |
| `openai-agents` | OpenAI Agents SDK with realtime voice |
| `openai-assistants` | Stateful AI assistants |
| `openai-responses` | Conversational AI applications |
| `google-gemini-api` | Google Gemini multimodal models |
| `google-gemini-embeddings` | Gemini embeddings for search |
| `claude-api` | Anthropic Claude API integration |
| `claude-agent-sdk` | Claude autonomous agents |
| `thesys-generative-ui` | LLM-powered dynamic UI |
| `elevenlabs-agents` | Voice AI applications |
| `better-chatbot` | Production chatbot patterns |
| `better-chatbot-patterns` | Advanced chatbot architectures |

### Frontend & UI (7 skills)

React, Next.js, and modern UI components:

| Skill | Description |
|-------|-------------|
| `tailwind-v4-shadcn` | Tailwind v4 + shadcn/ui setup (gold standard) |
| `react-hook-form-zod` | Forms with validation |
| `tanstack-query` | Data fetching and caching |
| `zustand-state-management` | Lightweight state management |
| `nextjs` | Next.js App Router development |
| `hono-routing` | Hono for Workers and edge |
| `firecrawl-scraper` | Web scraping API |

### Authentication (3 skills)

User management and auth solutions:

| Skill | Description |
|-------|-------------|
| `clerk-auth` | Clerk user management |
| `auth-js` | Auth.js with D1 adapter |
| `better-auth` | Better Auth library |

### Content Management (3 skills)

Git-based and WordPress CMS:

| Skill | Description |
|-------|-------------|
| `tinacms` | TinaCMS Git-backed CMS |
| `sveltia-cms` | Sveltia CMS for Git |
| `wordpress-plugin-core` | WordPress plugin development |

### Database & Storage (4 skills)

ORMs and serverless databases:

| Skill | Description |
|-------|-------------|
| `drizzle-orm-d1` | Drizzle ORM with D1 |
| `neon-vercel-postgres` | Neon Postgres with Vercel |
| `vercel-kv` | Vercel KV Redis storage |
| `vercel-blob` | Vercel Blob file storage |

### Tooling & Planning (8 skills)

Development tools and workflow automation:

| Skill | Description |
|-------|-------------|
| `typescript-mcp` | Build MCP servers with TypeScript |
| `fastmcp` | FastMCP Python framework |
| `project-planning` | Generate planning docs |
| `project-session-management` | Session handoff protocol |
| `hugo` | Hugo static site generator |
| `github-project-automation` | Automate GitHub Projects |
| `open-source-contributions` | Open-source workflow best practices |

---

## Benefits

### For Users

- ✅ **One-command installation**: No manual cloning or symlinks
- ✅ **Automatic updates**: Keep skills current with `/plugin update`
- ✅ **Centralized discovery**: Browse entire catalog
- ✅ **Team deployment**: Share via `.claude/settings.json`

### For Projects

- ✅ **60-70% token savings** vs manual implementation
- ✅ **395+ errors prevented** across all skills
- ✅ **Production-tested** patterns and templates
- ✅ **Current packages** (verified quarterly)

---

## Managing Skills

### Update Skills

```bash
# Update single skill
/plugin update cloudflare-worker-base@claude-skills

# Update all skills from marketplace
/plugin update-all@claude-skills
```

### List Installed Skills

```bash
/plugin list
```

### Remove Skills

```bash
/plugin uninstall cloudflare-worker-base@claude-skills
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

# Install single skill
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
3. Run `./scripts/generate-plugin-manifests.sh`
4. Submit pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Last Updated**: 2025-11-07
**Marketplace Version**: 1.0.0
**Skills**: 60
**Maintainer**: Claude Skills Maintainers
