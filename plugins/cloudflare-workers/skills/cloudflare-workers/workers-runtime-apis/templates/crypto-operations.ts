/**
 * Cryptographic Operations for Cloudflare Workers
 *
 * Features:
 * - Hashing (SHA-256, SHA-512)
 * - HMAC signing/verification
 * - AES encryption/decryption
 * - JWT handling
 * - Random value generation
 *
 * Usage: Copy needed functions to src/lib/crypto.ts
 */

// ============================================
// HASHING
// ============================================

/**
 * Compute SHA-256 hash of a string
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return bufferToHex(hashBuffer);
}

/**
 * Compute SHA-512 hash of a string
 */
export async function sha512(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
  return bufferToHex(hashBuffer);
}

/**
 * Hash a file/stream
 */
export async function hashStream(
  stream: ReadableStream<Uint8Array>,
  algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'
): Promise<string> {
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

  const hashBuffer = await crypto.subtle.digest(algorithm, combined);
  return bufferToHex(hashBuffer);
}

// ============================================
// HMAC
// ============================================

/**
 * Create HMAC-SHA256 signature
 */
export async function signHMAC(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(data)
  );

  return bufferToBase64(signature);
}

/**
 * Verify HMAC-SHA256 signature
 */
export async function verifyHMAC(
  key: string,
  data: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = base64ToBuffer(signature);

  return crypto.subtle.verify(
    'HMAC',
    cryptoKey,
    signatureBytes,
    encoder.encode(data)
  );
}

// ============================================
// AES ENCRYPTION
// ============================================

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Encrypt data with AES-GCM
 */
export async function encryptAES(
  password: string,
  plaintext: string
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

/**
 * Decrypt AES-GCM encrypted data
 */
export async function decryptAES(
  password: string,
  encrypted: EncryptedData
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const salt = base64ToBuffer(encrypted.salt);
  const iv = base64ToBuffer(encrypted.iv);
  const ciphertext = base64ToBuffer(encrypted.ciphertext);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return decoder.decode(plaintext);
}

// ============================================
// JWT
// ============================================

export interface JWTPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
  [key: string]: unknown;
}

/**
 * Create a JWT token
 */
export async function createJWT(
  payload: JWTPayload,
  secret: string,
  expiresIn: number = 3600
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${headerB64}.${payloadB64}`;

  const signature = await signHMAC(secret, message);
  const signatureB64 = base64ToBase64Url(signature);

  return `${message}.${signatureB64}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const message = `${headerB64}.${payloadB64}`;
  const signature = base64UrlToBase64(signatureB64);

  const isValid = await verifyHMAC(secret, message, signature);
  if (!isValid) {
    throw new Error('Invalid JWT signature');
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64)) as JWTPayload;

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('JWT expired');
  }

  return payload;
}

// ============================================
// RANDOM VALUES
// ============================================

/**
 * Generate random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate random hex string
 */
export function randomHex(length: number): string {
  const bytes = randomBytes(Math.ceil(length / 2));
  return bufferToHex(bytes).slice(0, length);
}

/**
 * Generate random alphanumeric string
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

/**
 * Generate random UUID
 */
export function randomUUID(): string {
  return crypto.randomUUID();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBase64(base64url: string): string {
  const padded = base64url + '='.repeat((4 - (base64url.length % 4)) % 4);
  return padded.replace(/-/g, '+').replace(/_/g, '/');
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import { sha256, encryptAES, decryptAES, createJWT, verifyJWT } from './lib/crypto';

// Hash a password
const hashedPassword = await sha256(userPassword + salt);

// Encrypt sensitive data
const encrypted = await encryptAES('master-key', JSON.stringify(sensitiveData));
const decrypted = await decryptAES('master-key', encrypted);

// JWT auth
const token = await createJWT({ sub: userId, role: 'admin' }, env.JWT_SECRET, 3600);
const payload = await verifyJWT(token, env.JWT_SECRET);
*/
