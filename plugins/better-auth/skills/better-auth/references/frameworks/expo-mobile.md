# better-auth with Expo / React Native

Complete guide for integrating better-auth with Expo and React Native mobile apps.

---

## Installation

```bash
npx expo install expo-secure-store expo-web-browser expo-auth-session
bun add better-auth
```

---

## Client Setup

### Create Auth Client

**`lib/auth-client.ts`**:
```typescript
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Custom storage using SecureStore for mobile
const expoStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  storage: expoStorage,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

---

## Email/Password Authentication

### Login Screen

**`app/(auth)/login.tsx`**:
```typescript
import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { signIn } from "@/lib/auth-client";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");

    const { error: authError } = await signIn.email({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else {
      router.replace("/(app)/home");
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 15, marginBottom: 10, borderRadius: 8 },
  button: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "red", marginBottom: 10 },
});
```

---

## OAuth / Social Authentication

### Using expo-auth-session

**`lib/oauth.ts`**:
```typescript
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { signIn } from "./auth-client";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  // Get the redirect URI for your app
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "your-app-scheme",
    path: "auth/callback",
  });

  // Start OAuth flow
  await signIn.social({
    provider: "google",
    callbackURL: redirectUri,
  });
}
```

### OAuth Button Component

**`components/GoogleSignIn.tsx`**:
```typescript
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { signInWithGoogle } from "@/lib/oauth";

export function GoogleSignInButton() {
  return (
    <TouchableOpacity style={styles.button} onPress={signInWithGoogle}>
      <Text style={styles.text}>Sign in with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4285F4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  text: { color: "#fff", fontWeight: "600", marginLeft: 10 },
});
```

### Deep Linking Setup

**`app.json`**:
```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "plugins": [
      [
        "expo-auth-session",
        {
          "scheme": "your-app-scheme"
        }
      ]
    ]
  }
}
```

---

## Session Management

### Auth Context

**`context/AuthContext.tsx`**:
```typescript
import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut as authSignOut } from "@/lib/auth-client";
import { useRouter, useSegments } from "expo-router";

type AuthContextType = {
  session: any;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/home");
    }
  }, [session, isPending, segments]);

  async function signOut() {
    await authSignOut();
    router.replace("/(auth)/login");
  }

  return (
    <AuthContext.Provider value={{ session, isLoading: isPending, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

### Root Layout

**`app/_layout.tsx`**:
```typescript
import { Slot } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
```

---

## Protected Screens

**`app/(app)/home.tsx`**:
```typescript
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text>Email: {session?.user.email}</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  button: { backgroundColor: "#FF3B30", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
```

---

## API Requests with Auth

### Fetch with Credentials

```typescript
import { authClient } from "@/lib/auth-client";

async function fetchProtectedData() {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/protected`, {
    headers: {
      // Get session token from auth client
      ...authClient.getHeaders(),
    },
  });

  return response.json();
}
```

---

## Last Login Method Plugin

Track the last login method used (v1.4.6+):

```typescript
// Server config
import { lastLoginMethod } from "better-auth/plugins";

const auth = betterAuth({
  // ...
  plugins: [lastLoginMethod()],
});

// Client usage
const { data: session } = useSession();
console.log(session?.user.lastLoginMethod); // "email" | "google" | etc.
```

---

## Environment Variables

**`.env`**:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

For production, use your deployed API URL.

---

## Common Issues

### SecureStore Key Length

SecureStore keys must be under 2048 bytes. The auth client handles this automatically.

### OAuth Redirect Issues

Ensure your deep link scheme is configured:
1. Add scheme to `app.json`
2. Register the scheme with OAuth provider
3. Handle the callback in your app

### Network Errors on iOS Simulator

Use your machine's IP instead of localhost:
```typescript
baseURL: "http://192.168.1.xxx:3000"
```

---

## Official Resources

- Expo Integration: https://better-auth.com/docs/integrations/expo
- React Native: https://better-auth.com/docs/integrations/react-native
