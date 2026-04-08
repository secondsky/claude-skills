# Package Version Audit Report

**Date**: 2026-04-08
**Scope**: All 33 `package.json` files across the repository
**Status**: Minor bumps completed ✅ — Major bump decisions still pending for 28 files

---

## Critical Issues (Non-Existent Versions — BROKEN)

These packages reference versions that do not exist on npm and will fail to install.

| # | File | Package | Pinned | Actual Latest | Fix |
|---|---|---|---|---|---|
| 1 | `plugins/openai-responses/.../package.json` | `@cloudflare/workers-types` | `^5.0.0` | `4.20260408.1` | ✅ Fixed to `^4.20260408.0` |
| 2 | `plugins/thesys-generative-ui/.../nextjs/package.json` | `@tavily/core` | `^1.0.0` | `0.7.2` | ✅ Fixed to `^0.7.2` |
| 3 | `plugins/thesys-generative-ui/.../vite_react/package.json` | `@tavily/core` | `^1.0.0` | `0.7.2` | ✅ Fixed to `^0.7.2` |

---

## Per-File Audit

### 1. `plugins/ai-sdk-core/skills/ai-sdk-core/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `ai` | ^5.0.116 | 6.0.153 | **MAJOR** | Decision needed |
| `@ai-sdk/openai` | ^2.0.88 | 3.0.52 | **MAJOR** | Decision needed |
| `@ai-sdk/anthropic` | ^2.0.56 | 3.0.68 | **MAJOR** | Decision needed |
| `@ai-sdk/google` | ^2.0.51 | 3.0.60 | **MAJOR** | Decision needed |
| `workers-ai-provider` | ^2.0.0 | 3.1.10 | **MAJOR** | Decision needed |
| `zod` | ^3.23.8 | 4.3.6 | **MAJOR** | Decision needed |
| `@types/node` | ^20.11.0 | 25.5.2 | **MAJOR** | Decision needed |
| `typescript` | ^5.9.3 | 6.0.2 | **MAJOR** | Decision needed |
| `tsx` | ^4.21.0 | 4.21.0 | MINOR | ✅ Updated |

---

### 2. `plugins/ai-sdk-ui/skills/ai-sdk-ui/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `ai` | ^5.0.116 | 6.0.153 | **MAJOR** | Decision needed |
| `@ai-sdk/openai` | ^2.0.88 | 3.0.52 | **MAJOR** | Decision needed |
| `@ai-sdk/anthropic` | ^2.0.56 | 3.0.68 | **MAJOR** | Decision needed |
| `@ai-sdk/google` | ^2.0.51 | 3.0.60 | **MAJOR** | Decision needed |
| `react` | ^18.2.0 | 19.2.4 | **MAJOR** | Decision needed |
| `react-dom` | ^18.2.0 | 19.2.4 | **MAJOR** | Decision needed |
| `next` | ^16.1.5 | 16.2.2 | MINOR | Update |
| `zod` | ^3.23.8 | 4.3.6 | **MAJOR** | Decision needed |
| `workers-ai-provider` | ^2.0.0 | 3.1.10 | **MAJOR** | Decision needed |
| `isomorphic-dompurify` | ^2.16.0 | 3.7.1 | **MAJOR** | Decision needed |
| `react-markdown` | ^9.0.0 | 10.1.0 | **MAJOR** | Decision needed |
| `react-syntax-highlighter` | ^15.5.0 | 16.1.1 | **MAJOR** | Decision needed |
| `@types/react` | ^18.2.0 | 19.2.14 | **MAJOR** | Decision needed |
| `@types/react-dom` | ^18.2.0 | 19.2.3 | **MAJOR** | Decision needed |
| `@types/node` | ^20.0.0 | 25.5.2 | **MAJOR** | Decision needed |
| `typescript` | ^5.9.3 | 6.0.2 | **MAJOR** | Decision needed |
| `eslint` | ^9.39.2 | 10.2.0 | **MAJOR** | Decision needed |
| `@eslint/js` | ^9.39.2 | 10.0.1 | **MAJOR** | Decision needed |
| `eslint-config-next` | ^15.0.0 | 16.2.2 | **MAJOR** | Decision needed |

