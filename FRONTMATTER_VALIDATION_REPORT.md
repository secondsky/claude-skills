# Frontmatter Validation Report

**Date**: 2026-04-02
**Validator**: `scripts/validate-frontmatter.sh` (aligned with [Agent Skills Spec](https://agentskills.io/specification))
**Total Skills**: 211 | **Passed**: 211 | **Failed**: 0 | **Warnings**: 92

---

## All Critical Issues Resolved

All 57 critical issues found during the initial validation have been fixed:

### Name Mismatches (39) — Fixed

`name:` values updated to match directory names (spec: "Must match the parent directory name").

- **27 Bun skills**: display names like `"Bun Bundler"` → directory names like `bun-bundler`
- **10 Cloudflare Workers skills**: short names like `workers-ci-cd` → full names like `cloudflare-workers-ci-cd`
- **2 Other**: `Nuxt Studio` → `nuxt-studio`, `vercel-react-best-practices` → `react-best-practices`

### Top-Level `version:` Field (29) — Fixed

Moved `version:` from top-level into `metadata:` block (spec: only `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility` allowed at top level).

### Top-Level `keywords:` Field (16) — Fixed

Moved `keywords:` from top-level into `metadata:` block as a comma-separated string.

---

## Remaining Warnings (92)

All 92 warnings are for **missing `license` field**. This is recommended but not required by the spec.

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

Fix: add `license: MIT` to YAML frontmatter.

---

## Validation Rules (per Agent Skills Spec)

| Rule | Severity | Source |
|---|---|---|
| `name` required | Error | Spec: required field |
| `description` required | Error | Spec: required field |
| `name` must be lowercase | Error | Spec: "lowercase alphanumeric" |
| `name` max 64 chars | Error | Spec: "Max 64 characters" |
| `name` no leading/trailing `-` | Error | Spec: "Must not start or end with a hyphen" |
| `name` no consecutive `--` | Error | Spec: "Must not contain consecutive hyphens" |
| `name` only `[a-z0-9-]` | Error | Spec: "letters, digits, and hyphens" |
| `name` must match directory | Error | Spec: "Must match the parent directory name" |
| `description` max 1024 chars | Error | Spec: "Max 1024 characters" |
| `compatibility` max 500 chars | Error | Spec: "Max 500 characters" |
| Only allowed top-level fields | Error | Spec: 6 defined fields only |
| Missing `license` | Warning | Recommended but optional |

## Re-validate

```bash
./scripts/validate-frontmatter.sh
```
