# Phase 7 — Detections MCP

> **Status:** 📋 Ready to execute (after plan approval).
>
> **Depends on:** [phase-3-skill-architecture.md](phase-3-skill-architecture.md).

## Purpose

Port the Aradotso `security-detections-mcp` skill (the MCP server indexing 8,200+ Sigma/Splunk/Elastic/CrowdStrike/Sublime/KQL detection rules) to an OSS-friendly reference doc. Per ORCHESTRATION decision #2, this is a **two-path setup doc**: the local OSS MCP server is the recommended path, and the hosted `detect.michaelhaag.org` API is documented as an optional alternative (neither dropped nor mandatory).

- **Source skill:** https://www.skills.sh/aradotso/security-skills/security-detections-mcp
- **Output:** `references/detections-mcp.md`

## What the underlying MCP server does

`npx -y security-detections-mcp` runs a local MCP (Model Context Protocol) server exposing 81 tools (local) / ~25 tools (hosted) for:

- **Detection search & retrieval** (`search`, `get_by_id`, `list_all`, `list_by_source`, `get_stats`)
- **MITRE ATT&CK filtering** (`list_by_mitre`, `list_by_mitre_tactic`, `list_by_cve`, `list_by_process_name`, `list_by_severity`, `list_by_data_source`)
- **Coverage / gap analysis** (`analyze_coverage`, `identify_gaps`, `suggest_detections`, `get_coverage_summary`, `analyze_actor_coverage`, `compare_actor_coverage`, `analyze_procedure_coverage`)
- **ATT&CK Navigator layer generation** + file export
- **SIEM export** (sigma/splunk/elastic/kql formats)
- **Autonomous CTI→detection→PR pipeline** (`configure_autonomous` → `run_autonomous_analysis` with `cti_sources=["misp","otx"]`)

Indexes 6 sources: **Sigma** (SigmaHQ/sigma), **Splunk ESCU** (splunk/security_content), **Elastic** (elastic/detection-rules), **KQL** (Bert-JanP/Hunting-Queries-Detection-Rules + jkerai1/KQL-Queries), **Sublime** (sublime-security/sublime-rules), **CrowdStrike CQL** (ByteRay-Labs/Query-Hub).

Authored by Michael Haag (MHaggis); Aradotso skill wrapper by ara.so.

## Two-path setup

### Path A — Local OSS MCP (recommended for OSS-only users)

**What's OSS here:**
- The MCP server itself (Node 18+, MIT-licensed npm package `security-detections-mcp`)
- The MCP protocol (OSS standard)
- All 6 rule repos (publicly cloneable)
- MITRE ATT&CK STIX bundle (public)
- All MCP clients (Claude Desktop, Cursor, VS Code, ZCode)

**Setup steps (document verbatim in the reference doc):**

1. **Runtime:** Node.js 18+ and npm.
2. **Clone rule repos** via git sparse-checkout (one-time, ~GB of data):
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
   Equivalent blocks for Cursor, VS Code, and ZCode (MCP clients are OSS).
5. **Verify:** restart client, ask "list detection sources" — should return sigma, splunk_escu, elastic, kql, sublime, crowdstrike_cql.

**OSS-only mode (drop commercial SIEM dialects):**

If the user runs no commercial SIEM, set only `SIGMA_REPO_PATH` and `MITRE_CTI_PATH`. The server operates fully on Sigma + ATT&CK — that's the pure-OSS path. The Splunk/CrowdStrike/Sublime/KQL/Elastic rule repos are useful for *reading* detection logic and porting it to Sigma, but not required.

### Path B — Hosted API (optional, documented but not required)

**What's commercial here:**
- The `detect.michaelhaag.org` hosted endpoint is a **third-party proprietary service** maintained by Michael Haag. Free tier: 200 calls/day, read-only tools. Paid tiers implied.

**When to use:** zero local setup, want to try the coverage-analysis features quickly, accept depending on a third-party hosted service.

**Setup steps (document as optional, with caveats):**

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
3. **Caveats to document explicitly:**
   - This is a **third-party hosted service** — your queries transit their infrastructure.
   - Free tier is rate-limited (200 calls/day, read-only).
   - The hosted path is **not** required for any functionality the skill needs; Path A covers everything.
   - If the hosted service changes terms or goes away, Path A still works.

## Documented workflow patterns

Port the original skill's 11 named expert prompts as workflow templates the agent can follow:

