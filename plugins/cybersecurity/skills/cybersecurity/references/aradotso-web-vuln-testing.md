# Web / API vuln testing & learning (Aradotso bundle)

> Grouped reference integrating 4 Aradotso skills (D1 websecurityacademy-solutions, D2 vibe-pentest-ai-security-testing, D3 pentest-lyan-web-security-testing, D4 web-security-scanner-pro). Attribution: Aradotso wrapper collection by ara.so.

## Sub-agent mission

You are dispatched to either (a) **learn** web/API vulnerability testing via the PortSwigger Web Security Academy labs, or (b) **run** an automated multi-agent pentest or autonomous web scanner against a target. For learning tasks you produce walkthroughs and explanations; for testing tasks you drive the OSS scanners and report findings with severity, evidence, and the matching defensive plugin.

## Inputs

- **task:** the user's verbatim request (e.g. "walk me through the SQLi labs in the PortSwigger Academy", "run an automated pentest against stage.example.com", "use the Python web scanner to check our deploy").
- **target / scope:** base URL for testing tasks; lab URL / category for learning tasks. Confirmed by the orchestrator's gate for live-target tasks.
- **ack_state:** `confirmed` for live-target testing; `n/a` for learning tasks (Academy labs are owned-by-PortSwigger and safe to test) and for static review.
- **context (optional):** framework, prior findings, specific lab category.

## Tools

```bash
# Multi-agent pentest (D2, D3) — requires coding-agent runtime
# Autonomous web scanner (D4)
git clone https://github.com/<upstream>/web-security-scanner-pro.git  # check upstream README for exact URL
cd web-security-scanner-pro
pip install -r requirements.txt

# General web testing (cross-ref the phase-5 testing references)
brew install ffuf nuclei zap-studio
go install github.com/hahwul/dalfox/v2@latest
```

For paid→OSS swaps, `SEE: references/oss-tool-map.md`.

## Methodology

### D1 — websecurityacademy-solutions (learning)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/websecurityacademy-solutions
- **Upstream:** PortSwigger Web Security Academy — **free labs** (the Academy itself is free; not paid-tool-dependent).
- **What it adds:** Walkthroughs of 30+ PortSwigger Academy lab categories: SQLi (union, blind, error-based), XSS (reflected, stored, DOM, CSP bypass), CSRF, SSRF, XXE, request smuggling, OAuth, JWT, business logic, file upload, path traversal, HTTP/2 attacks. The skill is a **learning** resource — it teaches methodology via guided lab solutions.
- **When to use:** the user is learning web pentesting; the user asks "how do I solve the `<category>` Academy lab?"; the user wants to understand a vuln class before testing their own app.
- **How to apply:**
  1. Identify the lab category the user is asking about.
  2. Walk through the methodology step-by-step: identify the entry point → confirm the vuln class → craft the payload → verify execution → (where applicable) exfiltrate the goal.
  3. Cross-reference the matching testing reference in this skill: SQLi/XSS → `testing-xss.md`; CSRF → `csrf-protection`; SSRF/business-logic/host-header → matching phase-5 references.
  4. Do NOT run exploits against targets the user does not own. Academy labs are fine; third-party URLs are gated.

### D2 — vibe-pentest-ai-security-testing (multi-agent automated pentest)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/vibe-pentest-ai-security-testing
- **Upstream:** OSS skill.
- **What it adds:** Multi-agent automated pentest harness for web apps, APIs, and admin panels **including business-logic testing** (which most scanners skip). Fan-out: recon → auth-bypass hunt → business-logic hunt → injection hunt → report.
- **When to use:** the user wants an automated broad-spectrum pentest of their own app.
- **How to apply:**
  1. **Recon** sub-agent: crawl the app, build a route + param inventory (ZAP spider + `gf` extraction).
  2. **Auth-bypass** sub-agent: test forced browsing, IDOR, role escalation. `SEE: references/testing-forced-browsing.md`.
  3. **Business-logic** sub-agent: test price/quantity manipulation, workflow bypass, race conditions. `SEE: references/testing-business-logic.md`.
  4. **Injection** sub-agent: test XSS, SQLi, SSRF, header injection. `SEE: references/testing-xss.md`, `testing-host-header.md`.
  5. **Report** sub-agent: consolidate, dedupe, severity-rank, cross-reference defensive plugins.
- **Gate:** all live-target steps fire under the orchestrator's gate (one ack covers the batch).