---

### 3. `plugins/claude-api/skills/claude-api/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@anthropic-ai/sdk` | ^0.85.0 | 0.85.0 | MINOR | ✅ Updated |
| `eslint` | ^8.50.0 | 10.2.0 | **MAJOR** | Decision needed |
| `@typescript-eslint/eslint-plugin` | ^6.0.0 | 8.58.1 | **MAJOR** | Decision needed |
| `@typescript-eslint/parser` | ^6.0.0 | 8.58.1 | **MAJOR** | Decision needed |
| `typescript` | ^5.3.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vitest` | ^1.0.0 | 4.1.3 | **MAJOR** | Decision needed |
| `prettier` | ^3.8.1 | 3.8.1 | MINOR | ✅ Updated |
| `dotenv` | ^16.3.1 | 17.4.1 | **MAJOR** | Decision needed |
| `zod` | ^3.23.0 | 4.3.6 | **MAJOR** | Decision needed |
| `@upstash/redis` | ^1.25.0 | 2.0.8 | **MAJOR** | Decision needed |
| `@types/node` | ^20.0.0 | 25.5.2 | **MAJOR** | Decision needed |
| `tsx` | ^4.21.0 | 4.21.0 | MINOR | ✅ Updated |

---

### 4. `plugins/claude-agent-sdk/skills/claude-agent-sdk/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@anthropic-ai/claude-agent-sdk` | ^0.2.96 | 0.2.96 | MINOR | ✅ Updated |
| `zod` | ^3.23.0 | 4.3.6 | **MAJOR** | Decision needed |
| `typescript` | ^5.3.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 5. `plugins/cloudflare-durable-objects/skills/cloudflare-durable-objects/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^4.81.0 | 4.81.0 | MINOR | ✅ Updated |
| `@cloudflare/workers-types` | ^4.20260408.0 | 4.20260408.1 | MINOR | ✅ Updated |
| `typescript` | ^5.7.2 | 6.0.2 | **MAJOR** | Decision needed |

---

### 6. `plugins/cloudflare-images/skills/cloudflare-images/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^3.95.0 | 4.81.0 | **MAJOR** | Decision needed |
| `@cloudflare/workers-types` | ^4.20260408.0 | 4.20260408.1 | MINOR | ✅ Updated |
| `typescript` | ^5.9.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 7. `plugins/cloudflare-images/skills/cloudflare-images/examples/basic-upload/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^3.91.0 | 4.81.0 | **MAJOR** | Decision needed |
| `hono` | ^4.12.12 | 4.12.12 | MINOR | ✅ Updated |

---

### 8. `plugins/cloudflare-images/skills/cloudflare-images/examples/private-images/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^3.91.0 | 4.81.0 | **MAJOR** | Decision needed |
| `hono` | ^4.12.12 | 4.12.12 | MINOR | ✅ Updated |
| `@tsndr/cloudflare-worker-jwt` | ^2.5.4 | 3.2.1 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.2 | 6.0.2 | **MAJOR** | Decision needed |

---

### 9. `plugins/cloudflare-mcp-server/skills/cloudflare-mcp-server/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^3.103.0 | 4.81.0 | **MAJOR** | Decision needed |
| `@modelcontextprotocol/sdk` | ^1.29.0 | 1.29.0 | MINOR | ✅ Updated |
| `agents` | ^0.10.0 | 0.10.0 | MINOR | ✅ Updated |
| `zod` | ^3.24.1 | 4.3.6 | **MAJOR** | Decision needed |
| `@cloudflare/workers-oauth-provider` | ^0.4.0 | 0.4.0 | MINOR | ✅ Updated |
| `@octokit/rest` | ^21.0.2 | 22.0.1 | **MAJOR** | Decision needed |

---

