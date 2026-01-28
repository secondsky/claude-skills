# Calculate Derived State During Rendering

**Rule:** Compute values from current props/state during rendering rather than storing them as state or updating them via effects.

**Key Principle:** "If a value can be computed from current props/state, do not store it in state or update it in an effect."

**Why It Matters:**
- Eliminates unnecessary re-renders
- Prevents state drift between source values and derived values
- Simplifies component logic

**The Problem:** Storing derived values in state and syncing them with useEffect creates redundant state and extra render cycles.

**The Solution:** Calculate derived values directly during the render phase. In the example provided, `fullName` is simply computed as `firstName + ' ' + lastName` inline, removing the need for separate state and effect management.

**Reference:** The rule cites React's "You Might Not Need an Effect" documentation, which addresses this common pattern of unnecessary effect-based state updates.
