# Phase 1 — Research baseline

> **Status:** ✅ Complete. Discovery was performed during plan authoring. This file is reference data every later phase cites — no new research needed.
>
> **Depends on:** nothing.

## Purpose

Consolidate everything discovered about (a) the 7 named skills, (b) the Aradotso/security-skills repo, and (c) this repo's conventions. Future phases link here instead of re-fetching.

---

## A. The 7 named skills — per-skill reports

### Skill 1: testing-for-business-logic-vulnerabilities

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-business-logic-vulnerabilities
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-Skills/main/skills/testing-for-business-logic-vulnerabilities/SKILL.md`
- **What it does:** Manual methodology for finding business-logic flaws (price manipulation, workflow bypass, privilege escalation, race conditions) that scanners miss. Centered on intercepting/modifying multi-step request flows with copy-paste `curl` commands.
- **Paid/proprietary tools:** **Burp Suite Professional** (request interception, sequence testing), **Burp Turbo Intruder** (race conditions), **Burp Sequencer** (token randomness), **Postman** (collection runners).
- **OSS tools already referenced:** OWASP ZAP (listed as alternative), Bash/curl (used throughout), browser DevTools, custom scripts.
- **Methodology (6 steps):** (1) Map business workflows; (2) Test price/quantity manipulation; (3) Test workflow step bypass; (4) Test race conditions; (5) Test referral/reward abuse; (6) Test role/permission logic.
- **References:** OWASP A04:2021; MITRE ATT&CK T1190, T1059.007, T1505.003, T1083, T1068; NIST CSF PR.PS-01, ID.RA-01, PR.DS-10, DE.CM-01.
- **Notable:** Standardized vuln-finding output template (CVSS, OWASP category, business-rules-violated table). All test cases are executable curl one-liners — trivially portable to an OSS proxy.
- **Verbatim paid-tool excerpts:**
  - Prereqs: "**Burp Suite Professional**: For intercepting and modifying multi-step request flows"
  - Step 4: "# Using Burp Turbo Intruder for precise timing: / 1. Send request to Turbo Intruder / 2. Use race condition script template / 3. Send 20+ requests simultaneously"
  - Tools table: "**Burp Turbo Intruder** | High-speed request sending for race condition testing", "**Burp Sequencer** | Token randomness analysis", "**Postman** | Workflow testing with collection runners"

### Skill 2: testing-for-xss-vulnerabilities-with-burpsuite

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-xss-vulnerabilities-with-burpsuite
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-Skills/main/skills/testing-for-xss-vulnerabilities-with-burpsuite/SKILL.md`
- **What it does:** 7-step workflow for reflected/stored/DOM XSS built explicitly around Burp's Scanner, Repeater, Intruder, embedded Chromium, DOM Invader, and BApp Store plugins. **The most Burp-embedded skill in the set.**
- **Paid/proprietary tools:** **Burp Suite Professional** (with active scanner), **Burp Scanner**, **Burp Repeater**, **Burp Intruder**, **Burp's embedded Chromium browser**, **DOM Invader** (Burp browser extension), **Hackvertor** (BApp Store plugin), **XSS Hunter** (now commercial SaaS by TrustedSec).
- **OSS tools already referenced:** Dalfox (`go install github.com/hahwul/dalfox/v2@latest`), Google CSP Evaluator, FoxyProxy. OWASP ZAP **not** mentioned as alternative here (unlike other skills).
- **Methodology (7 steps):** (1) Configure Burp + map app; (2) Identify reflection points with Repeater; (3) Test reflected XSS with context-specific payloads; (4) Test stored XSS via Intruder; (5) Test DOM XSS using DOM Invader; (6) Bypass filters + CSP (Hackvertor); (7) Validate + document.
- **References:** OWASP A03:2021; MITRE ATT&CK T1190, T1059.007, T1505.003, T1083.
- **Notable:** Inline XSS payload lists, DOM source/sink taxonomy, CSP-bypass cheat sheet, full PoC payloads (cookie-steal, keylogger, screenshot exfil).
- **Verbatim paid-tool excerpts:**
  - Prereqs: "**Burp Suite Professional**: Licensed version with active scanner capabilities"
  - Step 5: "# Enable DOM Invader in Burp's embedded browser / 1. Open Burp's embedded Chromium browser / 2. Click DOM Invader extension icon > Enable"
  - Step 6: "# Use Burp Suite > BApp Store > Install \"Hackvertor\""
  - Tools table: "**DOM Invader** | Burp's built-in browser extension for DOM XSS testing", "**XSS Hunter** | Blind XSS detection platform that captures execution evidence"

