# better-auth with MongoDB

Complete guide for integrating better-auth with MongoDB.

---

## Installation

```bash
bun add better-auth mongodb
```

---

## Setup

### Database Connection

**`src/db/index.ts`**:
```typescript
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export const db = client.db("your-database-name");

// Optional: Export client for connection management
export { client };
```

### Auth Configuration

**`src/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { mongoAdapter } from "better-auth/adapters/mongo";
import { db } from "./db";

export const auth = betterAuth({
  database: mongoAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

---

## Collections Created

better-auth automatically creates these collections:

- `users` - User profiles
- `sessions` - Active sessions
- `accounts` - OAuth accounts and credentials
- `verifications` - Email verification tokens

### Document Schemas

**User Document**:
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  emailVerified: boolean,
  image: string | null,
  createdAt: Date,
  updatedAt: Date,
}
```

**Session Document**:
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  token: string,
  expiresAt: Date,
  ipAddress: string | null,
  userAgent: string | null,
  createdAt: Date,
  updatedAt: Date,
}
```

**Account Document**:
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  accountId: string,
  providerId: string,
  accessToken: string | null,
  refreshToken: string | null,
  accessTokenExpiresAt: Date | null,
  refreshTokenExpiresAt: Date | null,
  scope: string | null,
  idToken: string | null,
  password: string | null,  // For email/password auth
  createdAt: Date,
  updatedAt: Date,
}
```

---

## MongoDB Atlas Setup

### Connection String

```env
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority
```

### With Connection Options

```typescript
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});
```

---

## Indexes

Create indexes for better performance:

```typescript
// Run once during setup
async function createIndexes() {
  const db = client.db("your-database-name");

  // Users collection
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  // Sessions collection
  await db.collection("sessions").createIndex({ userId: 1 });
  await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
  await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  // Accounts collection
  await db.collection("accounts").createIndex({ userId: 1 });
  await db.collection("accounts").createIndex({ providerId: 1, accountId: 1 }, { unique: true });

  // Verifications collection
  await db.collection("verifications").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}
```

---

## With Mongoose

If you're already using Mongoose, you can still use the MongoDB adapter:

```typescript
import mongoose from "mongoose";
import { mongoAdapter } from "better-auth/adapters/mongo";
import { betterAuth } from "better-auth";

// Connect with Mongoose
await mongoose.connect(process.env.MONGODB_URI!);

// Get the underlying MongoDB Db instance
const db = mongoose.connection.db;

export const auth = betterAuth({
  database: mongoAdapter(db),
  // ...
});
```

---

## Connection Management

### Graceful Shutdown

```typescript
import { client } from "./db";

process.on("SIGINT", async () => {
  await client.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await client.close();
  process.exit(0);
});
```

### Connection Health Check

```typescript
async function checkConnection() {
  try {
    await client.db().admin().ping();
    return true;
  } catch {
    return false;
  }
}
```

---

## Common Queries

### Find User by Email

```typescript
const user = await db.collection("users").findOne({ email: "user@example.com" });
```

### Find Active Sessions

```typescript
const sessions = await db.collection("sessions").find({
  userId: new ObjectId(userId),
  expiresAt: { $gt: new Date() },
}).toArray();
```

### Delete Expired Sessions (Manual Cleanup)

```typescript
await db.collection("sessions").deleteMany({
  expiresAt: { $lt: new Date() },
});
```

---

## Environment Variables

```env
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority
BETTER_AUTH_SECRET=your-secret-here
APP_URL=http://localhost:3000
```

---

## Common Issues

### "MongoServerError: Authentication failed"

Check your connection string credentials and database name.

### Slow Queries

Ensure indexes are created (see Indexes section above).

### Connection Timeout in Serverless

Increase connection timeout and use connection pooling:

```typescript
const client = new MongoClient(uri, {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
});
```

---

## Official Resources

- MongoDB Adapter: https://better-auth.com/docs/adapters/mongodb
