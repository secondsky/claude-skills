# Project Overview

Complete reference for the cloudflare-full-stack-scaffold project structure, helper scripts, and what's included.

**Last Updated**: 2025-12-09

---

## Table of Contents

1. [Getting the Scaffold](#getting-the-scaffold)
2. [Complete Scaffold Structure](#complete-scaffold-structure)
3. [Helper Scripts Reference](#helper-scripts-reference)
4. [Reference Documentation](#reference-documentation)
5. [What's Included](#whats-included)

---

## Getting the Scaffold

A fully working application you can **copy, customize, and deploy** immediately:

```bash
# Copy the scaffold
cp -r scaffold/ my-new-app/
cd my-new-app/

# Install dependencies
bun install

# Initialize core services (D1, KV, R2)
./scripts/init-services.sh

# Create database tables
npm run d1:local

# Start developing
npm run dev
```

**Result**: Full-stack app running in ~5 minutes with:
- ✅ Frontend and backend connected
- ✅ Core Cloudflare services configured (D1, KV, R2, Workers AI)
- ✅ AI SDK ready with multiple providers
- ✅ Planning docs and session handoff protocol
- ✅ Dark mode, theming, UI components
- ✅ Optional features (1 script each to enable):
  - Clerk Auth (`npm run enable-auth`)
  - AI Chat UI (`npm run enable-ai-chat`)
  - Queues (`npm run enable-queues`)
  - Vectorize (`npm run enable-vectorize`)

---

## Complete Scaffold Structure

```
scaffold/
├── package.json              # All dependencies (React, Hono, AI SDK, Clerk)
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Cloudflare Vite plugin
├── wrangler.jsonc           # All Cloudflare services configured
├── .dev.vars.example        # Environment variables template
├── .gitignore               # Standard ignores
├── README.md                # Project-specific readme
├── CLAUDE.md                # Project instructions for Claude
├── SCRATCHPAD.md            # Session handoff protocol
├── CHANGELOG.md             # Version history
├── schema.sql               # D1 database schema
│
├── docs/                    # Complete planning docs
│   ├── ARCHITECTURE.md      # System architecture overview
│   ├── DATABASE_SCHEMA.md   # D1 database schema documentation
│   ├── API_ENDPOINTS.md     # Backend API endpoint specifications
│   ├── IMPLEMENTATION_PHASES.md  # Development phases and milestones
│   ├── UI_COMPONENTS.md     # Frontend component specifications
│   └── TESTING.md           # Testing strategy and test cases
│
├── migrations/              # D1 migrations
│   └── 0001_initial.sql     # Initial database setup
│
├── src/                     # Frontend (React + Vite + Tailwind v4)
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main App component with routing
│   ├── index.css            # Tailwind v4 theming with CSS variables
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (Button, Card, etc.)
│   │   ├── ThemeProvider.tsx     # Dark mode context provider
│   │   ├── ProtectedRoute.tsx    # Auth guard (COMMENTED, enable with script)
│   │   └── ChatInterface.tsx     # AI chat component (COMMENTED, enable with script)
│   ├── lib/
│   │   ├── utils.ts         # cn() utility for className merging
│   │   └── api-client.ts    # Fetch wrapper with error handling
│   └── pages/
│       ├── Home.tsx         # Landing page
│       ├── Dashboard.tsx    # Main dashboard with data fetching
│       └── Chat.tsx         # AI chat page (COMMENTED, enable with script)
│
└── backend/                 # Backend (Hono + Cloudflare)
    ├── src/
    │   └── index.ts         # Main Worker entry point with all routes
    ├── middleware/
    │   ├── cors.ts          # CORS middleware (applied before routes)
    │   └── auth.ts          # JWT verification middleware (COMMENTED, enable with script)
    ├── routes/
    │   ├── api.ts           # Basic API routes (health check, echo)
    │   ├── d1.ts            # D1 database examples (CRUD operations)
    │   ├── kv.ts            # KV namespace examples (get, put, delete)
    │   ├── r2.ts            # R2 bucket examples (upload, download)
    │   ├── ai.ts            # Workers AI direct binding examples
    │   ├── ai-sdk.ts        # AI SDK examples (multiple providers, streaming)
    │   ├── vectorize.ts     # Vectorize examples (vector search, RAG)
    │   └── queues.ts        # Queues examples (async message processing)
    └── db/
        └── queries.ts       # D1 typed query helpers with error handling
```

### Directory Purposes

**Root Files**:
- `package.json`: All dependencies pre-configured (React 19, Hono, AI SDK v5, Tailwind v4, Clerk)
- `tsconfig.json`: TypeScript configuration with strict mode
- `vite.config.ts`: Cloudflare Vite plugin with all bindings configured
- `wrangler.jsonc`: Cloudflare services configuration (D1, KV, R2, Workers AI, Queues, Vectorize)
- `.dev.vars.example`: Template for environment variables (copy to `.dev.vars`)
- `schema.sql`: D1 database schema for initial setup

**docs/**:
- Complete planning documentation for the project
- Architecture diagrams and system design
- Database schema documentation with relationships
- API endpoint specifications with request/response examples
- Implementation phases and development roadmap
- UI component specifications and design patterns
- Testing strategy and test cases

**migrations/**:
- D1 database migration files
- Versioned schema changes
- Applied via `wrangler d1 migrations apply`

**src/** (Frontend):
- React 19 application with TypeScript
- Vite for fast dev server and HMR
- Tailwind v4 with CSS variables for theming
- shadcn/ui components for consistent UI
- React Router for client-side routing
- Dark mode with ThemeProvider context

**backend/** (Worker):
- Hono routing framework (fast, type-safe)
- Cloudflare Workers runtime
- All Cloudflare services pre-configured (D1, KV, R2, Workers AI)
- CORS middleware for frontend-backend communication
- Optional Clerk JWT auth (commented, enable with script)
- Typed query helpers for D1 database

---

## Helper Scripts Reference

### `scripts/setup-project.sh`

**Purpose**: Create a new project from the scaffold with proper initialization.

**What it does**:
1. Copies scaffold to new directory (prompts for name)
2. Renames project in `package.json`
3. Initializes git repository (`git init`)
4. Runs `bun install` to install dependencies
5. Prompts to initialize Cloudflare services
6. Creates `.dev.vars` from `.dev.vars.example`

**Usage**:
```bash
./scripts/setup-project.sh
# Follow prompts to enter project name
```

**When to use**: Starting a brand new project from scratch.

---

### `scripts/init-services.sh`

**Purpose**: Initialize core Cloudflare services (D1, KV, R2) via Wrangler.

**What it does**:
1. Creates D1 database: `wrangler d1 create <project>-db`
2. Creates KV namespace: `wrangler kv:namespace create <project>-kv`
3. Creates R2 bucket: `wrangler r2 bucket create <project>-bucket`
4. Extracts IDs from wrangler output
5. Updates `wrangler.jsonc` with actual IDs
6. Displays next steps (run migrations)

**Usage**:
```bash
./scripts/init-services.sh
```

**When to use**:
- After copying scaffold to new directory
- Before first `npm run dev`
- Ensures all bindings are configured

**Note**: Queues and Vectorize are created separately when you enable them (optional features).

---

### `scripts/enable-auth.sh`

**Purpose**: Enable Clerk authentication throughout the application.

**What it does**:
1. **Uncomments auth patterns** in:
   - `src/components/ProtectedRoute.tsx` (auth guard component)
   - `backend/middleware/auth.ts` (JWT verification)
   - `backend/src/index.ts` (middleware registration)
   - `src/App.tsx` (protected routes)
2. **Prompts for Clerk API keys**:
   - Publishable key (for frontend)
   - Secret key (for backend)
3. **Updates environment variables**:
   - Adds keys to `.dev.vars` (backend)
   - Adds publishable key to `.env` (frontend)
4. **Provides Clerk dashboard setup instructions**:
   - Configure JWT template
   - Add allowed origins
   - Test authentication flow

**Usage**:
```bash
npm run enable-auth
# Or directly:
./scripts/enable-auth.sh
```

**When to use**:
- When adding user authentication to your app
- Before implementing protected routes
- Requires Clerk account (free tier available)

**What gets enabled**:
- Sign-up and sign-in flows
- Protected routes with auth guards
- JWT verification on backend
- Session management
- User profile access

**See also**: `references/enabling-auth.md` for detailed setup walkthrough.

---

### `scripts/enable-ai-chat.sh`

**Purpose**: Enable AI chat interface with AI SDK v5 UI.

**What it does**:
1. **Uncomments chat components**:
   - `src/components/ChatInterface.tsx` (useChat hook, message rendering)
   - `src/pages/Chat.tsx` (chat page)
   - Chat route in `src/App.tsx`
2. **Enables AI SDK UI patterns**:
   - `useChat` hook for chat state
   - `DefaultChatTransport` for backend communication
   - Message rendering with `message.parts[]` (v5 format)
3. **Prompts for AI provider**:
   - Workers AI (no API key needed) - default
   - OpenAI (GPT-4o, GPT-4-turbo)
   - Anthropic (Claude Sonnet, Opus)
   - Google Gemini (Flash, Pro)
4. **Updates environment variables**:
   - Adds API key to `.dev.vars` if external provider selected

**Usage**:
```bash
npm run enable-ai-chat
# Or directly:
./scripts/enable-ai-chat.sh
```

**When to use**:
- Building chatbot or AI assistant
- Adding conversational AI to your app
- Implementing customer support chat
- Creating AI-powered features

**What gets enabled**:
- Full chat interface with message history
- Streaming responses
- Multiple AI provider support (switch in 1 line)
- Loading states and error handling
- Markdown rendering in messages

**See also**: `references/ai-sdk-guide.md` for AI SDK patterns, `references/full-stack-patterns.md` for chat interface implementation.

---

### `scripts/enable-queues.sh`

**Purpose**: Enable Cloudflare Queues for async message processing.

**What it does**:
1. **Uncomments Queues patterns**:
   - `backend/routes/queues.ts` (send, receive, batch operations)
   - Queue bindings in `wrangler.jsonc`
   - Queue bindings in `vite.config.ts`
2. **Provides queue creation instructions**:
   - `wrangler queues create <project>-queue`
   - Copy queue ID to `wrangler.jsonc`
3. **Updates backend**:
   - Registers queue routes in `backend/src/index.ts`
   - Enables queue consumer handler

**Usage**:
```bash
npm run enable-queues
# Or directly:
./scripts/enable-queues.sh
```

**When to use**:
- Async background processing (email sending, image processing)
- Decoupling long-running tasks from request handlers
- Rate limiting and throttling
- Event-driven architectures
- Reliable message delivery

**What gets enabled**:
- Send messages to queue from API routes
- Consumer handler for processing messages
- Batch operations for efficiency
- Dead letter queue support
- Retry logic and error handling

---

### `scripts/enable-vectorize.sh`

**Purpose**: Enable Cloudflare Vectorize for vector search and RAG.

**What it does**:
1. **Uncomments Vectorize patterns**:
   - `backend/routes/vectorize.ts` (insert, query, upsert, delete vectors)
   - Vectorize bindings in `wrangler.jsonc`
   - Vectorize bindings in `vite.config.ts`
2. **Provides index creation instructions**:
   - `wrangler vectorize create <project>-index --dimensions=1536 --metric=cosine`
   - Copy index name to `wrangler.jsonc`
3. **Configures embedding dimensions**:
   - Default: 1536 (OpenAI text-embedding-3-small)
   - Customizable for different embedding models
4. **Updates backend**:
   - Registers Vectorize routes in `backend/src/index.ts`
   - Provides embedding generation examples

**Usage**:
```bash
npm run enable-vectorize
# Or directly:
./scripts/enable-vectorize.sh
```

**When to use**:
- Building RAG (Retrieval-Augmented Generation) applications
- Semantic search over documents
- Similarity search (find similar content)
- Recommendation systems
- Content discovery

**What gets enabled**:
- Vector insertion and querying
- Metadata filtering
- Similarity search with configurable distance metrics
- Batch operations for efficiency
- Integration with AI SDK for RAG

**See also**: `references/service-configuration.md` for Vectorize configuration details.

---

## Reference Documentation

The scaffold includes comprehensive reference documentation in the `references/` directory:

### `references/quick-start-guide.md`
- **Purpose**: 5-minute setup walkthrough from zero to running app
- **Contains**:
  - Step-by-step setup instructions
  - First deployment to Cloudflare
  - Common customizations
  - Troubleshooting setup issues
- **When to load**: Starting a new project, first deployment, setup troubleshooting

### `references/service-configuration.md`
- **Purpose**: Details on each Cloudflare service
- **Contains**:
  - D1 database configuration and patterns
  - KV namespace usage and best practices
  - R2 bucket configuration and examples
  - Workers AI model catalog and usage
  - Vectorize index configuration
  - Queues setup and consumer patterns
- **When to load**: Configuring services, understanding service capabilities, debugging service issues

### `references/ai-sdk-guide.md`
- **Purpose**: AI SDK Core and UI patterns
- **Contains**:
  - AI SDK Core vs UI comparison
  - Provider switching patterns (Workers AI, OpenAI, Anthropic, Gemini)
  - Streaming responses with `streamText`
  - Tool calling patterns
  - RAG implementation patterns
- **When to load**: Implementing AI features, switching providers, building chat interfaces, adding RAG

### `references/customization-guide.md`
- **Purpose**: Customizing the scaffold to your needs
- **Contains**:
  - Removing unused services step-by-step
  - Adding new API routes
  - Adding new frontend pages
  - Switching AI providers
  - Customizing theme (Tailwind v4 CSS variables)
  - Modifying project structure
- **When to load**: Removing services you don't need, customizing appearance, extending functionality

### `references/enabling-auth.md`
- **Purpose**: Clerk authentication setup walkthrough
- **Contains**:
  - Clerk dashboard setup
  - JWT template configuration
  - Testing authentication flow
  - Protected routes implementation
  - Common auth issues and solutions
- **When to load**: Setting up authentication, configuring Clerk, implementing protected routes

### `references/supporting-libraries-guide.md`
- **Purpose**: Complete dependency list and patterns
- **Contains**:
  - All package versions with latest verification dates
  - React Hook Form integration patterns
  - Zod v4 validation patterns
  - TanStack Query v5 data fetching patterns
  - Full-stack validation (shared schemas)
  - Troubleshooting dependency issues
- **When to load**: Checking package versions, implementing forms and validation, data fetching patterns

### `references/full-stack-patterns.md`
- **Purpose**: Industry-standard patterns for forms, data, and AI chat
- **Contains**:
  - React Hook Form patterns
  - Zod v4 validation patterns
  - TanStack Query v5 patterns
  - Full-stack validation (single schema, frontend + backend)
  - AI Chat interface patterns (AI SDK v5 UI)
  - Complete working examples
- **When to load**: Implementing forms, adding validation, setting up data fetching, building chat interfaces

### `references/architecture-patterns.md`
- **Purpose**: Critical architectural patterns and configurations
- **Contains**:
  - Frontend-backend connection (same-port architecture)
  - Environment variables (.env vs .dev.vars)
  - CORS configuration and common errors
  - Auth patterns with race condition warnings
  - Correct vs incorrect code examples
- **When to load**: Understanding architecture, debugging CORS, configuring environment variables, implementing auth

---

## What's Included

### Frontend Stack
- **React 19**: Latest React with TypeScript
- **Vite**: Fast dev server with HMR
- **React Router 7**: Client-side routing
- **Tailwind v4**: CSS framework with CSS variables for theming
- **shadcn/ui**: High-quality UI components (Button, Card, Dialog, etc.)
- **React Hook Form**: Performant form state management
- **Zod v4**: TypeScript-first schema validation
- **TanStack Query v5**: Smart data fetching and caching
- **Dark Mode**: Built-in with ThemeProvider

### Backend Stack
- **Cloudflare Workers**: Serverless runtime (globally distributed)
- **Hono**: Fast, type-safe routing framework
- **D1**: SQLite database (serverless SQL)
- **KV**: Key-value storage (fast, global)
- **R2**: Object storage (S3-compatible)
- **Workers AI**: AI inference on Cloudflare infrastructure
- **Vectorize**: Vector database for RAG (optional, enable with script)
- **Queues**: Message queue for async processing (optional, enable with script)

### AI Integration
- **AI SDK v5 Core**: Provider-agnostic AI patterns
- **AI SDK v5 UI**: React hooks for chat interfaces
- **Workers AI Provider**: Run AI on Cloudflare (no API key)
- **OpenAI Integration**: GPT-4o, GPT-4-turbo support
- **Anthropic Integration**: Claude Sonnet, Opus support
- **Google Gemini Integration**: Flash, Pro support

### Auth (Optional)
- **Clerk**: Modern authentication platform
- **JWT Verification**: Backend middleware for protected routes
- **Protected Routes**: Frontend route guards
- **Session Management**: Automatic session handling

### Planning & Documentation
- **Complete docs/**: Architecture, database schema, API specs, phases, UI components, testing
- **CLAUDE.md**: Project instructions for Claude Code CLI
- **SCRATCHPAD.md**: Session handoff protocol for Claude
- **README.md**: Project-specific readme
- **CHANGELOG.md**: Version history

### Development Tools
- **TypeScript**: Strict type checking throughout
- **ESLint**: Code linting (configured)
- **Prettier**: Code formatting (configured)
- **Wrangler**: Cloudflare CLI for deployment and testing
- **Helper Scripts**: Enable features with one command

---

## Next Steps

After copying the scaffold:

1. **Initialize Services**: Run `./scripts/init-services.sh` to create D1, KV, R2
2. **Run Migrations**: `npm run d1:local` to create database tables
3. **Start Dev Server**: `npm run dev` to start building
4. **Enable Features** (optional):
   - Auth: `npm run enable-auth`
   - AI Chat: `npm run enable-ai-chat`
   - Queues: `npm run enable-queues`
   - Vectorize: `npm run enable-vectorize`
5. **Customize**: Remove unused services, customize theme, add your features

**See also**:
- `references/quick-start-guide.md` for detailed setup walkthrough
- `references/customization-guide.md` for removing unused features
- `references/service-configuration.md` for service-specific configuration

---

**Last Updated**: 2025-12-09
**Scaffold Version**: 1.0.0
**Maintained By**: cloudflare-full-stack-scaffold skill
