# better-auth Test Utilities Plugin

Testing helpers for integration and E2E testing. Do not use in production.

---

## Setup

### Server Plugin

```typescript
import { testUtils } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [testUtils({ captureOTP: true })],
});
```

### Access Test Helpers

```typescript
const ctx = await auth.$context;
const test = ctx.test;
```

---

## Factories

Create objects without persisting to database.

### createUser

```typescript
// With defaults
const user = test.createUser();
// { id: "...", email: "user-xxx@example.com", name: "Test User", emailVerified: true }

// With overrides
const user = test.createUser({
    email: "alice@example.com",
    name: "Alice",
    emailVerified: false,
});
```

### createOrganization

Requires organization plugin.

```typescript
const org = test.createOrganization({
    name: "Acme Corp",
    slug: "acme-corp",
});
```

---

## Database Helpers

Persist and remove test data.

### saveUser / deleteUser

```typescript
const user = test.createUser({ email: "test@example.com" });
const savedUser = await test.saveUser(user);

await test.deleteUser(user.id);
```

### saveOrganization / deleteOrganization

Requires organization plugin.

```typescript
const org = test.createOrganization({ name: "Test Org" });
const savedOrg = await test.saveOrganization(org);

await test.deleteOrganization(org.id);
```

### addMember

```typescript
const member = await test.addMember({
    userId: user.id,
    organizationId: org.id,
    role: "admin",
});
```

---

## Auth Helpers

Create authenticated sessions for testing protected routes.

### login

Creates a session and returns all auth data:

```typescript
const { session, user, headers, cookies, token } = await test.login({
    userId: user.id,
});
```

- `session` - Session object with userId, token, etc.
- `user` - User object
- `headers` - Headers with session cookie (for fetch/Request)
- `cookies` - Cookie array (for Playwright/Puppeteer)
- `token` - Session token string

### getAuthHeaders

```typescript
const headers = await test.getAuthHeaders({ userId: user.id });
const session = await auth.api.getSession({ headers });
const response = await fetch("/api/protected", { headers });
```

### getCookies

Browser testing tool compatible (Playwright, Puppeteer):

```typescript
const cookies = await test.getCookies({
    userId: user.id,
    domain: "localhost",
});

// Playwright
await context.addCookies(cookies);

// Puppeteer
for (const cookie of cookies) {
    await page.setCookie(cookie);
}
```

Each cookie: `name`, `value`, `domain`, `path`, `httpOnly`, `secure`, `sameSite`.

---

## OTP Capture

Passively captures OTPs as they are created. Does not prevent normal sending.

```typescript
export const auth = betterAuth({
    plugins: [
        testUtils({ captureOTP: true }),
        emailOTP({
            async sendVerificationOTP({ email, otp }) {
                // Normal sending still works
            },
        }),
    ],
});
```

### getOTP

```typescript
await auth.api.sendVerificationOTP({
    body: { email: "user@example.com", type: "sign-in" },
});

const otp = test.getOTP("user@example.com");
// "123456"
```

### clearOTPs

```typescript
test.clearOTPs();
```

---

## Integration Test Example (Vitest)

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { auth } from "./auth";
import type { TestHelpers } from "better-auth/plugins";

describe("protected route", () => {
    let test: TestHelpers;

    beforeAll(async () => {
        const ctx = await auth.$context;
        test = ctx.test;
    });

    it("should return user data for authenticated request", async () => {
        const user = test.createUser({ email: "test@example.com" });
        await test.saveUser(user);

        const headers = await test.getAuthHeaders({ userId: user.id });
        const session = await auth.api.getSession({ headers });
        expect(session?.user.id).toBe(user.id);

        await test.deleteUser(user.id);
    });
});
```

---

## E2E Test Example (Playwright)

```typescript
import { test, expect } from "@playwright/test";
import { auth } from "./auth";

test("dashboard shows user name", async ({ context, page }) => {
    const ctx = await auth.$context;
    const testUtils = ctx.test;

    const user = testUtils.createUser({
        email: "e2e@example.com",
        name: "E2E User",
    });
    await testUtils.saveUser(user);

    const cookies = await testUtils.getCookies({
        userId: user.id,
        domain: "localhost",
    });
    await context.addCookies(cookies);

    await page.goto("/dashboard");
    await expect(page.getByText("E2E User")).toBeVisible();

    await testUtils.deleteUser(user.id);
});
```

---

## OTP Verification Test Example

```typescript
describe("OTP verification", () => {
    let test: TestHelpers;

    beforeAll(async () => {
        const ctx = await auth.$context;
        test = ctx.test;
    });

    beforeEach(() => {
        test.clearOTPs();
    });

    it("should verify email with captured OTP", async () => {
        const email = "otp-test@example.com";
        const user = test.createUser({ email, emailVerified: false });
        await test.saveUser(user);

        await auth.api.sendVerificationOTP({
            body: { email, type: "email-verification" },
        });

        const otp = test.getOTP(email);
        expect(otp).toBeDefined();

        await auth.api.verifyEmail({
            body: { email, otp },
        });

        await test.deleteUser(user.id);
    });
});
```
