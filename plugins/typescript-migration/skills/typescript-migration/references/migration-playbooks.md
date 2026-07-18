# TypeScript Migration Playbooks

Ordered checklists for each migration path. All paths enforce the Golden Rule: never skip TypeScript 6.

## Playbook A: 5.x → 6.0

1. **Create a migration branch.** `git checkout -b migrate-ts-6`
2. **Set up safety nets.** Run full test suite, type-check, and build to establish a baseline.
3. **Upgrade TypeScript.** `npm install -D typescript@^6` (or `pnpm` / `yarn` / `bun add`).
4. **Run a deprecation scan.** `npx tsc --noEmit`. Capture all TS5xxx codes.
5. **Apply the temporary escape hatch (optional).** If overwhelmed, set `"ignoreDeprecations": "6.0"` to silence warnings and ship the upgrade incrementally. **This will NOT work in TS 7.**
6. **Fix Priority 1 changes** (from `ts6-breaking-changes.md` §8):
   - Set `"types": ["node"]` (or needed `@types`).
   - Set `"rootDir": "./src"` if sources are in a subdir.
   - Embrace `strict: true` or set `"strict": false` explicitly.
7. **Apply the `ts5to6` codemod for the disruptive two** (if user approves):
   ```bash
   npx @andrewbranch/ts5to6 --fixBaseUrl .
   npx @andrewbranch/ts5to6 --fixRootDir .
   ```
8. **Fix Priority 2 changes**: target, module, esModuleInterop imports, `assert {}` → `with {}`, `module Foo {}` → `namespace Foo {}`, `tsc <file>` scripts (add `--ignoreConfig`).
9. **Fix Priority 3**: remove `downlevelIteration`, migrate `moduleResolution`, migrate `module`, remove `outFile`, remove `alwaysStrict: false` etc.
10. **Take quick wins** (Priority 4): simplify `lib`, adopt `getOrInsert`, etc.
11. **Remove `ignoreDeprecations: "6.0"`** once clean.
12. **Verify**: `npx tsc --noEmit`, full test suite, build. Commit.

## Playbook B: 6.0 → 7.0

1. **Confirm zero TS 6 deprecation warnings.** If any remain, finish Playbook A first. `ignoreDeprecations: "6.0"` does NOT work in TS 7.
2. **Audit for breakers.** Run `scripts/audit-ts7-breakers.sh`. Resolve flagged tools per `ecosystem-compatibility.md`.
3. **Classify the project** per the SKILL.md Decision Matrix. If Vue/Svelte/Astro/MDX or transformer-dependent → **stay on TS 6**.
4. **Set up the side-by-side pattern** (recommended for most existing projects):
   ```json
   {
     "devDependencies": {
       "@typescript/native": "npm:typescript@^7.0.2",
       "typescript": "npm:@typescript/typescript6@^6.0.2"
     }
   }
   ```
5. **Delete stale incremental artifacts.** Remove all `.tsbuildinfo` files — incompatible between JS and Go compilers.
6. **Install the VS Code TS 7 extension** (`TypeScriptTeam.native-preview`). It auto-enables.
7. **Run both compilers in CI** and diff diagnostic codes:
   ```bash
   npx tsc --noEmit   2> ts7-errors.txt
   npx tsc6 --noEmit  2> ts6-errors.txt
   diff <(grep -oE 'TS[0-9]+' ts7-errors.txt | sort | uniq -c) \
        <(grep -oE 'TS[0-9]+' ts6-errors.txt | sort | uniq -c)
   ```
   Investigate every divergence. Use `--stableTypeOrdering` on TS 6 to align type ordering (note: free and always-on in TS 7).
8. **Check NEW TS 7 breaking changes** (not present in TS 6):
   - `preserveConstEnums` removed — verify const enum emit behavior.
   - Template literal Unicode code-point preservation — grep for type-level string utilities.
   - JS file handling rework — if the repo has `.js` files with `@enum`, `@class`, standalone `?`, postfix `!`, or Closure function syntax, fix them.
9. **Tune performance** (optional): `--checkers 8` on beefy CI runners; `--checkers 1` or `--singleThreaded` on constrained ones.
10. **Switch the editor default to TS 7.**
11. **Verify**: full test suite, build, and a representative dev-session smoke test.
12. **Commit and roll out incrementally.** Keep `@typescript/typescript6` alias until TS 7.1 ships and tooling updates land.

## Playbook C: 5.x → 7.0 (via 6.0)

Do NOT skip TS 6. Execute Playbook A in full, then Playbook B.

If time pressure is extreme: at minimum pass through TS 6 with `"ignoreDeprecations": "6.0"` set, then proceed to Playbook B. The escape hatch is a pause, not a skip — TS 7 ignores it entirely.

## Playbook D: Intra-Version Strict-Flag Rollout (no version change)

For enabling a stricter `compilerOption` (e.g. `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, `noImplicitOverride`) on an existing large codebase, see `ts-migrating-tool-guide.md` for the conditional `ts-migrating` tool offer.

## Rollback Plan Template

For any playbook, before starting:
```bash
git tag pre-ts-migration
git checkout -b migrate-ts-X
# ... work ...
# If something breaks badly:
git checkout main
git branch -D migrate-ts-X
git tag -d pre-ts-migration  # once confident
```

For TS 7 side-by-side: rollback is just removing the npm aliases and reinstalling standard `typescript@^6`.

## Sources

- TS 6.0 beta blog: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/
- TS 7.0 release blog: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- ts5to6 codemod: https://github.com/andrewbranch/ts5to6
- CHANGES.md tracker: https://github.com/microsoft/typescript-go/blob/main/CHANGES.md