### Skill 3: testing-for-host-header-injection

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-host-header-injection
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-Skills/main/skills/testing-for-host-header-injection/SKILL.md`
- **What it does:** Tests HTTP Host header injection leading to password-reset poisoning, web cache poisoning, SSRF, and vhost routing bypass. Almost every command is a plain curl invocation — **highly portable to OSS**.
- **Paid/proprietary tools:** **Burp Suite**, **Burp Collaborator** (OOB detection for SSRF), **param-miner** (Burp extension for unkeyed headers).
- **OSS tools already referenced:** ffuf (vhost brute), gobuster vhost, Nuclei, **interact.sh** (already named as Collaborator alternative), curl.
- **Methodology (6 steps):** (1) Basic Host header injection; (2) Password reset poisoning; (3) Web cache poisoning via Host; (4) SSRF via Host (incl. cloud metadata 169.254.169.254); (5) Virtual host enumeration; (6) Connection-state attacks (HTTP request smuggling).
- **References:** MITRE ATT&CK T1190, T1059.007, T1505.003, T1083, T1055. Legal-notice disclaimer included.
- **Verbatim paid-tool excerpts:**
  - Prereqs: "Burp Suite for intercepting and modifying Host headers", "Burp Collaborator or interact.sh for out-of-band detection"
  - Tools table: "**Burp Collaborator** | Out-of-band detection for Host header SSRF", "**param-miner** | Burp extension for discovering unkeyed Host-related headers"

### Skill 4: bypassing-authentication-with-forced-browsing

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/bypassing-authentication-with-forced-browsing
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-Skills/main/skills/bypassing-authentication-with-forced-browsing/SKILL.md`
- **What it does:** Discovers unprotected pages/APIs/admin interfaces via directory/forced browsing, then validates whether auth is enforced. **The most OSS-native skill in the set.**
- **Paid/proprietary tools:** **Burp Suite** (optional, request analysis only; also Step 3 "Test with Burp Intruder").
- **OSS tools already referenced (the core):** **ffuf**, **Gobuster**, **Feroxbuster**, **DirBuster**, **SecLists**, curl.
- **Methodology (6 steps):** (1) Enumerate hidden dirs/files; (2) Discover admin/debug interfaces; (3) Test auth enforcement; (4) Test HTTP method-based auth bypass; (5) Test path traversal + URL normalization bypass; (6) Discover backup/config files.
- **References:** OWASP A01:2021; MITRE ATT&CK T1190, T1083, T1087.
- **Notable:** Every command is a real ffuf/gobuster/curl invocation with rate/thread flags and JSON output. Full sensitive-file checklist.
- **Verbatim paid-tool excerpts:**
  - Prereqs: "**Burp Suite**: For intercepting and analyzing requests and responses"
  - Step 3: "# Test with Burp Intruder: send a list of discovered URLs / without cookies and flag any 200 responses"

### Skill 5: cybersecurity-analyst (rysweet/amplihack)

- **Source:** https://www.skills.sh/rysweet/amplihack/cybersecurity-analyst
- **Raw:** `https://raw.githubusercontent.com/rysweet/amplihack/main/.claude/skills/cybersecurity-analyst/SKILL.md`
- **What it does:** ~8,500-word **analytical reasoning framework** (NOT a tool-execution skill). Teaches an LLM to analyze events "through the lens of cybersecurity" using CIA triad, defense-in-depth, zero-trust, STRIDE/PASTA/VAST threat modeling, MITRE ATT&CK, CVSS/FAIR risk, and NIST IR lifecycle.
- **Paid/proprietary tools:** All in a "Security Tools and Platforms" reference inventory near the bottom:
  - **Vuln scanning:** Nessus, Qualys, Rapid7 InsightVM
  - **SAST:** SonarQube, Checkmarx, Veracode
  - **DAST:** Burp Suite, Acunetix
  - **SIEM:** Splunk, Elastic, Microsoft Sentinel, Google Chronicle
  - **EDR:** CrowdStrike, SentinelOne, Microsoft Defender for Endpoint
  - **CSPM:** Prisma Cloud, Wiz, Orca Security
  - **Threat intel:** Recorded Future, Mandiant, CrowdStrike
  - **AWS commercial services** (cloud-migration example): GuardDuty, WAF, Security Hub, Config, CloudTrail, Artifact, KMS
  - **Microsoft SDL** (named as a framework)
  - **VulnDB**
