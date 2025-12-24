# Overlay Decision Guide

## When to Use Which?

### Modal
**Use for**: Full-featured overlays requiring user attention
- Forms that need focus
- Important dialogs
- Content requiring full attention

**Desktop**: Centered overlay
**Mobile**: Consider using Drawer instead

### Drawer
**Use for**: Side panels and mobile-first patterns
- Navigation menus
- Filter panels
- Mobile forms
- Settings panels

**Positions**: left, right, top, bottom

### Dialog
**Use for**: Simple confirmations and alerts
- Yes/No confirmations
- Delete confirmations
- Simple alerts

**Simpler** than Modal, focused on confirmation actions.

### Popover
**Use for**: Contextual information and actions
- Rich tooltips
- Inline forms
- Dropdown menus
- Help text

**Triggered**: By click
**Positioning**: Relative to trigger

### Tooltip
**Use for**: Brief helper text
- Icon explanations
- Button descriptions
- Field hints

**Triggered**: By hover
**Keep brief**: 1-2 lines max

### Sheet
**Use for**: Bottom sheets (mobile pattern)
- Mobile action sheets
- Mobile selections
- Swipeable panels

## Responsive Pattern

```vue
<!-- Desktop: Modal -->
<UModal v-if="!isMobile" v-model="isOpen">
  ...
</UModal>

<!-- Mobile: Drawer -->
<UDrawer v-else v-model="isOpen" side="bottom">
  ...
</UDrawer>
```