### 10. `plugins/cloudflare-nextjs/skills/cloudflare-nextjs/references/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `next` | ^16.2.2 | 16.2.2 | MINOR | ✅ Updated |
| `@opennextjs/cloudflare` | ^1.18.1 | 1.18.1 | MINOR | ✅ Updated |
| `wrangler` | ^3 | 4.81.0 | **MAJOR** | Decision needed |

---

### 11. `plugins/drizzle-orm-d1/skills/drizzle-orm-d1/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `drizzle-orm` | ^0.45.2 | 0.45.2 | MINOR | ✅ Updated |
| `hono` | ^4.12.12 | 4.12.12 | MINOR | ✅ Updated |
| `drizzle-kit` | ^0.31.10 | 0.31.10 | MINOR | ✅ Updated |
| `wrangler` | ^4.81.0 | 4.81.0 | MINOR | ✅ Updated |
| `typescript` | ^5.7.3 | 6.0.2 | **MAJOR** | Decision needed |

---

### 12. `plugins/google-gemini-api/skills/google-gemini-api/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@google/genai` | ^1.48.0 | 1.48.0 | MINOR | ✅ Updated |
| `tsx` | ^4.21.0 | 4.21.0 | MINOR | ✅ Updated |
| `typescript` | ^5.3.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 13. `plugins/google-gemini-embeddings/skills/google-gemini-embeddings/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@google/genai` | ^1.48.0 | 1.48.0 | MINOR | ✅ Updated |
| `@types/node` | ^22.0.0 | 25.5.2 | **MAJOR** | Decision needed |
| `typescript` | ^5.6.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 14. `plugins/hono-routing/skills/hono-routing/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `hono` | ^4.12.12 | 4.12.12 | MINOR | ✅ Updated |
| `@hono/valibot-validator` | ^0.6.1 | 0.6.1 | MINOR | ✅ Updated |
| `arktype` | ^2.2.0 | 2.2.0 | MINOR | ✅ Updated |
| `typescript` | ^5.9.0 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^22.10.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 15. `plugins/neon-vercel-postgres/skills/neon-vercel-postgres/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `drizzle-orm` | ^0.45.2 | 0.45.2 | MINOR | ✅ Updated |
| `drizzle-kit` | ^0.31.10 | 0.31.10 | MINOR | ✅ Updated |
| `vite` | ^6.0.0 | 8.0.7 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 16. `plugins/nextjs/skills/nextjs/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `next` | ^16.2.0 | 16.2.2 | MINOR | ✅ Updated |
| `typescript` | ^5.7.0 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^22.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 17. `plugins/openai-agents/skills/openai-agents/templates/shared/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@openai/agents` | ^0.8.3 | 0.8.3 | MINOR | ✅ Updated |
| `@openai/agents-realtime` | ^0.8.3 | 0.8.3 | MINOR | ✅ Updated |
| `zod` | ^3.24.1 | 4.3.6 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.2 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^22.10.2 | 25.5.2 | **MAJOR** | Decision needed |

---

### 18. `plugins/openai-api/skills/openai-api/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `openai` | ^6.33.0 | 6.33.0 | MINOR | ✅ Updated |
| `tsx` | ^4.21.0 | 4.21.0 | MINOR | ✅ Updated |
| `typescript` | ^5.3.3 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^20.11.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 19. `plugins/openai-assistants/skills/openai-assistants/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `openai` | ^6.33.0 | 6.33.0 | MINOR | ✅ Updated |
| `tsx` | ^4.21.0 | 4.21.0 | MINOR | ✅ Updated |
| `typescript` | ^5.3.3 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^20.10.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 20. `plugins/openai-responses/skills/openai-responses/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `openai` | ^5.19.1 | 6.33.0 | **MAJOR** | Decision needed |
| `@cloudflare/workers-types` | ^4.20260408.0 | 4.20260408.1 | **BROKEN** | ✅ Fixed to `^4.20260408.0` |
| `wrangler` | ^3.95.0 | 4.81.0 | **MAJOR** | Decision needed |
| `tsx` | ^4.21.0 | 4.21.0 | MINOR | ✅ Updated |
| `typescript` | ^5.3.3 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^20.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 21. `plugins/playwright/skills/playwright/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@playwright/test` | ^1.59.0 | 1.59.1 | MINOR | ✅ Updated |
| `playwright` | ^1.59.0 | 1.59.1 | MINOR | ✅ Updated |

