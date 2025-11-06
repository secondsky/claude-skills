# Claude Code Skills Collection

**Production-ready skills for Claude Code CLI**
**Last Updated**: 2025-11-06

A curated collection of battle-tested skills for building modern web applications with Cloudflare, React, Tailwind, and AI integrations.

**👋 New Here?** → Read [START_HERE.md](START_HERE.md) for quick navigation
**🔨 Building a Skill?** → Use [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) and [templates/](templates/)
**📖 Project Context?** → See [CLAUDE.md](CLAUDE.md)

---

## 🚀 Quick Start

### Option A: Marketplace Installation (Recommended for Users)

**Easiest method** - install skills directly from the marketplace:

```bash
# Add the marketplace
/plugin marketplace add https://github.com/jezweb/claude-skills

# Install skills
/plugin install cloudflare-worker-base@claude-skills
/plugin install tailwind-v4-shadcn@claude-skills openai-agents@claude-skills
```

See [MARKETPLACE.md](MARKETPLACE.md) for complete marketplace documentation including all 60 available skills.

### Option B: Direct Installation (For Contributors & Development)

**Manual method** - clone and install locally:

```bash
# Clone the repository
git clone https://github.com/jezweb/claude-skills.git ~/Documents/claude-skills

# Install all skills
cd ~/Documents/claude-skills
./scripts/install-all.sh

# Or install individual skills
./scripts/install-skill.sh cloudflare-worker-base
```

### Verify Installation

Skills will be available in Claude Code and automatically suggested when relevant to your task.

---

## 📦 Available Skills (60 Production-Ready)

**📋 Full Catalog**: See [MARKETPLACE.md](MARKETPLACE.md) for the complete organized list of all 60 skills by category.

**Below**: Featured skills with detailed descriptions and trigger keywords.

### Cloudflare Core Infrastructure

#### **cloudflare-worker-base**
Foundation for Cloudflare Workers with Hono routing, Static Assets, and Vite plugin. Prevents 6 documented errors.

**Triggers**: `cloudflare worker`, `hono`, `workers static assets`, `vite plugin`

---

#### **cloudflare-d1**
D1 serverless SQL database with migrations, prepared statements, and batch queries. Prevents 6 documented errors.

**Triggers**: `d1 database`, `cloudflare d1`, `sql workers`, `d1 migrations`

---

#### **cloudflare-r2**
R2 object storage (S3-compatible) with multipart uploads, presigned URLs, and CORS. Prevents 6 documented errors.

**Triggers**: `r2 storage`, `cloudflare r2`, `object storage`, `r2 upload`

---

#### **cloudflare-kv**
KV key-value storage with TTL, metadata, bulk operations, and caching patterns. Prevents 6 documented errors.

**Triggers**: `kv storage`, `cloudflare kv`, `kv cache`, `workers kv`

---

#### **cloudflare-workers-ai**
Workers AI integration with 50+ models: LLMs, embeddings, image generation, vision. Prevents 6 documented errors.

**Triggers**: `workers ai`, `cloudflare ai`, `llm workers`, `embeddings`

---

#### **cloudflare-vectorize**
Vector database for RAG and semantic search with Workers AI and OpenAI embeddings. Prevents 8 documented errors.

**Triggers**: `vectorize`, `vector search`, `rag cloudflare`, `semantic search`

---

#### **cloudflare-queues**
Message queues for async processing with batching, retries, and dead letter queues. Prevents 8 documented errors.

**Triggers**: `cloudflare queues`, `message queue`, `async processing`, `background jobs`

---

#### **cloudflare-workflows**
Durable execution for multi-step applications with automatic retries, state persistence, and long-running workflows. Prevents 5 documented errors.

**Triggers**: `cloudflare workflows`, `durable execution`, `workflow step`, `long-running tasks`

---

#### **cloudflare-durable-objects**
Stateful coordination with WebSocket Hibernation, SQL storage, alarms, and real-time patterns. Prevents 18 documented errors.

**Triggers**: `durable objects`, `websocket hibernation`, `do state api`, `real-time cloudflare`

