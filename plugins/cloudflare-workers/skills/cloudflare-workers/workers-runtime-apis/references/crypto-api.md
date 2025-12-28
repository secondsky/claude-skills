# Web Crypto API in Cloudflare Workers

Cryptographic operations: hashing, signing, encryption, and key management.

## Supported Algorithms

| Category | Algorithms |
|----------|------------|
| **Digest** | SHA-1, SHA-256, SHA-384, SHA-512 |
| **Sign/Verify** | RSASSA-PKCS1-v1_5, RSA-PSS, ECDSA, HMAC, Ed25519 |
| **Encrypt/Decrypt** | RSA-OAEP, AES-CTR, AES-CBC, AES-GCM |
| **Key Derivation** | PBKDF2, HKDF |
| **Key Wrapping** | AES-KW, RSA-OAEP, AES-GCM |

## Hashing

### SHA-256

```typescript
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Usage
const hash = await sha256('Hello, World!');
// => "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"
```

### Hash File/Stream

```typescript
async function hashStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

## HMAC Signing

### Create HMAC Signature

```typescript
async function signHMAC(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
```

### Verify HMAC Signature

```typescript
async function verifyHMAC(
  key: string,
  data: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));

  return crypto.subtle.verify(
    'HMAC',
    cryptoKey,
    signatureBytes,
    encoder.encode(data)
  );
}
```

## AES Encryption

### AES-GCM Encryption

```typescript
interface EncryptedData {
  ciphertext: string;
  iv: string;
}

async function encryptAES(
  key: string,
  plaintext: string
): Promise<EncryptedData> {
  const encoder = new TextEncoder();

  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('static-salt'), // Use random salt in production
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}
```

### AES-GCM Decryption

```typescript
async function decryptAES(
  key: string,
  encrypted: EncryptedData
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('static-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), (c) =>
    c.charCodeAt(0)
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );

  return decoder.decode(plaintext);
}
```

## RSA Operations

### Generate RSA Key Pair

```typescript
async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}
```

### RSA Encrypt/Decrypt

```typescript
async function rsaEncrypt(publicKey: CryptoKey, data: string): Promise<string> {
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    new TextEncoder().encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

async function rsaDecrypt(
  privateKey: CryptoKey,
  encrypted: string
): Promise<string> {
  const data = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    data
  );

  return new TextDecoder().decode(decrypted);
}
```

## JWT Operations

### Verify JWT

```typescript
interface JWTPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const [headerB64, payloadB64, signatureB64] = token.split('.');

  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid JWT format');
  }

  // Verify signature
  const signatureValid = await verifyHMAC(
    secret,
    `${headerB64}.${payloadB64}`,
    signatureB64.replace(/-/g, '+').replace(/_/g, '/')
  );

  if (!signatureValid) {
    throw new Error('Invalid JWT signature');
  }

  // Decode payload
  const payload = JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0)
      )
    )
  ) as JWTPayload;

  // Check expiration
  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new Error('JWT expired');
  }

  return payload;
}
```

### Sign JWT

```typescript
async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const signature = await signHMAC(secret, `${headerB64}.${payloadB64}`);

  const signatureB64 = signature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
```

## Random Values

```typescript
// Generate random bytes
const randomBytes = crypto.getRandomValues(new Uint8Array(32));

// Generate random UUID
const uuid = crypto.randomUUID();

// Generate random string
function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues)
    .map((v) => chars[v % chars.length])
    .join('');
}
```

## Key Import/Export

### Import PEM Key

```typescript
async function importPublicKeyPEM(pem: string): Promise<CryptoKey> {
  // Remove PEM headers and decode base64
  const pemContents = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'spki',
    binaryDer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}
```

## Best Practices

1. **Use random IVs** - Never reuse IVs with same key
2. **Secure key storage** - Use Workers Secrets for keys
3. **Appropriate algorithm** - Use AES-GCM for symmetric, RSA-OAEP for asymmetric
4. **Validate inputs** - Check key/data formats before crypto operations
5. **Handle errors** - Crypto operations throw on invalid input
6. **Constant-time comparison** - Use crypto.subtle.verify for signatures
