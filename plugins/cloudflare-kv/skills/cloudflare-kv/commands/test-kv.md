---
name: cloudflare-kv:test
description: Test KV namespace connection and operations - validates configuration, performs CRUD tests, and reports diagnostics
---

# /cloudflare-kv:test - Test KV Namespace Connection

This command validates KV namespace configuration and tests basic operations to ensure everything is working correctly.

## What This Command Does

1. **Validates Configuration**
   - Checks wrangler.jsonc for KV bindings
   - Verifies namespace ID format
   - Confirms binding name correctness

2. **Tests CRUD Operations**
   - PUT: Creates test key-value pair
   - GET: Retrieves and validates value
   - DELETE: Removes test key
   - Verifies cleanup after deletion

3. **Reports Diagnostics**
   - Operation success/failure status
   - Error messages with troubleshooting hints
   - Configuration recommendations

## How to Use

### Basic Usage

Test a specific namespace binding:

```
/cloudflare-kv:test MY_NAMESPACE
```

Replace `MY_NAMESPACE` with your actual binding name from wrangler.jsonc.

### Interactive Mode

If no namespace provided, the command will:
1. List available namespaces from wrangler.jsonc
2. Ask which one to test
3. Run comprehensive tests

```
/cloudflare-kv:test
```

## Implementation

Execute the test script from the cloudflare-kv skill:

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/test-kv-connection.sh <NAMESPACE_BINDING>
```

The script performs:
1. Configuration validation
2. Test key generation (timestamped, unique)
3. PUT operation test
4. GET operation and value verification
5. DELETE operation test
6. Cleanup verification

## Prerequisites

1. **Wrangler CLI Installed**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticated**
   ```bash
   wrangler whoami  # Verify authentication
   ```

3. **Namespace Configured**
   - wrangler.jsonc must have kv_namespaces section
   - Namespace ID must be valid

## Example Output

### Successful Test

```
Cloudflare Workers KV - Connection Tester
==========================================

Testing namespace: MY_KV_NAMESPACE

Step 1: Checking namespace configuration...

✓ Namespace binding found in wrangler.jsonc
✓ Namespace ID: a1b2c3d4e5f6789012345678901234ab

Step 2: Testing KV operations...

Test key: __test_connection_1735300800

Testing PUT operation... ✓ Success
Testing GET operation... ✓ Success (value matches)
Testing DELETE operation... ✓ Success
Verifying deletion... ✓ Success (key removed)

Summary:
========
✓ All tests passed!

Your KV namespace 'MY_KV_NAMESPACE' is working correctly.
```

### Failed Test

```
Testing namespace: BROKEN_NAMESPACE

Step 1: Checking namespace configuration...

✗ Namespace binding 'BROKEN_NAMESPACE' not found in wrangler.jsonc

Add it to your wrangler.jsonc:
  "kv_namespaces": [
    {
      "binding": "BROKEN_NAMESPACE",
      "id": "your-namespace-id"
    }
  ]
```

## Test Scope

This command tests:

✅ **Configuration**
- Namespace binding exists
- Namespace ID is valid format (32 hex chars)
- wrangler.jsonc syntax is correct

✅ **Operations**
- PUT: Can write key-value pairs
- GET: Can retrieve values
- DELETE: Can remove keys
- Values match after write/read cycle

❌ **Not Tested**
- TTL/expiration (requires time delay)
- Metadata operations
- List operations
- Rate limits
- Eventual consistency across regions

For comprehensive testing, see `references/troubleshooting.md`.

## Common Test Failures

### "Namespace binding not found"

**Cause:** Missing or incorrect configuration

**Solution:**
1. Run `/cloudflare-kv:setup` to create namespace
2. Or manually add to wrangler.jsonc:
   ```json
   "kv_namespaces": [{
     "binding": "MY_NAMESPACE",
     "id": "your-id"
   }]
   ```

### "PUT operation failed"

**Possible causes:**
- Invalid namespace ID
- Authentication expired
- API rate limit reached
- Network connectivity issue

**Solution:**
```bash
# Re-authenticate
wrangler login

# Verify namespace ID is correct
wrangler kv namespace list

# Check wrangler.jsonc configuration
${CLAUDE_PLUGIN_ROOT}/scripts/validate-kv-config.sh
```

### "GET value mismatch"

**Cause:** Eventual consistency delay

**Solution:** This is rare in local testing. If persistent:
1. Wait 60 seconds and retry
2. Check if namespace ID is correct
3. Verify no other processes are modifying the test key

## After Testing

If tests pass:

1. **Start Development**
   ```bash
   wrangler dev
   ```

2. **Optimize Usage**
   ```
   /cloudflare-kv:optimize src/index.ts
   ```

3. **Deploy to Production**
   ```bash
   wrangler deploy
   ```

If tests fail:

1. **Validate Configuration**
   ```
   ${CLAUDE_PLUGIN_ROOT}/scripts/validate-kv-config.sh
   ```

2. **Check Troubleshooting Guide**
   - Load `references/troubleshooting.md` for detailed error solutions

3. **Verify Account Status**
   - Check Cloudflare dashboard
   - Ensure Workers plan is active
   - Verify API permissions

## Related Commands

- `/cloudflare-kv:setup` - Create and configure new namespace
- `/cloudflare-kv:optimize` - Analyze KV usage patterns

## References

For more details:
- Load `references/troubleshooting.md` for error diagnostics
- Load `references/setup-guide.md` for configuration help
- Check official docs: https://developers.cloudflare.com/kv/api/
