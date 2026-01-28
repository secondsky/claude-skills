# Authenticate Server Actions Like API Routes

**Impact: CRITICAL (prevents unauthorized access to server mutations)**

Server Actions with `"use server"` function as public endpoints similar to API routes. Authentication and authorization verification must occur **within each Server Action itself**—not relying on middleware, layout protections, or page-level checks alone, since Server Actions can be called directly.

Per Next.js guidance: "Treat Server Actions with the same security considerations as public-facing API endpoints, and verify if the user is allowed to perform a mutation."

## Key Practices:

**Don't do this:**
- Skip authentication checks in Server Actions
- Assume middleware or layout guards provide sufficient protection

**Do this:**
- Verify user session inside every Server Action
- Check authorization specific to the operation
- Validate input data before processing
- Follow the sequence: validate → authenticate → authorize → execute

**Recommended pattern:**
1. Parse/validate input using schema validation (e.g., Zod)
2. Verify user session with `verifySession()`
3. Check role-based or user-specific permissions
4. Execute the database mutation only after all checks pass

For additional reference: [https://nextjs.org/docs/app/guides/authentication](https://nextjs.org/docs/app/guides/authentication)
