# Maz-UI Icons Reference

Comprehensive guide to the @maz-ui/icons package - 840+ optimized SVG icons for Vue and Nuxt applications.

## Overview

Maz-UI provides a comprehensive icon library through the `@maz-ui/icons` package and `MazIcon` component:

**Features**:
- ✅ **840+ Icons** - Comprehensive icon set covering all common use cases
- ✅ **Optimized SVGs** - Lightweight, crisp at any size
- ✅ **Tree-Shakable** - Only bundle icons you use
- ✅ **Customizable** - Size, color, rotation controls
- ✅ **TypeScript Support** - Full type safety with icon name autocomplete
- ✅ **Accessibility** - Semantic HTML with ARIA attributes
- ✅ **SSR Compatible** - Works with Nuxt 3 server-side rendering

**Package**: `@maz-ui/icons`
**Version**: v4.3.3
**Icon Count**: 840+

---

## Installation

### Vue 3 Installation

```bash
# Install icons package
pnpm add @maz-ui/icons

# Or with npm
npm install @maz-ui/icons
```

### Nuxt 3 Installation

Icons are automatically included with the `@maz-ui/nuxt` module:

```bash
pnpm add @maz-ui/nuxt
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt']
  // MazIcon component auto-imported!
})
```

---

## Basic Usage

### MazIcon Component

```vue
<script setup>
import MazIcon from 'maz-ui/components/MazIcon'
</script>

<template>
  <!-- Basic icon -->
  <MazIcon name="home" />

  <!-- With color -->
  <MazIcon name="heart" color="destructive" />

  <!-- With size -->
  <MazIcon name="user" size="2rem" />

  <!-- Custom color (CSS color) -->
  <MazIcon name="star" color="#FFD700" />
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `name` | `string` | Icon name (required) | - |
| `size` | `string \| number` | Icon size (px, em, rem) | `'1.5rem'` |
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'destructive' \| string` | Icon color | `'current'` |
| `rotate` | `number` | Rotation angle (degrees) | `0` |
| `spin` | `boolean` | Enable spin animation | `false` |
| `pulse` | `boolean` | Enable pulse animation | `false` |

### Direct SVG Import

For custom usage or tree-shaking optimization:

```vue
<script setup>
import HomeIcon from '@maz-ui/icons/home'
import UserIcon from '@maz-ui/icons/user'
</script>

<template>
  <HomeIcon class="w-6 h-6 text-primary" />
  <UserIcon class="w-8 h-8 text-success" />
</template>
```

---

## Icon Categories

### Common Icons

**UI & Navigation** (~120 icons):
- `home`, `menu`, `search`, `settings`, `close`, `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`
- `arrow-left`, `arrow-right`, `arrow-up`, `arrow-down`
- `more-vertical`, `more-horizontal`, `external-link`, `link`

**Actions** (~100 icons):
- `edit`, `delete`, `trash`, `save`, `download`, `upload`, `copy`, `paste`
- `plus`, `minus`, `check`, `x`, `refresh`, `undo`, `redo`
- `play`, `pause`, `stop`, `skip-forward`, `skip-back`

**Communication** (~80 icons):
- `mail`, `send`, `inbox`, `message`, `chat`, `comment`, `bell`, `notification`
- `phone`, `video`, `mic`, `mic-off`, `volume-up`, `volume-down`, `volume-mute`

**Files & Documents** (~70 icons):
- `file`, `file-text`, `file-image`, `file-video`, `file-audio`, `file-code`
- `folder`, `folder-open`, `download-cloud`, `upload-cloud`
- `archive`, `clipboard`, `document`, `page`

**Media** (~60 icons):
- `image`, `camera`, `video`, `film`, `music`, `headphones`
- `play-circle`, `pause-circle`, `stop-circle`
- `volume`, `mic`, `tv`, `monitor`

**Social** (~50 icons):
- `share`, `heart`, `star`, `thumbs-up`, `thumbs-down`
- `facebook`, `twitter`, `instagram`, `linkedin`, `github`
- `youtube`, `twitch`, `discord`, `slack`

**Business** (~80 icons):
- `briefcase`, `calendar`, `clock`, `dollar`, `credit-card`, `shopping-cart`
- `tag`, `gift`, `trending-up`, `trending-down`, `bar-chart`, `pie-chart`
- `users`, `user-plus`, `user-minus`, `user-check`

