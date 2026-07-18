# Phase 10 — Marketplace registration

> **Status:** 📋 Execute last, after phase 9 testing passes. This phase documents the ship steps; **execution happens in a future pass**, not during this plan-writing effort.
>
> **Depends on:** All prior phases (3–9). Phase 9's verification report must be green before this phase runs.

## Purpose

Register the new `cybersecurity` plugin in the marketplace: create the plugin manifest, add the marketplace entry, bump the marketplace version, and update the README/MARKETPLACE/CHANGELOG. Matches the repo's existing conventions observed in [phase 1](phase-1-research-baseline.md#d-repo-conventions--secondskyclaude-skills).

## Files touched (when this phase executes)

| File | Action |
|---|---|
| `plugins/cybersecurity/.claude-plugin/plugin.json` | **Create** |
| `plugins/cybersecurity/skills/cybersecurity/SKILL.md` | (Already created by phases 3–8; this phase only finalizes the description + keywords) |
| `plugins/cybersecurity/skills/cybersecurity/references/*.md` | (Already created by phases 4–8) |
| `.claude-plugin/marketplace.json` | **Edit** — add new entry to `plugins[]` array, bump `metadata.version` |
| `package.json` | **Edit** — bump `version` to match marketplace |
| `README.md` | **Edit** — update skill count, add Recent Additions entry |
| `MARKETPLACE.md` | **Edit** — add new entry to human-readable catalog |
| `CHANGELOG.md` | **Edit** — new version section |

## Step 1 — Create `plugins/cybersecurity/.claude-plugin/plugin.json`

Match the conventions of `plugins/csrf-protection/.claude-plugin/plugin.json`:

```json
{
  "name": "cybersecurity",
  "description": "<final description from phase 3, pushy, with triggers — see below>",
  "version": "3.4.0",
  "author": { "name": "Claude Skills Maintainers", "email": "maintainers@example.com" },
  "license": "MIT",
  "repository": "https://github.com/secondsky/claude-skills",
  "keywords": [
    "cybersecurity",
    "security",
    "owasp",
    "pentest",
    "vulnerability",
    "xss",
    "ssrf",
    "csrf",
    "business-logic",
    "host-header",
    "open-redirect",
    "forced-browsing",
    "threat-modeling",
    "stride",
    "mitre-att-and-ck",
    "sigma",
    "sast",
    "code-audit",
    "dalfox",
    "owasp-zap",
    "ffuf",
    "nuclei",
    "interactsh",
    "mitmproxy",
    "semgrep",
    "detection-engineering",
    "incident-response",
    "sub-agent",
    "parallel-agents"
  ]
}
```

### Description (final wording)

Per `writing-skills` CSO guidance: pushy, third-person, lists triggers, does NOT summarize workflow. Draft:

> Unified OSS-only cybersecurity skill: analyze, test, and harden software security using exclusively open-source tooling. Use whenever the user mentions OWASP Top 10, pentest, penetration testing, vulnerability testing, XSS, SSRF, CSRF, business-logic flaws, Host header injection, open redirect, forced browsing, threat modeling, STRIDE/PASTA/VAST, MITRE ATT&CK, Sigma detection rules, SAST, code audit, security review, incident analysis, or wants to replace a paid security tool (Burp, Nessus, Splunk) with an open-source alternative. Covers finding, analyzing, and fixing vulnerabilities across web apps, APIs, codebases, and AI/LLM applications. Each capability runs as a dedicated high-tier sub-agent (GPT-5.6 sol preferred / Opus 5 max fallback) dispatched by a thin orchestrator; broad audits fan out in parallel. Live-target testing requires user authorization (gate fires before dispatch); static analysis, code review, threat modeling, and detection authoring are always available.

Keep total frontmatter under 1024 chars (agentskills.io spec).

## Step 2 — Add to `.claude-plugin/marketplace.json`

Insert into the `plugins[]` array in **alphabetical order by `name`** (between `csrf-protection` and `defense-in-depth-validation` — verify exact position when executing):

```json
{
  "name": "cybersecurity",
  "source": "./plugins/cybersecurity",
  "version": "3.4.0",
  "description": "<same description as plugin.json>",
  "keywords": ["cybersecurity", "security", "owasp", "pentest", "vulnerability", "xss", "..."],
  "category": "security"
}
```

**Category:** `security` (matches the 5 existing defensive security plugins).

**Backup before editing** (per repo convention — there are `marketplace.json.backup-YYYYMMDD-HHMMSS` snapshots):
```bash
cp .claude-plugin/marketplace.json .claude-plugin/marketplace.json.backup-$(date +%Y%m%d-%H%M%S)
```

### Version-bump decision

Marketplace is currently at `3.4.0` (2026-07-18). Adding a new skill is a minor bump per semver. **Two options — pick one when executing:**

- **`3.4.1`** (patch) — if treating new skill as additive/minor.
- **`3.5.0`** (minor) — if treating the new offensive-security category as a feature-worthy addition.

Recommendation: **`3.5.0`** — a new skill that fills a previously-empty category (offensive security) is a feature, not a patch.

