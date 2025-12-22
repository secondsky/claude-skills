# Inspira UI Code Patterns & Best Practices

This guide covers TypeScript patterns, Vue 3 Composition API conventions, and best practices for working with Inspira UI components.

## Component File Structure

Standard structure for all Inspira UI components:

```vue
<template>
  <!-- Template code -->
</template>

<script setup lang="ts">
// 1. Imports (explicit, always)
import { ref, computed, onMounted, onUnmounted } from "vue";

// 2. Props interface
interface Props {
  title: string;
  count?: number;
  isActive?: boolean;
}

// 3. Props definition with defaults
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  isActive: false,
});

// 4. Emits
const emit = defineEmits<{
  click: [value: string];
  update: [count: number];
}>();

// 5. Component logic
const state = ref(0);
const computed = computed(() => props.count * 2);

// 6. Lifecycle hooks
onMounted(() => {
  // Setup
});

onUnmounted(() => {
  // Cleanup
});
</script>

<style scoped>
/* Scoped styles if needed */
</style>
```

---

## Props Definition

### DO: Interface-Based Props

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
  variant?: "primary" | "secondary" | "destructive";
  items?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  variant: "primary",
  items: () => [],
});
</script>
```

### DON'T: Object Syntax Props

```vue
<script setup lang="ts">
// AVOID THIS - less type-safe, more verbose
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
  variant: {
    type: String,
    default: "primary",
    validator: (v) => ["primary", "secondary", "destructive"].includes(v),
  },
});
</script>
```

---

## Explicit Imports

Always include explicit imports, even in Nuxt with auto-imports:

```vue
<script setup lang="ts">
// ALWAYS DO THIS for Vue.js compatibility
import { ref, onMounted, computed, watch } from "vue";
import { useWindowSize, useMouse, useIntersectionObserver } from "@vueuse/core";
import { Motion } from "motion-v";

// This ensures components work in both Vue and Nuxt
// and makes dependencies clear
</script>
```

---

## Constants Naming

Use `CAPS_SNAKE_CASE` for constants, with component prefix:

```typescript
// Component-specific constants
const AURORA_GRADIENT_COLORS = ["#ff0000", "#00ff00", "#0000ff"] as const;
const BUTTON_ANIMATION_DURATION = 300;
const PARTICLE_DEFAULT_COUNT = 100;
const GLOBE_ROTATION_SPEED = 0.005;

// Configuration objects
const SHIMMER_BUTTON_CONFIG = {
  duration: 300,
  easing: "ease-in-out",
  colors: ["#3b82f6", "#8b5cf6"],
} as const;
```

---

## Avoid Enums - Use `as const` Objects

### DO: Use `as const` Objects

```typescript
export const ButtonVariants = {
  Primary: "primary",
  Secondary: "secondary",
  Destructive: "destructive",
  Ghost: "ghost",
} as const;

export type ButtonVariant = (typeof ButtonVariants)[keyof typeof ButtonVariants];

// Usage
const variant: ButtonVariant = ButtonVariants.Primary;
```

### DON'T: Use TypeScript Enums

```typescript
// AVOID - Enums have runtime overhead and tree-shaking issues
enum ButtonVariants {
  Primary = "primary",
  Secondary = "secondary",
  Destructive = "destructive",
}
```

---

## Motion-V Animation Patterns

### Basic Animation

```vue
<template>
  <Motion
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.5, ease: 'easeOut' }"
  >
    <div>Animated content</div>
  </Motion>
</template>

<script setup lang="ts">
import { Motion } from "motion-v";
</script>
```

### While In View Animation

```vue
<template>
  <Motion
    :initial="{ opacity: 0, scale: 0.8 }"
    :while-in-view="{ opacity: 1, scale: 1 }"
    :transition="{ delay: 0.3, duration: 0.8 }"
  >
    <div>Animates when scrolled into view</div>
  </Motion>
</template>
```

### Hover Animation

```vue
<template>
  <Motion
    :initial="{ scale: 1 }"
    :while-hover="{ scale: 1.05 }"
    :transition="{ type: 'spring', stiffness: 300 }"
  >
    <button>Hover me</button>
  </Motion>
</template>
```

---

## VueUse Composables Pattern

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useWindowSize,
  useMouse,
  useIntersectionObserver,
  useElementSize,
  useThrottleFn,
} from "@vueuse/core";

// Window dimensions
const { width: windowWidth, height: windowHeight } = useWindowSize();

// Mouse position
const { x: mouseX, y: mouseY } = useMouse();

// Element intersection
const target = ref<HTMLElement | null>(null);
const isVisible = ref(false);

useIntersectionObserver(target, ([{ isIntersecting }]) => {
  isVisible.value = isIntersecting;
});

// Throttled handler for performance
const handleScroll = useThrottleFn(() => {
  // Heavy computation
}, 100);
</script>
```

---

## Responsive Design Patterns

### Tailwind Responsive Classes

```vue
<template>
  <div class="text-2xl md:text-4xl lg:text-6xl xl:text-8xl">
    Responsive Text
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Responsive grid -->
  </div>

  <div class="hidden md:block">
    <!-- Desktop only -->
  </div>

  <div class="block md:hidden">
    <!-- Mobile only -->
  </div>
</template>
```

### Programmatic Responsiveness