### D3 — pentest-lyan-web-security-testing (autonomous pentest with threat modeling)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/pentest-lyan-web-security-testing
- **Upstream:** OSS skill.
- **What it adds:** Autonomous web pentest that **starts with a threat model** (data flows, trust boundaries), then drives JS analysis + multi-role verification (attacker / victim / admin perspectives). The threat-model-first approach avoids pure-scanner false positives.
- **When to use:** when the user wants a threat-model-driven pentest rather than a pure scanner sweep.
- **How to apply:**
  1. **Threat-model phase:** map the app (components, data flows, trust boundaries). `SEE: references/analyst-reasoning.md`.
  2. **JS analysis phase:** statically analyze client-side JS for sinks, API endpoints, hardcoded tokens.
  3. **Multi-role verification phase:** for each candidate finding, verify from multiple perspectives (anonymous attacker, authenticated user, admin) to confirm exploitability and impact.
  4. **Report phase:** consolidated findings with per-perspective exploitability.

### D4 — web-security-scanner-pro (Python web scanner)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/web-security-scanner-pro
- **Upstream:** OSS Python web scanner.
- **What it adds:** Python web scanner with **49 modules** — SQLi, XSS, SSRF, WordPress checks, CVE DB lookup, WAF bypass, evasion engine. **Dual-use**: document the dual-use nature responsibly.
- **When to use:** the user wants a self-contained Python scanner (no multi-agent runtime required) for a target they own.
- **How to apply:**
  ```bash
  python3 scanner.py -u https://TARGET/ --modules all --output scan.json
  ```
  **Responsible-use note:** this scanner is dual-use. Run only against targets you own or are explicitly authorized to test. The orchestrator's gate fires first. Document the dual-use nature in the user-facing report.

## Common mistakes

- **Using D2/D3/D4 against targets you don't own.** All four testing sub-capabilities are live-target tools. The gate fires first.
- **Treating D1 as a testing tool.** D1 is a **learning** resource (Academy lab walkthroughs). It's not a scanner.
- **Reporting scanner raw output without verification.** All four scanners produce noise. Verify candidate findings before reporting (the threat-model-first approach of D3 helps here).
- **Forgetting business logic.** Most scanners skip business-logic testing. D2 is the exception — use it when the user wants business-logic coverage.
- **Skipping the multi-role verification.** A vuln exploitable by an anonymous attacker has different severity than one requiring admin. Always test from multiple perspectives.

## Quick reference — which tool for which need

| Need | Use |
|---|---|
| Learning a web-vuln class via Academy labs | D1 |
| Multi-agent broad pentest (incl. business logic) | D2 |
| Threat-model-first autonomous pentest | D3 |
| Self-contained Python scanner (no agent runtime) | D4 |
| Targeted XSS testing | `SEE: testing-xss.md` |
| Targeted business-logic testing | `SEE: testing-business-logic.md` |
| Targeted host-header testing | `SEE: testing-host-header.md` |

## OWASP / MITRE references

- **OWASP Top 10** (A01–A10) — all categories in scope.
- **OWASP WSTG** (Web Security Testing Guide) — methodology framework.
- **MITRE ATT&CK** — T1190, T1059.007, T1505.003, T1083.

## Remediation

`SEE: references/defensive-cross-refs.md`. Typical matches: `xss-prevention`, `csrf-protection`, `defense-in-depth-validation`, `security-headers-configuration`.

## Licensing & attribution

Aradotso wrapper collection by **ara.so**. Upstreams: PortSwigger Web Security Academy (D1, free labs), vibe-pentest-ai-security-testing (D2, OSS), pentest-lyan (D3, OSS), web-security-scanner-pro (D4, OSS — dual-use, document responsibly).

## Sub-agent return contract

```json
{
  "mode": "learning | testing",
  "tools_used": ["D1", "D2", "D3", "D4"],
  "findings": [
    {
      "vuln": "<one-line>",
      "tool": "D2 | D3 | D4",
      "severity": "high | medium | low",
      "owasp": "A0X:2021",
      "mitre": ["TXXXX"],
      "evidence": "<request + response excerpt>",
      "perspectives": ["anonymous: exploitable", "authenticated: exploitable", "admin: n/a"],
      "remediation": "<fix>",
      "defensive_plugin": "<name>"
    }
  ],
  "learning_walkthrough": "<optional — for D1 tasks, the step-by-step lab solution>",
  "summary": "<plain-language summary>"
}
```