- **OSS tools already referenced:** OWASP Top 10, Testing Guide, Cheat Sheets, SAMM, OWASP ZAP, MITRE ATT&CK/Navigator/CAPEC, CVE Program, NIST CSF/NVD/SP 800-53/61/207/40, CISA KEV, CIS Controls, Sigma, AlienVault OTX, MISP, Exploit-DB.
- **Methodology (11 steps):** (1) Define scope/context; (2) Identify assets/data; (3) Analyze attack surface; (4) Threat modeling (STRIDE/PASTA/VAST → ATT&CK mapping); (5) Identify vulnerabilities; (6) Assess existing controls; (7) Analyze risk (CVSS/FAIR); (8) Evaluate detection/response (MTTD/MTTR); (9) Develop remediation; (10) Consider compliance; (11) Synthesize + report.
- **Notable:** Three full worked examples (ransomware IR, web-app pre-launch review, AWS cloud-migration review). Common-pitfalls section, verification checklist, success criteria. Sibling files exist: `QUICK_REFERENCE.md`, `README.md`, `tests/quiz.md`.
- **Verbatim paid-tool excerpts (densest paid-tool block in any skill):**
  - "Security Tools and Platforms" (lines 1562-1568):
    > "**Vulnerability Scanning**: Nessus, Qualys, Rapid7 InsightVM
    > **SAST**: SonarQube, Checkmarx, Veracode
    > **DAST**: Burp Suite, OWASP ZAP, Acunetix
    > **SIEM**: Splunk, Elastic, Sentinel, Chronicle
    > **EDR**: CrowdStrike, SentinelOne, Microsoft Defender for Endpoint
    > **CSPM**: Prisma Cloud, Wiz, Orca Security"

### Skill 6: security-detections-mcp (Aradotso)

- **Source:** https://www.skills.sh/aradotso/security-skills/security-detections-mcp
- **Raw:** `https://raw.githubusercontent.com/Aradotso/security-skills/main/skills/security-detections-mcp/SKILL.md`
- **What it does:** A **standalone MCP (Model Context Protocol) server** — not just a prompt skill — indexing 8,200+ detection rules from six SIEM/platform formats. Exposes 81 local MCP tools (~25 hosted) for searching, MITRE ATT&CK filtering, coverage/gap analysis, ATT&CK-Navigator layer generation, and an autonomous CTI→detection→draft-PR pipeline. Authored by Michael Haag (MHaggis); skill wrapper by ara.so.
- **Paid/proprietary dependencies (the data sources queried):**
  - **Splunk ESCU** (Splunk Enterprise Security; ESCU content repo is open)
  - **CrowdStrike Query Language (CQL)** (Falcon is commercial; skill clones `ByteRay-Labs/Query-Hub`)
  - **Sublime Security** (commercial SaaS; content repo is open)
  - **KQL / Microsoft Sentinel** (commercial platform; hunting-query repos are community/OSS)
  - **Elastic** (paid tier; rules repo is open)
  - **detect.michaelhaag.org hosted MCP** — free tier (200 calls/day, read-only) but proprietary hosted service requiring `sdmcp_` API token
