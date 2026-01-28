# Use useTransition Over Manual Loading States

**Rule Summary:**
Replace manual `useState` loading state management with React's `useTransition` hook for cleaner, more efficient code.

**Key Guidance:**
The rule recommends using `useTransition` because it provides "built-in `isPending` state and automatically manages transitions" rather than manually toggling loading flags.

**Main Benefits:**
- "Automatic pending state: No need to manually manage `setIsLoading(true/false)`"
- "Error resilience: Pending state correctly resets even if the transition throws"
- Better UI responsiveness during async operations
- Automatic cancellation of previous transitions when new ones start

**Impact Level:** LOW (reduces re-renders and improves code clarity)

**Code Pattern:**
Instead of managing separate `isLoading` state alongside async operations, wrap state updates in `startTransition()` and use the returned `isPending` flag for loading indicators.
