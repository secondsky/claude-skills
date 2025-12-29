# Maz-UI Directives Guide

Maz-UI provides 5 Vue directives for common UI patterns like tooltips, click detection, and image handling. Directives are special attributes that apply reactive behavior to DOM elements.

**Last Verified**: 2025-12-29 | **Maz-UI Version**: 4.3.3

## Overview

Directives in Maz-UI:

- **v-tooltip** - Display tooltips on hover/focus
- **v-click-outside** - Detect clicks outside an element
- **v-lazy-img** - Lazy-load images with Intersection Observer
- **v-zoom-img** - Add zoom functionality to images
- **v-fullscreen-img** - Open images in fullscreen viewer

All directives are auto-imported in Nuxt 3 with `@maz-ui/nuxt` module. In Vue 3, directives must be registered globally or imported per component.

---

## Installation

### Vue 3

```typescript
// Import specific directive
import { vTooltip } from 'maz-ui/directives/vTooltip'
import { vClickOutside } from 'maz-ui/directives/vClickOutside'

// Register globally
app.directive('tooltip', vTooltip)
app.directive('click-outside', vClickOutside)
```

### Nuxt 3

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt']
  // All directives auto-imported!
})
```

**Usage in Components**:

```vue
<template>
  <!-- No imports needed in Nuxt 3 -->
  <div v-tooltip="'Hello World'">Hover me</div>
</template>
```

---

## v-tooltip

Display tooltips on hover or focus with customizable positioning and styling.

### Basic Usage

```vue
<template>
  <!-- String value -->
  <MazBtn v-tooltip="'Click to submit'">Submit</MazBtn>

  <!-- Object with options -->
  <MazBtn v-tooltip="{ text: 'Delete item', position: 'left' }">
    Delete
  </MazBtn>
</template>
```

### API

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | - | Tooltip content (required) |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position |
| `delay` | `number` | `0` | Show delay in milliseconds |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info'` | `'primary'` | Tooltip color theme |
| `arrow` | `boolean` | `true` | Show arrow pointing to element |

### Syntax

**String (Simple)**:

```vue
<button v-tooltip="'Tooltip text'">Hover</button>
```

**Object (Advanced)**:

```vue
<button v-tooltip="{
  text: 'Save changes',
  position: 'bottom',
  color: 'success',
  delay: 300
}">
  Save
</button>
```

**Reactive Value**:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const tooltipText = ref('Initial tooltip')

function updateTooltip() {
  tooltipText.value = 'Updated tooltip!'
}
</script>

<template>
  <button v-tooltip="tooltipText" @click="updateTooltip">
    Dynamic Tooltip
  </button>
</template>
```

### Positioning

```vue
<template>
  <div class="demo">
    <button v-tooltip="{ text: 'Top tooltip', position: 'top' }">Top</button>
    <button v-tooltip="{ text: 'Right tooltip', position: 'right' }">Right</button>
    <button v-tooltip="{ text: 'Bottom tooltip', position: 'bottom' }">Bottom</button>
    <button v-tooltip="{ text: 'Left tooltip', position: 'left' }">Left</button>
  </div>
</template>
```

### Color Themes

```vue
<template>
  <MazBtn v-tooltip="{ text: 'Primary action', color: 'primary' }">Primary</MazBtn>
  <MazBtn v-tooltip="{ text: 'Danger zone!', color: 'danger' }">Delete</MazBtn>
  <MazBtn v-tooltip="{ text: 'Success!', color: 'success' }">Save</MazBtn>
  <MazBtn v-tooltip="{ text: 'Warning!', color: 'warning' }">Caution</MazBtn>
</template>
```

### Accessibility

- **ARIA**: Automatically adds `aria-label` attribute
- **Focus**: Tooltip shows on keyboard focus
- **Screen Readers**: Content announced to assistive technology

### Best Practices

1. **Keep text concise** - 1-2 sentences maximum
2. **Don't rely on tooltips alone** - Important info should be visible
3. **Use appropriate delays** - Immediate for icons, delayed for text buttons
4. **Avoid HTML content** - Use plain text for accessibility
5. **Position wisely** - Ensure tooltip doesn't overflow viewport

---

## v-click-outside

Detect clicks outside an element to close dropdowns, modals, or menus.

### Basic Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

function closeDropdown() {
  isOpen.value = false
}
</script>

<template>
  <div v-click-outside="closeDropdown" class="dropdown">
    <button @click="isOpen = !isOpen">Toggle Menu</button>
    <div v-if="isOpen" class="menu">
      <a href="#">Option 1</a>
      <a href="#">Option 2</a>
    </div>
  </div>
</template>
```

