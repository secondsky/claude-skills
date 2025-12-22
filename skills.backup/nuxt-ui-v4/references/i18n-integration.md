# Internationalization (i18n) Integration with Nuxt UI v4

Complete guide for implementing multilingual support in Nuxt UI v4 applications using `@nuxtjs/i18n`.

---

## Overview

Nuxt UI v4 has built-in internationalization support for 50+ languages, providing automatic localization for:
- Component labels and messages
- Form validation messages
- Date and time formatting
- Number formatting
- Accessibility announcements

---

## Setup

### Installation

```bash
bun add @nuxtjs/i18n
```

### Configuration

**nuxt.config.ts:**
```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'de', name: 'Deutsch', file: 'de.json' },
      { code: 'ja', name: '日本語', file: 'ja.json' }
    ],
    defaultLocale: 'en',
    lazy: true,
    langDir: 'locales/',
    strategy: 'prefix_except_default', // URLs: /fr/about, /about (en)
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
```

---

## Supported Languages

Nuxt UI v4 includes built-in translations for **50+ languages**:

**European Languages:**
- Bulgarian (bg), Czech (cs), Danish (da), German (de)
- Greek (el), English (en), Spanish (es), Estonian (et)
- Finnish (fi), French (fr), Croatian (hr), Hungarian (hu)
- Italian (it), Lithuanian (lt), Latvian (lv), Dutch (nl)
- Norwegian (no, nb), Polish (pl), Portuguese (pt, pt-BR)
- Romanian (ro), Russian (ru), Slovak (sk), Slovenian (sl)
- Swedish (sv), Ukrainian (uk)

**Middle Eastern & Asian Languages:**
- Arabic (ar), Persian (fa), Hebrew (he)
- Hindi (hi), Japanese (ja), Korean (ko)
- Chinese Simplified (zh-Hans), Chinese Traditional (zh-Hant)
- Thai (th), Turkish (tr), Vietnamese (vi)

**Other Languages:**
- Azerbaijani (az), Bengali (bn), Catalan (ca)
- Indonesian (id), Macedonian (mk), Malay (ms)
- Urdu (ur), Uzbek (uz)

All component labels, validation messages, and accessibility announcements automatically use the active locale.

---

## Automatic Component Localization

### Form Components

Form validation messages automatically adapt to the current locale:

```vue
<template>
  <UForm :schema="schema" @submit="onSubmit">
    <UFormField name="email" label="Email">
      <UInput type="email" />
    </UFormField>

    <UFormField name="age" label="Age">
      <UInput type="number" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(), // "Invalid email" → "E-mail invalide" (fr)
  age: z.number().min(18)    // "Must be at least 18" → "Debe ser al menos 18" (es)
})
</script>
```

**Localized Validation Messages:**
- **English**: "Invalid email", "Must be at least 18"
- **French**: "E-mail invalide", "Doit être au moins 18"
- **Spanish**: "Correo electrónico no válido", "Debe ser al menos 18"
- **German**: "Ungültige E-Mail", "Muss mindestens 18 sein"

### Button and Alert Components

```vue
<template>
  <!-- Current locale: French -->
  <UButton loading>Loading...</UButton>
  <!-- Accessibility announcement: "Chargement en cours" -->

  <UAlert
    title="Success"
    description="Operation completed"
    icon="i-lucide-check-circle"
  />
  <!-- Screen readers announce in current locale -->
</template>
```

### Date and Time Components

```vue
<template>
  <UFormField name="birthdate" label="Birthdate">
    <UInput type="date" />
    <!-- Date picker uses locale-specific format:
         en: MM/DD/YYYY
         fr: DD/MM/YYYY
         ja: YYYY/MM/DD -->
  </UFormField>
</template>
```

---

## Custom Translations

Create locale files for custom content:

**locales/en.json:**
```json
{
  "welcome": "Welcome to our application",
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "form": {
    "submit": "Submit",
    "cancel": "Cancel",
    "required": "This field is required"
  }
}
```

**locales/fr.json:**
```json
{
  "welcome": "Bienvenue dans notre application",
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  },
  "form": {
    "submit": "Soumettre",
    "cancel": "Annuler",
    "required": "Ce champ est obligatoire"
  }
}
```

