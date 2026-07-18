# TypeScript 7.0 (Native Go Port / "Corsa") — Authoritative Reference

> Sourced from Microsoft's official TypeScript 7.0 release announcement (2026-07-08). TS 7.0 is the first native-Go release of the TypeScript compiler. Released stable on July 8, 2026.

## 1. What TS 7 Actually Is

- A full rewrite of the TypeScript compiler in Go, internally codenamed **"Corsa"** / "Project Corsa".
- Ships as a native Go binary, but is distributed via the **standard `typescript` npm package**: `npm install -D typescript`. `npx tsc` runs it.
- Maintained by Microsoft / the TypeScript team. Source: `github.com/microsoft/typescript-go`.
- The port was done "as faithfully as possible, writing new code while maintaining the structure and logic of the original codebase to keep results consistent and compatible between the two compilers."
- Brings native code speed, shared-memory multithreading, and optimizations that typically yield **8x–12x speedups** on full builds.
- TypeScript language semantics and `tsconfig.json` are intended to be preserved. "Existing TypeScript code does not need syntax changes."

## 2. Installation

**Stable release (primary):**
```bash
npm install -D typescript
```
This installs TS 7.0 as the `tsc` binary. Run via `npx tsc`.

**Nightly builds:**
```bash
npm install -D typescript@next
```
(The legacy `@typescript/native-preview` package was the preview nightly during development. Going forward, nightlies are under the standard `typescript` package with the `next` tag.)

**Side-by-side with TS 6 (official compat pattern)** — for projects whose tooling needs the TS Compiler API (typescript-eslint, ts-morph, etc.):
```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```
- `npx tsc` runs TS 7 (via the `@typescript/native` alias).
- Tools that import `typescript` transparently get TS 6's API via `@typescript/typescript6`.
- A `tsc6` executable is also available if you need to invoke TS 6 directly.
- This is Microsoft's **official** bridge until TS 7.1 ships a new programmatic API.

## 3. What's New in TS 7

**Performance — official numbers (real OSS codebases, `--checkers 4` default):**

| Codebase | TS 6 | TS 7 | Speedup |
|---|---|---|---|
| vscode | 125.7s | 10.6s | 11.9x |
| sentry | 139.8s | 15.7s | 8.9x |
| bluesky | 24.3s | 2.8s | 8.7x |
| playwright | 12.8s | 1.47s | 8.7x |
| tldraw | 11.2s | 1.46s | 7.7x |

With `--checkers 8`:

| Codebase | TS 6 | TS 7 (`--checkers 8`) | Speedup |
|---|---|---|---|
| vscode | 125.7s | 7.51s | 16.7x |
| sentry | 139.8s | 12.08s | 11.6x |
| bluesky | 24.3s | 2.01s | 12.1x |
| playwright | 12.8s | 1.16s | 11x |
| tldraw | 11.2s | 1.06s | 10.6x |

**Memory reduction — official (NOT the 50–70% claimed by some third parties):**

| Codebase | TS 6 | TS 7 | Memory Delta |
|---|---|---|---|
| vscode | 5.2GB | 4.2GB | −18% |
| sentry | 4.9GB | 4.6GB | −6% |
| bluesky | 1.8GB | 1.3GB | −26% |
| playwright | 1.0GB | 0.9GB | −11% |
| tldraw | 0.6GB | 0.5GB | −15% |

**Editor experience**: VS Code's codebase — opening a file with an error previously took ~17.5s to show the first error; with TS 7 it's under 1.3s (over 13x faster).

**New parallelization flags:**
- `--checkers N` (default 4) — number of type-checker workers. Type-checking uses a fixed number of workers that always divide files identically, ensuring deterministic results. Increasing speeds up large codebases at the cost of memory. Decrease to `--checkers 1` on CI runners with few cores.
- `--builders N` — number of parallel project reference builders under `--build`. Helpful for monorepos. Has a multiplicative effect with `--checkers` (e.g., `--checkers 4 --builders 4` allows up to 16 type-checkers).
- `--singleThreaded` — disables all parallelization (parsing, type-checking, emitting). Useful for debugging, comparing with TS 6, or constrained environments.

**Rebuilt `--watch` mode**: now powered by a Go port of the Parcel bundler's file watcher (`@parcel/watcher`). Significant resource improvements cross-platform. (Microsoft thanked Devon Govett for the original Parcel work.)

**Stability claims**: TS 7.0's new language server has **reduced failing language-server commands by over 80%** and **reduced server crashes by over 60%** vs TS 6.0.

**Production endorsements (from official blog)**: VS Code team, Slack (-40% merge queue time, type-check CI from 7.5min → 1.25min), Vanta (up to 9x faster), Microsoft News Services (400 hrs/month CI saved), PowerBI, Loop, Office, Teams, Xbox, Canva (first-error time 58s → 4.8s). External companies that tested: Bloomberg, Canva, Figma, Google, Lattice, Linear, Miro, Notion, Sentry, Slack, Vanta, Vercel, VoidZero.

