# TypeScript 6.0 Breaking Changes — Authoritative Reference

Sourced from Microsoft's official TS 6.0 beta announcement (2026-02-11) and the TypeScript PR tracker. TS 6.0 is the last JavaScript-based release; it acts as the bridge between 5.9 and the native Go-rewrite TS 7.0.

---

## 1. New Default Values (10 changes)

### Default Changes Table

| # | Option | Old Default | New Default | PR |
|---|---|---|---|---|
| 1 | `strict` | `false` | **`true`** | https://github.com/microsoft/TypeScript/pull/63087 |
| 2 | `module` | `CommonJS` | **`esnext`** | https://github.com/microsoft/TypeScript/pull/62669 |
| 3 | `target` | `ES3` | **`es2025`** (floating — "current stable ECMAScript version immediately preceding esnext") | https://github.com/microsoft/TypeScript/pull/63067 |
| 4 | `moduleResolution` | `node10` | **`bundler`** (resolved from `module`) | https://github.com/microsoft/TypeScript/pull/62669 |
| 5 | `rootDir` | inferred from input files | **`.`** (tsconfig.json directory) | https://github.com/microsoft/TypeScript/pull/62418 |
| 6 | `types` | `["*"]` (all `@types`) | **`[]`** (none) | https://github.com/microsoft/TypeScript/pull/63054 |
| 7 | `noUncheckedSideEffectImports` | `false` | **`true`** | https://github.com/microsoft/TypeScript/pull/62443 |
| 8 | `libReplacement` | `true` | **`false`** | https://github.com/microsoft/TypeScript/pull/62391 |
| 9 | `esModuleInterop` | `false` | **`true`** | https://github.com/microsoft/TypeScript/pull/62567 |
| 10 | `allowSyntheticDefaultImports` | varies | **`true`** | https://github.com/microsoft/TypeScript/pull/62567 |

### rootDir deep-dive

- **Symptom**: files appear at `dist/src/index.js` instead of `dist/index.js`.
- **Fix**: set `"rootDir": "./src"` (or wherever your source root lives).
- **Safety net diagnostic**: **TS5011** fires when:
  - `noEmit` is unset,
  - `composite` is unset,
  - `rootDir` is unset,
  - tsconfig exists,
  - and `outDir` / `declarationDir` / `outFile` is specified,
  - and the old inferred root differs from the new default.
- **Note**: only matters if you emit. With `noEmit: true` and an external bundler (Vite, webpack, esbuild, etc.), this change does not affect your build output.
- **Diff**:
  ```json
  {
    "compilerOptions": {
+     "rootDir": "./src"
    },
    "include": ["./src"]
  }
  ```

### types deep-dive

