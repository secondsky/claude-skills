# Package Version Audit Report

**Date**: 2026-04-08
**Scope**: All 33 `package.json` files across the repository
**Status**: 28 files need updates, 5 files OK, 3 broken version pins

---

## Critical Issues (Non-Existent Versions — BROKEN)

These packages reference versions that do not exist on npm and will fail to install.

| # | File | Package | Pinned | Actual Latest | Fix |
|---|---|---|---|---|---|
| 1 | `plugins/openai-responses/.../package.json` | `@cloudflare/workers-types` | `^5.0.0` | `4.20260408.1` | Change to `^4.20260408.0` |
| 2 | `plugins/thesys-generative-ui/.../nextjs/package.json` | `@tavily/core` | `^1.0.0` | `0.7.2` | Change to `^0.7.2` |
| 3 | `plugins/thesys-generative-ui/.../vite_react/package.json` | `@tavily/core` | `^1.0.0` | `0.7.2` | Change to `^0.7.2` |

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
| `tsx` | ^4.7.0 | 4.21.0 | MINOR | Update |

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
| `@anthropic-ai/sdk` | ^0.67.0 | 0.85.0 | MINOR | Update |
| `eslint` | ^8.50.0 | 10.2.0 | **MAJOR** | Decision needed |
| `@typescript-eslint/eslint-plugin` | ^6.0.0 | 8.58.1 | **MAJOR** | Decision needed |
| `@typescript-eslint/parser` | ^6.0.0 | 8.58.1 | **MAJOR** | Decision needed |
| `typescript` | ^5.3.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vitest` | ^1.0.0 | 4.1.3 | **MAJOR** | Decision needed |
| `prettier` | ^3.0.3 | 3.8.1 | MINOR | Update |
| `dotenv` | ^16.3.1 | 17.4.1 | **MAJOR** | Decision needed |
| `zod` | ^3.23.0 | 4.3.6 | **MAJOR** | Decision needed |
| `@upstash/redis` | ^1.25.0 | 2.0.8 | **MAJOR** | Decision needed |
| `@types/node` | ^20.0.0 | 25.5.2 | **MAJOR** | Decision needed |
| `tsx` | ^4.0.0 | 4.21.0 | MINOR | Update |

---

### 4. `plugins/claude-agent-sdk/skills/claude-agent-sdk/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@anthropic-ai/claude-agent-sdk` | ^0.1.0 | 0.2.96 | MINOR | Update |
| `zod` | ^3.23.0 | 4.3.6 | **MAJOR** | Decision needed |
| `typescript` | ^5.3.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 5. `plugins/cloudflare-durable-objects/skills/cloudflare-durable-objects/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^4.43.0 | 4.81.0 | MINOR | Update |
| `@cloudflare/workers-types` | ^4.20251014.0 | 4.20260408.1 | MINOR | Update |
| `typescript` | ^5.7.2 | 6.0.2 | **MAJOR** | Decision needed |

---

### 6. `plugins/cloudflare-images/skills/cloudflare-images/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^3.95.0 | 4.81.0 | **MAJOR** | Decision needed |
| `@cloudflare/workers-types` | ^4.20241112.0 | 4.20260408.1 | MINOR | Update |
| `typescript` | ^5.9.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 7. `plugins/cloudflare-images/skills/cloudflare-images/examples/basic-upload/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^3.91.0 | 4.81.0 | **MAJOR** | Decision needed |
| `hono` | ^4.7.10 | 4.12.12 | MINOR | Update |

---

### 8. `plugins/cloudflare-images/skills/cloudflare-images/examples/private-images/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^3.91.0 | 4.81.0 | **MAJOR** | Decision needed |
| `hono` | ^4.7.10 | 4.12.12 | MINOR | Update |
| `@tsndr/cloudflare-worker-jwt` | ^2.5.4 | 3.2.1 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.2 | 6.0.2 | **MAJOR** | Decision needed |

---

### 9. `plugins/cloudflare-mcp-server/skills/cloudflare-mcp-server/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `wrangler` | ^3.103.0 | 4.81.0 | **MAJOR** | Decision needed |
| `@modelcontextprotocol/sdk` | ^1.21.0 | 1.29.0 | MINOR | Update |
| `agents` | ^0.3.5 | 0.10.0 | MINOR | Update |
| `zod` | ^3.24.1 | 4.3.6 | **MAJOR** | Decision needed |
| `@cloudflare/workers-oauth-provider` | ^0.0.13 | 0.4.0 | MINOR | Update |
| `@octokit/rest` | ^21.0.2 | 22.0.1 | **MAJOR** | Decision needed |