**Usage in Components:**
```vue
<template>
  <div>
    <h1>{{ $t('welcome') }}</h1>

    <UButton>{{ $t('form.submit') }}</UButton>
    <UButton variant="ghost">{{ $t('form.cancel') }}</UButton>

    <nav>
      <UButton
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
      >
        {{ $t(`nav.${item.key}`) }}
      </UButton>
    </nav>
  </div>
</template>

<script setup lang="ts">
const navItems = [
  { key: 'home', to: '/' },
  { key: 'about', to: '/about' },
  { key: 'contact', to: '/contact' }
]
</script>
```

---

## Language Switcher Component

```vue
<template>
  <UDropdownMenu>
    <UButton
      :icon="`i-circle-flags-${currentLocale.flag}`"
      trailing-icon="i-lucide-chevron-down"
      variant="outline"
    >
      {{ currentLocale.name }}
    </UButton>

    <template #content>
      <UDropdownMenuItem
        v-for="locale in availableLocales"
        :key="locale.code"
        :active="locale.code === currentLocale.code"
        @click="setLocale(locale.code)"
      >
        <template #leading>
          <UIcon :name="`i-circle-flags-${locale.flag}`" />
        </template>
        {{ locale.name }}
      </UDropdownMenuItem>
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() => [
  { code: 'en', name: 'English', flag: 'us' },
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'de', name: 'Deutsch', flag: 'de' },
  { code: 'ja', name: '日本語', flag: 'jp' }
])

const currentLocale = computed(() =>
  availableLocales.value.find(l => l.code === locale.value) || availableLocales.value[0]
)
</script>
```

---

## Localized Form Validation

### Using Zod with Custom Messages

```vue
<script setup lang="ts">
import { z } from 'zod'

const { t } = useI18n()

const schema = computed(() => z.object({
  username: z.string()
    .min(3, t('validation.username.min'))
    .max(20, t('validation.username.max')),
  email: z.string()
    .email(t('validation.email.invalid')),
  password: z.string()
    .min(8, t('validation.password.min'))
    .regex(/[A-Z]/, t('validation.password.uppercase'))
    .regex(/[0-9]/, t('validation.password.number')),
  terms: z.boolean()
    .refine(val => val === true, t('validation.terms.required'))
}))
</script>
```

**locales/en.json:**
```json
{
  "validation": {
    "username": {
      "min": "Username must be at least 3 characters",
      "max": "Username must not exceed 20 characters"
    },
    "email": {
      "invalid": "Please enter a valid email address"
    },
    "password": {
      "min": "Password must be at least 8 characters",
      "uppercase": "Password must contain an uppercase letter",
      "number": "Password must contain a number"
    },
    "terms": {
      "required": "You must accept the terms and conditions"
    }
  }
}
```

---

## Pluralization

Handle singular/plural forms in different languages:

**locales/en.json:**
```json
{
  "items": "no items | 1 item | {count} items"
}
```

**locales/fr.json:**
```json
{
  "items": "aucun élément | 1 élément | {count} éléments"
}
```

**Usage:**
```vue
<template>
  <p>{{ $t('items', itemCount) }}</p>
  <!-- English: 0 → "no items", 1 → "1 item", 5 → "5 items" -->
  <!-- French: 0 → "aucun élément", 1 → "1 élément", 5 → "5 éléments" -->
</template>
```

---

## Number and Currency Formatting

```vue
<script setup lang="ts">
const { n } = useI18n()

const price = 1234.56
</script>

<template>
  <div>
    <!-- Number formatting -->
    <p>{{ n(price, 'decimal') }}</p>
    <!-- en: 1,234.56 -->
    <!-- fr: 1 234,56 -->
    <!-- de: 1.234,56 -->

    <!-- Currency formatting -->
    <p>{{ n(price, 'currency') }}</p>
    <!-- en-US: $1,234.56 -->
    <!-- fr-FR: 1 234,56 € -->
    <!-- ja-JP: ¥1,235 -->
  </div>
</template>
```

**Configure number formats in nuxt.config.ts:**
```typescript
i18n: {
  numberFormats: {
    en: {
      currency: {
        style: 'currency',
        currency: 'USD'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2
      }
    },
    fr: {
      currency: {
        style: 'currency',
        currency: 'EUR'
      }
    },
    ja: {
      currency: {
        style: 'currency',
        currency: 'JPY'
      }
    }
  }
}
```

---

## Date Formatting

