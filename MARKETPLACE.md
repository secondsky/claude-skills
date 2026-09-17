# Claude Skills — Plugin Catalog

> **Generated file — do not edit by hand.** Regenerated from
> [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) by
> `scripts/generate-marketplace.sh` (invoked via `scripts/sync-plugins.sh`).

**145 plugins** · marketplace version **3.9.0** · generated 2026-09-17

## Installing

```
/plugin marketplace add secondsky/claude-skills
/plugin install <plugin-name>@claude-skills
```

Multi-skill plugins (for example `bun` or `cloudflare-workers`) install all of their skills in one step.

## Catalog

### ai (7)

| Plugin | Description |
| --- | --- |
| [`gemini-cli`](plugins/gemini-cli) | Google Gemini CLI for second opinions, architectural advice, code reviews, security audits. Leverage 1M+ context for comprehensive codebase analysis via command-line tool. |
| [`ml-model-training`](plugins/ml-model-training) | Train ML models with scikit-learn, PyTorch, TensorFlow. Use for classification/regression, neural networks, hyperparameter tuning, or encountering overfitting, underfitting, convergence issues. |
| [`ml-pipeline-automation`](plugins/ml-pipeline-automation) | Automate ML workflows with Airflow, Kubeflow, MLflow. Use for reproducible pipelines, retraining schedules, MLOps, or encountering task failures, dependency errors, experiment tracking issues. |
| [`model-deployment`](plugins/model-deployment) | Deploy ML models with FastAPI, Docker, Kubernetes. Use for serving predictions, containerization, monitoring, drift detection, or encountering latency issues, health check failures, version conflicts. |
| [`multi-ai-consultant`](plugins/multi-ai-consultant) | Consult external AIs (Gemini 2.5 Pro, OpenAI Codex, Claude) for second opinions. Use for debugging failures, architectural decisions, security validation, or need fresh perspective with synthesis. |
| [`tanstack-ai`](plugins/tanstack-ai) | TanStack AI (alpha) provider-agnostic type-safe chat with streaming for OpenAI, Anthropic, Gemini, Ollama. Use for chat APIs, React/Solid frontends with useChat/ChatClient, isomorphic tools, tool approval flows, agent loops, multimodal inputs, or troubleshooting streaming and tool definitions. |
| [`thesys-generative-ui`](plugins/thesys-generative-ui) | AI-powered generative UI with Thesys - create React components from natural language. |

### api (16)

| Plugin | Description |
| --- | --- |
| [`api-changelog-versioning`](plugins/api-changelog-versioning) | Creates comprehensive API changelogs documenting breaking changes, deprecations, and migration strategies for API consumers. Use when managing API versions, communicating breaking changes, or creating upgrade guides. |
| [`api-contract-testing`](plugins/api-contract-testing) | Verifies API contracts between services using consumer-driven contracts, schema validation, and tools like Pact. Use when testing microservices communication, preventing breaking changes, or validating OpenAPI specifications. |
| [`api-design-principles`](plugins/api-design-principles) | Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable APIs that delight developers. Use when designing new APIs, reviewing API specifications, or establishing API design standards. |
| [`api-error-handling`](plugins/api-error-handling) | Implements standardized API error responses with proper status codes, logging, and user-friendly messages. Use when building production APIs, implementing error recovery patterns, or integrating error monitoring services. |
| [`api-filtering-sorting`](plugins/api-filtering-sorting) | Builds flexible API filtering and sorting systems with query parameter parsing, validation, and security. Use when implementing search endpoints, building data grids, or creating dynamic query APIs. |
| [`api-gateway-configuration`](plugins/api-gateway-configuration) | Configures API gateways for routing, authentication, rate limiting, and request transformation in microservice architectures. Use when setting up Kong, Nginx, AWS API Gateway, or Traefik for centralized API management. |
| [`api-pagination`](plugins/api-pagination) | Implements efficient API pagination using offset, cursor, and keyset strategies for large datasets. Use when building paginated endpoints, implementing infinite scroll, or optimizing database queries for collections. |
| [`api-rate-limiting`](plugins/api-rate-limiting) | Implements API rate limiting using token bucket, sliding window, and Redis-based algorithms to protect against abuse. Use when securing public APIs, implementing tiered access, or preventing denial-of-service attacks. |
| [`api-reference-documentation`](plugins/api-reference-documentation) | Creates professional API documentation using OpenAPI specifications with endpoints, authentication, and interactive examples. Use when documenting REST APIs, creating SDK references, or building developer portals. |
| [`api-response-optimization`](plugins/api-response-optimization) | Optimizes API performance through payload reduction, caching strategies, and compression techniques. Use when improving API response times, reducing bandwidth usage, or implementing efficient caching. |
| [`api-security-hardening`](plugins/api-security-hardening) | REST API security hardening with authentication, rate limiting, input validation, security headers. Use for production APIs, security audits, defense-in-depth, or encountering vulnerabilities, injection attacks, CORS issues. |
| [`api-testing`](plugins/api-testing) | HTTP API testing for TypeScript (Supertest) and Python (httpx, pytest). Test REST APIs, GraphQL, request/response validation, authentication, and error handling. |
| [`api-versioning-strategy`](plugins/api-versioning-strategy) | Implements API versioning using URL paths, headers, or query parameters with backward compatibility and deprecation strategies. Use when managing multiple API versions, planning breaking changes, or designing migration paths. |
| [`graphql-implementation`](plugins/graphql-implementation) | Builds GraphQL APIs with schema design, resolvers, error handling, and performance optimization using Apollo or Graphene. Use when creating flexible query APIs, migrating from REST, or implementing real-time subscriptions. |
| [`rest-api-design`](plugins/rest-api-design) | Designs RESTful APIs with proper resource naming, HTTP methods, status codes, and response formats. Use when building new APIs, establishing API conventions, or designing developer-friendly interfaces. |
| [`websocket-implementation`](plugins/websocket-implementation) | Implements real-time WebSocket communication with connection management, room-based messaging, and horizontal scaling. Use when building chat systems, live notifications, collaborative tools, or real-time dashboards. |

