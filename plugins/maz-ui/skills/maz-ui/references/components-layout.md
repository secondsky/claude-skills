# Maz-UI Layout & Display Components Reference

Comprehensive guide to all Maz-UI layout and display components for structuring content and creating interactive interfaces.

## Overview

Maz-UI provides **12 powerful layout and display components** for organizing content, creating overlays, and enhancing visual presentation:

**Containers & Cards**:
- `MazCard` - Versatile container with header/footer
- `MazAccordion` - Collapsible content panels

**Overlays & Modals**:
- `MazDrawer` - Slide-out side panel
- `MazBottomSheet` - Mobile bottom drawer
- `MazBackdrop` - Overlay backdrop
- `MazPopover` - Floating tooltip/menu
- `MazDropdown` - Dropdown menu

**Media & Display**:
- `MazCarousel` - Image/content carousel
- `MazGallery` - Image gallery with lightbox
- `MazLazyImg` - Lazy-loaded images

**Animations & Interactions**:
- `MazExpandAnimation` - Smooth expand/collapse
- `MazPullToRefresh` - Mobile pull-to-refresh

**Key Features**:
- ✅ **Responsive** - Adapts to all screen sizes
- ✅ **Customizable** - Colors, sizes, positions
- ✅ **Accessible** - ARIA attributes and keyboard support
- ✅ **Touch-Friendly** - Mobile gestures and interactions
- ✅ **SSR Compatible** - Works with Nuxt 3

---

## MazCard

Versatile container component with optional header and footer sections.

### Basic Usage

```vue
<script setup>
import MazCard from 'maz-ui/components/MazCard'
</script>

<template>
  <MazCard>
    <template #header>
      <h3>Card Title</h3>
    </template>

    <p>Card content goes here...</p>

    <template #footer>
      <MazBtn>Action</MazBtn>
    </template>
  </MazCard>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'destructive' \| 'contrast'` | Border/header color | `'contrast'` |
| `elevation` | `boolean \| number` | Box shadow elevation (0-5) | `1` |
| `bordered` | `boolean` | Show border | `false` |
| `overflowHidden` | `boolean` | Hide overflow content | `false` |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | Card padding | `'md'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg'` | Border radius | `'md'` |

### Slots

| Slot | Description |
|------|-------------|
| `header` | Card header content |
| `default` | Main card content |
| `footer` | Card footer content |

### Examples

**Elevated Card**:
```vue
<template>
  <MazCard :elevation="3" bordered>
    <template #header>
      <h3>Product Card</h3>
    </template>
    <p>Product description...</p>
    <template #footer>
      <MazBtn color="primary">Buy Now</MazBtn>
    </template>
  </MazCard>
</template>
```

**Card Grid**:
```vue
<template>
  <div class="grid grid-cols-3 gap-4">
    <MazCard
      v-for="item in items"
      :key="item.id"
      :elevation="2"
    >
      <img :src="item.image" alt="" class="w-full" />
      <h4 class="mt-2">{{ item.title }}</h4>
      <p>{{ item.description }}</p>
    </MazCard>
  </div>
</template>
```

---

## MazAccordion

Collapsible content panels for organizing information.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazAccordion from 'maz-ui/components/MazAccordion'

const openPanels = ref(['panel-1'])

const panels = [
  { id: 'panel-1', title: 'Panel 1', content: 'Content 1' },
  { id: 'panel-2', title: 'Panel 2', content: 'Content 2' },
  { id: 'panel-3', title: 'Panel 3', content: 'Content 3' }
]
</script>

<template>
  <MazAccordion v-model="openPanels" :panels="panels">
    <template #panel-1>
      <p>Detailed content for panel 1...</p>
    </template>
    <template #panel-2>
      <p>Detailed content for panel 2...</p>
    </template>
    <template #panel-3>
      <p>Detailed content for panel 3...</p>
    </template>
  </MazAccordion>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `modelValue` | `string[]` | Open panel IDs (v-model) | `[]` |
| `panels` | `Panel[]` | Array of panel objects | `[]` |
| `multiple` | `boolean` | Allow multiple panels open | `false` |
| `bordered` | `boolean` | Show borders | `false` |
| `color` | `string` | Header color | `'primary'` |

### Panel Object

```typescript
interface Panel {
  id: string
  title: string
  disabled?: boolean
  icon?: string
}
```

### Examples

**Single Panel Open**:
```vue
<template>
  <MazAccordion
    v-model="openPanels"
    :panels="panels"
    :multiple="false"
  >
    <!-- Only one panel can be open at a time -->
  </MazAccordion>
</template>
```

