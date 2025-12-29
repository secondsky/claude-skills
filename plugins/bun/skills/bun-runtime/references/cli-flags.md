# Bun CLI Flags Reference

Complete reference for `bun run` CLI flags and options.

## General Execution

| Flag | Description |
|------|-------------|
| `--silent` | Don't print the script command |
| `--if-present` | Exit without error if entrypoint doesn't exist |
| `--eval`, `-e` | Evaluate argument as script |
| `--print`, `-p` | Evaluate and print result |
| `--help`, `-h` | Display help menu |

## Workspace Management

| Flag | Description |
|------|-------------|
| `--elide-lines <n>` | Lines shown with --filter (default: 10) |
| `--filter`, `-F` | Run in matching workspace packages |
| `--workspaces` | Run in all workspace packages |

## Runtime & Process Control

| Flag | Description |
|------|-------------|
| `--bun`, `-b` | Force Bun runtime instead of Node.js |
| `--shell` | Shell for scripts: `bun` or `system` |
| `--smol` | Use less memory, more GC |
| `--expose-gc` | Expose `gc()` global |
| `--no-deprecation` | Suppress deprecation warnings |
| `--throw-deprecation` | Throw on deprecation |
| `--title` | Set process title |
| `--zero-fill-buffers` | Zero-fill Buffer.allocUnsafe |
| `--no-addons` | Disable process.dlopen |
| `--unhandled-rejections` | `strict`, `throw`, `warn`, `none`, `warn-with-error-code` |
| `--console-depth <n>` | console.log depth (default: 2) |

## Development Workflow

| Flag | Description |
|------|-------------|
| `--watch` | Restart on file change |
| `--hot` | Hot module replacement |
| `--no-clear-screen` | Don't clear terminal on reload |

## Debugging

| Flag | Description |
|------|-------------|
| `--inspect` | Activate debugger |
| `--inspect-wait` | Wait for debugger connection |
| `--inspect-brk` | Break on first line |

## Dependency & Module Resolution

| Flag | Description |
|------|-------------|
| `--preload`, `-r` | Import module before others |
| `--require` | Alias of --preload |
| `--import` | Alias of --preload |
| `--no-install` | Disable auto install |
| `--install` | `auto`, `fallback`, `force` |
| `-i` | Shorthand for --install=fallback |
| `--prefer-offline` | Skip staleness checks |
| `--prefer-latest` | Always check npm for latest |
| `--conditions` | Custom resolve conditions |
| `--main-fields` | package.json main fields |
| `--preserve-symlinks` | Preserve symlinks when resolving |
| `--preserve-symlinks-main` | Preserve main entry symlinks |
| `--extension-order` | Default: `.tsx,.ts,.jsx,.js,.json` |

## Transpilation & Language

| Flag | Description |
|------|-------------|
| `--tsconfig-override` | Custom tsconfig.json path |
| `--define`, `-d` | Substitute K:V while parsing |
| `--drop` | Remove function calls (e.g., `--drop=console`) |
| `--loader`, `-l` | Parse files with .ext:loader |
| `--no-macros` | Disable macros |
| `--jsx-factory` | JSX element function |
| `--jsx-fragment` | JSX fragment function |
| `--jsx-import-source` | JSX import source (default: react) |
| `--jsx-runtime` | `automatic` or `classic` |
| `--jsx-side-effects` | Treat JSX as having side effects |
| `--ignore-dce-annotations` | Ignore @PURE annotations |

## Networking & Security

| Flag | Description |
|------|-------------|
| `--port` | Default port for Bun.serve |
| `--fetch-preconnect` | Preconnect URL while loading |
| `--max-http-header-size` | Max HTTP header bytes (default: 16384) |
| `--dns-result-order` | `verbatim`, `ipv4first`, `ipv6first` |
| `--use-system-ca` | Use system CA store |
| `--use-openssl-ca` | Use OpenSSL CA store |
| `--use-bundled-ca` | Use bundled CA store |
| `--redis-preconnect` | Preconnect to $REDIS_URL |
| `--sql-preconnect` | Preconnect to PostgreSQL |
| `--user-agent` | Default HTTP User-Agent |

## Global Configuration

| Flag | Description |
|------|-------------|
| `--env-file` | Load env from file(s) |
| `--cwd` | Working directory |
| `--config`, `-c` | Config file path |

## Examples

### Basic Execution

```bash
# Run a file
bun run index.ts
bun index.ts  # shorthand

# Run package.json script
bun run dev
bun dev  # shorthand

# Run with flags
bun --watch run index.ts
bun --hot run server.ts
```

### Watch & Development

```bash
# Watch mode (full restart)
bun --watch run server.ts

# Hot reloading (preserves state)
bun --hot run server.ts

# With verbose output
bun --watch --no-clear-screen run dev
```

### Debugging

```bash
# Start debugger
bun --inspect run index.ts

# Wait for debugger
bun --inspect-wait run index.ts

# Break on first line
bun --inspect-brk run index.ts
```

### Workspaces

```bash
# Run in matching packages
bun run --filter 'pkg-*' build

# Run in all workspaces
bun run --filter '*' test

# Exclude packages
bun install --filter '!pkg-c'
```

### Environment

```bash
# Specific env file
bun --env-file .env.production run index.ts

# Multiple env files
bun --env-file .env --env-file .env.local run index.ts
```

### Memory & Performance

```bash
# Reduce memory usage
bun --smol run index.ts

# Increase console depth
bun --console-depth 5 run index.ts
```

### Forcing Bun Runtime

```bash
# Force Bun instead of Node for CLI tools
bun --bun run vite
bun run --bun next dev
```

### Piping Code

```bash
# Execute from stdin
echo "console.log('Hello')" | bun run -

# Redirect file
bun run - < script.js
```

### Custom Loaders

```bash
# Custom file extension loader
bun --loader .graphql:text run index.ts

# Multiple loaders
bun -l .sql:text -l .md:text run index.ts
```

### Define Constants

```bash
# Replace at parse time
bun --define process.env.NODE_ENV:"'production'" run build.ts
bun -d DEBUG:true run index.ts
```

### Drop Code

```bash
# Remove console calls
bun --drop=console run index.ts

# Remove debugger statements
bun --drop=debugger run index.ts
```
