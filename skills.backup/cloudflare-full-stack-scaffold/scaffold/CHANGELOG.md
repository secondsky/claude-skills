# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **enable-queues.sh** script to enable Cloudflare Queues as optional feature
- **enable-vectorize.sh** script to enable Cloudflare Vectorize as optional feature
- npm scripts: `enable-queues` and `enable-vectorize`
- `scaffold/scripts/` folder for all enable scripts (self-contained scaffold)

### Changed
- **BREAKING**: Queues now optional (commented out by default) - enable with `npm run enable-queues`
- **BREAKING**: Vectorize now optional (commented out by default) - enable with `npm run enable-vectorize`
- Scaffold now has core services (D1, KV, R2, Workers AI) + optional advanced features (Clerk, AI Chat, Queues, Vectorize)
- Simplified base setup from 5 services to 3 core services for faster initial development
- Updated all documentation to reflect optional architecture
- npm script paths changed from `../scripts/` to `./scripts/` (scripts now in scaffold)

### Deprecated

### Removed

### Fixed
- **CRITICAL**: Workers AI import fixed - changed from non-existent `@ai-sdk/cloudflare-workers-ai` to correct `workers-ai-provider` package
- **CRITICAL**: ChatInterface.tsx updated to use AI SDK v5 `status` property instead of removed `isLoading` (6 occurrences)
- **CRITICAL**: Updated @ai-sdk/react from ^1.0.0 to ^2.0.76 (latest version with v5 API)
- **CRITICAL**: Fixed @cloudflare/workers-types version from non-existent ^5.0.0 to correct ^4.20251014.0 (uses date-based versioning)
- **OUTDATED**: Updated wrangler from ^4.0.0 to ^4.44.0 (latest stable version)
- **OUTDATED**: Updated react-router-dom from ^7.1.3 to ^7.9.4 (8 minor versions behind)
- **OUTDATED**: Updated tailwindcss from ^4.1.14 to ^4.1.15 (patch version update)
- **OUTDATED**: Updated @tailwindcss/vite from ^4.1.14 to ^4.1.15 (patch version update)
- **OPTIMIZATION**: Added `run_worker_first: ["/api/*"]` to wrangler.jsonc assets config for improved API route performance
- **BEST PRACTICE**: Updated compatibility_date from 2025-04-01 to 2025-10-01 for access to newer Workers features
- **BEST PRACTICE**: Backend now uses `convertToModelMessages()` utility instead of manual message conversion
- **BEST PRACTICE**: Backend now uses `toUIMessageStreamResponse()` instead of `toDataStreamResponse()`
- **BEST PRACTICE**: Backend now imports and uses `UIMessage` type from 'ai' package for better type safety
- **BEST PRACTICE**: Standardized React Router imports to use 'react-router' (per official v7 docs) instead of mixed 'react-router-dom'
- **DOCUMENTATION**: Updated SKILL.md examples to show correct AI SDK v5 usage patterns with `status` property

### Security

## [1.0.0] - 2025-10-23

### Added
- Initial project scaffold with React 19.2 + Cloudflare Workers + Hono 4
- All Cloudflare services configured (D1, KV, R2, Workers AI, Vectorize, Queues)
- AI SDK v5 Core + UI integration with multiple providers
- Optional Clerk authentication (5.53.3)
- React Router 7 for navigation
- Complete planning docs structure (6 docs)
- Session handoff protocol (SCRATCHPAD.md)
- Tailwind v4.1.14 + shadcn/ui with dark mode
- Helper scripts for setup, auth, and AI chat
- Typed D1 query helpers with batch operations
- npm scripts for enable-auth and enable-ai-chat

### Changed
- Standardized all Cloudflare binding names with `MY_` prefix for consistency
- Updated package.json to include convenience scripts

### Fixed
- ChatInterface.tsx comment marker typo (AILABEL → AI CHAT)
- KV binding name consistency across all files
- R2 binding renamed from BUCKET → MY_BUCKET
- Vectorize binding renamed from VECTORIZE_INDEX → MY_VECTORIZE
- All bindings now use consistent MY_ prefix pattern

## [0.1.0] - 2025-10-23

### Added
- Initial scaffold release
