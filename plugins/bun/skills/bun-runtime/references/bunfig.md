# bunfig.toml Configuration Reference

Complete reference for configuring Bun's behavior via `bunfig.toml`.

## File Locations

**Local** (project root): `bunfig.toml`
**Global**: `$HOME/.bunfig.toml` or `$XDG_CONFIG_HOME/.bunfig.toml`

Local settings override global. CLI flags override both.

## Runtime Configuration

### preload

Load scripts/plugins before running files:

```toml
preload = ["./preload.ts"]
```

### jsx

Configure JSX handling (also settable in tsconfig.json):

```toml
jsx = "react"
jsxFactory = "h"
jsxFragment = "Fragment"
jsxImportSource = "react"
```

### smol

Reduce memory usage at cost of performance:

```toml
smol = true
```

### logLevel

Set log verbosity:

```toml
logLevel = "debug"  # "debug" | "warn" | "error"
```

### define

Replace global identifiers with constant expressions:

```toml
[define]
"process.env.bagel" = "'lox'"
```

### loader

Map file extensions to loaders:

```toml
[loader]
".bagel" = "tsx"
```

Available loaders: `jsx`, `js`, `ts`, `tsx`, `json`, `jsonc`, `toml`, `yaml`, `css`, `html`, `text`, `wasm`, `napi`, `file`, `sh`

### telemetry

Enable/disable analytics and crash reports:

```toml
telemetry = false
```

### env

Configure .env file loading:

```toml
# Disable automatic .env loading
env = false

# Or use object syntax
[env]
file = false
```

### console

Configure console output:

```toml
[console]
depth = 3  # Default: 2
```

## Test Runner Configuration

```toml
[test]
root = "./__tests__"
preload = ["./setup.ts"]
smol = true
coverage = true
coverageThreshold = 0.9
coverageSkipTestFiles = false
coveragePathIgnorePatterns = ["**/*.spec.ts", "**/*.test.ts"]
coverageReporter = ["text", "lcov"]
coverageDir = "coverage"
randomize = true
seed = 2444615283
rerunEach = 3
concurrentTestGlob = "**/concurrent-*.test.ts"
onlyFailures = true

[test.reporter]
dots = true
junit = "test-results.xml"
```

### Coverage Threshold Options

```toml
# Single threshold for all
coverageThreshold = 0.9

# Per-type thresholds
coverageThreshold = { line = 0.7, function = 0.8, statement = 0.9 }
```

## Package Manager Configuration

```toml
[install]
optional = true              # Install optionalDependencies
dev = true                   # Install devDependencies
peer = true                  # Install peerDependencies
production = false           # Production mode
exact = false                # Use exact versions in package.json
saveTextLockfile = true      # Use text-based bun.lock
auto = "auto"                # Auto-install behavior
frozenLockfile = false       # Don't update lockfile
dryRun = false               # Don't actually install
globalDir = "~/.bun/install/global"
globalBinDir = "~/.bun/bin"
registry = "https://registry.npmjs.org"
linkWorkspacePackages = true
linker = "hoisted"           # "hoisted" | "isolated"
minimumReleaseAge = 259200   # 3 days in seconds
minimumReleaseAgeExcludes = ["@types/bun", "typescript"]
```

### Auto-install Values

| Value | Description |
|-------|-------------|
| `"auto"` | Auto-install when no node_modules |
| `"force"` | Always auto-install |
| `"disable"` | Never auto-install |
| `"fallback"` | Check local first, then auto-install missing |

### Scoped Registries

```toml
[install.scopes]
myorg = "https://username:password@registry.myorg.com/"
myorg = { username = "myusername", password = "$npm_password", url = "https://registry.myorg.com/" }
myorg = { token = "$npm_token", url = "https://registry.myorg.com/" }
```

### Cache Configuration

```toml
[install.cache]
dir = "~/.bun/install/cache"
disable = false
disableManifest = false
```

### Lockfile Configuration

```toml
[install.lockfile]
save = true
print = "yarn"  # Generate yarn.lock alongside bun.lock
```

### Security Scanner

```toml
[install.security]
scanner = "@acme/bun-security-scanner"
```

### CA Certificates

```toml
[install]
ca = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
cafile = "path/to/cafile"
```

## bun run Configuration

```toml
[run]
shell = "system"  # "system" | "bun"
bun = true        # Auto-alias node to bun
silent = true     # Suppress command output
```

## Debug Configuration

```toml
[debug]
editor = "code"  # Editor for blob:/src: links
```

Available editors: `subl`, `sublime`, `vscode`, `code`, `textmate`, `mate`, `idea`, `webstorm`, `nvim`, `neovim`, `vim`, `vi`, `emacs`

## Complete Example

```toml
# Runtime
preload = ["./setup.ts"]
smol = false
logLevel = "warn"
telemetry = false

[define]
"process.env.NODE_ENV" = "'production'"

[loader]
".graphql" = "text"

[console]
depth = 4

# Testing
[test]
root = "./tests"
coverage = true
coverageThreshold = { line = 0.8, function = 0.9 }
coverageReporter = ["text", "lcov"]

# Package Manager
[install]
production = false
exact = false
saveTextLockfile = true
linker = "isolated"

[install.scopes]
company = { token = "$NPM_TOKEN", url = "https://npm.company.com/" }

# bun run
[run]
shell = "bun"
bun = true
silent = false
```
