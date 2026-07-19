# Security Policy

This document describes how to report security vulnerabilities in the
`claude-skills` marketplace and what reporters and maintainers can expect
from the process. It is a companion to the audit report at
`docs/security-audit/REPORT.md`.

## Supported versions

`claude-skills` is a marketplace of plugins distributed to downstream Claude
Code users. Only the **`main` branch** (and tagged releases that point at it)
is supported for security fixes. There are no separate maintenance lines;
patch fixes land on `main` and consumers pick them up on the next sync.

| Version | Supported |
| ------- | --------- |
| `main`  | Yes       |
| Older tagged releases | No — re-pin to `main` |

## Reporting a vulnerability

**Do NOT open a public issue for a security vulnerability.**

Prefer GitHub's private advisory flow:

1. Go to the project's **Security** tab.
2. Click **Report a vulnerability** (under "Security advisories").
3. Fill in the template: affected component, version, severity, description,
   proof of concept, suggested fix.

This opens a private advisory visible only to repository maintainers and
GitHub Security staff. It is the fastest, safest channel and supports
CVE assignment when warranted.

**Fallback (only if the GitHub Security tab feature is unavailable to
you):** open an issue using the
[`Security advisory` issue template](.github/ISSUE_TEMPLATE/security-advisory.md).
Be aware this fallback is *not* private — strip any exploit details or
secrets, and only include enough information to identify the affected
component and severity. If you need to share a live exploit, ask a
maintainer for an off-channel contact.

## Response SLA

| Stage                              | Target        |
| ---------------------------------- | ------------- |
| Initial acknowledgment             | 72 hours      |
| Status update to reporter          | 7 days        |
| Fix merged for **High / Critical** | 30 days       |
| Fix merged for **Medium**          | 90 days       |
| Fix merged for **Low / Info**      | Next release  |

Severity is triaged using CVSS v3.1 plus marketplace-specific factors
(blast radius across downstream consumers, whether `main` is currently
affected, whether an exploit is public). If the reporter and maintainers
disagree on severity, maintainers will document the reasoning in the
advisory before closing.

## Scope

### In scope

- **Auto-executing hook scripts** — anything in `.githooks/`, a plugin's
  `hooks/` directory, or referenced from a `plugin.json` `hooks` block.
  Bugs that fail-open on parse errors, read user data from environment
  variables instead of stdin, or interpolate attacker-controlled strings
  into shell commands are all in scope.
- **Plugin content that ships vulnerable "example" code** — sample code
  in `SKILL.md` / `README.md` / `templates/` that, if copy-pasted by a
  user, would install a real vulnerability (e.g. `console.log(env.API_KEY)`,
  `escape()` removed in express-validator v7, deprecated `xss-clean`).
- **Supply-chain risks via CI or dependencies** — `pull_request_target`
  misuse, unpinned/un-SHA-pinned actions, lockfile drift, typosquats,
  packages without integrity hashes, workflows with over-broad
  `permissions:` blocks.
- **Scripts that destroy user state under `$HOME` or the project CWD** —
  `rm -rf` with unvalidated paths, in-place `sed -i` without backups,
  `mv` over config files without a `.bak`, `set -e` missing from
  destructive shell scripts.
- **Repo governance that affects release integrity** — branch protection
  gaps, missing signed-commit requirements, missing status checks.

### Out of scope

- **The skills themselves being markdown documentation about other
  tools' vulnerabilities.** A skill like `csrf-protection` that *describes*
  a CVE in some other library is informational content; the CVE itself is
  not a vulnerability in this repo.
- **Bugs in the third-party tools the skills describe.** If `better-auth`
  or `hono` has a vulnerability, report it to that project, not here.
  This repo only ships advice about them.
- **Vulnerabilities in dependencies that have no code path in this repo.**
  The dev-only dependency tree (`ajv-cli`, `fast-json-patch`, etc.) is
  dev tooling; runtime exposure is governed by the downstream consumer's
  own dependency choices, not this marketplace.
- **Social engineering, phishing, or physical attacks against maintainers.**
- **Issues in forks or downstream redistributions of this marketplace.**
  Report those to the fork's maintainers.
- **Theoretical timing oracles with no demonstrated impact.**

If you are unsure whether something is in scope, err on the side of
reporting it privately — maintainers will triage.

## Acknowledgements

We are grateful to the researchers who report vulnerabilities responsibly.
Credited reporters (with their permission) will be listed here, along with
the advisory IDs they helped surface.

<!-- Add entries as: -->
<!-- - **@handle** — GHSA-xxxx-xxxx-xxxx (Month YYYY) -->

_(No reports credited yet.)_

## Safe harbor

We will not pursue legal action against security researchers who:

- Make a good-faith effort to avoid privacy violations, destruction of
  data, and interruption or degradation of services.
- Do not access data other than their own.
- Do not use social engineering or physical attacks against maintainers
  or infrastructure.
- Give us reasonable time to remediate before any public disclosure.
- Report findings through the channels above.

In return, we will acknowledge responsible disclosure and work with you
on coordinated disclosure timing.

## Repository configuration (E-005)

Branch protection on `main` is the single most important governance
control for a marketplace distributing to downstream consumers — an
unreviewed commit to `main` is effectively a supply-chain release event.
Branch protection is a repository setting and **cannot be set from a
clone**; maintainers must apply it through the GitHub UI/API. The
recommended ruleset for `main`:

- **Require linear history** (no merge commits; squash or rebase only).
- **Require signed commits** (GPG or SSH signing; rejects unsigned
  pushes even from admins).
- **Require at least 1 approving review** before merge.
- **Require status checks to pass before merge**, with these required
  checks:
  - `Validate Frontmatter`
  - `Validate JSON Schemas`
  - `Dependency Review`
  - `CodeQL`
- **Require branches to be up to date** before merge (no stale PR
  merges).
- **Block force-pushes** to `main`.
- **Block deletion** of `main`.
- **Do not allow administrators to bypass** the above rules.

Maintainer setup steps for a new repo are mirrored in
[docs/guides/MARKETPLACE_MANAGEMENT.md](docs/guides/MARKETPLACE_MANAGEMENT.md#repository-security-setup-for-maintainers).

## Release integrity roadmap (E-015)

This project does **not** currently publish signed releases with
[Sigstore](https://www.sigstore.dev/) signing or
[SLSA](https://slsa.dev/) build provenance. A downstream consumer cannot
cryptographically verify that a given plugin tarball was built by this
repo's CI; consumers pin to a git SHA at their own trust level.

Adding Sigstore (`cosign sign-blob`) and a SLSA provenance attestation
(via `slsa-framework/slsa-github-generator`) to tagged releases is a
tracked roadmap item, scoped for when the project begins publishing
formal release artifacts. Until then, the defense-in-depth posture
relies on:

- SHA-pinned actions in CI (E-002 remediation).
- Least-privilege `permissions:` blocks (E-001 remediation).
- Required status checks on `main` (see above).
- Lockfile-honoring installs (`npm ci`) rather than unpinned globals
  (E-010 remediation).

This section is honest documentation of the current state — the actual
CI signing work is out of scope for the 2026-07 audit fix phase.
