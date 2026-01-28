# Suppress Expected Hydration Mismatches

**Metadata:**
- Impact: LOW-MEDIUM
- Impact Description: avoids noisy hydration warnings for known differences
- Tags: rendering, hydration, ssr, nextjs

**Overview:**

In Server-Side Rendering frameworks like Next.js, certain values naturally differ between server and client environments—such as random IDs, timestamps, and locale-specific formatting. The `suppressHydrationWarning` attribute should wrap elements containing these expected differences to eliminate console warnings.

**Key Guidance:**

The rule emphasizes: "Do not use this to hide real bugs. Don't overuse it." This tool targets *known, intentional* mismatches only, not legitimate hydration problems.

**Examples:**

*Problematic approach:*
```tsx
function Timestamp() {
  return <span>{new Date().toLocaleString()}</span>
}
```

*Recommended approach:*
```tsx
function Timestamp() {
  return (
    <span suppressHydrationWarning>
      {new Date().toLocaleString()}
    </span>
  )
}
```

The corrected version uses the `suppressHydrationWarning` attribute to acknowledge the intentional server-client difference without generating warnings.