- **Symptom** (verbatim error messages from the official blog):
  ```
  Cannot find module '...' or its corresponding type declarations.
  Cannot find name 'fs'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
  Cannot find name 'path'. ...
  Cannot find name 'process'. ...
  Cannot find name 'Bun'. Try `npm i --save-dev @types/bun` ...
  Cannot find name 'describe'. Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha` ...
  ```
- **Fix**: set `"types": ["node"]` or `"types": ["node", "jest"]` etc. — only the packages you actually need.
- **Restore old behavior**: `"types": ["*"]`. The `"*"` is a special token, NOT a glob — patterns like `"node*"` will not work. Note that `"types": null` (or omitting `types` under the new default semantics) means **none**.
- **Performance**: 20–50% build-time improvement from explicit `types`, because TypeScript no longer scans hundreds of transitive `@types` packages under `node_modules`.
- **Diff**:
  ```json
  {
    "compilerOptions": {
+     "types": ["node"]
    }
  }
  ```

---

## 2. Deprecated Options (Warnings in 6.0, HARD ERRORS in 7.0)

These options emit deprecation warnings in 6.0. Setting `"ignoreDeprecations": "6.0"` silences warnings in 6.0 but **DOES NOT work in 7.0** — every option below becomes a hard error in TS 7.0 regardless.

| Option | Replacement | PR |
|---|---|---|
| `target: es5` / `es3` | use `es2015`+ or external transpiler (swc, esbuild) | https://github.com/microsoft/TypeScript/pull/63067 |
| `downlevelIteration` (any value, even `false`) | remove entirely | https://github.com/microsoft/TypeScript/pull/63071 |
| `moduleResolution: node` / `node10` | `nodenext` or `bundler` | https://github.com/microsoft/TypeScript/pull/62338 |
| `moduleResolution: classic` | `nodenext` or `bundler` | https://github.com/microsoft/TypeScript/pull/62669 |
| `module: amd` / `umd` / `systemjs` / `none` | `esnext`, `preserve`, `commonjs`, or `nodenext` (also drops `amd-module` directive support) | https://github.com/microsoft/TypeScript/pull/62669 |
| `baseUrl` | inline into `paths` entries relative to project root | https://github.com/microsoft/TypeScript/pull/62509 |
| `esModuleInterop: false` | remove (always true) | https://github.com/microsoft/TypeScript/pull/62567 |
| `allowSyntheticDefaultImports: false` | remove (always true) | https://github.com/microsoft/TypeScript/pull/62567 |
| `alwaysStrict: false` | remove (always strict) | https://github.com/microsoft/TypeScript/pull/63089 |
| `outFile` | use a bundler | https://github.com/microsoft/TypeScript/pull/62981 |
| `module Foo { }` syntax (namespace via `module` keyword) | `namespace Foo { }` | https://github.com/microsoft/TypeScript/pull/62876 |
| `assert { }` on imports | `with { }` (import attributes) | https://github.com/microsoft/TypeScript/pull/63077 |
| `/// <reference no-default-lib="true"/>` | use `--noLib` or `--libReplacement` (no longer respected under `skipDefaultLibCheck`) | https://github.com/microsoft/TypeScript/pull/62435 |

**Note on ES5**: ES5 is **deprecated** in TS 6.0, not removed. It still works with a warning. It is **removed in TS 7.0**.

**Note on `module` keyword**: `module Foo { }` (unquoted) is a **hard error in 6.0**, not a warning. The quoted ambient form `declare module "some-module"` still works unchanged.

### baseUrl deep-dive

- **Why deprecated**: `baseUrl` doubles as a path prefix **AND** a look-up root, causing false-positive resolutions like `import "someModule"` resolving to `src/someModule.js` when the developer meant a package import.
- **Fix**: remove `baseUrl`, inline the prefix into each `paths` entry:
  ```json
  {
    "compilerOptions": {
-     "baseUrl": "./src",
      "paths": {
-       "@app/*": ["app/*"],
-       "@lib/*": ["lib/*"]
+       "@app/*": ["./src/app/*"],
+       "@lib/*": ["./src/lib/*"]
      }
    }
  }
  ```
- **If `baseUrl` was actually used as a look-up root** (bare non-aliased imports resolved against it), add an explicit catch-all: `"*": ["./src/*"]`.
- **`extends` does NOT merge `paths`** — paths are always fully overridden by the child config. Shared base configs may need `paths` defined in more places after this migration.
- **Use the official `ts5to6` codemod**:
  ```bash
  npx @andrewbranch/ts5to6 --fixBaseUrl .
  npx @andrewbranch/ts5to6 --fixRootDir .
  ```
  One mode per run.

### esModuleInterop deep-dive

- **Runtime behavior change**, not just types. Emit changes from `require("./cjs").default` to `__importDefault` / `__importStar` helper-wrapped calls.
- **Code fix**:
  ```typescript
  // Before (esModuleInterop: false)
  import * as express from "express";

  // After (esModuleInterop always on)
  import express from "express";
  ```

### alwaysStrict deep-dive

- TypeScript now always assumes JavaScript strict mode, regardless of the `alwaysStrict` setting.
- **Reserved words that break if used as identifiers in previously non-strict code**: `implements`, `interface`, `let`, `package`, `private`, `protected`, `public`, `static`, `yield`, `await`.
- **Subtle `this`-binding semantics** in non-strict code may also change (e.g., `this` no longer coerced to the global object inside plain function calls).

