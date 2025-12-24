# Motion Accessibility Guide

Complete guide to making Motion animations accessible for all users, including those with motion sensitivities, keyboard-only navigation, and screen readers.

---

## Table of Contents

1. [Respecting prefers-reduced-motion](#respecting-prefers-reduced-motion)
2. [Keyboard Navigation Support](#keyboard-navigation-support)
3. [ARIA Integration](#aria-integration)
4. [Testing Accessibility](#testing-accessibility)

---

## Respecting prefers-reduced-motion

### What is prefers-reduced-motion?

Users can enable "Reduce Motion" in their operating system settings to indicate they prefer minimal animation. This setting helps users with:
- Vestibular disorders (motion sickness from animations)
- Attention disorders (distraction from movement)
- Epilepsy (seizure triggers)
- Personal preference

### How to Enable (for testing)

**macOS**:
1. System Settings → Accessibility → Display
2. Enable "Reduce motion"

**Windows**:
1. Settings → Ease of Access → Display
2. Enable "Show animations" → OFF

**iOS**:
1. Settings → Accessibility → Motion
2. Enable "Reduce Motion"

**Android 9+**:
1. Settings → Accessibility
2. Enable "Remove animations"

### Implementation with MotionConfig

The recommended approach for respecting user preferences:

```tsx
import { MotionConfig } from "motion/react"

function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* All Motion components respect OS setting */}
      <YourApp />
    </MotionConfig>
  )
}
```

**How it works:**
- `reducedMotion="user"`: Respects OS setting (default behavior)
- `reducedMotion="always"`: Force instant transitions (no animations)
- `reducedMotion="never"`: Ignore OS setting (always animate)

**What happens when enabled:**
- All transitions become instant (`duration: 0`)
- Spring animations skip to final state
- Layout animations still work but happen immediately
- Enter/exit animations complete instantly

### Manual Detection (for fine-grained control)

When MotionConfig isn't sufficient:

```tsx
import { useReducedMotion } from "motion/react"

function Component() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      animate={{ x: 100 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        type: prefersReducedMotion ? "tween" : "spring"
      }}
    />
  )
}
```

**Alternative (vanilla JavaScript):**
```tsx
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches

<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

### AnimatePresence and reducedMotion

**Fixed**: Motion v12.4.7 (February-March 2025) fixed the issue where AnimatePresence ignored reducedMotion settings.

If you're experiencing issues with AnimatePresence not respecting reduced motion preferences, ensure you're using Motion v12.4.7 or later:

```bash
# npm
npm install motion@^12.4.7

# yarn
yarn add motion@^12.4.7

# bun
bun add motion@^12.4.7
```

### Creating a Reusable Hook

```tsx
// hooks/useMotionConfig.ts
import { useReducedMotion } from "motion/react"

export function useMotionConfig() {
  const prefersReducedMotion = useReducedMotion()

  return {
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
      type: prefersReducedMotion ? "tween" : "spring",
    },
    initial: (withMotion: Record<string, any>) =>
      prefersReducedMotion ? {} : withMotion,
    exit: (withMotion: Record<string, any>) =>
      prefersReducedMotion ? {} : withMotion,
  }
}

// Usage
function Component() {
  const config = useMotionConfig()

  return (
    <motion.div
      initial={config.initial({ opacity: 0, y: 20 })}
      animate={{ opacity: 1, y: 0 }}
      exit={config.exit({ opacity: 0, y: 20 })}
      transition={config.transition}
    />
  )
}
```

### Best Practices

**Do:**
- ✅ Wrap app in MotionConfig with `reducedMotion="user"`
- ✅ Manually check for AnimatePresence components
- ✅ Test with reduced motion enabled
- ✅ Provide instant alternatives (not just removing animations)
- ✅ Keep content readable even without animations

**Don't:**
- ❌ Ignore reduced motion preference
- ❌ Assume all users want animations
- ❌ Hide critical content behind animations
- ❌ Use animations for essential functionality
- ❌ Force animations when user prefers reduced motion

---

## Keyboard Navigation Support

### Focus States with whileFocus

Motion provides first-class keyboard support through `whileFocus`:

```tsx
<motion.button
  whileFocus={{ scale: 1.1, boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.5)" }}
  whileTap={{ scale: 0.95 }}
  tabIndex={0}
>
  Keyboard accessible button
</motion.button>
```

**How it works:**
- `whileFocus` triggers when element receives keyboard focus (Tab key)
- Works with screen readers
- Respects browser's native focus ring
- Can be combined with hover/tap states

### Tab Order and tabIndex

Ensure logical tab order for animated elements:

```tsx
function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}  // Tab order: 1st
      >
        Menu
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <li><a href="/" tabIndex={1}>Home</a></li>
            <li><a href="/about" tabIndex={2}>About</a></li>
            <li><a href="/contact" tabIndex={3}>Contact</a></li>
          </motion.ul>
        )}
      </AnimatePresence>
    </nav>
  )
}
```

**Best practices:**
- Use sequential `tabIndex` values (0, 1, 2, ...)
- Never use `tabIndex={-1}` unless element should be unfocusable
- Test tab order with keyboard only
- Ensure all interactive elements are reachable

### Keyboard Shortcuts for Gestures

Provide keyboard alternatives for drag operations:

```tsx
function DraggableCard() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleKeyDown = (e: KeyboardEvent) => {
    const step = 10

    switch (e.key) {
      case "ArrowLeft":
        setPosition(prev => ({ ...prev, x: prev.x - step }))
        break
      case "ArrowRight":
        setPosition(prev => ({ ...prev, x: prev.x + step }))
        break
      case "ArrowUp":
        setPosition(prev => ({ ...prev, y: prev.y - step }))
        break
      case "ArrowDown":
        setPosition(prev => ({ ...prev, y: prev.y + step }))
        break
    }
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      animate={position}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Draggable card. Use arrow keys to move."
    >
      Drag with mouse or move with arrow keys
    </motion.div>
  )
}
```

### Focus Management in Modals

Trap focus within modal dialogs:

```tsx
import { useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"

function AccessibleModal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus first focusable element in modal
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable && focusable.length > 0) {
        (focusable[0] as HTMLElement).focus()
      }
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => {
            // Close on Escape
            if (e.key === "Escape") onClose()
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## ARIA Integration

### ARIA Labels for Animated Elements

Help screen readers understand animated UI:

```tsx
// Loading spinner
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  role="status"
  aria-label="Loading"
  aria-live="polite"
>
  <span className="sr-only">Loading content...</span>
</motion.div>

// Expandable section
function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="accordion-content"
      >
        {title}
      </motion.button>

      <motion.div
        id="accordion-content"
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        style={{ overflow: "hidden" }}
        role="region"
        aria-hidden={!isOpen}
      >
        {children}
      </motion.div>
    </div>
  )
}
```

### Dynamic ARIA Announcements

Announce state changes to screen readers:

```tsx
import { useState, useEffect } from "react"

function SearchResults({ results }) {
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    setAnnouncement(`${results.length} results found`)

    // Clear announcement after delay
    const timer = setTimeout(() => setAnnouncement(""), 1000)
    return () => clearTimeout(timer)
  }, [results])

  return (
    <>
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Animated results */}
      <motion.ul layout>
        <AnimatePresence>
          {results.map(result => (
            <motion.li
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              {result.name}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </>
  )
}
```

### ARIA Roles for Common Patterns

```tsx
// Tabs
<motion.div role="tablist">
  <motion.button role="tab" aria-selected={isActive}>
    Tab 1
  </motion.button>
  <motion.button role="tab" aria-selected={!isActive}>
    Tab 2
  </motion.button>
</motion.div>

// Carousel
<motion.div role="region" aria-label="Image carousel">
  <motion.div role="group" aria-roledescription="slide">
    <img alt="Product 1" />
  </motion.div>
</motion.div>

// Alert/notification
<motion.div
  role="alert"
  aria-live="assertive"
  initial={{ opacity: 0, x: 100 }}
  animate={{ opacity: 1, x: 0 }}
>
  Error: Please try again
</motion.div>
```

---

## Testing Accessibility

### Manual Testing Checklist

**Keyboard Navigation:**
- [ ] All interactive elements reachable via Tab key
- [ ] Logical tab order (left to right, top to bottom)
- [ ] Focus visible on all elements
- [ ] No keyboard traps (can tab out of all components)
- [ ] Escape key closes modals/dropdowns
- [ ] Enter/Space activates buttons

**Screen Reader:**
- [ ] ARIA labels present and descriptive
- [ ] State changes announced (loading, errors, success)
- [ ] Animated content has text alternatives
- [ ] Modal focus trapped and restored correctly
- [ ] Lists/grids have proper roles

**Reduced Motion:**
- [ ] Enable OS reduced motion setting
- [ ] Animations become instant
- [ ] Content still accessible
- [ ] No functionality lost
- [ ] AnimatePresence components manually handled

### Automated Testing Tools

**Install axe-core for Jest/Vitest:**
```bash
bun add -d @axe-core/react
# or: npm install --save-dev @axe-core/react
```

**Usage:**
```tsx
import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'

expect.extend(toHaveNoViolations)

test('Modal is accessible', async () => {
  const { container } = render(<Modal isOpen={true}>Content</Modal>)
  const results = await axe(container)

  expect(results).toHaveNoViolations()
})
```

**Install Lighthouse CI:**
```bash
npm install -g @lhci/cli
```

**Run accessibility audit:**
```bash
lhci autorun --collect.settings.onlyCategories=accessibility
```

### Browser DevTools

**Chrome DevTools:**
1. Open DevTools → Lighthouse tab
2. Select "Accessibility" category
3. Click "Generate report"
4. Fix any issues found

**Firefox Accessibility Inspector:**
1. Open DevTools → Accessibility tab
2. Click "Check for Issues"
3. Review violations and warnings

**Safari Accessibility Audit:**
1. Develop → Show Web Inspector
2. Audits tab → Run audit
3. Review accessibility issues

### Real User Testing

**Screen Reader Testing:**
- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free) or JAWS
- **iOS**: VoiceOver (Settings → Accessibility)
- **Android**: TalkBack (Settings → Accessibility)

