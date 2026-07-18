# Unverified or Conflicting Third-Party Claims — Refusal List

Several popular TypeScript migration tutorials contain claims that conflict with Microsoft's official TypeScript 6.0 beta announcement (2026-02-11) or the TypeScript 7.0 release announcement (2026-07-08). When asked about any of these claims, DO NOT assert them as fact. Either (a) cite the authoritative source that contradicts them, or (b) say "this claim is unverified against official sources" and stop.

---

## Claim 1: "TS 6's `moduleResolution` default is `node16`"

- **Source**: jsmanifest.com article on TS 6 breaking changes.
- **Authoritative answer**: Default is **`bundler`** (resolved from `module`). Cited in the official TS 6.0 beta blog and in TypeScript source `src/compiler/utilities.ts:9077-9098`. `node16` is not the default. Do not assert `node16` as the new default.

---

## Claim 2: "TS 6 adds a `--ts6-migration` CLI flag that runs static analysis and reports breaking patterns with line numbers"

- **Source**: jsmanifest.com article.
- **Authoritative answer**: This flag does **not exist**. Not mentioned in the official TS 6.0 beta blog, not in the TypeScript PR tracker, not in `tsc --help`. The real diagnostic flags are `--ignoreConfig` and `--stableTypeOrdering`. Treat any advice to "run `tsc --ts6-migration`" as incorrect.

---

## Claim 3: "ES5 target support is removed entirely in TS 6"

- **Source**: jsmanifest.com article.
- **Authoritative answer**: ES5 is **deprecated** in TS 6.0 (still works with a warning), and **removed in TS 7.0**. The official TS 6.0 beta blog says "the `target: es5` option is deprecated." Do not tell users ES5 is gone in 6.0.

---

## Claim 4: "TS 6 removed `--keyofStringsOnly`"

- **Source**: jsmanifest.com article.
- **Authoritative answer**: Not mentioned in the official TS 6.0 beta blog or the TypeScript PR tracker for 6.0. `--keyofStringsOnly` was deprecated back in TS 5.4; its removal status in 6.0 is **unverified**. Do not assert this without checking the 6.0 release notes directly.

---

## Claim 5: "Namespace augmentation across module boundaries is removed in TS 6"

- **Source**: jsmanifest.com article.
- **Authoritative answer**: Misleading. Only the **`module` keyword** (vs `namespace` keyword) for declaring namespaces is deprecated (PR https://github.com/microsoft/TypeScript/pull/62876). Standard `namespace Foo {}` declaration merging and augmentation across files continues to work. Do not advise interface-merging as a workaround based solely on this claim.

---

## Claim 6: "TS 6 delivers a 15–30% type-checking speedup from internal cache optimizations"

- **Source**: jsmanifest.com article.
- **Authoritative answer**: The official TS 6.0 beta blog cites **20–50% build-time improvement specifically from setting `types` explicitly** (avoiding scanning hundreds of `@types` packages) — not a general compiler speedup from cache rewrites. The jsmanifest framing is unverified and the mechanism is wrong.

---

## Claim 7: "`skipLibCheck` now defaults to `false` in TS 6"

- **Source**: jsmanifest.com article.
- **Authoritative answer**: `skipLibCheck` was already `false` by default in TS 5.x. This is a non-change stated as a breaking change. Misleading.

---

## Claim 8 (previously conflicted, now resolved): "TS 7's package name is `@typescript/native` / `@typescript/tsgo` / `@typescript/native-preview`"

- **Sources**: Various third-party articles written during the RC/preview period (sitepoint.com, codingdunia.com, picode.bunnode.com).
- **Authoritative answer** (from official TS 7.0 release blog, 2026-07-08): The standard **`typescript`** npm package IS TypeScript 7.0. Install with `npm install -D typescript`. `@typescript/native-preview` was the **nightly preview** package during development; nightlies now resume under `typescript@next`. For side-by-side with TS 6, use the official `@typescript/typescript6` compat package.

---

## Claim 9 (previously conflicted, now resolved): "TS 7 requires VS Code setting `typescript.tsserver.useTsgo` / `typescript.experimental.useTsgo` / `typescript.preferences.useLegacyService`"

- **Sources**: Various third-party articles.
- **Authoritative answer**: No setting key is needed. Install the official VS Code extension `TypeScriptTeam.native-preview`; it **auto-enables** as the default language server. Toggle via Command Palette commands "Disable TypeScript 7 Language Server" / "Enable TypeScript 7 Language Server". (Note: support will ship in VS Code itself in the coming weeks per the 7.0 blog.)

---

## Claim 10 (previously conflicted, now resolved): "TS 7 is in RC status / experimental / stable-since-Jan-2026"

- **Sources**: sitepoint.com (June 2026, called it RC), picode.bunnode.com (Feb 2026, called it stable Jan 2026), compatibility-guide (called it experimental).
- **Authoritative answer**: TS 7.0 was released **stable on 2026-07-08** per the official announcement. Third-party articles written earlier reflect the state at their publication date, not the current state.

---

## Claim 11 (third-party overstatement): "TS 7 reduces memory usage by 50–70%"

- **Sources**: sitepoint.com, codingdunia.com.
- **Authoritative answer**: The official TS 7.0 release blog reports **6–26% memory reduction** across real-world codebases:
  - vscode: 5.2GB to 4.2GB = −18%
  - sentry: 4.9GB to 4.6GB = −6%
  - bluesky: 1.8GB to 1.3GB = −26%
  - playwright: 1.0GB to 0.9GB = −11%
  - tldraw: 0.6GB to 0.5GB = −15%

  The 50–70% figure is not supported by official data.

---

## How to Use This File

When the user mentions or asks about any of the above claims:

1. **Do not assert the claim as fact.**
2. Cite the authoritative source listed here.
3. If pressed, offer to verify against the official TypeScript blog or the typescript-go CHANGES.md tracker.

---

## Sources

- Official TS 6.0 beta: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/
- Official TS 7.0 release: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- TS 6 to 7 official CHANGES.md: https://github.com/microsoft/typescript-go/blob/main/CHANGES.md
- Privatenumber gist (cites TS PR numbers — secondary corroboration only): https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f
