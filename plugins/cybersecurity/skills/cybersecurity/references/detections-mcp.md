# Detection engineering — Sigma + MITRE ATT&CK via MCP

> Port of Aradotso's `security-detections-mcp` skill. Per ORCHESTRATION decision #2, this is a **two-path setup doc**: Path A (local OSS MCP server) is recommended; Path B (hosted `detect.michaelhaag.org` API) is documented as an optional alternative — neither dropped nor mandatory.

## Sub-agent mission

You are dispatched to do detection engineering: author Sigma rules, search 8,200+ existing detections across Sigma/Splunk/Elastic/KQL/Sublime/CrowdStrike, perform MITRE ATT&CK coverage and gap analysis, generate ATT&CK Navigator layers, or run the autonomous CTI→detection→draft-PR pipeline. You wire up (or connect to) the OSS MCP server and drive it.

## Inputs

- **task:** the user's verbatim request (e.g. "write a Sigma rule for detecting Mimikatz", "what ATT&CK techniques have zero coverage in our Sigma repo?", "generate an ATT&CK Navigator layer for our ransomware readiness").
- **scope:** MITRE ATT&CK scope (Enterprise / Cloud / Mobile / ICS), target SIEM format (default: `sigma`).
- **ack_state:** `n/a` (detection authoring is Track A — purely analytical; no live-target authorization needed).
- **context (optional):** existing Sigma repo path, CTI sources (MISP / OTX), target PR repo (for autonomous pipeline).

## Tools

```bash
# Required for Path A (local OSS MCP)
node --version    # needs Node 18+
npx --version     # needs npx
git --version

# Optional CTI sources for the autonomous pipeline
#   MISP (self-hosted) and AlienVault OTX (free) — both OSS
```

## Methodology

### What the underlying MCP server does

`npx -y security-detections-mcp` runs a local MCP server exposing **81 tools (local) / ~25 tools (hosted)** for:

- **Detection search & retrieval** (`search`, `get_by_id`, `list_all`, `list_by_source`, `get_stats`).
- **MITRE ATT&CK filtering** (`list_by_mitre`, `list_by_mitre_tactic`, `list_by_cve`, `list_by_process_name`, `list_by_severity`, `list_by_data_source`).
- **Coverage / gap analysis** (`analyze_coverage`, `identify_gaps`, `suggest_detections`, `get_coverage_summary`, `analyze_actor_coverage`, `compare_actor_coverage`, `analyze_procedure_coverage`).
- **ATT&CK Navigator layer generation** + file export.
- **SIEM export** (sigma / splunk / elastic / kql formats).
- **Autonomous CTI→detection→PR pipeline** (`configure_autonomous` → `run_autonomous_analysis` with `cti_sources=["misp","otx"]`).

Indexes 6 sources: **Sigma** (SigmaHQ/sigma), **Splunk ESCU** (splunk/security_content), **Elastic** (elastic/detection-rules), **KQL** (Bert-JanP/Hunting-Queries-Detection-Rules + jkerai1/KQL-Queries), **Sublime** (sublime-security/sublime-rules), **CrowdStrike CQL** (ByteRay-Labs/Query-Hub).

Authored by **Michael Haag (MHaggis)**. Aradotso skill wrapper by **ara.so**.

## Setup (pick one path; both optional — not required for other skill features)

### Path A — Local OSS MCP (recommended)

**What's OSS here:** the MCP server (Node 18+, MIT-licensed `security-detections-mcp`), the MCP protocol, all 6 rule repos, the MITRE ATT&CK STIX bundle, all MCP clients (Claude Desktop, Cursor, VS Code, ZCode).

#### Setup steps

