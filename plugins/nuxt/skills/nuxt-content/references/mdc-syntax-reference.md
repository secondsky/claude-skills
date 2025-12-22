# MDC Syntax Quick Reference

## Basic Component Syntax

```mdc
::component-name
Default slot content
::
```

**Example**:
```mdc
::alert
This is an alert!
::
```

---

## Named Slots

```mdc
::hero
Main content
#description
Description content
#actions
Action buttons
::
```

---

## Component Props

**Inline Props**:
```mdc
::alert{type="warning" icon="i-lucide-alert"}
Warning message
::
```

**YAML Props**:
```mdc
::card
---
title: Card Title
description: Card description
icon: IconNuxt
link: /docs
---
::
```

---

## Inline Components

```mdc
:badge[New]{color="green"}
:icon{name="i-lucide-star"}
```

---

## Attributes

```md
# Heading {#custom-id}
Paragraph {.text-lg .font-bold}
[Link](/url){target="_blank"}
Combined {#id .class style="color: blue;"}
```

---

## Data Binding

```md
---
title: My Post
author: John Doe
count: 42
---

# {{ $doc.title }}
By {{ $doc.author }}
Count: {{ $doc.count }}
```

---

## Common Components

### Alert
```mdc
::alert{type="info"}
Info message
::

::alert{type="warning"}
Warning message
::

::alert{type="error"}
Error message
::
```

### Callout
```mdc
::callout
Important information
::
```

### Code Group
```mdc
::code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({})
```
```bash [Terminal]
npm run dev
```
::
```

### Tabs
```mdc
::tabs
#tab1
Content for tab 1
#tab2
Content for tab 2
::
```

---

## Prose Components Override

Create in `components/content/`:

- `ProseA.vue` - Links
- `ProseCode.vue` - Inline code
- `ProsePre.vue` - Code blocks
- `ProseH1.vue` through `ProseH6.vue` - Headings
- `ProseP.vue` - Paragraphs
- `ProseImg.vue` - Images
- `ProseUl.vue`, `ProseOl.vue`, `ProseLi.vue` - Lists

**Example** (`components/content/ProseA.vue`):
```vue
<template>
  <a :href="href" class="custom-link">
    <slot />
  </a>
</template>

<script setup>
defineProps({ href: String })
</script>
```

---

## Slot Unwrapping

```vue
<!-- components/content/Callout.vue -->
<template>
  <div class="callout">
    <slot mdc-unwrap="p" />
  </div>
</template>
```

Removes wrapping `<p>` tags from slot content.
