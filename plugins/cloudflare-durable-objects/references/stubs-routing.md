# Creating Durable Object Stubs and Routing

Complete guide to interacting with Durable Objects from Workers, including ID creation methods, stub management, location hints, and jurisdiction restrictions.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Durable Object IDs](#getting-durable-object-ids)
3. [Getting Stubs](#getting-stubs)
4. [Location Hints](#location-hints-geographic-routing)
5. [Jurisdiction Restriction](#jurisdiction-restriction-data-residency)

---

## Overview

To interact with a Durable Object from a Worker, you need to:
1. Get a **Durable Object ID**
2. Create a **stub** from the ID
3. Call methods on the stub

```typescript
// Basic pattern
const id = env.MY_DO.idFromName('my-instance');
const stub = env.MY_DO.get(id);
await stub.myMethod();
```

---

## Getting Durable Object IDs

Three methods to create IDs, each with different use cases:

### Method 1: `idFromName(name)` - Named DOs (Most Common)

Use when you want **consistent routing** to the same DO instance based on a name:

```typescript
// Same name always routes to same DO instance globally
const roomId = env.CHAT_ROOM.idFromName('room-123');
const userId = env.USER_SESSION.idFromName('user-alice');
const globalCounter = env.COUNTER.idFromName('global');
```

**Use for:**
- Chat rooms (name = room ID)
- User sessions (name = user ID)
- Per-tenant logic (name = tenant ID)
- Global singletons (name = 'global')
- Rate limiting by key
- Leader election

**Characteristics:**
- ✅ **Deterministic** - same name = same DO instance globally
- ✅ **Easy to reference** - just need the name string
- ✅ **No storage needed** - recreate ID anytime with the name
- ⚠️ **First access latency** - ~100-300ms for global uniqueness check
- ✅ **Cached after first use** - subsequent access is fast

**Example: Chat Room Routing**
```typescript
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const roomName = url.searchParams.get('room');

    // Always routes to same chat room DO
    const roomId = env.CHAT_ROOM.idFromName(roomName);
    const room = env.CHAT_ROOM.get(roomId);

    return await room.fetch(request);
  }
};
```

---

### Method 2: `newUniqueId()` - Random IDs

Use when you need a **new, unique DO instance**:

```typescript
// Creates a random, globally unique ID
const id = env.MY_DO.newUniqueId();

// With jurisdiction restriction (EU data residency)
const euId = env.MY_DO.newUniqueId({ jurisdiction: 'eu' });

// Store the ID for future use
const idString = id.toString();
await env.KV.put('session:123', idString);
```

**Use for:**
- Creating new sessions/rooms that don't exist yet
- One-time use DOs
- When you don't have a natural name
- Temporary workflows or queues

**Characteristics:**
- ✅ **Lower latency** on first use (no global uniqueness check)
- ✅ **No naming conflicts** - guaranteed unique
- ⚠️ **Must store ID** to access same DO later
- ⚠️ **ID format is opaque** - can't derive meaning from it
- ⚠️ **Requires external storage** - KV, D1, cookie, etc.

**Example: Create New Session**
```typescript
async function createSession(env, userId: string) {
  // Create new unique session DO
  const sessionId = env.SESSION.newUniqueId();

  // Store ID for later retrieval
  const idString = sessionId.toString();
  await env.D1.prepare(
    'INSERT INTO sessions (user_id, do_id) VALUES (?, ?)'
  ).bind(userId, idString).run();

  // Get stub and initialize
  const session = env.SESSION.get(sessionId);
  await session.initialize(userId);

  return idString;
}
```

---

### Method 3: `idFromString(idString)` - Recreate from Saved ID

Use when you've **previously stored an ID** and need to recreate it:

```typescript
// Get stored ID string (from KV, D1, cookie, etc.)
const idString = await env.KV.get('session:123');

// Recreate ID
const id = env.MY_DO.idFromString(idString);

// Get stub
const stub = env.MY_DO.get(id);
await stub.myMethod();
```

**Throws exception** if:
- ID string is invalid format
- ID was not created from the same `DurableObjectNamespace`
- ID string is corrupted

**Example: Retrieve Existing Session**
```typescript
async function getSession(env, sessionToken: string) {
  // Get stored DO ID from database
  const result = await env.D1.prepare(
    'SELECT do_id FROM sessions WHERE token = ?'
  ).bind(sessionToken).first();

  if (!result) {
    throw new Error('Session not found');
  }

  // Recreate ID and get stub
  const sessionId = env.SESSION.idFromString(result.do_id);
  const session = env.SESSION.get(sessionId);

  return session;
}
```

---

## Getting Stubs

### Method 1: `get(id)` - From ID

```typescript
const id = env.MY_DO.idFromName('my-instance');
const stub = env.MY_DO.get(id);

// Call methods
await stub.myMethod();
```

### Method 2: `getByName(name)` - Shortcut for Named DOs

```typescript
// Shortcut that combines idFromName + get
const stub = env.MY_DO.getByName('my-instance');

// Equivalent to:
// const id = env.MY_DO.idFromName('my-instance');
// const stub = env.MY_DO.get(id);

await stub.myMethod();
```

**Recommended** for named DOs (cleaner, more readable code).

**Example: Compare Methods**
```typescript
// Verbose (two steps)
const id = env.CHAT_ROOM.idFromName('room-123');
const room = env.CHAT_ROOM.get(id);

// Concise (one step) - PREFERRED
const room = env.CHAT_ROOM.getByName('room-123');
```

---

## Location Hints (Geographic Routing)

**Control WHERE a Durable Object is created** with location hints:

```typescript
// Create DO near specific location
const id = env.MY_DO.idFromName('user-alice');
const stub = env.MY_DO.get(id, { locationHint: 'enam' });  // Eastern North America

// Available location hints:
// - 'wnam' - Western North America
// - 'enam' - Eastern North America
// - 'sam'  - South America
// - 'weur' - Western Europe
// - 'eeur' - Eastern Europe
// - 'apac' - Asia-Pacific
// - 'oc'   - Oceania
// - 'afr'  - Africa
// - 'me'   - Middle East
```

### When to Use Location Hints

✅ **Good use cases:**
- Create DO near user's location (lower latency)
- Data residency preferences (not strict requirements)
- Performance optimization for regional traffic

❌ **Not appropriate for:**
- Strict compliance requirements (use jurisdiction instead)
- Existing DOs (hints only affect creation)
- Expecting guaranteed placement

### Limitations

- ⚠️ **Hints are best-effort** - not guaranteed (routing may choose different location)
- ⚠️ **Only affects first creation** - subsequent access uses existing location
- ⚠️ **Cannot move existing DOs** - once created, location is permanently fixed
- ⚠️ **Hint ignored if DO exists** - only new DOs respect hints

**Example: User-Based Location Hints**
```typescript
function getLocationHint(userCountry: string): string {
  const locationMap = {
    'US': 'enam',
    'CA': 'enam',
    'MX': 'wnam',
    'BR': 'sam',
    'GB': 'weur',
    'DE': 'weur',
    'FR': 'weur',
    'IN': 'apac',
    'JP': 'apac',
    'AU': 'oc'
  };

  return locationMap[userCountry] || 'weur';  // Default to Western Europe
}

// Use location hint based on user's country
const hint = getLocationHint(userCountry);
const sessionId = env.SESSION.idFromName(`user-${userId}`);
const session = env.SESSION.get(sessionId, { locationHint: hint });
```

---

## Jurisdiction Restriction (Data Residency)

**Enforce strict data location** requirements for regulatory compliance:

```typescript
// Create DO that MUST stay in EU
const euId = env.MY_DO.newUniqueId({ jurisdiction: 'eu' });

// Available jurisdictions:
// - 'eu' - European Union (GDPR compliance)
// - 'fedramp' - FedRAMP (US government/compliance)
```

### Use Cases

✅ **When to use jurisdiction:**
- Regulatory compliance (GDPR, FedRAMP)
- Data sovereignty requirements
- Legal mandates for data location
- Government contracts
- Healthcare data (HIPAA with FedRAMP)

### Critical Rules

- ✅ **Strictly enforced** - DO will never leave jurisdiction (guaranteed)
- ⚠️ **Cannot combine** jurisdiction with location hints (mutually exclusive)
- ⚠️ **Higher latency** for users outside jurisdiction (longer round trips)
- ⚠️ **Only with newUniqueId()** - cannot use with named DOs
- ⚠️ **Cannot change** after creation - permanent restriction

**Example: EU Jurisdiction for GDPR**
```typescript
async function createGDPRSession(env, userId: string) {
  // Create EU-restricted DO for GDPR compliance
  const sessionId = env.SESSION.newUniqueId({ jurisdiction: 'eu' });

  // Store ID (required since not using named DO)
  const idString = sessionId.toString();
  await env.D1.prepare(
    'INSERT INTO eu_sessions (user_id, do_id) VALUES (?, ?)'
  ).bind(userId, idString).run();

  // Get stub and initialize
  const session = env.SESSION.get(sessionId);
  await session.initialize({ userId, region: 'eu' });

  return idString;
}
```

**Example: FedRAMP for Government**
```typescript
// Government contract requiring FedRAMP compliance
const govId = env.GOV_SESSION.newUniqueId({ jurisdiction: 'fedramp' });
const session = env.GOV_SESSION.get(govId);

// All data guaranteed to stay in FedRAMP-certified infrastructure
await session.storeClassifiedData(data);
```

---

## Best Practices

### 1. Choose the Right ID Method

```typescript
// Named DOs - Most common (chat rooms, user sessions)
✅ const room = env.CHAT.getByName('room-123');

// Unique IDs - When you need new instances
✅ const session = env.SESSION.newUniqueId();

// From string - Retrieving stored instances
✅ const id = env.DO.idFromString(storedId);
```

### 2. Use getByName() for Named DOs

```typescript
// ❌ Verbose
const id = env.DO.idFromName('name');
const stub = env.DO.get(id);

// ✅ Concise and readable
const stub = env.DO.getByName('name');
```

### 3. Store Unique IDs Externally

```typescript
// ✅ Always store newUniqueId() results
const id = env.DO.newUniqueId();
await env.KV.put(key, id.toString());  // Required!

// ❌ Don't create without storing
const id = env.DO.newUniqueId();
// Lost forever if not stored
```

### 4. Handle ID Recreation Errors

```typescript
try {
  const id = env.DO.idFromString(storedId);
  const stub = env.DO.get(id);
} catch (error) {
  // Handle invalid/corrupted ID
  console.error('Invalid DO ID:', error);
  // Fallback: create new DO or return error
}
```

### 5. Use Location Hints Appropriately

```typescript
// ✅ Good: User-based routing
const hint = getUserLocationHint(userCountry);
const stub = env.DO.get(id, { locationHint: hint });

// ❌ Bad: Trying to move existing DO
const stub = env.DO.get(existingId, { locationHint: 'enam' });  // Ignored!
```

---

**Source**: https://developers.cloudflare.com/durable-objects/reference/durable-object-stubs/
**Last Updated**: 2025-11-23
