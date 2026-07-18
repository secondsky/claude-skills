# typescript-migration scripts

All scripts are **read-only detection/audit helpers**. None modify user source. The only external mutation permitted by the skill is the official `ts5to6` codemod, invoked separately and only with explicit user approval.

| Script | Purpose |
|---|---|
| `detect-ts-version.sh` | Read package.json + node_modules + `tsc --version` to report installed TS version and classify (5.x / 6.x / 7.x). |
| `audit-ts7-breakers.sh` | Grep for tooling and tsconfig patterns that will break or need attention under TS 7 (Compiler-API tools, Volar/Angular, deprecated options, `module` keyword, `assert` imports). |
| `ts6-deprecation-scan.sh` | Run `tsc --noEmit` and tally TS5xxx deprecation/removal diagnostic codes (TS5011, TS5101-5108, TS5111, TS5112). |
| `compare-tsc7-tsc6.sh` | Run TS 7 `tsc` and TS 6 `tsc6` side-by-side and diff diagnostic-code counts. Microsoft's official CI safety-net pattern. |

## Usage

```bash
./scripts/detect-ts-version.sh
./scripts/audit-ts7-breakers.sh [path]
./scripts/ts6-deprecation-scan.sh [tsconfig-path]
./scripts/compare-tsc7-tsc6.sh [tsconfig-path]
```

All scripts require `jq` for JSON parsing where applicable. `compare-tsc7-tsc6.sh` additionally requires `@typescript/typescript6` installed.
