# Plugin Security Review Checklist

> Maintainer checklist applied when reviewing a new plugin or skill PR.
> Distilled from the defense-in-depth security audit
> (`docs/security-audit/REPORT.md`). Each item is a single question;
> answer "yes", "no", or "unsure". The goal is to catch the audit's
> recurring patterns before they ship to downstream consumers.

**Skill / PR under review:** __________________________________

**Reviewer:** ____________________   **Date:** ____________

---

## 1. Hook / auto-exec scripts

Applies to anything in `.githooks/`, a plugin's `hooks/` directory, or
referenced from a `plugin.json` `hooks` block. Skip if the PR adds none.

- [ ] Does the script **fail-secure** (non-zero exit) on malformed/missing JSON input, rather than `exit 0` on parse error?
- [ ] Does it read its input from **stdin** (e.g. `jq` over piped input), not from a `$CLAUDE_TOOL_INPUT`-style env var that silently no-ops when unset?
- [ ] Are there any places where attacker-controlled strings (filenames, JSON values, branch names) are interpolated into a shell command? If yes, are they passed as argv elements instead?
- [ ] Are regex guards on user input actually restrictive (no trivial bypasses like `rm -fr /` slipping past a `rm -rf /` blocklist)?

## 2. Subprocess spawning

Applies to TS/JS/Python that shells out, MCP orchestrators, plugin
helpers. Skip if the PR has no subprocess spawning.

- [ ] Is there an **allowlist** of permitted commands (rather than executing whatever a registry/config specifies)?
- [ ] Are command **arguments validated** before spawn (length, charset, path containment)?
- [ ] Is the **environment filtered** before spawning — specifically stripping `PATH`, `NODE_OPTIONS`, `LD_PRELOAD`, `DYLD_*`, and any inherited secret-bearing vars?
- [ ] Are spawns in **argv form** (`execFile(cmd, [args])`) rather than shell form (`exec(\`${cmd} ${args}\`)`) with interpolation?
- [ ] If a "sandbox" is advertised, is it actually a security boundary (not `vm` module, not `eval`)?

## 3. Secret handling

Applies to any skill that touches credentials — auth, API keys, JWTs,
cloudflare workers bindings, etc.

- [ ] Are there any `console.log` / `echo` / `print` statements that could dump `env.*`, `process.env.*`, tokens, or passwords?
- [ ] Does `.gitignore` cover `.dev.vars`, `.env*`, `.envrc`, and any other local secret files the skill's setup mentions?
- [ ] Do example snippets read secrets from `env` (e.g. `env.API_KEY`) rather than hardcoding literal-looking values?
- [ ] Does any "verify token" example actually verify signature/expiry/audience, not just check kid-presence or decode the payload?
- [ ] Do secret-generation scripts write to a single output (file or stdout with a single clear variable) and avoid echoing every supported secret name?

## 4. Destructive operations outside the repo

Applies to install scripts, migration generators, anything that mutates
files under `$HOME` or the consuming project's CWD.

- [ ] Is every `rm -rf` target **validated** (whitelist of known-good names) and **canonicalized** (`realpath`) before deletion?
- [ ] Does each in-place edit (`sed -i`, `mv`, `writeFileSync` overwrite) keep a **`.bak` / backup** until the new content is verified?
- [ ] Do shell scripts start with `set -euo pipefail` (and `IFS=$'\n\t'` where appropriate)?
- [ ] Are user-input values that flow into file paths or `sed` patterns escaped or rejected on non-matching characters?
- [ ] Are destructive operations **idempotent** (re-running is a no-op, not a double-application)?

## 5. Defensive content correctness

Applies to skills whose purpose is to teach a security topic — they get
extra scrutiny because users copy them as canonical patterns.

- [ ] Is every "example" code block **safe by default** if a user copy-pastes it verbatim into their own project?
- [ ] Does it recommend any **deprecated libraries** or APIs (e.g. `xss-clean`, `escape()` removed in express-validator v7, `timingSafeEqual` without length check)?
- [ ] Are there dangerous patterns (eval, `Function()`, broad CORS, disabled CSRF) presented without a clear "do not ship this" caveat?
- [ ] Does any "proof of ownership" / "verify you control this" gate require an actual cryptographic or DNS proof, not an unverified claim?
- [ ] Are version numbers and "current as of" dates in the skill accurate, or has the skill drifted from upstream tool behavior?