```vue
<script setup lang="ts">
import { computed } from "vue";
import { useWindowSize } from "@vueuse/core";

const { width } = useWindowSize();

const isMobile = computed(() => width.value < 768);
const isTablet = computed(() => width.value >= 768 && width.value < 1024);
const isDesktop = computed(() => width.value >= 1024);

const particleCount = computed(() => {
  if (isMobile.value) return 50;
  if (isTablet.value) return 100;
  return 200;
});
</script>
```

---

## Dark Mode Patterns

### CSS Variables Approach

```vue
<template>
  <div class="bg-background text-foreground">
    <!-- Automatically switches with dark mode -->
  </div>

  <button class="bg-primary text-primary-foreground hover:bg-primary/90">
    Primary Button
  </button>

  <div class="border border-border bg-card text-card-foreground">
    Card content
  </div>
</template>
```

### Conditional Styling

```vue
<template>
  <div
    :class="[
      'transition-colors duration-200',
      isDark ? 'bg-gray-900' : 'bg-white',
    ]"
  >
    Content
  </div>
</template>

<script setup lang="ts">
import { useDark } from "@vueuse/core";

const isDark = useDark();
</script>
```

---

## WebGL/Canvas Cleanup Pattern

Critical for preventing memory leaks:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as THREE from "three";

const containerRef = ref<HTMLElement | null>(null);
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let animationId: number | null = null;

onMounted(() => {
  if (!containerRef.value) return;

  // Initialize Three.js
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
  renderer = new THREE.WebGLRenderer({ antialias: true });

  containerRef.value.appendChild(renderer.domElement);

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    renderer?.render(scene!, camera!);
  };
  animate();
});

onUnmounted(() => {
  // CRITICAL: Clean up WebGL resources
  if (animationId) cancelAnimationFrame(animationId);

  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    renderer = null;
  }

  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    scene = null;
  }

  camera = null;
});
</script>
```

---

## Client-Only Pattern (Nuxt)

For browser-only components:

```vue
<template>
  <ClientOnly>
    <FluidCursor />
    <template #fallback>
      <div class="h-full w-full animate-pulse bg-muted" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
// No special imports needed for ClientOnly in Nuxt
</script>
```

---

## Event Handling Pattern

```vue
<script setup lang="ts">
const emit = defineEmits<{
  click: [event: MouseEvent];
  update: [value: string];
  change: [oldValue: string, newValue: string];
}>();

const handleClick = (event: MouseEvent) => {
  // Process event
  emit("click", event);
};

const updateValue = (newValue: string) => {
  const oldValue = currentValue.value;
  currentValue.value = newValue;
  emit("change", oldValue, newValue);
};
</script>
```

---

## Performance Optimization Patterns

### Computed Properties

```vue
<script setup lang="ts">
import { computed } from "vue";

// Cache expensive calculations
const filteredItems = computed(() => {
  return props.items.filter((item) => item.active);
});

const sortedAndFiltered = computed(() => {
  return filteredItems.value.sort((a, b) => a.priority - b.priority);
});
</script>
```

### Watch with Debounce

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";

const searchQuery = ref("");

const performSearch = useDebounceFn((query: string) => {
  // API call or heavy operation
}, 300);

watch(searchQuery, (newQuery) => {
  performSearch(newQuery);
});
</script>
```

### Conditional Rendering

```vue
<template>
  <!-- Use v-show for frequent toggles (keeps DOM) -->
  <div v-show="isVisible">Frequently toggled</div>

  <!-- Use v-if for rare toggles (removes DOM) -->
  <HeavyComponent v-if="shouldLoad" />
</template>
```

---

## Slot Patterns

```vue
<!-- Component definition -->
<template>
  <div class="wrapper">
    <slot name="header" :title="title">
      <!-- Default header -->
      <h2>{{ title }}</h2>
    </slot>

    <slot>
      <!-- Default content -->
    </slot>

    <slot name="footer" :actions="actions">
      <!-- Default footer -->
    </slot>
  </div>
</template>

<!-- Usage -->
<MyComponent title="Hello">
  <template #header="{ title }">
    <h1>Custom: {{ title }}</h1>
  </template>

  <p>Main content</p>

  <template #footer="{ actions }">
    <button v-for="action in actions" :key="action.id">
      {{ action.label }}
    </button>
  </template>
</MyComponent>
```

---

## Error Boundary Pattern

```vue
<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err;
  // Return false to prevent error from propagating
  return false;
});
</script>

<template>
  <div v-if="error" class="error-boundary">
    <p>Something went wrong: {{ error.message }}</p>
    <button @click="error = null">Retry</button>
  </div>
  <slot v-else />
</template>
```

---

## Summary: Key Conventions

1. **Always use interface-based props** with `defineProps<Props>()`
2. **Include explicit imports** for Vue composables
3. **Use `as const` objects** instead of enums
4. **Name constants with CAPS_SNAKE_CASE** and component prefix
5. **Clean up WebGL/Canvas resources** in `onUnmounted`
6. **Wrap browser-only components** in `<ClientOnly>` for Nuxt
7. **Use VueUse composables** for reactive utilities
8. **Leverage Motion-V** for declarative animations
9. **Follow CSS variable patterns** for theming
10. **Optimize performance** with computed properties and throttling

---

**Last Updated**: 2025-11-12