---

### 22. `plugins/react-hook-form-zod/skills/react-hook-form-zod/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `react-hook-form` | ^7.72.1 | 7.72.1 | MINOR | ✅ Updated |
| `typescript` | ^5.7.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vite` | ^6.3.0 | 8.0.7 | **MAJOR** | Decision needed |
| `@vitejs/plugin-react` | ^4.3.0 | 6.0.1 | **MAJOR** | Decision needed |

---

### 23. `plugins/tanstack-query/skills/tanstack-query/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `react` | ^18.3.1 | 19.2.4 | **MAJOR** | Decision needed |
| `react-dom` | ^18.3.1 | 19.2.4 | **MAJOR** | Decision needed |
| `@tanstack/react-query` | ^5.96.2 | 5.96.2 | MINOR | ✅ Updated |
| `@tanstack/react-query-devtools` | ^5.96.2 | 5.96.2 | MINOR | ✅ Updated |
| `@tanstack/eslint-plugin-query` | ^5.96.2 | 5.96.2 | MINOR | ✅ Updated |
| `@types/react` | ^18.3.12 | 19.2.14 | **MAJOR** | Decision needed |
| `@types/react-dom` | ^18.3.1 | 19.2.3 | **MAJOR** | Decision needed |
| `vite` | ^6.0.1 | 8.0.7 | **MAJOR** | Decision needed |
| `typescript` | ^5.6.3 | 6.0.2 | **MAJOR** | Decision needed |
| `eslint` | ^9.16.0 | 10.2.0 | **MAJOR** | Decision needed |

---

### 24. `plugins/tanstack-router/skills/tanstack-router/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@tanstack/react-router` | ^1.168.10 | 1.168.10 | MINOR | ✅ Updated |
| `@tanstack/router-devtools` | ^1.166.11 | 1.166.11 | MINOR | ✅ Updated |
| `@tanstack/react-query` | ^5.96.2 | 5.96.2 | MINOR | ✅ Updated |
| `@tanstack/router-plugin` | ^1.167.12 | 1.167.12 | MINOR | ✅ Updated |
| `@vitejs/plugin-react` | ^4.3.4 | 6.0.1 | **MAJOR** | Decision needed |
| `typescript` | ^5.8.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vite` | ^6.0.0 | 8.0.7 | **MAJOR** | Decision needed |

---

### 25. `plugins/tanstack-table/skills/tanstack-table/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@tanstack/react-query` | ^5.96.2 | 5.96.2 | MINOR | ✅ Updated |
| `@tanstack/react-virtual` | ^3.13.23 | 3.13.23 | MINOR | ✅ Updated |
| `@vitejs/plugin-react` | ^4.3.4 | 6.0.1 | **MAJOR** | Decision needed |
| `typescript` | ^5.8.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vite` | ^6.0.0 | 8.0.7 | **MAJOR** | Decision needed |

---