1. ransomware-readiness-assessment
2. apt-threat-emulation
3. purple-team-exercise
4. executive-briefing
5. detection-sprint-planning
6. insider-threat-detection
7. cloud-security-assessment
8. supply-chain-security
9. data-exfiltration-defense
10. initial-access-hardening
11. credential-theft-protection

For each: one paragraph on goal + which MCP tools to call (e.g. "ransomware-readiness: `list_by_mitre` with the ransomware technique list, then `identify_gaps` to find uncovered techniques, then `suggest_detections` for the gaps").

## ATT&CK Navigator export

Document the `generate_navigator_layer` tool — produces a JSON layer file loadable in the OSS [ATT&CK Navigator](https://github.com/mitre-attack/attack-navigator). Useful for visualizing coverage gaps.

## Autonomous CTI→detection→PR pipeline

Document (cautiously — this is the most automation-heavy feature):

1. `configure_autonomous` with `cti_sources=["misp","otx"]` (both OSS CTI sources).
2. `run_autonomous_analysis` ingests recent CTI, maps to ATT&CK, identifies uncovered techniques, drafts Sigma rules, opens a draft PR.

**Caveat:** autonomous PR creation touches the user's git/GitHub — document the auth setup (GitHub token, target repo) and recommend running with `dry_run=true` first.

## SIEM export formats

Document `export_detections` — emits in sigma / splunk / elastic / kql formats. Note: exporting in splunk/kql/crowdstrike formats produces text you can paste into those SIEMs, but running it there requires the commercial SIEM. Sigma export is the pure-OSS path.

## Reference-doc structure (`references/detections-mcp.md`)

```markdown
# Detection engineering (Sigma + MITRE ATT&CK via MCP)

## When to use
- Authoring Sigma detection rules
- Searching 8,200+ existing detections across Sigma/Splunk/Elastic/KQL/Sublime/CrowdStrike
- MITRE ATT&CK coverage / gap analysis
- ATT&CK Navigator layer generation
- Mapping CTI (MISP/OTX) to detection gaps

## Setup (pick one path; both optional — not required for other skill features)

### Path A — Local OSS MCP (recommended)
<setup steps above>

### Path B — Hosted API (optional, third-party)
<setup steps + caveats above>

## Workflow patterns
<11 expert prompts as templates>

## ATT&CK Navigator export
<generate_navigator_layer usage>

## Autonomous CTI→detection→PR pipeline
<configure_autonomous + run_autonomous_analysis, with dry_run caveat>

## OSS-only mode
<drop commercial SIEM dialects; Sigma + ATT&CK only>

## Attribution
MCP server by Michael Haag (MHaggis); Aradotso skill wrapper by ara.so.
All rule repos publicly cloneable; commercial SIEMs only required to *run* non-Sigma rules.

## Sub-agent mission
<one paragraph: this sub-agent wires up (or connects to) the detections MCP and
runs detection engineering tasks — search, coverage/gap analysis, Sigma authoring,
ATT&CK Navigator export, CTI→detection pipeline>

## Inputs
<task (search query / coverage goal / Sigma draft), MITRE ATT&CK scope, target SIEM
format (default: sigma)>

## Tools
<Node 18+, npx, security-detections-mcp, optional rule-repo clones, MITRE ATT&CK STIX>

## Methodology
<the Setup + Workflow patterns + ATT&CK Navigator + Autonomous pipeline sections above>

## Sub-agent return contract
{
  "detections": [ { "id": "...", "source": "sigma", "title": "...", "mitre": [...] } ],
  "coverage_gaps": [ { "technique": "TXXXX", "name": "..." } ],
  "navigator_layer_path": "/tmp/.../.json" (optional),
  "draft_sigma_rules": [ "..." ] (optional, from autonomous pipeline),
  "summary": "..."
}
```

(Per ORCHESTRATION decision #5, this reference doc is a dispatchable sub-agent briefing, not inline doc. The orchestrator dispatches a sub-agent on **`gpt-5.6 sol`** preferred, or `opus 5 max` / `claude-opus-4.x max` as fallback, with this doc as the briefing.)

## Things I will NOT do (this phase)

- Will NOT make Path B (hosted API) the default — Path A (local OSS) is the primary recommendation.
- Will NOT hide that Path B is a third-party commercial service.
- Will NOT require any of this — the detections MCP is one optional reference doc; the rest of the skill works without it.
- Will NOT execute the autonomous PR pipeline without `dry_run=true` first (safety).
- Will NOT clone repos or install the MCP server during authoring — commands are documentation.
- Will NOT skip the sub-agent briefing format (decision #5).
- Will NOT commit — file lands in working tree for review.