**System** (~90 icons):
- `alert-circle`, `alert-triangle`, `info`, `help-circle`, `question`
- `check-circle`, `x-circle`, `shield`, `lock`, `unlock`, `key`
- `eye`, `eye-off`, `filter`, `sliders`, `grid`, `list`

**Devices** (~40 icons):
- `smartphone`, `tablet`, `laptop`, `monitor`, `desktop`, `watch`
- `printer`, `hard-drive`, `server`, `cpu`, `battery`, `wifi`

**Weather** (~30 icons):
- `sun`, `moon`, `cloud`, `cloud-rain`, `cloud-snow`, `wind`
- `umbrella`, `droplet`, `thermometer`

**Other** (~120 icons):
- `map`, `map-pin`, `navigation`, `compass`, `globe`
- `bookmark`, `flag`, `award`, `trophy`, `target`
- `tool`, `wrench`, `hammer`, `scissors`, `paperclip`

---

## Common Icon Names

### Most Used Icons

```vue
<template>
  <!-- Navigation -->
  <MazIcon name="home" />
  <MazIcon name="menu" />
  <MazIcon name="search" />
  <MazIcon name="settings" />
  <MazIcon name="user" />

  <!-- Actions -->
  <MazIcon name="edit" />
  <MazIcon name="delete" />
  <MazIcon name="save" />
  <MazIcon name="plus" />
  <MazIcon name="check" />

  <!-- Status -->
  <MazIcon name="check-circle" />
  <MazIcon name="x-circle" />
  <MazIcon name="alert-circle" />
  <MazIcon name="info" />

  <!-- UI -->
  <MazIcon name="chevron-down" />
  <MazIcon name="chevron-right" />
  <MazIcon name="x" />
  <MazIcon name="more-vertical" />

  <!-- Social -->
  <MazIcon name="heart" />
  <MazIcon name="star" />
  <MazIcon name="share" />
  <MazIcon name="mail" />
</template>
```

---

## Icon Sizing

### Predefined Sizes

```vue
<template>
  <MazIcon name="star" size="sm" />   <!-- 1rem -->
  <MazIcon name="star" size="md" />   <!-- 1.5rem (default) -->
  <MazIcon name="star" size="lg" />   <!-- 2rem -->
  <MazIcon name="star" size="xl" />   <!-- 3rem -->
</template>
```

### Custom Sizes

```vue
<template>
  <!-- Pixel values -->
  <MazIcon name="heart" size="24px" />
  <MazIcon name="heart" :size="24" />  <!-- Number = px -->

  <!-- Em/Rem values -->
  <MazIcon name="heart" size="1.5em" />
  <MazIcon name="heart" size="2rem" />

  <!-- Responsive -->
  <MazIcon name="heart" size="clamp(1rem, 2vw, 2rem)" />
</template>
```

---

## Icon Colors

### Theme Colors

```vue
<template>
  <MazIcon name="check" color="primary" />
  <MazIcon name="check" color="secondary" />
  <MazIcon name="check" color="info" />
  <MazIcon name="check" color="success" />
  <MazIcon name="check" color="warning" />
  <MazIcon name="check" color="destructive" />
</template>
```

### Custom Colors

```vue
<template>
  <!-- Hex -->
  <MazIcon name="star" color="#FFD700" />

  <!-- RGB/RGBA -->
  <MazIcon name="heart" color="rgb(239, 68, 68)" />
  <MazIcon name="heart" color="rgba(239, 68, 68, 0.5)" />

  <!-- CSS Variables -->
  <MazIcon name="user" color="var(--custom-color)" />

  <!-- Current color (inherits from parent) -->
  <MazIcon name="info" color="current" />
</template>
```

---

## Icon Animations

### Spin Animation

Perfect for loading indicators:

```vue
<template>
  <!-- Continuous spin -->
  <MazIcon name="loader" spin />
  <MazIcon name="refresh" spin />

  <!-- With button -->
  <MazBtn :loading="isLoading">
    <MazIcon v-if="isLoading" name="loader" spin class="mr-2" />
    {{ isLoading ? 'Loading...' : 'Load Data' }}
  </MazBtn>
</template>
```

### Pulse Animation

For notification badges:

```vue
<template>
  <div class="relative">
    <MazIcon name="bell" />
    <MazIcon
      name="circle"
      color="destructive"
      pulse
      size="8px"
      class="absolute top-0 right-0"
    />
  </div>
</template>
```

