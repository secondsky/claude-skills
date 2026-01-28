# Put Interaction Logic in Event Handlers

**Rule Summary:**
Place side effects triggered by user actions (submit, click, drag) directly in event handlers rather than modeling them as state combined with useEffect. This prevents unnecessary effect re-runs and eliminates duplicate side effects.

**Key Problem:**
The incorrect pattern creates a dependency on state that causes effects to re-execute whenever unrelated dependencies change, potentially duplicating actions.

**The Fix:**
Execute the side effect logic directly within the event handler function instead of using state as a mediator.

**Example Transformation:**
- **Before:** Button click sets `submitted` state → useEffect watches `submitted` → runs side effect
- **After:** Button click directly calls handler → side effect runs once per interaction

**Reference:** React documentation on [removing effect dependencies](https://react.dev/learn/removing-effect-dependencies#should-this-code-move-to-an-event-handler)

**Impact:** Medium - Reduces unnecessary re-renders and prevents side effect duplication