---

### 10. `plugins/cloudflare-nextjs/skills/cloudflare-nextjs/references/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `next` | ^16.1.5 | 16.2.2 | MINOR | Update |
| `@opennextjs/cloudflare` | ^1.3.0 | 1.18.1 | MINOR | Update |
| `wrangler` | ^3 | 4.81.0 | **MAJOR** | Decision needed |

---

### 11. `plugins/drizzle-orm-d1/skills/drizzle-orm-d1/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `drizzle-orm` | ^0.44.7 | 0.45.2 | MINOR | Update |
| `hono` | ^4.6.11 | 4.12.12 | MINOR | Update |
| `drizzle-kit` | ^0.31.5 | 0.31.10 | MINOR | Update |
| `wrangler` | ^4.43.0 | 4.81.0 | MINOR | Update |
| `typescript` | ^5.7.3 | 6.0.2 | **MAJOR** | Decision needed |

---

### 12. `plugins/google-gemini-api/skills/google-gemini-api/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@google/genai` | ^1.27.0 | 1.48.0 | MINOR | Update |
| `tsx` | ^4.7.0 | 4.21.0 | MINOR | Update |
| `typescript` | ^5.3.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 13. `plugins/google-gemini-embeddings/skills/google-gemini-embeddings/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@google/genai` | ^1.27.0 | 1.48.0 | MINOR | Update |
| `@types/node` | ^22.0.0 | 25.5.2 | **MAJOR** | Decision needed |
| `typescript` | ^5.6.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 14. `plugins/hono-routing/skills/hono-routing/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `hono` | ^4.10.2 | 4.12.12 | MINOR | Update |
| `@hono/valibot-validator` | ^0.5.3 | 0.6.1 | MINOR | Update |
| `arktype` | ^2.0.0 | 2.2.0 | MINOR | Update |
| `typescript` | ^5.9.0 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^22.10.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 15. `plugins/neon-vercel-postgres/skills/neon-vercel-postgres/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `drizzle-orm` | ^0.44.7 | 0.45.2 | MINOR | Update |
| `vite` | ^6.0.0 | 8.0.7 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.0 | 6.0.2 | **MAJOR** | Decision needed |

---

### 16. `plugins/nextjs/skills/nextjs/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `next` | ^16.0.0 | 16.2.2 | MINOR | Update |
| `typescript` | ^5.7.0 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^22.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 17. `plugins/openai-agents/skills/openai-agents/templates/shared/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@openai/agents` | ^0.2.1 | 0.8.3 | MINOR | Update |
| `@openai/agents-realtime` | ^0.2.1 | 0.8.3 | MINOR | Update |
| `zod` | ^3.24.1 | 4.3.6 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.2 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^22.10.2 | 25.5.2 | **MAJOR** | Decision needed |

---

### 18. `plugins/openai-api/skills/openai-api/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `openai` | ^6.7.0 | 6.33.0 | MINOR | Update |
| `tsx` | ^4.7.0 | 4.21.0 | MINOR | Update |
| `typescript` | ^5.3.3 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^20.11.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 19. `plugins/openai-assistants/skills/openai-assistants/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `openai` | ^6.7.0 | 6.33.0 | MINOR | Update |
| `tsx` | ^4.7.0 | 4.21.0 | MINOR | Update |
| `typescript` | ^5.3.3 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^20.10.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 20. `plugins/openai-responses/skills/openai-responses/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `openai` | ^5.19.1 | 6.33.0 | **MAJOR** | Decision needed |
| `@cloudflare/workers-types` | ^5.0.0 | 4.20260408.1 | **BROKEN** | Fix to `^4.20260408.0` |
| `wrangler` | ^3.95.0 | 4.81.0 | **MAJOR** | Decision needed |
| `tsx` | ^4.7.1 | 4.21.0 | MINOR | Update |
| `typescript` | ^5.3.3 | 6.0.2 | **MAJOR** | Decision needed |
| `@types/node` | ^20.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 21. `plugins/playwright/skills/playwright/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@playwright/test` | ^1.55.0 | 1.59.1 | MINOR | Update |
| `playwright` | ^1.55.0 | 1.59.1 | MINOR | Update |