### architecture (3)

| Plugin | Description |
| --- | --- |
| [`architecture-patterns`](plugins/architecture-patterns) | Implement proven backend architecture patterns including Clean Architecture, Hexagonal Architecture, and Domain-Driven Design. Use when architecting complex backend systems or refactoring existing applications for better maintainability. |
| [`health-check-endpoints`](plugins/health-check-endpoints) | Health check endpoints for liveness, readiness, dependency monitoring. Use for Kubernetes, load balancers, auto-scaling, or encountering probe failures, startup delays, dependency checks, timeout configuration errors. |
| [`microservices-patterns`](plugins/microservices-patterns) | Design microservices architectures with service boundaries, event-driven communication, and resilience patterns. Use when building distributed systems, decomposing monoliths, or implementing microservices. |

### auth (4)

| Plugin | Description |
| --- | --- |
| [`api-authentication`](plugins/api-authentication) | Secure API authentication with JWT, OAuth 2.0, API keys. Use for authentication systems, third-party integrations, service-to-service communication, or encountering token management, security headers, auth flow errors. |
| [`better-auth`](plugins/better-auth) | Skill for integrating Better Auth - comprehensive TypeScript authentication framework for Cloudflare D1, Next.js, Nuxt, and 15+ frameworks. Use when adding auth, encountering D1 adapter errors, or implementing OAuth/2FA/RBAC features. |
| [`oauth-implementation`](plugins/oauth-implementation) | OAuth 2.0 and OpenID Connect authentication with secure flows. Use for third-party integrations, SSO systems, token-based API access, or encountering authorization code flow, PKCE, token refresh, scope management errors. |
| [`session-management`](plugins/session-management) | Implements secure session management with JWT tokens, Redis storage, refresh flows, and proper cookie configuration. Use when building authentication systems, managing user sessions, or implementing secure logout functionality. |

### cloudflare (21)

