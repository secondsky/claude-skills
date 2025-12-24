# Default Stack Knowledge

This document describes the default technology stack assumptions for project planning when the user hasn't specified otherwise.

---

## Assumed Stack (from User's CLAUDE.md)

**Frontend**:
- Vite + React + Tailwind v4 + shadcn/ui

**Backend**:
- Cloudflare Workers with Static Assets

**Database**:
- D1 (SQL with migrations)

**Storage**:
- R2 (object storage)
- KV (key-value cache/config)

**Auth**:
- Clerk (JWT verification with custom templates)

**State Management**:
- TanStack Query (server state)
- Zustand (client state)

**Forms**:
- React Hook Form + Zod validation

**Deployment**:
- Wrangler CLI

**Runtime**:
- Cloudflare Workers (not Node.js)

---

## When to Ask About Stack Choices

Only ask about stack choices when:
- User mentions non-standard technology (e.g., "I want to use Express")
- Project has unique requirements (high scale, legacy integration, specific platform)
- Cloudflare stack seems inappropriate for the use case

---

## Why These Defaults

This stack is optimized for:
- **Fast development**: Vite build, shadcn/ui components, TanStack Query
- **Global deployment**: Cloudflare Workers edge network
- **Type safety**: TypeScript throughout, Zod validation
- **Modern patterns**: Server state management, form handling
- **Cost efficiency**: Cloudflare free tier is generous

If the user's project doesn't fit this stack, ask clarifying questions rather than assuming.
