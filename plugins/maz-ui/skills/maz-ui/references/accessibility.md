# Maz-UI Accessibility Guide

Complete guide to building accessible applications with Maz-UI, following WCAG 2.1 AA standards.

## Overview

Maz-UI components are designed with accessibility in mind, providing built-in ARIA attributes, keyboard navigation, and screen reader support. This guide covers best practices for creating inclusive applications.

**Standards Compliance**:
- ✅ WCAG 2.1 Level AA
- ✅ ARIA 1.2 patterns
- ✅ Keyboard navigation
- ✅ Screen reader compatible
- ✅ Color contrast compliant

---

## Keyboard Navigation

### Global Keyboard Shortcuts

All Maz-UI components support standard keyboard navigation:

| Key | Action |
|-----|--------|
| `Tab` | Move focus forward |
| `Shift + Tab` | Move focus backward |
| `Enter` | Activate button/link |
| `Space` | Toggle checkbox/switch |
| `Esc` | Close modal/dropdown |
| `Arrow Keys` | Navigate lists/tabs |

---

### Focus Management

#### Visible Focus Indicators

All Maz-UI components have visible focus states:

```vue
<template>
  <!-- ✅ BUILT-IN: Focus ring visible -->
  <MazBtn>Click Me</MazBtn>
  <MazInput label="Email" />
  <MazSelect :options="options" />
</template>
```

**Focus styles**:
```css
/* Maz-UI components automatically provide focus indicators */
.maz-btn:focus-visible {
  outline: 2px solid var(--maz-color-primary);
  outline-offset: 2px;
}
```

---

#### Focus Trapping

Modals and dialogs trap focus to prevent tabbing outside:

```vue
<template>
  <MazDialog v-model="isOpen" title="Confirm">
    <p>Are you sure?</p>

    <template #footer>
      <!-- ✅ Focus trapped within dialog -->
      <MazBtn @click="cancel">Cancel</MazBtn>
      <MazBtn @click="confirm" color="primary">Confirm</MazBtn>
    </template>
  </MazDialog>
</template>
```

**How it works**:
1. When dialog opens, focus moves to first focusable element
2. `Tab` cycles through focusable elements within dialog
3. `Esc` closes dialog and returns focus to trigger element

---

#### Programmatic Focus Management

```vue
<script setup lang="ts">
import { ref } from 'vue'

const inputRef = ref()
const showForm = ref(false)

const openForm = () => {
  showForm.value = true

  // Move focus to first input after opening
  nextTick(() => {
    inputRef.value?.$el.focus()
  })
}
</script>

<template>
  <MazBtn @click="openForm">
    Open Form
  </MazBtn>

  <div v-if="showForm">
    <MazInput
      ref="inputRef"
      label="Name"
      autofocus
    />
    <MazInput label="Email" />
  </div>
</template>
```

---

## Screen Reader Support

### ARIA Labels

#### Accessible Forms

```vue
<template>
  <!-- ✅ ACCESSIBLE: Label properly associated -->
  <MazInput
    id="email"
    v-model="email"
    label="Email Address"
    type="email"
    required
    :error="emailError"
  />
</template>
```

**Generated HTML**:
```html
<div class="maz-input">
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid="false"
    aria-describedby="email-error"
  />
  <span id="email-error" role="alert">
    <!-- Error message appears here -->
  </span>
</div>
```

---

#### Icon-Only Buttons

```vue
<template>
  <!-- ✅ ACCESSIBLE: aria-label for icon-only button -->
  <MazBtn
    aria-label="Delete item"
    icon-only
  >
    <MazIcon name="trash" />
  </MazBtn>

  <!-- ✅ ACCESSIBLE: Screen reader text -->
  <MazBtn>
    <MazIcon name="download" />
    <span class="sr-only">Download file</span>
  </MazBtn>
</template>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

---

#### Dynamic Content Announcements

```vue
<script setup lang="ts">
import { useToast } from 'maz-ui/composables'

const toast = useToast()

