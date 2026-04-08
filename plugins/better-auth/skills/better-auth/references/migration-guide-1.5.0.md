# Migration Guide: better-auth v1.4.x → v1.5.0

Breaking changes and migration steps for upgrading to v1.5.0.

---

## Quick Upgrade

```bash
npx auth upgrade
```

Review all changes below before deploying.

---

## Breaking Changes

### 1. Deprecated API Removals

All previously `@deprecated` APIs have been removed:

| Removed | Replacement |
|---------|-------------|
| `Adapter` | `DBAdapter` |
| `TransactionAdapter` | `DBTransactionAdapter` |
| `Store` (client) | `ClientStore` |
| `AtomListener` (client) | `ClientAtomListener` |
| `ClientOptions` | `BetterAuthClientOptions` |
| `LiteralUnion`, `DeepPartial` | Import from `@better-auth/core` |
| `onEmailVerification` | `afterEmailVerification` |
| `sendChangeEmailVerification` | `sendChangeEmailConfirmation` |
| `advanced.database.useNumberId` | `advanced.database.generateId: "serial"` |
| Organization `permission` field | `permissions` (plural) |

### 2. `/forget-password/email-otp` Removed

Use the standard password reset flow instead.

### 3. Adapter Import Change

```typescript
// OLD
import { testAdapter, createTestSuite } from "better-auth/adapters/test";

// NEW
import { testAdapter, createTestSuite } from "@better-auth/test-utils/adapter";
```

### 4. API Key Plugin Moved to `@better-auth/api-key`

Install separately:

```bash
npm install @better-auth/api-key
```

Update imports:

```typescript
// Server
- import { apiKey } from "better-auth/plugins";
+ import { apiKey } from "@better-auth/api-key";

// Client
- import { apiKeyClient } from "better-auth/client/plugins";
+ import { apiKeyClient } from "@better-auth/api-key/client";
```

#### Schema Changes

- `userId` field on `ApiKey` table renamed to `referenceId`
- New `configId` field added (defaults to `"default"`)

Run migrations after upgrading:

```bash
npx auth migrate
```

#### Plugin Options Changes

`permissions.defaultPermissions` callback first argument renamed:

```typescript
apiKey({
    permissions: {
-       defaultPermissions: async (userId, ctx) => {
+       defaultPermissions: async (referenceId, ctx) => {
            return { files: ["read"] };
        },
    },
});
```

#### Client SDK Changes

```typescript
- const ownerId = apiKey.userId;
+ const ownerId = apiKey.referenceId;
+ const ownerType = apiKey.references; // "user" or "organization"
+ const configId = apiKey.configId;
```

#### Permission Changes

`updateApiKey` now requires a `userId` parameter or headers on the server side.

### 5. After Hooks Run Post-Transaction

Database "after" hooks (`create.after`, `update.after`, `delete.after`) now execute **after** the transaction commits, not during it.

If your plugin relies on after hooks for additional atomic database writes inside the transaction, use the adapter directly within the main operation instead.

### 6. `getMigrations` Import Path Changed

```typescript
- import { getMigrations } from "better-auth";
+ import { getMigrations } from "better-auth/db/migration";
```

This reduces bundle size by avoiding unnecessary third-party dependencies.

### 7. `$ERROR_CODES` Type Changed

```typescript
// OLD
$ERROR_CODES: {
    MY_ERROR: "My error message",
}

// NEW - use defineErrorCodes()
$ERROR_CODES: defineErrorCodes({
    MY_ERROR: "My error message",
}),
// Returns: { MY_ERROR: { code: "MY_ERROR", message: "My error message" } }
```

Use `APIError.from()` to throw errors with codes:

```typescript
import { APIError } from "@better-auth/core/error";
throw APIError.from("BAD_REQUEST", MY_ERROR_CODES.MY_ERROR);
```

### 8. `InferUser` / `InferSession` Removed

```typescript
- import type { InferUser, InferSession } from "better-auth/types";
- type MyUser = InferUser<typeof auth>;

+ import type { User, Session } from "better-auth";
+ type MyUser = User<typeof auth.$options["user"], typeof auth.$options["plugins"]>;
```

### 9. `@better-auth/core/utils` Barrel Split

```typescript
- import { generateId, safeJSONParse, defineErrorCodes } from "@better-auth/core/utils";

+ import { generateId } from "@better-auth/core/utils/id";
+ import { safeJSONParse } from "@better-auth/core/utils/json";
+ import { defineErrorCodes } from "@better-auth/core/utils/error-codes";
```

### 10. `PluginContext` Now Generic

```typescript
type PluginContext<Options extends BetterAuthOptions> = {
    getPlugin: <ID extends string>(pluginId: ID) => /* inferred */ | null;
    hasPlugin: <ID extends string>(pluginId: ID) => boolean;
};
```

Register via module augmentation:

```typescript
declare module "@better-auth/core" {
    interface BetterAuthPluginRegistry<AuthOptions, Options> {
        "my-plugin": { creator: typeof myPlugin };
    }
}
```

### 11. `id` Field Removed from Session in Secondary Storage

If your plugin reads sessions from secondary storage and relies on the `id` field, update your code.

### 12. Plugin `init()` Context Now Mutable

The context passed to `init()` is the same reference used throughout the auth lifecycle. `init()` can return arbitrary keys via `Record<string, unknown>`.

---

## v1.6.0 Additional Breaking Changes

### `freshAge` Now Uses `createdAt`

```typescript
// Session freshness is now based on createdAt, not updatedAt
export const auth = betterAuth({
    session: {
        freshAge: 60 * 5, // 5 minutes from session CREATION
    },
});
```

Sensitive operations may require re-authentication more frequently. Set `freshAge: 0` to disable.

### InResponseTo Validation Default ON for SAML

```typescript
import { sso } from "@better-auth/sso";

// To opt out:
sso({
    saml: {
        enableInResponseToValidation: false,
    },
});
```

### OIDC Provider Plugin Deprecated

Use `@better-auth/oauth-provider` instead. Will be removed in next minor version.

---

## Upgrade Checklist

- [ ] Run `npx auth upgrade`
- [ ] Search codebase for removed APIs (table above) and replace
- [ ] Install `@better-auth/api-key` if using API key plugin
- [ ] Update API key imports and schema (`userId` → `referenceId`)
- [ ] Update `getMigrations` import path
- [ ] Update `$ERROR_CODES` to use `defineErrorCodes()`
- [ ] Replace `InferUser`/`InferSession` with generic `User`/`Session` types
- [ ] Split `@better-auth/core/utils` imports
- [ ] Review after hooks that depend on transaction context
- [ ] Run `npx auth migrate` for schema changes
- [ ] Test SAML flows (InResponseTo now validated by default)
- [ ] Review session freshness behavior (`createdAt` based)
- [ ] Migrate OIDC Provider → OAuth 2.1 Provider
