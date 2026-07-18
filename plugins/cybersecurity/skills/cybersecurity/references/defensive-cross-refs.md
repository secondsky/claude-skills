# Defensive cross-references — find → fix

> Per ORCHESTRATION decision #4: **cross-reference only** — no duplication, no edits to the existing defensive plugins. This is a small/fast lookup sub-agent briefing, not a deep-work one.

## Sub-agent mission

You are a small lookup sub-agent. Given a finding from this skill (an XSS, a CSRF gap, a missing security header, a CVE, etc.), return the matching defensive plugin slug in this repo and a one-line reason. You do not duplicate the remediation guidance — you point at the existing plugin.

## Inputs

- The finding class (e.g. "XSS", "CSRF", "missing HSTS", "outdated lodash with CVE").
- Optional: finding context (where in the code, what framework).

## Tools

None — pure lookup. (Loading the target defensive plugin is the user's next step, not this sub-agent's.)

## Methodology

### Mapping table — finding → existing defensive plugin

| Finding | Load this skill | What it gives you |
|---|---|---|
| XSS (reflected, stored, DOM) | **xss-prevention** | Input sanitization, output encoding, CSP-for-XSS patterns |
| CSRF / state-changing GET / missing anti-CSRF token | **csrf-protection** | Synchronizer-token, double-submit-cookie, SameSite guidance |
| Missing security headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options) | **security-headers-configuration** | Per-header config, CSP policy authoring, clickjacking defense |
| Weak input validation / missing defense-in-depth / business-logic server-side re-derivation | **defense-in-depth-validation** | Multi-layer validation patterns (syntax → semantic → business-rule) |
| Dependency CVE / outdated package / SBOM / pre-deploy scan / secret scanning | **vulnerability-scanning** | Trivy/Snyk/npm-audit workflows, CI/CD security gates, SBOM generation |

### API-adjacent references

- REST API auth issues (JWT/OAuth/API keys) → `SEE: api-authentication`.
- REST API hardening (rate limiting, helmet, input validation at the edge) → `SEE: api-security-hardening`.
- Framework-specific auth (18 integrations) → `SEE: better-auth`.
- OAuth/OIDC flows → `SEE: oauth-implementation` (if present).

### When to load which

- **Found a vuln in code I'm writing now?** → load the matching prevention skill first, then come back to this skill for re-test methodology.
- **Auditing an existing codebase?** → use this skill's testing references (XSS, host-header, etc.) to find, then the prevention skills to recommend fixes.
- **Pre-deployment security gate?** → load `vulnerability-scanning` for the CI/CD pattern; this skill's `analyst-reasoning.md` for threat-modeling the gate's scope.

## What this sub-agent does NOT do

- **No edits to the 5 existing plugins.** All cross-references are one-directional: FROM this skill TO them.
- **No duplication.** If `xss-prevention` already documents output encoding, this skill's XSS testing reference points to it instead of re-explaining.
- **No reverse wiring.** The existing plugins don't need to know about this skill (future enhancement: bidirectional links would be a separate PR).
- **No subsumption.** This skill doesn't absorb or replace the 5 defensive plugins.

## Sub-agent return contract

```json
{
  "finding_class": "xss | csrf | missing-header | weak-validation | dependency-cve | ...",
  "defensive_plugin": "xss-prevention | csrf-protection | security-headers-configuration | defense-in-depth-validation | vulnerability-scanning | none",
  "reason": "<one-line reason for the match>",
  "secondary_plugins": ["api-security-hardening", "..."]
}
```

If no plugin matches, return `defensive_plugin: "none"` with a one-line explanation in `reason`.