### 26. `plugins/thesys-generative-ui/skills/thesys-generative-ui/templates/nextjs/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@thesysai/genui-sdk` | ^0.9.0 | 0.9.0 | MINOR | ✅ Updated |
| `@crayonai/react-ui` | ^0.9.16 | 0.9.16 | MINOR | ✅ Updated |
| `@crayonai/stream` | ^0.5.2 | 0.5.2 | MINOR | ✅ Updated |
| `next` | ^15.1.4 | 16.2.2 | **MAJOR** | Decision needed |
| `openai` | ^4.73.0 | 6.33.0 | **MAJOR** | Decision needed |
| `zod` | ^3.24.1 | 4.3.6 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.3 | 6.0.2 | **MAJOR** | Decision needed |
| `eslint` | ^9.0.0 | 10.2.0 | **MAJOR** | Decision needed |
| `eslint-config-next` | ^15.1.4 | 16.2.2 | **MAJOR** | Decision needed |
| `@tavily/core` | ^0.7.2 | 0.7.2 | **BROKEN** | ✅ Fixed to `^0.7.2` |
| `@clerk/nextjs` | ^6.10.0 | 7.0.11 | **MAJOR** | Decision needed |
| `@types/node` | ^22.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 27. `plugins/thesys-generative-ui/skills/thesys-generative-ui/templates/vite-react/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@thesysai/genui-sdk` | ^0.9.0 | 0.9.0 | MINOR | ✅ Updated |
| `@crayonai/react-ui` | ^0.9.16 | 0.9.16 | MINOR | ✅ Updated |
| `@crayonai/stream` | ^0.5.2 | 0.5.2 | MINOR | ✅ Updated |
| `openai` | ^4.73.0 | 6.33.0 | **MAJOR** | Decision needed |
| `zod` | ^3.24.1 | 4.3.6 | **MAJOR** | Decision needed |
| `@vitejs/plugin-react` | ^4.3.4 | 6.0.1 | **MAJOR** | Decision needed |
| `eslint` | ^9.0.0 | 10.2.0 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.3 | 6.0.2 | **MAJOR** | Decision needed |
| `vite` | ^6.0.5 | 8.0.7 | **MAJOR** | Decision needed |
| `@tavily/core` | ^0.7.2 | 0.7.2 | **BROKEN** | ✅ Fixed to `^0.7.2` |

---