| Plugin | Description |
| --- | --- |
| [`cloudflare-agents`](plugins/cloudflare-agents) | Build AI agents on Cloudflare Workers with MCP integration, tool use, and LLM providers. |
| [`cloudflare-browser-rendering`](plugins/cloudflare-browser-rendering) | Cloudflare Browser Rendering with Puppeteer/Playwright. Use for screenshots, PDFs, web scraping, or encountering rendering errors, timeout issues, memory exceeded. |
| [`cloudflare-cron-triggers`](plugins/cloudflare-cron-triggers) | Cloudflare Cron Triggers for scheduled Workers execution. Use for periodic tasks, scheduled jobs, or encountering handler not found, invalid cron expression, timezone errors. |
| [`cloudflare-d1`](plugins/cloudflare-d1) | Cloudflare D1 serverless SQLite on edge. Use for databases, migrations, bindings, or encountering D1_ERROR, statement too long, too many requests queued errors. |
| [`cloudflare-durable-objects`](plugins/cloudflare-durable-objects) | Cloudflare Durable Objects for stateful coordination and real-time apps. Use for chat, multiplayer games, WebSocket hibernation, or encountering class export, migration, alarm errors. |
| [`cloudflare-email-routing`](plugins/cloudflare-email-routing) | Cloudflare Email Routing for receiving/sending emails via Workers. Use for email workers, forwarding, allowlists, or encountering Email Trigger errors, worker call failures, SPF issues. |
| [`cloudflare-hyperdrive`](plugins/cloudflare-hyperdrive) | Cloudflare Hyperdrive for Workers-to-database connections with pooling and caching. Use for PostgreSQL/MySQL, Drizzle/Prisma, or encountering pool errors, TLS issues, connection refused. |
| [`cloudflare-images`](plugins/cloudflare-images) | This skill should be used when the user asks to "upload images to Cloudflare", "implement direct creator upload", "configure image transformations", "optimize WebP/AVIF", "create image variants", "generate signed URLs", "add image watermarks", "integrate with Next.js/Remix", "configure webhooks", "debug CORS errors", "troubleshoot error 5408/9401-9413", or "build responsive images with Cloudflare Images API". |
| [`cloudflare-kv`](plugins/cloudflare-kv) | Cloudflare Workers KV global key-value storage. Use for namespaces, caching, TTL, or encountering KV_ERROR, 429 rate limits, consistency issues. |
| [`cloudflare-manager`](plugins/cloudflare-manager) | Comprehensive Cloudflare account management for deploying Workers, KV Storage, R2, Pages, DNS, and Routes. Use when deploying cloudflare services, managing worker containers, configuring KV/R2 storage, or setting up DNS/routing. Requires CLOUDFLARE_API_KEY in .env and Bun runtime with dependencies installed. |
| [`cloudflare-mcp-server`](plugins/cloudflare-mcp-server) | Build MCP (Model Context Protocol) servers on Cloudflare Workers with tools, resources, and prompts. |
| [`cloudflare-nextjs`](plugins/cloudflare-nextjs) | Deploy Next.js to Cloudflare Workers via the OpenNext adapter (@opennextjs/cloudflare). Use for SSR/ISR/SSG, App or Pages Router, getCloudflareContext, bindings (D1/R2/KV/AI/Hyperdrive), caching tiers, skew protection, multi-worker, custom worker, env vars, or worker size/runtime/keep_names/FinalizationRegistry/connection-scoping errors. |
| [`cloudflare-queues`](plugins/cloudflare-queues) | This skill should be used when the user asks to "set up Cloudflare Queues", "create a message queue", "implement queue consumer", "process background jobs", "configure queue retry logic", "publish messages to queue", "implement dead letter queue", or encountering "queue timeout", "message retry", "throughput exceeded", "queue backlog" errors. |
| [`cloudflare-r2`](plugins/cloudflare-r2) | Cloudflare R2 S3-compatible object storage with SQL, Iceberg, event notifications, and automation. Use for buckets, uploads, CORS, presigned URLs, large files, S3 migration, analytics, or encountering R2_ERROR, CORS failures, multipart issues. |
| [`cloudflare-sandbox`](plugins/cloudflare-sandbox) | Cloudflare Sandboxes SDK for secure code execution in Linux containers at edge. Use for untrusted code, Python/Node.js scripts, AI code interpreters, git operations. |
| [`cloudflare-turnstile`](plugins/cloudflare-turnstile) | Cloudflare Turnstile CAPTCHA-alternative bot protection. Use for forms, login security, API protection, or encountering CSP errors, token validation failures, error codes 100*/300*/600*. |
| [`cloudflare-vectorize`](plugins/cloudflare-vectorize) | Cloudflare Vectorize vector database for semantic search and RAG. Use for vector indexes, embeddings, similarity search, or encountering dimension mismatches, filter errors. |
| [`cloudflare-workers`](plugins/cloudflare-workers) | Comprehensive Cloudflare Workers platform guide covering runtime APIs, testing (Vitest), CI/CD, observability, framework integration, performance, security, and migration. Use for Workers development, deployment, debugging, or optimization. |
| [`cloudflare-workers-ai`](plugins/cloudflare-workers-ai) | Cloudflare Workers AI for serverless GPU inference. Use for LLMs, text/image generation, embeddings, or encountering AI_ERROR, rate limits, token exceeded errors. |
| [`cloudflare-workflows`](plugins/cloudflare-workflows) | Cloudflare Workflows for durable long-running execution. Use for multi-step workflows, retries, state persistence, or encountering NonRetryableError, execution failed errors. |
| [`cloudflare-zero-trust-access`](plugins/cloudflare-zero-trust-access) | Cloudflare Zero Trust Access authentication for Workers. Use for JWT validation, service tokens, CORS, or encountering preflight blocking, cache race conditions, missing JWT headers. |

### cms (2)

| Plugin | Description |
| --- | --- |
| [`hugo`](plugins/hugo) | Hugo static site generator with Tailwind v4, headless CMS (Sveltia/Tina), Cloudflare deployment. Use for blogs, docs sites, or encountering theme installation, frontmatter, baseURL errors. |
| [`wordpress-plugin-core`](plugins/wordpress-plugin-core) | WordPress plugin development with hooks, security, REST API, custom post types. Use for plugin creation, $wpdb queries, Settings API, or encountering SQL injection, XSS, CSRF, nonce errors. |

