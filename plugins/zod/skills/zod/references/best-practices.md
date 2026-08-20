# Zod Best Practices Rulebook

Actionable rules for production Zod code, prioritized by impact. Each rule shows the
**incorrect** pattern, the **correct** pattern, and — just as important — **when NOT
to apply it**. All examples use Zod 4 APIs verified against 4.4.3.

**Last Updated**: 2026-08-20

---

## Rule Index (by priority)

| # | Rule | Impact |
|---|------|--------|
| 1 | Validate at system boundaries | CRITICAL |
| 2 | Use `.safeParse()` for untrusted input | CRITICAL |
| 3 | Never trust `JSON.parse` output | CRITICAL |
| 4 | Use `z.unknown()`, not `z.any()` | CRITICAL |
| 5 | Export schemas, derive types | HIGH |
| 6 | Define schemas at module level | HIGH |
| 7 | Pick the right object strictness | MEDIUM |
| 8 | `optional()` vs `nullable()` vs `default()` discipline | MEDIUM |
| 9 | Validate once — don't double-parse | MEDIUM |
| 10 | Avoid dynamic schema creation in hot paths | LOW-MEDIUM |
| 11 | Batch or stream large array validation | LOW-MEDIUM |
| 12 | Use `z.input<T>` for form initial values | MEDIUM |

---

## 1. Validate at System Boundaries — CRITICAL

**WHY**: Data crossing a trust boundary (HTTP request, message queue, `localStorage`,
file, env vars, third-party API) is untrusted. Validate once at entry, then work with
the inferred type everywhere downstream. Errors caught at the boundary carry the
request context; errors caught deep in business logic don't.

