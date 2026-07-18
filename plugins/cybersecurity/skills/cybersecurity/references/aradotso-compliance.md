# Compliance suite — OWASP / CVE / GDPR / SOC2 / ISO27001 (Aradotso bundle)

> Grouped reference integrating C1 (awesome-claude-code-security-compliance-suite) into one dispatchable sub-agent briefing. Attribution: Aradotso wrapper collection by ara.so.

## Sub-agent mission

You are dispatched to perform compliance-oriented security work: map a codebase / project against OWASP Top 10, check for known CVEs in dependencies, verify GDPR/SOC2/ISO27001 control coverage, produce threat-model artifacts, and walk through an incident-response playbook. You produce compliance-mapped findings and evidence artifacts suitable for an audit trail.

## Inputs

- **task:** the user's verbatim request (e.g. "what CVEs are in my dependencies?", "do we meet SOC 2 CC7 for incident response?", "produce an OWASP Top 10 coverage report for src/").
- **scope:** the codebase / project / system to assess. Track A — no live-target gate.
- **ack_state:** `n/a`.
- **context (optional):** target compliance regime(s), org policies, prior audit findings.

## Tools

```bash
# CVE / dependency scanning (delegates to this repo's vulnerability-scanning plugin where applicable)
pipx install osv-scanner
pipx install pip-audit
brew install trivy
# npm audit ships with npm

# SAST for OWASP Top 10 mapping
pipx install semgrep

# Threat-modeling: pure reasoning (analyst-reasoning.md); no tooling required
```

For the matching defensive plugin, `SEE: references/defensive-cross-refs.md`.

## Methodology

### Sub-capability 1 — OWASP Top 10 mapping

For each of the OWASP Top 10 categories, scan the codebase and report coverage:

| OWASP | What to check | Typical tool |
|---|---|---|
| A01 Broken Access Control | Authz on every privileged route, IDOR, forced browsing | manual + `defense-in-depth-validation` patterns |
| A02 Cryptographic Failures | TLS config, key management, password hashing | grep + `security-headers-configuration` |
| A03 Injection | SQLi, NoSQLi, command injection, XSS | Semgrep + `xss-prevention` |
| A04 Insecure Design | Threat model exists? business-logic checks? | `analyst-reasoning.md` |
| A05 Security Misconfiguration | Default creds, verbose errors, exposed admin | config audit |
| A06 Vulnerable & Outdated Components | CVEs in deps | osv-scanner / trivy / npm audit |
| A07 Identification & Auth Failures | Weak passwords, missing MFA, session fixation | manual + `csrf-protection` |
| A08 Software & Data Integrity Failures | Unsigned CI/CD, unverified deps, race conditions | CI/CD audit |
| A09 Security Logging & Monitoring Failures | Missing audit logs, no alerting | log review |
| A10 SSRF | Server-side fetch without allowlist | Semgrep + manual |

Output: a per-category table with status (covered / partial / missing) and evidence.

### Sub-capability 2 — CVE checking

```bash
# Multi-ecosystem
osv-scanner --lockfile=package-lock.json
osv-scanner --lockfile=yarn.lock
osv-scanner --lockfile=pnpm-lock.yaml
osv-scanner --lockfile=requirements.txt
osv-scanner --lockfile=Pipfile.lock
osv-scanner --lockfile=go.sum
osv-scanner --lockfile=Cargo.lock

# Container / IaC
trivy fs .
trivy image <image>
```

Each finding: CVE ID, severity (CVSS), fixed version, whether a fix is available. **Prioritize by CISA KEV** — if a CVE is in the Known Exploited Vulnerabilities catalog, it's an active threat, not a theoretical one.