If going with `3.5.0`, update `version` in **all** of:
- `.claude-plugin/marketplace.json` → `metadata.version`
- Each plugin entry's `version` field? (No — existing plugins stay at 3.4.0; only the new plugin + marketplace metadata bump.)
- Actually, per repo convention (every plugin currently at 3.4.0 = marketplace version), decide during execution: either (a) bump only marketplace metadata + new plugin, leaving others at 3.4.0, or (b) bump all to 3.5.0 for consistency. The recent commit `d035cfbd chore: bump marketplace and all plugins to v3.4.0` suggests option (b) is the established pattern. **Default: bump all to 3.5.0.**

## Step 3 — Use the sync script (if it automates this)

The repo has `./scripts/sync-plugins.sh`. Check what it does before hand-editing:

```bash
head -50 ./scripts/sync-plugins.sh
./scripts/sync-plugins.sh --help 2>&1 || true
```

If it auto-generates `marketplace.json` from per-plugin `plugin.json` files, run it after creating `plugins/cybersecurity/.claude-plugin/plugin.json`. Otherwise hand-edit per Step 2.

## Step 4 — Update `package.json`

```json
{
  "name": "claude-skills",
  "version": "3.5.0",
  ...
}
```

## Step 5 — Update `README.md`

- Update skill count in the title line (currently "141 production-ready skills" — becomes 142, or whatever the post-add count is).
- Update "Version 3.4.0 | Last Updated: 2026-07-18" line to new version + date.
- Add to **Recent Additions** section, under a new "## July 2026" (or current month) heading:
  ```markdown
  ## July 2026
  - **cybersecurity** — Unified OSS-only cybersecurity skill: threat modeling, web-vuln testing (XSS, SSRF, business logic, host header, open redirect, forced browsing), SAST, code audit, AI-app security, detection engineering (Sigma + MITRE ATT&CK). Fuses 7 community skills (mukul975, rysweet/amplihack, Aradotso) ported to fully open-source tooling (OWASP ZAP, Dalfox, ffuf, Nuclei, mitmproxy, interact.sh, Semgrep, Sigma). Cross-references the 5 existing defensive security plugins for remediation.
  ```

## Step 6 — Update `MARKETPLACE.md`

Add a new entry to the human-readable catalog, matching the existing format.

## Step 7 — Update `CHANGELOG.md`

Add new section at the top (below `# Changelog` heading):

```markdown
## [3.5.0] - <YYYY-MM-DD>

### Added
- **cybersecurity** — Unified OSS-only cybersecurity skill with progressive disclosure. Fuses 7 community skills (mukul975 business-logic/XSS/host-header/forced-browsing/open-redirect, rysweet/amplihack cybersecurity-analyst, Aradotso security-detections-mcp) ported to fully open-source tooling. Covers threat modeling, web-vuln testing, SAST, code audit, AI-app security, and detection engineering (Sigma + MITRE ATT&CK). Live-target testing gated behind an authorization disclaimer; static analysis and threat modeling always available. Cross-references csrf-protection, xss-prevention, vulnerability-scanning, security-headers-configuration, defense-in-depth-validation for remediation.

### Changed
- Bumped marketplace and all plugins to v3.5.0.
```

## Step 8 — Commit

Per repo convention (matching `feat(typescript-migration): add TypeScript 5/6/7 migration plugin`):

```bash
git checkout -b feat/cybersecurity-skill
git add plugins/cybersecurity/ .claude-plugin/marketplace.json package.json README.md MARKETPLACE.md CHANGELOG.md
git status  # verify only intended files
git commit -m "feat(cybersecurity): add OSS-only unified cybersecurity skill"
```

(Don't push unless the user asks. Open a PR via `gh pr create` only if the user requests it.)

## Verification before commit

- [ ] `plugins/cybersecurity/.claude-plugin/plugin.json` validates against `schemas/plugin.schema.json`.
- [ ] `.claude-plugin/marketplace.json` validates against `schemas/marketplace.schema.json`.
- [ ] Plugin directory name matches skill name (`cybersecurity` == `cybersecurity`).
- [ ] `skills/cybersecurity/SKILL.md` exists with valid frontmatter.
- [ ] New marketplace entry is in alphabetical order in `plugins[]`.
- [ ] All version strings consistent (marketplace metadata + new plugin + package.json).
- [ ] README skill count incremented.
- [ ] CHANGELOG entry added.
- [ ] No excluded-topic content (malware/virus/supabase/openclaw/linux/hardware/firewall).
- [ ] No paid tool as a hard requirement anywhere in the skill.
- [ ] Phase 9 testing report is green.

## Things I will NOT do (this phase — and in this plan-writing pass overall)

- Will NOT execute any of steps 1–8 in this pass — this phase is documentation of what a future execution would do.
- Will NOT bump versions, edit `marketplace.json`, edit `package.json`, or commit anything during plan authoring.
- Will NOT skip the schema validation step.
- Will NOT push to remote or open a PR without explicit user request.
- Will NOT include the new skill in the marketplace before phase 9 testing passes.
- Will NOT commit — this plan file lands in the working tree for review.