### Rotation

```vue
<template>
  <!-- Static rotation -->
  <MazIcon name="arrow-up" :rotate="90" />   <!-- Points right -->
  <MazIcon name="arrow-up" :rotate="180" />  <!-- Points down -->
  <MazIcon name="arrow-up" :rotate="270" />  <!-- Points left -->

  <!-- Dynamic rotation -->
  <MazIcon
    name="chevron-down"
    :rotate="isOpen ? 180 : 0"
    class="transition-transform"
  />
</template>
```

---

## Icon in Components

### Buttons with Icons

```vue
<template>
  <!-- Icon only -->
  <MazBtn icon>
    <MazIcon name="heart" />
  </MazBtn>

  <!-- Icon + Text -->
  <MazBtn>
    <MazIcon name="download" class="mr-2" />
    Download
  </MazBtn>

  <!-- Icon on right -->
  <MazBtn>
    Next
    <MazIcon name="chevron-right" class="ml-2" />
  </MazBtn>
</template>
```

### Input Icons

```vue
<template>
  <MazInput
    v-model="email"
    type="email"
    placeholder="Email"
  >
    <template #prefix>
      <MazIcon name="mail" />
    </template>
  </MazInput>

  <MazInput
    v-model="password"
    type="password"
  >
    <template #suffix>
      <MazBtn
        icon
        @click="showPassword = !showPassword"
      >
        <MazIcon :name="showPassword ? 'eye-off' : 'eye'" />
      </MazBtn>
    </template>
  </MazInput>
</template>
```

### Cards with Icons

```vue
<template>
  <MazCard>
    <template #header>
      <div class="flex items-center gap-2">
        <MazIcon name="inbox" color="primary" />
        <h3>Inbox</h3>
      </div>
    </template>

    <p>5 new messages</p>
  </MazCard>
</template>
```

### Tabs with Icons

```vue
<script setup>
const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'profile', label: 'Profile', icon: 'user' }
]
</script>

<template>
  <MazTabs v-model="activeTab" :tabs="tabs">
    <template #tab-label="{ tab }">
      <MazIcon :name="tab.icon" class="mr-2" />
      {{ tab.label }}
    </template>
  </MazTabs>
</template>
```

---

## Icon Discovery

### Icon Browser

Visit the official Maz-UI documentation to browse all 840+ icons:

**https://maz-ui.com/components/maz-icon**

The icon browser provides:
- Visual grid of all icons
- Search by name or category
- Click to copy icon name
- Preview with different sizes/colors

### Search Icons Programmatically

```vue
<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')

// Common icon names for autocomplete
const iconNames = [
  'home', 'user', 'settings', 'heart', 'star',
  'mail', 'phone', 'search', 'menu', 'close',
  // ... 830+ more
]

const filteredIcons = computed(() =>
  iconNames.filter(name =>
    name.includes(searchQuery.value.toLowerCase())
  )
)
</script>

<template>
  <MazInput
    v-model="searchQuery"
    placeholder="Search icons..."
  />

  <div class="grid grid-cols-8 gap-4 mt-4">
    <div
      v-for="icon in filteredIcons"
      :key="icon"
      class="flex flex-col items-center gap-1"
    >
      <MazIcon :name="icon" size="2rem" />
      <span class="text-xs">{{ icon }}</span>
    </div>
  </div>
</template>
```

---

## Best Practices

### Icon Sizing

**DO**:
- Use consistent icon sizes throughout your app
- Scale icons relative to text (1em, 1.5em)
- Use larger icons for touch targets on mobile (min 44px)

**DON'T**:
- Mix wildly different icon sizes in the same context
- Use icons smaller than 16px (hard to see)
- Use icons larger than 64px without purpose

```vue
<!-- ✅ Good: Consistent sizing -->
<div class="flex items-center gap-2">
  <MazIcon name="user" size="1.25em" />
  <span class="text-base">John Doe</span>
</div>

<!-- ❌ Bad: Inconsistent sizing -->
<div class="flex items-center gap-2">
  <MazIcon name="user" size="3rem" />
  <span class="text-sm">John Doe</span>
</div>
```

### Icon Colors

**DO**:
- Use semantic colors (success, warning, destructive)
- Maintain sufficient contrast for accessibility
- Use `color="current"` to inherit parent color