**FAQ Example**:
```vue
<script setup>
const faqs = [
  {
    id: 'faq-1',
    title: 'What is Maz-UI?',
    icon: 'question'
  },
  {
    id: 'faq-2',
    title: 'How do I install it?',
    icon: 'download'
  }
]
</script>

<template>
  <MazAccordion v-model="openFaqs" :panels="faqs" bordered>
    <template #faq-1>
      <p>Maz-UI is a comprehensive Vue component library...</p>
    </template>
    <template #faq-2>
      <pre><code>npm install maz-ui</code></pre>
    </template>
  </MazAccordion>
</template>
```

---

## MazDrawer

Slide-out panel from screen edge for navigation or content.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazDrawer from 'maz-ui/components/MazDrawer'

const isOpen = ref(false)
</script>

<template>
  <MazBtn @click="isOpen = true">Open Drawer</MazBtn>

  <MazDrawer
    v-model="isOpen"
    position="right"
    width="400px"
  >
    <template #header>
      <h3>Drawer Title</h3>
    </template>

    <div class="p-4">
      <p>Drawer content...</p>
    </div>

    <template #footer>
      <MazBtn @click="isOpen = false">Close</MazBtn>
    </template>
  </MazDrawer>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `modelValue` | `boolean` | Open/close state (v-model) | `false` |
| `position` | `'left' \| 'right' \| 'top' \| 'bottom'` | Drawer position | `'right'` |
| `width` | `string` | Drawer width (left/right) | `'400px'` |
| `height` | `string` | Drawer height (top/bottom) | `'50vh'` |
| `backdrop` | `boolean` | Show backdrop overlay | `true` |
| `closeOnBackdropClick` | `boolean` | Close when backdrop clicked | `true` |
| `persistent` | `boolean` | Prevent closing | `false` |

### Examples

**Navigation Drawer**:
```vue
<template>
  <MazDrawer
    v-model="isNavOpen"
    position="left"
    width="280px"
  >
    <template #header>
      <h2>Menu</h2>
    </template>

    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/profile">Profile</a>
      <a href="/settings">Settings</a>
    </nav>
  </MazDrawer>
</template>
```

**Settings Panel**:
```vue
<template>
  <MazDrawer
    v-model="showSettings"
    position="right"
    width="500px"
  >
    <template #header>
      <h3>Settings</h3>
    </template>

    <div class="p-4">
      <MazInput label="Username" />
      <MazSwitch label="Dark Mode" />
    </div>

    <template #footer>
      <MazBtn @click="saveSettings" color="primary">Save</MazBtn>
      <MazBtn @click="showSettings = false">Cancel</MazBtn>
    </template>
  </MazDrawer>
</template>
```

---

## MazBottomSheet

Mobile-first bottom drawer with drag-to-close gesture.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazBottomSheet from 'maz-ui/components/MazBottomSheet'

const isOpen = ref(false)
</script>

<template>
  <MazBtn @click="isOpen = true">Open Bottom Sheet</MazBtn>

  <MazBottomSheet v-model="isOpen">
    <template #header>
      <h3>Bottom Sheet Title</h3>
    </template>

    <div class="p-4">
      <p>Content goes here...</p>
    </div>
  </MazBottomSheet>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `modelValue` | `boolean` | Open/close state (v-model) | `false` |
| `height` | `string` | Sheet height | `'auto'` |
| `maxHeight` | `string` | Maximum height | `'90vh'` |
| `draggable` | `boolean` | Enable drag-to-close | `true` |
| `backdrop` | `boolean` | Show backdrop | `true` |
| `snapPoints` | `number[]` | Snap positions (0-1) | `[0.5, 1]` |

### Examples

**Action Sheet**:
```vue
<template>
  <MazBottomSheet v-model="showActions" height="auto">
    <div class="p-4">
      <MazBtn block @click="handleEdit">Edit</MazBtn>
      <MazBtn block @click="handleShare">Share</MazBtn>
      <MazBtn block color="destructive" @click="handleDelete">
        Delete
      </MazBtn>
    </div>
  </MazBottomSheet>
</template>
```

**Filter Panel**:
```vue
<template>
  <MazBottomSheet
    v-model="showFilters"
    height="60vh"
    :snap-points="[0.3, 0.6, 1]"
  >
    <template #header>
      <h3>Filters</h3>
    </template>

    <div class="p-4">
      <MazSelect label="Category" :options="categories" />
      <MazSlider label="Price Range" />
    </div>

    <template #footer>
      <MazBtn @click="applyFilters" color="primary">Apply</MazBtn>
    </template>
  </MazBottomSheet>
</template>
```

