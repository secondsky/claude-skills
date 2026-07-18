# Phase 6 — Integrate Aradotso skills

> **Status:** 📋 Ready to execute. Phase 2 selection is locked.
>
> **Depends on:** [phase-2-aradotso-selection.md](phase-2-aradotso-selection.md) (locked), [phase-3-skill-architecture.md](phase-3-skill-architecture.md).

## Purpose

For each of the **20 Aradotso skills** the user selected in phase 2, apply the integration template below. Produces grouped reference docs (one per category) rather than 20 separate files. Category B (supply chain) is **not integrated** — the repo's existing `vulnerability-scanning` plugin covers it (cross-referenced in phase 8 instead).

## Integration template (apply per chosen skill)

For each chosen Aradotso skill, capture:

```
### <aradotso-slug>
- **Source:** https://github.com/Aradotso/security-skills/tree/main/skills/<slug>
- **Upstream project:** <the OSS project the skill wraps, if any>
- **What it adds to the bundle:** <one paragraph — what new capability>
- **Paid/proprietary dependencies:** <audit — most are pure-methodology, none>
- **OSS dependencies:** <Node/npm, Python, framework, etc.>
- **Integration approach:** <see options below>
- **Attribution:** Aradotso wrapper by ara.so; upstream project under <license>
```

## Integration approaches (pick one per skill)

| Approach | When to use | Output |
|---|---|---|
| **Standalone reference doc** | Skill adds a distinct capability not covered elsewhere | `references/aradotso-<slug>.md` |
| **Folded section** | Skill is closely related to another reference (e.g. npm + pypi) | A `## <slug>` section in an existing or new combined reference |
| **Cross-reference only** | Skill overlaps heavily with a phase-5 reference; just point to it | One `SEE:` line in the relevant grouped reference doc |

### Suggested grouping (locked from phase 2 selection)

20 skills, grouped into 6 reference docs. Grouping is by capability cluster; each doc has one `## <slug>` section per skill.

| Group | Skills included | Output file |
|---|---|---|
| **Code audit / SAST** | A1 (dfyx-code-security-review), A3 (cloudflare-security-audit-skill), A4 (agentic-security-scanner), A5 (agent-security-scanner-mcp), A6 (vulnhunter-security-scanner), A7 (skill-file-security), A8 (esaa-security-audit), A10 (claude-code-cybersecurity-skill — partial: appsec sections only) | `references/aradotso-code-audit.md` (one section each) |
| **Agent / "vibe-coded" app safety** | F2 (slowmist-agent-security-framework), G3 (vibe-security-skill) | `references/aradotso-agent-safety.md` (agent safety + vibe-coded app audit combined) |
| **Compliance suite** | C1 (awesome-claude-code-security-compliance-suite) | `references/aradotso-compliance.md` |
| **Web / API vuln testing & learning** | D1 (websecurityacademy-solutions), D2 (vibe-pentest-ai-security-testing), D3 (pentest-lyan-web-security-testing), D4 (web-security-scanner-pro) | `references/aradotso-web-vuln-testing.md` (learning + 3 testing tools) |
| **AI-app security** | E1 (gandalf-llm-pentester), E2 (ai-security-knowledge-base), E3 (awesome-ai-security-reference), E4 (awesome-ai-security-tools-guide) | `references/aradotso-ai-security.md` (red-team + 3 reference/roadmap docs) |

**Not integrated (Category B):** B1 (npm-security-best-practices), B2 (pypi-security-best-practices). The repo's existing `plugins/vulnerability-scanning/` covers dependency/SCA/SBOM. Phase 8 cross-references it from `references/defensive-cross-refs.md`. If porting surfaces gaps (e.g. explicit `osv-scanner`, `pip-audit`, dependency-cooldown guidance), document them as a **separate follow-up enhancement** to `vulnerability-scanning` — out of scope for this skill per phase 8's "no edits to existing plugins" guardrail.

**Not integrated (other):** A2 (deduped to A1), A9 (no PHP), C2–C6 (deduped to C1), D5 (paid deps), F1 (Solana-specific), G1, G2 (not selected).

## Licensing and attribution

The Aradotso/security-skills repo is a **wrapper collection** — each skill's `SKILL.md` wraps and curates an upstream open-source project. When integrating:

1. **Preserve attribution.** Note "Aradotso wrapper by ara.so — Security Skills collection" in each integrated reference doc.
2. **Link the upstream.** Each Aradotso skill's frontmatter or body names the upstream project (GitHub repo). Carry that link forward so users can find the original.
3. **Respect upstream license.** Most upstream projects are MIT/Apache-2.0. Verify per skill during integration; if any upstream is GPL or more restrictive, surface it in the integration notes for the user to decide.
4. **Note the wrapper's value-add.** Aradotso's contribution is the agent-facing SKILL.md wrapper (triggers, workflow, prompts), not the underlying tool. Acknowledge both.

## Paid-dependency audit (per candidate)

Most Aradotso dev-security candidates are pure-methodology skills with no paid deps. Exceptions to watch:

