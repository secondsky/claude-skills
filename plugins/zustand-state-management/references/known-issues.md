# Known Issues Prevention - Detailed Solutions

This reference covers the 5 most common Zustand issues with complete solutions.

---

## Issue #1: Next.js Hydration Mismatch

**Error**: `"Text content does not match server-rendered HTML"` or `"Hydration failed"`

**Source**:
- [DEV Community: Persist middleware in Next.js](https://dev.to/abdulsamad/how-to-use-zustands-persist-middleware-in-nextjs-4lb5)
- GitHub Discussions #2839

**Why It Happens**:
Persist middleware reads from localStorage on client but not on server, causing state mismatch.

**Prevention**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StoreWithHydration {
  count: number
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  increase: () => void
}

const useStore = create<StoreWithHydration>()(
  persist(
    (set) => ({
      count: 0,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      increase: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'my-store',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

// In component
function MyComponent() {
  const hasHydrated = useStore((state) => state._hasHydrated)

  if (!hasHydrated) {
    return <div>Loading...</div>
  }

  // Now safe to render with persisted state
  return <ActualContent />
}
```

---

## Issue #2: TypeScript Double Parentheses Missing

**Error**: Type inference fails, `StateCreator` types break with middleware

**Source**: [Official Zustand TypeScript Guide](https://zustand.docs.pmnd.rs/guides/typescript)

**Why It Happens**:
The currying syntax `create<T>()()` is required for middleware to work with TypeScript inference.

**Prevention**:
```typescript
// ❌ WRONG - Single parentheses
const useStore = create<MyStore>((set) => ({
  // ...
}))

// ✅ CORRECT - Double parentheses
const useStore = create<MyStore>()((set) => ({
  // ...
}))
```

**Rule**: Always use `create<T>()()` in TypeScript, even without middleware (future-proof).

---

## Issue #3: Persist Middleware Import Error

**Error**: `"Attempted import error: 'createJSONStorage' is not exported from 'zustand/middleware'"`

**Source**: GitHub Discussion #2839

**Why It Happens**:
Wrong import path or version mismatch between zustand and build tools.

**Prevention**:
```typescript
// ✅ CORRECT imports for v5
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Verify versions
// zustand@5.0.8 includes createJSONStorage
// zustand@4.x uses different API

// Check your package.json
// "zustand": "^5.0.8"
```

---

## Issue #4: Infinite Render Loop

**Error**: Component re-renders infinitely, browser freezes

**Source**: GitHub Discussions #2642

**Why It Happens**:
Creating new object references in selectors causes Zustand to think state changed.

**Prevention**:
```typescript
import { shallow } from 'zustand/shallow'

// ❌ WRONG - Creates new object every time
const { bears, fishes } = useStore((state) => ({
  bears: state.bears,
  fishes: state.fishes,
}))

// ✅ CORRECT Option 1 - Select primitives separately
const bears = useStore((state) => state.bears)
const fishes = useStore((state) => state.fishes)

// ✅ CORRECT Option 2 - Use shallow for multiple values
const { bears, fishes } = useStore(
  (state) => ({ bears: state.bears, fishes: state.fishes }),
  shallow,
)
```

---

## Issue #5: Slices Pattern TypeScript Complexity

**Error**: `StateCreator` types fail to infer, complex middleware types break

**Source**: [Official Slices Pattern Guide](https://github.com/pmndrs/zustand/blob/main/docs/guides/slices-pattern.md)

**Why It Happens**:
Combining multiple slices requires explicit type annotations for middleware compatibility.

**Prevention**:
```typescript
import { create, StateCreator } from 'zustand'

// Define slice types
interface BearSlice {
  bears: number
  addBear: () => void
}

interface FishSlice {
  fishes: number
  addFish: () => void
}

// Create slices with proper types
const createBearSlice: StateCreator<
  BearSlice & FishSlice,  // Combined store type
  [],                      // Middleware mutators (empty if none)
  [],                      // Chained middleware (empty if none)
  BearSlice               // This slice's type
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
})

const createFishSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

// Combine slices
const useStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

---

## Quick Reference Table

| Issue | Error | Quick Fix |
|-------|-------|-----------|
| Hydration mismatch | "Text content does not match" | Use `_hasHydrated` flag pattern |
| TypeScript inference | Types break with middleware | Use `create<T>()()` double parentheses |
| Import error | "createJSONStorage not exported" | Upgrade to zustand@5.0.8+ |
| Infinite loop | Browser freezes | Use `shallow` or separate selectors |
| Slices types | StateCreator types fail | Explicit `StateCreator<Combined, [], [], Slice>` |

---

## See Also

- `nextjs-hydration.md` - More Next.js SSR patterns
- `typescript-patterns.md` - Advanced TypeScript solutions
- `middleware-guide.md` - Middleware configuration details