const saveData = async () => {
  try {
    await api.save()

    // ✅ ACCESSIBLE: Toast automatically announced to screen readers
    toast.success('Data saved successfully!')
  } catch (error) {
    toast.error('Failed to save data')
  }
}
</script>
```

**Generated ARIA**:
```html
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  Data saved successfully!
</div>
```

---

### ARIA Roles

#### Dialog Role

```vue
<template>
  <MazDialog
    v-model="isOpen"
    title="Delete Confirmation"
    role="alertdialog"
  >
    <p>This action cannot be undone.</p>

    <template #footer>
      <MazBtn @click="cancel">Cancel</MazBtn>
      <MazBtn @click="confirm" color="destructive">Delete</MazBtn>
    </template>
  </MazDialog>
</template>
```

**Generated ARIA**:
```html
<div
  role="alertdialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Delete Confirmation</h2>
  <div id="dialog-description">
    <p>This action cannot be undone.</p>
  </div>
</div>
```

---

#### Navigation Role

```vue
<template>
  <nav aria-label="Main navigation">
    <MazTabs v-model="activeTab">
      <MazTab label="Dashboard" value="dashboard" />
      <MazTab label="Profile" value="profile" />
      <MazTab label="Settings" value="settings" />
    </MazTabs>
  </nav>
</template>
```

**Generated ARIA**:
```html
<nav aria-label="Main navigation">
  <div role="tablist">
    <button
      role="tab"
      aria-selected="true"
      aria-controls="panel-dashboard"
      id="tab-dashboard"
    >
      Dashboard
    </button>
  </div>
  <div
    role="tabpanel"
    aria-labelledby="tab-dashboard"
    id="panel-dashboard"
  >
    <!-- Content -->
  </div>
</nav>
```

---

## Color Contrast

### WCAG AA Compliance

All Maz-UI theme presets meet WCAG 2.1 AA contrast ratios:

**Requirements**:
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**Built-in themes**:
```typescript
// All presets compliant
import { mazUi, ocean, pristine, obsidian } from '@maz-ui/themes/presets'

app.use(MazUi, {
  theme: {
    preset: mazUi // ✅ AA compliant
  }
})
```

---

### Custom Theme Validation

```typescript
import { definePreset, validateContrast } from '@maz-ui/themes'

const customTheme = definePreset({
  name: 'custom',
  colors: {
    light: {
      primary: '220 100% 50%', // Blue
      background: '0 0% 100%',  // White
    }
  }
})

// Validate contrast ratios
const contrastRatio = validateContrast(
  'hsl(220, 100%, 50%)', // Primary blue
  'hsl(0, 0%, 100%)'     // White background
)

console.log(contrastRatio) // 8.59:1 ✅ AAA compliant
```

---

### Color-Blind Friendly

Use semantic colors instead of relying solely on color:

```vue
<template>
  <!-- ❌ BAD: Color-only indication -->
  <MazBadge color="success">
    Active
  </MazBadge>

  <!-- ✅ GOOD: Icon + color -->
  <MazBadge color="success">
    <MazIcon name="check-circle" />
    Active
  </MazBadge>

  <!-- ✅ GOOD: Text + color -->
  <MazAlert color="warning">
    ⚠️ Warning: This action requires confirmation
  </MazAlert>
</template>
```

---

## Semantic HTML

### Headings Hierarchy

```vue
<template>
  <article>
    <!-- ✅ ACCESSIBLE: Proper heading hierarchy -->
    <h1>Page Title</h1>

    <section>
      <h2>Section Heading</h2>
      <MazCard>
        <template #title>
          <h3>Card Title</h3>
        </template>
        <p>Card content</p>
      </MazCard>
    </section>
  </article>
</template>
```

---

### Landmarks

```vue
<template>
  <!-- ✅ ACCESSIBLE: Landmark regions -->
  <header>
    <nav aria-label="Main navigation">
      <MazTabs>...</MazTabs>
    </nav>
  </header>

  <main>
    <h1>Dashboard</h1>
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading">Statistics</h2>
      <!-- Content -->
    </section>
  </main>

  <footer>
    <p>© 2024 Company Name</p>
  </footer>
</template>
```

---

### Form Structure

```vue
<template>
  <form @submit.prevent="handleSubmit" aria-labelledby="form-title">
    <h2 id="form-title">Contact Form</h2>

    <!-- ✅ ACCESSIBLE: Fieldset for grouped inputs -->
    <fieldset>
      <legend>Personal Information</legend>

      <MazInput
        id="name"
        v-model="form.name"
        label="Full Name"
        required
      />

      <MazInput
        id="email"
        v-model="form.email"
        label="Email"
        type="email"
        required
      />
    </fieldset>

    <fieldset>
      <legend>Preferences</legend>

      <MazCheckbox
        v-model="form.newsletter"
        label="Subscribe to newsletter"
      />
    </fieldset>

    <MazBtn type="submit">Submit</MazBtn>
  </form>