---

## MazBackdrop

Overlay backdrop for modals and drawers.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazBackdrop from 'maz-ui/components/MazBackdrop'

const showBackdrop = ref(false)
</script>

<template>
  <MazBackdrop
    v-if="showBackdrop"
    @click="showBackdrop = false"
  />

  <div v-if="showBackdrop" class="modal">
    <!-- Modal content -->
  </div>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `color` | `string` | Backdrop color (CSS color) | `'rgba(0,0,0,0.5)'` |
| `blur` | `boolean` | Enable backdrop blur | `false` |
| `zIndex` | `number` | Z-index value | `9998` |
| `persistent` | `boolean` | Prevent click events | `false` |

---

## MazPopover

Floating tooltip or menu positioned relative to trigger element.

### Basic Usage

```vue
<script setup>
import MazPopover from 'maz-ui/components/MazPopover'
</script>

<template>
  <MazPopover>
    <template #trigger>
      <MazBtn>Show Popover</MazBtn>
    </template>

    <template #content>
      <div class="p-4">
        <h4>Popover Title</h4>
        <p>Popover content...</p>
      </div>
    </template>
  </MazPopover>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | Popover position | `'bottom'` |
| `trigger` | `'click' \| 'hover' \| 'focus'` | Trigger event | `'click'` |
| `offset` | `number` | Distance from trigger (px) | `8` |
| `arrow` | `boolean` | Show arrow pointer | `true` |
| `closeOnClickOutside` | `boolean` | Close on outside click | `true` |

### Examples

**User Menu**:
```vue
<template>
  <MazPopover position="bottom-end" trigger="click">
    <template #trigger>
      <MazAvatar :src="user.avatar" />
    </template>

    <template #content>
      <div class="w-64 p-2">
        <a href="/profile" class="block px-4 py-2">Profile</a>
        <a href="/settings" class="block px-4 py-2">Settings</a>
        <hr />
        <a href="/logout" class="block px-4 py-2 text-destructive">
          Logout
        </a>
      </div>
    </template>
  </MazPopover>
</template>
```

**Info Popover**:
```vue
<template>
  <MazPopover trigger="hover" position="top">
    <template #trigger>
      <MazIcon name="info-circle" />
    </template>

    <template #content>
      <div class="p-3 max-w-xs">
        <p class="text-sm">Additional information about this feature...</p>
      </div>
    </template>
  </MazPopover>
</template>
```

---

## MazDropdown

Dropdown menu with keyboard navigation.

### Basic Usage

```vue
<script setup>
import MazDropdown from 'maz-ui/components/MazDropdown'

const items = [
  { id: '1', label: 'Item 1', icon: 'check' },
  { id: '2', label: 'Item 2', icon: 'star' },
  { id: '3', label: 'Item 3', icon: 'heart', divider: true },
  { id: '4', label: 'Delete', icon: 'trash', color: 'destructive' }
]
</script>

<template>
  <MazDropdown :items="items" @select="handleSelect">
    <template #trigger>
      <MazBtn>Actions</MazBtn>
    </template>
  </MazDropdown>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `items` | `DropdownItem[]` | Menu items | `[]` |
| `position` | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end'` | Menu position | `'bottom-start'` |
| `width` | `string` | Menu width | `'auto'` |

### DropdownItem

```typescript
interface DropdownItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  divider?: boolean  // Show divider after this item
  color?: string
  onClick?: () => void
}
```

---

## MazCarousel

Image and content carousel with navigation controls.

### Basic Usage

```vue
<script setup>
import MazCarousel from 'maz-ui/components/MazCarousel'

const slides = [
  { id: 1, src: '/images/slide-1.jpg', alt: 'Slide 1' },
  { id: 2, src: '/images/slide-2.jpg', alt: 'Slide 2' },
  { id: 3, src: '/images/slide-3.jpg', alt: 'Slide 3' }
]
</script>

<template>
  <MazCarousel :slides="slides" />
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `slides` | `Slide[]` | Array of slide objects | `[]` |
| `autoplay` | `boolean` | Enable autoplay | `false` |
| `interval` | `number` | Autoplay interval (ms) | `5000` |
| `showArrows` | `boolean` | Show navigation arrows | `true` |
| `showDots` | `boolean` | Show pagination dots | `true` |
| `loop` | `boolean` | Enable infinite loop | `true` |

### Examples

**Hero Carousel**:
```vue
<template>
  <MazCarousel
    :slides="heroSlides"
    autoplay
    :interval="4000"
    loop
    class="h-96"
  >
    <template #slide="{ slide }">
      <div class="relative h-full">
        <img :src="slide.src" class="w-full h-full object-cover" />
        <div class="absolute inset-0 flex items-center justify-center">
          <h2 class="text-white text-4xl">{{ slide.title }}</h2>
        </div>
      </div>
    </template>
  </MazCarousel>
