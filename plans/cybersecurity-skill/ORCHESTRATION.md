# ORCHESTRATION — OSS-only `cybersecurity` skill

> Master plan. The 10 phased subplans in this directory execute against the decisions captured here.

## Vision

Fuse 7 paid-tool-dependent cybersecurity skills (sourced from skills.sh / GitHub) plus a curated set of Aradotso dev-security skills into **one big OSS-only `cybersecurity` plugin** with progressive disclosure. The merged skill fills a real gap: this repo currently has 5 *defensive* security plugins (csrf-protection, xss-prevention, vulnerability-scanning, security-headers-configuration, defense-in-depth-validation) and **zero offensive / threat-modeling / pentest / AI-appsec content**.

The result is a single entry-point skill (`cybersecurity`) that routes the agent to specialized reference docs loaded on demand — never paying a token cost for content the current task doesn't need.

## Why OSS-only

The source skills lean heavily on commercial products (Burp Suite Pro, Nessus, Splunk, CrowdStrike, SonarQube, Burp Collaborator, DOM Invader, Hackvertor, etc.). Every commercial dependency must be replaced with a viable OSS alternative (OWASP ZAP, mitmproxy, Dalfox, ffuf, Nuclei, Semgrep, OpenVAS, Wazuh, interact.sh, Sigma, etc.) and documented. Where OSS parity is imperfect (notably the XSS DOM Invader gap), the skill states the gap honestly and provides the best available fallback.

## Locked decisions

These four were resolved with the user during planning. They are **frozen** — any later change requires re-opening this doc.

| # | Decision | Choice | Implication |
|---|---|---|---|
| 1 | **Scope** | 7 named skills + Aradotso candidates the user hand-picks | Phase 2 lists ~20 curated Aradotso dev-security skills with one-line rationales. User marks which to include before phase 6 executes. |
| 2 | **Detections MCP** | Port the **local OSS** MCP server; keep the **hosted** `detect.michaelhaag.org` API as a documented optional path (neither dropped nor mandatory) | Local path: Node 18+, npx, git sparse-checkout of Sigma + 6 rule repos (~GB of data). Hosted path: `mcp-remote` + `sdmcp_` token, free 200 calls/day tier documented as an option for users who want zero setup. |
| 3 | **Authorization scope** | **Full offensive + disclaimer** | Skill permits live-target testing but requires the user to read + acknowledge an authorization disclaimer at entry. Static analysis, SAST, threat modeling, secure-design review, OSS tool setup, reference lookups, and detection-rule authoring are always-allowed (no gate). |
| 4 | **Defensive relation** | **Cross-reference** the 5 existing defensive plugins | Found XSS → "load `xss-prevention` for the fix". No duplication, no subsumption, no edits to the existing plugins. |
| 5 | **Execution model** | **Each reference doc runs as its own sub-agent on a high-tier reasoning model.** Main context stays a thin orchestrator. | SKILL.md is a router + dispatcher. On each reference lookup it hands the user's task + the reference doc to a **dedicated sub-agent** running on **`gpt-5.6 sol`** (preferred — pinned) / `claude-opus-4.x max` / `opus 5 max` (highest reasoning tier available) — never inlined in the main context. **Exception:** the authorization gate (phase 4) stays in the main context for safety (it's a 30-line decision, not deep work). Keeps the orchestrator lean (~500 lines) while deep methodology runs in isolated high-context sub-agents. See phase 3 §"Execution model" and phase 5/6/7/8 (each reference doc becomes a sub-agent briefing). |

## Target architecture

The plugin follows the repo's existing `plugins/csrf-protection/` and `plugins/api-security-hardening/` conventions:

```
plugins/cybersecurity/
├── .claude-plugin/
│   └── plugin.json                       # name, description, version 3.4.0, MIT license, keywords
└── skills/
    └── cybersecurity/
        ├── SKILL.md                       # Entrypoint: authorization gate + routing (under ~500 lines)
        ├── references/
        │   ├── authorization-disclaimer.md     # The gate content (loaded on live-target tasks)
        │   ├── analyst-reasoning.md            # From amplihack cybersecurity-analyst — 11-step framework, OSS-only tool refs
        │   ├── testing-business-logic.md       # OSS-ported mukul975
        │   ├── testing-xss.md                  # OSS-ported mukul975 (DOM-Invader gap acknowledged)
        │   ├── testing-host-header.md          # OSS-ported mukul975
        │   ├── testing-open-redirect.md        # OSS-ported mukul975
        │   ├── testing-forced-browsing.md      # OSS-ported mukul975
        │   ├── detections-mcp.md               # Aradotso MCP: local OSS setup + hosted optional
        │   ├── oss-tool-map.md                 # Burp/Collaborator/Nessus → OSS equivalents (the swap table)
        │   ├── defensive-cross-refs.md         # Map findings → existing 5 plugins
        │   ├── aradotso-code-audit.md          # [phase 6] A1, A3, A4, A5, A6, A7, A8, A10
        │   ├── aradotso-agent-safety.md        # [phase 6] F2, G3
        │   ├── aradotso-compliance.md          # [phase 6] C1
        │   ├── aradotso-web-vuln-testing.md    # [phase 6] D1, D2, D3, D4
        │   └── aradotso-ai-security.md         # [phase 6] E1, E2, E3, E4
        └── scripts/                            # Only if a port needs a helper (e.g. race-condition curl driver)
```

