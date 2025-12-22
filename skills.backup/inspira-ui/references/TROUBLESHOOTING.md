# Inspira UI Troubleshooting Guide

Common issues and solutions when working with Inspira UI components.

## Issue 1: TailwindCSS v4 Not Working

**Symptoms**:
- Components not styling correctly
- CSS variables undefined
- Tailwind classes not applied

**Solution**:
1. Verify TailwindCSS v4 is installed: `bun add tailwindcss@next`
2. Check `@import "tailwindcss"` is in your CSS
3. Ensure CSS variables are defined in `:root` and `.dark`
4. Verify `@theme inline` block is present
5. Check that `@layer base` styles are applied

**Verification**:
```bash
grep -r "@import \"tailwindcss\"" src/assets/
grep -r "var(--background)" src/assets/
```

---

## Issue 2: Motion-V Animations Not Working

**Symptoms**:
- Motion components render but don't animate
- No transitions or movements
- Static content

**Solution**:
1. Install motion-v: `bun add motion-v`
2. Follow [Motion-V setup guide](https://motion.dev/docs/vue)
3. For Nuxt, ensure proper plugin configuration
4. Import Motion component: `import { Motion } from "motion-v"`
5. Verify you're using correct props (`:initial`, `:animate`, `:transition`)

**Example Fix**:
```vue
<script setup lang="ts">
// Correct import
import { Motion } from "motion-v";
</script>

<template>
  <!-- Correct usage -->
  <Motion
    :initial="{ opacity: 0 }"
    :animate="{ opacity: 1 }"
    :transition="{ duration: 0.5 }"
  >
    Content
  </Motion>
</template>
```

---

## Issue 3: Three.js Components Not Rendering

**Symptoms**:
- 3D components (Globe, Cosmic Portal, 3D Carousel) show blank
- Canvas element present but empty
- WebGL context errors

**Solution**:
1. Install Three.js: `bun add three @types/three`
2. Wrap in `<ClientOnly>` for Nuxt
3. Check browser console for WebGL errors
4. Verify canvas element is rendering
5. Ensure proper cleanup in `onUnmounted`

**Example**:
```vue
<template>
  <ClientOnly>
    <GithubGlobe :markers="markers" />
  </ClientOnly>
</template>

<script setup lang="ts">
import { onUnmounted } from "vue";

onUnmounted(() => {
  // Clean up WebGL context if needed
});
</script>
```

---

## Issue 4: OGL Components Not Working

**Symptoms**:
- OGL-based components (Fluid Cursor, Liquid Background) not displaying
- Shader compilation errors
- WebGL context issues

**Solution**:
1. Install OGL: `bun add ogl`
2. Ensure WebGL support in browser
3. Wrap in `<ClientOnly>` for SSR
4. Check for shader compilation errors in console
5. Verify proper disposal of resources

**Debug**:
```javascript
// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);
```

---

## Issue 5: Props Type Errors

**Symptoms**:
- TypeScript errors with component props
- Runtime type mismatches
- Default values not applied

**Solution**:
1. Use interface-based props, not object syntax
2. Use `withDefaults()` for default values
3. Ensure explicit imports for types
4. Check props are correctly typed in parent component

**Correct Pattern**:
```vue
<script setup lang="ts">
// DO THIS
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

// DON'T DO THIS
// const props = defineProps({
//   title: { type: String, required: true },
// });
</script>
```

---

## Issue 6: Icons Not Showing

**Symptoms**:
- Icon components render empty
- Missing icon SVGs
- Icon library not found

**Solution**:
1. Install Iconify Vue: Follow [Iconify guide](https://iconify.design/docs/icon-components/vue/)
2. Or replace `<Icon>` with your preferred icon library
3. Or use SVG icons directly
4. Check icon name format (e.g., `"mdi:home"`)

**Alternative**:
```vue
<!-- Direct SVG -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="..." />
</svg>

<!-- Or use another library -->
<LucideIcon name="home" />
```

---

## Issue 7: CSS Variables Not Applied

**Symptoms**:
- Colors or sizing not working as expected
- Default browser styles showing
- Dark mode not switching

**Solution**:
1. Verify `:root` CSS variables are defined
2. Check `.dark` variants are set up
3. Ensure `@theme inline` block includes all variables
4. Use `var(--variable-name)` syntax or Tailwind classes
5. Check for typos in variable names

**Debug**:
```javascript
// In browser console
getComputedStyle(document.documentElement).getPropertyValue('--background');
```

---

## Issue 8: Component Dependencies Missing

**Symptoms**:
- Component imports failing
- Features not working
- Runtime errors about missing modules

**Solution**:
1. Check component documentation for specific dependencies
2. Install required packages (Three.js, OGL, GSAP, etc.)
3. Verify peer dependencies are satisfied
4. Check for component-specific setup requirements
5. See [components-list.md](components-list.md) for dependency matrix

**Common Dependencies**:
```bash
# 3D components
bun add three @types/three

# WebGL shaders
bun add ogl

# Advanced animations
bun add gsap

# Confetti
bun add canvas-confetti
```

---

## Issue 9: Accessibility Bug - Destructive Colors

**Symptoms**:
- Text on destructive backgrounds is invisible
- Poor contrast on error states
- Red text on red background

**Root Cause**: Original Inspira UI docs set `--destructive-foreground` to same color as `--destructive`.

**Solution**: Use the corrected CSS variables from this skill:

```css
:root {
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0); /* CORRECTED - was same as destructive */
}

.dark {
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
}
```

---

## Issue 10: SSR/Hydration Mismatches (Nuxt)

**Symptoms**:
- Hydration warnings in console
- Content flashing or jumping
- Different rendering on server vs client

**Solution**:
1. Wrap browser-only components in `<ClientOnly>`
2. Check for `window` or `document` access in setup
3. Use `onMounted` for browser-specific code
4. Verify no random values in SSR

**Pattern**:
```vue
<template>
  <ClientOnly>
    <FluidCursor />
    <template #fallback>
      <!-- Optional placeholder during SSR -->
      <div class="cursor-placeholder" />
    </template>
  </ClientOnly>
</template>
```

---

## Issue 11: Animation Performance Issues

**Symptoms**:
- Choppy animations
- High CPU/GPU usage
- Frame drops

**Solution**:
1. Use `transform` and `opacity` for animations (GPU-accelerated)
2. Avoid animating `width`, `height`, `top`, `left`
3. Reduce particle counts for particle effects
4. Implement proper cleanup for WebGL resources
5. Use `will-change` sparingly

**Performance Pattern**:
```vue
<script setup lang="ts">
import { onUnmounted } from "vue";

// Store references for cleanup
let animationFrame: number;
let renderer: any;

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (renderer) renderer.dispose();
});
</script>
```

---

## Issue 12: Build/Bundle Size Issues

**Symptoms**:
- Large bundle size
- Slow builds
- Tree-shaking not working

**Solution**:
1. Only copy components you need
2. Import specific utilities, not entire libraries
3. Check for duplicate dependencies
4. Use dynamic imports for heavy components

**Optimized Import**:
```typescript
// Specific imports (smaller bundle)
import { useWindowSize } from "@vueuse/core";

// Not entire library
// import * as VueUse from "@vueuse/core";
```

---

## Issue 13: Nuxt Auto-Import Conflicts

**Symptoms**:
- Duplicate identifier errors
- Vue composables not working
- Import conflicts

**Solution**:
1. Add explicit imports even with auto-imports enabled
2. Check nuxt.config for auto-import settings
3. Verify no naming conflicts with local composables

**Safe Pattern**:
```vue
<script setup lang="ts">
// Always include explicit imports for compatibility
import { ref, onMounted, computed } from "vue";
import { useWindowSize } from "@vueuse/core";
</script>
```

---

## Quick Diagnostic Commands

```bash
# Check package versions
bun pm ls | grep -E "tailwind|motion|three|ogl"

# Verify CSS imports
grep -r "@import" src/assets/

# Check for missing dependencies
bun install --dry-run

# Run setup verification
./scripts/verify-setup.sh
```

---

## Getting More Help

- **Official Docs**: https://inspira-ui.com/docs
- **GitHub Issues**: https://github.com/unovue/inspira-ui/issues
- **Discord Community**: https://discord.gg/Xbh5DwJRc9
- **Component Gallery**: https://inspira-ui.com/components

---

**Last Updated**: 2025-11-12
