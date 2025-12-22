# Multi-AI Consultant Usage Examples

Real-world scenarios demonstrating when and how to use AI consultations.

---

## Example 1: Stuck on Bug (JWT Authentication)

### Scenario

JWT authentication failing with "401 Unauthorized" error after implementing token refresh logic.

### Initial Attempt

**Claude tries first approach**:
1. Check token expiry timing
2. Verify refresh token is being stored
3. Update middleware to use refreshed token

**Result**: Still failing, but now with "invalid signature" error

### Automatic Consultation Trigger

Claude detects: 1 failed attempt + new error → Suggests consultation

```
Claude: "I've tried fixing the token expiry logic, but we're now getting
'invalid signature' errors. This suggests the issue might be elsewhere.

Should I consult Gemini for a second opinion? Gemini can search for latest
JWT security best practices and common pitfalls."

User: "Yes"
```

### Consultation Process

**Command executed**:
```
/consult-gemini JWT authentication failing with 'invalid signature' error
after trying token expiry fix
```

**Context sent**:
- Problem: 401 error → invalid signature error
- What was tried: Token expiry check, refresh token storage
- Current code: `@src/auth/session.ts @src/middleware/jwt.ts`

**Gemini's finding**:
```
Web search results show a common issue in Cloudflare Workers:

Using `process.env.JWT_SECRET` instead of `env.JWT_SECRET` (Cloudflare
binding). In Workers, environment variables must be accessed via the
`env` parameter, not `process.env`.

Source: Cloudflare Workers docs (2025 update)
Location: src/middleware/jwt.ts:14
```

### 5-Part Synthesis

**1. 🤖 My Analysis**:
- Assumed token expiry issue
- Checked refresh token storage
- Middleware seemed correct syntactically

**2. 💎 Gemini's Analysis**:
- Found common Cloudflare Workers pitfall via web search
- Identified `process.env` usage (wrong for Workers)
- Should use `env.JWT_SECRET` binding instead

**3. 🔍 Key Differences**:
- I focused on JWT logic (expiry, refresh)
- Gemini found platform-specific issue (Workers vs Node.js)
- My analysis was syntactically correct but wrong runtime
- Gemini's web search found 2025 Workers documentation

**4. ⚡ Synthesis**:
Root cause: Platform mismatch. Code works in Node.js but fails in Cloudflare
Workers because `process.env` doesn't exist in Workers runtime. Must use
Cloudflare bindings via `env` parameter.

**5. ✅ Recommended Action**:
```typescript
// src/middleware/jwt.ts:14
// Change from:
const secret = process.env.JWT_SECRET;

// To:
const secret = env.JWT_SECRET;
```

### Result

- **Bug fixed**: Changed 1 line
- **Time saved**: ~30 minutes (avoided 2-3 more trial-and-error attempts)
- **Learning**: Platform-specific environment variable access
- **Cost**: ~$0.28 (Gemini consultation)

---

## Example 2: Architecture Decision (State Management)

### Scenario

Adding new collaborative editing feature - need to choose state management approach.

### Automatic Consultation Trigger

Claude detects: Significant architectural decision → Auto-consults (mentions to user)

```
Claude: "This is an important architectural decision that will affect the
entire feature. Let me consult Gemini for the latest state management best
practices and trade-offs."

[Consulting Gemini...]
```

### Consultation Process

**Command executed**:
```
/consult-gemini State management choice for collaborative editing feature:
Redux vs Zustand vs Context API?
```

**Context sent**:
- Feature: Real-time collaborative editing
- Options considered: Redux, Zustand, Context API
- Existing code: `@src/` (to check current patterns)

**Gemini's analysis**:
```
Web search results (React 19 + 2025 patterns):

For collaborative editing with real-time updates:

1. **Zustand recommended**:
   - Lightweight, perfect for real-time sync
   - No Provider hell
   - Works well with WebSocket updates
   - Popular in modern apps

2. **Redux if**:
   - Already using Redux elsewhere (consistency)
   - Need DevTools debugging for complex state
   - Team familiar with Redux patterns

3. **Context NOT recommended**:
   - Re-render issues with frequent updates
   - Performance concerns for real-time

Source: React docs, Zustand maintainer blog (2025), Vercel state
management guide
```

### 5-Part Synthesis

**1. 🤖 My Analysis**:
- Considered all three options equally
- Leaning toward Context (simplicity)
- Concerned about Redux boilerplate

**2. 💎 Gemini's Analysis**:
- Found 2025 React best practices via web search
- Zustand recommended for real-time use cases
- Context API has performance issues with frequent updates
- Redux viable if already in use (consistency)