### Progressive-disclosure contract

- **Metadata** (name + description) always in context, ~100 words.
- **SKILL.md body** loads when skill triggers; stays under 500 lines.
- Each **reference doc** is self-contained, loaded only when the entrypoint routes to it.
- Cross-references use skill names with explicit markers per `writing-skills` convention: `REQUIRED SUB-SKILL: <name>`, `SEE: references/<file>.md`. Never use `@` links (force-loads, burns context).

## Phase index

| Phase | Purpose | Depends on | Produces | Status |
|---|---|---|---|---|
| [1 — research-baseline](phase-1-research-baseline.md) | Consolidate discovery: per-skill reports for the 7 named skills, paid→OSS portability table, Aradotso inventory, repo conventions. | — | Reference data every later phase cites | ✅ Done (data already gathered) |
| [2 — aradotso-selection](phase-2-aradotso-selection.md) | Curate ~20 Aradotso dev-security candidates with rationales; user fills in selection table. | 1 | Confirmed list of Aradotso skills to integrate | ✅ Locked (20 skills; see phase 2) |
| [3 — skill-architecture](phase-3-skill-architecture.md) | Define plugin structure, progressive-disclosure contract, SKILL.md entrypoint routing design. | 1 | Final directory tree + routing logic | 📋 Ready to execute |
| [4 — authorization-gate](phase-4-authorization-gate.md) | Implement the full-offensive + disclaimer gate (always-allowed track vs gated live-target track). | 3 | `references/authorization-disclaimer.md` + SKILL.md gate section | 📋 Ready to execute |
| [5 — adapt-seven-skills](phase-5-adapt-seven-skills.md) | Per-skill OSS porting subplans for all 7 named skills (hardest → easiest). | 3 | 6 reference docs (detections-mcp splits off to phase 7) | 📋 Ready to execute |
| [6 — integrate-aradotso](phase-6-integrate-aradotso.md) | Apply the integration template to each skill the user selected in phase 2 (20 skills across 5 reference docs; Category B excluded — covered by existing `vulnerability-scanning`). | 2, 3 | 5 grouped reference docs (`aradotso-code-audit.md`, `aradotso-agent-safety.md`, `aradotso-compliance.md`, `aradotso-web-vuln-testing.md`, `aradotso-ai-security.md`) | 📋 Ready to execute |
| [7 — detections-mcp](phase-7-detections-mcp.md) | Port the local OSS MCP server; document the hosted API as optional. | 3 | `references/detections-mcp.md` | 📋 Ready to execute |
| [8 — defensive-cross-refs](phase-8-defensive-cross-refs.md) | Wire up cross-references to the 5 existing defensive plugins. | 3 | `references/defensive-cross-refs.md` | 📋 Ready to execute |
| [9 — testing](phase-9-testing.md) | Apply `writing-skills` TDD-for-skills: baseline RED scenarios, GREEN verification, REFACTOR loopholes. | 4, 5, 6, 7, 8 | Test-prompt set + verification report | 📋 Execute last, after content exists |
| [10 — marketplace-registration](phase-10-marketplace-registration.md) | Create `plugin.json`, add to `marketplace.json`, bump version, update README/MARKETPLACE/CHANGELOG. | 3–9 | Shippable plugin entry | 📋 Execute after testing passes |

### Dependency graph

```
1 ─┬─► 2 ──────────────────────────┐
   ├─► 3 ─┬─► 4 ──────────────┐    │
   │       ├─► 5 ──────────┐  │    │
   │       ├─► 7 ──────┐   │  │    │
   │       └─► 8 ──┐   │   │  │    │
   │               │   │   │  │    │
   └───────────────┴───┴───┴──┴────┴─► 6 ─┐
                                           │
                                           ▼
                                           9
                                           │
                                           ▼
                                          10
```

