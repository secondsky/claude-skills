# Architecture Documentation

**Project**: [Your Project Name]
**Last Updated**: [YYYY-MM-DD]

---

## System Overview

TODO: Describe your system architecture

**Core Services** (always available):
- Frontend: React 19 + Vite + Tailwind v4
- Backend: Cloudflare Workers + Hono
- Database: D1 (SQL)
- Storage: KV (key-value), R2 (object storage)
- AI: Workers AI, AI SDK

**Optional Services** (enable with npm scripts):
- Vector DB: Vectorize (`npm run enable-vectorize`)
- Queues: Cloudflare Queues (`npm run enable-queues`)
- Auth: Clerk (`npm run enable-auth`)
- AI Chat: AI SDK UI (`npm run enable-ai-chat`)

---

## Frontend Architecture

TODO: Describe frontend structure

---

## Backend Architecture

TODO: Describe backend routes and middleware

---

## Data Flow

TODO: Describe how data flows through the system

---

## Security

TODO: Document auth, CORS, and security patterns
