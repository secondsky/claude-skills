# Code audit / SAST (Aradotso bundle)

> Grouped reference integrating 8 Aradotso code-audit / SAST skills (A1, A3, A4, A5, A6, A7, A8, A10) into one dispatchable sub-agent briefing. Attribution: Aradotso wrapper collection by ara.so; each sub-section names the upstream project.

## Sub-agent mission

You are dispatched to perform static code audit / SAST against a codebase. You may use multiple techniques: dual-track sink/control/config SAST, multi-agent parallel vuln discovery, falsification-based attacker-first scanning, MCP-driven 1,700+ rule scanning, or skill-file security checks. You return verified findings (not raw tool noise) with severity, evidence, the violated rule, and the matching defensive plugin.

## Inputs

- **task:** the user's verbatim request (e.g. "audit `src/` for security bugs before merge").
- **scope:** the directory / repo / files to audit. No live-target gate (SAST is Track A).
- **ack_state:** `n/a` (always Track A).
- **context (optional):** language(s), framework, OWASP / ASVS level targeted, prior findings.

## Tools

```bash
# Primary SAST
pipx install semgrep
# CodeQL: download from github.com/github/codeql-cli-binaries
# Bandit (Python): pipx install bandit
# Brakeman (Rails): gem install brakeman
# Sobelow (Elixir/Phoenix): mix archive.install github sobelow/sobelow

# MCP-driven scanner (optional, A5)
# See "agent-security-scanner-mcp" sub-section for install

# AI-driven scanners require a coding-agent runtime (Claude Code, Codex, Cursor, etc.)
```

For paid→OSS swaps (SonarQube → Semgrep, etc.), `SEE: references/oss-tool-map.md`.

## Methodology

You are a meta-scanner: the 8 sub-capabilities below give you a toolkit. **Do not run all 8** on every audit — pick the 1–3 that best match the task. Cross-reference to avoid duplicating findings.

### A1 — dfyx-code-security-review (dual-track white-box SAST)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/dfyx-code-security-review
- **Upstream:** dfyx (Ara Haag / dfyxen) — OSS skill.
- **What it adds:** Dual-track SAST. Track 1 = **sink-driven** (find dangerous APIs — `eval`, `exec`, `os.system`, `innerHTML`, `dangerouslySetInnerHTML` — then trace backward to user input). Track 2 = **control-driven** (find user-input entry points, trace forward to see where data goes). Track 3 = **config-driven** (security-relevant config flags, headers, cookies). OWASP Top 10 coverage across 9 languages.
- **When to use:** the primary workhorse for any multi-language codebase audit.
- **How to apply:**
  1. Run `semgrep --config=auto --json -o semgrep.json` to seed the sink list.
  2. For each dangerous-API finding, trace backward to the nearest user input (request body, query, header, env, file). If reachable without sanitization → finding.
  3. For each user-input entry point, trace forward. If the data reaches a dangerous sink → finding.
  4. Check config files (e.g. `next.config.js`, `nginx.conf`, `application.yml`) for security-flag misconfiguration.

### A3 — cloudflare-security-audit-skill (parallel-agent vuln discovery)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/cloudflare-security-audit-skill
- **Upstream:** Cloudflare — open-source skill that seeded their internal vuln-discovery harness.
- **What it adds:** Multi-phase parallel-agent methodology: **recon → hunt → adversarial validate → report**. Multiple sub-agents fan out over the codebase simultaneously, each looking for a different vuln class; an adversarial-validating sub-agent then re-checks each candidate to eliminate false positives before reporting.
- **When to use:** large codebases where serial scanning is slow; when false-positive rate must be minimized.
- **How to apply:**
  1. **Recon:** map the codebase (entry points, data flows, auth boundaries). Output: a target inventory for the hunters.
  2. **Hunt (parallel):** dispatch one sub-agent per vuln class (authn, authz, injection, crypto, config, secrets, SSRF, etc.).
  3. **Adversarial validate:** for each candidate finding, a validator sub-agent tries to refute it. Only survivors are reported.
  4. **Report:** consolidated finding list with evidence.

### A4 — agentic-security-scanner (broad appsec)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/agentic-security-scanner
- **Upstream:** OSS skill (agentic-security project).
- **What it adds:** Broad dev-appsec coverage: SAST + SCA + secrets + IaC + LLM safety + MCP tool audit + supply-chain. Maps findings to **OWASP ASVS**, **OWASP LLM Top 10**, **NIST AI 600-1**. Useful when the audit needs to cover non-code assets (IaC, dependency manifests, LLM prompts, MCP-server tool definitions).
- **When to use:** full-stack audit including IaC and LLM components.
- **How to apply:** run each track separately (SAST, SCA, secrets, IaC, LLM safety) and merge findings. For SCA, defer to this repo's `vulnerability-scanning` plugin.

### A5 — agent-security-scanner-mcp (MCP-driven 1,700+ rules)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/agent-security-scanner-mcp
- **Upstream:** ProofLayer — the **full OSS version** of the npm package is the recommended path. The Aradotso wrapper also references a "ProofLayer branded lightweight edition"; default to the OSS full version.
- **What it adds:** MCP server exposing 1,700+ rules across 12 languages. Adds package-hallucination detection (typosquatting / dependency-confusion), prompt-injection filter (for LLM apps), AST/taint analysis, auto-fix suggestions, SBOM generation.
- **When to use:** MCP-driven IDE/CI integration; LLM-app codebases needing prompt-injection scanning.
- **How to apply:**
  ```bash
  # Install the OSS full version (npm)
  npm install -g agent-security-scanner   # check the upstream README for the exact package name
  # Wire as an MCP server in your client config; then invoke scan tools
  ```
  Document that the full OSS version is the default; the branded lightweight edition is optional.