1. **Runtime:** Node.js 18+ and npm.
2. **Clone rule repos** (one-time, ~GB of data):

   ```bash
   mkdir -p ~/detection-rules && cd ~/detection-rules
   # Sigma (flagship OSS source)
   git clone --depth 1 https://github.com/SigmaHQ/sigma.git
   # Splunk ESCU (content repo is OSS even though Splunk is commercial)
   git clone --depth 1 https://github.com/splunk/security_content.git
   # Elastic detection rules (rules repo is OSS)
   git clone --depth 1 https://github.com/elastic/detection-rules.git
   # KQL hunting queries (community OSS)
   git clone --depth 1 https://github.com/Bert-JanP/Hunting-Queries-Detection-Rules.git
   git clone --depth 1 https://github.com/jkerai1/KQL-Queries.git
   # Sublime rules (content repo is OSS; Sublime SaaS is commercial)
   git clone --depth 1 https://github.com/sublime-security/sublime-rules.git
   # CrowdStrike CQL queries (ByteRay-Labs mirror, OSS)
   git clone --depth 1 https://github.com/ByteRay-Labs/Query-Hub.git cql-hub
   ```

3. **MITRE ATT&CK STIX bundle:**

   ```bash
   git clone --depth 1 --filter=blob:none --sparse https://github.com/mitre/cti.git
   cd cti && git sparse-checkout set enterprise-attack && cd ..
   ```

4. **MCP client config** (Claude Desktop `claude_desktop_config.json`):

   ```json
   {
     "mcpServers": {
       "security-detections": {
         "command": "npx",
         "args": ["-y", "security-detections-mcp"],
         "env": {
           "SIGMA_REPO_PATH": "/Users/you/detection-rules/sigma",
           "SPLUNK_ESCU_PATH": "/Users/you/detection-rules/security_content",
           "ELASTIC_RULES_PATH": "/Users/you/detection-rules/detection-rules",
           "KQL_HUNTING_PATH": "/Users/you/detection-rules/Hunting-Queries-Detection-Rules",
           "KQL_QUERIES_PATH": "/Users/you/detection-rules/KQL-Queries",
           "SUBLIME_RULES_PATH": "/Users/you/detection-rules/sublime-rules",
           "CROWDSTRIKE_CQL_PATH": "/Users/you/detection-rules/cql-hub",
           "MITRE_CTI_PATH": "/Users/you/detection-rules/cti"
         }
       }
     }
   }
   ```

   Equivalent config blocks for Cursor, VS Code, and ZCode (MCP clients are OSS).

5. **Verify:** restart client; ask "list detection sources" — should return `sigma`, `splunk_escu`, `elastic`, `kql`, `sublime`, `crowdstrike_cql`.

#### OSS-only mode (drop commercial SIEM dialects)

If the user runs no commercial SIEM, set **only** `SIGMA_REPO_PATH` and `MITRE_CTI_PATH`. The server operates fully on Sigma + ATT&CK — that's the pure-OSS path. The Splunk/CrowdStrike/Sublime/KQL/Elastic rule repos are useful for *reading* detection logic and porting it to Sigma, but not required.

### Path B — Hosted API (optional, third-party)

**What's commercial here:** the `detect.michaelhaag.org` hosted endpoint is a **third-party proprietary service** maintained by Michael Haag. Free tier: 200 calls/day, read-only tools. Paid tiers implied.

**When to use:** zero local setup, want to try the coverage-analysis features quickly, accept depending on a third-party hosted service.

#### Setup steps (with caveats)

1. **Account + API token:** visit `detect.michaelhaag.org/account/tokens`, create a token starting with `sdmcp_`.
2. **MCP client config** via `mcp-remote`:

   ```json
   {
     "mcpServers": {
       "security-detections-hosted": {
         "command": "npx",
         "args": ["-y", "mcp-remote", "https://detect.michaelhaag.org/mcp"],
         "env": { "AUTHORIZATION": "Bearer sdmcp_yourtoken" }
       }
     }
   }
   ```

3. **Caveats to surface explicitly:**
   - This is a **third-party hosted service** — queries transit their infrastructure.
   - Free tier is rate-limited (200 calls/day, read-only).
   - The hosted path is **not** required for any functionality the skill needs; Path A covers everything.
   - If the hosted service changes terms or goes away, Path A still works.

## Workflow patterns (the 11 expert prompts as templates)

Port the original skill's 11 named expert prompts as reusable workflow patterns:

