# Phase 5 — Adapt the seven named skills

> **Status:** 📋 Ready to execute (after plan approval).
>
> **Depends on:** [phase-3-skill-architecture.md](phase-3-skill-architecture.md). (Phase 4's gate is referenced but not strictly required for content authoring.)

## Purpose

For each of the 7 named skills, port the methodology to **OSS-only** tooling and emit one `references/*.md` file. Order is hardest → easiest, so the hardest port (XSS) gets tackled while context is freshest.

Produces **6 reference docs** + the central `references/oss-tool-map.md` swap table. (Skill 7 — security-detections-mcp — splits off to phase 7.)

Each port follows the same per-skill structure:

```
### Skill N: <name>
- **Source:** skills.sh URL + raw GitHub URL
- **What it does:** 1-2 lines
- **Paid → OSS swap table:** specific replacement per paid tool
- **Porting notes:** what changes in methodology text, examples, tools table
- **Pitfalls / gaps:** where OSS parity is imperfect
- **Output:** references/<file>.md
```

---

## Skill 1: testing-for-business-logic-vulnerabilities

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-business-logic-vulnerabilities
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-Skills/main/skills/testing-for-business-logic-vulnerabilities/SKILL.md`
- **What it does:** Manual methodology for business-logic flaws (price manipulation, workflow bypass, race conditions, privilege escalation). Curl-driven.
- **Porting difficulty:** Easy.
- **Output:** `references/testing-business-logic.md`

### Paid → OSS swap table

| Paid | OSS replacement | Notes |
|---|---|---|
| Burp Suite Professional (intercept/modify multi-step flows) | **mitmproxy** (interactive) / **OWASP ZAP Request tab** | Both capture/replay sequences. mitmproxy scriptable in Python. |
| Burp Turbo Intruder (race conditions, 20+ simultaneous requests) | **concurrent curl background jobs** (skill already shows this pattern) / **httpracer** / **race-the-web** | Document the bash-loop pattern: `for i in {1..30}; do curl ... & done; wait`. |
| Burp Sequencer (token randomness) | **ent** (info-theory randomness on collected tokens) or **drop entirely** | Sequencer is rarely load-bearing; document `ent` as the option. |
| Postman (collection runners, env vars) | **Hoppscotch** (OSS, self-hostable) / **bruno** (OSS desktop collection runner) | Hoppscotch has a runner; bruno is git-friendly. |

### Porting notes

- All curl one-liners in the original **stay verbatim** — they're already OSS.
- Replace the "Send to Turbo Intruder" step 4 instructions with the bash-loop pattern.
- The standardized output template (CVSS, OWASP category, business-rules-violated) stays unchanged.
- Replace tools table with the OSS swap table above.

### Pitfalls / gaps

- Turbo Intruder's sub-millisecond timing (HTTP/2 single-packet race) is not perfectly reproducible with curl background jobs. Document this: for true single-packet races, the OSS options are `httpracer` (Go) or the Bash `&`+`wait` pattern (best-effort, not sub-ms).
- Sequencer's statistical live-analysis (compression, spectral) is richer than `ent`. Document `ent` as basic-coverage only.

---

## Skill 2: testing-for-xss-vulnerabilities-with-burpsuite (HARDEST)

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-xss-vulnerabilities-with-burpsuite
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-Skills/main/skills/testing-for-xss-vulnerabilities-with-burpsuite/SKILL.md`
- **What it does:** 7-step XSS workflow built explicitly around Burp's Scanner/Repeater/Intruder/Chromium/DOM Invader/Hackvertor.
- **Porting difficulty:** **Hardest** — Burp is the workflow, not an option.
- **Output:** `references/testing-xss.md`

### Paid → OSS swap table

| Paid | OSS replacement | Notes |
|---|---|---|
| Burp Scanner (active crawl + payload injection) | **OWASP ZAP active scan** + **Dalfox** (`go install github.com/hahwul/dalfox/v2@latest`) | ZAP for crawling+passive+active; Dalfox for high-volume payload injection. |
| Burp Repeater (single-request replay/tweak) | **OWASP ZAP Request tab** / **mitmproxy** with `mitmweb` | Both support manual replay with header/body editing. |
| Burp Intruder (payload lists + Grep-Match) | **ffuf** (`-w payloads.txt -mr "pattern"`) / **ZAP Fuzzer** | ffuf has built-in pattern matching (`-mr`, `-ms`). |
| Burp embedded Chromium browser | **Standalone Chromium / Firefox** with DevTools + FoxyProxy pointing at ZAP/mitmproxy | Lose the integrated session, but functionally equivalent. |
| **DOM Invader** (client-side source/sink taint tracking) | **NO DIRECT OSS EQUIVALENT.** Document gap. | Best available: manual source/sink analysis in DevTools + ZAP's DOM XSS add-on (limited) + reading JS for `location.hash`, `document.referrer`, `window.name`, `postMessage` sinks. |
| Hackvertor (BApp payload encoding) | **Manual encoding snippets** (Python `urllib.parse.quote`, `URLSearchParams`, base64 one-liners) | Provide a small payload-encoding helper section. |
| XSS Hunter (blind XSS) | **Self-hosted BlindXSS fork** (e.g. `frost0xf/dexa`, `ajxchapman/brutxs`) or **skip** | Document the self-host option; note XSS Hunter's free SaaS is now commercial. |

### Porting notes

- Steps 1–4 (configure, identify reflection, test reflected, test stored) port cleanly with the swaps above.
- Step 5 (DOM XSS) **needs the most rewrite**. Replace "Enable DOM Invader" with: (a) crawl with ZAP, (b) grep client-side JS for `location.*`, `document.referrer`, `window.name`, `postMessage`, `innerHTML`, `eval`, `document.write`, (c) test each source→sink pair manually with crafted URLs.
- Step 6 (CSP bypass) — Hackvertor encoding snippets become inline Python/bash one-liners. The CSP-bypass cheat sheet (CDN/JSONP gadgets) stays verbatim.
- Step 7 (validate + document) — output template unchanged.
- Inline payload lists (reflected/stored) stay verbatim.

### Pitfalls / gaps

- **DOM Invader is the single biggest OSS gap in the entire skill.** Be honest: "There is no OSS tool that does what DOM Invader does (automatic client-side taint tracking with source/sink reachability). The OSS workflow is: static grep of JS for sinks, manual source→sink analysis, manual URL crafting, browser DevTools for verification."
- Burp Scanner's crawler understands multi-step state (login → cart → checkout) better than ZAP's. Document: for stateful flows, drive ZAP authentication manually first.
- Hackvertor's tag-based encoding (`<@hex_entities>...`) is more ergonomic than Python one-liners. Acceptable trade-off.

---

## Skill 3: testing-for-host-header-injection

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-host-header-injection
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-Skills/main/skills/testing-for-host-header-injection/SKILL.md`
- **What it does:** HTTP Host header injection → password-reset poisoning, web cache poisoning, SSRF, vhost bypass. Nearly 100% curl-driven.
- **Porting difficulty:** Easy (skill already names interact.sh as Collaborator substitute).
- **Output:** `references/testing-host-header.md`

### Paid → OSS swap table

| Paid | OSS replacement | Notes |
|---|---|---|
| Burp Suite (Host header manipulation) | **mitmproxy** / **OWASP ZAP Request tab** / curl `-H "Host: ..."` | curl covers 95% of cases (the skill already uses curl). |
| Burp Collaborator (OOB detection for SSRF) | **interact.sh** (`go install -v github.com/projectdiscovery/interactsh/cmd/interactsh-client@latest`) | **Skill already names this.** ProjectDiscovery, fully OSS. |
| param-miner (Burp extension, unkeyed headers) | **ffuf** with header wordlists (`-w headers.txt -H "FUZZ: value"`) / **custom SecLists headers wordlist** | No direct OSS clone; ffuf+wordlist covers the common case. |

### Porting notes

- All curl one-liners stay verbatim.
- Replace "Use Burp Collaborator" with "Use interact.sh client" throughout — include the install command and a usage example.
- Replace param-miner with ffuf header-fuzzing pattern.
- Step 6 (connection-state attacks / HTTP smuggling) — replace "Use Burp Repeater with Update Content-Length" with mitmproxy or a raw-socket Python script. Note this is the trickiest step to reproduce without Burp.

### Pitfalls / gaps

- param-miner's "guess headers" smart-discovery (combinatorial header guessing) is more thorough than ffuf. Document ffuf+SecLists-headers as basic-coverage only.
- HTTP request smuggling step needs raw socket control (not all proxies preserve byte-level request integrity). Document the Python `socket` approach for this specific step.

---

## Skill 4: bypassing-authentication-with-forced-browsing (EASIEST)

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/bypassing-authentication-with-forced-browsing
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-Skills/main/skills/bypassing-authentication-with-forced-browsing/SKILL.md`
- **What it does:** Discovers unprotected pages/APIs/admin interfaces via directory/forced browsing, then validates auth enforcement. Entirely ffuf/Gobuster/SecLists/curl.
- **Porting difficulty:** **Easiest** — Burp is already optional.
- **Output:** `references/testing-forced-browsing.md`

### Paid → OSS swap table

| Paid | OSS replacement | Notes |
|---|---|---|
| Burp Suite (request analysis) | **mitmproxy** / **OWASP ZAP** / curl | Already optional in the original. |
| Burp Intruder (Step 3 — send URLs without cookies, flag 200s) | **ffuf** with `-mc 200` and wordlist of URLs | Drop-in replacement: `ffuf -u URL/FUZZ -w urls.txt -mc 200`. |

### Porting notes

- All ffuf/Gobuster/curl commands stay verbatim.
- Replace Step 3's "Test with Burp Intruder" with the equivalent `ffuf -mc 200` pattern.
- Drop the "Prerequisites: Burp Suite" line entirely (it was always optional).
- Keep the sensitive-file checklist (.env, .git/config, etc.) unchanged.

### Pitfalls / gaps

- None of note — this is the most OSS-native skill in the set.

---

## Skill 5: testing-for-open-redirect-vulnerabilities

- **Source:** https://www.skills.sh/mukul975/anthropic-cybersecurity-skills/testing-for-open-redirect-vulnerabilities
- **Raw:** `https://raw.githubusercontent.com/mukul975/Anthropic-Cybersecurity-skills/main/skills/testing-for-open-redirect-vulnerabilities/SKILL.md`
- **What it does:** Identifies/tests open-redirect via param enumeration, bypass techniques, vuln chaining, and OSS-scanner automation.
- **Porting difficulty:** Easy.
- **Output:** `references/testing-open-redirect.md`

### Paid → OSS swap table

| Paid | OSS replacement | Notes |
|---|---|---|
| Burp Suite (crawl/intercept redirect params) | **OWASP ZAP spider** / **ffuf** / **gf** (tomnomnom/gf) for param extraction | ZAP spider replaces crawl; `gf redirect` extracts params from crawled URLs. |
| Burp Collaborator (redirect confirmation) | **interact.sh** | Same as Skill 3. |

### Porting notes

- All OpenRedireX/gf/nuclei/ffuf/curl commands stay verbatim.
- Replace Burp crawl in Step 1 with ZAP spider + `gf redirect` extraction.
- Replace Burp Collaborator with interact.sh in Step 1's "external domain" prereq.
- Bypass-technique taxonomy and vuln-chaining guidance unchanged.

### Pitfalls / gaps

- None significant — Burp was already one option among several.

---

## Skill 6: cybersecurity-analyst (rysweet/amplihack)

- **Source:** https://www.skills.sh/rysweet/amplihack/cybersecurity-analyst
- **Raw:** `https://raw.githubusercontent.com/rysweet/amplihack/main/.claude/skills/cybersecurity-analyst/SKILL.md`
- **What it does:** ~8,500-word analytical reasoning framework (CIA triad, defense-in-depth, zero-trust, STRIDE/PASTA/VAST, MITRE ATT&CK, CVSS/FAIR, NIST IR lifecycle). Produces written analyses, not commands.
- **Porting difficulty:** **Zero tool swaps in methodology** — pure reasoning. Only the reference inventory at the bottom changes.
- **Output:** `references/analyst-reasoning.md`

### Paid → OSS swap (only in the "Security Tools and Platforms" inventory section)

| Paid (original) | OSS replacement(s) |
|---|---|
| **Vuln scanning:** Nessus, Qualys, Rapid7 InsightVM | OpenVAS, Vuls, Nuclei |
| **SAST:** SonarQube, Checkmarx, Veracode | **Semgrep**, CodeQL, Bandit (Python), Brakeman (Rails), Sobelow (Elixir/Phoenix) |
| **DAST:** Burp Suite, Acunetix | **OWASP ZAP**, **Dalfox**, Nuclei web templates |
| **SIEM:** Splunk, Elastic (paid), Sentinel, Chronicle | Wazuh, **Elastic OSS tier**, OpenSearch, Sigma rules |
| **EDR:** CrowdStrike, SentinelOne, Defender for Endpoint | Wazuh (OSS EDR-ish), OSSEC |
| **CSPM:** Prisma Cloud, Wiz, Orca | kube-bench, checkov, tfsec, kube-hunter |
| **Threat intel:** Recorded Future, Mandiant, CrowdStrike | **MISP**, AlienVault OTX, CISA KEV, abuse.ch |
| **VulnDB** | CVE Program / NVD / OSV.dev |
| **AWS commercial services** (GuardDuty, WAF, Security Hub, Config, CloudTrail, Artifact, KMS) | Document these as "AWS-native; some have OSS analogs (e.g. aws-allowlister, CloudCustodian for Config-like policy)" — keep them as AWS-context examples, not required tooling |
| **Microsoft SDL** | Keep as framework reference (it's a methodology, not a paid product) |

### Porting notes

- **Methodology is untouched.** The 11-step process, STRIDE/PASTA/VAST, MITRE ATT&CK mapping, CVSS/FAIR risk scoring, NIST IR lifecycle, three worked examples (ransomware IR, web-app pre-launch review, AWS migration review) — all stay verbatim.
- Only the "Security Tools and Platforms" reference inventory (originally lines 1562-1568) is rewritten with OSS equivalents.
- The "Threat Intelligence Sources" section similarly swaps Recorded Future/Mandiant/CrowdStrike → MISP/OTX/CISA KEV.
- Keep the theoretical-foundations and core-frameworks structure (it's a great progressive-disclosure pattern).
- Keep the common-pitfalls, verification-checklist, and success-criteria sections.

### Pitfalls / gaps

- The AWS cloud-migration worked example names GuardDuty/Security Hub/etc. These are AWS-native (not strictly "paid" — pay-per-use). Decision: keep the example but add a note that the *equivalent detections* can be authored as Sigma rules or implemented via CloudCustodian / aws-iam-tester (OSS).
- Some OSS tools (Wazuh for EDR) are weaker than the commercial equivalents (CrowdStrike). Be honest in the reference inventory: "OSS EDR is less mature than commercial; Wazuh is the closest OSS option."

---

## Skill 7: security-detections-mcp (Aradotso)

→ Splits off to [phase-7-detections-mcp.md](phase-7-detections-mcp.md).

---

## Centralized: `references/oss-tool-map.md`

A single reference doc consolidating the recurring paid→OSS swaps (data from [phase 1](phase-1-research-baseline.md#recurring-paid-tool-replacements-needed-across-the-set)). Every `testing-*.md` and `analyst-reasoning.md` cross-references this with `SEE: references/oss-tool-map.md` instead of duplicating the swap table.

Contents (one row per paid tool → OSS replacement):

| Paid tool | OSS replacement(s) | Used in |
|---|---|---|
| Burp Suite Professional | OWASP ZAP / mitmproxy / Caido (free tier) | XSS, bus-logic, host-header, redirect, forced-browsing |
| Burp Collaborator | **interact.sh** (ProjectDiscovery, OSS) | host-header, redirect |
| Burp Intruder | ffuf / ZAP Fuzzer | XSS, forced-browsing |
| Burp Repeater | mitmproxy / ZAP Request tab | all testing skills |
| Burp Scanner | OWASP ZAP active scan + Dalfox | XSS |
| Burp Turbo Intruder | concurrent curl jobs / httpracer / race-the-web | bus-logic (race conditions) |
| Burp Sequencer | `ent` or drop | bus-logic (token randomness) |
| DOM Invader | **No OSS equivalent** — manual source/sink analysis + DevTools + ZAP DOM XSS add-on (limited) | XSS |
| Hackvertor | Manual encoding snippets (Python/bash) | XSS |
| param-miner | ffuf + SecLists headers wordlist | host-header |
| XSS Hunter | Self-hosted BlindXSS fork (dexa/brutxs) or skip | XSS |
| Postman | Hoppscotch / bruno | bus-logic |
| Nessus / Qualys / Rapid7 | OpenVAS / Vuls / Nuclei | analyst-reasoning |
| SonarQube / Checkmarx / Veracode | **Semgrep** / CodeQL / Bandit / Brakeman | analyst-reasoning |
| Splunk / Elastic paid / Sentinel / Chronicle | Wazuh / Elastic OSS / OpenSearch / Sigma | analyst-reasoning |
| CrowdStrike / SentinelOne / Defender for Endpoint | Wazuh / OSSEC | analyst-reasoning |
| Prisma Cloud / Wiz / Orca | kube-bench / checkov / tfsec / kube-hunter | analyst-reasoning |
| Recorded Future / Mandiant | MISP / OTX / CISA KEV / abuse.ch | analyst-reasoning |
| VulnDB | CVE / NVD / OSV.dev | analyst-reasoning |

## Optional helper scripts (`scripts/`)

Only if a port needs reusable code. Candidates:

- `scripts/race-condition-curl.sh` — wraps the `for i in {1..N}; do curl ... & done; wait` pattern from Skill 1 with argument parsing (URL, concurrency, payload).
- `scripts/dom-xss-grep.sh` — greps a directory of JS for source/sink patterns (Skill 2 gap-mitigation).

Each script is short (<50 lines), well-commented, and licensed MIT to match the repo.

## Implementation checklist (when phase 5 executes)

- [ ] Write `references/oss-tool-map.md` first (centralized; everyone else links to it).
- [ ] Write `references/testing-forced-browsing.md` (easiest — warm-up).
- [ ] Write `references/testing-open-redirect.md`.
- [ ] Write `references/testing-host-header.md`.
- [ ] Write `references/testing-business-logic.md`.
- [ ] Write `references/analyst-reasoning.md` (longest; mostly copy + inventory swap).
- [ ] Write `references/testing-xss.md` (hardest; tackle last with full attention).
- [ ] Optional: write helper scripts under `scripts/`.
- [ ] Add routing-table entries to SKILL.md for each new reference.
- [ ] Verify every reference uses `SEE: references/oss-tool-map.md` instead of duplicating swaps.
- [ ] **Format each reference as a sub-agent briefing** (decision #5): add `## Sub-agent mission`, `## Inputs`, `## Tools`, `## Methodology` (the body above), and `## Sub-agent return contract` per phase 3 §"Execution model — each reference doc runs as a sub-agent".

## Sub-agent briefing format (per reference doc)

Each `references/*.md` written in this phase follows this shape (locked by ORCHESTRATION decision #5):

```markdown
# <reference title>

## Sub-agent mission
<one paragraph: what this sub-agent is being dispatched to do>

## Inputs
<what the orchestrator must pass: task, target/scope, code/URLs, ack-state>

## Tools
<which OSS tools the sub-agent may invoke + install commands if missing>

## Methodology
<the body — the existing ported content from this phase>

## Sub-agent return contract
<output shape the orchestrator should relay, e.g.:
{
  "findings": [
    { "vuln": "...", "severity": "...", "evidence": "...",
      "remediation": "...", "defensive_plugin": "xss-prevention" }
  ],
  "summary": "..."
}
>
```

The sub-agent runs on **`gpt-5.6 sol`** (preferred, pinned) or, if unavailable, the highest tier available (`opus 5 max` / `claude-opus-4.x max`) — pinned by the orchestrator at dispatch, not by the reference doc.

## Things I will NOT do (this phase)

- Will NOT keep Burp/Collaborator/Nessus/SonarQube/etc. as the primary path anywhere — they become "if you already have it" notes only.
- Will NOT silently drop the DOM Invader gap — every XSS reference must state it honestly.
- Will NOT touch the `security-detections-mcp` skill (that's phase 7).
- Will NOT clone external repos or install tools — commands shown are documentation.
- Will NOT skip the sub-agent briefing format — every reference doc must be a dispatchable unit per decision #5.
- Will NOT commit — files land in working tree for review.