- **OSS tools already referenced:** **Sigma** rules (SigmaHQ/sigma), **MITRE ATT&CK** STIX bundle, **Node.js 18+/npx** runtime, **mcp-remote**. All detection-source repos cloned via git sparse-checkout.
- **Methodology (use-case patterns):** Detection search & retrieval → MITRE ATT&CK filtering → coverage analysis → ATT&CK Navigator layer generation → worked patterns (ransomware readiness, APT emulation, gap analysis, cross-platform comparison) → autonomous detection pipeline → SIEM export (sigma/splunk/elastic/kql).
- **Notable:** Real MCP server (`npx -y security-detections-mcp`) — 81 tools local / ~25 hosted. 11 named expert prompts. ATT&CK Navigator JSON layer export. Multi-client config blocks (Claude Desktop, Cursor, VS Code).
- **Verbatim paid-tool excerpts:**
  - Description frontmatter: "Query unified Sigma, **Splunk**, **Elastic**, **KQL**, **Sublime**, and **CrowdStrike** security detection rules via MCP server with MITRE ATT&CK mapping"
  - Hosted install: "**API token** from detect.michaelhaag.org/account/tokens", "**Free tier**: 200 calls/day, read-only tools"

### Skill 7: testing-for-open-redirect-vulnerabilities

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-open-redirect-vulnerabilities
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-skills/main/skills/testing-for-open-redirect-vulnerabilities/SKILL.md`
- **What it does:** Identifies/tests open-redirect vulnerabilities by enumerating redirect parameters, applying bypass techniques, chaining with OAuth/phishing/XSS, and automating with OSS scanners. **Almost entirely curl/OSS-driven.**
- **Paid/proprietary tools:** **Burp Suite** (one of several options), **Burp Collaborator** (for redirect confirmation).
- **OSS tools already referenced (dominant):** **OpenRedireX**, **gf** (tomnomnom/gf), **nuclei** (with `http/vulnerabilities/generic/open-redirect.yaml`), **ffuf**, **OWASP ZAP** (explicit alternative), curl.
- **Methodology (6 steps):** (1) Identify redirect parameters; (2) Test basic payloads; (3) Apply validation-bypass techniques; (4) Test path-based redirects; (5) Chain with other vulns (OAuth/phishing/XSS); (6) Automate with OSS scanners.
- **References:** MITRE ATT&CK T1190, T1059.007, T1505.003, T1083, T1566. Legal-notice disclaimer.

---

## B. Consolidated portability table (hardest → easiest)

| # | Skill | Primary paid tool(s) | Already-OSS tools | Methodology portable to OSS? |
|---|---|---|---|---|
| 2 | XSS w/ Burpsuite | Burp Pro + Scanner/Repeater/Intruder + DOM Invader + Hackvertor + XSS Hunter | Dalfox, Google CSP Evaluator, FoxyProxy | **Partial** — DOM Invader's client-side taint tracking has no clean OSS equivalent |
| 6 | security-detections-mcp | Splunk/CrowdStrike/Sublime/KQL formats + detect.michaelhaag.org hosted API | Sigma, MITRE ATT&CK STIX, Node/npx, mcp-remote | **Partial** — MCP + Sigma are OSS; commercial SIEM dialects are the value prop |
| 1 | Business logic | Burp Pro + Turbo Intruder + Sequencer + Postman | OWASP ZAP, curl, DevTools | **Yes** — all examples are curl one-liners |
| 3 | Host header injection | Burp + Collaborator + param-miner | **interact.sh** (already named), ffuf, gobuster vhost, Nuclei, curl | **Yes** — nearly 100% curl-driven |
| 7 | Open redirect | Burp + Collaborator | OpenRedireX, gf, nuclei, ffuf, OWASP ZAP | **Yes** — Burp is one of several options |
| 4 | Forced browsing | Burp (optional) | **ffuf, Gobuster, Feroxbuster, DirBuster, SecLists, curl** | **Yes** — Burp is incidental; most portable skill |
| 5 | cybersecurity-analyst | Nessus, Qualys, Rapid7, SonarQube, Checkmarx, Veracode, Burp, Acunetix, Splunk, Elastic, Sentinel, Chronicle, CrowdStrike, SentinelOne, Defender, Prisma Cloud, Wiz, Orca, Recorded Future, Mandiant, AWS GuardDuty/Security Hub/WAF/Config/Artifact/KMS, Microsoft SDL, VulnDB | OWASP Top 10/Testing Guide/Cheat Sheets/SAMM/ZAP, MITRE ATT&CK/Navigator/CAPEC, Sigma, NIST CSF/SP 800-series, CISA KEV, CIS Controls, CVE, Exploit-DB, MISP, OTX | **Yes (methodology only)** — pure reasoning framework; paid tools are a reference inventory at the bottom |

### Recurring paid-tool replacements needed across the set

| Paid tool | OSS replacement(s) |
|---|---|
| **Burp Suite Professional** | OWASP ZAP / mitmproxy / Caido (free tier) |
| **Burp Collaborator** (OOB detection) | **interact.sh** (already named in skill 3), or Beeceptor / Bucket-O-CYG |
| **Burp Intruder** | **ffuf** or ZAP Fuzzer |
| **Burp Repeater** | mitmproxy / ZAP Request tab |
| **Burp Scanner** (active crawl + injection) | OWASP ZAP active scan + Dalfox |
| **Burp Turbo Intruder** (race conditions) | concurrent curl background jobs (skill 1 already shows this), `httpracer`, or `race-the-web` |
| **Burp Sequencer** (token randomness) | `ent` (OSS) or drop entirely (rarely load-bearing) |
| **DOM Invader** (client-side taint tracking) | **No direct OSS equivalent.** Manual source/sink analysis + browser DevTools + ZAP DOM XSS add-on (limited). Document the gap honestly. |
| **Hackvertor** (BApp payload encoding) | Manual encoding snippets (URLSearchParams, Python one-liners) |
| **param-miner** (Burp extension, unkeyed headers) | ffuf with header wordlists + custom wordlist |
| **XSS Hunter** (blind XSS) | Self-hosted BlindXSS fork (e.g. `frost0xf/dexa`) or skip |
| **Postman** | Hoppscotch (OSS, self-hostable) |
| **Nessus / Qualys / Rapid7 InsightVM** | OpenVAS / Vuls / Nuclei |
| **SonarQube / Checkmarx / Veracode** (SAST) | **Semgrep**, CodeQL, Bandit, Brakeman |
| **Splunk / Elastic paid / Sentinel / Chronicle** (SIEM) | Wazuh / Elastic OSS tier / OpenSearch |
| **CrowdStrike / SentinelOne / Defender for Endpoint** (EDR) | Wazuh (OSS EDR-ish) |
| **Prisma Cloud / Wiz / Orca** (CSPM) | kube-bench, checkov, tfsec |
| **Recorded Future / Mandiant** (threat intel) | **MISP**, AlienVault OTX, CISA KEV |
| **VulnDB** | CVE Program / NVD / OSV.dev |

---

## C. Aradotso/security-skills repo — inventory summary

- **Total skills inventoried:** 162 (in `skills/<name>/SKILL.md` layout, single file each).
- **Heavy duplication:** 6 near-identical compliance suites, 3 dfyx/eastsword code-review skills, 5 pentest-checklist duplicates, 6 linux-pentest command-reference variants, 5 Android pentest-env duplicates, 7 K7-Total-Security variants, ~63 malware/AV-crack warning + AV-ops variants.
- **Genuinely distinct dev-security candidates:** ~20 (categories A–F: code audit/SAST, supply-chain, compliance, web-vuln testing, LLM-app security, Solana appsec).
- **Exclusions applied per user spec:** malware (~63 AV-crack/AV-ops skills), virus, supabase (1 skill), openclaw (4 skills), linux (7 skills), hardware (3 skills), firewall (3 skills). Plus broad-offensive/mobile/SOC/OS-hardening/DRM/automotive/OSINT skills excluded as off-topic for a software-dev-focused bundle (~50 more).
- **Full per-skill report (162 entries):** see the discovery agent's output in plan history. Phase 2 distills this into the ~20 candidate shortlist.

---

## D. Repo conventions — `secondsky/claude-skills`

### Top-level structure

```
.agents/skills/                # Agent-side skills (sourced into .factory/skills via symlink)
.claude-plugin/marketplace.json    # MASTER manifest — marketplace registry
.factory/skills/               # Symlinks back to .agents/skills
.zcode/plans/                  # Session-scoped plans (auto-managed)
plugins/                       # 141 plugin directories — canonical skill store
schemas/                       # marketplace.schema.json, plugin.schema.json
scripts/                       # install-skill.sh, sync-plugins.sh
templates/                     # README-TEMPLATE.md, SKILL-TEMPLATE.md, skill-skeleton/
```

Marketplace version: **3.4.0** (2026-07-18).

### Plugin layout (canonical pattern)

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json           # REQUIRED
└── skills/
    └── <skill-name>/         # MUST match plugin name (auto-discovery)
        ├── SKILL.md          # YAML frontmatter + body
        ├── references/       # Extended docs (progressive disclosure)
        ├── templates/
        ├── assets/
        └── scripts/
```

