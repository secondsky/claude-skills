# better-auth Electron Integration

Full desktop authentication support for Electron apps via system browser OAuth flows.

---

## Installation

```bash
npm install better-auth @better-auth/electron
```

Supports two major versions behind the latest stable Electron release.

---

## Server Setup

Add the Electron plugin to the Better Auth server:

```typescript
import { betterAuth } from "better-auth";
import { electron } from "@better-auth/electron";

export const auth = betterAuth({
    plugins: [electron()],
    emailAndPassword: { enabled: true },
    social: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
});
```

---

## Web Frontend (Proxy Client)

Handle redirects back into the Electron app:

```typescript
import { createAuthClient } from "better-auth/client";
import { electronProxyClient } from "@better-auth/electron/proxy";

export const authClient = createAuthClient({
    baseURL: "http://localhost:8081",
    plugins: [
        electronProxyClient({
            protocol: { scheme: "com.example.app" },
        }),
    ],
});
```

### Sign-In Page with Electron Redirect

```typescript
import { authClient } from "../auth-client";

function SignIn({ searchParams }) {
    const query = use(searchParams);

    useEffect(() => {
        const id = authClient.ensureElectronRedirect();
        return () => clearTimeout(id);
    }, []);

    return (
        <button onClick={() =>
            authClient.signIn.social({
                provider: "google",
                fetchOptions: { query },
            })
        }>
            Sign in with Google
        </button>
    );
}
```

---

## Electron Client Setup

### Main Process Auth Client

```typescript
import { createAuthClient } from "better-auth/client";
import { electronClient } from "@better-auth/electron/client";

export const authClient = createAuthClient({
    baseURL: "http://localhost:8081",
    plugins: [
        electronClient({
            signInURL: "https://app.example.com/sign-in",
            protocol: { scheme: "com.example.app" },
            storage: {
                getItem: async (key) => { /* read from storage */ },
                setItem: async (key, value) => { /* write to storage */ },
            },
        }),
    ],
});
```

### Default Storage (using `conf` package)

```bash
npm install conf
```

```typescript
import { storage } from "@better-auth/electron/storage";

electronClient({
    storage: storage(),
});
```

---

## Protocol and Trusted Origins

Register protocol scheme in build config:

```javascript
// electron-forge
module.exports = {
    packagerConfig: {
        protocols: [{
            name: "MyApp Protocol",
            schemes: ["com.example.app"],
        }],
    },
};
```

Add to server's `trustedOrigins`:

```typescript
export const auth = betterAuth({
    trustedOrigins: ["com.example.app:/"],
});
```

---

## BrowserWindow Configuration

```typescript
import { BrowserWindow } from "electron";
import { join } from "node:path";

const win = new BrowserWindow({
    webPreferences: {
        preload: join(__dirname, "preload.mjs"),
        nodeIntegration: false,
        contextIsolation: true,
    },
});
```

For sandbox mode, ensure `@better-auth/electron` is bundled into preload:

```typescript
// electron.vite.config.ts
export default defineConfig({
    preload: {
        build: {
            externalizeDeps: {
                exclude: ["@better-auth/electron"],
            },
        },
    },
});
```

---

## Main Process Setup

```typescript
import { authClient } from "./lib/auth-client";

// Must be called before app is ready
authClient.setupMain();
```

Registers protocol handler, user image proxy, content security policies, and IPC bridges.

---

## Renderer Process Setup

### Preload Script

```typescript
import { setupRenderer } from "@better-auth/electron/preload";

// Must be called before app is ready
setupRenderer();
```

### Type Inference

```typescript
import type { authClient } from "./lib/auth-client";

declare global {
    type Bridges = typeof authClient.$Infer.Bridges;
    interface Window extends Bridges {}
}
```

---

## Usage in Renderer

### Authentication

```typescript
function Auth() {
    useEffect(() => {
        const unsubAuth = window.onAuthenticated((user) => {
            console.log("Authenticated:", user);
        });
        const unsubError = window.onAuthError((ctx) => {
            console.error("Auth error:", ctx.message);
        });

        return () => {
            unsubAuth();
            unsubError();
        };
    }, []);

    return (
        <>
            <button onClick={() => window.requestAuth()}>
                Sign in with Browser
            </button>
            <button onClick={() =>
                window.requestAuth({ provider: "google" })
            }>
                Sign in with Google
            </button>
        </>
    );
}
```

### Sign Out

```typescript
<button onClick={() => window.signOut()}>Sign out</button>;
```

### User Updates

```typescript
useEffect(() => {
    const unsub = window.onUserUpdated((user) => {
        console.log("User updated:", user);
    });
    return () => unsub();
}, []);
```

---

## Manual Token Exchange

Fallback for environments where deep links don't work reliably.

### Web Frontend

```typescript
const authorizationCode = authClient.electron.getAuthorizationCode();
if (authorizationCode) {
    // Display code for user to copy
}
```

### Electron Renderer

```typescript
function ManualCodeEntry() {
    return (
        <input
            type="text"
            placeholder="Paste code here"
            maxLength={32}
            onChange={(e) => {
                if (e.target.value.length === 32) {
                    // requestAuth() must have been called before
                    window.authenticate({ token: e.target.value });
                }
            }}
        />
    );
}
```

Authorization code is a short-lived 32-character string.

---

## User Image Proxy

Avatars proxied through `user-image://` protocol to avoid CSP issues:

```typescript
<img src={user.image} alt="Avatar" />
```

Configure or disable:

```typescript
electronClient({
    userImageProxy: {
        enabled: true,     // default
        maxSize: 1024 * 1024 * 5, // 5MB default
    },
});
```

---

## Custom IPC Bridges

### Main Process Handler

```typescript
import { ipcMain } from "electron";

ipcMain.handle("myBridge", async (_event, data) => {
    const cookie = authClient.getCookie();
    return await authClient.someEndpoint({
        data,
        fetchOptions: { headers: { cookie } },
    });
});
```

### Preload Bridge

```typescript
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("myBridge", (data: Record<string, any>) => {
    return ipcRenderer.invoke("myBridge", data);
});
```

### Type Extension

```typescript
declare global {
    type Bridges = typeof authClient.$Infer.Bridges;
    interface Window extends Bridges {
        myBridge: (data: Record<string, any>) => Promise<any>;
    }
}
```

---

## Server Plugin Options

| Option | Default | Description |
|--------|---------|-------------|
| `codeExpiresIn` | `300` | Authorization code validity (seconds) |
| `redirectCookieExpiresIn` | `120` | Redirect cookie validity (seconds) |
| `cookiePrefix` | `"better-auth"` | Cookie name prefix |
| `clientID` | `"electron"` | Client identifier |
| `disableOriginOverride` | `false` | Override origin for Electron API routes |

## Client Plugin Options

| Option | Default | Description |
|--------|---------|-------------|
| `signInURL` | Required | URL for authentication page |
| `protocol` | Required | Deep link protocol scheme |
| `callbackPath` | `"/auth/callback"` | Auth redirect path |
| `storage` | File-based | Storage implementation |
| `storagePrefix` | `"better-auth"` | Storage key prefix |
| `cookiePrefix` | `"better-auth"` | Server cookie name filter |
| `channelPrefix` | `"better-auth"` | IPC channel prefix |
| `clientID` | `"electron"` | Client identifier |
| `sanitizeUser` | None | Strip sensitive fields before sending to renderer |
| `userImageProxy` | `{ enabled: true, maxSize: 5MB }` | Avatar proxy config |
| `disableCache` | `false` | Disable local session caching |