---

### 22. `plugins/react-hook-form-zod/skills/react-hook-form-zod/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `react-hook-form` | ^7.65.0 | 7.72.1 | MINOR | Update |
| `typescript` | ^5.7.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vite` | ^6.3.0 | 8.0.7 | **MAJOR** | Decision needed |
| `@vitejs/plugin-react` | ^4.3.0 | 6.0.1 | **MAJOR** | Decision needed |

---

### 23. `plugins/tanstack-query/skills/tanstack-query/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `react` | ^18.3.1 | 19.2.4 | **MAJOR** | Decision needed |
| `react-dom` | ^18.3.1 | 19.2.4 | **MAJOR** | Decision needed |
| `@tanstack/react-query` | ^5.90.12 | 5.96.2 | MINOR | Update |
| `@tanstack/react-query-devtools` | ^5.91.1 | 5.96.2 | MINOR | Update |
| `@tanstack/eslint-plugin-query` | ^5.91.2 | 5.96.2 | MINOR | Update |
| `@types/react` | ^18.3.12 | 19.2.14 | **MAJOR** | Decision needed |
| `@types/react-dom` | ^18.3.1 | 19.2.3 | **MAJOR** | Decision needed |
| `vite` | ^6.0.1 | 8.0.7 | **MAJOR** | Decision needed |
| `typescript` | ^5.6.3 | 6.0.2 | **MAJOR** | Decision needed |
| `eslint` | ^9.16.0 | 10.2.0 | **MAJOR** | Decision needed |

---

### 24. `plugins/tanstack-router/skills/tanstack-router/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@tanstack/react-router` | ^1.134.13 | 1.168.10 | MINOR | Update |
| `@tanstack/router-devtools` | ^1.134.13 | 1.166.11 | MINOR | Update |
| `@tanstack/react-query` | ^5.90.7 | 5.96.2 | MINOR | Update |
| `@tanstack/router-plugin` | ^1.134.13 | 1.167.12 | MINOR | Update |
| `@vitejs/plugin-react` | ^4.3.4 | 6.0.1 | **MAJOR** | Decision needed |
| `typescript` | ^5.8.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vite` | ^6.0.0 | 8.0.7 | **MAJOR** | Decision needed |

---

### 25. `plugins/tanstack-table/skills/tanstack-table/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@tanstack/react-query` | ^5.90.7 | 5.96.2 | MINOR | Update |
| `@tanstack/react-virtual` | ^3.13.12 | 3.13.23 | MINOR | Update |
| `@vitejs/plugin-react` | ^4.3.4 | 6.0.1 | **MAJOR** | Decision needed |
| `typescript` | ^5.8.0 | 6.0.2 | **MAJOR** | Decision needed |
| `vite` | ^6.0.0 | 8.0.7 | **MAJOR** | Decision needed |

---

### 26. `plugins/thesys-generative-ui/skills/thesys-generative-ui/templates/nextjs/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@thesysai/genui-sdk` | ^0.6.40 | 0.9.0 | MINOR | Update |
| `@crayonai/react-ui` | ^0.8.42 | 0.9.16 | MINOR | Update |
| `@crayonai/stream` | ^0.1.0 | 0.5.2 | MINOR | Update |
| `next` | ^15.1.4 | 16.2.2 | **MAJOR** | Decision needed |
| `openai` | ^4.73.0 | 6.33.0 | **MAJOR** | Decision needed |
| `zod` | ^3.24.1 | 4.3.6 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.3 | 6.0.2 | **MAJOR** | Decision needed |
| `eslint` | ^9.0.0 | 10.2.0 | **MAJOR** | Decision needed |
| `eslint-config-next` | ^15.1.4 | 16.2.2 | **MAJOR** | Decision needed |
| `@tavily/core` | ^1.0.0 | 0.7.2 | **BROKEN** | Fix to `^0.7.2` |
| `@clerk/nextjs` | ^6.10.0 | 7.0.11 | **MAJOR** | Decision needed |
| `@types/node` | ^22.0.0 | 25.5.2 | **MAJOR** | Decision needed |

---

### 27. `plugins/thesys-generative-ui/skills/thesys-generative-ui/templates/vite-react/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@thesysai/genui-sdk` | ^0.6.40 | 0.9.0 | MINOR | Update |
| `@crayonai/react-ui` | ^0.8.42 | 0.9.16 | MINOR | Update |
| `@crayonai/stream` | ^0.1.0 | 0.5.2 | MINOR | Update |
| `openai` | ^4.73.0 | 6.33.0 | **MAJOR** | Decision needed |
| `zod` | ^3.24.1 | 4.3.6 | **MAJOR** | Decision needed |
| `@vitejs/plugin-react` | ^4.3.4 | 6.0.1 | **MAJOR** | Decision needed |
| `eslint` | ^9.0.0 | 10.2.0 | **MAJOR** | Decision needed |
| `typescript` | ^5.7.3 | 6.0.2 | **MAJOR** | Decision needed |
| `vite` | ^6.0.5 | 8.0.7 | **MAJOR** | Decision needed |
| `@tavily/core` | ^1.0.0 | 0.7.2 | **BROKEN** | Fix to `^0.7.2` |

---

### 28. `plugins/vercel-blob/skills/vercel-blob/templates/package.json`

| Package | Current | Latest | Bump | Action |
|---|---|---|---|---|
| `@vercel/blob` | ^2.0.0 | 2.3.3 | MINOR | Update |
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
| `plugins/chrome-devtools/skills/chrome-devtools/scripts/package.json` | `puppeteer ^24.15.0` (latest 24.40.0, covered by ^), `debug ^4.4.0` (latest 4.4.3, OK) |
| `plugins/neon-vercel-postgres/.../package.json` | `@neondatabase/serverless ^1.0.2` matches latest 1.0.2 |
| `plugins/cloudflare-durable-objects/.../package.json` | Minor bumps only, covered by ^ |

---

## Decisions Needed

The following major version bumps require a decision before applying. Each has potential breaking changes that may require template code updates.

### Decision 1: TypeScript 5.x → 6.x

**Affected files**: 28 of 33 files
**Current range**: ^5.3.0 to ^5.9.3
**Latest stable**: 6.0.2
**Risk**: Medium — TypeScript major bumps typically have some breaking type-checking behaviors
**Recommendation**: Upgrade. TS 6 is stable and all modern frameworks support it.

**Choice**:
- [ ] A) Upgrade all to `^6.0.2`
- [ ] B) Keep at `^5.x` (pin to `^5.9.3` for consistency)

---

### Decision 2: AI SDK v5 → v6

**Affected files**: `ai-sdk-core`, `ai-sdk-ui`
**Packages**: `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `workers-ai-provider`
**Current**: ai ^5.0.116, providers ^2.x
**Latest**: ai 6.0.153, providers ^3.x
**Risk**: High — AI SDK v6 has significant API changes (different streaming API, tool calling patterns)
**Recommendation**: Upgrade — these are template files meant to show latest patterns.

