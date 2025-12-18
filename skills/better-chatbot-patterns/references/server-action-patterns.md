# Server Action Validation Patterns

Complete implementation patterns for server action validators with auth, validation, and FormData parsing.

---

## The Problem

Manual server action auth and validation leads to:
- Inconsistent auth checks across actions
- Repeated FormData parsing boilerplate
- Non-standard error handling
- Type safety issues
- Security vulnerabilities from missing validation

---

## The Solution: Validated Action Utilities

Create `lib/action-utils.ts` in your project and adapt the patterns below to your auth system.

### Complete Implementation

```typescript
import { z } from "zod"

// Type for action result
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Pattern 1: Simple validation (no auth)
export function validatedAction<TSchema extends z.ZodType>(
  schema: TSchema,
  handler: (
    data: z.infer<TSchema>,
    formData: FormData
  ) => Promise<ActionResult<any>>
) {
  return async (formData: FormData): Promise<ActionResult<any>> => {
    try {
      const rawData = Object.fromEntries(formData.entries())
      const parsed = schema.safeParse(rawData)

      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }

      return await handler(parsed.data, formData)
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

// Pattern 2: With user context (adapt getUser() to your auth system)
export function validatedActionWithUser<TSchema extends z.ZodType>(
  schema: TSchema,
  handler: (
    data: z.infer<TSchema>,
    formData: FormData,
    user: { id: string; email: string } // Adapt to your User type
  ) => Promise<ActionResult<any>>
) {
  return async (formData: FormData): Promise<ActionResult<any>> => {
    try {
      // Adapt this to your auth system (Better Auth, Clerk, Auth.js, etc.)
      const user = await getUser()
      if (!user) {
        return { success: false, error: "Unauthorized" }
      }

      const rawData = Object.fromEntries(formData.entries())
      const parsed = schema.safeParse(rawData)

      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }

      return await handler(parsed.data, formData, user)
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

// Pattern 3: With permission check (adapt to your roles system)
export function validatedActionWithPermission<TSchema extends z.ZodType>(
  schema: TSchema,
  permission: "admin" | "user-manage" | string, // Your permission types
  handler: (
    data: z.infer<TSchema>,
    formData: FormData,
    user: { id: string; email: string; role: string }
  ) => Promise<ActionResult<any>>
) {
  return async (formData: FormData): Promise<ActionResult<any>> => {
    try {
      const user = await getUser()
      if (!user) {
        return { success: false, error: "Unauthorized" }
      }

      // Adapt this to your permission system
      const hasPermission = await checkPermission(user, permission)
      if (!hasPermission) {
        return { success: false, error: "Forbidden" }
      }

      const rawData = Object.fromEntries(formData.entries())
      const parsed = schema.safeParse(rawData)

      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }

      return await handler(parsed.data, formData, user)
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

// Placeholder functions - replace with your auth system
async function getUser() {
  // Better Auth: await auth()
  // Clerk: const { userId } = auth(); if (!userId) return null; return await currentUser()
  // Auth.js: const session = await getServerSession(); return session?.user
  throw new Error("Implement getUser() with your auth provider")
}

async function checkPermission(user: any, permission: string) {
  // Implement based on your role system
  throw new Error("Implement checkPermission() with your role system")
}
```

---

## Usage Examples

### Example 1: Simple Validation (No Auth)

```typescript
// app/actions/newsletter.ts
"use server"

import { validatedAction } from "@/lib/action-utils"
import { z } from "zod"

const newsletterSchema = z.object({
  email: z.string().email("Invalid email address")
})

export const subscribeToNewsletter = validatedAction(
  newsletterSchema,
  async (data, formData) => {
    // data is validated and typed
    await db.insert(subscribers).values({ email: data.email })
    return { success: true, data: { subscribed: true } }
  }
)
```

### Example 2: With User Authentication

```typescript
// app/actions/profile.ts
"use server"

import { validatedActionWithUser } from "@/lib/action-utils"
import { z } from "zod"
import { db } from "@/lib/db"

const updateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export const updateProfile = validatedActionWithUser(
  updateProfileSchema,
  async (data, formData, user) => {
    // user is guaranteed authenticated
    // data is validated and typed
    await db.update(users).set(data).where(eq(users.id, user.id))
    return { success: true, data: { updated: true } }
  }
)
```

### Example 3: With Permission Checks

```typescript
// app/actions/admin.ts
"use server"

import { validatedActionWithPermission } from "@/lib/action-utils"
import { z } from "zod"

const deleteUserSchema = z.object({
  userId: z.string().uuid()
})

export const deleteUser = validatedActionWithPermission(
  deleteUserSchema,
  "admin", // Requires admin permission
  async (data, formData, user) => {
    // user is authenticated AND has admin permission
    await db.delete(users).where(eq(users.id, data.userId))
    return { success: true, data: { deleted: true } }
  }
)
```

---

## Auth System Adaptation Guide

### Better Auth

```typescript
import { auth } from "@/lib/auth"

async function getUser() {
  const session = await auth()
  if (!session?.user) return null
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role
  }
}
```

### Clerk

```typescript
import { auth, currentUser } from "@clerk/nextjs/server"

async function getUser() {
  const { userId } = auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) return null

  return {
    id: user.id,
    email: user.emailAddresses[0].emailAddress,
    role: user.publicMetadata?.role as string
  }
}
```

### Auth.js (NextAuth)

```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role
  }
}
```

---

## Permission System Patterns

### Simple Role-Based

```typescript
async function checkPermission(user: { role: string }, permission: string) {
  const rolePermissions = {
    admin: ["admin", "user-manage", "content-manage"],
    editor: ["content-manage"],
    user: []
  }

  return rolePermissions[user.role]?.includes(permission) || false
}
```

### Database-Driven Permissions

```typescript
async function checkPermission(user: { id: string }, permission: string) {
  const userPermissions = await db
    .select()
    .from(permissions)
    .where(eq(permissions.userId, user.id))

  return userPermissions.some(p => p.name === permission)
}
```

### Attribute-Based Access Control (ABAC)

```typescript
async function checkPermission(
  user: { id: string; department: string },
  permission: string,
  resource?: { ownerId: string; department: string }
) {
  // Check direct permissions
  const hasPermission = await db.query.permissions.findFirst({
    where: and(
      eq(permissions.userId, user.id),
      eq(permissions.name, permission)
    )
  })

  if (hasPermission) return true

  // Check resource-based permissions
  if (resource) {
    return (
      user.id === resource.ownerId ||
      user.department === resource.department
    )
  }

  return false
}
```

---

## When to Use

**Use `validatedAction`** when:
- Public endpoints (newsletter signup, contact forms)
- No authentication required
- Simple data validation needed

**Use `validatedActionWithUser`** when:
- User-specific operations (profile updates, settings)
- Need authenticated user context
- User owns the resource being modified

**Use `validatedActionWithPermission`** when:
- Admin operations (user management, content moderation)
- Role-based access control needed
- Sensitive operations requiring specific permissions

---

## Benefits

✅ **Consistent**: Same pattern across all server actions
✅ **Type-safe**: Full TypeScript inference from Zod schemas
✅ **Secure**: Automatic auth and permission checks
✅ **DRY**: No repeated boilerplate in every action
✅ **Maintainable**: Change auth system once, not in every action

---

**Last Updated**: 2025-12-17