**Incorrect (what's wrong)**:
```typescript
// Assumes req.body is the right shape — crashes later, far from the cause
app.post("/users", (req, res) => {
  sendWelcomeEmail(req.body.email.toUpperCase()); // 💥 TypeError: cannot read 'toUpperCase'
});
```

**Correct**:
```typescript
const CreateUserRequest = z.object({
  email: z.email(),
  name: z.string().min(1),
});

app.post("/users", (req, res) => {
  const result = CreateUserRequest.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: z.flattenError(result.error).fieldErrors });
  }
  const user = result.data; // typed, trusted from here on
  sendWelcomeEmail(user.email);
});
```

**When NOT to use this pattern**:
- Pure internal functions already receiving validated data — re-validating is waste (see Rule 9).
- Hot paths where the boundary already validated (trust the type).

---

## 2. Use `.safeParse()` for Untrusted Input — CRITICAL

**WHY**: `.parse()` throws. On untrusted input that means an exception per bad request,
500s instead of 422/400s, and try/catch noise. `.safeParse()` returns a discriminated
union you can branch on.

**Incorrect**:
```typescript
try {
  const user = UserSchema.parse(req.body);
  res.json(user);
} catch (error) {
  // Hopeless: is this a validation error, a DB error, a bug?
  res.status(500).json({ error: "Something went wrong" });
}
```

**Correct**:
```typescript
const result = UserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(422).json({ errors: z.flattenError(result.error).fieldErrors });
}
res.json(await createUser(result.data));
```

**When NOT to use this pattern**:
- Trusted, invariant data at startup (env vars, config) where failing fast with a
  thrown, descriptive error is exactly what you want: `EnvSchema.parse(process.env)`.
- Test assertions where you *want* the throw: `expect(() => S.parse(bad)).toThrow()`.

---

## 3. Never Trust `JSON.parse` Output — CRITICAL

**WHY**: `JSON.parse` returns `any`. A stored payload from last deploy, another client
version, or a corrupted cache will silently flow through your app until something
breaks far away. Validate immediately after parsing.

**Incorrect**:
```typescript
const cart = JSON.parse(localStorage.getItem("cart") ?? "{}");
cart.items.forEach((item) => addToTotal(item.price)); // 💥 crashes on old/corrupt data
```

**Correct**:
```typescript
const CartSchema = z.object({
  items: z.array(z.object({
    id: z.uuid(),
    quantity: z.number().int().positive(),
  })),
});

function loadCart(): Cart {
  const raw = localStorage.getItem("cart");
  const result = CartSchema.safeParse(raw ? JSON.parse(raw) : { items: [] });
  return result.success ? result.data : { items: [] }; // corrupted data degrades gracefully
}
```

**When NOT to use this pattern**:
- Never skip this for external data. If parsing huge trusted internal blobs where you
  control both writer and reader and can afford a crash, `.parse()` (throw) is fine —
  silent `any` is not.

---

## 4. Use `z.unknown()`, Not `z.any()` — CRITICAL

**WHY**: `z.any()` disables type checking for everything downstream — it's an `any`
that survived validation. `z.unknown()` forces you to narrow. If you can't articulate
the shape, at least make consumers validate before use. For values that are one of a
known set of shapes, model it as a union (or discriminated union) instead.

**Incorrect**:
```typescript
const Webhook = z.object({ data: z.any() });
// data is any — every consumer can misuse it with zero compiler help
```

**Correct**:
```typescript
const Webhook = z.object({
  event: z.enum(["user.created", "order.paid"]),
  data: z.unknown(),            // must be narrowed before use
});
// ...or better, model the shapes:
const Payload = z.discriminatedUnion("event", [
  z.object({ event: z.literal("user.created"), data: z.object({ id: z.uuid() }) }),
  z.object({ event: z.literal("order.paid"), data: z.object({ total: z.number() }) }),
]);
```

**When NOT to use this pattern**:
- Pass-through proxies that genuinely forward opaque payloads untouched — `z.any()`
  still isn't right; use `z.unknown()` there too. (There is no good use for `z.any()`.)

---

## 5. Export Schemas, Derive Types — HIGH

**WHY**: Hand-written interfaces drift from the schemas that actually run. The schema
is the single source of truth; `z.infer` makes the compiler enforce it.

**Incorrect**:
```typescript
// Two definitions that WILL drift apart
export interface User { email: string; age: number; }
export const UserSchema = z.object({ email: z.email(), age: z.number().int() });
```

**Correct**:
```typescript
export const UserSchema = z.object({ email: z.email(), age: z.number().int() });
export type User = z.infer<typeof UserSchema>;
```

**When NOT to use this pattern**:
- Public library APIs where you want a stable, documented type independent of your
  validation internals.

---

## 6. Define Schemas at Module Level — HIGH

**WHY**: Zod 4 JIT-compiles schemas: creation costs more than v3, repeated parsing is
far faster. Recreating a schema per request/hot call pays the creation cost every time
and throws away the JIT work.

**Incorrect**:
```typescript
app.post("/users", (req, res) => {
  const schema = z.object({ email: z.email() }); // rebuilt on EVERY request
  const result = schema.safeParse(req.body);
  // ...
});
```

**Correct**:
```typescript
const CreateUserSchema = z.object({ email: z.email() }); // created once, JIT pays off
app.post("/users", (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  // ...
});
```

**When NOT to use this pattern**:
- Genuinely dynamic shapes (schema driven by per-tenant config) — cache the built
  schemas in a `Map` keyed by config instead of rebuilding.

---

## 7. Pick the Right Object Strictness — MEDIUM

**WHY**: Default `z.object` silently **strips** unknown keys — convenient, but it can
mask client bugs (typo'd field is dropped, then "missing" downstream). Strictness is
a real API contract decision:

| Constructor | Unknown keys | Use when |
|---|---|---|
| `z.object({...})` | stripped (default) | Internal normalization, most APIs |
| `z.strictObject({...})` | rejected (`unrecognized_keys`) | Public APIs — fail loudly on client typos |
| `z.looseObject({...})` | passed through | Proxies/passthrough that must keep extras |
| `z.object({...}).catchall(schema)` | validated + kept | Dynamic keys with a known value type |

**Incorrect**:
```typescript
// Client sends { "emial": "..." } (typo) → silently dropped, email "missing" later
const CreateUser = z.object({ email: z.email() });
```

**Correct**:
```typescript
// Client gets an immediate, actionable unrecognized_keys error
const CreateUser = z.strictObject({ email: z.email() });
```

**When NOT to use this pattern**:
- Don't make internal objects strict "for safety" if you routinely forward extra keys
  (metadata, tracing fields) — use `.catchall()` or `z.looseObject` deliberately.
- v3 `.passthrough()`/`.strict()` methods still work but are deprecated; use the
  constructors above.

---

## 8. `optional()` vs `nullable()` vs `default()` Discipline — MEDIUM

**WHY**: These encode different contracts, and mixing them produces `string | null |
undefined` soup that leaks into UI code.

- `optional()` — the key may be **absent** (input omitted)
- `nullable()` — the key must be **present**, value may be `null` (DB NULL, JSON null)
- `default(v)` — absent → filled with `v` **after** parsing (output type has no `| undefined`)
- `z.coerce...().prefault(v)` — filled **before** parsing (v3-style default semantics)

**Incorrect**:
```typescript
const Profile = z.object({
  nickname: z.string().nullable().optional(), // which is it? both leak to the UI
});
```

**Correct**:
```typescript
const Profile = z.object({
  nickname: z.string().nullable(),   // column is NULL-able in DB
  displayName: z.string().default("Anonymous"), // absent → resolved value
});
```

**When NOT to use this pattern**:
- PATCH endpoints genuinely accept absent-means-don't-change — that's what
  `.partial()` is for; don't hand-roll optionality there.

---

## 9. Validate Once — Don't Double-Parse — MEDIUM

**WHY**: If a function receives data that's already been validated at the boundary,
re-parsing wastes cycles and — worse — implies the type is a lie. Let the type system
carry the proof.

**Incorrect**:
```typescript
function handler(req: Request) {
  const user = CreateUserSchema.parse(await req.json());
  chargeCard(user); // chargeCard parses AGAIN internally
}
function chargeCard(user: unknown) { const u = CreateUserSchema.parse(user); /* ... */ }
```

**Correct**:
```typescript
function handler(req: Request) {
  const user = CreateUserSchema.parse(await req.json());
  chargeCard(user);
}
function chargeCard(user: User) { /* typed param — trusted, no re-parse */ }
```

**When NOT to use this pattern**:
- Library code that can't trust its callers should re-validate — accept `unknown`,
  parse once at *your* boundary.

---

## 10. Avoid Dynamic Schema Creation in Hot Paths — LOW-MEDIUM

**WHY**: Building a schema (object spread, `.extend`, conditional composition) per
request costs the JIT setup every call. With Zod 4's JIT the delta is real in
high-QPS paths (~0.1ms/creation) even when it's invisible in tests.

**Incorrect**:
```typescript
function searchParamsSchema(sortableFields: string[]) {
  return z.object({ sortBy: z.enum(sortableFields as [string, ...string[]]) });
}
app.get("/search", (req, res) => {
  const schema = searchParamsSchema(currentFields()); // rebuilt per request
  // ...
});
```

**Correct**:
```typescript
// Compute the (small, finite) set of shapes up front and cache them
const schemaCache = new Map<string, z.ZodType>();

function getSearchSchema(fields: string[]) {
  const key = fields.join(",");
  let schema = schemaCache.get(key);
  if (!schema) {
    schema = z.object({ sortBy: z.enum(fields as [string, ...string[]]) });
    schemaCache.set(key, schema);
  }
  return schema;
}
```

**When NOT to use this pattern**:
- Admin/config screens called a few times a day — the cache is complexity for nothing.
  Prefer the simple code until profiling says otherwise.

---

## 11. Batch or Stream Large Array Validation — LOW-MEDIUM

**WHY**: Validating a 100k-element upload in one `.parse()` blocks the event loop and
gives you all-or-nothing feedback. Fail fast on garbage, stream for progress.

**Incorrect**:
```typescript
const result = z.array(RecordSchema).safeParse(hugeJson); // blocks, all-or-nothing
```

**Correct**:
```typescript
// Fail fast: validate the first N to reject obviously bad payloads cheaply
const Head = z.array(RecordSchema).min(1);
await Head.parseAsync(hugeJson.slice(0, 100));

// Then stream the full set with progress and per-item errors
async function* validateStream(items: unknown[]) {
  for (let i = 0; i < items.length; i++) {
    yield { index: i, result: RecordSchema.safeParse(items[i]) };
  }
}
```

**When NOT to use this pattern**:
- Anything under a few thousand items — a single `safeParse` is faster and simpler.
- When you genuinely need atomicity (reject the whole batch if any record is bad) —
  that's exactly what `z.array()` gives you.

---

## 12. Use `z.input<T>` for Form Initial Values — MEDIUM

**WHY**: With transforms/defaults, the data a form produces (`z.input`) differs from
what parsing returns (`z.output`/`z.infer`). Initializing forms from the output type
causes subtle type mismatches.

**Incorrect**:
```typescript
const PasswordSchema = z.string().min(8).transform((s) => s.trim());
const Signup = z.object({ password: PasswordSchema });

type Initial = z.infer<typeof Signup>; // string — fine here, but wrong once
const form: Initial = { password: 42 as never }; // defaults/coercions break this
```

**Correct**:
```typescript
type FormInput = z.input<typeof Signup>;   // what forms/clients send
type Parsed    = z.output<typeof Signup>;  // what parsing returns
const emptyForm: FormInput = { password: "" };
```

**When NOT to use this pattern**:
- Schemas without transforms/defaults — `z.input` and `z.output` are identical, so
  just use `z.infer` for readability.

---

## Cross-Cutting: Performance Snapshot (Zod 4)

- Repeated parsing is ~7-14x faster than v3 (JIT), type instantiation ~100x lower.
- Bundle: core ~5kb / `zod/mini` ~1.9kb (gzipped). Use mini for edge/browser-critical bundles.
- `z.lazy` is for **circular references**; code splitting is `await import(...)`.
- Prefer `z.discriminatedUnion` over `z.union` when a literal key distinguishes branches.

**See also:**
- `troubleshooting.md` for detailed performance solutions
- `error-handling.md` for formatting parse errors for users
- `migration-guide.md` when updating v3-era code that violates these rules
