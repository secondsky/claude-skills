# OSS tool map — paid → open-source swap table

## Sub-agent mission

You are a small lookup sub-agent. Given a paid security tool (or a paid-tool-based workflow the user describes), return the OSS replacement(s) and a one-line note on parity. You do not run the tools — you answer "what's the OSS replacement for X?". If asked, also surface install commands and the parity gap honestly.

## Inputs

- The paid tool name (e.g. "Burp Scanner", "Nessus", "Splunk") OR a workflow description that implies a paid tool.
- Optional: target language / platform / SIEM dialect.

## Tools

None required — this is a pure-lookup sub-agent. If the user wants install commands, emit them as documentation (do not install).

## Methodology

### Pledge

This skill is **OSS-only**. Every paid tool below is replaced with a viable OSS alternative as the **primary path**. Paid tools appear only as "if you already have it" notes — never as a hard requirement.

### Web testing — Burp Suite ecosystem

| Paid tool | OSS replacement(s) | Used in | Notes |
|---|---|---|---|
| Burp Suite Professional (intercept / modify multi-step flows) | **OWASP ZAP** (Request tab, active scan) / **mitmproxy** (scriptable in Python) / **Caido** (free tier) | XSS, business-logic, host-header, redirect, forced-browsing | ZAP is the closest 1:1 Burp replacement; mitmproxy is best for scripted flows. |
| Burp Scanner (active crawl + payload injection) | **OWASP ZAP active scan** + **Dalfox** (`go install github.com/hahwul/dalfox/v2@latest`) | XSS | ZAP crawls + passive + active; Dalfox handles high-volume payload injection. |
| Burp Repeater (single-request replay / tweak) | **OWASP ZAP Request tab** / **mitmproxy** with `mitmweb` | all testing references | Both support manual replay with header/body editing. |
| Burp Intruder (payload lists + Grep-Match) | **ffuf** (`-w payloads.txt -mr "pattern"`) / **ZAP Fuzzer** | XSS, forced-browsing | ffuf has built-in pattern matching (`-mr`, `-ms`). |
| Burp Turbo Intruder (race conditions, 20+ simultaneous requests) | **concurrent curl background jobs** / **httpracer** / **race-the-web** | business-logic (race conditions) | Document the bash-loop pattern: `for i in {1..30}; do curl ... & done; wait`. **Gap:** Turbo Intruder's HTTP/2 single-packet race is not perfectly reproducible with curl; for true single-packet races use `httpracer` (Go). |
| Burp Sequencer (token randomness) | **`ent`** (info-theory randomness on collected tokens) or **drop entirely** | business-logic | Sequencer is rarely load-bearing. `ent` is basic-coverage only; Sequencer's compression/spectral analysis is richer. |
| Burp Collaborator (OOB detection for SSRF / blind vulns) | **interact.sh** (`go install -v github.com/projectdiscovery/interactsh/cmd/interactsh-client@latest`) | host-header, redirect | ProjectDiscovery, fully OSS. Skill 3 already names this. |
| **DOM Invader** (client-side source/sink taint tracking) | **NO DIRECT OSS EQUIVALENT.** | XSS | **Biggest OSS gap in the skill.** Best available: manual source/sink analysis in browser DevTools + ZAP's DOM XSS add-on (limited) + grep client-side JS for `location.*`, `document.referrer`, `window.name`, `postMessage`, `innerHTML`, `eval`, `document.write`. State the gap honestly. |
| Hackvertor (BApp payload encoding) | **Manual encoding snippets** (Python `urllib.parse.quote`, `URLSearchParams`, bash base64 one-liners) | XSS | Less ergonomic than Hackvertor's tag-based encoding; acceptable trade-off. |
| param-miner (Burp extension, unkeyed headers) | **ffuf** with header wordlists (`-w headers.txt -H "FUZZ: value"`) / **SecLists** headers wordlist | host-header | No direct OSS clone; ffuf + wordlist covers the common case. param-miner's combinatorial guessing is more thorough — document ffuf+SecLists as basic-coverage only. |
| XSS Hunter (blind XSS) | **Self-hosted BlindXSS fork** (e.g. `frost0xf/dexa`, `ajxchapman/brutxs`) or **skip** | XSS | XSS Hunter's free SaaS is now commercial (TrustedSec). Document the self-host option; note the operational overhead. |
| Burp embedded Chromium browser | **Standalone Chromium / Firefox** with DevTools + FoxyProxy pointing at ZAP/mitmproxy | XSS | Loses the integrated session, but functionally equivalent. |
| Postman (collection runners, env vars) | **Hoppscotch** (OSS, self-hostable) / **bruno** (OSS desktop collection runner) | business-logic | Hoppscotch has a runner; bruno is git-friendly. |