| Skill | Paid deps | Action |
|---|---|---|
| `agent-security-scanner-mcp` (A5) | "ProofLayer" branded lightweight edition (full version is OSS npm) | Document both; default to the OSS full version |
| `deepseek-pentest-ai-burp-extension` (D5) | **Burp Pro + DeepSeek API (both paid)** | Default-skip per phase 2; user must explicitly opt in |
| `awesome-ai-security-tools-guide` (E4) | Some recommended tools are commercial | Legend already marks them; preserve the legend |
| `goplus-security-token-scanner` (G-group, if selected) | GoPlus API freemium | Document free tier limits |

## Integration checklist (when phase 6 executes)

For each chosen skill:

- [ ] Read the Aradotso `SKILL.md` and the upstream project README.
- [ ] Apply the integration template above.
- [ ] Pick the integration approach (standalone / folded / cross-ref only).
- [ ] Write the reference doc (or section) in repo voice (imperative, third-person).
- [ ] **Format each grouped reference doc as a sub-agent briefing** (decision #5): add `## Sub-agent mission`, `## Inputs`, `## Tools`, `## Methodology` (the body), and `## Sub-agent return contract` per phase 3 §"Execution model". Each of the 5 grouped docs (`aradotso-code-audit.md`, `aradotso-agent-safety.md`, `aradotso-compliance.md`, `aradotso-web-vuln-testing.md`, `aradotso-ai-security.md`) is a dispatchable unit — the orchestrator dispatches one sub-agent per grouped doc, not per individual Aradotso skill.
- [ ] Add a routing-table entry to `SKILL.md` per grouped doc.
- [ ] Verify no duplication with phase-5 references (cross-ref instead of duplicating).
- [ ] Verify no paid-tool hard-requirement sneaks in (per ORCHESTRATION guardrail).
- [ ] Note attribution + upstream license.

## What each selected candidate adds (one-liners, for the integrator)

| Skill | Adds |
|---|---|
| A1 dfyx-code-security-review | Dual-track white-box SAST (sink/control/config-driven), OWASP Top 10, 9 languages |
| A3 cloudflare-security-audit-skill | Parallel-agent vuln-discovery harness (recon → hunt → adversarial validate → report) |
| A4 agentic-security-scanner | Broad appsec: SAST + SCA + secrets + IaC + LLM safety + supply chain, ASVS-aligned |
| A5 agent-security-scanner-mcp | MCP server: 1,700+ rules, package-hallucination detection, prompt-injection firewall |
| A6 vulnhunter-security-scanner | Attacker-first falsification-based scanner, minimizes false positives |
| A7 skill-file-security | 29-category checks for AI coding assistants, OWASP/CWE/ASVS L3 |
| A8 esaa-security-audit | Event-sourced audit, 95 checks, 16 domains, immutable event log |
| A10 claude-code-cybersecurity-skill | 15-file broad suite — integrate appsec-relevant sections only (skip RE/threat-hunting/CSOC) |
| C1 awesome-claude-code-security-compliance-suite | 10 commands + 5 workflows: OWASP, CVE, GDPR/SOC2/ISO27001, threat modeling, IR |
| D1 websecurityacademy-solutions | PortSwigger Web Security Academy lab walkthroughs (learning) |
| D2 vibe-pentest-ai-security-testing | Multi-agent automated pentest for web apps/APIs/admin panels incl. business-logic |
| D3 pentest-lyan-web-security-testing | Autonomous web pentest with threat modeling, JS analysis, multi-role verification |
| D4 web-security-scanner-pro | Python web scanner (49 modules, evasion, CVE DB, WAF bypass) — document dual-use responsibly |
| E1 gandalf-llm-pentester | LLM-app red-team: prompt-injection validation, guardrail eval |
| E2 ai-security-knowledge-base | OWASP ML/LLM Top 10, MCP security, adversarial ML reference |
| E3 awesome-ai-security-reference | Curated AI-security learning roadmap |
| E4 awesome-ai-security-tools-guide | Tool recommendations across 15+ AI-security categories |
| F2 slowmist-agent-security-framework | Agent/repo/URL/MCP-server adversarial-safety review |
| G3 vibe-security-skill | Audits AI-generated ("vibe-coded") apps for common mistakes (RLS, payment flows, secrets) |

## Things I will NOT do (this phase)

- ~~Will NOT execute phase 6 until the user fills in phase 2's selection table.~~ (Phase 2 is locked; phase 6 is unblocked.)
- Will NOT integrate any skill with hard paid deps unless the user explicitly opts in (D5 stays skipped).
- Will NOT integrate any Category B skill (B1, B2) — repo's `vulnerability-scanning` plugin covers supply chain.
- Will NOT integrate A9 (PHP) — out of scope per user.
- Will NOT include any excluded topic (malware/virus/supabase/openclaw/linux/hardware/firewall).
- Will NOT duplicate phase-5 content — cross-reference instead.
- Will NOT strip attribution from Aradotso wrappers.
- Will NOT edit the existing `vulnerability-scanning` plugin — gap findings go to a separate follow-up.
- Will NOT commit — files land in working tree for review.