**DON'T**:
- Use too many different colors
- Use colors that don't convey meaning
- Forget about dark mode color contrast

```vue
<!-- ✅ Good: Semantic colors -->
<MazIcon name="check-circle" color="success" />
<MazIcon name="alert-triangle" color="warning" />
<MazIcon name="x-circle" color="destructive" />

<!-- ❌ Bad: Random colors -->
<MazIcon name="check" color="#FF00FF" />
<MazIcon name="info" color="#12AB34" />
```

### Accessibility

**DO**:
- Provide meaningful aria-label for icon-only buttons
- Use semantic HTML alongside icons
- Ensure icons are not the only indicator

**DON'T**:
- Rely solely on icons for critical information
- Use decorative icons without hiding from screen readers

```vue
<!-- ✅ Good: Accessible icon button -->
<MazBtn icon aria-label="Delete item">
  <MazIcon name="trash" />
</MazBtn>

<!-- ✅ Good: Icon with text -->
<MazBtn>
  <MazIcon name="save" class="mr-2" />
  Save
</MazBtn>

<!-- ❌ Bad: No accessible label -->
<MazBtn icon>
  <MazIcon name="delete" />
</MazBtn>
```

### Performance

**DO**:
- Use direct imports for better tree-shaking
- Preload commonly used icons
- Use SVG sprites for repeated icons

**DON'T**:
- Import entire icon library at once
- Use raster images when SVG is available
- Inline large icon sets

```vue
<!-- ✅ Good: Direct import (tree-shaken) -->
<script setup>
import HomeIcon from '@maz-ui/icons/home'
import UserIcon from '@maz-ui/icons/user'
</script>

<!-- ❌ Bad: Import all icons -->
<script setup>
import * as MazIcons from '@maz-ui/icons'
</script>
```

---

## TypeScript Support

### Icon Name Autocomplete

```typescript
// types/maz-ui.d.ts
import type { IconName } from '@maz-ui/icons'

interface IconProps {
  name: IconName  // Autocomplete for 840+ icon names!
  size?: string | number
  color?: string
}
```

### Typed Icon Component

```vue
<script setup lang="ts">
import type { IconName } from '@maz-ui/icons'

const icons: IconName[] = [
  'home',
  'user',
  'settings',
  // TypeScript validates these names
]
</script>
```

---

## SSR Compatibility

Icons work seamlessly with Nuxt 3 server-side rendering:

```vue
<!-- Nuxt 3 - Auto-imported, SSR-safe -->
<template>
  <div>
    <MazIcon name="home" />
    <MazIcon name="user" />
  </div>
</template>
```

**No hydration mismatches** - Icons render identically on server and client.

---

## Custom Icon Sets

### Adding Custom Icons

While Maz-UI provides 840+ icons, you can add your own:

```vue
<script setup>
// Import custom SVG as component
import CustomIcon from '@/assets/icons/custom.svg'
</script>

<template>
  <CustomIcon class="w-6 h-6 text-primary" />
</template>
```

### Mixing Icon Libraries

Use Maz-UI icons alongside other libraries:

```vue
<script setup>
import MazIcon from 'maz-ui/components/MazIcon'
import { Icon } from '@iconify/vue'  // Alternative library
</script>

<template>
  <MazIcon name="home" />
  <Icon icon="mdi:home" />
</template>
```

---

## Related Documentation

- **[MazIcon Component](https://maz-ui.com/components/maz-icon)** - Official component docs
- **[Icon Browser](https://maz-ui.com/components/maz-icon#icon-browser)** - Browse all 840+ icons
- **[Components Reference](./components-layout.md)** - Using icons in other components
- **[Theming Guide](./theming.md)** - Icon colors and theme integration

---

## External Resources

- **[@maz-ui/icons Package](https://www.npmjs.com/package/@maz-ui/icons)** - NPM package
- **[Icon Source Repository](https://github.com/LouisMazel/maz-ui/tree/master/packages/lib/icons)** - GitHub source code
- **[Lucide Icons](https://lucide.dev/)** - Original icon set (Maz-UI uses optimized versions)

---

**Version**: @maz-ui/icons v4.3.3
**Last Updated**: 2025-12-14
**Icon Count**: 840+ optimized SVG icons
**Package Size**: ~200KB (tree-shakable to only icons used)
