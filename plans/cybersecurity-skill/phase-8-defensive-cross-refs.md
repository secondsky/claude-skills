# Phase 8 — Defensive cross-references

> **Status:** 📋 Ready to execute (after plan approval).
>
> **Depends on:** [phase-3-skill-architecture.md](phase-3-skill-architecture.md).

## Purpose

Wire up cross-references **from** the new `cybersecurity` skill **to** the 5 existing defensive security plugins in this repo. Per ORCHESTRATION decision #4: cross-reference only, no duplication, no edits to the existing plugins.

This gives the user a complete **find → reference → fix** lifecycle: the new skill finds the vulnerability, then points to the existing defensive plugin for the remediation pattern.

## The 5 existing defensive plugins

| Plugin slug | Category | What it does | Marketplace line |
|---|---|---|---|
| `csrf-protection` | security | CSRF tokens (synchronizer, double-submit), SameSite attributes | ~420 |
| `defense-in-depth-validation` | security | Multi-layer input validation | ~429 |
| `security-headers-configuration` | security | HTTP security headers, CSP, clickjacking defense | ~987 |
| `vulnerability-scanning` | security | Trivy/Snyk/npm audit, CI/CD security gates, SCA/SBOM | ~1176 |
| `xss-prevention` | security | Input sanitization, output encoding, CSP for XSS prevention | ~1257 |

(Plus security-adjacent: `api-authentication`, `api-security-hardening`, `better-auth`, `oauth-implementation` — referenced where relevant but not the primary targets.)

## Output

Single reference doc: `references/defensive-cross-refs.md`.

## Reference-doc structure

```markdown
# Defensive cross-references — find → fix

When this skill identifies a vulnerability, the fix often lives in one of this repo's
existing defensive plugins. Load the matching plugin for the remediation pattern;
don't reinvent it here.

## Mapping table

| Finding | Load this skill | What it gives you |
|---|---|---|
| XSS (reflected, stored, DOM) | **xss-prevention** | Input sanitization, output encoding, CSP-for-XSS patterns |
| CSRF / state-changing GET / missing anti-CSRF token | **csrf-protection** | Synchronizer-token, double-submit-cookie, SameSite guidance |
| Missing security headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options) | **security-headers-configuration** | Per-header config, CSP policy authoring, clickjacking defense |
| Weak input validation / missing defense-in-depth | **defense-in-depth-validation** | Multi-layer validation patterns (syntax → semantic → business-rule) |
| Dependency CVE / outdated package / SBOM / pre-deploy scan | **vulnerability-scanning** | Trivy/Snyk/npm-audit workflows, CI/CD security gates, SBOM generation |

## When to load which

- **Found a vuln in code I'm writing now?** → load the matching prevention skill first, then come back here for re-test methodology.
- **Auditing an existing codebase?** → use this skill's testing references (XSS, host-header, etc.) to find, then the prevention skills to recommend fixes.
- **Pre-deployment security gate?** → load vulnerability-scanning for the CI/CD pattern; this skill's analyst-reasoning reference for threat-modeling the gate's scope.

## API-adjacent references
- REST API auth issues → SEE: api-authentication (JWT/OAuth/API keys)
- REST API hardening (rate limiting, helmet, input validation at the edge) → SEE: api-security-hardening
- Framework-specific auth (18 integrations) → SEE: better-auth
- OAuth/OIDC flows → SEE: oauth-implementation
```

## SKILL.md routing entry

Add to the routing table in SKILL.md:

```markdown
| Map finding → existing defensive fix | references/defensive-cross-refs.md |
```

Also add a "Remediation" callout near the bottom of each `testing-*.md` reference (XSS, host-header, etc.) like:

```markdown
## Remediation
SEE: references/defensive-cross-refs.md for the matching prevention skill in this repo.
```

## What this phase does NOT do

- **No edits to the 5 existing plugins.** All cross-references are one-directional: FROM the new skill TO them.
- **No duplication.** If `xss-prevention` already documents output encoding, this skill's XSS testing reference points to it instead of re-explaining.
- **No reverse wiring.** The existing plugins don't need to know about the new skill. (Future enhancement: if the maintainers want bidirectional links, that's a separate PR.)
- **No subsumption.** The new skill doesn't absorb or replace the 5 defensive plugins.

## Implementation checklist (when phase 8 executes)

- [ ] Write `references/defensive-cross-refs.md` per the structure above, formatted as a **lookup sub-agent briefing** (decision #5): add `## Sub-agent mission`, `## Inputs`, `## Tools` (none — pure lookup), `## Methodology` (the mapping table), `## Sub-agent return contract` (returns the matching defensive plugin slug + one-line reason). This is a small/fast sub-agent, not a deep-work one.
- [ ] Add the routing-table entry to SKILL.md.
- [ ] Add the "Remediation" callout to each phase-5 `testing-*.md` reference doc — the callout tells the deep-work sub-agent to also dispatch a defensive-cross-refs lookup sub-agent (or just include the cross-ref inline in its return payload).
- [ ] Verify all cross-refs use `SEE: <skill-name>` (skill-name only, no `@` link, per writing-skills convention).
- [ ] Verify no edits to any of the 5 existing plugin files.
- [ ] Verify the mapping covers every finding type the testing references can produce.

## Things I will NOT do (this phase)

- Will NOT edit any of the 5 existing defensive plugins (`csrf-protection`, `xss-prevention`, `vulnerability-scanning`, `security-headers-configuration`, `defense-in-depth-validation`).
- Will NOT duplicate remediation content — cross-reference only.
- Will NOT use `@` links (force-loads, burns context).
- Will NOT make the cross-references bidirectional in this pass.
- Will NOT skip the sub-agent briefing format (decision #5) — even small lookup docs are dispatchable units.
- Will NOT commit — file lands in working tree for review.