**Test scenarios:**
1. Navigate entire page with screen reader only
2. Complete primary user flows
3. Ensure announcements are clear and timely
4. Verify form validation messages are announced

---

## Accessibility Patterns for Common Use Cases

### Accessible Loading States

```tsx
function LoadingSpinner({ label = "Loading" }) {
  return (
    <motion.div
      role="status"
      aria-label={label}
      aria-live="polite"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      {/* Hidden text for screen readers */}
      <span className="sr-only">{label}...</span>

      {/* Visual spinner */}
      <svg>...</svg>
    </motion.div>
  )
}
```

### Accessible Drag and Drop

```tsx
function AccessibleDragList({ items, onReorder }) {
  const [focused, setFocused] = useState<string | null>(null)

  const moveItem = (id: string, direction: "up" | "down") => {
    const index = items.findIndex(item => item.id === id)
    const newIndex = direction === "up" ? index - 1 : index + 1

    if (newIndex >= 0 && newIndex < items.length) {
      const newItems = [...items]
      const [removed] = newItems.splice(index, 1)
      newItems.splice(newIndex, 0, removed)
      onReorder(newItems)

      // Announce change to screen reader
      announceChange(`Moved ${removed.name} ${direction}`)
    }
  }

  return (
    <ul role="list" aria-label="Reorderable list">
      {items.map(item => (
        <motion.li
          key={item.id}
          layout
          drag="y"
          tabIndex={0}
          role="listitem"
          aria-grabbed={focused === item.id}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") moveItem(item.id, "up")
            if (e.key === "ArrowDown") moveItem(item.id, "down")
            if (e.key === " ") setFocused(focused === item.id ? null : item.id)
          }}
        >
          {item.name}
          <span className="sr-only">
            Press space to grab, arrow keys to move
          </span>
        </motion.li>
      ))}
    </ul>
  )
}
```

---

## Resources

### Official Documentation
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **A11y Project**: https://www.a11yproject.com/

### Testing Tools
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/
- **Pa11y**: https://pa11y.org/

### Screen Readers
- **NVDA** (Windows, free): https://www.nvaccess.org/
- **VoiceOver** (macOS/iOS, built-in)
- **JAWS** (Windows, paid): https://www.freedomscientific.com/products/software/jaws/

---

## Related Files

- **SKILL.md** - Basic accessibility examples (MotionConfig, keyboard support)
- **common-patterns.md** - Accessible pattern implementations
- **core-concepts-deep-dive.md** - Advanced animation techniques
- **nextjs-integration.md** - Framework-specific considerations

---

**Last Updated**: 2025-11-28
**WCAG Compliance**: WCAG 2.1 Level AA
**Production Tested**: React 19 + Next.js 15