### data (2)

| Plugin | Description |
| --- | --- |
| [`recommendation-engine`](plugins/recommendation-engine) | Build recommendation systems with collaborative filtering, matrix factorization, hybrid approaches. Use for product recommendations, personalization, or encountering cold start, sparsity, quality evaluation issues. |
| [`recommendation-system`](plugins/recommendation-system) | Deploy production recommendation systems with feature stores, caching, A/B testing. Use for personalization APIs, low latency serving, or encountering cache invalidation, experiment tracking, quality monitoring issues. |

### database (1)

| Plugin | Description |
| --- | --- |
| [`drizzle-orm-d1`](plugins/drizzle-orm-d1) | Type-safe ORM for Cloudflare D1 databases using Drizzle. Use when: building D1 database schemas, writing type-safe SQL queries, managing migrations with Drizzle Kit, defining table relations, implementing prepared statements, using D1 batch API, or encountering D1_ERROR, transaction errors, foreign key constraint failures, or schema inference issues. |

### design (4)

| Plugin | Description |
| --- | --- |
| [`design-review`](plugins/design-review) | 7-phase frontend design review with accessibility (WCAG 2.1 AA), responsive testing, visual polish. Use for PR reviews, UI audits, or encountering contrast issues, broken layouts, accessibility violations, inconsistent spacing, missing focus states. |
| [`design-system-creation`](plugins/design-system-creation) | Creates comprehensive design systems with typography, colors, components, and documentation for consistent UI development. Use when establishing design standards, building component libraries, or ensuring cross-team consistency. |
| [`interaction-design`](plugins/interaction-design) | Creates intuitive user experiences through feedback patterns, microinteractions, and accessible interaction design. Use when designing loading states, error handling UX, animation guidelines, or touch interactions. |
| [`kpi-dashboard-design`](plugins/kpi-dashboard-design) | Designs effective KPI dashboards with proper metric selection, visual hierarchy, and data visualization best practices. Use when building executive dashboards, creating analytics views, or presenting business metrics. |

### documentation (1)

| Plugin | Description |
| --- | --- |
| [`technical-specification`](plugins/technical-specification) | Creates detailed technical specifications for software projects covering requirements, architecture, APIs, and testing strategies. Use when planning features, documenting system design, or creating architecture decision records. |

### frontend (26)

