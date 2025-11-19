---
name: tanstack-start
description: |
  [⚠️ RC STATUS - MONITORING FOR v1.0 STABLE] Full-stack React framework built on TanStack Router with official Cloudflare Workers support. This skill will be published when v1.0 stable is released and critical issues are resolved. Use when: building full-stack React applications, need SSR with Cloudflare Workers, want type-safe server functions, or migrating from Next.js. Currently monitoring: GitHub #5734 (memory leak), "needed-for-start-stable" issues.
license: MIT
allowed-tools: [Bash, Read, Write, Edit]
metadata:
  version: 0.9.0
  author: Claude Skills Maintainers
  last-verified: 2025-11-07
  production-tested: false
  status: draft
  keywords:
    - tanstack start
    - full-stack react
    - ssr
    - server-side rendering
    - cloudflare workers
    - server functions
    - api routes
    - type-safe server
    - react framework
    - next.js alternative
---

# TanStack Start Skill [DRAFT - NOT READY]

⚠️ **Status: Release Candidate - Monitoring for Stability**

This skill is prepared but NOT published. Waiting for:
- ✅ v1.0 stable release (currently RC v1.120.20)
- ❌ GitHub #5734 resolved (memory leak causing crashes)
- ❌ All "needed-for-start-stable" issues closed
- ❌ 2+ weeks without critical bugs

**DO NOT USE IN PRODUCTION YET**

---

## Skill Overview

TanStack Start is a full-stack React framework with:
- Client-first architecture with opt-in SSR
- Built on TanStack Router (type-safe routing)
- Server functions for API logic
- Official Cloudflare Workers support
- Integrates with TanStack Query

---

## When v1.0 Stable

This skill will provide:
- Cloudflare Workers + D1/KV/R2 setup
- Server function patterns
- SSR vs CSR strategies
- Migration guide from Next.js
- Known issues and solutions

---

## Monitoring

Track stability at: `planning/stability-tracker.md`

**Check weekly:**
- [TanStack Start Releases](https://github.com/TanStack/router/releases)
- [Issue #5734](https://github.com/TanStack/router/issues/5734)
- ["needed-for-start-stable" label](https://github.com/TanStack/router/labels/needed-for-start-stable)

---

## Installation (When Ready)

```bash
npm create cloudflare@latest -- --framework=tanstack-start
```

---

**Last Updated:** 2025-11-07
**Expected Stable:** 1-3 months (Dec 2025 - Jan 2026)
