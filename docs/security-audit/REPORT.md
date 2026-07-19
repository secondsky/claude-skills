# Defense-in-Depth Security Audit — Consolidated Report

**Repo:** `claude-skills` (marketplace of 142 Claude Code plugins)
**Branch:** `security/defense-in-depth-audit`
**Date:** 2026-07-19
**Threat model:** Skills marketplace. Users install plugins into their own Claude sessions. Attack surface = auto-running hooks, config-driven subprocess spawning, maintainer scripts writing under `$HOME`, CI/supply chain, correctness of defensive-skill *advice*, repo governance.
**Lens:** Defense-in-depth / assume-breach / fail-secure / least-privilege.

---

## Severity Matrix (98 findings: 6 Critical, 25 High, 34 Medium, 18 Low, 15 Info)

| Track | Scope | Crit | High | Med | Low | Info | Total |
|-------|-------|------|------|-----|-----|------|-------|
| A | Hook & auto-exec scripts | 2 | 4 | 4 | 3 | 1 | 14 |
| B | Subprocess & config-driven exec | 1 | 2 | 2 | 2 | 1 | 8 |
| C | Secret & credential handling | 1 | 4 | 5 | 2 | 7 | 19 |
| D | Destructive ops & filesystem | 2 | 6 | 9 | 3 | 3 | 23 |
| E | CI/CD & supply chain | 0 | 5 | 7 | 3 | 2 | 17 |
| F | Defensive content correctness | 0 | 4 | 7 | 5 | 1 | 17 |

Raw per-track findings: `docs/security-audit/findings/track-{a,b,c,d,e,f}-*.md`.

---

## Critical Findings (6) — must fix

| ID | Title | Location | Fix batch |
|----|-------|----------|-----------|
| A-001 | PreToolUse guard fails OPEN on malformed JSON (`sys.exit(0)` on parse error) | `claude-code-bash-patterns/.../dangerous-command-guard.py:37-42` | B5 |
| A-002 | Uncaught `AttributeError` on `[]`/`null`/string JSON — narrow except | `claude-code-bash-patterns/.../dangerous-command-guard.py:38-39` | B5 |
| B-001 | MCP orchestrator spawns attacker-controllable command from `mcp.registry.json` with no allowlist → arbitrary RCE | `mcp-dynamic-orchestrator/src/orchestrator.ts:147` | B7 |
| C-001 | `generate-secret.sh` always echoes `BETTER_AUTH_SECRET` to stdout | `better-auth/.../generate-secret.sh:12,18,21` | B12 |
| D-001 | `install-skill.sh` `rm -rf ~/.claude/skills/<name>` with unvalidated `name` (traversal/self-wipe) | `scripts/install-skill.sh:15,28,60` | B4 |
| D-002 | `install-skill.sh` no `set -u`; trailing-slash `rm -rf` wipes entire skills dir if validation weakened | `scripts/install-skill.sh:6,15,60` | B4 |

---

## High Findings (25) — must fix