| Plugin | Description |
| --- | --- |
| [`aceternity-ui`](plugins/aceternity-ui) | 100+ animated React components (Aceternity UI) for Next.js with Tailwind. Use for hero sections, parallax, 3D effects, or encountering animation, shadcn CLI integration errors. |
| [`auto-animate`](plugins/auto-animate) | AutoAnimate (@formkit/auto-animate) zero-config animations for React. Use for list transitions, accordions, toasts, or encountering SSR errors, animation libraries complexity. |
| [`base-ui-react`](plugins/base-ui-react) | MUI Base UI unstyled React components with Floating UI. Use for accessible components, Radix UI migration, render props API, or encountering positioning, popup, v1.0 beta issues. |
| [`inspira-ui`](plugins/inspira-ui) | 120+ Vue/Nuxt animated components with TailwindCSS v4, motion-v, GSAP, Three.js. Use for hero sections, 3D effects, interactive backgrounds, or encountering setup, CSS variables, motion-v integration errors. |
| [`motion`](plugins/motion) | Motion (Framer Motion) React animation library. Use for drag-and-drop, scroll animations, gestures, SVG morphing, or encountering bundle size, complex transitions, spring physics errors. |
| [`nextjs`](plugins/nextjs) | Next.js 16 with App Router, Server Components, Server Actions, Cache Components. Use for React 19.2 apps, SSR, or encountering async params, proxy.ts migration, use cache errors. |
| [`nuxt-content`](plugins/nuxt-content) | Nuxt Content v3 Git-backed CMS for Markdown/MDC content sites. Use for blogs, docs, content-driven apps with type-safe queries, schema validation (Zod/Valibot), full-text search, navigation utilities. Supports Nuxt Studio production editing, Cloudflare D1/Pages deployment, Vercel deployment, SQL storage, MDC components, content collections. |
| [`nuxt-seo`](plugins/nuxt-seo) | Comprehensive guide for all 8 Nuxt SEO modules plus Pro modules. Use when building SEO-optimized Nuxt applications, implementing robots.txt/sitemaps, generating OG images, adding Schema.org data, managing meta tags, checking links, or encountering sitemap, robots.txt, OG image, schema validation, meta tag, canonical URL, or i18n SEO errors. |
| [`nuxt-studio`](plugins/nuxt-studio) | Visual CMS for Nuxt Content with Cloudflare deployment. Use when setting up Nuxt Studio, configuring OAuth authentication, deploying to Cloudflare Pages/Workers with subdomain routing, or troubleshooting Studio integration. |
| [`nuxt-ui-v4`](plugins/nuxt-ui-v4) | Nuxt UI v4 with 125+ accessible components, Tailwind v4, Reka UI, AI chat integration with reasoning and tool calling. Use for dashboards, forms, overlays, editors, page layouts, or encountering theming, composable, TypeScript errors. |
| [`nuxt-v4`](plugins/nuxt-v4) | Comprehensive Nuxt 4 development with 4 focused skills (core, data, server, production), 3 diagnostic agents (debugger, migration, performance), and interactive setup wizard. Use when: building Nuxt 4 applications, implementing SSR patterns, creating composables, server routes, data fetching, state management, debugging hydration issues, migrating from Nuxt 3, optimizing performance, deploying to Cloudflare/Vercel/Netlify, or setting up testing with Vitest. |
| [`nuxt-v5`](plugins/nuxt-v5) | Comprehensive Nuxt 5 development with 4 focused skills (core, data, server, production), 3 diagnostic agents (debugger, migration, performance), and interactive setup wizard. Use when: building Nuxt 5 applications, implementing SSR patterns, creating composables, server routes, data fetching, state management, debugging hydration issues, migrating from Nuxt 4, optimizing performance, deploying to Cloudflare/Vercel/Netlify, or setting up testing with Vitest. |
| [`pinia-colada`](plugins/pinia-colada) | Pinia Colada data fetching for Vue/Nuxt with useQuery, useMutation. Use for async state, query cache, SSR, or encountering invalidation, hydration, TanStack Vue Query migration errors. |
| [`pinia-v3`](plugins/pinia-v3) | Pinia v3 Vue state management with defineStore, getters, actions. Use for Vue 3 stores, Nuxt SSR, Vuex migration, or encountering store composition, hydration, testing errors. |
| [`react-best-practices`](plugins/react-best-practices) | React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing/reviewing/refactoring React code for optimal performance. Covers async patterns, bundle optimization, server/client components, re-render optimization. |
| [`react-composition-patterns`](plugins/react-composition-patterns) | React composition patterns from Vercel Engineering. Use when building scalable components, avoiding boolean prop proliferation, implementing compound components, or managing component state. Covers architecture, state management, and implementation patterns. |
| [`react-hook-form-zod`](plugins/react-hook-form-zod) | Type-safe React forms with React Hook Form and Zod validation. Use for form schemas, field arrays, multi-step forms, or encountering validation errors, resolver issues, nested field problems. |
| [`react-native-skills`](plugins/react-native-skills) | React Native and Expo best practices for building performant mobile apps. Use when building React Native components, optimizing list performance, implementing animations, or working with native modules. |
| [`shadcn-vue`](plugins/shadcn-vue) | shadcn-vue for Vue/Nuxt with Reka UI components and Tailwind. Use for accessible UI, Auto Form, data tables, charts, or encountering component imports, dark mode, Reka UI errors. |
| [`tailwind-v4-shadcn`](plugins/tailwind-v4-shadcn) | Production-tested setup for Tailwind CSS v4 with shadcn/ui, Vite, and React. Use when: initializing React projects with Tailwind v4, setting up shadcn/ui, implementing dark mode, debugging CSS variable issues, fixing theme switching, migrating from Tailwind v3, or encountering color/theming problems. Covers: @theme inline pattern, CSS variable architecture, dark mode with ThemeProvider, component composition, vite.config setup, common v4 gotchas, and production-tested patterns. |
| [`tanstack-query`](plugins/tanstack-query) | TanStack Query v5 (React Query) server state management. Use for data fetching, caching, mutations, or encountering v4 migration, stale data, invalidation errors. |
| [`tanstack-router`](plugins/tanstack-router) | TanStack Router type-safe file-based routing for React. Use for SPAs, TanStack Query integration, Cloudflare Workers, or encountering devtools, type safety, loader, Vite bundling errors. |
| [`tanstack-start`](plugins/tanstack-start) | TanStack Start (RC) full-stack React with server functions, SSR, Cloudflare Workers. Use for Next.js migration, edge rendering, or encountering hydration, auth, data pattern errors. |
| [`tanstack-table`](plugins/tanstack-table) | TanStack Table v8 headless data tables with server-side features for Cloudflare Workers + D1. Use for pagination, filtering, sorting, virtualization, or encountering state management, TanStack Query coordination, URL sync errors. |
| [`ultracite`](plugins/ultracite) | Ultracite multi-provider linting/formatting (Biome, ESLint, Oxlint). Use for v6/v7 setup, provider selection, Git hooks, MCP integration, AI hooks, migrations, or encountering configuration, type-aware linting, monorepo errors. |
| [`zustand-state-management`](plugins/zustand-state-management) | Zustand state management for React with TypeScript. Use for global state, Redux/Context API migration, localStorage persistence, slices pattern, devtools, Next.js SSR, or encountering hydration errors, TypeScript inference issues, persist middleware problems, infinite render loops. |

