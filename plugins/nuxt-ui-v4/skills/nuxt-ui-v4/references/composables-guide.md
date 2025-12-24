# Composables Guide

## useToast

```typescript
const { add, remove, clear } = useToast()

// Add toast
add({
  title: 'Success',
  description: 'Item saved',
  color: 'success',
  timeout: 3000,
  actions: [{
    label: 'Undo',
    click: () => console.log('Undo')
  }]
})

// Remove specific toast
remove(toastId)

// Clear all
clear()
```

## useNotification

Similar to useToast but for persistent notifications.

## useColorMode

```typescript
const colorMode = useColorMode()

// Get current mode
console.log(colorMode.value) // 'light' | 'dark' | 'system'

// Set mode
colorMode.preference = 'dark'

// Check if dark
const isDark = computed(() => colorMode.value === 'dark')
```

## defineShortcuts

```typescript
defineShortcuts({
  'meta_k': () => openCommandPalette(),
  'meta_n': () => createNew(),
  'escape': () => closeModal()
})
```

Supports: meta (⌘), ctrl, alt, shift, and standard keys.
