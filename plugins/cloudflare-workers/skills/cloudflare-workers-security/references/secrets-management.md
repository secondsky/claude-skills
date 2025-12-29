# Secrets Management for Cloudflare Workers

Best practices for handling sensitive data in Workers.

## Secrets Overview

| Type | Storage | Access | Rotation |
|------|---------|--------|----------|
| Wrangler Secrets | Encrypted, per-worker | `env.SECRET_NAME` | Manual via CLI |
| Environment Variables | wrangler.jsonc | `env.VAR_NAME` | Redeploy |
| KV | Encrypted at rest | `env.KV.get()` | Application-managed |
| D1 | Encrypted at rest | SQL queries | Application-managed |

## Wrangler Secrets

### Setting Secrets

```bash
# Set secret (interactive - paste value when prompted)
bunx wrangler secret put API_KEY

# Set secret from file
cat api-key.txt | bunx wrangler secret put API_KEY

# Set for specific environment
bunx wrangler secret put API_KEY --env production

# List secrets (shows names only, not values)
bunx wrangler secret list

# Delete secret
bunx wrangler secret delete API_KEY
```

### Bulk Secrets (CI/CD)

```bash
# Set multiple secrets from env file
while IFS='=' read -r key value; do
  echo "$value" | bunx wrangler secret put "$key"
done < secrets.env

# Or using jq from JSON
jq -r 'to_entries[] | "\(.key)=\(.value)"' secrets.json | while IFS='=' read -r key value; do
  echo "$value" | bunx wrangler secret put "$key"
done
```

### Accessing Secrets

```typescript
interface Env {
  API_KEY: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Secrets available on env object
    const apiKey = env.API_KEY;

    // Never log secrets!
    // console.log(env.API_KEY); // ❌ NEVER

    return new Response('OK');
  }
};
```

## Local Development Secrets

### .dev.vars File

```bash
# .dev.vars (MUST be gitignored!)
API_KEY=dev-api-key-for-local
DATABASE_URL=postgres://localhost:5432/dev
JWT_SECRET=local-dev-secret-not-for-production
STRIPE_KEY=sk_test_xxxxx
```

### .gitignore Setup

```gitignore
# Secrets
.dev.vars
*.env
secrets.json
*.pem
*.key
```

## Secret Rotation

### Rotation Strategy

```typescript
interface SecretVersion {
  value: string;
  createdAt: number;
  expiresAt: number;
}

async function getActiveSecret(
  kv: KVNamespace,
  secretName: string
): Promise<string> {
  const versions = await kv.get<SecretVersion[]>(`secrets:${secretName}`, 'json');

  if (!versions || versions.length === 0) {
    throw new Error(`Secret ${secretName} not found`);
  }

  const now = Date.now();

  // Find first non-expired version
  const active = versions.find(v => v.expiresAt > now);
  if (!active) {
    throw new Error(`Secret ${secretName} expired`);
  }

  return active.value;
}

// Verify with both old and new during rotation
async function verifyWithRotation(
  kv: KVNamespace,
  token: string
): Promise<boolean> {
  const versions = await kv.get<SecretVersion[]>('secrets:jwt', 'json') || [];
  const now = Date.now();

  // Try each non-expired secret
  for (const version of versions) {
    if (version.expiresAt > now) {
      const result = await verifyJWT(token, version.value);
      if (result.valid) return true;
    }
  }

  return false;
}
```

### Automated Rotation

```typescript
async function rotateApiKey(
  kv: KVNamespace,
  clientId: string
): Promise<{ newKey: string; oldKeyValidUntil: number }> {
  const now = Date.now();
  const gracePeriod = 24 * 60 * 60 * 1000; // 24 hours

  // Generate new key
  const newKey = await generateApiKey();
  const newHash = await sha256(newKey);

  // Get current keys
  const keys = await kv.get<Array<{ hash: string; expiresAt: number }>>(
    `client:${clientId}:keys`,
    'json'
  ) || [];

  // Add new key, expire old ones
  const updatedKeys = [
    { hash: newHash, expiresAt: now + 365 * 24 * 60 * 60 * 1000 }, // 1 year
    ...keys.map(k => ({
      hash: k.hash,
      expiresAt: Math.min(k.expiresAt, now + gracePeriod),
    })),
  ];

  // Filter expired
  const activeKeys = updatedKeys.filter(k => k.expiresAt > now);

  await kv.put(`client:${clientId}:keys`, JSON.stringify(activeKeys));

  return {
    newKey,
    oldKeyValidUntil: now + gracePeriod,
  };
}
```

