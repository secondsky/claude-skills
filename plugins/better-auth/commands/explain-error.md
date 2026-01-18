---
description: Explain Better Auth error codes and provide solutions with code examples
argument-hint: [error_code or error_message]
---

# Explain Better Auth Error

Provide a comprehensive explanation of the given Better Auth error code or error message.

## Process

1. **Accept the error** from arguments (error code or full error message)
2. **Check error catalog** first:
   - Load `references/error-catalog.md` to see if this is one of the 15 documented errors
   - If found, use catalog as primary reference
3. **Explain in plain English** what the error means
4. **List common causes** specific to the error
5. **Provide solutions**:
   - Configuration fixes
   - Code corrections
   - Cloudflare D1-specific solutions (if applicable)
6. **Generate error handling code** showing:
   - How to catch this specific error
   - User-friendly error messages
   - Whether retry is appropriate
   - TypeScript type guards if applicable
7. **Mention related errors** the developer should be aware of
8. **Link to documentation**:
   - Better Auth docs: https://better-auth.com/docs
   - Error catalog reference file (if documented)

## Common Better Auth Errors

If no specific error provided, list top 5 most common errors:

1. **d1Adapter is not exported** - Use drizzleAdapter instead
2. **Schema generation fails** - Use Drizzle Kit, not better-auth migrate
3. **CamelCase vs snake_case mismatch** - Column naming issues
4. **CORS errors** - Missing credentials or origin configuration
5. **OAuth redirect URI mismatch** - Callback URL configuration

## Error Categories

**Database Errors:**
- D1 adapter issues
- Schema migration problems
- Connection failures

**Authentication Errors:**
- Session validation failures
- Token expiration
- Invalid credentials

**OAuth Errors:**
- Provider configuration
- Redirect URI mismatches
- Scope issues

**CORS/Security Errors:**
- Origin blocking
- Cookie not sent
- CSRF token mismatch

## Example Usage

```
User: /better-auth:explain-error "SESSION_NOT_FOUND"

Response:
Error: SESSION_NOT_FOUND

What it means:
The session token provided is not found in the database or has expired.

Common causes:
1. Session expired (default: 7 days)
2. Session manually deleted
3. Database connection issue
4. Cookie not sent with request

Solutions:
[Detailed solutions with code examples]

Error handling code:
[Production-ready code example]
```

## Integration with Error Catalog

When the error is documented in `references/error-catalog.md`, reference it:

- **Error #1-15**: See full details in error catalog
- Include catalog solutions + additional context
- Link prevention checklist if applicable

## Focus Areas

- **Cloudflare D1 specific errors** (adapter, migrations, Drizzle)
- **Production-ready solutions** (not just "check docs")
- **Code examples** in TypeScript
- **Retry strategies** and error recovery patterns
- **User-friendly messages** for frontend display
