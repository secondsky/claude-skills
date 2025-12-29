# Bun Package Manager CLI Reference

## bun install

```bash
bun install [flags]
```

### General Configuration

| Flag | Description |
|------|-------------|
| `--config` | Path to bunfig.toml |
| `--cwd` | Set working directory |

### Dependency Scope

| Flag | Description |
|------|-------------|
| `--production` | Skip devDependencies |
| `--no-save` | Don't update package.json |
| `--save` | Save to package.json (default) |
| `--omit` | Exclude `dev`, `optional`, or `peer` |
| `--only-missing` | Only add if not present |

### Dependency Type

| Flag | Description |
|------|-------------|
| `--dev`, `-D` | Add to devDependencies |
| `--optional`, `-O` | Add to optionalDependencies |
| `--peer` | Add to peerDependencies |
| `--exact`, `-E` | Use exact version |

### Lockfile

| Flag | Description |
|------|-------------|
| `--yarn` | Write yarn.lock |
| `--frozen-lockfile` | Disallow lockfile changes |
| `--save-text-lockfile` | Use text lockfile |
| `--lockfile-only` | Only update lockfile |

### Network

| Flag | Description |
|------|-------------|
| `--ca` | CA certificate |
| `--cafile` | CA certificate file |
| `--registry` | Override npm registry |

### Installation Control

| Flag | Description |
|------|-------------|
| `--dry-run` | Don't install anything |
| `--force` | Force reinstall |
| `--global`, `-g` | Install globally |
| `--backend` | `clonefile`, `hardlink`, `symlink`, `copyfile` |
| `--filter` | Install for matching workspaces |

### Cache

| Flag | Description |
|------|-------------|
| `--cache-dir` | Cache directory |
| `--no-cache` | Ignore manifest cache |

### Output

| Flag | Description |
|------|-------------|
| `--silent` | No output |
| `--verbose` | Debug output |
| `--no-progress` | Hide progress bar |
| `--no-summary` | Hide summary |

### Security

| Flag | Description |
|------|-------------|
| `--no-verify` | Skip integrity check |
| `--trust` | Add to trustedDependencies |

### Performance

| Flag | Description |
|------|-------------|
| `--concurrent-scripts` | Max concurrent scripts |
| `--network-concurrency` | Max network requests (default: 48) |

### Lifecycle

| Flag | Description |
|------|-------------|
| `--ignore-scripts` | Skip lifecycle scripts |

## bun add

```bash
bun add <packages> [flags]
```

All `bun install` flags plus:

```bash
bun add react                  # Latest
bun add react@19               # Major version
bun add react@19.1.1           # Exact version
bun add react@latest           # Latest tag
bun add react@next             # Next tag
bun add -D typescript          # Dev dependency
bun add -O fsevents            # Optional dependency
```

## bun remove

```bash
bun remove <packages>
```

Removes from package.json and node_modules.

## bun update

```bash
bun update [packages]
```

Updates packages to latest allowed by semver.

```bash
bun update           # Update all
bun update react     # Update specific
bun update --latest  # Ignore semver ranges
```

## bunx

```bash
bunx <package> [args]
```

Run package binary (like npx):

```bash
bunx create-next-app my-app
bunx tsc --version
bunx prisma generate
```

## bun pm

Package manager utilities:

```bash
bun pm cache rm           # Clear cache
bun pm cache              # Show cache path
bun pm bin                # Show bin directory
bun pm bin -g             # Global bin directory
bun pm ls                 # List installed packages
bun pm hash               # Show lockfile hash
bun pm hash-string        # Deterministic hash
bun pm hash-print         # Print hash details
bun pm migrate            # Migrate from other PMs
```

## bun link

```bash
# In package directory
bun link

# In consuming project
bun link <package-name>

# Unlink
bun unlink
bun unlink <package-name>
```

## bun publish

```bash
bun publish [flags]
```

Publish to npm registry.

## bun outdated

```bash
bun outdated           # Show outdated packages
bun outdated --filter  # Filter workspaces
```

## bun why

```bash
bun why <package>      # Show why installed
```

## bun audit

```bash
bun audit              # Check for vulnerabilities
```

## bun patch

```bash
bun patch <package>    # Create patch
bun patch --commit     # Apply patch
```