### SKILL.md frontmatter style (verbatim from `plugins/api-security-hardening/`)

```yaml
---
name: api-security-hardening
description: REST API security hardening with authentication, rate limiting, input validation, security headers. Use for production APIs, security audits, defense-in-depth, or encountering vulnerabilities, injection attacks, CORS issues.
license: MIT
---
```

### Frontmatter rules (from `CLAUDE.md`)

- Required: `name`, `description`.
- Optional: `license`, `allowed-tools`, `metadata`.
- Standard dirs: `scripts/`, `references/`, `assets/`.
- Writing style: imperative/third-person.
- Description convention: `<what it does>. Use for <scenarios>, or encountering <error messages>.`

### Progressive disclosure (CLAUDE.md §4)

- Metadata (name + description): always in context, ~100 words.
- SKILL.md body: loaded when skill triggers, **keep under 5k words (~500 lines)**.
- `references/*.md`, `assets/*`, `scripts/*`: loaded on demand.

### marketplace.json shape (master manifest)

```json
{
  "name": "claude-skills",
  "owner": { "name": "Claude Skills Maintainers", "email": "maintainers@example.com", "url": "..." },
  "metadata": { "description": "...", "version": "3.4.0", "homepage": "..." },
  "plugins": [ ... ]
}
```

Per-plugin entry:
```json
{
  "name": "csrf-protection",
  "source": "./plugins/csrf-protection",
  "version": "3.4.0",
  "description": "...",
  "keywords": ["csrf-protection", "csrf", "protection", "security", ...],
  "category": "security"
}
```

