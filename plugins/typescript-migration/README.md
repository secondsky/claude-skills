# typescript-migration

**Status**: Production Ready
**Last Updated**: 2026-07-09

Authoritative guide to migrating TypeScript projects across major versions (5.x → 6 → 7, including the native Go port "tsgo"/"Corsa"). Based on official Microsoft announcements (TS 6.0 beta blog 2026-02-11; TS 7.0 release blog 2026-07-08).

## What This Skill Does

Provides a comprehensive, source-cited workflow for moving TypeScript projects between major compiler versions. Covers:

- **TS 6 deprecations & new defaults catalog** — every breaking tsconfig default change and deprecated option that becomes a hard error in TS 7
- **TS 7 native port adoption** — installing the Go-based compiler, interpreting performance gains, and handling the missing Compiler API
- **The official `@typescript/typescript6` side-by-side pattern** — Microsoft's recommended workaround for tooling that depends on the TS Compiler API under TS 7
- **Ecosystem compatibility matrix** — typescript-eslint, ts-morph, ts-node, Vue/Svelte/Astro/MDX/Angular-template gaps, ts-patch, ttypescript, typia
- **Ordered migration playbooks** — the only supported path is 5.x → 6 → 7; no shortcuts
- **The `ts-migrating` tool** — offered conditionally for incremental strict-flag rollouts within a single version (not for version migration)
- **Detection/audit scripts** — version detection, TS 7 breaker audit, TS 6 deprecation scan, and tsc7-vs-tsc6 diagnostic diffing

## Auto-Trigger Keywords

**Primary**: typescript-migration, typescript-6, typescript-7, tsgo, corsa, tsconfig-migration

**Secondary**: stableTypeOrdering, ignoreDeprecations, ts5to6, typescript6-compat, native-preview, esmoduleinterop, bundler-resolution, rootDir, noUncheckedSideEffectImports, libReplacement

**Error-based**: `TS5011`, `TS5101`, `TS5102`, `TS5107`, `TS5108`, `TS5111`, `TS5112`, `Cannot find name 'process'`, `Cannot find name 'describe'`, `tsconfig.json is present but will not be loaded`

## When to Use

- Upgrading a TypeScript project across a major compiler version (5.x → 6, or 6 → 7)
- Adopting the native Go port (tsgo/Corsa) for build speedup
- Seeing TS5xxx deprecation or migration-info codes in `tsc` output
- Planning the 5 → 6 → 7 path for an existing codebase
- Deciding whether the project can adopt TS 7 at all (framework/tooling constraints)

## When Not to Use

- Application feature development unrelated to the TypeScript compiler
- Runtime, bundler, or infrastructure issues unrelated to TS compilation
- Design or product decisions

## Authoritative Sources

- **TS 7.0 release**: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ (2026-07-08)
- **TS 6.0 beta**: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/ (2026-02-11)
- **TS 6 → 7 official diff tracker**: https://github.com/microsoft/typescript-go/blob/main/CHANGES.md
- **ts5to6 tool**: https://github.com/andrewbranch/ts5to6
- **VS Code TS 7 extension**: https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview

## Known Issues Prevented

| Issue | Prevention | Source |
|-------|-----------|--------|
| Wall of errors skipping TS 6 | Mandate 5→6→7 path; never skip TS 6 | Microsoft TS 6.0 beta blog |
| typescript-eslint / ts-morph break on TS 7 | Official `@typescript/typescript6` alias pattern | Microsoft TS 7.0 release blog |
| Vue/Svelte/Astro/MDX/Angular-template can't use TS 7 | Project-type decision matrix; stay on TS 6 | Microsoft TS 7.0 release blog |
| Files emit to dist/src/ instead of dist/ | Explicit rootDir detection script | TS 6.0 beta blog (PR #62418) |
| Hundreds of missing-types errors | types:[] default detection + fix guide | TS 6.0 beta blog (PR #63054) |
| Unsafe tsc-with-file-args use | TS5112 detection + --ignoreConfig guidance | TS 6.0 beta blog (PR #62477) |
| Unverified third-party claims asserted as fact | `references/unverified-claims.md` refusal list | internal cross-source audit |

## Quick Usage

```
"Migrate my project from TypeScript 5.9 to 6"
"Should I adopt TypeScript 7? My project uses Vue + Volar"
"Run a TS 6 deprecation scan and explain the TS5101 errors"
"Set up the typescript6 side-by-side pattern so typescript-eslint keeps working under TS 7"
"Help me incrementally turn on noUncheckedIndexedAccess across a large codebase"
```
