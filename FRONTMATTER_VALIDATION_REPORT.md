# Frontmatter Validation Report

**Date**: 2026-04-02
**Validator**: `scripts/validate-frontmatter.sh`
**Total Skills**: 211 | **Passed**: 172 | **Failed**: 39 | **Warnings**: 94

---

## Critical Issues (39)

All 39 failures are **name mismatches** — the YAML `name:` value does not match the skill directory name. Per the Anthropic skill spec, `name` must match the directory for correct skill discovery.

### Bun Skills (27) — Display Names Instead of Directory Names

All 27 bun skills use human-readable display names (e.g., `"Bun Bundler"`) instead of the directory name (e.g., `bun-bundler`).

| Skill Directory | Current `name` Value | Fix To |
|---|---|---|
| `bun-bundler` | `Bun Bundler` | `bun-bundler` |
| `bun-cloudflare-workers` | `Bun Cloudflare Workers` | `bun-cloudflare-workers` |
| `bun-docker` | `Bun Docker` | `bun-docker` |
| `bun-drizzle-integration` | `Bun Drizzle Integration` | `bun-drizzle-integration` |
| `bun-ffi` | `Bun FFI` | `bun-ffi` |
| `bun-file-io` | `Bun File I/O` | `bun-file-io` |
| `bun-hono-integration` | `Bun Hono Integration` | `bun-hono-integration` |
| `bun-hot-reloading` | `Bun Hot Reloading` | `bun-hot-reloading` |
| `bun-http-server` | `Bun HTTP Server` | `bun-http-server` |
| `bun-jest-migration` | `Bun Jest Migration` | `bun-jest-migration` |
| `bun-macros` | `Bun Macros` | `bun-macros` |
| `bun-nextjs` | `Bun Next.js` | `bun-nextjs` |
| `bun-nuxt` | `"Bun Nuxt"` (includes quotes) | `bun-nuxt` |
| `bun-package-manager` | `Bun Package Manager` | `bun-package-manager` |
| `bun-react-ssr` | `Bun React SSR` | `bun-react-ssr` |
| `bun-redis` | `Bun Redis` | `bun-redis` |
| `bun-runtime` | `Bun Runtime` | `bun-runtime` |
| `bun-shell` | `Bun Shell` | `bun-shell` |
| `bun-sqlite` | `Bun SQLite` | `bun-sqlite` |
| `bun-sveltekit` | `Bun SvelteKit` | `bun-sveltekit` |
| `bun-tanstack-start` | `Bun TanStack Start` | `bun-tanstack-start` |
| `bun-test-basics` | `Bun Test Basics` | `bun-test-basics` |
| `bun-test-coverage` | `Bun Test Coverage` | `bun-test-coverage` |
| `bun-test-lifecycle` | `Bun Test Lifecycle` | `bun-test-lifecycle` |
| `bun-test-mocking` | `Bun Test Mocking` | `bun-test-mocking` |
| `bun-websocket-server` | `Bun WebSocket Server` | `bun-websocket-server` |
| `bun-workers` | `Bun Workers` | `bun-workers` |

### Cloudflare Workers Skills (10) — Short Names Missing `cloudflare-` Prefix

These skills live under `plugins/cloudflare-workers/skills/` but their `name` omits the `cloudflare-` prefix.

| Skill Directory | Current `name` Value | Fix To |
|---|---|---|
| `cloudflare-workers-ci-cd` | `workers-ci-cd` | `cloudflare-workers-ci-cd` |
| `cloudflare-workers-dev-experience` | `workers-dev-experience` | `cloudflare-workers-dev-experience` |
| `cloudflare-workers-frameworks` | `workers-frameworks` | `cloudflare-workers-frameworks` |
| `cloudflare-workers-migration` | `workers-migration` | `cloudflare-workers-migration` |
| `cloudflare-workers-multi-lang` | `workers-multi-lang` | `cloudflare-workers-multi-lang` |
| `cloudflare-workers-observability` | `workers-observability` | `cloudflare-workers-observability` |
| `cloudflare-workers-performance` | `workers-performance` | `cloudflare-workers-performance` |
| `cloudflare-workers-runtime-apis` | `workers-runtime-apis` | `cloudflare-workers-runtime-apis` |
| `cloudflare-workers-security` | `workers-security` | `cloudflare-workers-security` |
| `cloudflare-workers-testing` | `workers-testing` | `cloudflare-workers-testing` |