| ID | Title | Fix batch |
|----|-------|-----------|
| A-003 | Guard regex trivially bypassable (`rm -fr /`, `find / -delete`, `curl\|sh` all pass) | B5 |
| A-004 | `bash-audit-logger.sh` captures secrets verbatim, no redaction, world-readable | B5 |
| A-005 | `bash-audit-logger.sh` reads `$CLAUDE_TOOL_INPUT` env, not stdin → silently no-ops | B5 |
| A-006 | `package-manager-enforcer.sh` same stdin bug → never blocks | B5 |
| B-002 | MCP orchestrator trusts `env` block from registry → PATH/NODE_OPTIONS hijack | B7 |
| B-003 | MCP `vm` sandbox is bypassable but advertised as isolation | B7 |
| C-002 | `test-access-jwt.sh` says "Token is valid" after kid-presence check only (no sig verify) | B12 |
| C-003 | better-auth reference logs verification code to stdout (`console.log`) | B13 |
| C-004 | `bun-cloudflare-workers` SKILL.md teaches `console.log(env.API_KEY)` | B13 |
| C-005 | `setup-apis.sh` writes API keys to `~/.bashrc` plaintext, no chmod | B12 |
| D-003 | `migration-generator.sh` silently destroys JSONC comments via jq | B8 |
| D-004 | `setup-logging.sh` overwrites `wrangler.jsonc` via `mv` with no backup | B8 |
| D-005 | `setup-vitest.sh` in-place `sed -i` no backup, non-portable | B8 |
| D-006 | `dev-setup.sh` `sed -i.bak` then immediate `rm .bak` + unescaped `$PROJECT_NAME` | B8 |
| D-007 | `migrate-radix-component.sh` non-idempotent | B9 |
| D-008 | `scaffold-plugin.sh` unvalidated `PLUGIN_SLUG` from `read -p` → traversal + sed injection | B9 |
| E-001 | No `permissions:` block — GITHUB_TOKEN defaults to `write` | B1 |
| E-002 | All actions tag-pinned not SHA | B1 |
| E-003 | `package.json`/lockfile out of sync (3.5.0 vs 3.2.3); overrides not in lockfile root | B3 |
| E-004 | No `dependency-review-action` on PRs | B1 |
| E-005 | No branch protection on `main` (repo setting — document, can't fix from clone) | B2 |
| F-01 | Cybersecurity gate accepts proof-free "I own this / localhost" claim | B15 |
| F-06 | `api-security-hardening` ships deprecated `xss-clean` | B14 |
| F-07 | `api-security-hardening` ships `escape()` removed in express-validator v7 | B14 |
| F-08 | `csrf-protection` ships `timingSafeEqual` without length check → RangeError DoS | B14 |

---

## Medium Findings (34) — fix

A-007, A-008, A-009, A-010 (B6); B-004, B-006 (B8/B10); C-006, C-007, C-008, C-009, C-010 (B1/B3/B12/B13); D-009, D-010, D-011, D-012, D-013, D-014, D-015, D-016, D-017, D-018 (B3/B4/B8/B9); E-006, E-007, E-008, E-009, E-010, E-011, E-012 (B1/B2/B3/B11); F-02, F-03, F-04, F-09, F-10, F-11, F-12 (B14/B15).

## Low Findings (18) — fix

A-011, A-012, A-013 (B6); B-005, B-007 (B8/B10); C-011, C-012 (B12/B13); D-019, D-020, D-021 (B4/B16); E-013, E-014, E-015 (B2); F-05, F-13, F-14, F-15, F-16 (B6/B11/B15).

## Info Findings (15) — accepted-risk, documented, no code change

A-014 (template env dump — opt-in, will add warning); B-008 (fixed-string bun, benign); C-013…C-019 (false-positive placeholders + positive examples); D-022 (trap rm is safe), D-023 (brief correction); E-016 (lockfile sound), E-017 (no pull_request_target); F-17 (phantom scope item).

---

## Fix Batches (16, executed via Subagent-Driven Development)

**Sequencing:** Governance/CI first (B1-B3) so guardrails exist, then highest-risk code (B4-B9: install scripts, guards, orchestrator), then secrets (B12-B13), then content correctness (B14-B15), then systemic (B16).

| Batch | Scope | Findings fixed | Model |
|-------|-------|----------------|-------|
| B1 | CI/CD workflows hardening + new scanner workflows | E-001, E-002, E-004, E-006, E-007, E-010, E-012, C-008 | sonnet |
| B2 | Governance docs (SECURITY.md, dependabot.yml, plugin security-review checklist, branch-protection note) | E-009, E-013, E-014, E-015(doc), E-05(doc) | sonnet |
| B3 | Repo config/portability (.gitignore, package sync, fix-frontmatter.mjs, remove-category backup) | C-007, E-003, E-008, D-014, D-015 | sonnet |
| B4 | install-skill.sh + install-all.sh hardening | D-001, D-002, D-016, D-019 | sonnet |
| B5 | claude-code-bash-patterns (guard, logger, enforcer) | A-001, A-002, A-003, A-004, A-005, A-006, D-018 | sonnet |
| B6 | nuxt-seo + bun hooks | A-007, A-008, A-009, A-010, A-011, A-012, A-013, A-014, F-15 | sonnet |
| B7 | mcp-dynamic-orchestrator (allowlist + env denylist + sandbox doc) | B-001, B-002, B-003 | sonnet |
| B8 | cloudflare-workers destructive/eval scripts | B-004, B-007, D-003, D-004, D-005, D-006, D-009, D-010, D-021, D-023 | sonnet |
| B9 | other plugin destructive scripts | D-007, D-008, D-011, D-012, D-013, D-017 | sonnet |
| B10 | ultracite + playwright | B-005, B-006 | sonnet |
| B11 | review-skill.sh SSRF guard | E-011, F-16 | sonnet |
| B12 | secret-handling scripts | C-001, C-002, C-005, C-006, C-010, C-011, C-012 | sonnet |
| B13 | secret-handling docs/examples | C-003, C-004, C-009 | sonnet |
| B14 | defensive content correctness | F-06, F-07, F-08, F-09, F-10, F-11, F-12 | sonnet |
| B15 | cybersecurity gate + payloads | F-01, F-02, F-03, F-04, F-05, F-13, F-14 | sonnet |
| B16 | systemic --dry-run on external-write scripts | D-020 | sonnet |

After all batches: final cross-cutting review, then `superpowers:finishing-a-development-branch`.

---

## Status legend
- 🔴 Not started · 🟡 In progress · 🟢 Fixed · ⚪ Accepted-risk (documented) · ⚪️ Info (no action)
