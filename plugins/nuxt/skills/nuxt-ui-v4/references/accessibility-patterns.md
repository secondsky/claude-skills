# Accessibility Patterns

## Reka UI Foundation

Nuxt UI v4 is built on Reka UI, providing:

- **WAI-ARIA Compliance** - All components follow ARIA authoring practices
- **Keyboard Navigation** - Full keyboard support
- **Focus Management** - Proper focus trapping and restoration
- **Screen Reader Support** - Semantic HTML and ARIA labels

## Keyboard Shortcuts

```typescript
defineShortcuts({
  'meta_k': () => openCommandPalette(),
  'escape': () => closeModal()
})
```

## Focus Management

Components like Modal automatically manage focus:
- Focus moves to first focusable element
- Tab cycles through elements
- Escape closes and returns focus

## Best Practices

1. Always provide alt text for images
2. Use semantic HTML
3. Test with keyboard only
4. Test with screen readers
5. Ensure sufficient color contrast