```vue
<script setup lang="ts">
const { d } = useI18n()

const date = new Date()
</script>

<template>
  <div>
    <p>{{ d(date, 'short') }}</p>
    <!-- en: 1/15/2025 -->
    <!-- fr: 15/01/2025 -->
    <!-- ja: 2025/1/15 -->

    <p>{{ d(date, 'long') }}</p>
    <!-- en: January 15, 2025 -->
    <!-- fr: 15 janvier 2025 -->
    <!-- ja: 2025年1月15日 -->
  </div>
</template>
```

---

## Right-to-Left (RTL) Support

For Arabic, Hebrew, and other RTL languages:

```vue
<template>
  <UApp :dir="localeDir">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
const { locale } = useI18n()

const localeDir = computed(() => {
  const rtlLocales = ['ar', 'he', 'fa', 'ur']
  return rtlLocales.includes(locale.value) ? 'rtl' : 'ltr'
})
</script>
```

Nuxt UI components automatically adapt their layout for RTL:
- Icons flip position (leading ↔ trailing)
- Text alignment adjusts
- Spacing and padding mirror

---

## Best Practices

### 1. Always Use Computed Schemas
```typescript
// ✅ GOOD: Schema updates when locale changes
const schema = computed(() => z.object({
  email: z.string().email(t('validation.email'))
}))

// ❌ BAD: Schema frozen at component mount
const schema = z.object({
  email: z.string().email(t('validation.email'))
})
```

### 2. Lazy Load Locale Files
```typescript
i18n: {
  lazy: true,
  langDir: 'locales/'
}
```
This loads translation files only when needed, improving initial load time.

### 3. Use Locale-Specific Routes
```typescript
i18n: {
  strategy: 'prefix_except_default'
}
```
- Default locale (en): `/about`
- Other locales: `/fr/about`, `/es/about`

### 4. Detect Browser Language
```typescript
i18n: {
  detectBrowserLanguage: {
    useCookie: true,
    redirectOn: 'root'
  }
}
```
Automatically redirects users to their preferred language on first visit.

### 5. Provide Language Persistence
Store language preference in cookie/localStorage so users don't need to re-select on every visit.

---

## Common Patterns

### Localized Navigation

```vue
<template>
  <UHeader>
    <template #logo>
      <NuxtLink to="/">{{ $t('site.name') }}</NuxtLink>
    </template>

    <template #center>
      <UNavigationMenu>
        <UNavigationMenuItem
          v-for="item in navigation"
          :key="item.to"
          :to="localePath(item.to)"
        >
          {{ $t(item.label) }}
        </UNavigationMenuItem>
      </UNavigationMenu>
    </template>

    <template #right>
      <LanguageSwitcher />
    </template>
  </UHeader>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

const navigation = [
  { to: '/', label: 'nav.home' },
  { to: '/products', label: 'nav.products' },
  { to: '/about', label: 'nav.about' }
]
</script>
```

### Localized SEO

```vue
<script setup lang="ts">
const { t, locale } = useI18n()

useHead({
  htmlAttrs: {
    lang: locale.value
  },
  title: t('seo.title'),
  meta: [
    { name: 'description', content: t('seo.description') },
    { property: 'og:title', content: t('seo.title') },
    { property: 'og:description', content: t('seo.description') }
  ]
})
</script>
```

---

## Troubleshooting

### Components Not Localizing

**Problem**: Form validation messages remain in English despite changing locale.

**Solution**: Ensure Nuxt UI module is loaded BEFORE i18n module:
```typescript
modules: ['@nuxt/ui', '@nuxtjs/i18n']  // ✅ Correct order
```

### Missing Translations

**Problem**: Some component labels show translation keys instead of text.

**Solution**: Nuxt UI provides built-in translations for 50+ languages. If missing, create custom translation file and submit PR to Nuxt UI repository.

### Locale Not Persisting

**Problem**: Selected language resets on page reload.

**Solution**: Enable cookie persistence:
```typescript
i18n: {
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_locale'
  }
}
```

---

## Resources

- **Nuxt i18n Module**: https://i18n.nuxtjs.org/
- **Nuxt UI i18n Support**: https://ui.nuxt.com/getting-started/theming#i18n
- **Supported Languages**: 50+ languages built-in
- **Custom Translations**: Submit PRs to https://github.com/nuxt/ui

---

**Last Updated**: 2025-01-09
**Nuxt UI Version**: 4.0.0
**@nuxtjs/i18n Version**: 9.0.0+