</template>
```

---

## Accessible Component Patterns

### Data Tables

```vue
<template>
  <MazTable
    :headers="headers"
    :rows="rows"
    caption="User list with roles and status"
  >
    <template #caption>
      <!-- ✅ ACCESSIBLE: Table caption for screen readers -->
      <caption>User list with roles and status</caption>
    </template>
  </MazTable>
</template>

<script setup lang="ts">
const headers = [
  { value: 'name', label: 'Name', sortable: true },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status' }
]
</script>
```

**Generated HTML**:
```html
<table>
  <caption>User list with roles and status</caption>
  <thead>
    <tr>
      <th scope="col">
        <button aria-label="Sort by Name">
          Name
        </button>
      </th>
    </tr>
  </thead>
  <tbody>...</tbody>
</table>
```

---

### Loading States

```vue
<template>
  <!-- ✅ ACCESSIBLE: Announces loading to screen readers -->
  <div aria-live="polite" aria-busy="true">
    <MazCircularProgressBar
      v-if="isLoading"
      aria-label="Loading data"
    />
    <div v-else>
      <!-- Content -->
    </div>
  </div>
</template>
```

---

### Error Messages

```vue
<script setup lang="ts">
const email = ref('')
const emailError = ref('')

const validateEmail = () => {
  if (!email.value.includes('@')) {
    emailError.value = 'Please enter a valid email address'
  } else {
    emailError.value = ''
  }
}
</script>

<template>
  <MazInput
    id="email"
    v-model="email"
    label="Email"
    type="email"
    :error="emailError"
    @blur="validateEmail"
    aria-describedby="email-error"
    :aria-invalid="!!emailError"
  />
</template>
```

**Generated ARIA**:
```html
<input
  id="email"
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Please enter a valid email address
</span>
```

---

## Testing Accessibility

### Automated Testing

#### Axe DevTools

```bash
# Install axe-core
npm install --save-dev @axe-core/vue
```

```typescript
// main.ts
import { createApp } from 'vue'
import axe from '@axe-core/vue'

const app = createApp(App)

if (process.env.NODE_ENV !== 'production') {
  axe(app, {
    config: {
      rules: [
        { id: 'color-contrast', enabled: true },
        { id: 'label', enabled: true }
      ]
    }
  })
}

app.mount('#app')
```

---

#### Vitest + axe-core

```typescript
// components/MazBtn.test.ts
import { mount } from '@vue/test-utils'
import { axe } from 'vitest-axe'
import MazBtn from 'maz-ui/components/MazBtn'

describe('MazBtn Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const wrapper = mount(MazBtn, {
      slots: {
        default: 'Click Me'
      }
    })

    const results = await axe(wrapper.element)
    expect(results).toHaveNoViolations()
  })

  it('should have accessible label for icon-only button', async () => {
    const wrapper = mount(MazBtn, {
      props: {
        'aria-label': 'Delete',
        iconOnly: true
      }
    })

    expect(wrapper.attributes('aria-label')).toBe('Delete')

    const results = await axe(wrapper.element)
    expect(results).toHaveNoViolations()
  })
})
```

---

### Manual Testing

#### Keyboard Navigation Test

1. **Tab through all interactive elements**:
   - Verify focus indicators are visible
   - Ensure logical tab order
   - Check no focus traps (except modals)

2. **Activate elements with keyboard**:
   - `Enter` on buttons
   - `Space` on checkboxes
   - `Arrow keys` on tabs/dropdowns

3. **Close modals with `Esc`**:
   - Focus returns to trigger element
   - No errors in console

---

#### Screen Reader Test

**macOS VoiceOver**:
```bash
# Enable VoiceOver
Cmd + F5

# Navigate
Control + Option + Arrow Keys

# Read current item
Control + Option + A
```

**NVDA (Windows)**:
```bash
# Start NVDA
Control + Alt + N

# Navigate
Arrow Keys