---

#### **cloudflare-agents**
Complete Agents SDK for building stateful AI agents with WebSocket, scheduling, RAG, and MCP servers. Prevents 15 documented errors.

**Triggers**: `cloudflare agents`, `agents sdk`, `stateful agents`, `mcp server`

---

#### **cloudflare-mcp-server**
Build remote Model Context Protocol servers on Cloudflare Workers with TypeScript. Includes OAuth (GitHub/Google/Azure), Durable Objects state, WebSocket hibernation, dual transports (SSE + HTTP). Self-contained with Worker/DO basics. Prevents 15 documented errors. **87% token savings** (40k → 5k).

**Triggers**: `mcp server cloudflare`, `model context protocol`, `remote mcp`, `mcp oauth`, `stateful mcp`, `websocket hibernation mcp`, `mcpagent class`

---

#### **cloudflare-turnstile**
CAPTCHA-alternative bot protection with client-side widgets, server-side validation, React integration, and testing patterns. Prevents 12 documented errors.

**Triggers**: `turnstile`, `captcha`, `bot protection`, `recaptcha alternative`, `siteverify`, `error 110200`, `error 300030`

---

### Framework Integration

#### **cloudflare-nextjs**
Deploy Next.js (App Router/Pages) to Cloudflare Workers with OpenNext adapter. Prevents 10 documented errors.

**Triggers**: `next.js cloudflare`, `nextjs workers`, `opennext adapter`

---

### Routing & API Frameworks

#### **hono-routing**
Complete Hono routing and middleware patterns: validation (Zod/Valibot), RPC, error handling, context extension. Prevents 8 documented errors.

**Triggers**: `hono routing`, `hono middleware`, `hono validator`, `hono rpc`, `type-safe api`

---

### Authentication

#### **clerk-auth**
Complete Clerk authentication for React, Next.js, and Cloudflare Workers with JWT verification. Prevents 10 documented errors.

**Triggers**: `clerk auth`, `clerk`, `@clerk/nextjs`, `@clerk/backend`, `JWT verification`

---

### AI & Machine Learning

#### **ai-sdk-core**
Backend AI with Vercel AI SDK v5: text generation, structured output, tool calling, agents. Prevents 12 documented errors.

**Triggers**: `ai sdk core`, `vercel ai sdk`, `generateText`, `streamText`

---

#### **ai-sdk-ui**
Frontend React hooks (useChat, useCompletion, useObject) for AI-powered UIs. Prevents 12 documented errors.

**Triggers**: `ai sdk ui`, `useChat`, `react ai chat`, `streaming ai ui`

---

### Database & Storage (Vercel/Neon)

#### **neon-vercel-postgres**
Serverless Postgres for edge/serverless environments with Neon and Vercel Postgres. Prevents 15 documented errors.

**Triggers**: `neon postgres`, `vercel postgres`, `serverless postgres`, `postgres edge`, `drizzle neon`

---

#### **vercel-kv**
Redis-compatible key-value storage for caching, sessions, rate limiting. Prevents 10 documented errors.

**Triggers**: `vercel kv`, `@vercel/kv`, `vercel redis`, `upstash vercel`, `sessions`, `rate limiting`

---

#### **vercel-blob**
Object storage with automatic CDN for file uploads, images, documents. Prevents 10 documented errors.

**Triggers**: `vercel blob`, `@vercel/blob`, `file upload`, `image upload`, `presigned url vercel`

---

### Web Scraping & Utilities

#### **firecrawl-scraper**
Website scraping with Firecrawl v2 API: scrape, crawl, map, extract. Prevents 6 documented errors.

**Triggers**: `web scraping`, `firecrawl`, `content extraction`

---

### UI & Frontend

#### **tailwind-v4-shadcn**
Tailwind CSS v4 + shadcn/ui + Vite + React with dark mode and theme provider. Prevents 9 documented errors.

**Triggers**: `tailwind v4`, `shadcn/ui`, `dark mode`, `@theme inline`, `@plugin directive`

---

