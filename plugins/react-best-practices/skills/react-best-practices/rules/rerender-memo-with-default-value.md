# Extract Default Non-primitive Parameter Value from Memoized Component to Constant

**Impact:** MEDIUM
**Impact Description:** Restores memoization by using a constant for default value
**Tags:** rerender, memo, optimization

## Summary

When a memoized component has a default value for a non-primitive optional parameter (array, function, or object), omitting that parameter breaks memoization. This occurs because new instances are created on each render cycle and fail strict equality checks in `memo()`.

## Solution

Move the default value outside the component definition as a constant to ensure stability across renders.

### Problematic Pattern
```tsx
const UserAvatar = memo(function UserAvatar({ onClick = () => {} }: { onClick?: () => void }) {
  // ...
})

// Calling without the optional parameter
<UserAvatar />
```

The inline function creates a new reference on every render, defeating memoization benefits.

### Recommended Approach
```tsx
const NOOP = () => {};

const UserAvatar = memo(function UserAvatar({ onClick = NOOP }: { onClick?: () => void }) {
  // ...
})

// Calling without the optional parameter
<UserAvatar />
```

By extracting the default into a module-level constant, the same reference persists across renders, preserving memoization effectiveness.