---

## 3. The `ignoreDeprecations` Escape Hatch

Set `"ignoreDeprecations": "6.0"` in tsconfig to silence all 6.0 deprecation warnings.

- **Will NOT work in TS 7.0** — all deprecations become hard errors regardless of this flag.
- **Valid values**: `"5.0"`, `"6.0"`.
- **Diagnostic codes triggered when deprecated options are present without this flag**:
  - **TS5101** — option deprecated, stops in {ver}; use `ignoreDeprecations`.
  - **TS5107** — option=value deprecated; use `ignoreDeprecations`.
  - **TS5111** — migration info (for `baseUrl`, `node10`, etc.).
- **Codes when removed options are present**:
  - **TS5102** — option removed; remove from config.
  - **TS5108** — option=value removed.
- **Invalid value**:
  - **TS5103** — invalid `ignoreDeprecations` value.

---

## 4. New Diagnostic Codes Quick Table

| Code | Message |
|---|---|
| 5011 | `rootDir` must be explicitly set |
| 5101 | Option deprecated, stops in {ver}; use `ignoreDeprecations` |
| 5102 | Option removed; remove from config |
| 5103 | Invalid `ignoreDeprecations` value |
| 5107 | Option=value deprecated; use `ignoreDeprecations` |
| 5108 | Option=value removed |
| 5111 | Migration info (links to aka.ms/ts6) |
| 5112 | tsconfig.json present but not loaded when files specified; use `--ignoreConfig` |

---

## 5. Tooling Behavior Changes