#### **react-hook-form-zod**
Forms with React Hook Form and Zod validation for type-safe, performant form handling. Prevents 8 documented errors.

**Triggers**: `react hook form`, `zod validation`, `form handling`, `useForm`

---

#### **tanstack-query**
Server state management with TanStack Query (React Query) for caching, sync, and data fetching. Prevents 10 documented errors.

**Triggers**: `tanstack query`, `react query`, `useQuery`, `data fetching`, `cache management`

---

#### **zustand-state-management**
Client state management with Zustand: simple, performant, TypeScript-first. Prevents 6 documented errors.

**Triggers**: `zustand`, `state management`, `global state`, `react state`

---

### Additional Cloudflare Services

#### **cloudflare-cron-triggers**
Scheduled tasks and cron jobs for Workers. Prevents 4 documented errors.

**Triggers**: `cron triggers`, `scheduled tasks`, `cloudflare cron`

---

#### **cloudflare-email-routing**
Email routing and processing for Workers. Prevents 5 documented errors.

**Triggers**: `email routing`, `cloudflare email`, `email workers`

---

#### **cloudflare-hyperdrive**
Connection pooling for Postgres and MySQL databases. Prevents 6 documented errors.

**Triggers**: `hyperdrive`, `database pooling`, `postgres cloudflare`

---

#### **cloudflare-images**
Image optimization and delivery. Prevents 4 documented errors.

**Triggers**: `cloudflare images`, `image optimization`, `image delivery`

---

#### **cloudflare-browser-rendering**
Headless browser automation with Puppeteer for Workers. Prevents 8 documented errors.

**Triggers**: `browser rendering`, `puppeteer workers`, `headless browser`

---

#### **cloudflare-zero-trust-access**
Zero Trust security and access control. Prevents 6 documented errors.

**Triggers**: `zero trust`, `cloudflare access`, `security workers`

---

### Full-Stack Scaffolds

#### **cloudflare-full-stack-scaffold**
Complete full-stack template: Vite + React + Workers + D1 + R2 + KV. Prevents 12 documented errors.

**Triggers**: `full stack scaffold`, `cloudflare template`, `vite workers react`

---

#### **cloudflare-full-stack-integration**
Integration patterns for combining multiple Cloudflare services. Prevents 10 documented errors.

**Triggers**: `cloudflare integration`, `service composition`, `multi-service workers`

---

### AI Frameworks & APIs

#### **openai-api**
OpenAI API integration: chat completions, embeddings, vision, audio. Prevents 8 documented errors.

**Triggers**: `openai api`, `chatgpt api`, `gpt-4`, `openai sdk`

---

#### **openai-agents**
OpenAI Agents SDK for building stateful agents with tools and handoffs. Prevents 12 documented errors.

**Triggers**: `openai agents`, `agent sdk`, `openai tools`, `agent handoffs`

---

#### **openai-assistants**
OpenAI Assistants API for long-running conversations with memory. Prevents 10 documented errors.

**Triggers**: `openai assistants`, `assistants api`, `openai threads`

---

#### **openai-responses**
OpenAI Responses API for structured outputs. Prevents 6 documented errors.

**Triggers**: `openai responses`, `structured output`, `response format`

---

#### **google-gemini-api**
Google Gemini API integration: multimodal AI, vision, reasoning. Prevents 8 documented errors.

**Triggers**: `gemini api`, `google ai`, `gemini pro`, `multimodal ai`

---

#### **google-gemini-embeddings**
Google Gemini embeddings for RAG and semantic search. Prevents 6 documented errors.

**Triggers**: `gemini embeddings`, `text-embedding`, `google embeddings`

---

#### **claude-api**
Anthropic Claude API integration for advanced reasoning. Prevents 8 documented errors.

**Triggers**: `claude api`, `anthropic api`, `claude sonnet`

---

#### **claude-agent-sdk**
Claude Agent SDK for building agentic applications. Prevents 10 documented errors.

**Triggers**: `claude agent sdk`, `anthropic agents`, `claude tools`

---