**Choice**:
- [ ] A) Upgrade all to v6 (ai ^6.0.0, providers ^3.0.0, workers-ai-provider ^3.0.0)
- [ ] B) Keep at v5 (update to latest v5.x minors only)

---

### Decision 3: React 18 → 19

**Affected files**: `ai-sdk-ui`, `tanstack-query`
**Current**: ^18.2.0 / ^18.3.1
**Latest**: 19.2.4
**Risk**: Medium — React 19 has breaking changes (ref cleanup, use of hooks, etc.)
**Recommendation**: Upgrade for consistency — most other files already use React 19.

**Choice**:
- [ ] A) Upgrade to `^19.2.0` (+ `@types/react ^19.0.0`, `@types/react-dom ^19.0.0`)
- [ ] B) Keep at React 18

---

### Decision 4: Next.js 15 → 16

**Affected files**: `thesys-generative-ui/nextjs`, `vercel-blob`, `vercel-kv`
**Current**: ^15.1.4 / ^15.2.0
**Latest**: 16.2.2
**Risk**: Medium-High — Next.js major bumps often change routing/build behavior
**Recommendation**: Upgrade — `nextjs` and `cloudflare-nextjs` plugins already target v16.

**Choice**:
- [ ] A) Upgrade to `^16.2.0` (+ `eslint-config-next ^16.0.0`)
- [ ] B) Keep at Next 15

---

### Decision 5: Vite 6 → 8

**Affected files**: `neon-vercel-postgres`, `react-hook-form-zod`, `tanstack-query`, `tanstack-router`, `tanstack-table`, `thesys/vite-react`
**Current**: ^6.0.0 to ^6.3.0
**Latest**: 8.0.7
**Risk**: Medium — Vite 7 and 8 both had breaking changes (Node 18 drop, plugin API changes)
**Recommendation**: Upgrade — Vite 8 is stable and significantly faster.

