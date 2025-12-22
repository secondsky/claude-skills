# Google Gemini File Search Templates

This directory contains working example projects demonstrating different deployment patterns for Gemini File Search.

## Templates

### 🚧 basic-node-rag/ (TO BE IMPLEMENTED)
Minimal Node.js/TypeScript example for learning and prototyping.

**Features:**
- Simple TypeScript setup
- Create store → Upload documents → Query → Display citations
- Single-file example (~200 lines)
- Perfect for understanding core concepts

**Use When:**
- Learning File Search API
- Quick prototyping
- Building CLI tools

### 🚧 cloudflare-worker-rag/ (TO BE IMPLEMENTED)
Edge deployment with Cloudflare Workers + R2 integration.

**Features:**
- Cloudflare Workers with @cloudflare/vite-plugin
- R2 integration for document storage
- Edge API endpoints (upload, query)
- Hybrid architecture (Gemini File Search + Cloudflare edge)
- Wrangler configuration

**Use When:**
- Building global edge applications
- Integrating with Cloudflare stack (D1, R2, KV)
- Need low-latency worldwide

### 🚧 nextjs-docs-search/ (TO BE IMPLEMENTED)
Full-stack Next.js application with UI.

**Features:**
- Next.js 14+ App Router
- Document upload UI with drag-and-drop
- Real-time search interface
- Citation rendering with source links
- Metadata filtering UI
- Tailwind CSS + shadcn/ui
- TypeScript throughout

**Use When:**
- Building production documentation sites
- Creating knowledge base UIs
- Need full-stack app with frontend

## Structure

Each template includes:
- `README.md` - Setup and deployment instructions
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variables template
- `src/` - Source code
- Working example with sample data

## Development Status

**Completed:** 0/3 templates (0%)

**Priority:**
1. basic-node-rag (foundational example)
2. nextjs-docs-search (most practical for users)
3. cloudflare-worker-rag (advanced integration)

## Notes

All templates demonstrate:
- Proper error handling from SKILL.md
- Recommended chunking configurations
- Metadata schema best practices
- Operation polling patterns
- Cost-aware implementations