#### **thesys-generative-ui**
Thesys generative UI for dynamic, AI-powered interfaces. Prevents 8 documented errors.

**Triggers**: `thesys`, `generative ui`, `dynamic ui`, `ai components`

---

### Content Management

#### **tinacms**
TinaCMS for Git-backed content management. Prevents 9 documented errors.

**Triggers**: `tinacms`, `tina cms`, `git cms`, `content management`

---

#### **sveltia-cms**
Sveltia CMS for lightweight, Git-based content editing. Prevents 6 documented errors.

**Triggers**: `sveltia cms`, `netlify cms alternative`, `git based cms`

---

### WordPress Development

#### **wordpress-plugin-core**
Comprehensive WordPress plugin development with security foundation, 3 architecture patterns (Simple, OOP, PSR-4), GitHub auto-updates, and distribution. Prevents 20+ documented security vulnerabilities (SQL injection, XSS, CSRF). Includes complete templates, Settings API, REST API, AJAX, Custom Post Types, and auto-update integration via Plugin Update Checker.

**Triggers**: `wordpress plugin`, `wordpress development`, `plugin security`, `wordpress rest api`, `wordpress ajax`, `custom post type`, `github auto-updates`, `plugin update checker`, `wordpress distribution`, `sanitize_text_field`, `wp_verify_nonce`, `sql injection`, `xss prevention`, `csrf protection`

---

### Database & ORM

#### **drizzle-orm-d1**
Drizzle ORM integration with Cloudflare D1 for type-safe database queries. Prevents 8 documented errors.

**Triggers**: `drizzle orm`, `drizzle d1`, `type-safe queries`, `orm cloudflare`

---

### Framework Utilities

#### **nextjs**
Next.js App Router patterns and best practices. Prevents 12 documented errors.

**Triggers**: `next.js`, `app router`, `server components`, `nextjs patterns`

---

#### **auth-js**
Auth.js (NextAuth) for authentication across frameworks. Prevents 10 documented errors.

**Triggers**: `auth.js`, `nextauth`, `authentication`, `oauth`

---

### MCP & Tooling

#### **typescript-mcp**
TypeScript MCP server development for Cloudflare Workers. Prevents 8 documented errors.

**Triggers**: `typescript mcp`, `mcp server`, `model context protocol`

---

#### **fastmcp**
FastMCP Python framework for MCP server development with production features (storage backends, lifespans, middleware, OAuth Proxy, server composition). Prevents 25 documented errors, 90-95% token savings.

**Triggers**: `fastmcp`, `python mcp`, `mcp server`, `storage backends`, `middleware`, `oauth proxy`, `server composition`

---

### Project Planning

#### **project-planning**
Structured planning with IMPLEMENTATION_PHASES.md generation. Prevents 4 documented errors.

**Triggers**: `project planning`, `implementation phases`, `planning docs`

---

#### **project-session-management**
Session handoff protocol for managing context across sessions. Prevents 3 documented errors.

**Triggers**: `session management`, `session handoff`, `context management`

---

### GitHub Automation

#### **github-project-automation**
Complete GitHub Actions automation with 12 workflow templates (CI, CD, security, maintenance), 4 issue templates (YAML with validation), 3 PR templates, security configuration (Dependabot, CodeQL), and 4 automation scripts. Prevents 18 documented errors including YAML syntax, action version pinning, secrets management, and matrix strategies. Includes interactive setup wizard and validation tools.

**Triggers**: `github actions setup`, `create github workflow`, `ci/cd github`, `issue templates github`, `pull request template`, `dependabot configuration`, `codeql setup`, `github security scanning`, `workflow syntax error`, `yaml syntax error github`, `workflow not triggering`, `github actions error`, `action version pinning`, `runner version github`, `secrets not found github`, `matrix strategy error`, `yaml indentation error`, `github actions troubleshooting`, `codeql not running`, `dependabot failing`, `github context syntax`, `secrets management github`, `branch protection rules`, `codeowners file`, `continuous integration github`, `deploy cloudflare workers github`, `github actions cloudflare`, `continuous deployment github`

