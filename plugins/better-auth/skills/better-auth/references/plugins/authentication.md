# better-auth Authentication Plugins

Complete guide for enhanced authentication methods: 2FA, Passkeys, Magic Links, Email OTP, and Anonymous Users.

---

## Two-Factor Authentication (2FA/TOTP)

### Installation

```bash
bun add better-auth
```

### Server Configuration

**`src/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  // ... database config
  plugins: [
    twoFactor({
      issuer: "Your App Name",  // Shown in authenticator apps
      totpOptions: {
        digits: 6,
        period: 30,  // seconds
      },
    }),
  ],
});
```

### Client Configuration

```typescript
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [twoFactorClient()],
});
```

### Enable 2FA Flow

```typescript
// Step 1: Generate TOTP secret and QR code
const { data } = await authClient.twoFactor.enable();
// data.totpURI - Use with QR code library
// data.backupCodes - Show to user ONCE

// Step 2: Verify setup with code from authenticator app
await authClient.twoFactor.verifyTotp({
  code: "123456",
});
```

### Login with 2FA

```typescript
// Step 1: Normal sign-in
const result = await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});

// Step 2: Check if 2FA is required
if (result.data?.twoFactorRedirect) {
  // Show 2FA input
  await authClient.twoFactor.verifyTotp({
    code: userEnteredCode,
  });
}
```

### Backup Codes

```typescript
// Generate new backup codes (invalidates old ones)
const { data } = await authClient.twoFactor.generateBackupCodes();
// data.backupCodes - Array of 10 codes

// Use backup code instead of TOTP
await authClient.twoFactor.verifyBackupCode({
  code: "XXXX-XXXX",
});
```

### Disable 2FA

```typescript
await authClient.twoFactor.disable({
  password: "current-password",  // Verify user identity
});
```

---

## Passkeys (WebAuthn)

### Installation

```bash
bun add better-auth @simplewebauthn/browser @simplewebauthn/server
```

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    passkey({
      rpID: "your-domain.com",  // Relying Party ID
      rpName: "Your App",       // Display name
      origin: "https://your-domain.com",
    }),
  ],
});
```

### Client Configuration

```typescript
import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [passkeyClient()],
});
```

### Register Passkey

```typescript
// Add passkey to existing account
await authClient.passkey.addPasskey({
  name: "MacBook Pro Touch ID",  // User-friendly name
});
// Browser will prompt for biometric/PIN
```

### Sign In with Passkey

```typescript
// Passwordless sign-in
const result = await authClient.signIn.passkey();
// Browser will prompt for biometric/PIN
```

### Conditional UI (Autofill)

```typescript
// Enable passkey autofill in login form
useEffect(() => {
  authClient.passkey.signIn({
    autoFill: true,
  });
}, []);
```

### List/Remove Passkeys

```typescript
// List user's passkeys
const { data: passkeys } = await authClient.passkey.listPasskeys();

// Remove a passkey
await authClient.passkey.deletePasskey({
  passkeyId: "passkey-id",
});
```

---

## Magic Links

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        // Send email with your provider (Resend, SendGrid, etc.)
        await sendEmail({
          to: email,
          subject: "Sign in to Your App",
          html: `<a href="${url}">Click to sign in</a>`,
        });
      },
      expiresIn: 60 * 10,  // 10 minutes
    }),
  ],
});
```

### Client Usage

```typescript
import { magicLinkClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

// Request magic link
await authClient.signIn.magicLink({
  email: "user@example.com",
  callbackURL: "/dashboard",  // Where to redirect after verification
});

// User clicks link in email → automatically signed in
```

### Verify Magic Link (Server-Side)

```typescript
// Handle callback route
app.get("/api/auth/magic-link/verify", async (req, res) => {
  const { token } = req.query;

  const session = await auth.api.verifyMagicLink({
    token: token as string,
  });

  // Redirect to app
  res.redirect("/dashboard");
});
```

---

## Email OTP

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        await sendEmail({
          to: email,
          subject: "Your verification code",
          text: `Your code is: ${otp}`,
        });
      },
      otpLength: 6,
      expiresIn: 60 * 5,  // 5 minutes
    }),
  ],
});
```

### Client Usage

```typescript
import { emailOTPClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});

// Step 1: Request OTP
await authClient.signIn.emailOTP({
  email: "user@example.com",
});

// Step 2: Verify OTP
await authClient.signIn.emailOTP({
  email: "user@example.com",
  otp: "123456",
});
```

---

## Anonymous Users

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    anonymous({
      // Optional: Enable linking to real account later
      allowLinking: true,
    }),
  ],
});
```

### Client Usage

```typescript
import { anonymousClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [anonymousClient()],
});

// Create anonymous session
const { data } = await authClient.signIn.anonymous();
// data.user.isAnonymous === true

// Later: Link to real account
await authClient.linkAccount.email({
  email: "user@example.com",
  password: "new-password",
});
// Anonymous user converted to regular user
```

### Check Anonymous Status

```typescript
const { data: session } = useSession();

if (session?.user.isAnonymous) {
  // Show "Create Account" prompt
}
```

---

## Combining Plugins

```typescript
import { betterAuth } from "better-auth";
import {
  twoFactor,
  passkey,
  magicLink,
  emailOTP,
  anonymous
} from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    twoFactor({ issuer: "Your App" }),
    passkey({ rpID: "your-domain.com", rpName: "Your App", origin: "https://your-domain.com" }),
    magicLink({ sendMagicLink: async ({ email, url }) => { /* ... */ } }),
    emailOTP({ sendVerificationOTP: async ({ email, otp }) => { /* ... */ } }),
    anonymous({ allowLinking: true }),
  ],
});
```

---

## Common Issues

### 2FA: "Invalid code"
- Ensure device time is synced (NTP)
- Check TOTP period matches (default 30s)

### Passkeys: "Origin mismatch"
- `origin` in config must match exactly (https://domain.com, not https://domain.com/)
- `rpID` must be the domain without protocol

### Magic Link: "Token expired"
- Default expiry is 10 minutes
- Increase `expiresIn` if needed

### Anonymous: "Cannot link account"
- Ensure `allowLinking: true` in config
- User must be currently signed in as anonymous

---

## Official Resources

- Two-Factor: https://better-auth.com/docs/plugins/two-factor
- Passkeys: https://better-auth.com/docs/plugins/passkey
- Magic Link: https://better-auth.com/docs/plugins/magic-link
- Email OTP: https://better-auth.com/docs/plugins/email-otp
- Anonymous: https://better-auth.com/docs/plugins/anonymous
