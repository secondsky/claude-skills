# Use useRef for Transient Values

**Impact:** MEDIUM — avoids unnecessary re-renders on frequent updates

**Tags:** rerender, useref, state, performance

## Summary

The rule recommends using `useRef` instead of `useState` for values that change frequently without requiring UI updates. As stated in the guide, "Updating a ref does not trigger a re-render."

This approach is ideal for scenarios like mouse tracking, intervals, and temporary flags where the component shouldn't re-render on every value change.

## Key Distinction

The incorrect approach uses state management for position tracking, causing a render cycle with each mouse movement. The corrected version leverages refs to update the DOM directly via `transform` styles, eliminating unnecessary re-renders while maintaining the same visual result.

**Use refs for:** temporary values, DOM-adjacent data, frequent updates
**Use state for:** UI-driven values that affect the render output