---

## 🎯 Skill Usage Protocol

### Use this or something like it in your main user CLAUDE.md file >>>


```

**CRITICAL**: Claude Code automatically checks `~/.claude/skills/` for relevant skills before planning ANY implementation task.

### Auto-Discovery Rules:
1. **Check skills FIRST** - Before entering plan mode or starting implementation
2. **Relevance threshold** - If a skill covers an aspect of the task requirements, propose using it
3. **Always prefer skills** - Skills encapsulate official documented patterns and prevent known errors
4. **Token efficiency** - Skills save tokens, reduce MCP calls, and improve workflow vs manual implementation
5. **Error prevention** - Skills include fixes for known issues and links to documentation

### When to Use Skills:
- ✅ New project scaffolding (Vite, React, Cloudflare Workers)
- ✅ Framework integration (Tailwind v4, shadcn/ui, Next.js)
- ✅ Service configuration (D1, R2, KV, Workers AI, Vectorize, Queues, Workflows)
- ✅ Common patterns (forms, validation, chat UI, scraping, RAG, WebSocket)
- ✅ Deployment workflows (Wrangler, build optimization)

### Skill Invocation Pattern:

User: "Set up [technology/pattern]"
↓
Claude: [Checks ~/.claude/skills/ automatically]
↓
Claude: "Found [skill-name] skill. Use it? (prevents [known-issues])"
↓
User: [Approves]
↓
Claude: [Uses skill templates and automation]
↓
Result: Production-ready setup, zero errors, ~67% token savings


### Example Workflow:
❌ **Bad**: Start planning Tailwind v4 setup manually
✅ **Good**: Check skills → Find `tailwind-v4-shadcn` → Ask permission → Use skill

### Available Skills:
Skills are organized by domain. Check README.md in each skill for:
- Auto-trigger keywords
- What the skill does
- Known issues it prevents
- Template structure
- When to use / when not to use

```

---

## 🎯 How It Works

### Auto-Discovery in Action

Claude Code automatically checks `~/.claude/skills/` before planning tasks. When it finds a relevant skill:

```
User: "Build a workflow for processing payments"
↓
Claude: [Checks skills automatically]
↓
Claude: "Found cloudflare-workflows skill. Use it?
        (Prevents 5 errors: I/O context, NonRetryableError, serialization, etc.)"
↓
User: "Yes"
↓
Claude: [Uses templates: basic-workflow.ts, workflow-with-retries.ts]
↓
Result: Production-ready workflow in 30 minutes, zero errors, ~67% token savings
```

### Skill Structure

Each skill includes:

```
skills/[skill-name]/
├── README.md           # Auto-trigger keywords, quick reference
├── SKILL.md            # Complete documentation
├── templates/          # Ready-to-copy file templates
├── examples/           # Working example projects
└── scripts/            # Automation scripts
```

---

## 🛠️ Development

### Building New Skills

1. **Create skill directory**:
   ```bash
   mkdir -p skills/my-skill/{templates,examples,scripts}
   ```

2. **Add required files**:
   - `README.md` - Auto-trigger keywords
   - `SKILL.md` - Full documentation
   - Templates for common files

3. **Test the skill**:
   ```bash
   ./scripts/test-skill.sh my-skill
   ```

4. **Install to production**:
   ```bash
   ./scripts/install-skill.sh my-skill
   ```

5. **Commit and push**:
   ```bash
   git add skills/my-skill
   git commit -m "Add my-skill"
   git push
   ```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📋 Skill Categories

All 53 skills are production-ready and organized by domain:

- **Cloudflare Platform** (26 skills) - Workers, D1, R2, KV, AI, Queues, Workflows, Durable Objects, etc.
- **AI & Machine Learning** (10 skills) - OpenAI, Claude, Gemini, Vercel AI SDK, Thesys
- **Frontend & UI** (7 skills) - React, Tailwind v4, Forms, State Management, Next.js
- **Auth & Security** (3 skills) - Clerk, Auth.js, Zero Trust
- **Content Management** (2 skills) - TinaCMS, Sveltia CMS
- **WordPress Development** (1 skill) - Plugin core with security, auto-updates, distribution
- **Database & ORM** (4 skills) - Drizzle, Neon Postgres, Vercel KV/Blob
- **GitHub Automation** (1 skill) - CI/CD, issue/PR templates, security scanning, automation scripts
- **Tooling & Planning** (5 skills) - MCP servers, FastMCP, Project Planning, Scraping