</template>
```

---

## MazGallery

Image gallery with lightbox viewer.

### Basic Usage

```vue
<script setup>
import MazGallery from 'maz-ui/components/MazGallery'

const images = [
  { id: 1, src: '/gallery/photo-1.jpg', thumbnail: '/gallery/thumb-1.jpg' },
  { id: 2, src: '/gallery/photo-2.jpg', thumbnail: '/gallery/thumb-2.jpg' },
  { id: 3, src: '/gallery/photo-3.jpg', thumbnail: '/gallery/thumb-3.jpg' }
]
</script>

<template>
  <MazGallery :images="images" />
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `images` | `GalleryImage[]` | Array of image objects | `[]` |
| `columns` | `number` | Grid columns | `3` |
| `gap` | `string` | Gap between images | `'1rem'` |
| `lightbox` | `boolean` | Enable lightbox viewer | `true` |

---

## MazLazyImg

Lazy-loaded images with IntersectionObserver.

### Basic Usage

```vue
<script setup>
import MazLazyImg from 'maz-ui/components/MazLazyImg'
</script>

<template>
  <MazLazyImg
    src="/images/large-photo.jpg"
    placeholder="/images/placeholder.jpg"
    alt="Photo description"
  />
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `src` | `string` | Image source URL | `''` |
| `placeholder` | `string` | Placeholder image URL | `''` |
| `alt` | `string` | Image alt text | `''` |
| `threshold` | `number` | Intersection threshold (0-1) | `0.1` |
| `fadeIn` | `boolean` | Fade in on load | `true` |

---

## MazExpandAnimation

Smooth expand/collapse animation wrapper.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazExpandAnimation from 'maz-ui/components/MazExpandAnimation'

const isExpanded = ref(false)
</script>

<template>
  <MazBtn @click="isExpanded = !isExpanded">
    Toggle Content
  </MazBtn>

  <MazExpandAnimation :expanded="isExpanded">
    <div class="p-4">
      <p>This content smoothly expands and collapses...</p>
    </div>
  </MazExpandAnimation>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `expanded` | `boolean` | Expanded state | `false` |
| `duration` | `number` | Animation duration (ms) | `300` |

---

## MazPullToRefresh

Mobile pull-to-refresh gesture handler.

### Basic Usage

```vue
<script setup>
import MazPullToRefresh from 'maz-ui/components/MazPullToRefresh'

async function handleRefresh() {
  await fetchNewData()
}
</script>

<template>
  <MazPullToRefresh @refresh="handleRefresh">
    <div class="content">
      <div v-for="item in items" :key="item.id">
        {{ item.title }}
      </div>
    </div>
  </MazPullToRefresh>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `threshold` | `number` | Pull distance to trigger (px) | `60` |
| `color` | `string` | Spinner color | `'primary'` |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `refresh` | - | Emitted when refresh triggered |

---

## Best Practices

### Cards & Containers

**DO**:
- Use cards to group related content
- Provide visual hierarchy with elevation
- Use header/footer for actions and titles

**DON'T**:
- Nest cards deeply (max 2 levels)
- Use cards for every small piece of content

### Overlays & Modals

**DO**:
- Use drawers for navigation and settings
- Use bottom sheets for mobile action menus
- Provide clear close mechanisms

**DON'T**:
- Show multiple modals simultaneously
- Use persistent modals without escape route

### Media Components

**DO**:
- Use lazy loading for images below fold
- Provide alt text for all images
- Optimize image sizes for web

**DON'T**:
- Load all gallery images at once
- Skip placeholder images for lazy loading

---

## Related Documentation

- **[Components Forms](./components-forms.md)** - Form input components
- **[Components Feedback](./components-feedback.md)** - Loading and feedback components
- **[Components Navigation](./components-navigation.md)** - Navigation components
- **[Directives Reference](./directives.md)** - v-lazy-img, v-zoom-img, v-fullscreen-img

---

**Version**: Maz-UI v4.3.3
**Last Updated**: 2025-12-14
**Component Count**: 12 layout & display components
