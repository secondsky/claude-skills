# State Management & Validation Patterns

Complete implementation for Zustand state management with shallow updates and Zod cross-field validation.

---

## Part 1: Zustand State Management Patterns

### The Problem

Managing complex nested state (workflows, UI configuration, multi-step forms) without mutations leads to:
- Accidental state mutations causing bugs
- Verbose update code with deep object spreading
- Re-render performance issues
- Difficulty tracking state changes

### The Solution: Shallow Update Pattern

Create `app/store/workflow.ts` for workflow state management:

```typescript
import { create } from "zustand"

type WorkflowNode = {
  id: string
  status: "pending" | "running" | "complete" | "error"
  data: any
  output?: any
  error?: string
}

type WorkflowStore = {
  workflow: {
    id: string
    nodes: WorkflowNode[]
  } | null
  updateNodeStatus: (nodeId: string, status: WorkflowNode["status"]) => void
  updateNodeData: (nodeId: string, data: any) => void
  updateNodeOutput: (nodeId: string, output: any) => void
  setWorkflow: (workflow: { id: string; nodes: WorkflowNode[] }) => void
  reset: () => void
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflow: null,

  // Shallow update pattern - no deep mutation
  updateNodeStatus: (nodeId, status) =>
    set(state => ({
      workflow: state.workflow ? {
        ...state.workflow,
        nodes: state.workflow.nodes.map(node =>
          node.id === nodeId ? { ...node, status } : node
        )
      } : null
    })),

  updateNodeData: (nodeId, data) =>
    set(state => ({
      workflow: state.workflow ? {
        ...state.workflow,
        nodes: state.workflow.nodes.map(node =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      } : null
    })),

  updateNodeOutput: (nodeId, output) =>
    set(state => ({
      workflow: state.workflow ? {
        ...state.workflow,
        nodes: state.workflow.nodes.map(node =>
          node.id === nodeId ? { ...node, output } : node
        )
      } : null
    })),

  setWorkflow: (workflow) => set({ workflow }),

  reset: () => set({ workflow: null })
}))
```

### Usage Example: Workflow Execution

```typescript
// components/WorkflowExecutor.tsx
"use client"

import { useWorkflowStore } from "@/app/store/workflow"

export function WorkflowExecutor() {
  const { workflow, updateNodeStatus, updateNodeOutput } = useWorkflowStore()

  async function executeNode(nodeId: string) {
    // Update status to running
    updateNodeStatus(nodeId, "running")

    try {
      // Execute node logic
      const result = await fetch(`/api/workflow/execute/${nodeId}`)
      const output = await result.json()

      // Update with output
      updateNodeOutput(nodeId, output)
      updateNodeStatus(nodeId, "complete")
    } catch (error) {
      updateNodeStatus(nodeId, "error")
    }
  }

  if (!workflow) return <div>No workflow loaded</div>

  return (
    <div>
      {workflow.nodes.map(node => (
        <div key={node.id}>
          <h3>{node.id}</h3>
          <p>Status: {node.status}</p>
          <button onClick={() => executeNode(node.id)}>Execute</button>
        </div>
      ))}
    </div>
  )
}
```

### Additional Zustand Patterns

#### Pattern 1: Multi-Store Organization

```typescript
// app/store/ui.ts
import { create } from "zustand"

type UIStore = {
  sidebar: {
    open: boolean
    width: number
  }
  theme: "light" | "dark"
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setTheme: (theme: "light" | "dark") => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebar: {
    open: true,
    width: 256
  },
  theme: "light",

  toggleSidebar: () =>
    set(state => ({
      sidebar: { ...state.sidebar, open: !state.sidebar.open }
    })),

  setSidebarWidth: (width) =>
    set(state => ({
      sidebar: { ...state.sidebar, width }
    })),

  setTheme: (theme) => set({ theme })
}))
```

#### Pattern 2: Immer Integration (for complex updates)

```typescript
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

type State = {
  deeply: {
    nested: {
      state: {
        value: number
      }
    }
  }
  updateValue: (value: number) => void
}

export const useStore = create(
  immer<State>((set) => ({
    deeply: {
      nested: {
        state: {
          value: 0
        }
      }
    },
    // With Immer, you can mutate draft state directly
    updateValue: (value) =>
      set(draft => {
        draft.deeply.nested.state.value = value
      })
  }))
)
```

#### Pattern 3: Persist Middleware

```typescript
import { create } from "zustand"
import { persist } from "zustand/middleware"

type UserPreferences = {
  theme: "light" | "dark"
  fontSize: number
  setTheme: (theme: "light" | "dark") => void
  setFontSize: (size: number) => void
}

export const usePreferencesStore = create(
  persist<UserPreferences>(
    (set) => ({
      theme: "light",
      fontSize: 14,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize })
    }),
    {
      name: "user-preferences" // localStorage key
    }
  )
)
```

---

## Part 2: Zod Cross-Field Validation Patterns

### The Problem

Validating related fields (password confirmation, date ranges, conditional requirements) with separate validators leads to:
- Duplicate validation logic
- Inconsistent error messages
- Missing cross-field business rules
- Poor user experience

### The Solution: Zod superRefine

#### Pattern 1: Password Match Validation

```typescript
import { z } from "zod"

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      path: ["confirmPassword"],
      code: z.ZodIssueCode.custom,
      message: "Passwords must match"
    })
  }
})

// Usage
const result = passwordSchema.safeParse({
  password: "mypassword123",
  confirmPassword: "different"
})

if (!result.success) {
  console.log(result.error.errors)
  // [{ path: ['confirmPassword'], message: 'Passwords must match' }]
}
```

