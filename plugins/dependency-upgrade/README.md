# dependency-upgrade

**Status**: Production Ready
**Last Updated**: 2026-04-01

Secure dependency upgrades with supply chain protection, cooldown periods, post-install script hardening, lockfile validation, and staged rollout across npm, Bun, pnpm, and Yarn.

## What This Skill Does

Provides a comprehensive workflow for safely upgrading dependencies while preventing supply chain attacks. Covers:

- **Cooldown periods** — 7-day (configurable) delay before installing newly published packages
- **Post-install script hardening** — Block the #1 supply chain attack vector across all PMs
- **Lockfile validation** — Detect lockfile injection attacks with `lockfile-lint`
- **Pre-install auditing** — Audit packages before installing with `npq` or Socket Firewall
- **Staged upgrades** — Incremental, one-at-a-time upgrades with full testing
- **Automated updates** — Dependabot, Renovate, and Snyk with cooldown configurations
- **Dev environment hardening** — Dev containers and secrets management
- **Publisher security** — 2FA, provenance attestation, OIDC trusted publishing

## Auto-Trigger Keywords

**Primary**: dependency-upgrade, dependency-management, supply-chain-security, package-upgrade

**Secondary**: cooldown, min-release-age, ignore-scripts, lockfile-lint, npm-ci, frozen-lockfile, postinstall, npq, socket-firewall, dependabot, renovate, provenance, trust-policy

**Error-based**: `npm ERR! code EINTEGRITY`, `npm audit vulnerability`, `ERESOLVE unable to resolve dependency tree`, `peer dep missing`, `lockfile injection`

## When to Use

- Upgrading major framework or library versions
- Setting up secure package manager configuration
- Configuring supply chain attack prevention
- Resolving dependency conflicts
- Automating dependency updates with CI tools
- Auditing for vulnerabilities

## When Not to Use

- Application feature development (not dependency-related)
- Infrastructure/DevOps unrelated to package management
- Design or UI decisions

## Package Managers Supported

npm, Bun, pnpm, Yarn, Deno — with PM-specific configuration templates for each.

## Known Issues Prevented

| Issue | Prevention | Source |
|-------|-----------|--------|
| Supply chain attacks via postinstall | Block all lifecycle scripts | Shai-Hulud, Nx incidents |
| Newly published malicious packages | 7-day cooldown period | event-stream, ua-parser-js |
| Lockfile injection via PRs | lockfile-lint validation | Liran Tal research (2019) |
| Blind upgrade introduces malware | Interactive review workflow | colors/faker, node-ipc |
| Non-deterministic CI builds | Frozen lockfile installs | npm/yarn lockfile drift |

## Quick Usage

```
"Set up secure dependency management for my project using Bun"
"Configure a 7-day cooldown period for npm installs"
"Help me upgrade React from 18 to 19 safely"
"Set up Dependabot with a cooldown period"
"Configure post-install script blocking for pnpm"
```