**3. 🔍 Key Differences**:
- I didn't consider real-time performance implications
- Gemini found specific guidance for collaborative editing
- Context seemed simple but wrong for this use case
- Zustand is modern best practice (I wasn't aware)

**4. ⚡ Synthesis**:
For real-time collaborative editing:
- **Best choice**: Zustand (lightweight + real-time friendly)
- **Alternative**: Redux (if already using, for consistency)
- **Avoid**: Context API (re-render performance issues)

Trade-offs:
- Zustand: New library to learn, but simpler than Redux
- Redux: More boilerplate, but familiar + DevTools
- Context: Simplest setup, but poor real-time performance

**5. ✅ Recommended Action**:
Implement with Zustand:
1. `npm install zustand`
2. Create store: `src/stores/collaborationStore.ts`
3. WebSocket updates → store actions
4. Components subscribe to relevant slices only

### Result

- **Decision made**: Zustand (informed by latest best practices)
- **Avoided**: Context API performance issues
- **Learning**: Modern state management for real-time features
- **Cost**: ~$0.42 (Gemini consultation with research)

---

## Example 3: Manual Consultation (Code Review)

### Scenario

Completed major refactoring - want second opinion before merging PR.

### Manual Invocation

```
User: "I want a second opinion on this refactoring. Can you use Codex for
repo-aware analysis?"

Claude: "Absolutely. I'll consult Codex to check consistency with the rest
of the codebase."
```

### Consultation Process

**Command executed**:
```
/consult-codex Review this refactoring for consistency with existing
code patterns
```

**Context sent**:
- Entire repository (Codex scans automatically)
- Refactoring scope: Authentication module reorganization

**Codex's findings**:
```
Repo-wide analysis:

✅ **Consistent**:
- Naming conventions match existing (camelCase for functions)
- File structure follows established patterns (auth/*.ts)
- Error handling consistent with other modules
- TypeScript types properly exported

⚠️ **Inconsistencies found**:
1. `src/auth/session.ts:42` uses `console.log` for debugging
   - Rest of codebase uses custom `logger.debug()`
   - Found in 23 other files: `logger.debug()` pattern

2. `src/auth/session.ts:89` directly throws Error
   - Rest of codebase uses custom `AppError` class
   - Found in 18 other files: `throw new AppError()` pattern

3. Import order differs from existing files
   - Most files: React → Libraries → Local imports
   - This file: Mixed order

💡 **Suggestions**:
- Replace `console.log` with `logger.debug()`
- Use `AppError` instead of `Error`
- Reorder imports to match project conventions
```

### 5-Part Synthesis

**1. 🤖 My Analysis**:
- Refactoring looks clean
- Types are properly defined
- Authentication logic improved
- Assumed debugging and errors were fine

**2. 🔷 Codex's Analysis**:
- Found 3 consistency issues via repo-wide scan
- Identified established patterns I missed
- Checked against 23 files for logging pattern
- Checked against 18 files for error pattern

**3. 🔍 Key Differences**:
- I focused on logic correctness
- Codex checked repo-wide consistency
- I didn't notice existing logging/error patterns
- Codex scanned entire codebase for patterns

**4. ⚡ Synthesis**:
Refactoring is logically correct but violates established patterns:
- Logging: Should use `logger.debug()` (repo standard)
- Errors: Should use `AppError` class (repo standard)
- Imports: Should follow project order convention

These are easy fixes that will make code consistent with rest of codebase.

**5. ✅ Recommended Action**:
Apply consistency fixes:
```typescript
// src/auth/session.ts:42
- console.log('Session created:', sessionId);
+ logger.debug('Session created:', sessionId);

// src/auth/session.ts:89
- throw new Error('Invalid session');
+ throw new AppError('Invalid session', 401);

// Reorder imports
- import { config } from './config';
- import { useState } from 'react';
+ import { useState } from 'react';
+ import { config } from './config';
```

### Result

- **PR improved**: 3 consistency issues fixed
- **Avoided**: Future inconsistency problems
- **Learning**: Always check repo-wide patterns
- **Cost**: ~$0.12 (Codex consultation)

---

## Example 4: Security Validation

### Scenario

Implemented new API authentication middleware - need security review.

### Automatic Consultation Trigger

Claude detects: Security implementation → Auto-consults for validation

```
Claude: "Security changes require validation. Let me consult Gemini to
verify this authentication approach against current security standards."
```

### Consultation Process

**Command executed**:
```
/consult-gemini Validate this API authentication middleware for security
best practices (2025 standards)
```

**Context sent**:
- Security concern: API authentication
- Code: `@src/middleware/auth.ts`
- Config: `@src/config/security.ts`

**Gemini's security review**:
```
Web search: Latest API security best practices (OWASP 2025)

✅ **Secure practices found**:
- Using bcrypt for password hashing (good)
- JWT tokens with expiration
- HTTPS enforcement
- Rate limiting implemented

🔴 **Critical issues**:
1. **JWT secret in code** (src/middleware/auth.ts:8)
   - Hardcoded secret instead of environment variable
   - OWASP: Use environment variables for secrets
   - Risk: Secret leaked in version control

2. **No token refresh mechanism**
   - Long-lived tokens (24h expiry)
   - OWASP: Implement refresh tokens for better security
   - Risk: Stolen tokens valid for too long

⚠️ **Recommended improvements**:
3. Token rotation on refresh
4. IP address validation (optional, for high-security)
5. Two-factor authentication support

Sources:
- OWASP API Security Top 10 (2025)
- JWT.io best practices
- NIST authentication guidelines
```

### 5-Part Synthesis

**1. 🤖 My Analysis**:
- Implemented JWT authentication
- Added rate limiting
- Used bcrypt for passwords
- Assumed this was secure enough

**2. 💎 Gemini's Analysis**:
- Found 2 critical security issues via OWASP 2025 standards
- Hardcoded secret (version control leak risk)
- No refresh token mechanism (long-lived token risk)
- Recommended modern security improvements

**3. 🔍 Key Differences**:
- I focused on basic security (hashing, rate limiting)
- Gemini checked against current OWASP standards
- I didn't consider token lifespan attack vectors
- Gemini found specific 2025 best practices

**4. ⚡ Synthesis**:
Current implementation has basic security but fails modern standards:
- **Critical**: JWT secret must be in environment variable (not hardcoded)
- **Critical**: Need refresh token mechanism (reduce stolen token window)
- **Good**: bcrypt, rate limiting, HTTPS enforcement already in place

**5. ✅ Recommended Action**:
Priority fixes:
```typescript
// 1. Move secret to environment variable
- const JWT_SECRET = 'my-secret-key';
+ const JWT_SECRET = env.JWT_SECRET; // Cloudflare binding

// 2. Implement refresh tokens
interface Tokens {
  accessToken: string;  // 15 min expiry
  refreshToken: string; // 7 day expiry
}

// 3. Add token refresh endpoint
app.post('/auth/refresh', async (req) => {
  const { refreshToken } = req.body;
  // Validate refresh token → Issue new access token
});
```

### Result

- **Security improved**: 2 critical issues fixed + refresh tokens added
- **Avoided**: Potential security breach
- **Learning**: OWASP 2025 standards, modern token practices
- **Cost**: ~$0.38 (Gemini security consultation)

---

## Example 5: Multiple AI Consultation Workflow

### Scenario

High-stakes decision: Choosing database for new microservice (PostgreSQL vs MongoDB vs DynamoDB).

### Multi-AI Strategy

Use all three AIs for different perspectives on critical decision.

### Step 1: Gemini (Web Research)

```
/consult-gemini Database choice for event-driven microservice: PostgreSQL
vs MongoDB vs DynamoDB? Need latest benchmarks and trade-offs.
```

**Gemini's analysis**:
- Web search: Latest benchmarks (2025)
- PostgreSQL: Best for complex queries, ACID guarantees
- MongoDB: Fast writes, flexible schema
- DynamoDB: Serverless scaling, lowest latency (AWS)
- Recommends: DynamoDB for serverless + event-driven

**Cost**: ~$0.45

### Step 2: Codex (Consistency Check)

```
/consult-codex Check existing database patterns in this repo. Does DynamoDB
fit with our current architecture?
```

**Codex's analysis**:
- Scans repo: Already using PostgreSQL for main data
- Found: Existing database connection patterns
- Consistency concern: Mixing SQL + NoSQL adds complexity
- Recommends: PostgreSQL for consistency, or isolate DynamoDB to this service only

**Cost**: ~$0.18

### Step 3: Fresh Claude (Sanity Check)

```
/consult-claude Based on Gemini's recommendation (DynamoDB) and Codex's
concerns (consistency), is mixing databases reasonable for this use case?
```

**Fresh Claude's perspective**:
- No bias from previous conversations
- Fresh analysis: Mixing databases is fine IF:
  - Services are truly independent
  - Bounded contexts are clear
  - Team can maintain both
- Red flag: If data needs to be joined across databases
- Recommends: Clear bounded context definition first

**Cost**: Free

### Final Synthesis

**Comparing all three perspectives**:

| Aspect | Gemini | Codex | Fresh Claude |
|--------|--------|-------|--------------|
| Focus | Latest tech + benchmarks | Repo consistency | Architecture principles |
| Recommendation | DynamoDB (best performance) | PostgreSQL (consistency) | Depends on bounded context |
| Key insight | Lowest latency for serverless | Reduces complexity | Must define service boundaries |

**Decision**:
Use PostgreSQL if:
- Service shares data with existing services
- Need complex queries or transactions
- Team unfamiliar with DynamoDB

Use DynamoDB if:
- Service is truly isolated (clear bounded context)
- Need serverless scaling
- Event-driven patterns dominate
- Team ready to manage multiple DB types

**Action**: Define bounded contexts first, then choose database based on isolation level.

### Result

- **High confidence**: 3 different perspectives converged on decision factors
- **Avoided**: Premature technology choice without architecture clarity
- **Learning**: Architecture boundaries matter more than technology benchmarks
- **Total cost**: ~$0.63 (Gemini + Codex)

---

## When to Use Multiple AIs

**High-stakes decisions** (like Example 5):
- Critical architectural choices
- Security implementations
- Performance optimizations

**Stuck after one AI**:
- Consulted Gemini, still unclear
- Try Codex for different reasoning style
- Or Fresh Claude for fresh perspective

**Validation**:
- Implemented solution from Gemini
- Use Fresh Claude for free second opinion
- Proceed if both agree

---

**Last Updated**: 2025-12-17