### Other Skills (2)

| Skill Directory | Current `name` Value | Fix To |
|---|---|---|
| `nuxt-studio` | `Nuxt Studio` | `nuxt-studio` |
| `react-best-practices` | `vercel-react-best-practices` | `react-best-practices` |

---

## Warnings (94)

### Missing `license` Field (79 skills)

These skills lack a `license` field in their YAML frontmatter. Recommended fix: add `license: MIT`.

```
access-control-rbac, api-authentication, api-changelog-versioning,
api-contract-testing, api-design-principles, api-error-handling,
api-filtering-sorting, api-gateway-configuration, api-pagination,
api-rate-limiting, api-reference-documentation, api-response-optimization,
api-security-hardening, api-testing, api-versioning-strategy,
app-store-deployment, architecture-patterns, bun-bundler,
bun-cloudflare-workers, bun-docker, bun-drizzle-integration, bun-ffi,
bun-file-io, bun-hono-integration, bun-hot-reloading, bun-http-server,
bun-jest-migration, bun-macros, bun-nextjs, bun-nuxt,
bun-package-manager, bun-react-ssr, bun-redis, bun-runtime, bun-shell,
bun-sqlite, bun-sveltekit, bun-tanstack-start, bun-test-basics,
bun-test-coverage, bun-test-lifecycle, bun-test-mocking,
bun-websocket-server, bun-workers, claude-hook-writer,
cloudflare-workers-dev-experience, cloudflare-workers-frameworks,
cloudflare-workers-migration, cloudflare-workers-multi-lang,
cloudflare-workers-observability, cloudflare-workers-performance,
cloudflare-workers-runtime-apis, cloudflare-workers-security, code-review,
csrf-protection, defense-in-depth-validation, graphql-implementation,
health-check-endpoints, idempotency-handling, internationalization-i18n,
jest-generator, logging-best-practices, maz-ui, mcp-management,
microservices-patterns, mobile-app-debugging, mobile-app-testing,
mobile-first-design, mobile-offline-support, oauth-implementation,
payment-gateway-integration, plan-interview, playwright,
push-notification-setup, responsive-web-design, rest-api-design,
root-cause-tracing, security-headers-configuration,
seo-keyword-cluster-builder, seo-optimizer, session-management,
systematic-debugging, technical-specification, test-quality-analysis,
turborepo, verification-before-completion, vitest-testing,
websocket-implementation, woocommerce-backend-dev,
woocommerce-code-review, woocommerce-copy-guidelines,
woocommerce-dev-cycle
```

### Unknown Top-Level Fields (29 skills)

These skills have `version` as a top-level YAML field. Per the spec, `version` should be nested under `metadata:` (e.g., `metadata.version`).

```
bun-bundler, bun-docker, bun-drizzle-integration, bun-ffi, bun-file-io,
bun-hono-integration, bun-hot-reloading, bun-http-server,
bun-jest-migration, bun-macros, bun-nextjs, bun-react-ssr, bun-runtime,
bun-sqlite, bun-test-basics, bun-test-coverage, bun-test-lifecycle,
bun-test-mocking, bun-websocket-server, bun-workers,
cloudflare-workers-frameworks, cloudflare-workers-migration,
cloudflare-workers-multi-lang, defense-in-depth-validation,
nuxt-studio, root-cause-tracing, systematic-debugging, threejs,
verification-before-completion
```

---

## Fix Priority

1. **Name mismatches** (39) — Critical, blocks CI. Fix: change `name:` to match directory name.
2. **Missing license** (79) — Low, add `license: MIT` to frontmatter.
3. **Unknown `version` field** (29) — Low, move `version: "x.y.z"` under `metadata:` block.

## Re-validate

After fixes, run:

```bash
./scripts/validate-frontmatter.sh
```
