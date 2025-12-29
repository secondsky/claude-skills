---
name: cloudflare-kv:setup
description: Interactive KV namespace setup wizard - creates namespaces, configures bindings, and generates Worker code
---

# /cloudflare-kv:setup - Interactive KV Namespace Setup

This command guides through the complete setup process for Cloudflare Workers KV namespaces.

## What This Command Does

1. **Creates KV Namespaces**
   - Production namespace
   - Preview namespace (for testing)
   - Generates unique IDs for both

2. **Configures wrangler.jsonc**
   - Adds KV namespace bindings
   - Sets up preview environment
   - Creates config if needed

3. **Generates TypeScript Types**
   - Env interface with KV bindings
   - Type-safe Worker code examples

4. **Tests Connection**
   - Validates configuration
   - Performs basic CRUD operations
   - Verifies namespace accessibility

## How to Use

### Interactive Mode (Recommended)

Run the command and follow prompts:

```
/cloudflare-kv:setup
```

The command will:
1. Ask for namespace name (e.g., "MY_KV" or "USER_DATA")
2. Create production and preview namespaces
3. Generate wrangler.jsonc configuration
4. Provide TypeScript setup examples
5. Offer to run connection tests

### With Namespace Name

Provide namespace name upfront:

```
/cloudflare-kv:setup MY_NAMESPACE
```

## Implementation

Execute the setup script from the cloudflare-kv skill:

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/setup-kv-namespace.sh [namespace-name]
```

The script will:
- Check wrangler CLI installation
- Verify authentication status
- Create namespaces via wrangler API
- Extract namespace IDs
- Generate configuration snippets
- Optionally create/update wrangler.jsonc

## Prerequisites

Before running this command, ensure:

1. **Wrangler CLI Installed**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticated with Cloudflare**
   ```bash
   wrangler login
   ```

3. **Active Cloudflare Account**
   - Workers plan enabled
   - API access configured

## Example Output

```
Cloudflare Workers KV - Namespace Setup Wizard
================================================

Creating KV namespaces for: MY_KV_NAMESPACE

Step 1: Creating production namespace...
✓ Production namespace created
   ID: a1b2c3d4e5f6789012345678901234ab

Step 2: Creating preview namespace...
✓ Preview namespace created
   ID: b2c3d4e5f6789012345678901234abc1

✓ Namespaces created successfully!

Step 3: Generating wrangler.jsonc configuration...

Add this to your wrangler.jsonc:

  "kv_namespaces": [
    {
      "binding": "MY_KV_NAMESPACE",
      "id": "a1b2c3d4e5f6789012345678901234ab",
      "preview_id": "b2c3d4e5f6789012345678901234abc1"
    }
  ]

Step 4: TypeScript type definition example...

Add this to your Worker code for TypeScript support:

type Env = {
  MY_KV_NAMESPACE: KVNamespace;
};

✓ Setup complete!

Next steps:
1. Ensure wrangler.jsonc has the KV namespace configuration
2. Use env.MY_KV_NAMESPACE in your Worker code
3. Test with: wrangler dev
```

## After Setup

Once setup completes:

1. **Verify Configuration**
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/scripts/validate-kv-config.sh
   ```

2. **Test Connection**
   ```
   /cloudflare-kv:test MY_KV_NAMESPACE
   ```

3. **Start Developing**
   ```typescript
   export default {
     async fetch(request, env: Env) {
       await env.MY_KV_NAMESPACE.put('key', 'value');
       const value = await env.MY_KV_NAMESPACE.get('key');
       return new Response(value);
     }
   };
   ```

4. **Run Locally**
   ```bash
   wrangler dev
   ```

## Common Issues

### "Not logged in to Wrangler"

**Solution:** Authenticate first
```bash
wrangler login
```

### "Failed to create namespace"

**Possible causes:**
- No Workers plan enabled
- API token lacks permissions
- Account quota exceeded

**Solution:** Check Cloudflare dashboard and account settings

### "wrangler.jsonc exists"

The script won't overwrite existing configs. You'll need to manually add the KV namespace configuration shown in the output.

## Related Commands

- `/cloudflare-kv:test` - Test KV operations and connection
- `/cloudflare-kv:optimize` - Analyze KV usage patterns

## References

For more details:
- Load `references/setup-guide.md` for complete setup documentation
- Load `references/best-practices.md` for production configuration
- Check official docs: https://developers.cloudflare.com/kv/get-started/