### mobile (5)

| Plugin | Description |
| --- | --- |
| [`app-store-deployment`](plugins/app-store-deployment) | Publishes mobile applications to iOS App Store and Google Play with code signing, versioning, and CI/CD automation. Use when preparing app releases, configuring signing certificates, or setting up automated deployment pipelines. |
| [`mobile-app-debugging`](plugins/mobile-app-debugging) | Mobile app debugging for iOS, Android, cross-platform frameworks. Use for crashes, memory leaks, performance issues, network problems, or encountering Xcode instruments, Android Profiler, React Native debugger, native bridge errors. |
| [`mobile-app-testing`](plugins/mobile-app-testing) | Mobile app testing with unit tests, UI automation, performance testing. Use for test infrastructure, E2E tests, testing standards, or encountering test framework setup, device farms, flaky tests, platform-specific test errors. |
| [`mobile-first-design`](plugins/mobile-first-design) | Designs responsive interfaces starting from mobile screens with progressive enhancement for larger devices. Use when building responsive websites, optimizing for mobile users, or implementing adaptive layouts. |
| [`mobile-offline-support`](plugins/mobile-offline-support) | Offline-first mobile apps with local storage, sync queues, conflict resolution. Use for offline functionality, data sync, connectivity handling, or encountering sync conflicts, queue management, storage limits, network transition errors. |

### security (6)

| Plugin | Description |
| --- | --- |
| [`csrf-protection`](plugins/csrf-protection) | Implements CSRF protection using synchronizer tokens, double-submit cookies, and SameSite attributes. Use when securing web forms, protecting state-changing endpoints, or implementing defense-in-depth authentication. |
| [`cybersecurity`](plugins/cybersecurity) | OSS-only security for OWASP Top 10, pentest, vuln testing (XSS, SSRF, CSRF, business-logic, Host header), threat modeling (STRIDE, ATT&CK), Sigma rules, SAST, code audit, AI/LLM red-team, or replacing paid tools (Burp, Nessus, Splunk) with OSS. |
| [`defense-in-depth-validation`](plugins/defense-in-depth-validation) | Validate at every layer data passes through to make bugs impossible. Use when invalid data causes failures deep in execution, requiring validation at multiple system layers. |
| [`security-headers-configuration`](plugins/security-headers-configuration) | Configures HTTP security headers to protect against XSS, clickjacking, and MIME sniffing attacks. Use when hardening web applications, passing security audits, or implementing Content Security Policy. |
| [`vulnerability-scanning`](plugins/vulnerability-scanning) | Implements automated security scanning for dependencies, code, and containers using tools like Trivy, Snyk, and npm audit. Use when setting up CI/CD security gates, conducting pre-deployment audits, or meeting compliance requirements. |
| [`xss-prevention`](plugins/xss-prevention) | Prevents Cross-Site Scripting attacks through input sanitization, output encoding, and Content Security Policy. Use when handling user-generated content, implementing rich text editors, or securing web applications. |

### seo (2)

| Plugin | Description |
| --- | --- |
| [`seo-keyword-cluster-builder`](plugins/seo-keyword-cluster-builder) | Groups related keywords into topic clusters and creates content hub architecture recommendations with internal linking strategies. Use when planning content strategy, organizing keyword research, or building pillar page structures. |
| [`seo-optimizer`](plugins/seo-optimizer) | SEO optimization with keyword analysis, readability assessment, technical validation, content quality. Use for search rankings, blog posts, content audits, or encountering keyword density, readability scores, meta tags, schema markup errors. |

### testing (4)

| Plugin | Description |
| --- | --- |
| [`jest-generator`](plugins/jest-generator) | Generate Jest unit tests for JavaScript/TypeScript with mocking, coverage. Use for JS/TS modules, React components, test generation, or encountering missing coverage, improper mocking, test structure errors. |
| [`mutation-testing`](plugins/mutation-testing) | Validate test effectiveness with mutation testing using Stryker (TypeScript/JavaScript) and mutmut (Python). Find weak tests that pass despite code mutations. Use to improve test quality. |
| [`test-quality-analysis`](plugins/test-quality-analysis) | Detect test smells, overmocking, flaky tests, and coverage issues. Analyze test effectiveness, maintainability, and reliability. Use when reviewing tests or improving test quality. |
| [`vitest-testing`](plugins/vitest-testing) | Modern TypeScript/JavaScript testing with Vitest. Fast unit and integration tests, native ESM support, Vite-powered HMR, and comprehensive mocking. Use for testing TS/JS projects. |

### tooling (27)

