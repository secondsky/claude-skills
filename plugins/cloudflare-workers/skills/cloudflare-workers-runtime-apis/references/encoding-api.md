# Encoding APIs in Cloudflare Workers

Text encoding, Base64, and binary data handling.

## Text Encoding

### TextEncoder

Encodes strings to UTF-8 bytes:

```typescript
const encoder = new TextEncoder();

// Encode string to Uint8Array
const bytes = encoder.encode('Hello, World!');
// => Uint8Array([72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33])

// Encode into existing buffer
const buffer = new Uint8Array(20);
const result = encoder.encodeInto('Hello', buffer);
// result: { read: 5, written: 5 }
```

### TextDecoder

Decodes bytes to strings:

```typescript
const decoder = new TextDecoder();

// Decode UTF-8 bytes to string
const text = decoder.decode(new Uint8Array([72, 101, 108, 108, 111]));
// => "Hello"

// Decode with different encoding
const utf16Decoder = new TextDecoder('utf-16');
const latin1Decoder = new TextDecoder('iso-8859-1');

// Streaming decode
const streamDecoder = new TextDecoder('utf-8', { stream: true });
let result = '';
result += streamDecoder.decode(chunk1, { stream: true });
result += streamDecoder.decode(chunk2, { stream: true });
result += streamDecoder.decode(); // Final flush
```

### Supported Encodings

| Encoding | Description |
|----------|-------------|
| `utf-8` | Default, most common |
| `utf-16le`, `utf-16be` | UTF-16 variants |
| `iso-8859-1` | Latin-1 |
| `windows-1252` | Windows Latin |

## Base64 Encoding

### Standard Base64

```typescript
// Encode string to Base64
const base64 = btoa('Hello, World!');
// => "SGVsbG8sIFdvcmxkIQ=="

// Decode Base64 to string
const text = atob('SGVsbG8sIFdvcmxkIQ==');
// => "Hello, World!"
```

### Binary Data to Base64

```typescript
// Uint8Array to Base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

// Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

// Usage
const bytes = new Uint8Array([1, 2, 3, 4, 5]);
const encoded = uint8ArrayToBase64(bytes);
const decoded = base64ToUint8Array(encoded);
```

### URL-Safe Base64

```typescript
// Encode to URL-safe Base64
function toBase64Url(data: string | Uint8Array): string {
  const base64 = typeof data === 'string'
    ? btoa(data)
    : btoa(String.fromCharCode(...data));

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Decode from URL-safe Base64
function fromBase64Url(base64url: string): string {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Add padding if needed
  const padding = base64.length % 4;
  const padded = padding ? base64 + '='.repeat(4 - padding) : base64;

  return atob(padded);
}

// To Uint8Array
function base64UrlToUint8Array(base64url: string): Uint8Array {
  return Uint8Array.from(fromBase64Url(base64url), (c) => c.charCodeAt(0));
}
```

## ArrayBuffer Operations

### Creating ArrayBuffers

```typescript
// From size
const buffer = new ArrayBuffer(16);

// From typed array
const uint8 = new Uint8Array([1, 2, 3, 4]);
const arrayBuffer = uint8.buffer;

// Copy ArrayBuffer
function copyArrayBuffer(source: ArrayBuffer): ArrayBuffer {
  const copy = new ArrayBuffer(source.byteLength);
  new Uint8Array(copy).set(new Uint8Array(source));
  return copy;
}
```

### Concatenating Buffers

```typescript
function concatBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return result.buffer;
}
```

### Slicing Buffers

```typescript
function sliceBuffer(buffer: ArrayBuffer, start: number, end?: number): ArrayBuffer {
  return buffer.slice(start, end);
}

// Using views (no copy)
function viewBuffer(buffer: ArrayBuffer, start: number, length: number): Uint8Array {
  return new Uint8Array(buffer, start, length);
}
```

## Typed Arrays

| Type | Size | Range |
|------|------|-------|
| `Uint8Array` | 1 byte | 0 - 255 |
| `Int8Array` | 1 byte | -128 - 127 |
| `Uint16Array` | 2 bytes | 0 - 65535 |
| `Int16Array` | 2 bytes | -32768 - 32767 |
| `Uint32Array` | 4 bytes | 0 - 4294967295 |
| `Int32Array` | 4 bytes | -2147483648 - 2147483647 |
| `Float32Array` | 4 bytes | IEEE 754 float |
| `Float64Array` | 8 bytes | IEEE 754 double |
| `BigUint64Array` | 8 bytes | 0 - 2^64-1 |
| `BigInt64Array` | 8 bytes | -2^63 - 2^63-1 |

```typescript
// Convert between typed arrays
const uint8 = new Uint8Array([1, 2, 3, 4]);
const uint32 = new Uint32Array(uint8.buffer);

// Read specific bytes as different type
const dataView = new DataView(uint8.buffer);
const bigEndian = dataView.getUint32(0, false); // big endian
const littleEndian = dataView.getUint32(0, true); // little endian
```

## Hex Encoding

```typescript
// Bytes to hex string
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hex string to bytes
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Usage
const bytes = new Uint8Array([255, 128, 64]);
const hex = toHex(bytes); // "ff8040"
const back = fromHex(hex); // Uint8Array([255, 128, 64])
```

## Stream Encoding/Decoding

### TextDecoderStream

```typescript
// Transform stream of bytes to text
const response = await fetch('https://example.com/text');
const textStream = response.body!.pipeThrough(new TextDecoderStream());

const reader = textStream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(value); // string chunks
}
```

### TextEncoderStream

```typescript
// Transform stream of text to bytes
function createTextStream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(text);
      controller.close();
    },
  }).pipeThrough(new TextEncoderStream());
}
```

## JSON Handling

```typescript
// Safe JSON parse
function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// JSON from ArrayBuffer
function jsonFromBuffer<T>(buffer: ArrayBuffer): T {
  const text = new TextDecoder().decode(buffer);
  return JSON.parse(text);
}

// JSON to ArrayBuffer
function jsonToBuffer(data: unknown): ArrayBuffer {
  const text = JSON.stringify(data);
  return new TextEncoder().encode(text).buffer;
}
```

## FormData Encoding

```typescript
// Create FormData
const formData = new FormData();
formData.append('name', 'John');
formData.append('file', new Blob(['content'], { type: 'text/plain' }), 'file.txt');

// Parse FormData from request
async function parseFormData(request: Request): Promise<Map<string, string | File>> {
  const formData = await request.formData();
  const result = new Map<string, string | File>();

  for (const [key, value] of formData.entries()) {
    result.set(key, value);
  }

  return result;
}
```

## Best Practices

1. **Use TextEncoder/Decoder** - Standard and efficient
2. **Prefer URL-safe Base64** - For URLs and cookies
3. **Reuse encoders** - Create once, use many times
4. **Stream large data** - Use TextDecoderStream/TextEncoderStream
5. **Handle encoding errors** - Use try/catch for invalid input
6. **Check encoding support** - Not all encodings available everywhere