### A6 — vulnhunter-security-scanner (attacker-first falsification)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/vulnhunter-security-scanner
- **Upstream:** OSS skill.
- **What it adds:** **Falsification-based** scanning — instead of reporting "matches a pattern," the scanner tries to **construct an attack** that exploits the candidate. Only candidates that survive falsification (i.e. a real exploit path exists) are reported. Minimizes false positives dramatically.
- **When to use:** when the user is drowning in false-positive noise from pattern-based SAST.
- **How to apply:** run as a second-pass filter over the candidates from A1/A3. The vulnhunter sub-agent constructs an attack PoC for each candidate; only confirmed-exploitable findings survive.

### A7 — skill-file-security (AI-coding-assistant file checks)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/skill-file-security
- **Upstream:** OSS skill.
- **What it adds:** 29-category security check for AI coding assistants. Maps to OWASP Top 10, CWE Top 25, ASVS L3. Designed specifically for code that will be consumed by AI tools (skill files, prompt templates, MCP-server definitions).
- **When to use:** auditing skills/plugins/MCP-server code rather than application code.
- **How to apply:** run the 29-category checklist over the target files. Each category produces a pass/fail with evidence.

### A8 — esaa-security-audit (event-sourced audit)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/esaa-security-audit
- **Upstream:** OSS skill (ESAA — Event-Sourced Security Audit).
- **What it adds:** Event-sourced audit — 95 checks across 16 domains. Every check is recorded as an immutable event in an audit log, making findings verifiable and replayable.
- **When to use:** regulated environments where the audit process itself must be auditable (SOC 2 / ISO 27001 evidence).
- **How to apply:** run the 95-check battery; the event log becomes part of the compliance evidence package.

### A10 — claude-code-cybersecurity-skill (partial — appsec sections only)

- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/claude-code-cybersecurity-skill
- **Upstream:** OSS skill (15-file broad suite).
- **What it adds:** **Partial integration only.** The full skill covers offensive, defensive, reverse-engineering, threat hunting, CSOC. This bundle integrates **only the appsec-relevant sections** (SAST workflow, OWASP Top 10 mapping, secure-coding review checklists). RE / threat-hunting / CSOC sections are out of scope.
- **When to use:** when you need a broad checklist to cross-reference findings from A1/A3/A4.
- **How to apply:** use the appsec checklists as a final coverage sweep; do not run the RE / CSOC sections.

## Common mistakes

- **Running all 8 scanners on every audit.** Pick the 1–3 that fit the task. Cross-reference instead of stacking.
- **Reporting raw pattern matches.** Pattern-based SAST has high false-positive rates. Use A6 (falsification) or A3 (adversarial validation) to filter before reporting.
- **Skipping secrets scanning because "SAST covers it."** Use a dedicated secrets scanner (gitleaks, trufflehog) — pattern-based SAST misses secrets-specific patterns.
- **Ignoring IaC.** Terraform / CloudFormation / Kubernetes manifests have their own vuln classes. Use A4 or checkov/tfsec/kube-bench.
- **Not mapping to OWASP / CWE / ASVS.** Findings without a category are hard to triage. Always tag.

## Quick reference — when to use which

| Need | Use |
|---|---|
| Multi-language codebase audit | A1 (dfyx dual-track) |
| Large codebase, parallelism | A3 (cloudflare harness) |
| Full-stack (code + IaC + LLM + deps) | A4 (agentic) |
| MCP-driven IDE/CI integration, LLM apps | A5 (agent-security-scanner-mcp, OSS full version) |
| Drowning in false positives | A6 (vulnhunter falsification) |
| Auditing skill / plugin / MCP-server code | A7 (skill-file-security) |
| Regulated env, audit-the-audit | A8 (esaa event-sourced) |
| Broad appsec checklist for cross-reference | A10 (appsec sections only) |

## OWASP / compliance references

- **OWASP Top 10**, **CWE Top 25**, **OWASP ASVS L1/L2/L3**, **OWASP LLM Top 10**, **NIST AI 600-1**.

## Remediation

`SEE: references/defensive-cross-refs.md`. Typical matches: `defense-in-depth-validation`, `xss-prevention`, `csrf-protection`, `security-headers-configuration`, `vulnerability-scanning` (for SCA / dependency findings).

## Licensing & attribution

Aradotso wrapper collection by **ara.so** (https://github.com/Aradotso/security-skills). Each sub-section above names the upstream OSS project; upstream licenses are MIT / Apache-2.0 unless noted. Verify per-skill before redistributing.

## Sub-agent return contract

```json
{
  "scanners_used": ["A1", "A3"],
  "findings": [
    {
      "vuln": "SQL injection in /api/users?id=",
      "scanner": "A1 (dfyx sink-driven)",
      "severity": "critical",
      "owasp": "A03:2021",
      "cwe": "CWE-89",
      "asvs": "V5.3.1",
      "evidence": "src/routes/users.ts:42 — `db.query('SELECT * FROM users WHERE id=' + req.query.id)`; user input reaches SQL sink without parameterization.",
      "remediation": "Parameterize the query: `db.query('SELECT * FROM users WHERE id = ?', [req.query.id])`.",
      "defensive_plugin": "defense-in-depth-validation",
      "falsified": true
    }
  ],
  "false_positives_filtered": 14,
  "summary": "2 scanners used (dfyx dual-track + cloudflare harness). 1 critical SQLi confirmed via adversarial validation. 14 candidates filtered as false positives."
}
```
