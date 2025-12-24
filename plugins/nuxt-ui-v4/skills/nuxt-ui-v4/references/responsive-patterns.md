# Responsive Patterns

## Media Query Detection

```typescript
const isMobile = computed(() => {
  if (process.client) {
    return window.matchMedia('(max-width: 768px)').matches
  }
  return false
})
```

## Responsive Components

### Modal ↔ Drawer

```vue
<UModal v-if="!isMobile" v-model="isOpen">...</UModal>
<UDrawer v-else v-model="isOpen" side="bottom">...</UDrawer>
```

### Grid Layouts

```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <UCard v-for="item in items">...</UCard>
</div>
```

## Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Mobile-First Utilities

Always design mobile-first:

```vue
<!-- Mobile: Stack | Desktop: Row -->
<div class="flex flex-col md:flex-row gap-4">
  ...
</div>
```