### 28. `plugins/vercel-blob/skills/vercel-blob/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@vercel/blob` | ^2.3.3 | 2.3.3 | MINOR | ✅ Updated |
| `next` | ^15.2.0 | 16.2.2 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.0 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^22.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 29. `plugins/vercel-kv/skills/vercel-kv/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `next` | ^15.2.0 | 16.2.2 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.0 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^22.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 30. `plugins/zod/skills/zod/references/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `zod` | ^4.3.6 | 4.3.6 | OK | No change |
| `typescript` | ^5.5.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vitest` | ^2.0.0 | 4.1.3 | **MAJOR** | Decision needed |
| `@types/node` | ^20.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

## Files With No Issues

| File | Status |
|---|---|
| `package.json` (root) | No dependencies |
| `plugins/mcp-dynamic-orchestrator/package.json` | No runtime dependencies |
| `plugins/chrome-devtools/skills/chrome-devtools/scripts/package.json` | ✅ Updated: `puppeteer ^24.40.0`, `debug ^4.4.3` |
| `plugins/neon-vercel-postgres/.../package.json` | `@neondatabase/serverless ^1.0.2` matches latest 1.0.2 |
| `plugins/cloudflare-durable-objects/.../package.json` | Minor bumps only, covered by ^ |

---

## Decisions — ✅ ALL RESOLVED

All 9 major version bump decisions have been resolved and applied.

### Decision 1: TypeScript 5.x → 6.x ✅ RESOLVED: Keep at ^5.9.3

**Affected files**: 28 of 33 files
**Choice**: B) Keep at `^5.9.3` (newest stable 5.x, consistent across all files)

---

### Decision 2: AI SDK v5 → v6 ✅ RESOLVED: Keep at v5 latest

**Affected files**: `ai-sdk-core`, `ai-sdk-ui`
**Choice**: B) Keep at v5 (updated to `ai ^5.0.170`, template code stays consistent)

---

### Decision 3: React 18 → 19 ✅ RESOLVED: Upgrade to ^19.2.0

**Affected files**: `ai-sdk-ui`, `tanstack-query`
**Choice**: A) Upgrade to `^19.2.0` (+ `@types/react ^19.2.0`, `@types/react-dom ^19.2.0`)

---

### Decision 4: Next.js 15 → 16 ✅ RESOLVED: Upgrade to ^16.2.0

**Affected files**: `thesys-generative-ui/nextjs`, `vercel-blob`, `vercel-kv`
**Choice**: A) Upgrade to `^16.2.0` (+ `eslint-config-next ^16.2.0` for thesys)

---

### Decision 5: Vite 6 → 7 ✅ RESOLVED: Upgrade to Vite 7

**Affected files**: `neon-vercel-postgres`, `react-hook-form-zod`, `tanstack-query`, `tanstack-router`, `tanstack-table`, `thesys/vite-react`
**Choice**: B) Upgrade to `^7.3.0` (+ `@vitejs/plugin-react ^5.2.0`)

---

### Decision 6: Zod 3 → 4 ✅ RESOLVED: Upgrade to ^4.3.0

**Affected files**: `ai-sdk-core`, `ai-sdk-ui`, `claude-api`, `claude-agent-sdk`, `cloudflare-mcp-server`, `openai-agents`, `thesys/nextjs`, `thesys/vite-react`
**Choice**: A) Upgrade all to `^4.3.0`

---

### Decision 7: Wrangler 3 → 4 ✅ RESOLVED: Upgrade to ^4.81.0

**Affected files**: `cloudflare-images/templates`, `cloudflare-images/basic-upload`, `cloudflare-images/private-images`, `cloudflare-mcp-server`, `cloudflare-nextjs`, `openai-responses`
**Choice**: A) Upgrade all to `^4.81.0`

---

### Decision 8: OpenAI SDK ✅ RESOLVED: Mixed upgrade

**Affected files**: `openai-responses` (^5.19.1), `thesys/nextjs` (^4.73.0), `thesys/vite-react` (^4.73.0)
**Choice**: `openai-responses` upgraded to `^6.33.0`; `thesys` stays at latest v4 (`^4.104.0`)

---

### Decision 9: ESLint 9 → 10 ✅ RESOLVED: Upgrade to ^10.0.0

**Affected files**: `ai-sdk-ui`, `claude-api`, `tanstack-query`, `thesys/nextjs`, `thesys/vite-react`
**Choice**: A) Upgrade all to `^10.2.0` (+ `@eslint/js ^10.0.1`, `@typescript-eslint/* ^8.58.1`)

---

## Summary

| Metric | Count |
|---|---|
| Total `package.json` files scanned | 33 |
| Files updated | 28 |
| Files already current | 5 |
| **Broken version pins fixed** | **3 ✅** |
| Minor version bumps applied | ~40 ✅ |
| Major version bumps applied | ~35 ✅ |
| Decisions resolved | 9/9 ✅ |

### Major Version Changes Applied

| Change | Decision | Files Affected |
|---|---|---|
| TypeScript pinned to `^5.9.3` | Keep at 5.x (consistent) | 28 files |
| AI SDK pinned to `^5.0.170` | Keep at v5 | 2 files (ai-sdk-core, ai-sdk-ui) |
| React `^18` → `^19.2.0` | Upgrade | 2 files (ai-sdk-ui, tanstack-query) |
| Next.js `^15` → `^16.2.0` | Upgrade | 3 files (thesys, vercel-blob, vercel-kv) |
| Vite `^6` → `^7.3.0` | Upgrade to v7 | 6 files |
| `@vitejs/plugin-react` `^4` → `^5.2.0` | Companion to Vite 7 | 5 files |
| Zod `^3` → `^4.3.0` | Upgrade | 8 files |
| Wrangler `^3` → `^4.81.0` | Upgrade | 6 files |
| OpenAI `^5.19` → `^6.33.0` | Upgrade (openai-responses) | 1 file |
| OpenAI `^4.73` → `^4.104.0` | Latest v4 (thesys) | 2 files |
| ESLint `^8/9` → `^10.2.0` | Upgrade | 5 files |

### Quick Wins (✅ ALL COMPLETED)

All minor version updates and broken pin fixes have been applied:

| File | Packages Updated |
|---|---|
| `playwright` | ✅ `@playwright/test ^1.59.0`, `playwright ^1.59.0` |
| `drizzle-orm-d1` | ✅ `drizzle-orm ^0.45.2`, `hono ^4.12.12`, `drizzle-kit ^0.31.10`, `wrangler ^4.81.0` |
| `cloudflare-durable-objects` | ✅ `wrangler ^4.81.0`, `@cloudflare/workers-types ^4.20260408.0` |
| `openai-api` | ✅ `openai ^6.33.0`, `tsx ^4.21.0` |
| `openai-assistants` | ✅ `openai ^6.33.0`, `tsx ^4.21.0` |
| `google-gemini-api` | ✅ `@google/genai ^1.48.0`, `tsx ^4.21.0` |
| `google-gemini-embeddings` | ✅ `@google/genai ^1.48.0` |
| `ai-sdk-core` | ✅ `tsx ^4.21.0` |
| `ai-sdk-ui` | ✅ `next ^16.2.2` |
| `claude-api` | ✅ `@anthropic-ai/sdk ^0.85.0`, `prettier ^3.8.1`, `tsx ^4.21.0` |
| `claude-agent-sdk` | ✅ `@anthropic-ai/claude-agent-sdk ^0.2.96` |
| `cloudflare-images/templates` | ✅ `@cloudflare/workers-types ^4.20260408.0` |
| `cloudflare-images/basic-upload` | ✅ `hono ^4.12.12` |
| `cloudflare-images/private-images` | ✅ `hono ^4.12.12` |
| `cloudflare-mcp-server` | ✅ `@modelcontextprotocol/sdk ^1.29.0`, `agents ^0.10.0`, `@cloudflare/workers-oauth-provider ^0.4.0` |
| `cloudflare-nextjs` | ✅ `next ^16.2.2`, `@opennextjs/cloudflare ^1.18.1` |
| `hono-routing` | ✅ `hono ^4.12.12`, `@hono/valibot-validator ^0.6.1`, `arktype ^2.2.0` |
| `neon-vercel-postgres` | ✅ `drizzle-orm ^0.45.2`, `drizzle-kit ^0.31.10` |
| `nextjs` | ✅ `next ^16.2.2` |
| `openai-agents` | ✅ `@openai/agents ^0.8.3`, `@openai/agents-realtime ^0.8.3` |
| `openai-responses` | ✅ `@cloudflare/workers-types ^4.20260408.0` (broken pin fixed), `tsx ^4.21.0` |
| `react-hook-form-zod` | ✅ `react-hook-form ^7.72.1` |
| `tanstack-query` | ✅ `@tanstack/react-query ^5.96.2`, `@tanstack/react-query-devtools ^5.96.2`, `@tanstack/eslint-plugin-query ^5.96.2` |
| `tanstack-router` | ✅ `@tanstack/react-router ^1.168.10`, `@tanstack/router-devtools ^1.166.11`, `@tanstack/react-query ^5.96.2`, `@tanstack/router-plugin ^1.167.12` |
| `tanstack-table` | ✅ `@tanstack/react-query ^5.96.2`, `@tanstack/react-virtual ^3.13.23` |
| `thesys/nextjs` | ✅ `@thesysai/genui-sdk ^0.9.0`, `@crayonai/react-ui ^0.9.16`, `@crayonai/stream ^0.5.2`, `@tavily/core ^0.7.2` (broken pin fixed) |
| `thesys/vite-react` | ✅ `@thesysai/genui-sdk ^0.9.0`, `@crayonai/react-ui ^0.9.16`, `@crayonai/stream ^0.5.2`, `@tavily/core ^0.7.2` (broken pin fixed) |
| `vercel-blob` | ✅ `@vercel/blob ^2.3.3` |
| `chrome-devtools` | ✅ `puppeteer ^24.40.0`, `debug ^4.4.3` |

---

*Report generated: 2026-04-08 | Next review: 2026-07-08 (quarterly)*