## Encryption at Application Level

### Encrypt Sensitive Data

```typescript
async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decryptData(
  encrypted: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const encryptedData = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decrypted);
}

// Derive key from secret
async function deriveKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('static-salt-for-demo'), // Use unique salt in production
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

### Store Encrypted in D1

```typescript
async function storeSecretValue(
  db: D1Database,
  encryptionKey: CryptoKey,
  name: string,
  value: string
): Promise<void> {
  const { encrypted, iv } = await encryptData(value, encryptionKey);

  await db
    .prepare('INSERT INTO secrets (name, encrypted_value, iv) VALUES (?, ?, ?)')
    .bind(name, encrypted, iv)
    .run();
}

async function getSecretValue(
  db: D1Database,
  encryptionKey: CryptoKey,
  name: string
): Promise<string | null> {
  const result = await db
    .prepare('SELECT encrypted_value, iv FROM secrets WHERE name = ?')
    .bind(name)
    .first<{ encrypted_value: string; iv: string }>();

  if (!result) return null;

  return decryptData(result.encrypted_value, result.iv, encryptionKey);
}
```

## Secret Access Patterns

### Never Expose in Responses

```typescript
// ❌ NEVER expose secrets in responses
app.get('/debug', (c) => {
  return c.json({
    config: c.env, // Exposes all secrets!
  });
});

// ✅ Only expose safe values
app.get('/debug', (c) => {
  return c.json({
    environment: c.env.ENVIRONMENT,
    version: c.env.VERSION,
    // No secrets
  });
});
```

### Mask in Logs

```typescript
function maskSecret(secret: string): string {
  if (secret.length <= 8) return '****';
  return secret.slice(0, 4) + '****' + secret.slice(-4);
}

function safeLog(message: string, data: Record<string, unknown>): void {
  const secretKeys = ['apiKey', 'secret', 'password', 'token', 'key'];

  const sanitized = { ...data };
  for (const key of secretKeys) {
    if (key in sanitized && typeof sanitized[key] === 'string') {
      sanitized[key] = maskSecret(sanitized[key] as string);
    }
  }

  console.log(message, sanitized);
}
```

### Secure Comparison

```typescript
// ❌ Vulnerable to timing attacks
function insecureCompare(a: string, b: string): boolean {
  return a === b;
}

// ✅ Constant-time comparison
async function secureCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.length !== bBytes.length) {
    // Hash to make timing consistent
    await crypto.subtle.digest('SHA-256', aBytes);
    await crypto.subtle.digest('SHA-256', bBytes);
    return false;
  }

  const aHash = await crypto.subtle.digest('SHA-256', aBytes);
  const bHash = await crypto.subtle.digest('SHA-256', bBytes);

  const aArray = new Uint8Array(aHash);
  const bArray = new Uint8Array(bHash);

  let result = 0;
  for (let i = 0; i < aArray.length; i++) {
    result |= aArray[i] ^ bArray[i];
  }

  return result === 0;
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Deploy
        run: bunx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Set secrets
        run: |
          echo "${{ secrets.API_KEY }}" | bunx wrangler secret put API_KEY
          echo "${{ secrets.JWT_SECRET }}" | bunx wrangler secret put JWT_SECRET
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Secret Validation on Deploy

```typescript
// src/validate-secrets.ts
interface Env {
  API_KEY: string;
  JWT_SECRET: string;
  DATABASE_URL: string;
}

function validateSecrets(env: Env): void {
  const required = ['API_KEY', 'JWT_SECRET', 'DATABASE_URL'];

  for (const name of required) {
    if (!env[name as keyof Env]) {
      throw new Error(`Missing required secret: ${name}`);
    }
  }

  // Validate format
  if (!env.API_KEY.startsWith('sk_')) {
    throw new Error('API_KEY must start with sk_');
  }

  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Validate on startup
    validateSecrets(env);

    // Continue with handler
    return handleRequest(request, env);
  }
};
```