## 4. Breaking Changes vs TS 6

**Golden rule**: TS 7 removes everything TS 6 deprecated. Quoting the official blog: "TypeScript 7.0 adopts 6.0's new defaults, and provides hard errors in the face of any flags and constructs deprecated in TypeScript 6.0."

**Defaults adopted from 6.0:**
- `strict` is `true` by default.
- `module` defaults to `esnext`.
- `target` defaults to the current stable ECMAScript version immediately preceding `esnext` (currently `es2025`).
- `noUncheckedSideEffectImports` is `true` by default.
- `libReplacement` is `false` by default.
- **`stableTypeOrdering` is `true` by default and CANNOT be turned off.** (In TS 6 this was an opt-in diagnostic flag with up to 25% slowdown; in TS 7 it's always on and free.)
- `rootDir` defaults to `./` (tsconfig dir) — inner source dirs must be set explicitly.
- `types` defaults to `[]` — restore old behavior with `"types": ["*"]`.

**Hard errors (deprecated in 6.0, removed in 7.0):**
- `target: es5` — no longer supported. Use `es2015`+ or external transpiler.
- `downlevelIteration` — no longer supported.
- `moduleResolution: node` / `node10` — no longer supported. Use `nodenext` or `bundler`.
- `module: amd` / `umd` / `systemjs` / `none` — no longer supported. Use `esnext` or `preserve` with bundlers.
- `baseUrl` — no longer supported. Update `paths` to be relative to the project root.
- `moduleResolution: classic` — no longer supported. Use `bundler` or `nodenext`.
- `esModuleInterop: false` and `allowSyntheticDefaultImports: false` — cannot be set to `false`.
- `alwaysStrict` — assumed `true`, cannot be set to `false`.
- The `module` keyword cannot be used in namespace declarations (use `namespace`).
- The `asserts` keyword cannot be used on imports (use `with`).
- `/// <reference no-default-lib />` directives no longer respected under `skipDefaultLibCheck`.
- Command-line builds cannot take file paths when tsconfig.json is in the cwd unless `--ignoreConfig` is passed.

**NEW breaking changes not present in TS 6:**

1. **`preserveConstEnums` removed** — the Go compiler always emits const enum declarations (equivalent to old `preserveConstEnums: true`). Behavioral change if you relied on const enum *inlining* across module boundaries. Test runtime JS output carefully.

2. **Template literal types now preserve Unicode code points.** Previously TS followed JS UTF-16 indexing and split surrogate pairs:
   ```typescript
   type HeadTail<S> = S extends `${infer Head}${infer Tail}` ? [Head, Tail] : never;
   type Result = HeadTail<"😀abc">;
   // TS 7:  ["😀", "abc"]
   // TS 6:  ["\ud83d", "\ude00abc"]
   ```
   Breaks type-level string utilities that intentionally modeled UTF-16 code units (e.g., some `Length` utilities). New behavior matches `for...of` / spread intuition.

3. **JavaScript file handling reworked** — `.js` files now analyzed more consistently with `.ts`. Specific changes:
   - Values cannot be used where types are expected — use `typeof someValue`.
   - `@enum` is no longer specially recognized — create a `@typedef` on `(typeof YourEnumDeclaration)[keyof typeof YourEnumDeclaration]`.
   - A standalone `?` is no longer usable as a type — use `any`.
   - `@class` does not make a function a constructor — use a `class` declaration.
   - Postfix `!` is not supported — just use `T`.
   - Type names must be defined within a `@typedef` tag (i.e., `/** @typedef {T} TypeAliasName */`), not adjacent to an identifier.
   - Closure-style function syntax (e.g., `function(string): void`) is no longer supported — use TS shorthands (e.g., `(s: string) => void`).
   - Some patterns like aliasing `this` and reassigning the entirety of a function's `prototype` are no longer specially treated.
   - Authoritative diff tracker: `github.com/microsoft/typescript-go/blob/main/CHANGES.md`.

## 5. What Does NOT Ship in TS 7.0

- **No programmatic Compiler API.** TS 7.0 does not expose `ts.createProgram`, `ts.createSourceFile`, `ts.forEachChild`, etc. Tools built on this API (ts-morph, ts-node in type-checking mode, ts-jest, ts-loader in full-check mode, ts-patch, ttypescript, typia, Angular's legacy transformer pipeline, Volar for Vue/Svelte/Astro/MDX) cannot use TS 7 directly. **TS 7.1 will ship a new (and different) API.** Microsoft's bridge until then is the `@typescript/typescript6` compat package (see Installation §2).

- **`--declarationMap`**: not implemented in TS 7.0 RC; verify status in the CHANGES.md tracker before relying on it. The blog does not confirm it shipped in 7.0 stable.

- **Volar-based workflows (Vue, Svelte, Astro, MDX) cannot yet leverage TS 7** — these tools embed TypeScript via the programmatic API. Microsoft is "actively working with the maintainers of these projects." Official recommendation: **stay on TS 6.0 for these workflows.** VS Code escape hatch: run "Disable TypeScript 7 Language Server" command.

- **Angular template type-checking**: specialized template type-checking cannot use TS 7 yet. Microsoft's recommended split: use TS 7 at the CLI for fast project-wide error detection via `tsc`, and TS 6.0 for editor support.

- **JetBrains IDEs**: rely on their own integration timing; check JetBrains docs.

## 6. tsconfig Differences

Compatible overall — "most `tsconfig.json` files work without changes" once TS 6 deprecations are addressed.

Removed: `preserveConstEnums` (always-emits now).

Always-on (cannot disable): `stableTypeOrdering`.

New CLI flags (not tsconfig options): `--checkers`, `--builders`, `--singleThreaded`, `--ignoreConfig` (inherited from TS 6).

## 7. Editor / IDE Setup

**VS Code**:
- Install the official extension: `TypeScriptTeam.native-preview` (https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview).
- It **auto-enables** as the default language server. No `settings.json` key needed.
- Toggle via Command Palette: "Disable TypeScript 7 Language Server" / "Enable TypeScript 7 Language Server".
- Support will ship as part of VS Code itself in the coming weeks (per the 7.0 blog).

**Visual Studio**: latest version auto-enables TS 7 based on workspace. No action needed.

**Other editors**: any LSP-based editor works. Vim/Emacs: install `typescript-language-server@latest`.

## 8. Diagnostic Codes

Codes are identical between TS 6 and TS 7; **message wording differs**. When diffing compiler output or building tooling, match on `TSxxxx` codes, not on message text.

## 9. Known Issues & Caveats

- `.tsbuildinfo` files are **incompatible** between the JS and Go compilers. Delete stale `.tsbuildinfo` before the first TS 7 run.
- Varying `--checkers` count may surface order-dependent results in rare cases. Pin a fixed value across environments for consistency.
- Varying `--builders` should not produce different results.
- The Go compiler cannot be `import`ed as a Node.js library (no in-process API). IPC/LSP bridge planned but not in 7.0.
- Vue/Svelte/Astro/MDX/Angular-template gaps (see §5).
- typescript-eslint needs the `@typescript/typescript6` alias pattern until TS 7.1 ships the new API.

## 10. When to Adopt TS 7 (and When Not To)

**Adopt now if:**
- Greenfield project with no Compiler-API-dependent tooling.
- Existing TS project already clean on TS 6 (zero deprecation warnings).
- CI type-check is slow (>10s, 500+ files) — the speedup is the headline win.
- Editor language-server latency is hurting the team.

**Do NOT adopt yet if:**
- Vue / Svelte / Astro / MDX / Angular-template project relying on Volar/template type-checking.
- Toolchain depends on ts-morph, ts-patch, ttypescript, typia, or custom AST transformers.
- Risk-averse production environment where any behavioral divergence is unacceptable — wait for 7.1 and the CHANGES.md tracker to clear.
- `declarationMap` is critical to your library consumers (verify status first).

## 11. Side-by-Side Migration Path (Recommended for Most Existing Projects)

1. Migrate to TS 6.0 first. Achieve zero deprecation warnings (remove `ignoreDeprecations: "6.0"`).
2. Add the side-by-side alias pattern to `package.json`:
   ```json
   {
     "devDependencies": {
       "@typescript/native": "npm:typescript@^7.0.2",
       "typescript": "npm:@typescript/typescript6@^6.0.2"
     }
   }
   ```
3. Run both compilers in CI: `npx tsc --noEmit` (TS 7) and `npx tsc6 --noEmit` (TS 6).
4. Diff diagnostic codes — they should match. Investigate any divergence.
5. Once both pass identically, switch editor to TS 7.
6. Remove the alias workaround once TS 7.1 ships and your tooling supports the new API.

## 12. Sources

- Official TS 7.0 release: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ (2026-07-08)
- Official TS 7.0 RC: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-rc/ (2026-06-18)
- Official TS 7.0 Beta: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/ (2026-04-21)
- TS Native port unveiling: https://devblogs.microsoft.com/typescript/typescript-native-port/
- December 2025 progress update: https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/
- TS 6→7 CHANGES.md: https://github.com/microsoft/typescript-go/blob/main/CHANGES.md
- typescript-go repo: https://github.com/microsoft/typescript-go
- VS Code TS 7 extension: https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview
