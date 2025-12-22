# Layout Components Reference

**Components**: Container, Card, Divider
**Purpose**: Complete reference for layout and spacing components

---

## Container Component

### Basic Container

```vue
<template>
  <UContainer>
    <h1>Page Title</h1>
    <p>Content with consistent max-width and padding.</p>
  </UContainer>
</template>
```

The Container component provides:
- **Max-width**: Responsive max-width based on breakpoints
- **Padding**: Consistent horizontal padding
- **Centering**: Automatically centers content

### Container Sizes

```vue
<template>
  <div class="space-y-8">
    <UContainer size="xs">
      Extra small container (max-width: 640px)
    </UContainer>

    <UContainer size="sm">
      Small container (max-width: 768px)
    </UContainer>

    <UContainer size="md">
      Medium container (max-width: 1024px) - Default
    </UContainer>

    <UContainer size="lg">
      Large container (max-width: 1280px)
    </UContainer>

    <UContainer size="xl">
      Extra large container (max-width: 1536px)
    </UContainer>
  </div>
</template>
```

### Full-width Container

```vue
<template>
  <UContainer :padded="false" class="max-w-none">
    Full-width content without padding
  </UContainer>
</template>
```

### Container with Custom Padding

```vue
<template>
  <UContainer class="py-12">
    Content with custom vertical padding
  </UContainer>
</template>
```

---

## Card Component (Detailed)

### Card Anatomy

```vue
<template>
  <UCard>
    <template #header>
      <!-- Optional header slot -->
    </template>

    <!-- Default slot: Main content -->
    <p>Card body content</p>

    <template #footer>
      <!-- Optional footer slot -->
    </template>
  </UCard>
</template>
```

### Card Variants

```vue
<template>
  <div class="grid grid-cols-2 gap-4">
    <UCard variant="solid">
      Solid variant - Filled background
    </UCard>

    <UCard variant="outline">
      Outline variant - Border only
    </UCard>

    <UCard variant="soft">
      Soft variant - Subtle background
    </UCard>

    <UCard variant="subtle">
      Subtle variant - Very subtle background
    </UCard>
  </div>
</template>
```

### Card with Padding Control

```vue
<template>
  <!-- No padding -->
  <UCard :ui="{ body: { padding: '' } }">
    <img src="/image.jpg" alt="Full bleed image" class="w-full" />
  </UCard>

  <!-- Custom padding -->
  <UCard :ui="{ body: { padding: 'p-8' } }">
    Large padding content
  </UCard>
</template>
```

### Clickable Card

```vue
<template>
  <UCard
    as="a"
    href="/article/123"
    class="hover:shadow-lg transition-shadow cursor-pointer"
  >
    <h3 class="font-semibold">Article Title</h3>
    <p class="text-gray-600">Article preview...</p>
  </UCard>
</template>
```

### Card with Image

```vue
<template>
  <UCard :ui="{ body: { padding: '' } }">
    <img
      src="/cover.jpg"
      alt="Cover"
      class="w-full h-48 object-cover"
    />
    <div class="p-6">
      <h3 class="text-lg font-semibold">Card Title</h3>
      <p class="text-gray-600 mt-2">Card description...</p>
    </div>
  </UCard>
</template>
```

---

## Divider Component

### Basic Divider

```vue
<template>
  <div>
    <p>Content above</p>
    <UDivider />
    <p>Content below</p>
  </div>
</template>
```

### Divider with Label

```vue
<template>
  <div>
    <p>Section 1</p>
    <UDivider label="OR" />
    <p>Section 2</p>
  </div>
</template>
```

### Vertical Divider

```vue
<template>
  <div class="flex items-center gap-4">
    <UButton>Button 1</UButton>
    <UDivider orientation="vertical" class="h-8" />
    <UButton>Button 2</UButton>
  </div>
</template>
```

### Divider Variants

```vue
<template>
  <div class="space-y-4">
    <UDivider variant="solid" />
    <UDivider variant="dashed" />
    <UDivider variant="dotted" />
  </div>
</template>
```

---

## Common Layout Patterns

### Page Layout with Container

```vue
<template>
  <div>
    <!-- Full-width header -->
    <header class="bg-white dark:bg-gray-900 border-b">
      <UContainer class="py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">Site Title</h1>
          <nav><!-- Navigation --></nav>
        </div>
      </UContainer>
    </header>

    <!-- Main content with container -->
    <main>
      <UContainer class="py-12">
        <h2 class="text-3xl font-bold mb-6">Page Title</h2>
        <p>Page content...</p>
      </UContainer>
    </main>

    <!-- Full-width footer -->
    <footer class="bg-gray-50 dark:bg-gray-800 border-t">
      <UContainer class="py-8">
        <p class="text-sm text-gray-600">© 2024 Company</p>
      </UContainer>
    </footer>
  </div>
</template>
```

### Two-Column Layout

```vue
<template>
  <UContainer>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Sidebar -->
      <aside class="lg:col-span-1">
        <UCard>
          <h3 class="font-semibold mb-4">Sidebar</h3>
          <nav class="space-y-2">
            <!-- Navigation items -->
          </nav>
        </UCard>
      </aside>

      <!-- Main content -->
      <main class="lg:col-span-2">
        <UCard>
          <h1 class="text-2xl font-bold mb-4">Main Content</h1>
          <p>Content goes here...</p>
        </UCard>
      </main>
    </div>
  </UContainer>
</template>
```

### Card Grid

```vue
<template>
  <UContainer>
    <h2 class="text-2xl font-bold mb-6">Featured Items</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard v-for="item in items" :key="item.id">
        <template #header>
          <img
            :src="item.image"
            :alt="item.title"
            class="w-full h-48 object-cover -m-6 mb-0"
          />
        </template>

        <h3 class="font-semibold text-lg">{{ item.title }}</h3>
        <p class="text-gray-600 mt-2">{{ item.description }}</p>

        <template #footer>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">{{ item.date }}</span>
            <UButton size="sm" variant="ghost">Read More</UButton>
          </div>
        </template>
      </UCard>
    </div>
  </UContainer>
</template>
```

### Dashboard Layout

```vue
<template>
  <UContainer size="xl" class="py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <p class="text-gray-600">Welcome back, John</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <UCard v-for="stat in stats" :key="stat.label">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">{{ stat.label }}</p>
            <p class="text-2xl font-bold mt-1">{{ stat.value }}</p>
          </div>
          <UIcon :name="stat.icon" class="w-8 h-8 text-primary" />
        </div>
      </UCard>
    </div>

    <UDivider class="my-8" />

    <!-- Main content grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <UCard>
        <template #header>
          <h3 class="font-semibold">Recent Activity</h3>
        </template>
        <!-- Activity list -->
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold">Quick Actions</h3>
        </template>
        <!-- Actions -->
      </UCard>
    </div>
  </UContainer>
</template>
```

### Masonry Layout

```vue
<template>
  <UContainer>
    <div class="columns-1 md:columns-2 lg:columns-3 gap-6">
      <UCard
        v-for="item in items"
        :key="item.id"
        class="mb-6 break-inside-avoid"
      >
        <img :src="item.image" class="w-full" />
        <div class="p-4">
          <h3 class="font-semibold">{{ item.title }}</h3>
          <p class="text-sm text-gray-600 mt-2">{{ item.description }}</p>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
```

### Sticky Sidebar Layout

```vue
<template>
  <UContainer>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Sticky sidebar -->
      <aside class="lg:col-span-1">
        <div class="sticky top-4">
          <UCard>
            <h3 class="font-semibold mb-4">Table of Contents</h3>
            <nav class="space-y-2">
              <a
                v-for="heading in headings"
                :key="heading.id"
                :href="`#${heading.id}`"
                class="block text-sm hover:text-primary"
              >
                {{ heading.text }}
              </a>
            </nav>
          </UCard>
        </div>
      </aside>

      <!-- Scrollable main content -->
      <main class="lg:col-span-3">
        <UCard>
          <!-- Long content -->
        </UCard>
      </main>
    </div>
  </UContainer>
</template>
```

---

## Responsive Patterns

### Mobile-First Approach

```vue
<template>
  <UContainer>
    <!-- Stack on mobile, grid on desktop -->
    <div class="flex flex-col lg:flex-row gap-6">
      <UCard class="flex-1">Content 1</UCard>
      <UCard class="flex-1">Content 2</UCard>
      <UCard class="flex-1">Content 3</UCard>
    </div>
  </UContainer>
</template>
```

### Breakpoint-Specific Layouts

```vue
<template>
  <UContainer>
    <div class="
      grid
      grid-cols-1        /* Mobile: 1 column */
      sm:grid-cols-2     /* Small: 2 columns */
      md:grid-cols-3     /* Medium: 3 columns */
      lg:grid-cols-4     /* Large: 4 columns */
      gap-4
    ">
      <UCard v-for="i in 8" :key="i">Item {{ i }}</UCard>
    </div>
  </UContainer>
</template>
```

---

## Reference

- **Templates**: See `templates/components/ui-card-layouts.vue`
- **Responsive Patterns**: See `responsive-patterns.md`