1. **ransomware-readiness-assessment** — `list_by_mitre` with the ransomware technique list (T1486, T1485, T1490, T1027, T1021, etc.) → `identify_gaps` for uncovered techniques → `suggest_detections` for the gaps → `generate_navigator_layer` for visualization.
2. **apt-threat-emulation** — pick an APT group → `analyze_actor_coverage` for that group → identify which of their techniques have no detection → `suggest_detections` → cross-reference with MISP/OTX CTI.
3. **purple-team-exercise** — choose a technique set → `list_by_mitre` to confirm current detections → `analyze_procedure_coverage` for known procedures → produce the gap-closure plan.
4. **executive-briefing** — `get_coverage_summary` for the high-level numbers → `analyze_coverage` by tactic → format as a one-page exec brief.
5. **detection-sprint-planning** — `identify_gaps` for the top-N un-covered techniques → `suggest_detections` → prioritize by ease + ATT&CK criticality.
6. **insider-threat-detection** — list techniques in the impact + collection tactics relevant to insider threats → coverage analysis → author Sigma drafts.
7. **cloud-security-assessment** — restrict to ATT&CK Cloud matrix → coverage per cloud technique → gap closure.
8. **supply-chain-security** — list techniques T1195.x (supply chain compromise) → coverage check → Sigma drafts for the gaps.
9. **data-exfiltration-defense** — list T1041 / T1048 / T1567 techniques → coverage check → Sigma drafts.
10. **initial-access-hardening** — list initial-access techniques (T1078, T1190, T1195, T1133) → coverage check → Sigma drafts.
11. **credential-theft-protection** — list credential-access techniques (T1003, T1110, T1056) → coverage check → Sigma drafts.

For each, the pattern is: enumerate the technique set → check current coverage → identify gaps → suggest detections → (optionally) author Sigma drafts → (optionally) generate a Navigator layer for visualization.

## ATT&CK Navigator export

`generate_navigator_layer` produces a JSON layer file loadable in the OSS [ATT&CK Navigator](https://github.com/mitre-attack/attack-navigator). Useful for visualizing coverage gaps as a heat-map over the ATT&CK matrix.

## Autonomous CTI→detection→PR pipeline

> Cautiously — this is the most automation-heavy feature.

1. `configure_autonomous` with `cti_sources=["misp","otx"]` (both OSS CTI sources).
2. `run_autonomous_analysis` ingests recent CTI, maps to ATT&CK, identifies uncovered techniques, drafts Sigma rules, opens a draft PR.

**Caveat:** autonomous PR creation touches the user's git/GitHub. Document the auth setup (GitHub token, target repo) and **recommend running with `dry_run=true` first**. The orchestrator must not run this pipeline without explicit user direction.

## SIEM export formats

`export_detections` emits in sigma / splunk / elastic / kql formats. Note: exporting in splunk / kql / crowdstrike formats produces text you can paste into those SIEMs, but **running it there requires the commercial SIEM**. **Sigma export is the pure-OSS path.**

## OSS-only mode

Drop commercial SIEM dialects entirely. Sigma + ATT&CK is the pure-OSS path:

- Author in Sigma.
- Visualize coverage in ATT&CK Navigator (OSS).
- Run detections in Wazuh / Elastic OSS / OpenSearch (OSS SIEMs that ingest Sigma).

For the SIEM swap table, `SEE: references/oss-tool-map.md`.

## Attribution

MCP server by **Michael Haag (MHaggis)**. Aradotso skill wrapper by **ara.so**. All rule repos are publicly cloneable; commercial SIEMs are only required to *run* non-Sigma rules.

## Sub-agent return contract

```json
{
  "detections": [
    { "id": "...", "source": "sigma", "title": "...", "mitre": ["T1003.001"], "severity": "high" }
  ],
  "coverage_gaps": [
    { "technique": "TXXXX", "name": "...", "tactic": "..." }
  ],
  "navigator_layer_path": "/tmp/coverage-YYYYMMDD.json",
  "draft_sigma_rules": [
    "title: ... \ndetection:\n  selection:\n    ..."
  ],
  "summary": "<plain-language summary>"
}
```
