# Motion Core Concepts - Deep Dive

This guide covers advanced Motion concepts for complex animation scenarios. For basic usage, see the main SKILL.md file.

---

## Table of Contents

1. [Advanced Variants Orchestration](#advanced-variants-orchestration)
2. [Advanced Layout Animations (FLIP)](#advanced-layout-animations-flip)
3. [Advanced Scroll Animations](#advanced-scroll-animations)
4. [Advanced Gesture Controls](#advanced-gesture-controls)
5. [Spring Physics Tuning](#spring-physics-tuning)

---

## Advanced Variants Orchestration

Variants enable sophisticated animation choreography across component trees.

### Staggered Children Animations

Control the timing between each child animation:

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,     // 100ms delay between each child
      delayChildren: 0.3,        // Wait 300ms before starting children
      staggerDirection: 1,       // 1 = forward, -1 = reverse
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((item, i) => (
    <motion.li key={item.id} variants={item}>
      {/* Animates 100ms after previous sibling */}
      {item.text}
    </motion.li>
  ))}
</motion.ul>
```

### Dynamic Variants with Functions

Create variants that respond to component state:

```tsx
const box = {
  start: { scale: 1 },
  end: (custom) => ({
    scale: custom.scale,
    rotate: custom.rotate,
    transition: { duration: custom.duration }
  })
}

<motion.div
  variants={box}
  initial="start"
  animate="end"
  custom={{ scale: 2, rotate: 45, duration: 0.5 }}
/>
```

### Nested Variant Propagation

Variants automatically propagate through component hierarchy:

```tsx
const list = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",    // Animate parent before children
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { x: -10, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
  },
}

function List({ items }) {
  return (
    <motion.ul variants={list} initial="hidden" animate="visible">
      {items.map(item => (
        <motion.li key={item.id} variants={item}>
          {/* Child inherits parent's variant state */}
          {item.text}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### Orchestration Options

Control the relationship between parent and children animations:

```tsx
const parent = {
  animate: {
    opacity: 1,
    transition: {
      // Control animation order
      when: "beforeChildren",  // Parent animates before children
      // when: "afterChildren", // Parent animates after children

      // Stagger children
      staggerChildren: 0.1,    // Delay between each child
      delayChildren: 0.2,      // Initial delay before first child
      staggerDirection: 1,     // 1 = first to last, -1 = last to first
    }
  }
}
```

**Use Cases:**
- Staggered list reveals (menu items, search results)
- Sequential card animations
- Cascading hover effects
- Coordinated multi-element transitions

---

## Advanced Layout Animations (FLIP)

FLIP (First, Last, Invert, Play) animations automatically handle complex layout changes.

### Shared Element Transitions with layoutId

Connect separate elements for smooth morphing:

```tsx
function Gallery() {
  const [selectedId, setSelectedId] = useState(null)

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {items.map(item => (
          <motion.div
            key={item.id}
            layoutId={item.id}  // Connects this to detail view
            onClick={() => setSelectedId(item.id)}
          >
            <img src={item.thumbnail} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedId && (
          <motion.div
            layoutId={selectedId}  // Same layoutId = shared transition
            onClick={() => setSelectedId(null)}
          >
            <img src={items.find(i => i.id === selectedId).fullSize} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

**How it works:**
1. Motion identifies elements with matching `layoutId`
2. Calculates position/size difference
3. Animates transform to bridge the gap
4. Element visually "morphs" between states

### Layout Scroll Fix

When layout animations happen inside scrollable containers:

```tsx
<motion.div
  layoutScroll  // Fix: Accounts for scroll offset
  className="overflow-auto h-96"
>
  {items.map(item => (
    <motion.div key={item.id} layout>
      {/* Layout animations work correctly even when scrolled */}
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

**Problem without layoutScroll**: Removing items from scrolled container causes incomplete transitions.

**Solution**: `layoutScroll` prop accounts for scroll offset when calculating FLIP positions.

### Layout Root for Fixed Elements

Fixed/absolute positioned elements need special handling:

```tsx
<motion.div
  layoutRoot  // Creates new layout context
  className="fixed top-0 left-0 w-full"
>
  <motion.div layout>
    {/* Layout animations work correctly in fixed container */}
    <Navigation />
  </motion.div>
</motion.div>
```

**Use Cases:**
- Fixed headers with layout changes
- Sticky sidebars
- Modal overlays with animated content
- Floating action buttons

### Layout Groups

Synchronize layout animations across multiple components:

```tsx
import { LayoutGroup } from "motion/react"

<LayoutGroup>
  <motion.div layout>Column 1</motion.div>
  <motion.div layout>Column 2</motion.div>
  <motion.div layout>Column 3</motion.div>
</LayoutGroup>
```

**What it does**: All siblings in LayoutGroup coordinate their layout animations to feel connected.

**Example**: Grid reordering, responsive layout shifts, tab panels

---

## Advanced Scroll Animations

### useScroll Hook - Fine-Grained Control

Access scroll progress for custom animations:

```tsx
import { useScroll, useTransform, motion } from "motion/react"
import { useRef } from "react"

function ScrollSection() {
  const ref = useRef(null)

  // Track scroll progress of this element (not whole page)
  const { scrollYProgress } = useScroll({
    target: ref,              // Element to track
    offset: ["start end", "end start"]  // When to start/end tracking
  })

  // Transform scroll progress to different values
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, rotate }}
    >
      {/* Fades in, scales up, rotates as user scrolls */}
    </motion.div>
  )
}
```

### Scroll Offset Explained

Control when scroll tracking starts/ends:

```tsx
const { scrollYProgress } = useScroll({
  target: ref,
  offset: [
    "start end",    // Start tracking when element top hits viewport bottom
    "end start"     // Stop tracking when element bottom hits viewport top
  ]
})
```

**Offset syntax**: `["start position", "end position"]`

**Positions:**
- `start` = top of element
- `center` = middle of element
- `end` = bottom of element
- Add viewport position: `start end` = element start to viewport end

**Examples:**
```tsx
// Element visible in viewport
offset: ["start end", "end start"]

// Element centered in viewport
offset: ["center center", "center center"]

// Start 100px before element enters
offset: ["start calc(end + 100px)", "end start"]
```

### useTransform - Value Mapping

Convert scroll progress to any value range:

```tsx
import { useScroll, useTransform } from "motion/react"

const { scrollYProgress } = useScroll()

// Map 0-1 scroll to pixel values
const y = useTransform(scrollYProgress, [0, 1], [0, -500])

// Map to degrees
const rotate = useTransform(scrollYProgress, [0, 1], [0, 360])

// Map to colors (requires motion/react-client)
const backgroundColor = useTransform(
  scrollYProgress,
  [0, 0.5, 1],
  ["#ff0000", "#00ff00", "#0000ff"]
)

// Custom easing
const scaleWithEasing = useTransform(
  scrollYProgress,
  [0, 0.5, 1],
  [1, 1.5, 1],
  { ease: "easeInOut" }
)
```

### Parallax Layers

Create depth with different scroll speeds:

```tsx
function ParallaxScene() {
  const { scrollYProgress } = useScroll()

  // Background moves slowest (depth)
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -200])

  // Midground moves medium speed
  const midgroundY = useTransform(scrollYProgress, [0, 1], [0, -400])

  // Foreground moves fastest (closest)
  const foregroundY = useTransform(scrollYProgress, [0, 1], [0, -600])

  return (
    <div className="relative h-[200vh]">
      <motion.div
        className="fixed inset-0"
        style={{ y: backgroundY }}
      >
        <img src="/mountains.jpg" />
      </motion.div>

      <motion.div
        className="fixed inset-0"
        style={{ y: midgroundY }}
      >
        <img src="/trees.png" />
      </motion.div>

      <motion.div
        className="fixed inset-0"
        style={{ y: foregroundY }}
      >
        <img src="/foreground.png" />
      </motion.div>
    </div>
  )
}
```

### Scroll-Linked Progress Bars

```tsx
function ReadingProgressBar() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-500 origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
```

---

## Advanced Gesture Controls

### Drag Constraints - Dynamic Boundaries

Constrain dragging to specific bounds:

```tsx
function ConstrainedDrag() {
  const constraintsRef = useRef(null)

  return (
    <div ref={constraintsRef} className="w-96 h-96 border">
      <motion.div
        drag
        dragConstraints={constraintsRef}  // Can't drag outside parent
        dragElastic={0.1}                 // Slight resistance at edges
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      >
        Drag me (constrained to parent)
      </motion.div>
    </div>
  )
}
```

**Constraint options:**
```tsx
// Pixel-based constraints
dragConstraints={{ top: -50, right: 50, bottom: 50, left: -50 }}

// Ref-based (constrain to parent element)
dragConstraints={constraintsRef}

// Elastic resistance (0 = rigid, 1 = elastic)
dragElastic={0.2}
```

### Drag Momentum

Control how elements behave when released:

```tsx
<motion.div
  drag="x"
  dragMomentum={true}           // Continue moving after release
  dragTransition={{
    power: 0.2,                 // Higher = longer momentum
    timeConstant: 200,          // How long momentum lasts (ms)
    modifyTarget: (target) => {
      // Snap to nearest 100px
      return Math.round(target / 100) * 100
    }
  }}
/>
```

**Use Cases:**
- Carousel swiping with snap points
- Physics-based card throwing
- Momentum scrolling
- Flick-to-dismiss gestures

### Drag Event Handlers

React to drag lifecycle:

```tsx
<motion.div
  drag
  onDragStart={(event, info) => {
    console.log("Started dragging", info.point)
  }}
  onDrag={(event, info) => {
    console.log("Dragging", info.offset, info.velocity)
  }}
  onDragEnd={(event, info) => {
    console.log("Released", info.offset, info.velocity)

    // Snap back if dragged too little
    if (Math.abs(info.offset.x) < 100) {
      animate({ x: 0 })
    }
  }}
/>
```

**Event info object:**
```tsx
{
  point: { x: number, y: number },       // Pointer position
  delta: { x: number, y: number },       // Movement since last event
  offset: { x: number, y: number },      // Total movement from start
  velocity: { x: number, y: number }     // Current velocity
}
```

### Direction-Locked Dragging

Lock to horizontal or vertical axis:

```tsx
// Horizontal only
<motion.div drag="x">Swipe left/right</motion.div>

// Vertical only
<motion.div drag="y">Swipe up/down</motion.div>

// Both directions
<motion.div drag>Free movement</motion.div>

// Conditional locking
<motion.div drag={isUnlocked ? true : "x"}>
  Locked to X until unlocked
</motion.div>
```

---

## Spring Physics Tuning

### Understanding Spring Parameters

Springs create natural, physics-based motion:

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: "spring",
    stiffness: 100,    // How hard spring pulls (0-500+)
    damping: 10,       // Resistance to oscillation (0-100)
    mass: 1,           // How heavy element feels (0.1-10)
  }}
/>
```

**Parameter effects:**

**Stiffness** (spring strength):
- Low (50-100): Slow, smooth movement
- Medium (100-300): Balanced, natural
- High (300-500): Fast, snappy

**Damping** (oscillation control):
- Low (5-10): Bouncy, multiple oscillations
- Medium (10-20): Slight overshoot
- High (20-50): No overshoot, smooth stop
- Very high (50-100): Heavy, sluggish

**Mass** (weight):
- Light (0.1-0.5): Quick, reactive
- Normal (1): Default weight
- Heavy (2-10): Slow, lethargic

### Common Presets

```tsx
// Bouncy (button click, playful UI)
transition: {
  type: "spring",
  stiffness: 300,
  damping: 10,
  mass: 0.5,
}

// Smooth (modal open, drawer slide)
transition: {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 1,
}

// Snappy (toggle switch, quick feedback)
transition: {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
}

// Heavy (large elements, draggable cards)
transition: {
  type: "spring",
  stiffness: 100,
  damping: 15,
  mass: 2,
}

// Elastic (rubber band effect)
transition: {
  type: "spring",
  stiffness: 200,
  damping: 5,
  mass: 1,
}
```

### Duration vs Stiffness

Springs don't use duration by default (physics-based). To set duration:

```tsx
// Duration-based spring (less natural)
transition: {
  type: "spring",
  duration: 0.5,
  bounce: 0.3,  // 0 = no bounce, 1 = very bouncy
}

// Physics-based spring (more natural)
transition: {
  type: "spring",
  stiffness: 100,
  damping: 10,
}
```

**Recommendation**: Use stiffness/damping for natural feel, duration/bounce for precise timing.

### Visualizing Spring Physics

Test spring parameters interactively:

**Official Spring Visualizer**: https://motion.dev/tools/spring

```tsx
// Copy values from visualizer
transition: {
  type: "spring",
  stiffness: 260,
  damping: 20,
  mass: 1.2,
}
```

### When to Use Springs

**Use springs for:**
- Interactive gestures (drag, tap, hover)
- Natural-feeling UI (modals, dropdowns, drawers)
- Playful animations (button clicks, micro-interactions)
- Responsive layouts (grid reordering, expand/collapse)

**Don't use springs for:**
- Precise timing requirements (use duration instead)
- Synchronized choreography (use duration for predictability)
- Loading states (use duration for consistent timing)

---

## Related Files

- **SKILL.md** - Basic concepts and quick start
- **common-patterns.md** - Production-ready examples using these concepts
- **nextjs-integration.md** - Framework-specific advanced usage
- **performance-optimization.md** - Optimizing complex animations

---

**Last Updated**: 2025-11-28
**Production Tested**: React 19 + Next.js 15 + Vite 6
