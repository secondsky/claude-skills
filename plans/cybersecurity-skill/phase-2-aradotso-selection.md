# Phase 2 — Aradotso skill selection

> **Status:** ✅ Selection locked by user (2026-07-18). Phase 6 now has its input.
>
> **Depends on:** [phase-1-research-baseline.md](phase-1-research-baseline.md).

## Purpose

From the 162 skills in [Aradotso/security-skills](https://github.com/Aradotso/security-skills/tree/main/skills), curate the ~20 distinct candidates that fit a **software-developer-focused** cybersecurity bundle. Each candidate has a one-line rationale and a fit score. ~~The user marks which to include; phase 6 applies the integration template to each chosen skill.~~ **(Selection complete — see "Locked selection" below.)**

## Exclusions already applied

Per the user's spec, these are **out** and do not appear below:
- **malware / virus** (~63 AV-crack warning + AV-ops skills in the repo)
- **supabase** (supabase-pentest-skills)
- **openclaw** (4 OpenClaw security skills)
- **linux** (7 linux-pentest / hardening skills)
- **hardware** (3 spoofing toolkit skills)
- **firewall** (3 Fort Firewall + networking skills)
- Plus broad-offensive / mobile-pentest / SOC / OS-hardening / DRM / automotive / OSINT skills (~50 more — out of scope for a dev-focused bundle).

## Candidates

### A. Code audit / SAST / appsec

| # | Skill | Repo path | What it adds | Paid deps | OSS deps | Fit |
|---|---|---|---|---|---|---|
| A1 | `dfyx-code-security-review` | skills/dfyx-code-security-review | Dual-track (sink/control/config-driven) white-box SAST with OWASP Top 10 coverage across 9 languages | None | AI coding agent | ⭐⭐⭐ Core |
| A2 | `eastsword-dfyx-code-security-review` | skills/eastsword-dfyx-code-security-review | Near-duplicate of A1 (EastSword taint-tracking variant). Pick **one** of A1/A2. | None | AI coding agent | ⭐⭐ duplicate |
| A3 | `cloudflare-security-audit-skill` | skills/cloudflare-security-audit-skill | Multi-phase parallel-agent audit (recon → hunt → adversarial validate → report). Open-source skill that seeded Cloudflare's vuln-discovery harness. | None | AI coding agent | ⭐⭐⭐ Core |
| A4 | `agentic-security-scanner` | skills/agentic-security-scanner | Broad dev appsec: SAST + SCA + secrets + IaC + LLM safety + MCP tool audit + supply chain. Maps to OWASP ASVS / LLM Top 10 / NIST AI 600-1. | None | npm/npx, CISA KEV/EPSS | ⭐⭐⭐ Core |
| A5 | `agent-security-scanner-mcp` | skills/agent-security-scanner-mcp | MCP server for AI coding agents — 1,700+ rules, 12 languages, package-hallucination detection, prompt-injection firewall, AST/taint, auto-fix, SBOM. | "ProofLayer" branded lightweight edition; full version OSS | Node/npm, MCP | ⭐⭐⭐ Core (if MCP path desired) |
| A6 | `vulnhunter-security-scanner` | skills/vulnhunter-security-scanner | Attacker-first, falsification-based source-code scanner minimizing false positives. | None | AI coding agent | ⭐⭐ Nice-to-have |
| A7 | `skill-file-security` | skills/skill-file-security | Security checks for AI coding assistants — 29 categories, OWASP Top 10, CWE Top 25, ASVS L3. | None | AI coding agent | ⭐⭐ Nice-to-have |
| A8 | `esaa-security-audit` | skills/esaa-security-audit | Event-sourced security audit — 95 checks across 16 domains; immutable event log for verifiable findings. | None | AI coding agent | ⭐⭐ Nice-to-have |
| A9 | `symfony-security-auditor` | skills/symfony-security-auditor | Multi-agent LLM auditor for Symfony PHP — business-logic flaws, broken access control, missing Voters. | None | Symfony, PHP | ⭐ Niche (framework-specific) |
| A10 | `claude-code-cybersecurity-skill` | skills/claude-code-cybersecurity-skill | 15 production SKILL.md files covering offensive, defensive, RE, threat hunting, CSOC. | None | AI coding agent | ⭐⭐ Partial — broad suite; some overlap |

### B. Dependency / supply-chain security

| # | Skill | Repo path | What it adds | Paid deps | OSS deps | Fit |
|---|---|---|---|---|---|---|
| B1 | `npm-security-best-practices` | skills/npm-security-best-practices | npm supply-chain defense — postinstall scripts, dependency-confusion, hardened config. | None | npm/Node | ⭐⭐⭐ Core |
| B2 | `pypi-security-best-practices` | skills/pypi-security-best-practices | Python supply-chain — hash verification, dependency cooldown, malicious-package defense. | None | pip, uv | ⭐⭐⭐ Core |

### C. Compliance / OWASP / CVE / threat-modeling suites

> ⚠️ Six near-duplicates of one suite exist. Pick **at most one**.

| # | Skill | Repo path | What it adds | Paid deps | OSS deps | Fit |
|---|---|---|---|---|---|---|
| C1 | `awesome-claude-code-security-compliance-suite` | skills/awesome-claude-code-security-compliance-suite | 10 commands + 5 workflows: OWASP, CVE, GDPR/SOC2/ISO27001, threat modeling, IAM, secrets, IR. | None | AI coding agent | ⭐⭐⭐ Core (pick this one) |
| C2 | `security-compliance-skills-suite-claude` | skills/security-compliance-skills-suite-claude | Same suite, different author slug. | None | AI coding agent | ⭐ duplicate |
| C3–C6 | `sparkfinderoven-*` (4 variants) | skills/sparkfinderoven-* | OWASP/CVE/GDPR/SOC2/threat-modeling/IR — same suite family. | None | AI coding agent | ⭐ duplicates |

### D. Web / API vulnerability testing

| # | Skill | Repo path | What it adds | Paid deps | OSS deps | Fit |
|---|---|---|---|---|---|---|
| D1 | `websecurityacademy-solutions` | skills/websecurityacademy-solutions | Walkthroughs of PortSwigger Web Security Academy labs (SQLi, XSS, CSRF, SSRF, 30+ categories). Excellent **learning** resource. | PortSwigger Academy (free labs) | None | ⭐⭐⭐ Core (learning) |
| D2 | `vibe-pentest-ai-security-testing` | skills/vibe-pentest-ai-security-testing | Multi-agent automated pentest for web apps/APIs/admin panels incl. business-logic testing. | None | AI coding agent | ⭐⭐ Nice-to-have |
| D3 | `pentest-lyan-web-security-testing` | skills/pentest-lyan-web-security-testing | Autonomous web pentest with threat modeling, JS analysis, multi-role verification. | None | AI coding agent | ⭐⭐ Nice-to-have |
| D4 | `web-security-scanner-pro` | skills/web-security-scanner-pro | Python web scanner — 49 modules, evasion engine, CVE DB, WAF bypass, SQLi/XSS, WordPress checks. | None | Python, web-pentest libs | ⭐⭐ Nice-to-have (dual-use) |
| D5 | `deepseek-pentest-ai-burp-extension` | skills/deepseek-pentest-ai-burp-extension | Burp extension using DeepSeek API for context-aware attack payloads. | **Burp Pro + DeepSeek API (both paid)** | Java | ❌ Skip (paid deps) |

### E. LLM / AI-application security & red-teaming

| # | Skill | Repo path | What it adds | Paid deps | OSS deps | Fit |
|---|---|---|---|---|---|---|
| E1 | `gandalf-llm-pentester` | skills/gandalf-llm-pentester | Red-team toolkit for LLM apps — prompt-injection validation, guardrail evaluation, risk analysis. | None | AI/LLM APIs | ⭐⭐⭐ Core (AI-appsec) |
| E2 | `ai-security-knowledge-base` | skills/ai-security-knowledge-base | Comprehensive AI-security reference — ML fundamentals, OWASP ML/LLM Top 10, MCP security, adversarial ML, red/blue team. | None | None (docs) | ⭐⭐⭐ Core (reference) |
| E3 | `awesome-ai-security-reference` | skills/awesome-ai-security-reference | Curated learning roadmap — prompt injection, adversarial attacks, poisoning, privacy/extraction, defenses. | None | None (curated list) | ⭐⭐ Nice-to-have |
| E4 | `awesome-ai-security-tools-guide` | skills/awesome-ai-security-tools-guide | Tool recommendations across 15+ AI-security categories (agent security, AI supply chain, AI SAST, LLM fuzzing, red-teaming). | Some listed tools commercial | Mixed | ⭐⭐ Nice-to-have |

### F. Smart-contract / agent appsec

| # | Skill | Repo path | What it adds | Paid deps | OSS deps | Fit |
|---|---|---|---|---|---|---|
| F1 | `solana-security-standard` | skills/solana-security-standard | SOL-0XX standard for 37 classes of Solana program vulnerabilities across AI tools, editors, CLI, CI. | None | Solana/Anchor | ⭐⭐ Niche (smart-contract) |
| F2 | `slowmist-agent-security-framework` | skills/slowmist-agent-security-framework | Framework for AI agents to audit skills, repos, URLs, on-chain addresses, MCP servers in adversarial environments. | None | AI coding agent | ⭐⭐ Nice-to-have |

### G. Maybe (dev-relevant infra / spec)

| # | Skill | Repo path | What it adds | Paid deps | OSS deps | Fit |
|---|---|---|---|---|---|---|
| G1 | `iac-security-scan-skills` | skills/iac-security-scan-skills | AI-powered IaC scanner with attack-chain analysis for Terraform/CloudFormation. | None | Terraform, CloudFormation | ⭐⭐ Recommend if devs own IaC |
| G2 | `foundry-security-spec` | skills/foundry-security-spec | Cisco Foundry open spec — multi-agent architecture blueprint for agentic AI security-evaluation systems. | None | Cisco Foundry spec | ⭐ Reference spec only |
| G3 | `vibe-security-skill` | skills/vibe-security-skill | Audits "vibe-coded" (AI-generated) apps — Supabase RLS, payment flows, hardcoded secrets, auth. | None | AI coding agent | ⭐⭐ Nice-to-have |

## Locked selection (user, 2026-07-18)

The user has reviewed all candidates and made the following decisions. Phase 6 executes against this set.

**Rules applied:**
- **Category A (code audit/SAST):** include all non-duplicate, non-PHP skills. A1 wins over A2 (dedupe — A1 is the original DFYX dual-track skill, A2 is a near-identical EastSword mirror). A9 (symfony-security-auditor) excluded — no PHP.
- **Category B (supply chain):** **excluded entirely.** The repo already has `plugins/vulnerability-scanning/` (Trivy/Snyk/npm-audit/SBOM) covering this ground. Phase 6 will cross-reference that existing plugin instead of integrating B1/B2, and may recommend enhancements to it if gaps surface.
- **Category C (compliance):** C1 (the user's pick of the 6 near-duplicates).
- **Category D (web/API vuln testing):** D1, D2, D3, D4 (all included).
- **Category E (AI-app security):** E1, E2, E3, E4 (all included).
- **Category F (smart-contract/agent appsec):** F2 (slowmist agent-security-framework).
- **Category G:** G3 (vibe-security-skill) included; G1, G2 not selected.

## Final selection table

| # | Skill | Include? | Notes |
|---|---|---|---|
| A1 | dfyx-code-security-review | ✅ yes | Winner of A1/A2 dedupe (original DFYX dual-track SAST, 9 languages) |
| A2 | eastsword-dfyx-code-security-review | ❌ no | Deduped — near-identical mirror of A1 |
| A3 | cloudflare-security-audit-skill | ✅ yes | Parallel-agent vuln-discovery harness |
| A4 | agentic-security-scanner | ✅ yes | Broad appsec (SAST+SCA+secrets+IaC+LLM safety+supply chain) |
| A5 | agent-security-scanner-mcp | ✅ yes | MCP server: 1,700+ rules, package-hallucination, prompt-injection firewall |
| A6 | vulnhunter-security-scanner | ✅ yes | Attacker-first falsification-based scanner |
| A7 | skill-file-security | ✅ yes | 29-category checks for AI coding assistants, OWASP/CWE/ASVS L3 |
| A8 | esaa-security-audit | ✅ yes | Event-sourced audit, 95 checks, 16 domains |
| A9 | symfony-security-auditor | ❌ no | **No PHP** (user exclusion) |
| A10 | claude-code-cybersecurity-skill | ✅ yes | 15-file broad suite (some overlap; partial integration) |
| B1 | npm-security-best-practices | ❌ no | Excluded — repo's `vulnerability-scanning` plugin covers this |
| B2 | pypi-security-best-practices | ❌ no | Excluded — repo's `vulnerability-scanning` plugin covers this |
| C1 | awesome-claude-code-security-compliance-suite | ✅ yes | User pick (of 6 near-duplicates) |
| C2 | security-compliance-skills-suite-claude | ❌ no | Duplicate of C1 |
| C3 | sparkfinderoven-claude-security-compliance-suite | ❌ no | Duplicate of C1 |
| C4 | sparkfinderoven-r01-security-compliance-skills | ❌ no | Duplicate of C1 |
| C5 | sparkfinderoven-security-compliance-skills | ❌ no | Duplicate of C1 |
| C6 | sparkfinderoven-security-compliance-suite | ❌ no | Duplicate of C1 |
| D1 | websecurityacademy-solutions | ✅ yes | PortSwigger Academy lab walkthroughs (learning) |
| D2 | vibe-pentest-ai-security-testing | ✅ yes | Multi-agent automated web/API pentest |
| D3 | pentest-lyan-web-security-testing | ✅ yes | Autonomous web pentest with threat modeling |
| D4 | web-security-scanner-pro | ✅ yes | Python web scanner (49 modules, dual-use — document responsibly) |
| D5 | deepseek-pentest-ai-burp-extension | ❌ no | Hard paid deps (Burp Pro + DeepSeek API) |
| E1 | gandalf-llm-pentester | ✅ yes | LLM-app red-team (prompt-injection, guardrail eval) |
| E2 | ai-security-knowledge-base | ✅ yes | OWASP ML/LLM Top 10, MCP security reference |
| E3 | awesome-ai-security-reference | ✅ yes | Curated AI-security learning roadmap |
| E4 | awesome-ai-security-tools-guide | ✅ yes | Tool recommendations across 15+ AI-security categories |
| F1 | solana-security-standard | ❌ no | Not selected (Solana-specific; out of scope for general dev bundle) |
| F2 | slowmist-agent-security-framework | ✅ yes | Agent/repo/URL/MCP-server adversarial-safety review |
| G1 | iac-security-scan-skills | ❌ no | Not selected |
| G2 | foundry-security-spec | ❌ no | Not selected |
| G3 | vibe-security-skill | ✅ yes | Audits AI-generated ("vibe-coded") apps for common mistakes |

**Total included: 20 skills** (A1, A3, A4, A5, A6, A7, A8, A10, C1, D1, D2, D3, D4, E1, E2, E3, E4, F2, G3).

## Supply-chain coverage (handled differently)

The user explicitly excluded Category B because the repo already has `plugins/vulnerability-scanning/` covering dependency/SCA/SBOM territory. Phase 6 therefore:

1. **Does NOT create** a dependency-supply-chain reference doc from B1/B2.
2. **Cross-references** the existing `vulnerability-scanning` plugin from the new skill's `references/defensive-cross-refs.md` (already planned in phase 8).
3. **May recommend enhancements** to `vulnerability-scanning` if the porting work surfaces gaps (e.g. the existing plugin mentions Trivy/Snyk but might benefit from explicit `osv-scanner` / `pip-audit` / dependency-cooldown guidance from B2). Any such enhancement is a **separate follow-up PR**, not part of this skill — see phase 8's "no edits to existing plugins" guardrail.

## Things I will NOT do (this phase)

- ~~Will NOT integrate any Aradotso skill — this phase is selection only. Integration happens in phase 6.~~ (Selection is now locked; phase 6 is unblocked.)
- Will NOT include any excluded topic (malware/virus/supabase/openclaw/linux/hardware/firewall) even if a candidate above seems borderline.
- Will NOT include D5 (deepseek-pentest-ai-burp-extension) — hard paid deps (Burp Pro + DeepSeek API).
- Will NOT include A9 (symfony-security-auditor) — PHP is out of scope per user.
- Will NOT re-introduce Category B skills (B1, B2) — repo's `vulnerability-scanning` plugin covers this.
- Will NOT commit — file lands in working tree for review.