- **`tsc` with file arguments + tsconfig present → error TS5112** (PR https://github.com/microsoft/TypeScript/pull/62477). Previously silently ignored tsconfig. Use `tsc --ignoreConfig foo.ts` to compile individual files. Motivation noted in source: partly to stop AI agents from running `tsc foo.ts` with default settings and producing irrelevant errors.
- **New `--ignoreConfig` flag**: skips tsconfig.json when running tsc with file arguments.
- **New `--stableTypeOrdering` flag** (PR https://github.com/microsoft/TypeScript/pull/63084): diagnostic-only, makes TS 6's type ordering match TS 7's deterministic ordering. Up to 25% slowdown. Hidden from `tsc --help`. Use only when comparing 6 vs 7 output. NOTE: in TS 7.0 this is `true` by default and cannot be turned off.
- **`--moduleResolution bundler` now combinable with `--module commonjs`** (PR https://github.com/microsoft/TypeScript/pull/62320) — migration path off deprecated `node10` while still emitting CJS.

---

## 6. Language & stdlib Additions (Non-Breaking)

- **`this`-less functions no longer context-sensitive** (PR https://github.com/microsoft/TypeScript/pull/62243 by Mateusz Burzyński / Andarist). Method-syntax functions that never reference `this` now participate in the first inference pass. May subtly change inferred types — add explicit annotations if results shift unexpectedly.
- **`#/` subpath imports** supported under `node20`, `nodenext`, `bundler` moduleResolution (PR https://github.com/microsoft/TypeScript/pull/62844). Requires Node.js v24.14+ at runtime for the `#/` form (older Node needs a non-empty segment after `#`).
- **`es2025` target/lib** (PR https://github.com/microsoft/TypeScript/pull/63046): adds `Promise.try`, `Iterator` helpers, `Set` methods (`union`, `intersection`, `difference`), `RegExp.escape`. Moves some declarations from `esnext` into `es2025`.
- **Temporal API types** (PR https://github.com/microsoft/TypeScript/pull/62628): `Temporal.Instant`, `ZonedDateTime`, `PlainDate/Time/DateTime`, `PlainYearMonth/MonthDay`, `Duration`, `Now`. Under `esnext` or `temporal.esnext`. WARNING: polyfill incompatibility — `temporal-polyfill` / `@js-temporal/polyfill` are NOT interassignable with these lib declarations.
- **`Map.getOrInsert` / `Map.getOrInsertComputed`** (PR https://github.com/microsoft/TypeScript/pull/62612, also `WeakMap`). Stage 4 "upsert" proposal.
- **`RegExp.escape`** (in `es2025` lib, PR https://github.com/microsoft/TypeScript/pull/63046).
- **`dom` lib absorbs `dom.iterable` and `dom.asynciterable`** (PR https://github.com/microsoft/TypeScript/pull/62111). Old files are empty stubs. Simplify `"lib": ["dom", "dom.iterable", "es2020"]` to `"lib": ["dom", "es2020"]`. Same merge applies for the `webworker` lib.

---

## 7. The `ts5to6` Codemod

External tool by Andrew Branch (TypeScript team): https://github.com/andrewbranch/ts5to6

```bash
npx @andrewbranch/ts5to6 --fixBaseUrl .
npx @andrewbranch/ts5to6 --fixRootDir .
```

- **One fix mode per run.** Argument is path to tsconfig.json or directory.
- **`--fixBaseUrl` (`-b`)**: rewrites `paths` to be relative to tsconfig dir; adds wildcard catch-all `"*": ["./src/*"]` if needed; sets `"baseUrl": null` to clear inherited values from `node_modules` base configs.
- **`--fixRootDir` (`-r`)**: sets explicit `rootDir` matching what 5.9 would have inferred; skips `composite` and `outFile` projects.
- Works across monorepos, follows project references, handles `extends` chains.
- Microsoft's official blog describes it as "experimental" — review output before committing.

---

## 8. Migration Checklist (Priority Order)

Mirrors the official blog's "Up-Front Adjustments" priority.

### Priority 1 — Most projects need these

1. Set `"types": ["node"]` (or list the specific `@types` you need).
2. Set `"rootDir": "./src"` if source files live in a subdirectory.
3. Decide on `strict: true` — embrace it or set `"strict": false` explicitly.

### Priority 2 — Common adjustments

4. Set explicit `target` if not `es2025`.
5. Set explicit `module` if you need `commonjs` output.
6. Remove `baseUrl`; inline prefix into `paths`.
7. Replace `import * as x from "cjs-module"` with `import x from "cjs-module"`.
8. Replace `import ... assert { }` with `import ... with { }`.
9. Replace `module Foo { }` with `namespace Foo { }`.
10. Update scripts running `tsc <file>` (now errors if tsconfig exists; use `--ignoreConfig`).
11. Set `"noUncheckedSideEffectImports": false` if side-effect imports don't resolve (e.g., bundler-handled CSS).
12. Set `"libReplacement": true` if using `@typescript/lib-*` replacement packages.

### Priority 3 — Remove deprecated options

13. Remove `downlevelIteration`.
14. Migrate `moduleResolution` from `node` / `node10` / `classic` to `nodenext` or `bundler`.
15. Migrate `module` from `amd` / `umd` / `systemjs` / `none`.
16. Remove `outFile`; adopt a bundler.
17. Remove `alwaysStrict: false`, `esModuleInterop: false`, `allowSyntheticDefaultImports: false`.
18. Remove `/// <reference no-default-lib="true"/>`.

### Priority 4 — Quick wins

19. Simplify `"lib": ["dom", "dom.iterable"]` to `"lib": ["dom"]`.
20. Consider `target: "es2025"` for `RegExp.escape` types.
21. Adopt `Map.getOrInsert` / `getOrInsertComputed`.

### Temporary escape hatch

`"ignoreDeprecations": "6.0"` — silences 6.0 warnings; does NOT work in 7.0.

---

## 9. Sources

- Official TS 6.0 beta: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/ (2026-02-11)
- TS 6.0 Iteration Plan: https://github.com/microsoft/TypeScript/issues/63085
- TS 6 to 7 official CHANGES.md: https://github.com/microsoft/typescript-go/blob/main/CHANGES.md
- ts5to6 codemod: https://github.com/andrewbranch/ts5to6
