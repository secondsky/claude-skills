# QUICK FIXES CHECKLIST
## Skills Requiring Description Improvements

### 1. MISSING "WHAT DOES" SECTION (18 skills)

Replace opening pattern from "Complete knowledge domain for..." or "Complete guide for..." to action verb pattern.

| Skill | File | Current Opening | Needs |
|-------|------|-----------------|-------|
| ai-sdk-core | `/home/user/claude-skills/skills/ai-sdk-core/SKILL.md` | "Backend AI functionality with..." | Start with "Build server-side AI features..." |
| ai-sdk-ui | `/home/user/claude-skills/skills/ai-sdk-ui/SKILL.md` | "Frontend React hooks for..." | Strengthen with action verb |
| cloudflare-browser-rendering | `/home/user/claude-skills/skills/cloudflare-browser-rendering/SKILL.md` | "Complete knowledge domain for..." | "Automate browser tasks with Puppeteer/Playwright..." |
| cloudflare-cron-triggers | `/home/user/claude-skills/skills/cloudflare-cron-triggers/SKILL.md` | "Complete knowledge domain for..." | "Schedule Workers with cron expressions..." |
| cloudflare-d1 | `/home/user/claude-skills/skills/cloudflare-d1/SKILL.md` | "Complete knowledge domain for..." | "Configure and query D1 SQLite databases..." |
| cloudflare-email-routing | `/home/user/claude-skills/skills/cloudflare-email-routing/SKILL.md` | "Complete guide for..." | "Set up and manage email routing and delivery..." |
| cloudflare-hyperdrive | `/home/user/claude-skills/skills/cloudflare-hyperdrive/SKILL.md` | "Complete knowledge domain for..." | "Connect Workers to PostgreSQL/MySQL with pooling..." |
| cloudflare-kv | `/home/user/claude-skills/skills/cloudflare-kv/SKILL.md` | "Complete knowledge domain for..." | "Store and retrieve data with global KV namespace..." |
| cloudflare-queues | `/home/user/claude-skills/skills/cloudflare-queues/SKILL.md` | "Complete knowledge domain for..." | "Build reliable message queues on Workers..." |
| cloudflare-r2 | `/home/user/claude-skills/skills/cloudflare-r2/SKILL.md` | "Complete knowledge domain for..." | "Store and serve files with S3-compatible R2..." |
| cloudflare-vectorize | `/home/user/claude-skills/skills/cloudflare-vectorize/SKILL.md` | "Complete knowledge domain for..." | "Build RAG systems with vector embeddings..." |
| cloudflare-workers-ai | `/home/user/claude-skills/skills/cloudflare-workers-ai/SKILL.md` | "Complete knowledge domain for..." | "Run ML models and AI inference on Workers..." |
| firecrawl-scraper | `/home/user/claude-skills/skills/firecrawl-scraper/SKILL.md` | "Production-tested setup for..." | "Scrape and extract web content with Firecrawl..." |
| nano-banana-prompts | `/home/user/claude-skills/skills/nano-banana-prompts/SKILL.md` | "Generate optimized prompts..." | Add more specific opening about image generation |
| openai-api | `/home/user/claude-skills/skills/openai-api/SKILL.md` | "Complete guide for..." | "Integrate OpenAI Chat, Embeddings, Vision APIs..." |
| openai-assistants | `/home/user/claude-skills/skills/openai-assistants/SKILL.md` | "Complete guide for..." | "Build stateful conversational AI with Assistants API..." |
| project-workflow | `/home/user/claude-skills/skills/project-workflow/SKILL.md` | [MISSING] | Add full description |
| sveltia-cms | `/home/user/claude-skills/skills/sveltia-cms/SKILL.md` | "Complete Sveltia CMS skill..." | "Manage Git-backed content with Sveltia CMS..." |

---

### 2. FIRST/SECOND PERSON ISSUES (3 skills)

Remove pronouns "you", "your", "we", "our", "I" and use third person.

#### better-chatbot-patterns
**File**: `/home/user/claude-skills/skills/better-chatbot-patterns/SKILL.md`

**Issue**: Uses "your own projects"

**Fix**: Change "in your own projects (not contributing to better-chatbot itself)" to "in custom codebases (not for contributing to better-chatbot itself)"

---

#### cloudflare-workflows
**File**: `/home/user/claude-skills/skills/cloudflare-workflows/SKILL.md`

**Issue**: Weak opening "Complete knowledge domain for..."

**Fix**: Start with "Build durable, multi-step workflows on Cloudflare Workers..."

---

#### open-source-contributions
**File**: `/home/user/claude-skills/skills/open-source-contributions/SKILL.md`

**Issue**: Starts with "Use this skill when..." instead of stating what it does

**Fix**: Start with "Guide developers through open source contribution best practices..."

---

### 3. MISSING "WHEN TO USE" (1 skill)

#### nextjs
**File**: `/home/user/claude-skills/skills/nextjs/SKILL.md`

**Issue**: Starts with "Use this skill for..." which doesn't explain WHAT it provides first

**Fix**: Restructure to first explain what it is, then add "Use when:" section with scenario triggers

---

### 4. VAGUE TERMS (1 skill)

#### multi-ai-consultant
**File**: `/home/user/claude-skills/skills/multi-ai-consultant/SKILL.md`

**Issue**: Uses weak language "Automatically suggests"

**Fix**: Change to "Automatically routes" or "Automatically initiates consultation"

---

### 5. EMPTY/MISSING DESCRIPTION (1 skill)

#### tanstack-start
**File**: `/home/user/claude-skills/skills/tanstack-start/SKILL.md`

**Issue**: Missing description in YAML frontmatter

**Fix**: Add description following official format:
```yaml
description: |
  Build full-stack applications with TanStack Start framework combining
  TanStack Router, Server Functions, and integrated styling. Includes
  serverless and traditional server deployment patterns for Cloudflare,
  Node.js, and edge runtimes.

  Use when: building full-stack apps with TanStack ecosystem,
  implementing Server Functions for API routes, creating file-based
  routing patterns, or configuring TanStack Start for specific deployment
  targets (Cloudflare, Node.js, edge).
```

---

## VERIFICATION CHECKLIST

After making fixes, verify each skill meets these criteria:

- [ ] **Opens with action verb**: "Build", "Configure", "Integrate", "Implement", "Create", "Set up"
- [ ] **No passive openers**: Avoid "Complete knowledge domain for...", "Complete guide for..."
- [ ] **Uses third person only**: No "I", "you", "your", "we", "our"
- [ ] **Includes "Use when:"** with specific scenario triggers
- [ ] **Contains specific keywords**: Framework names, API names, not generic terms
- [ ] **No vague terms**: Avoid "helps", "assists", "may help", "suggests"
- [ ] **Frontmatter complete**: name, description, license fields present

