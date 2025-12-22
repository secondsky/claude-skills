# Interaction Patterns & UX Testing Guide

**Objective**: Verify the interactive experience works as expected
**Focus**: User flows, interactive states, micro-interactions, perceived performance
**Standard**: World-class UX (Stripe, Airbnb, Linear quality)

---

## Interactive States Testing

Every interactive element should have clearly defined visual states. Test each state systematically.

### The 5 Core Interactive States

#### 1. Default (Resting State)
- How element appears before interaction
- Clear affordance (looks clickable/interactive)
- Visually distinct from non-interactive elements

#### 2. Hover (Mouse Over)
- Provides immediate feedback that element is interactive
- Subtle change (color shift, underline, scale, shadow)
- Smooth transition (150-300ms)

**Testing procedure:**
```bash
# Using Playwright MCP
mcp__playwright__browser_hover(selector: ".button-class")
# Verify visual change in screenshot
```

**Common issues:**
- No hover state (looks unresponsive)
- Hover change too subtle (users don't notice)
- Hover transition too fast or slow

#### 3. Active/Pressed (Clicking)
- Visual feedback during click/tap
- Indicates button is responding to input
- Slightly darker or inset appearance

**Testing procedure:**
```bash
# Click and hold to see active state
# Or use DevTools to force :active state
```

**Common issues:**
- No active state (feels unresponsive)
- Same as hover state (no distinction)

#### 4. Focus (Keyboard Navigation)
- **Critical for accessibility**
- Visible outline or highlight when element receives focus
- Must meet WCAG 3:1 contrast requirement

**Testing procedure:**
```bash
# Tab through page to focus elements
# Verify visible focus indicator on all interactive elements
```

**Common issues:**
- `outline: none` with no alternative (accessibility violation)
- Focus indicator too subtle (<3:1 contrast)
- Focus state missing on custom components

**How to fix:**
```css
/* ❌ Bad: Removes focus with no alternative */
button:focus {
  outline: none;
}

/* ✅ Good: Custom focus with clear contrast */
button:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}

/* ✅ Good: Visible focus with box-shadow */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.4);
}
```

#### 5. Disabled (Non-Interactive)
- Visually muted (lower opacity, grayed out)
- Cursor changes to `not-allowed` or `default`
- No hover or active states
- Still keyboard focusable (but not actionable)

**Testing procedure:**
```bash
# Try clicking disabled elements
# Verify they don't respond
# Tab to them - should skip or show disabled state
```

**Common issues:**
- Disabled elements still clickable
- Disabled state not visually distinct
- Disabled text has poor contrast (<3:1 violates WCAG AA)

---

## Form Interaction Patterns

### Input Field States

Test each state for all input types (text, email, select, textarea, etc.):

1. **Empty (default)**
   - Placeholder text visible (light gray)
   - Cursor changes to text cursor on hover
   - Clicking focuses input

2. **Focus**
   - Clear focus indicator (border color change or outline)
   - Placeholder remains or disappears
   - Cursor blinking

3. **Filled**
   - User input visible
   - Placeholder hidden
   - Normal appearance

4. **Error**
   - Red border or background tint
   - Error message displayed below
   - Icon indicating error (optional)
   - Clear guidance on how to fix

5. **Success/Valid**
   - Green border or checkmark (optional)
   - Confirmation of valid input
   - Smooth transition from error state

6. **Disabled**
   - Grayed out appearance
   - Not focusable
   - Cursor shows `not-allowed`

### Form Validation Testing

**Test validation timing:**

1. **On blur (recommended):**
   - Validate when user leaves field
   - Don't show errors while typing (annoying)
   - Show success/valid state immediately

2. **On submit:**
   - Validate all fields when form submitted
   - Scroll to first error
   - Focus first error field

**Testing procedure:**
```bash
# 1. Try submitting empty required fields
# 2. Enter invalid data (wrong email format, etc.)
# 3. Verify clear error messages
# 4. Check error messages are associated (aria-describedby)
# 5. Fix errors and verify they clear
# 6. Submit valid form and check success state
```

**Common issues:**
- Validation too aggressive (errors while typing)
- Vague error messages ("Invalid input")
- Errors not associated with inputs (accessibility issue)
- No success confirmation after submit
- Error messages don't clear when fixed

**Example: Good form validation**
```html
<form>
  <div class="form-group">
    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      aria-invalid="true"
      aria-describedby="email-error"
      class="error"
    >
    <span id="email-error" class="error-message" role="alert">
      Please enter a valid email address (e.g., you@example.com)
    </span>
  </div>
</form>
```

---

## Button Interaction Patterns

### Primary Actions

**Testing checklist:**
- [ ] Button stands out visually (size, color, weight)
- [ ] Hover state provides feedback
- [ ] Active/pressed state visible
- [ ] Focus state clear for keyboard users
- [ ] Loading state during async actions
- [ ] Disabled state when action unavailable
- [ ] Success state after completion (checkmark, color change)

### Loading States

**When button triggers async action (API call, navigation):**

1. **Immediate feedback:**
   - Button disabled immediately on click
   - Text changes ("Submit" → "Submitting...")
   - Spinner appears
   - User knows action is processing

2. **During loading:**
   - Button remains disabled
   - Spinner animation continues
   - User can't click again (prevent double-submit)

3. **After completion:**
   - Success state briefly (checkmark, "Saved!")
   - Then return to default or navigate away

**Testing procedure:**
```bash
# Click button that triggers API call
# Verify immediate disabled state
# Check for spinner or loading text
# Wait for completion
# Verify success feedback
```

**Common issues:**
- No immediate feedback (appears unresponsive)
- User can click multiple times (double-submit)
- No confirmation after success
- Button stays disabled after error

**Example: Good loading button**
```html
<button
  class="btn-primary"
  :disabled="isLoading"
  @click="handleSubmit"
>
  <span v-if="!isLoading">Submit</span>
  <span v-if="isLoading">
    <spinner /> Submitting...
  </span>
</button>
```

---

## Destructive Actions

### Confirmation Patterns

**All destructive actions should have confirmation:**

**Destructive actions include:**
- Delete (item, account, data)
- Cancel (unsaved changes)
- Leave page (with unsaved changes)
- Irreversible operations

**Confirmation levels:**

1. **Inline confirmation** (for recoverable actions):
   - "Are you sure?" with Yes/No buttons
   - Quick, doesn't leave context

2. **Modal confirmation** (for important deletions):
   - Separate modal dialog
   - Clear explanation of what will be deleted
   - Require typing confirmation ("Type DELETE to confirm")
   - Cancel button prominent

3. **Undo action** (best UX):
   - Action happens immediately
   - Toast message: "Item deleted. Undo?"
   - Allow undo within 5-10 seconds
   - Less friction, still safe

**Testing procedure:**
```bash
# Try deleting an item
# Verify confirmation dialog appears
# Test Cancel button (nothing happens)
# Test Confirm button (item deleted)
# Check for undo option (if applicable)
```

**Common issues:**
- Delete button with no confirmation (dangerous!)
- Confirmation not clear about what's being deleted
- Cancel button styled the same as confirm (confusing)
- No way to undo accidental deletions

**Example: Good destructive action**
```html
<!-- Modal confirmation for deletion -->
<div role="dialog" aria-labelledby="delete-title">
  <h2 id="delete-title">Delete project?</h2>
  <p>
    Are you sure you want to delete "<strong>My Project</strong>"?
    This action cannot be undone.
  </p>
  <div class="actions">
    <button class="btn-secondary" @click="cancel">Cancel</button>
    <button class="btn-destructive" @click="confirmDelete">
      Delete project
    </button>
  </div>
</div>
```

---

## Navigation & Flow Testing

### User Flow Testing

**Test primary user flows based on PR notes or typical usage:**

1. **Map out the flow:**
   - What's the user trying to accomplish?
   - What are the steps?
   - What's the expected outcome?

2. **Execute the flow:**
   - Navigate through each step
   - Verify each step works as expected
   - Check for friction points

3. **Check edge cases:**
   - What if user goes back?
   - What if they refresh mid-flow?
   - What if they skip optional steps?

**Example flow: E-commerce checkout**
```
1. Add item to cart → Cart updates (badge count increases)
2. Go to cart → See cart summary
3. Click checkout → Navigate to checkout page
4. Enter shipping info → Form validates on blur
5. Enter payment info → Secure form, masked data
6. Review order → Can edit before submitting
7. Submit order → Loading state, then confirmation
8. See confirmation → Order number, email sent
```

**Testing checklist for each step:**
- [ ] Navigation works (buttons, links functional)
- [ ] Data persists between steps
- [ ] Back button behavior makes sense
- [ ] Progress indicator (if multi-step)
- [ ] Each step has clear next action
- [ ] Error states handled gracefully

---

## Micro-Interactions

### Purposeful Animations

**Good micro-interactions provide:**
- **Feedback**: Confirming user action
- **Feedforward**: Showing what will happen
- **Relationships**: Showing connections between elements
- **Continuity**: Smooth transitions between states

### Animation Best Practices

**Timing:**
- **Fast**: 100-200ms for simple transitions (hover, focus)
- **Medium**: 200-400ms for moderate changes (expand/collapse)
- **Slow**: 400-600ms for major state changes (page transitions)

**Easing:**
- **Ease-in-out**: General purpose (accelerate then decelerate)
- **Ease-out**: Elements entering (decelerates)
- **Ease-in**: Elements exiting (accelerates)

**Testing procedure:**
```bash
# Interact with all animated elements
# Verify animations feel natural (not too fast/slow)
# Check for jank or stuttering
# Test on slower devices if possible
```

**Common animation issues:**
- Too fast (jarring, hard to follow)
- Too slow (feels sluggish, annoying)
- Animating expensive properties (width, height instead of transform)
- No animation (feels abrupt)
- Too much animation (overwhelming, distracting)

**Example: Good micro-interactions**
```css
/* Button hover - quick feedback */
.button {
  transition: background-color 150ms ease-in-out;
}

/* Accordion expand - moderate timing */
.accordion-content {
  transition: height 300ms ease-out;
}

/* Modal appearance - smooth entry */
.modal {
  animation: fadeIn 200ms ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## Perceived Performance

### Making Interfaces Feel Fast

**Even if actual performance is slow, perceived performance can be improved:**

1. **Optimistic UI updates:**
   - Update UI immediately, assuming success
   - Revert if operation fails
   - Example: Like button turns blue instantly, then syncs with server

2. **Skeleton screens:**
   - Show layout placeholders while loading
   - Better than blank screen or spinner
   - Feels faster because something is visible

3. **Progressive loading:**
   - Load critical content first
   - Load non-critical content after
   - Example: Load text immediately, images lazy-load

4. **Instant feedback:**
   - Show loading state within 100ms of user action
   - Don't wait for server response to show something happened

**Testing checklist:**
- [ ] Actions feel snappy (<100ms feedback)
- [ ] Loading states prevent user confusion
- [ ] Skeleton screens used for slow loads
- [ ] Optimistic updates for common actions
- [ ] No long waits without indication

---

## Modal & Dialog Patterns

### Modal Interaction Testing

**Opening:**
- [ ] Modal appears smoothly (fade in, scale up)
- [ ] Background dimmed/blurred (focus on modal)
- [ ] Focus moves to modal (keyboard trap)
- [ ] Body scroll disabled (prevent scrolling behind modal)

**Inside modal:**
- [ ] Tab navigation stays within modal
- [ ] Escape key closes modal
- [ ] Clear close button (X in top-right)
- [ ] Can't click outside modal accidentally

**Closing:**
- [ ] Multiple ways to close (X button, Cancel, Escape, click overlay)
- [ ] Focus returns to trigger element
- [ ] Modal exits smoothly (fade out)
- [ ] Body scroll re-enabled

**Common modal issues:**
- Focus not trapped (can Tab to elements behind modal)
- No Escape key handler
- Clicking overlay closes modal accidentally (for important confirmations)
- Focus lost after closing (returns to body instead of trigger)
- Background scrolls while modal open

---

## Keyboard Navigation Testing

### Complete Keyboard Test

**Test procedure:**
1. **Disconnect mouse** (or don't use it)
2. **Tab through entire page** from top to bottom
3. **Verify each interactive element:**
   - Receives visible focus
   - Can be activated (Enter or Space)
   - Logical tab order (reading order)
4. **Test modals:**
   - Open with Enter
   - Navigate within modal
   - Close with Escape
5. **Test dropdowns and menus:**
   - Open with Enter
   - Navigate with arrow keys
   - Close with Escape
6. **Test forms:**
   - Tab between fields
   - Select options with arrow keys
   - Submit with Enter

**Common keyboard issues:**
- Tab order illogical (jumps around page)
- Focus invisible (outline removed, no alternative)
- Can't activate custom components (divs instead of buttons)
- Keyboard trap (can't Tab out of component)
- No way to close modals with keyboard

---

## Dropdown & Select Patterns

### Native Select
- [ ] Opens on click
- [ ] Keyboard navigable (arrow keys)
- [ ] Searchable by typing
- [ ] Closes on selection or Escape

### Custom Dropdown
- [ ] Keyboard accessible (Enter to open, arrows to navigate)
- [ ] Visible focus on options
- [ ] Closes on Escape or outside click
- [ ] ARIA attributes (aria-expanded, aria-haspopup, aria-activedescendant)

---

## Quick Interaction Testing Checklist

### For every interactive element:
- [ ] Default state looks interactive (affordance)
- [ ] Hover state provides feedback
- [ ] Active/pressed state visible
- [ ] Focus state clear (outline or highlight)
- [ ] Disabled state visually distinct
- [ ] Keyboard accessible (Enter/Space activates)

### For forms:
- [ ] Validation on blur (not while typing)
- [ ] Clear error messages with guidance
- [ ] Errors associated with inputs (aria-describedby)
- [ ] Success confirmation after submit
- [ ] Loading state during submission

### For destructive actions:
- [ ] Confirmation required
- [ ] Clear explanation of consequences
- [ ] Cancel option prominent
- [ ] Undo available (if possible)

### For modals:
- [ ] Focus trapped within modal
- [ ] Escape key closes modal
- [ ] Background dimmed
- [ ] Focus returns to trigger after closing

### For animations:
- [ ] Timing feels natural (150-300ms for simple)
- [ ] Easing appropriate (ease-in-out general)
- [ ] No jank or stuttering
- [ ] Not overwhelming or distracting

---

## Triage Priorities

**[Blocker]:**
- Core user flow broken or inaccessible
- Destructive action with no confirmation
- Keyboard trap (can't escape)

**[High]:**
- Missing focus states (keyboard nav broken)
- Poor UX (confusing flow, no feedback)
- Missing loading states (appears frozen)

**[Medium]:**
- Minor interaction issues
- Missing hover states
- Suboptimal timing on animations

**[Nitpick]:**
- Animation easing preferences
- Minor timing adjustments
- Aesthetic micro-interaction details

---

**Resources:**
- **Inclusive Components**: https://inclusive-components.design/
- **Material Design - Motion**: https://material.io/design/motion/
- **Laws of UX**: https://lawsofux.com/
