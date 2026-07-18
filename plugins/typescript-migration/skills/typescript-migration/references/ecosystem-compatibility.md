# TS 7 Ecosystem Compatibility Matrix

Per-tool status under TypeScript 7.0 (released 2026-07-08). The root cause for most breakage: **TS 7.0 does not ship a programmatic Compiler API** (`ts.createProgram`, `ts.createSourceFile`, etc. are gone). TS 7.1 will ship a new, different API. Until then, use the official `@typescript/typescript6` side-by-side pattern.

| Tool | Status | Why | Fix |
|---|---|---|---|
| **typescript-eslint** | Works via alias | Imports `typescript` for the API | Use `@typescript/typescript6` npm alias pattern; or wait for TS 7.1 + typescript-eslint update |
| **ts-morph** | Broken on TS 7 | Wraps the Compiler API | Stay on TS 6 until TS 7.1 ships new API; or run side-by-side |
| **ts-node** (type-check mode) | Broken on TS 7 | Delegates compilation to `tsc` | Replace with **`tsx`** (esbuild-powered, type-strips without type-checking); run `tsc --noEmit` (or `tsgo`) in CI separately. Alt: Node 22.6+ `--experimental-strip-types` |
| **tsx** | Works | Own esbuild-based parser, no Compiler API dependency | Preferred replacement for ts-node |
| **ts-jest** | Broken on TS 7 | Uses Compiler API for type-checking transform | Switch to **esbuild-loader** / **swc** for transpilation; run `tsc --noEmit` separately in CI; or use `@typescript/typescript6` alias |
| **ts-loader** (full type-check mode) | Broken on TS 7 | Calls Compiler API for type-checking | Use `transpileOnly: true` (bypasses type-check) + separate `tsc --noEmit` step; or switch to `esbuild-loader` |
| **ts-loader** (`transpileOnly`) | Works | Does not invoke Compiler API | Set `transpileOnly: true` |
| **esbuild / esbuild-loader** | Works | Has its own TS parser | Use for transpilation; pair with `tsc --noEmit` for type-checking |
| **swc / @swc/core** | Works | Has its own TS parser | Use for transpilation |
| **Oxc** | Works | Native Rust TS parser | Recommended replacement for custom AST transformers |
| **vite** | Works (Vite 6+) | esbuild-based | Set `"moduleResolution": "bundler"` in tsconfig |
| **webpack (ts-loader)** | See ts-loader rows | — | — |
| **babel @babel/preset-typescript** | Works | Type-strips, no type-checking | Pair with `tsc --noEmit` for type-checking |
| **vitest** | Works | Does not type-check by default | Run `tsc --noEmit` separately in CI |
| **jest (babel mode)** | Works | Babel-based | — |
| **Angular (template type-checking)** | Partial | Template type-checker needs Compiler API | Microsoft's official split: TS 7 at CLI for fast error detection, TS 6 in editor |
| **Vue / Volar** | Not yet supported | Volar embeds TS via Compiler API | **Stay on TS 6** until Volar migrates; VS Code: "Disable TS 7 Language Server" |
| **Svelte / Astro / MDX** | Not yet supported | Same as Vue (Volar/embedded TS) | **Stay on TS 6** until tooling migrates |
| **ts-patch / ttypescript** | Broken | Custom AST transformer plugins; Compiler API gone | Migrate transformations to **Oxc** or **SWC**; keep TS 6 for transformer pipeline |
| **typia** | Broken | Uses Compiler API for type generation | Wait for typia update; or keep TS 6 for generation step |
| **ttypescript** | Broken | Patches the TS compiler for transformers | Migrate to Oxc/SWC; keep TS 6 |
| **language-service plugins** | Varies | Many rely on the old tsserver API | Test individually; check tool's repo |
| **monaco-editor / in-browser TS** | Likely broken | Compiler API usage; also Go→WASM is inefficient | Run both: JS `typescript@6` client-side, TS 7 server-side |
| **playground-elements** | Likely broken | Browser-based TS via WASM | Same as monaco |
| **Deno / Bun** | Native integrations expected | TS 7 can be used as a library | Follow respective project docs |

## Detection Markers

To detect these tools in a user's project before recommending TS 7, grep:

```bash
grep -E "ts-patch|ttypescript|typia|ts-node|ts-jest|ts-loader|ts-morph" \
  package.json package-lock.json tsconfig*.json
```

And check for Volar / embedded-language tooling:

```bash
grep -E "volar|@vue/language|svelte-check|astro|@mdx" package.json
```

## The `@typescript/typescript6` Side-by-Side Pattern (Microsoft Official)

For any tool in the "Broken / Works via alias" category above, apply this `package.json` pattern:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

- `npx tsc` runs TS 7.
- `import * as ts from "typescript"` (used by typescript-eslint, ts-morph) gets TS 6's API.
- `tsc6` executable also available.
- Remove this workaround once TS 7.1 ships the new API and your tooling supports it.

## Sources

- TS 7.0 release blog (Compiler API / Volar / Angular section): https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- TS 6→7 CHANGES.md: https://github.com/microsoft/typescript-go/blob/main/CHANGES.md
- typescript-eslint docs: https://typescript-eslint.io