For the matching defensive workflow, `SEE: vulnerability-scanning` (this repo's plugin) for the full CI/CD gate pattern.

### Sub-capability 3 — GDPR / SOC 2 / ISO 27001 control mapping

Map findings to compliance controls. Use this high-level map:

| Regime | Core controls | What to verify |
|---|---|---|
| **GDPR** | Art. 5 (data minimization), Art. 25 (privacy by design), Art. 32 (security of processing), Art. 33 (breach notification) | PII inventory, encryption at rest + transit, access controls, breach-notification procedure (72h to supervisory authority) |
| **SOC 2** | Security (CC1–CC9), Availability, Confidentiality, Processing Integrity, Privacy | Risk assessment, access controls, change management, incident response, monitoring |
| **ISO 27001** | Annex A controls (A.5–A.18) | ISMS scope, risk treatment plan, access control, crypto, ops security, supplier relationships, incident management, compliance |

Each finding from Sub-capabilities 1 & 2 maps to one or more control gaps. Report:

```text
Finding: <vuln>
Compliance impact:
  - GDPR Art. 32 (security of processing) — not met because <reason>
  - SOC 2 CC6.1 (logical access) — not met because <reason>
  - ISO 27001 A.9 (access control) — not met because <reason>
Required action: <remediation>
Evidence: <file:line + tool output>
```

### Sub-capability 4 — Threat modeling

Drive a threat-modeling session producing:

1. **System model** (components, data flows, trust boundaries).
2. **Threat list** using STRIDE or PASTA. `SEE: references/analyst-reasoning.md` for the full 11-step framework.
3. **MITRE ATT&CK mapping** for each threat.
4. **Risk-rated findings** (CVSS + FAIR).

This is purely analytical (Track A). Output feeds both Sub-capability 1 (OWASP coverage) and the compliance mapping above.

### Sub-capability 5 — Incident response (IR) playbook

Per **NIST SP 800-61r2**, the IR lifecycle is: **Preparation → Detection & Analysis → Containment / Eradication / Recovery → Post-Incident Activity**. Map the org's existing capability to each phase:

| Phase | What to verify |
|---|---|
| Preparation | IR team named, runbooks exist, contact tree current, forensic tooling ready |
| Detection & Analysis | Logging covers all critical assets, SIEM rules tuned, triage procedure defined, MTTD measured |
| Containment | Short-term and long-term containment strategies exist, scope-isolation procedure defined |
| Eradication | Root-cause identification, threat/vuln removal, system re-image procedure |
| Recovery | Restore from clean backups, validate monitoring, phased return-to-service |
| Post-Incident | Lessons-learned meeting within 2 weeks, metrics updated, controls improved |

For each gap, prescribe a remediation and (where available) a detection-engineering follow-up (`SEE: references/detections-mcp.md` for Sigma authoring).

## Common mistakes

- **Reporting CVEs without KEV context.** A CVE in the CISA KEV catalog is an active threat; rank it above theoretical-only CVEs.
- **Treating compliance as checkbox.** A control that exists on paper but not in practice is not met. Verify operationally.
- **Skipping threat modeling.** OWASP mapping without a threat model is a coverage table without a brain. Pair them.
- **Not producing evidence.** Auditors need file:line + tool output, not assertions. Capture evidence as you go.
- **Forgetting breach-notification deadlines.** GDPR is 72h; other regimes vary. If the user is in scope, surface the deadline explicitly.

## Quick reference — compliance regime triggers

| If the user mentions | Regime in scope |
|---|---|
| EU users, personal data | GDPR |
| US service company, customer audit | SOC 2 |
| ISO-certified or pursuing | ISO 27001 |
| Cardholder data | PCI DSS |
| US health data | HIPAA |
| US federal contractor | FedRAMP / NIST 800-53 |
| Any production app | OWASP Top 10 (baseline) |

## Compliance references

- **OWASP Top 10** (2021), **OWASP ASVS** (L1/L2/L3).
- **CVE / NVD / OSV.dev / CISA KEV**.
- **GDPR** (Regulation 2016/679).
- **SOC 2** (AICPA TSC).
- **ISO/IEC 27001:2022** (Annex A controls).
- **NIST SP 800-53r5**, **800-61r2** (IR), **800-207** (zero trust), **CSF 2.0**.
- **PCI DSS v4.0**.

## Remediation

`SEE: references/defensive-cross-refs.md`. Typical matches span all 5 defensive plugins depending on the finding class.

## Licensing & attribution

Aradotso wrapper collection by **ara.so**. C1 upstream: `awesome-claude-code-security-compliance-suite` (OSS).

## Sub-agent return contract

```json
{
  "regimes_in_scope": ["OWASP-Top-10", "SOC2", "GDPR"],
  "owasp_coverage": [
    { "category": "A01:2021", "status": "partial | covered | missing", "evidence": "..." }
  ],
  "cves": [
    { "id": "CVE-2024-XXXX", "severity": "high", "package": "lodash@4.17.20", "fixed_in": "4.17.21", "in_kev": false }
  ],
  "control_gaps": [
    { "control": "SOC2 CC6.1", "gap": "no MFA on admin console", "severity": "high", "remediation": "enforce MFA" }
  ],
  "threat_model": { /* optional — see analyst-reasoning.md return contract */ },
  "ir_readiness": {
    "preparation": "covered | partial | missing",
    "detection": "...",
    "containment": "...",
    "eradication": "...",
    "recovery": "...",
    "post_incident": "..."
  },
  "summary": "<plain-language summary>"
}
```