| Plugin | Description |
| --- | --- |
| [`bun`](plugins/bun) | Comprehensive Bun runtime toolkit covering runtime, package manager, bundler, testing, HTTP servers, WebSockets, databases, framework integrations (Hono, Next.js, Nuxt, TanStack Start, SvelteKit), deployment, and Node.js compatibility. |
| [`claude-code-bash-patterns`](plugins/claude-code-bash-patterns) | Claude Code Bash tool patterns with hooks, automation, git workflows. Use for PreToolUse hooks, command chaining, CLI orchestration, custom commands, or encountering bash permissions, command failures, security guards, hook configurations. |
| [`claude-hook-writer`](plugins/claude-hook-writer) | Expert guidance for writing secure, reliable, and performant Claude Code hooks - validates design decisions, enforces best practices, and prevents common pitfalls. Use when creating, reviewing, or debugging Claude Code hooks. |
| [`code-review`](plugins/code-review) | Code review practices with technical rigor and verification gates. Use for receiving feedback, requesting code-reviewer subagent reviews, or preventing false completion claims in pull requests. |
| [`delegate-my-work`](plugins/delegate-my-work) | Interview employees to find recurring work, map accessible AI and automation tools, and spec each loop with preferred and fallback routes. |
| [`dependency-upgrade`](plugins/dependency-upgrade) | Secure dependency upgrades with supply chain protection, cooldowns, staged rollout, and Socket CLI integration. Use when upgrading deps, configuring security policies, or preventing supply chain attacks. |
| [`feature-dev`](plugins/feature-dev) | Automate 7-phase feature development with specialized agents (code-explorer, code-architect, code-reviewer). Use for multi-file features, architectural decisions, or encountering ambiguous requirements, integration patterns, design approach errors. |
| [`frontend-design`](plugins/frontend-design) | Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics. |
| [`github-project-automation`](plugins/github-project-automation) | GitHub repository automation (CI/CD, issue templates, Dependabot, CodeQL). Use for project setup, Actions workflows, security scanning, or encountering YAML syntax, workflow configuration, template structure errors. |
| [`humanize-writing`](plugins/humanize-writing) | Rewrites AI-sounding text so it reads like a human wrote it. Use when the user says 'sounds like AI/ChatGPT,' 'too robotic,' or 'humanize this.' Fixes AI vocabulary, inflated significance, hedging, robotic rhythm, and formulaic structure. |
| [`idempotency-handling`](plugins/idempotency-handling) | Idempotent API operations with idempotency keys, Redis caching, DB constraints. Use for payment systems, webhook retries, safe retries, or encountering duplicate processing, race conditions, key expiry errors. |
| [`logging-best-practices`](plugins/logging-best-practices) | Structured logging with proper levels, context, PII handling, centralized aggregation. Use for application logging, log management integration, distributed tracing, or encountering log bloat, PII exposure, missing context errors. |
| [`maz-ui`](plugins/maz-ui) | Maz-UI v4 - Modern Vue & Nuxt component library with 50+ standalone components, composables, directives, theming, i18n, and SSR support. |
| [`mcp-dynamic-orchestrator`](plugins/mcp-dynamic-orchestrator) | Dynamic MCP server discovery and code-mode execution via central registry. Use for multiple MCP integrations, tool discovery, progressive disclosure, or encountering MCP context bloat, changing server sets, large tool sets. |
| [`mcp-management`](plugins/mcp-management) | Manage MCP servers - discover, analyze, execute tools/prompts/resources. Use for MCP integrations, capability discovery, tool filtering, programmatic execution, or encountering context bloat, server configuration, tool execution errors. |
| [`nano-banana-prompts`](plugins/nano-banana-prompts) | Generate optimized prompts for Gemini 2.5 Flash Image (Nano Banana). Use for image generation, crafting photo prompts, art styles, or multi-turn editing workflows with best practices. |
| [`plan-interview`](plugins/plan-interview) | Adaptive interview-driven spec generation with quality review. Automatically adjusts depth based on plan complexity. |
| [`playwright`](plugins/playwright) | Browser automation and E2E testing with Playwright. Auto-detects dev servers, writes clean test scripts. Test pages, fill forms, take screenshots, check responsive design, validate UX, test login flows, check links, automate any browser task. Use for cross-browser testing, visual regression, API testing, component testing in TypeScript/JavaScript and Python projects. |
| [`root-cause-tracing`](plugins/root-cause-tracing) | Systematically trace bugs backward through call stack to find original trigger. Use when errors occur deep in execution and you need to trace back to find the original trigger. |
| [`sequential-thinking`](plugins/sequential-thinking) | Systematic step-by-step reasoning with revision and branching. Use for complex problems, multi-stage analysis, design planning, problem decomposition, or encountering unclear scope, alternative approaches needed, revision requirements. |
| [`systematic-debugging`](plugins/systematic-debugging) | Four-phase debugging framework that ensures root cause investigation before attempting fixes. Never jump to solutions. Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes. |
| [`tech-debt`](plugins/tech-debt) | Multi-skill plugin: tech-debt |
| [`threejs`](plugins/threejs) | Comprehensive Three.js skills for building 3D web experiences |
| [`turborepo`](plugins/turborepo) | Turborepo high-performance monorepo build system. Use for monorepo setup, build optimization, task pipelines, caching strategies, or multi-package orchestration. |
| [`typescript-migration`](plugins/typescript-migration) | TypeScript version migration guide (5.x to 6 to 7, tsgo native port). Use for TS 6 tsconfig breaking changes, TS 7 Go rewrite rollout, or TS5xxx deprecation codes. |
| [`unknowns-discovery`](plugins/unknowns-discovery) | Discover and reduce task unknowns — blindspots, missing context, unknown unknowns — before committing to a plan, implementation, review, or merge. |
| [`zod`](plugins/zod) | TypeScript-first schema validation and type inference. Use for validating API requests/responses, form data, env vars, configs, defining type-safe schemas with runtime validation, transforming data, generating JSON Schema for OpenAPI/AI, or encountering missing validation errors, type inference issues, validation error handling problems. Zero dependencies, compact core (~5kb gzipped; zod/mini ~1.9kb). |