**Choice**:
- [ ] A) Upgrade all to `^8.0.0` (+ `@vitejs/plugin-react ^6.0.0`)
- [ ] B) Upgrade to Vite 7 only (`^7.0.0`)
- [ ] C) Keep at Vite 6

---

### Decision 6: Zod 3 → 4

**Affected files**: `ai-sdk-core`, `ai-sdk-ui`, `claude-api`, `claude-agent-sdk`, `cloudflare-mcp-server`, `openai-agents`, `thesys/nextjs`, `thesys/vite-react`
**Current**: ^3.23.0 to ^3.24.1
**Latest**: 4.3.6
**Risk**: Medium — Zod 4 has a different API in places (`.refine` changes, error handling)
**Recommendation**: Upgrade for consistency — `zod`, `hono-routing`, and `react-hook-form-zod` plugins already use Zod 4.

**Choice**:
- [ ] A) Upgrade all to `^4.3.0`
- [ ] B) Keep at Zod 3

---

### Decision 7: Wrangler 3 → 4

**Affected files**: `cloudflare-images/templates`, `cloudflare-images/basic-upload`, `cloudflare-images/private-images`, `cloudflare-mcp-server`, `cloudflare-nextjs`
**Current**: ^3.91.0 to ^3.103.0
**Latest**: 4.81.0
**Risk**: Low-Medium — Wrangler 4 is mostly backward compatible with 3
**Recommendation**: Upgrade — `cloudflare-durable-objects` and `drizzle-orm-d1` already use Wrangler 4.

**Choice**:
- [ ] A) Upgrade all to `^4.81.0`
- [ ] B) Keep at Wrangler 3

---

### Decision 8: OpenAI SDK v4/v5 → v6

**Affected files**: `openai-responses` (^5.19.1), `thesys/nextjs` (^4.73.0), `thesys/vite-react` (^4.73.0)
**Current**: ^4.73.0 / ^5.19.1
**Latest**: 6.33.0
**Risk**: High — Major API changes between v4→v5→v6
**Recommendation**: Upgrade — `openai-api` and `openai-assistants` already use v6.

**Choice**:
- [ ] A) Upgrade all to `^6.33.0`
- [ ] B) Upgrade thesys to ^6.0.0, keep openai-responses at ^5.x
- [ ] C) Keep current versions

---

### Decision 9: ESLint 9 → 10

**Affected files**: `ai-sdk-ui`, `claude-api`, `tanstack-query`, `thesys/nextjs`, `thesys/vite-react`
**Current**: ^8.50.0 / ^9.0.0 to ^9.39.2
**Latest**: 10.2.0
**Risk**: Medium — Flat config changes in ESLint 10
**Recommendation**: Upgrade — ESLint 10 is stable.

**Choice**:
- [ ] A) Upgrade all to `^10.0.0`
- [ ] B) Keep at ESLint 9

---

## Summary

| Metric | Count |
|---|---|
| Total `package.json` files scanned | 33 |
| Files needing updates | 28 |
| Files already current | 5 |
| **Broken version pins (non-existent)** | **3** |
| Major version bump decisions | 9 |
| Total major bumps across all files | ~75 |
| Total minor bumps across all files | ~40 |

### Quick Wins (No Decision Needed — Minor Bumps Only)

These files only need minor version updates and can be fixed immediately:

| File | Packages to Update |
|---|---|
| `playwright` | `@playwright/test ^1.59.0`, `playwright ^1.59.0` |
| `drizzle-orm-d1` | `drizzle-orm ^0.45.0`, `hono ^4.12.0`, `drizzle-kit ^0.31.10`, `wrangler ^4.81.0` |
| `cloudflare-durable-objects` | `wrangler ^4.81.0`, `@cloudflare/workers-types ^4.20260408.0` |
| `openai-api` | `openai ^6.33.0`, `tsx ^4.21.0` |
| `openai-assistants` | `openai ^6.33.0`, `tsx ^4.21.0` |
| `google-gemini-api` | `@google/genai ^1.48.0`, `tsx ^4.21.0` |
| `google-gemini-embeddings` | `@google/genai ^1.48.0` |

---

*Report generated: 2026-04-08 | Next review: 2026-07-08 (quarterly)*
