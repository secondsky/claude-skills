# Migration Guide: Radix UI → Base UI

Complete guide to migrating from Radix UI to Base UI.

---

## Quick Reference

| Pattern | Radix UI | Base UI |
|---------|----------|---------|
| Prop merging | `asChild` | `render={(props) => ...}` |
| Positioning | `side`, `align` | `<Positioner side alignment>` |
| Content component | `Content` | `Popup` |
| Overlay component | `Overlay` | `Backdrop` |
| Alignment prop | `align` | `alignment` |
| Portal | Automatic | Explicit `<Portal>` |

---

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
# Remove Radix
pnpm remove @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-select

# Add Base UI
pnpm add @base-ui-components/react
```

### Step 2: Update Imports

```tsx
// Before (Radix)
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";

// After (Base UI)
import { Dialog } from "@base-ui-components/react/dialog";
import { Popover } from "@base-ui-components/react/popover";
import { Select } from "@base-ui-components/react/select";
```

### Step 3: Replace asChild with Render Props

```tsx
// Before (Radix)
<Dialog.Trigger asChild>
  <button className="btn">Open</button>
</Dialog.Trigger>

// After (Base UI)
<Dialog.Trigger
  render={(props) => (
    <button {...props} className="btn">
      Open
    </button>
  )}
/>
```

### Step 4: Add Positioner for Popups

```tsx
// Before (Radix Select)
<Select.Portal>
  <Select.Content side="bottom" align="start">
    <Select.Viewport>
      {/* options */}
    </Select.Viewport>
  </Select.Content>
</Select.Portal>

// After (Base UI Select)
<Select.Positioner side="bottom" alignment="start">
  <Select.Portal>
    <Select.Popup render={(props) => <div {...props}>{/* options */}</div>} />
  </Select.Portal>
</Select.Positioner>
```

### Step 5: Rename Components

- `Content` → `Popup`
- `Overlay` → `Backdrop`
- `align` → `alignment`
- `Viewport` → Remove (not needed)

---

## Component-by-Component Guide

### Dialog

**Radix**:
```tsx
<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="overlay" />
    <Dialog.Content className="content">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close asChild>
        <button>Close</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Base UI**:
```tsx
<Dialog.Root>
  <Dialog.Trigger render={(props) => <button {...props}>Open</button>} />
  <Dialog.Portal>
    <Dialog.Backdrop render={(props) => <div {...props} className="overlay" />} />
    <Dialog.Popup render={(props) => (
      <div {...props} className="content">
        <Dialog.Title render={(p) => <h2 {...p}>Title</h2>} />
        <Dialog.Description render={(p) => <p {...p}>Description</p>} />
        <Dialog.Close render={(p) => <button {...p}>Close</button>} />
      </div>
    )} />
  </Dialog.Portal>
</Dialog.Root>
```

### Popover

**Radix**:
```tsx
<Popover.Root>
  <Popover.Trigger asChild>
    <button>Open</button>
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content side="top" align="center">
      <Popover.Arrow />
      Content
      <Popover.Close asChild>
        <button>Close</button>
      </Popover.Close>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

**Base UI**:
```tsx
<Popover.Root>
  <Popover.Trigger render={(props) => <button {...props}>Open</button>} />
  <Popover.Positioner side="top" alignment="center">
    <Popover.Portal>
      <Popover.Popup render={(props) => (
        <div {...props}>
          Content
          <Popover.Close render={(p) => <button {...p}>Close</button>} />
        </div>
      )} />
      <Popover.Arrow render={(props) => <div {...props} />} />
    </Popover.Portal>
  </Popover.Positioner>
</Popover.Root>
```

### Select

**Radix**:
```tsx
<Select.Root>
  <Select.Trigger asChild>
    <button>
      <Select.Value placeholder="Select..." />
      <Select.Icon>▼</Select.Icon>
    </button>
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.Viewport>
        <Select.Item value="1" asChild>
          <div>Option 1</div>
        </Select.Item>
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

**Base UI**:
```tsx
<Select.Root>
  <Select.Trigger render={(props) => (
    <button {...props}>
      <Select.Value render={(p) => <span {...p} placeholder="Select..." />} />
      <Select.Icon render={(p) => <span {...p}>▼</span>} />
    </button>
  )} />
  <Select.Positioner side="bottom" alignment="start">
    <Select.Portal>
      <Select.Popup render={(props) => (
        <div {...props}>
          <Select.Option value="1" render={(p) => <div {...p}>Option 1</div>} />
        </div>
      )} />
    </Select.Portal>
  </Select.Positioner>
</Select.Root>
```

---

## Common Migration Issues

### Issue: Props not applied
```tsx
// ❌ Wrong
<Trigger render={() => <button>Click</button>} />

// ✅ Correct
<Trigger render={(props) => <button {...props}>Click</button>} />
```

### Issue: Popup won't position
```tsx
// ❌ Wrong (missing Positioner)
<Popover.Portal>
  <Popover.Popup />
</Popover.Portal>

// ✅ Correct
<Popover.Positioner side="top">
  <Popover.Portal>
    <Popover.Popup />
  </Popover.Portal>
</Popover.Positioner>
```

### Issue: TypeScript errors
```tsx
// ❌ Wrong (Radix prop names)
<Positioner align="center" />
<Dialog.Content />
<Dialog.Overlay />

// ✅ Correct (Base UI prop names)
<Positioner alignment="center" />
<Dialog.Popup />
<Dialog.Backdrop />
```

---

## Automated Migration Script

Use the bundled script to automatically convert files:

```bash
./scripts/migrate-radix-component.sh src/components/Dialog.tsx
```

This will:
1. Replace `asChild` with `render` props
2. Add `Positioner` where needed
3. Rename `Content` → `Popup`, `Overlay` → `Backdrop`
4. Update `align` → `alignment`
5. Make `Portal` explicit

---

## Testing After Migration

**Checklist**:
- [ ] All components render correctly
- [ ] Keyboard navigation works (Tab, Escape, Arrow keys)
- [ ] Screen reader announces elements properly
- [ ] Popups position correctly near viewport edges
- [ ] Styling is preserved
- [ ] TypeScript compiles without errors
- [ ] No console warnings/errors

**Test with**:
- Keyboard only (no mouse)
- Screen reader (NVDA, JAWS, VoiceOver)
- Different viewport sizes
- Dark mode (if applicable)

---

## Migration Timeline Estimates

| Component Count | Estimated Time |
|----------------|----------------|
| 1-5 components | 1-2 hours |
| 6-10 components | 2-4 hours |
| 11-20 components | 4-8 hours |
| 20+ components | 1-2 days |

**Note**: Time includes testing and fixing edge cases.