## 6. CI / supply chain

Applies if the PR touches `.github/workflows/`, `package.json`,
`package-lock.json`, or any script invoked from CI.

- [ ] Are GitHub Actions **SHA-pinned** (not `@v4` tag-pinned)?
- [ ] Does each workflow declare a least-privilege `permissions:` block (no implicit `contents: write`)?
- [ ] Does CI install dependencies via `npm ci` (lockfile-honoring) rather than `npm install -g <pkg>` (unpinned global)?
- [ ] If the workflow interpolates `${{ github.* }}` into a `run:` block, is the value passed through an `env:` var and charset-validated?
- [ ] Are new workflow triggers limited to `push` / `pull_request` (no `pull_request_target` unless strictly required and reviewed)?

---

## Sign-off

If **any** answer above is "no" or "unsure", request changes before
merge. Do not merge on the assumption that "CI passed" covers these —
CI catches syntax and schema, not the patterns in this checklist.

Reviewer notes / required changes:

-

PR mergeable once all boxes are checked or each "no"/"unsure" has a
documented accepted-risk rationale.

---

## Roadmap: `--dry-run` coverage (audit finding D-020)

The defense-in-depth audit (D-020, Low / L-effort) noted that almost no
script that writes outside the repo supports `--dry-run`, so a user
cannot preview what an installer would do before committing to it. The
audit rated this Low and L-effort-per-script; rather than retrofit all
~15 external-write scripts in a single broad change, we are taking a
scoped approach: harden the highest-risk installers first (those already
covered by the B4 input-validation and B9 canonical-path fixes), and
track the remainder as a roadmap.

### Scripts that now support `--dry-run`

These accept `--dry-run` anywhere in argv. In dry-run mode they parse
and validate arguments exactly as in the live path, then print
`DRY-RUN: would <action> <details>` for every FS operation (mkdir,
symlink, copy, backup, sed, chmod, composer install) and exit 0 without
mutating disk. Validation failures still exit non-zero — dry-run never
bypasses validation.

- `scripts/install-skill.sh` — installs a skill to `$HOME/.claude/skills/`.
- `scripts/install-all.sh` — loops `install-skill.sh`; forwards `--dry-run`.
- `plugins/wordpress-plugin-core/skills/wordpress-plugin-core/scripts/scaffold-plugin.sh` — scaffolds a plugin to `$HOME/wp-content/plugins/`.
- `plugins/gemini-cli/skills/gemini-cli/scripts/install-gemini-coach.sh` — copies a script to `$HOME/.local/bin/`.
- `plugins/gemini-cli/skills/gemini-cli/scripts/setup-slash-command.sh` — copies a slash command to `$HOME/.claude/commands/`.

### Scripts tracked for future `--dry-run` addition

These external-write scripts are not yet dry-run-enabled. Each is a
small, self-contained addition following the same pattern (parse
`--dry-run` early, gate each FS operation behind `[ "$DRY_RUN" = "1" ]`,
exit 0 after printing the plan). They are listed here so a future
hardening pass has an explicit inventory.

- `plugins/cloudflare-durable-objects/skills/cloudflare-durable-objects/scripts/migration-generator.sh`
- `plugins/cloudflare-workers/skills/cloudflare-workers-observability/scripts/setup-logging.sh`
- `plugins/cloudflare-workers/skills/cloudflare-workers-testing/scripts/setup-vitest.sh`
- `plugins/cloudflare-workers/skills/cloudflare-workers-dev-experience/scripts/dev-setup.sh`
- `plugins/cloudflare-sandbox/skills/cloudflare-sandbox/scripts/setup-sandbox-binding.sh`
- `plugins/base-ui-react/skills/base-ui-react/scripts/migrate-radix-component.sh`
- `plugins/nuxt-seo/skills/nuxt-seo/scripts/init-nuxt-seo.sh`
- `plugins/nuxt-content/skills/nuxt-content/scripts/setup-nuxt-content.sh`

When adding `--dry-run` to a script on this list, also remove it from
this inventory so the doc stays authoritative.

