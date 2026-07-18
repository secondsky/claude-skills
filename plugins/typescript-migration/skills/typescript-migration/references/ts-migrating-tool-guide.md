# The `ts-migrating` Tool — Conditional Offer Guide

**This tool is OPTIONAL and CONDITIONAL.** It is NOT a TypeScript version migration tool. It only helps tighten `compilerOptions` incrementally on an existing large codebase. Offer it only when the gate conditions below are all met.

## What It Is (and Is Not)

- **npm package**: `ts-migrating` (author: YCM Jason / Jason Yu; repo: `github.com/ycmjason/ts-migrating`).
- **NOT** Airbnb's `ts-migrate` (a different tool — Airbnb's is a codemod suite for converting JavaScript projects to TypeScript).
- **NOT** a TypeScript version upgrader. It cannot help with the TS 5→6→7 migration or with tsgo/native-port adoption.
- **What it does**: enables progressively turning on stricter `compilerOptions` (e.g. `noUncheckedIndexedAccess`, `strict`, `erasableSyntaxOnly`) without a big-bang migration that floods the codebase with hundreds of type errors.

## How It Works

Two components:

1. **Language Service Plugin** (IDE only): You declare stricter options inside a `plugins` block in `tsconfig.json`. The IDE then surfaces the new errors. Specific lines can be silenced with a `// @ts-migrating` comment that makes that line fall back to the old (less strict) behavior. **The plugin has ZERO effect on `tsc` or production builds.**

2. **CLI**:
   - `ts-migrating check` — runs `tsc` with the plugin applied, reporting all errors introduced by the new config. **Wire this into CI** or the new options won't actually be enforced in builds.
   - `ts-migrating annotate` — **edits source files**, inserting `// @ts-migrating` above every new error line. Run on a clean git state; review changes before committing.

## Install & Run

```bash
npm install -D ts-migrating
```

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "ts-migrating",
        "compilerOptions": {
          "noUncheckedIndexedAccess": true
        }
      }
    ]
  }
}
```

Run:
```bash
npx ts-migrating check      # report new errors in CI
npx ts-migrating annotate   # bulk-insert // @ts-migrating markers (review before committing)
```

## Gate Conditions — Offer ONLY When ALL Hold

Before suggesting `ts-migrating`, verify every condition:

1. **Existing non-greenfield TypeScript codebase.** Greenfield projects should just set strict flags from day one.
2. **Goal is enabling a stricter `compilerOption` incrementally** (e.g. turning on `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, `noImplicitOverride`, `exactOptionalPropertyTypes`).
3. **NOT a TypeScript version migration.** If the user wants TS 5→6 or 6→7, this tool is useless — direct them to `migration-playbooks.md`.
4. **NOT a tsgo / native-port migration.** Same — irrelevant.
5. **Codebase is large enough that flipping the flag all-at-once would produce an unmanageable number of errors.** Small codebases: just flip the flag and fix the errors directly.

If any condition fails, do NOT offer the tool.

## Warnings to Surface When Offering

When offering `ts-migrating`, explicitly tell the user:

1. **It is not Airbnb's `ts-migrate`.** Different tool, different purpose (Airbnb's converts JS→TS).
2. **The IDE plugin has zero effect on `tsc`.** CI must run `ts-migrating check` or the new options won't be enforced in builds — drift between IDE and production.
3. **`annotate` bulk-edits source files.** Run on a clean git state and review changes before committing.
4. **`// @ts-migrating` markers are tech debt.** They are deliberate opt-outs that must be cleaned up later. Unlike `@ts-expect-error`, they're scoped to new-config errors, but they still need a removal pass.
5. **Custom rules are not supported** — the tool is scoped to official `compilerOptions`.
6. **It does not help with any TS 7.0 Go-compiler breakage** (ts-node, ts-patch, WASM, etc.). See `ecosystem-compatibility.md` for those.

## Example Offer (How to Surface to the User)

When the gate conditions hold, frame the offer like:

> "You're enabling `noUncheckedIndexedAccess` on a large existing codebase, which will likely surface many errors at once. There's an optional tool called `ts-migrating` (NOT Airbnb's `ts-migrate`) that lets you turn on the flag for new code immediately while marking existing violations with `// @ts-migrating` comments to clean up later. Caveats: it edits source files when you run `annotate`, the IDE plugin alone has zero effect on `tsc` (you must wire `ts-migrating check` into CI), and the markers become tech debt. Want me to set it up, or would you prefer to just flip the flag and fix errors directly?"

## Sources

- Introducing `ts-migrating` (Jason Yu): https://dev.to/ycmjason/introducing-ts-migrating-the-best-way-to-upgrade-your-tsconfig-2jmn
- Repo: https://github.com/ycmjason/ts-migrating
- Contrast with Airbnb ts-migrate: https://github.com/airbnb/ts-migrate