### Vuln scanning & SAST

| Paid tool | OSS replacement(s) | Notes |
|---|---|---|
| Nessus / Qualys / Rapid7 InsightVM (vuln scanning) | **OpenVAS** / **Vuls** / **Nuclei** | OpenVAS is the closest Nessus clone; Nuclei for template-driven web/infra scanning. |
| SonarQube / Checkmarx / Veracode (SAST) | **Semgrep** / **CodeQL** / **Bandit** (Python) / **Brakeman** (Rails) / **Sobelow** (Elixir/Phoenix) | Semgrep is the primary recommendation — multi-language, custom-rule-friendly, no binary lock-in. |
| Snyk (commercial SCA) | **osv-scanner** / **pip-audit** / **Trivy** / **npm audit** / **cyclonedx + dependency-track** | This repo's `vulnerability-scanning` plugin covers SCA/SBOM. |

### SIEM / EDR / CSPM

| Paid tool | OSS replacement(s) | Notes |
|---|---|---|
| Splunk / Elastic paid tier / Microsoft Sentinel / Google Chronicle (SIEM) | **Wazuh** / **Elastic OSS tier** / **OpenSearch** / **Sigma rules** | Sigma is the OSS detection-format standard; the `detections-mcp.md` reference covers Sigma authoring. |
| CrowdStrike / SentinelOne / Microsoft Defender for Endpoint (EDR) | **Wazuh** (OSS EDR-ish) / **OSSEC** | **Be honest:** OSS EDR is less mature than commercial; Wazuh is the closest OSS option. |
| Prisma Cloud / Wiz / Orca Security (CSPM) | **kube-bench** / **checkov** / **tfsec** / **kube-hunter** | checkov/tfsec for IaC; kube-bench/kube-hunter for runtime Kubernetes. |
| Recorded Future / Mandiant / CrowdStrike (threat intel) | **MISP** / **AlienVault OTX** / **CISA KEV** / **abuse.ch** | MISP for intel sharing; CISA KEV for exploited-vuln prioritization. |
| VulnDB | **CVE Program** / **NVD** / **OSV.dev** | OSV.dev is the modern aggregated OSS vuln database. |

## Install one-liners (documentation only)

```bash
# Web testing
go install github.com/hahwul/dalfox/v2@latest                  # XSS scanner
go install -v github.com/projectdiscovery/interactsh/cmd/interactsh-client@latest   # OOB detection
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest              # template scanner
# ffuf, gobuster, feroxbuster typically via package manager (brew/apt) or `go install`

# SAST
pipx install semgrep                                           # multi-language SAST
# CodeQL: download from github.com/github/codeql-cli-binaries

# Vuln scanning
brew install openvas  # or apt install openvas                 # Nessus alternative
pipx install osv-scanner                                       # SCA
pipx install pip-audit                                         # Python SCA

# SIEM / detection
# Sigma rules:   git clone https://github.com/SigmaHQ/sigma.git
# Wazuh:         https://documentation.wazuh.com/current/installation-guide/
# Elastic OSS:   https://www.elastic.co/downloads/elasticsearch
```

## Parity gaps (state honestly)

- **DOM Invader** has no OSS equivalent. XSS testing falls back to manual JS source/sink analysis. This is the single biggest OSS gap in the skill.
- **Burp Turbo Intruder** HTTP/2 single-packet race timing is not perfectly reproducible with curl. Use `httpracer` for true single-packet races; the bash `&`+`wait` pattern is best-effort only.
- **Burp Sequencer** statistical analysis (compression, spectral) is richer than `ent`. `ent` is basic-coverage only.
- **param-miner** combinatorial header guessing is more thorough than ffuf + wordlist. Document as basic-coverage.
- **Wazuh** (OSS EDR) is less mature than CrowdStrike/SentinelOne. State this directly when the user asks about EDR.
- **AWS-native services** (GuardDuty, Security Hub, WAF, Config, CloudTrail, KMS) are pay-per-use, not strictly "paid" in the SaaS sense. Treat them as AWS-context examples; equivalent detections can be authored as Sigma rules or implemented via **CloudCustodian** (OSS) for Config-like policy.

## Sub-agent return contract

Return a JSON object (or a short markdown summary) of this shape:

```json
{
  "query": "<the paid tool or workflow the user asked about>",
  "primary_oss": ["<OSS tool(s) — the recommended primary path>"],
  "install": ["<install commands as documentation>"],
  "parity_gap": "<honest statement of where OSS parity is imperfect, or 'full parity'>",
  "notes": "<one-line usage note>",
  "paid_as_optional": "<the original paid tool, marked as 'optional, if you already have it'>"
}
```

If the user described a workflow rather than a tool name, infer the paid tool and answer the same way.
