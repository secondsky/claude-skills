
```typescript
// ❌ BAD: Manual parsing
const name = formData.get("name") as string
if (!name) throw new Error("Name required")

// ✅ GOOD: Validator with Zod
const schema = z.object({ name: z.string().min(1) })
export const action = validatedAction(schema, async (data) => {
  // data.name is validated and typed
})
```

### Issue #4: Cross-Field Validation Issues

**Error**: Password mismatch validation not working
**Why It Happens**: Separate validation for related fields
**Prevention**: Use Zod `superRefine`

```typescript
// ❌ BAD: Separate checks
if (data.password !== data.confirmPassword) { /* error */ }

// ✅ GOOD: Zod superRefine
const schema = z.object({
  password: z.string(),
  confirmPassword: z.string()
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      path: ["confirmPassword"],
      message: "Passwords must match"
    })
  }
})
```

### Issue #5: Workflow State Inconsistency

**Error**: Zustand state updates not triggering re-renders
**Why It Happens**: Deep mutation of nested workflow state
**Prevention**: Use shallow updates

```typescript
// ❌ BAD: Deep mutation
store.workflow.nodes[0].status = "complete"

// ✅ GOOD: Shallow update
set(state => ({
  workflow: {
    ...state.workflow,
    nodes: state.workflow.nodes.map((node, i) =>
      i === 0 ? { ...node, status: "complete" } : node
    )
  }
}))
```

### Issue #6: Missing E2E Test Setup

**Error**: E2E tests failing on clean database
**Why It Happens**: Running standard tests before first-user setup
**Prevention**: Use correct test commands

```bash
# ❌ BAD: Running standard tests on clean DB
pnpm test:e2e:standard

# ✅ GOOD: Full suite with first-user setup
pnpm test:e2e
```

### Issue #7: Environment Config Mistakes

**Error**: Missing required environment variables causing crashes
**Why It Happens**: Not copying `.env.example` to `.env`
**Prevention**: Auto-generated `.env` on `pnpm i`

```bash
# Auto-generates .env on install
pnpm i

# Verify all required vars present
# Required: DATABASE_URL, at least one LLM_API_KEY
```

### Issue #8: Incorrect Commit Message Format

**Error**: CI/CD failures due to non-conventional commit format
**Why It Happens**: Not following Conventional Commits standard
**Prevention**: Use prefix + colon format

```bash
# ❌ BAD:
git commit -m "added feature"
git commit -m "fix bug"

# ✅ GOOD:
git commit -m "feat: add MCP tool streaming"
git commit -m "fix: resolve auth redirect loop"
```

---