# Read current element
Insert + Up Arrow
```

**Checklist**:
- [ ] All interactive elements announced
- [ ] Form labels read correctly
- [ ] Error messages announced (role="alert")
- [ ] Loading states announced (aria-live)
- [ ] Modal opens/closes announced
- [ ] Toast notifications announced

---

#### Color Contrast Test

**Browser DevTools**:
```javascript
// Chrome DevTools Console
// Check contrast ratio
const primary = getComputedStyle(document.documentElement)
  .getPropertyValue('--maz-color-primary')

const bg = getComputedStyle(document.documentElement)
  .getPropertyValue('--maz-color-bg')

console.log(`Primary: ${primary}`)
console.log(`Background: ${bg}`)

// Use DevTools color picker to check contrast ratio
```

**Online Tools**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

---

## Accessibility Checklist

### Component-Level

- [ ] **Focus indicators** visible on all interactive elements
- [ ] **Keyboard navigation** works for all actions
- [ ] **ARIA labels** provided for icon-only buttons
- [ ] **Form labels** properly associated with inputs
- [ ] **Error messages** have `role="alert"`
- [ ] **Loading states** announced with `aria-live`
- [ ] **Modal focus** trapped when open
- [ ] **Color contrast** meets WCAG AA (4.5:1)

---

### Page-Level

- [ ] **Heading hierarchy** logical (h1 → h2 → h3)
- [ ] **Landmark regions** defined (header, main, footer, nav)
- [ ] **Skip links** provided for keyboard users
- [ ] **Page title** descriptive and unique
- [ ] **Language** declared (`<html lang="en">`)
- [ ] **Images** have alt text
- [ ] **Links** descriptive (avoid "click here")

---

### Application-Level

- [ ] **Automated testing** with axe-core
- [ ] **Manual keyboard testing** completed
- [ ] **Screen reader testing** (VoiceOver/NVDA)
- [ ] **Color contrast validation** passed
- [ ] **Mobile accessibility** verified (touch targets >44px)
- [ ] **Zoom support** up to 200% (no horizontal scroll)
- [ ] **Focus management** on route changes

---

## Common Accessibility Mistakes

### ❌ Missing Labels

```vue
<!-- ❌ BAD: No label for input -->
<MazInput v-model="email" placeholder="Email" />

<!-- ✅ GOOD: Explicit label -->
<MazInput
  v-model="email"
  label="Email Address"
  placeholder="you@example.com"
/>
```

---

### ❌ Poor Color Contrast

```vue
<!-- ❌ BAD: Low contrast text -->
<p style="color: #999; background: #FFF;">
  Low contrast text
</p>

<!-- ✅ GOOD: WCAG AA compliant -->
<p style="color: #333; background: #FFF;">
  High contrast text
</p>
```

---

### ❌ Icon-Only Button Without Label

```vue
<!-- ❌ BAD: No accessible label -->
<MazBtn>
  <MazIcon name="delete" />
</MazBtn>

<!-- ✅ GOOD: aria-label provided -->
<MazBtn aria-label="Delete item">
  <MazIcon name="delete" />
</MazBtn>
```

---

### ❌ Non-Semantic HTML

```vue
<!-- ❌ BAD: Div as button -->
<div @click="handleClick">
  Click me
</div>

<!-- ✅ GOOD: Semantic button -->
<MazBtn @click="handleClick">
  Click me
</MazBtn>
```

---

## Related Documentation

- **[Components Forms](./components-forms.md)** - Accessible form components
- **[Components Navigation](./components-navigation.md)** - Accessible navigation
- **[Theming](./theming.md)** - Color contrast in themes
- **[Troubleshooting](./troubleshooting.md)** - Accessibility errors

---

## External Resources

- **[WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)** - Quick reference guide
- **[ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)** - ARIA patterns
- **[WebAIM](https://webaim.org/)** - Accessibility resources
- **[axe DevTools](https://www.deque.com/axe/devtools/)** - Browser extension
- **[Color Contrast Checker](https://webaim.org/resources/contrastchecker/)** - Contrast validation

---

**Accessibility Version**: WCAG 2.1 AA
**Last Updated**: 2025-12-14

::: tip Screen Reader Testing
Always test with real screen readers (VoiceOver, NVDA) in addition to automated tools. Screen readers catch context issues that automated tools miss.
:::
