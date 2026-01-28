# Initialize App Once, Not Per Mount

**Rule Summary:**
Avoid placing app-wide initialization logic inside `useEffect([])` hooks, as components can remount and cause effects to re-run. Instead, implement module-level guards or initialize at the entry point.

**Key Problem:**
The incorrect approach allows initialization code to execute multiple times—twice in development mode and again on component remounts.

**Solution:**
Use a module-scoped boolean flag to ensure initialization runs exactly once:

```tsx
let didInit = false

function Comp() {
  useEffect(() => {
    if (didInit) return
    didInit = true
    loadFromStorage()
    checkAuthToken()
  }, [])
}
```

**Impact Level:** LOW-MEDIUM (prevents duplicate initialization in development)

**Related Concepts:** initialization, useEffect, app-startup, side-effects

**Reference:** React's official documentation on "Initializing the application"
