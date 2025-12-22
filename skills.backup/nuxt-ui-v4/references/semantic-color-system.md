# Semantic Color System

## 7 Semantic Color Aliases

Nuxt UI v4 uses semantic colors instead of literal colors:

1. **primary** - Brand color (default: blue)
2. **secondary** - Secondary brand (default: gray)
3. **success** - Positive actions (default: green)
4. **info** - Informational (default: blue)
5. **warning** - Caution (default: yellow)
6. **error** - Destructive actions (default: red)
7. **neutral** - Neutral elements (default: gray)

## Configuration

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    theme: {
      colors: {
        primary: 'violet',    // Changes primary to violet
        success: 'emerald',   // Changes success to emerald
        error: 'rose'        // Changes error to rose
      }
    }
  }
})
```

## CSS Variables

### Text Utilities
- `text-default` - Default text color
- `text-dimmed` - Slightly dimmed
- `text-muted` - More dimmed
- `text-inverse` - For dark backgrounds

### Background Utilities
- `bg-default` - Default background
- `bg-elevated` - Elevated surface
- `bg-sunken` - Sunken/inset surface
- `bg-overlay` - Overlay background

### Border Utilities
- `border-default` - Default border
- `border-dimmed` - Dimmed border

## Usage Examples

```vue
<UButton color="primary">Primary</UButton>
<UAlert color="success">Success message</UAlert>
<UBadge color="warning">Warning</UBadge>
```