### API

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `handler` | `(event: Event) => void` | - | Function to call on outside click |
| `exclude` | `string[] \| HTMLElement[]` | `[]` | Elements to exclude from outside click detection |
| `events` | `string[]` | `['click']` | Events to listen for (e.g., `['click', 'touchstart']`) |
| `enabled` | `boolean` | `true` | Enable/disable directive |

### Syntax

**Function Handler (Simple)**:

```vue
<div v-click-outside="closeMenu">
  <!-- Content -->
</div>
```

**Object with Options**:

```vue
<div v-click-outside="{
  handler: closeMenu,
  exclude: ['.modal-backdrop'],
  events: ['click', 'touchstart']
}">
  <!-- Content -->
</div>
```

### Excluding Elements

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
const triggerRef = ref<HTMLElement>()

function close() {
  isOpen.value = false
}
</script>

<template>
  <button ref="triggerRef" @click="isOpen = !isOpen">
    Open Menu
  </button>

  <div v-click-outside="{
    handler: close,
    exclude: [triggerRef]
  }"
  v-if="isOpen">
    <!-- Clicking trigger button won't close menu -->
    Menu content
  </div>
</template>
```

### Conditional Activation

```vue
<script setup lang="ts">
const isEditing = ref(false)

function saveChanges() {
  isEditing.value = false
  // Save logic
}
</script>

<template>
  <div v-click-outside="{
    handler: saveChanges,
    enabled: isEditing
  }">
    <!-- Only detect outside clicks when editing -->
  </div>
</template>
```

### Common Use Cases

**Dropdown Menu**:

```vue
<script setup lang="ts">
const showDropdown = ref(false)

function closeDropdown() {
  showDropdown.value = false
}
</script>

<template>
  <div v-click-outside="closeDropdown" class="dropdown">
    <MazBtn @click="showDropdown = !showDropdown">
      Menu
    </MazBtn>
    <div v-if="showDropdown" class="dropdown-menu">
      <a href="/profile">Profile</a>
      <a href="/settings">Settings</a>
      <a href="/logout">Logout</a>
    </div>
  </div>
</template>
```

**Modal Close**:

```vue
<script setup lang="ts">
const isModalOpen = ref(false)

function closeModal() {
  isModalOpen.value = false
}
</script>

<template>
  <div v-if="isModalOpen" class="modal-backdrop">
    <div v-click-outside="closeModal" class="modal-content">
      <!-- Modal content -->
      <!-- Clicking backdrop closes modal -->
    </div>
  </div>
</template>
```

### Performance Considerations

- Event listeners are **added/removed automatically** with directive lifecycle
- Use `exclude` option to prevent unnecessary checks
- Consider disabling during animations for better performance

---

## v-lazy-img

Lazy-load images using Intersection Observer API for better performance.

### Basic Usage

```vue
<template>
  <!-- Image loads when scrolled into view -->
  <img v-lazy-img="'/images/photo.jpg'" alt="Photo" />
</template>
```

### API

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | `string` | - | Image URL to lazy load |
| `placeholder` | `string` | - | Placeholder image URL while loading |
| `error` | `string` | - | Image to show if loading fails |
| `loading` | `string` | - | Loading spinner/image |
| `threshold` | `number` | `0.01` | Intersection Observer threshold (0-1) |
| `rootMargin` | `string` | `'0px'` | Margin around root (e.g., '50px' loads 50px before visible) |

### Syntax

**Simple (String)**:

```vue
<img v-lazy-img="imageUrl" alt="Description" />
```

**With Options (Object)**:

```vue
<img v-lazy-img="{
  src: '/images/photo.jpg',
  placeholder: '/images/placeholder.jpg',
  error: '/images/error.jpg',
  threshold: 0.5
}"
alt="Photo" />
```

### Placeholder & Error Handling

```vue
<script setup lang="ts">
const imageUrl = '/images/large-photo.jpg'
const placeholderUrl = '/images/blur-placeholder.jpg'
const errorUrl = '/images/image-not-found.jpg'
</script>

<template>
  <img
    v-lazy-img="{
      src: imageUrl,
      placeholder: placeholderUrl,
      error: errorUrl
    }"
    alt="Product photo"
  />
</template>
```

### Preload Before Visible

```vue
<template>
  <!-- Load images 100px before they enter viewport -->
  <img
    v-lazy-img="{
      src: '/images/photo.jpg',
      rootMargin: '100px'
    }"
    alt="Photo"
  />