Phases 4, 5, 6, 7, 8 are independent of each other (all depend on 3) and can be executed in parallel by separate agents. Phase 9 depends on all content phases. Phase 10 is the ship step.

## What gets adapted from each of the 7 named skills

| # | Skill | Becomes reference doc | Porting difficulty |
|---|---|---|---|
| 1 | testing-for-business-logic-vulnerabilities | `references/testing-business-logic.md` | Easy (curl-first; swap Turbo Intruder → concurrent curl / httpracer; Sequencer → ent or drop; Postman → Hoppscotch) |
| 2 | testing-for-xss-vulnerabilities-with-burpsuite | `references/testing-xss.md` | **Hardest** (Burp is the workflow). Scanner→ZAP+Dalfox; Repeater→ZAP Request; Intruder→ffuf/ZAP Fuzzer; DOM Invader→**acknowledged gap**, manual source/sink analysis; Hackvertor→manual encoding; XSS Hunter→self-hosted BlindXSS fork or skip |
| 3 | testing-for-host-header-injection | `references/testing-host-header.md` | Easy (skill already names interact.sh as the Collaborator substitute; param-miner→ffuf header wordlists) |
| 4 | bypassing-authentication-with-forced-browsing | `references/testing-forced-browsing.md` | **Easiest** (Burp already optional; replace Burp Intruder step with `ffuf -mc 200` pattern; rest is ffuf/Gobuster/SecLists) |
| 5 | testing-for-open-redirect-vulnerabilities | `references/testing-open-redirect.md` | Easy (Collaborator→interact.sh; crawl→ZAP spider; rest is OpenRedireX/gf/nuclei/ffuf) |
| 6 | cybersecurity-analyst (rysweet/amplihack) | `references/analyst-reasoning.md` | **Zero tool swaps in methodology** — pure reasoning framework. Only the "Security Tools and Platforms" inventory at the bottom is swapped for OSS equivalents. |
| 7 | security-detections-mcp (Aradotso) | `references/detections-mcp.md` (phase 7) | Moderate — local OSS MCP server + Sigma rules port cleanly; commercial SIEM dialects become optional input formats; hosted API documented as opt-in |

See [phase-5-adapt-seven-skills.md](phase-5-adapt-seven-skills.md) for the per-skill detail.

## Things I will NOT do (guardrails)

These guardrails apply to **this plan-writing pass** AND are inherited by every execution phase.

- **Will NOT execute the cybersecurity skill implementation in this pass.** This directory contains plan documents only.
- **Will NOT modify the 5 existing defensive security plugins.** Cross-reference only — no edits to csrf-protection, xss-prevention, vulnerability-scanning, security-headers-configuration, or defense-in-depth-validation.
- **Will NOT touch `.claude-plugin/marketplace.json`, `package.json`, or bump versions in this pass.** Phase 10 documents the steps; execution happens later.
- **Will NOT clone external repos, install MCP servers, or run any security tooling.** All commands shown in reference docs are documentation of what the user would do, not what the agent does at authoring time.
- **Will NOT include any of the user's excluded topics**: malware, virus, supabase, openclaw, linux, hardware, firewall. (The Aradotso inventory in phase 1 documents these as excluded with rationale; none appear in the merged skill.)
- **Will NOT keep any paid-tool dependency as a hard requirement.** Burp/Nessus/Splunk/CrowdStrike/SonarQube/DOM Invader/Hackvertor/etc. become "optional, if you already have it" notes — never the primary path.
- **Will NOT commit or push.** Files land in the working tree only; the user reviews and commits when ready.

## Style note

Plan docs in this directory match the existing `.zcode/plans/` voice: terse, first-person, engineering-focused, ending with a "Things I will NOT do" guardrails section. They do **not** match the README's marketing voice.

## Source skills (canonical references)

| Skill | Source |
|---|---|
| testing-for-business-logic-vulnerabilities | https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-business-logic-vulnerabilities |
| testing-for-xss-vulnerabilities-with-burpsuite | https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-xss-vulnerabilities-with-burpsuite |
| testing-for-host-header-injection | https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-host-header-injection |
| bypassing-authentication-with-forced-browsing | https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/bypassing-authentication-with-forced-browsing |
| cybersecurity-analyst | https://www.skills.sh/rysweet/amplihack/cybersecurity-analyst |
| security-detections-mcp | https://www.skills.sh/aradotso/security-skills/security-detections-mcp |
| testing-for-open-redirect-vulnerabilities | https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-open-redirect-vulnerabilities |
| Aradotso repo (full inventory) | https://github.com/Aradotso/security-skills/tree/main/skills |
