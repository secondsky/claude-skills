# Frontmatter Validation Report

**Date**: 2026-04-02
**Validator**: `scripts/validate-frontmatter.sh` (aligned with [Agent Skills Spec](https://agentskills.io/specification))
**Total Skills**: 211 | **Passed**: 211 | **Failed**: 0 | **Warnings**: 0

---

## All Issues Resolved

All critical issues and warnings have been fixed.

### Name Mismatches (39) — Fixed

`name:` values updated to match directory names (spec: "Must match the parent directory name").

- **27 Bun skills**: display names like `"Bun Bundler"` → directory names like `bun-bundler`
- **10 Cloudflare Workers skills**: short names like `workers-ci-cd` → full names like `cloudflare-workers-ci-cd`
- **2 Other**: `Nuxt Studio` → `nuxt-studio`, `vercel-react-best-practices` → `react-best-practices`

### Top-Level `version:` Field (29) — Fixed

Moved `version:` from top-level into `metadata:` block (spec: only `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility` allowed at top level).

### Top-Level `keywords:` Field (16) — Fixed

Moved `keywords:` from top-level into `metadata:` block as a comma-separated string.

### Missing `license:` Field (92) — Fixed

Added `license: MIT` to YAML frontmatter for all 92 skills that were missing it.

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