</template>
```

### Loading State

```vue
<template>
  <img
    v-lazy-img="{
      src: '/images/photo.jpg',
      loading: '/images/spinner.gif'
    }"
    alt="Photo"
    class="lazy-image"
  />
</template>

<style scoped>
.lazy-image {
  min-height: 200px;
  background: #f0f0f0;
}
</style>
```

### Intersection Observer Threshold

```vue
<template>
  <!-- Load when 50% of image is visible -->
  <img
    v-lazy-img="{
      src: '/images/photo.jpg',
      threshold: 0.5
    }"
    alt="Photo"
  />

  <!-- Load when fully visible -->
  <img
    v-lazy-img="{
      src: '/images/photo.jpg',
      threshold: 1.0
    }"
    alt="Photo"
  />
</template>
```

### Best Practices

1. **Always provide alt text** - Required for accessibility
2. **Use placeholders** - Improve perceived performance
3. **Set dimensions** - Prevent layout shift
4. **Optimize placeholder images** - Use small, blurred versions
5. **Use appropriate threshold** - Balance between early loading and performance

### SSR Compatibility

- ✅ Works in SSR (Nuxt)
- Placeholder shown on server, lazy loading on client
- No hydration mismatches

---

## v-zoom-img

Add zoom functionality to images on hover or click.

### Basic Usage

```vue
<template>
  <!-- Hover to zoom -->
  <img v-zoom-img="'/images/product.jpg'" alt="Product" />
</template>
```

### API

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scale` | `number` | `2` | Zoom scale multiplier |
| `trigger` | `'hover' \| 'click'` | `'hover'` | Zoom trigger event |
| `duration` | `number` | `300` | Transition duration (ms) |
| `origin` | `'center' \| 'cursor'` | `'cursor'` | Zoom origin point |

### Syntax

**Simple**:

```vue
<img v-zoom-img="imageUrl" alt="Photo" />
```

**With Options**:

```vue
<img v-zoom-img="{
  src: '/images/photo.jpg',
  scale: 3,
  trigger: 'click',
  duration: 500
}"
alt="Photo" />
```

### Zoom on Hover

```vue
<template>
  <img
    v-zoom-img="{
      src: '/images/product.jpg',
      scale: 2,
      trigger: 'hover'
    }"
    alt="Product"
    class="product-image"
  />
</template>

<style scoped>
.product-image {
  cursor: zoom-in;
  transition: transform 0.3s ease;
}
</style>
```

### Zoom on Click

```vue
<template>
  <img
    v-zoom-img="{
      src: '/images/artwork.jpg',
      scale: 4,
      trigger: 'click',
      origin: 'center'
    }"
    alt="Artwork"
  />
</template>
```

### Use Cases

- **Product Images**: Allow customers to inspect details
- **Gallery**: Preview images before fullscreen
- **Documentation**: Zoom into diagrams or screenshots
- **Portfolio**: Showcase artwork details

---

## v-fullscreen-img

Open images in fullscreen viewer with zoom and navigation.

### Basic Usage

```vue
<template>
  <!-- Click to open fullscreen -->
  <img v-fullscreen-img="'/images/photo.jpg'" alt="Photo" />
</template>
```

### API

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `images` | `string[]` | - | Array of image URLs for gallery mode |
| `index` | `number` | `0` | Starting index in gallery |
| `closeOnBackdrop` | `boolean` | `true` | Close on backdrop click |
| `showNavigation` | `boolean` | `true` | Show prev/next buttons |
| `showZoom` | `boolean` | `true` | Show zoom controls |

### Syntax

**Single Image**:

```vue
<img v-fullscreen-img="'/images/photo.jpg'" alt="Photo" />
```

**Gallery Mode**:

```vue
<template>
  <div class="gallery">
    <img
      v-for="(image, index) in images"
      :key="image"
      v-fullscreen-img="{
        images: images,
        index: index
      }"
      :src="image"
      alt="Gallery photo"
    />
  </div>
</template>

<script setup lang="ts">
const images = [
  '/images/photo1.jpg',
  '/images/photo2.jpg',
  '/images/photo3.jpg'
]
</script>
```

### Fullscreen Options

```vue
<template>
  <img
    v-fullscreen-img="{
      src: '/images/photo.jpg',
      closeOnBackdrop: false,
      showZoom: true,
      showNavigation: false
    }"
    alt="Photo"
  />
</template>
```

### Gallery with Thumbnails

