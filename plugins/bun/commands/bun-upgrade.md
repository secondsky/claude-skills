---
name: bun:upgrade
description: Upgrade Bun runtime and project dependencies
arguments:
  - name: target
    description: What to upgrade (bun, deps, all)
    required: false
---

# Bun Upgrade Helper

Upgrade Bun runtime and project dependencies safely.

## Upgrade Options

### Upgrade Bun Runtime

```bash
# Upgrade to latest stable
bun upgrade

# Upgrade to specific version
bun upgrade --version 1.0.0

# Upgrade to canary
bun upgrade --canary
```

Check current version:
```bash
bun --version
```

### Upgrade Dependencies

```bash
# Check for outdated
bun outdated

# Update all dependencies
bun update

# Update specific package
bun update react

# Update to latest (ignore semver)
bun update --latest
```

### Interactive Upgrade

Check what will change:
```bash
# See what would update
bun outdated

# Review changes before applying
bun update --dry-run
```

## Breaking Changes Check

Before upgrading, check for breaking changes:

### Bun Changelog

Major breaking changes by version:
- **1.0** - Stable API, may break pre-1.0 code
- **1.1** - Windows support added, cross-platform Bun Shell, WebSocket client stabilized
- **1.2** - NEW: Text-based lockfile format (bun.lock), built-in S3/Postgres APIs, Node.js 90% compatibility

⚠️ **v1.2 Lockfile Change**: Binary `bun.lockb` → Text `bun.lock` (JSONC format)
- Easier to read, review PRs, and resolve merge conflicts
- Cached installs 30% faster than v1.1
- Migration happens automatically on first `bun install` with v1.2

### Dependency Breaking Changes

Check changelogs for major version bumps:
```bash
# See current vs latest
bun outdated

# For each major bump, review:
# - GitHub releases
# - CHANGELOG.md
# - Migration guides
```

## Safe Upgrade Process

1. **Backup current state**
   ```bash
   git add -A && git commit -m "Pre-upgrade checkpoint"
   ```

2. **Check what's outdated**
   ```bash
   bun outdated
   ```

3. **Upgrade Bun first**
   ```bash
   bun upgrade
   ```

4. **Test with current deps**
   ```bash
   bun test
   ```

5. **Upgrade dependencies**
   ```bash
   bun update
   ```

6. **Run tests again**
   ```bash
   bun test
   ```

7. **Verify build**
   ```bash
   bun run build
   ```

8. **Commit if successful**
   ```bash
   git add -A && git commit -m "Upgrade Bun and dependencies"
   ```

## Rollback Plan

If upgrade fails:

```bash
# Restore lockfile
git checkout bun.lockb

# Reinstall
bun install

# Downgrade Bun (if needed)
bun upgrade --version <previous-version>
```

## Automated Checks

Run these after upgrade:

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Tests
bun test

# Build
bun run build
```

## Common Upgrade Issues

| Issue | Solution |
|-------|----------|
| Type errors | Update @types/* packages |
| Test failures | Check test API changes |
| Build errors | Review bundler changes |
| Runtime errors | Check API deprecations |

## Dependency Audit

Check for security issues:
```bash
bun audit

# Fix automatically
bun audit --fix
```

## Questions to Ask

- "What do you want to upgrade? (Bun runtime, dependencies, or both)"
- "Should we upgrade to latest versions or just patch updates?"
- "Do you want to see what will change before applying?"

## Update Scripts

Add to package.json:
```json
{
  "scripts": {
    "upgrade:check": "bun outdated",
    "upgrade:bun": "bun upgrade",
    "upgrade:deps": "bun update",
    "upgrade:all": "bun upgrade && bun update"
  }
}
```

## Output

After upgrade:
1. Version changes summary
2. Breaking changes detected
3. Test results
4. Rollback command (if issues)