---

## 🧪 Testing

Each skill can be tested before installation:

```bash
# Test individual skill
./scripts/test-skill.sh cloudflare-react-full-stack

# Test all skills
./scripts/test-all.sh
```

---

## 📚 Documentation

- **Planning**: See [planning/skills-roadmap.md](planning/skills-roadmap.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Individual skills**: Each skill has README.md + SKILL.md

---

## 🤝 Contributing

Contributions welcome! Please:

1. Follow the skill template standard
2. Include auto-trigger keywords in README.md
3. Provide working templates
4. Test thoroughly before submitting PR
5. Update planning/skills-roadmap.md

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🔗 Links

- **Claude Code**: https://claude.com/claude-code
- **Jezweb**: https://jezweb.com.au
- **Issues**: https://github.com/jezweb/claude-skills/issues

---

## 🤖 Using Subagents

Claude Code provides built-in subagents optimized for specific tasks. For skills repository maintenance, you primarily need two:

### Explore - Skill Verification

**Use for**: Checking compliance across multiple skills

```
"Use Explore with 'very thorough' mode to verify all skills against ONE_PAGE_CHECKLIST.md.
Check: YAML frontmatter, keywords, TODO markers, README structure."
```

**Results**:
- ✅ Verifies all 51 skills in ~3 minutes
- ✅ Comprehensive compliance report
- ✅ Cost: ~$0.40 (vs 40 min manual checking)

### Plan - Documentation Updates

**Use for**: Updating multiple docs when adding skills

```
"Update README.md, CHANGELOG.md, and planning/skills-roadmap.md for new [skill-name] skill.
Show diffs before applying."
```

**Results**:
- ✅ Consistent updates across all files
- ✅ Review changes before applying
- ✅ Time: 2 min (vs 10 min manual editing)

### Complete Guide

See [planning/subagent-workflow.md](planning/subagent-workflow.md) for:
- When to use each subagent type
- Prompt templates for common tasks
- Cost-benefit analysis
- Why you DON'T need custom domain agents

**Quick Decision**:
- Task touches 5+ files? → Use Explore or Plan
- Simple single-file operation? → Use tools directly

---

## ⚡ Token Efficiency

Using skills vs manual setup (measured across 50 production skills):

| Metric | Manual Setup | With Skills | Savings |
|--------|--------------|-------------|---------|
| **Average Tokens** | 12,000-15,000 | 4,000-5,000 | **~65%** |
| **Typical Errors** | 2-4 per service | 0 (prevented) | **100%** |
| **Setup Time** | 2-4 hours | 15-45 minutes | **~80%** |
| **Total Skills** | - | 50 production-ready | - |
| **Errors Prevented** | - | 380+ documented | - |

### Real Examples:

| Skill | Manual Tokens | With Skill | Savings | Errors Prevented |
|-------|--------------|------------|---------|------------------|
| cloudflare-workflows | ~15,000 | ~5,000 | 67% | 5 |
| cloudflare-durable-objects | ~18,000 | ~6,000 | 67% | 18 |
| cloudflare-agents | ~20,000 | ~7,000 | 65% | 15 |
| cloudflare-mcp-server | ~40,000 | ~5,000 | 87% | 15 |
| ai-sdk-core | ~14,000 | ~6,000 | 58% | 12 |
| ai-sdk-ui | ~13,000 | ~6,000 | 55% | 12 |
| cloudflare-workers-ai | ~15,000 | ~6,000 | 60% | 6 |

**Average across all skills: ~60-67% token savings, 100% error prevention**

---

**Built with ❤️ by Jeremy Dawes | Jezweb**