```vue
<script setup lang="ts">
const galleryImages = [
  { thumb: '/thumbs/1.jpg', full: '/full/1.jpg' },
  { thumb: '/thumbs/2.jpg', full: '/full/2.jpg' },
  { thumb: '/thumbs/3.jpg', full: '/full/3.jpg' }
]

const fullImages = galleryImages.map(img => img.full)
</script>

<template>
  <div class="gallery-grid">
    <img
      v-for="(item, i) in galleryImages"
      :key="i"
      v-fullscreen-img="{
        images: fullImages,
        index: i
      }"
      :src="item.thumb"
      alt="Gallery thumbnail"
      class="thumbnail"
    />
  </div>
</template>
```

### Keyboard Navigation

Fullscreen viewer supports:
- **Esc**: Close viewer
- **Arrow Left/Right**: Navigate gallery
- **+/-**: Zoom in/out
- **Space**: Toggle zoom

### Accessibility

- **Focus trap**: Keyboard navigation contained within viewer
- **ARIA labels**: Screen reader announcements
- **Keyboard support**: All functions accessible via keyboard

---

## Directive Registration (Vue 3)

### Global Registration

```typescript
// main.ts
import { createApp } from 'vue'
import {
  vTooltip,
  vClickOutside,
  vLazyImg,
  vZoomImg,
  vFullscreenImg
} from 'maz-ui/directives'

const app = createApp(App)

app.directive('tooltip', vTooltip)
app.directive('click-outside', vClickOutside)
app.directive('lazy-img', vLazyImg)
app.directive('zoom-img', vZoomImg)
app.directive('fullscreen-img', vFullscreenImg)

app.mount('#app')
```

### Component-Level Registration

```vue
<script setup lang="ts">
import { vTooltip, vClickOutside } from 'maz-ui/directives'

// Directives available in this component only
</script>

<template>
  <div v-tooltip="'Tooltip text'">
    <button v-click-outside="closeMenu">Menu</button>
  </div>
</template>
```

### Custom Directive Names

```typescript
// Use custom names to avoid conflicts
app.directive('maz-tooltip', vTooltip)
app.directive('maz-click-outside', vClickOutside)
```

---

## Best Practices

### Performance

1. **v-lazy-img**: Use for images below the fold
2. **v-tooltip**: Tooltips are lightweight, safe for many elements
3. **v-click-outside**: Automatically cleans up event listeners
4. **v-zoom-img**: Use `transform` for GPU acceleration
5. **v-fullscreen-img**: Only load fullscreen viewer when triggered

### Accessibility

1. **Tooltips**: Provide `aria-label` for screen readers
2. **Click-outside**: Ensure alternative close methods (Esc key, close button)
3. **Images**: Always include `alt` attributes
4. **Keyboard**: Test all directives with keyboard navigation
5. **Focus**: Ensure logical focus order

### SSR Considerations

| Directive | SSR Support | Notes |
|-----------|-------------|-------|
| `v-tooltip` | ✅ Full | Works in SSR |
| `v-click-outside` | ✅ Full | Event listeners added on client |
| `v-lazy-img` | ✅ Full | Shows placeholder on server |
| `v-zoom-img` | ⚠️ Partial | Initialize on client only |
| `v-fullscreen-img` | ⚠️ Partial | Viewer opens on client only |

---

## Troubleshooting

### Directive Not Working

**Problem**: Directive has no effect

```vue
<!-- ❌ Wrong: directive not registered -->
<div v-tooltip="'Text'">Hover</div>

<!-- ✅ Correct: register directive first -->
<script setup>
import { vTooltip } from 'maz-ui/directives'
</script>
<div v-tooltip="'Text'">Hover</div>
```

### Click-Outside Triggers Immediately

**Problem**: Click-outside fires on mount

**Solution**: Add small delay or exclude trigger element

```vue
<script setup>
const triggerRef = ref<HTMLElement>()

function close() {
  // Handler
}
</script>

<template>
  <button ref="triggerRef" @click="open">Open</button>
  <div v-click-outside="{
    handler: close,
    exclude: [triggerRef]
  }">
    Content
  </div>
</template>
```

### Lazy Images Not Loading

**Problem**: Images never load

**Causes**:
- Intersection Observer not supported (IE11)
- Image dimensions not set (0x0 size)
- Threshold too high

**Solution**:

```vue
<template>
  <!-- Set explicit dimensions -->
  <img
    v-lazy-img="{
      src: '/photo.jpg',
      threshold: 0.01
    }"
    alt="Photo"
    width="300"
    height="200"
  />
</template>
```

---

## Related Documentation

- **Composables**: `references/composables.md`
- **Components**: `references/components-*.md`
- **Accessibility**: `references/accessibility.md`
- **Performance**: `references/performance.md`

---

**Last Updated**: 2025-12-29 | **Maz-UI Version**: 4.3.3
