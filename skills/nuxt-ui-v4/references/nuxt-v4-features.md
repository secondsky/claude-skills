# Nuxt v4 Features & Integration

## Overview

This guide covers Nuxt v4-specific features and how they integrate with Nuxt UI v4.

## Key Nuxt v4 Features

### 1. **Improved Performance**
- Faster build times with optimized Vite integration
- Enhanced hot module replacement (HMR)
- Better tree-shaking for smaller bundles

### 2. **Enhanced Type Safety**
- Automatic type generation with `nuxt prepare`
- Better TypeScript inference
- Type-safe component props

### 3. **Module System Updates**
- Simplified module registration
- Better module compatibility
- Enhanced plugin system

## Nuxt UI v4 Integration

### Installation

```bash
npm install @nuxt/ui
```

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  compatibilityDate: '2024-11-01'
})
```

### Auto-imports

Nuxt v4 auto-imports all Nuxt UI components and composables:
- Components: `UButton`, `UCard`, `UInput`, etc.
- Composables: `useToast`, `useColorMode`, etc.

## Best Practices

1. **Use TypeScript**: Full type safety with Nuxt v4
2. **Run `nuxt prepare`**: Generate types before development
3. **Leverage Auto-imports**: No need to manually import components
4. **Use `UApp` Wrapper**: Required for Nuxt UI to work properly