#### Pattern 2: Date Range Validation

```typescript
import { z } from "zod"

const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
}).superRefine((data, ctx) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)

  if (end < start) {
    ctx.addIssue({
      path: ["endDate"],
      code: z.ZodIssueCode.custom,
      message: "End date must be after start date"
    })
  }

  // Optional: Check max duration
  const maxDuration = 365 * 24 * 60 * 60 * 1000 // 1 year in ms
  if (end.getTime() - start.getTime() > maxDuration) {
    ctx.addIssue({
      path: ["endDate"],
      code: z.ZodIssueCode.custom,
      message: "Date range cannot exceed 1 year"
    })
  }
})
```

#### Pattern 3: Conditional Required Fields

```typescript
import { z } from "zod"

const conditionalSchema = z.object({
  type: z.enum(["email", "sms", "push"]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  deviceToken: z.string().optional()
}).superRefine((data, ctx) => {
  // Email required when type is 'email'
  if (data.type === "email" && !data.email) {
    ctx.addIssue({
      path: ["email"],
      code: z.ZodIssueCode.custom,
      message: "Email is required when notification type is 'email'"
    })
  }

  // Phone required when type is 'sms'
  if (data.type === "sms" && !data.phone) {
    ctx.addIssue({
      path: ["phone"],
      code: z.ZodIssueCode.custom,
      message: "Phone number is required when notification type is 'sms'"
    })
  }

  // Device token required when type is 'push'
  if (data.type === "push" && !data.deviceToken) {
    ctx.addIssue({
      path: ["deviceToken"],
      code: z.ZodIssueCode.custom,
      message: "Device token is required when notification type is 'push'"
    })
  }
})
```

#### Pattern 4: Business Rule Validation

```typescript
import { z } from "zod"

const discountSchema = z.object({
  subtotal: z.number().min(0),
  discountPercent: z.number().min(0).max(100),
  discountAmount: z.number().min(0)
}).superRefine((data, ctx) => {
  // Business rule: discount amount can't exceed subtotal
  if (data.discountAmount > data.subtotal) {
    ctx.addIssue({
      path: ["discountAmount"],
      code: z.ZodIssueCode.custom,
      message: "Discount cannot exceed subtotal"
    })
  }

  // Business rule: calculate max discount from percentage
  const maxDiscount = data.subtotal * (data.discountPercent / 100)
  if (data.discountAmount > maxDiscount) {
    ctx.addIssue({
      path: ["discountAmount"],
      code: z.ZodIssueCode.custom,
      message: `Discount cannot exceed ${data.discountPercent}% of subtotal ($${maxDiscount.toFixed(2)})`
    })
  }
})
```

#### Pattern 5: Array Cross-Field Validation

```typescript
import { z } from "zod"

const teamSchema = z.object({
  members: z.array(
    z.object({
      id: z.string(),
      email: z.string().email(),
      role: z.enum(["admin", "member"])
    })
  )
}).superRefine((data, ctx) => {
  // Business rule: At least one admin required
  const adminCount = data.members.filter(m => m.role === "admin").length
  if (adminCount === 0) {
    ctx.addIssue({
      path: ["members"],
      code: z.ZodIssueCode.custom,
      message: "Team must have at least one admin"
    })
  }

  // Business rule: No duplicate emails
  const emails = data.members.map(m => m.email)
  const uniqueEmails = new Set(emails)
  if (emails.length !== uniqueEmails.size) {
    ctx.addIssue({
      path: ["members"],
      code: z.ZodIssueCode.custom,
      message: "Team members must have unique email addresses"
    })
  }
})
```

---

## Integration Examples

### Example 1: React Hook Form + Zod

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const formSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string()
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      path: ["confirmPassword"],
      code: z.ZodIssueCode.custom,
      message: "Passwords must match"
    })
  }
})

export function PasswordForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  })

  return (
    <form onSubmit={form.handleSubmit(data => console.log(data))}>
      <input {...form.register("password")} type="password" />
      {form.formState.errors.password && (
        <p>{form.formState.errors.password.message}</p>
      )}

      <input {...form.register("confirmPassword")} type="password" />
      {form.formState.errors.confirmPassword && (
        <p>{form.formState.errors.confirmPassword.message}</p>
      )}

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Example 2: Server Action + Zustand

```typescript
// Server action with cross-field validation
"use server"

import { z } from "zod"

const bookingSchema = z.object({
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().min(1)
}).superRefine((data, ctx) => {
  if (new Date(data.checkOut) < new Date(data.checkIn)) {
    ctx.addIssue({
      path: ["checkOut"],
      code: z.ZodIssueCode.custom,
      message: "Check-out must be after check-in"
    })
  }
})

export async function createBooking(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = bookingSchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // Save booking...
  return { success: true, data: parsed.data }
}

// Client component with Zustand
import { useBookingStore } from "@/app/store/booking"

export function BookingForm() {
  const { setBooking } = useBookingStore()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await createBooking(formData)

    if (result.success) {
      setBooking(result.data)
    }
  }

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>
}
```

---

## When to Use

**Zustand shallow updates when**:
- Managing complex nested state
- Frequent updates without mutations needed
- Multiple components need same state
- Avoiding re-render issues

**Zod superRefine when**:
- Password confirmation validation
- Date range validation
- Conditional required fields
- Cross-field business rules
- Array validation with cross-item rules

---

## Benefits

✅ **Zustand**: Mutation-free updates, clean syntax, performance optimization
✅ **Zod**: Type-safe validation, comprehensive error messages, business rule enforcement
✅ **Together**: Full-stack type safety from client to server

---

**Last Updated**: 2025-12-17