Categories observed: `frontend` (26), `cloudflare` (21), `tooling` (24), `api` (16), `web` (10), `ai` (7), `auth` (4), `mobile` (5), **`security` (5)**, `testing` (4), `design` (4), `woocommerce` (4), `architecture` (3), `data` (2), `seo` (2), `cms` (2), `database` (1), `documentation` (1).

### Plan-file voice

Existing `.zcode/plans/plan-sess_<uuid>.md` files: terse, first-person, engineering-focused. Split into `### Part A — <topic>` / `### Part B` / `### Part C`, each with `**Step N:**` bullets. End with `### Things I will NOT do` guardrails section. No marketing voice.

### Existing cybersecurity / security content

**5 plugins with `category: "security"`** already in marketplace.json:

| Name | Focus |
|---|---|
| `csrf-protection` | CSRF tokens, double-submit cookies, SameSite |
| `defense-in-depth-validation` | Multi-layer input validation |
| `security-headers-configuration` | HTTP security headers, CSP, clickjacking |
| `vulnerability-scanning` | Trivy/Snyk/npm audit, CI/CD security gates, SCA/SBOM |
| `xss-prevention` | Input sanitization, output encoding, CSP |

**Coverage gaps the merged skill will fill:**
- No offensive-security / pentest content (no mentions of `burp`, `nmap`, `metasploit`, `penetration testing`, `red team`, `bug bounty`).
- No dedicated OWASP Top-10 skill.
- No `threat-modeling`, `secrets-management`, or `incident-response` skill.
- Supply-chain security is currently a cross-cutting concern woven into other skills, not a standalone skill.

### Closest existing analogs to study

- `plugins/vulnerability-scanning/` — cleanest single-file security skill.
- `plugins/api-security-hardening/` — cleanest skill-with-`references/` layout.

---

## E. Things I will NOT do (this phase)

- Will NOT re-fetch any source skill (discovery is complete; phase 5+ works from this baseline).
- Will NOT include any excluded topic (malware/virus/supabase/openclaw/linux/hardware/firewall) — these are documented above as excluded with rationale only.
- Will NOT commit this file to git — it lands in the working tree for review.