### web (10)

| Plugin | Description |
| --- | --- |
| [`firecrawl-scraper`](plugins/firecrawl-scraper) | Firecrawl v2.5 API for web scraping/crawling to LLM-ready markdown. Use for site extraction, dynamic content, or encountering JavaScript rendering, bot detection, content loading errors. |
| [`hono-routing`](plugins/hono-routing) | Type-safe Hono APIs with routing, middleware, RPC. Use for request validation, Zod/Valibot validators, or encountering middleware type inference, validation hook, RPC errors. |
| [`image-optimization`](plugins/image-optimization) | Optimizes images for web performance using modern formats, responsive techniques, and lazy loading strategies. Use when improving page load times, implementing responsive images, or preparing assets for production deployment. |
| [`internationalization-i18n`](plugins/internationalization-i18n) | Implements multi-language support using i18next, gettext, or Intl API with translation workflows and RTL support. Use when building multilingual applications, handling date/currency formatting, or supporting right-to-left languages. |
| [`payment-gateway-integration`](plugins/payment-gateway-integration) | Integrates payment processing with Stripe, PayPal, or Square including subscriptions, webhooks, and PCI compliance. Use when implementing checkout flows, recurring billing, or handling refunds and disputes. |
| [`progressive-web-app`](plugins/progressive-web-app) | Builds Progressive Web Apps with service workers, web manifest, offline support, and installation prompts. Use when creating installable web experiences, implementing offline functionality, or adding push notifications to web apps. |
| [`push-notification-setup`](plugins/push-notification-setup) | Implements push notifications across iOS, Android, and web using Firebase Cloud Messaging and native services. Use when adding notification capabilities, handling background messages, or setting up notification channels. |
| [`responsive-web-design`](plugins/responsive-web-design) | Builds adaptive web interfaces using Flexbox, CSS Grid, and media queries with a mobile-first approach. Use when creating multi-device layouts, implementing flexible UI systems, or ensuring cross-browser compatibility. |
| [`web-performance-audit`](plugins/web-performance-audit) | Web performance audits with Core Web Vitals, bottleneck identification, optimization recommendations. Use for page load times, performance reviews, UX optimization, or encountering LCP, FID, CLS issues, resource blocking, render delays. |
| [`web-performance-optimization`](plugins/web-performance-optimization) | Optimizes web application performance through code splitting, lazy loading, caching strategies, and Core Web Vitals monitoring. Use when improving page load times, implementing service workers, or reducing bundle sizes. |

### woocommerce (4)

| Plugin | Description |
| --- | --- |
| [`woocommerce-backend-dev`](plugins/woocommerce-backend-dev) | Add or modify WooCommerce backend PHP code following project conventions. Use when creating new classes, methods, hooks, or modifying existing backend code in WooCommerce projects. |
| [`woocommerce-code-review`](plugins/woocommerce-code-review) | Review WooCommerce code changes for coding standards compliance. Use when reviewing code locally, performing automated PR reviews, or checking code quality in WooCommerce projects. |
| [`woocommerce-copy-guidelines`](plugins/woocommerce-copy-guidelines) | Guidelines for UI text and copy in WooCommerce. Use when writing user-facing text, labels, buttons, messages, or documentation in WooCommerce projects. |
| [`woocommerce-dev-cycle`](plugins/woocommerce-dev-cycle) | Run tests, linting, and quality checks for WooCommerce development. Use when running tests, fixing code style, or following the development workflow in WooCommerce projects. |
