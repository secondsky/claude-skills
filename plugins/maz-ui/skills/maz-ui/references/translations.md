# Maz-UI Translations & i18n Guide

Complete guide to internationalization (i18n) in Maz-UI components.

## Built-in Language Support

Maz-UI includes **8 built-in languages** ready to use out of the box:

| Language | Code | Status |
|----------|------|--------|
| 🇺🇸 English | `en` | Complete (default) |
| 🇫🇷 French | `fr` | Complete |
| 🇪🇸 Spanish | `es` | Complete |
| 🇩🇪 German | `de` | Complete |
| 🇮🇹 Italian | `it` | Complete |
| 🇵🇹 Portuguese | `pt` | Complete |
| 🇯🇵 Japanese | `ja` | Complete |
| 🇨🇳 Chinese | `zh-CN` | Complete |

## Translated Components (10)

All 8 languages include complete translations for:

- 📱 **MazInputPhoneNumber** - International phone number input
- 📁 **MazDropzone** - File upload dropzone
- 📅 **MazDatePicker** - Date picker with shortcuts
- 📋 **MazChecklist** - Searchable checklist
- 📤 **MazDropdown** - Dropdown menu
- 🔍 **MazSelect** - Select component with search
- 🗂️ **MazTable** - Data table with pagination
- 📄 **MazPagination** - Pagination controls
- 🎠 **MazCarousel** - Carousel component
- 🌍 **MazSelectCountry** - Country selector

## Installation

```bash
pnpm add @maz-ui/translations
```

## Basic Setup

### Vue 3

```typescript
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { fr } from '@maz-ui/translations'
import App from './App.vue'

const app = createApp(App)

app.use(MazUi, {
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    preloadFallback: true, // default
    messages: {
      fr // Import language to avoid hydration issues
    }
  }
})

app.mount('#app')
```

### Nuxt 3

```typescript
// nuxt.config.ts
import { fr, es } from '@maz-ui/translations'

export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],

  mazUi: {
    translations: {
      locale: 'fr',
      fallbackLocale: 'en',
      preloadFallback: true,
      messages: {
        fr,
        es
      }
    }
  }
})
```

## Configuration Options

### Core Options

**locale** (string)
- Starting/current language
- Example: `'fr'`, `'en'`, `'es'`

**fallbackLocale** (string, default: `'en'`)
- Fallback language when translation is missing
- Always falls back to English if not found

**preloadFallback** (boolean, default: `true`)
- Whether to preload fallback language at startup
- See "preloadFallback Option" section below

**messages** (object)
- Translation messages (immediate or lazy-loaded)
- Can be objects or functions (for lazy loading)

## preloadFallback Option

Controls whether the fallback language is loaded at application startup.

### Default Behavior (`preloadFallback: true`)

```typescript
app.use(MazUi, {
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    preloadFallback: true // Default
  }
})
```

**Advantages:**
- ✅ No delay - Fallback translations immediately available
- ✅ Smooth experience - No missing text even if translation doesn't exist
- ✅ Reliability - Always a translation available

**Disadvantages:**
- ❌ Slightly larger initial bundle size

### Disable Preloading (`preloadFallback: false`)

```typescript
app.use(MazUi, {
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    preloadFallback: false // Optimize bundle size
  }
})
```

**Advantages:**
- ✅ Smaller initial bundle
- ✅ Load only on demand

**Disadvantages:**
- ❌ Possible delay - May temporarily show translation keys
- ❌ Requires loading state management

**Recommendation:** Keep `preloadFallback: true` unless you have strict performance constraints or manually manage loading states.

## Lazy Loading Strategies

All built-in languages (fr, es, de, it, pt, ja, zh-CN) are **automatically loaded lazily** - no configuration needed!

### Benefits of Lazy Loading

- 🚀 **Faster startup** - Less data to load initially
- 📦 **Smaller bundle** - Translations in separate chunks
- 🌐 **Scalable** - Add unlimited languages without performance impact
- 💾 **Bandwidth savings** - Users only download what they use

### Method 1: Dynamic Imports (Recommended)

```typescript
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'

app.use(MazUi, {
  translations: {
    locale: 'en',
    fallbackLocale: 'en',
    preloadFallback: false,
    messages: {
      // Built-in languages load automatically
      fr: () => import('@maz-ui/translations/locales/fr'),
      es: () => import('@maz-ui/translations/locales/es'),
      de: () => import('@maz-ui/translations/locales/de'),

      // Custom language files
      nl: () => import('./locales/nl.ts').then(m => m.default)
    }
  }
})
```

### Method 2: API-Based Loading

Load translations from your backend API:

```typescript
app.use(MazUi, {
  translations: {
    locale: 'en',
    messages: {
      // Load from API
      fr: async () => {
        const response = await fetch('/api/translations/fr')
        return response.json()
      },

      // Combine multiple sources
      es: async () => {
        const [defaultTranslations, customTranslations] = await Promise.all([
          // Default Maz-UI translations
          import('@maz-ui/translations/locales/es').then(m => m.default),
          // Your custom translations
          fetch('/api/translations/es/custom').then(r => r.json())
        ])
        return { ...defaultTranslations, ...customTranslations }
      }
    }
  }
})
```

### Method 3: Mix Immediate and Lazy Loading

```typescript
app.use(MazUi, {
  translations: {
    locale: 'fr',
    messages: {
      // French: loaded immediately (direct object)
      fr: {
        inputPhoneNumber: {
          countrySelect: {
            placeholder: 'Code pays',
            error: 'Choisir le pays'
          }
        }
      },

      // English: loaded lazily (function)
      en: () => import('./locales/en.ts'),

      // Spanish: loaded lazily (function)
      es: () => import('./locales/es.ts')
    }
  }
})
```

## Using Translations in Components

### Language Switcher

```vue
<script setup>
import { useTranslations } from '@maz-ui/translations'
import { ref } from 'vue'

const { locale, setLocale } = useTranslations()
const isLoading = ref(false)

// Function to change language with loading state
async function switchLanguage(newLocale) {
  isLoading.value = true
  try {
    await setLocale(newLocale) // Loads translations if needed
    console.log(`Language changed to ${newLocale}`)
  } catch (error) {
    console.error('Failed to load translations:', error)
    // Handle error (show toast, etc.)
  } finally {
    isLoading.value = false
  }
}

// Preload a language (optional)
async function preloadLanguage(locale) {
  try {
    await setLocale(locale)
    console.log(`Language ${locale} preloaded`)
  } catch (error) {
    console.error(`Failed to preload ${locale}:`, error)
  }
}
</script>

<template>
  <div>
    <div class="language-switcher">
      <button
        :disabled="isLoading"
        @click="switchLanguage('fr')"
      >
        🇫🇷 {{ isLoading && locale === 'fr' ? 'Loading...' : 'Français' }}
      </button>

      <button
        :disabled="isLoading"
        @click="switchLanguage('es')"
      >
        🇪🇸 {{ isLoading && locale === 'es' ? 'Cargando...' : 'Español' }}
      </button>

      <button
        :disabled="isLoading"
        @click="switchLanguage('de')"
      >
        🇩🇪 {{ isLoading && locale === 'de' ? 'Laden...' : 'Deutsch' }}
      </button>
    </div>

    <!-- Global loading indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        Loading translations...
      </div>
    </div>

    <!-- Current language -->
    <p>Current language: {{ locale }}</p>

    <!-- Maz-UI components use translations automatically -->
    <MazInputPhoneNumber />
    <MazDatePicker />
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  background: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
```

### Dropdown Language Switcher

```vue
<script setup lang="ts">
import { useTranslations } from '@maz-ui/translations'
import type { MazDropdownProps } from 'maz-ui/components'

const { locale, setLocale } = useTranslations()

const languages: MazDropdownProps['items'] = [
  { label: '🇺🇸 English', onClick: () => setLocale('en') },
  { label: '🇫🇷 Français', onClick: () => setLocale('fr') },
  { label: '🇪🇸 Español', onClick: () => setLocale('es') },
  { label: '🇩🇪 Deutsch', onClick: () => setLocale('de') },
  { label: '🇮🇹 Italiano', onClick: () => setLocale('it') }
]
</script>

<template>
  <MazDropdown
    class="language-switcher"
    :items="languages"
    trigger="click"
  >
    {{ locale }}
  </MazDropdown>
</template>
```

## Creating Custom Translation Files

### Translation File Structure

Create separate files for each language:

```typescript
// locales/fr.ts
export default {
  inputPhoneNumber: {
    countrySelect: {
      placeholder: 'Code pays',
      error: 'Choisir le pays',
      searchPlaceholder: 'Rechercher le pays'
    },
    phoneInput: {
      placeholder: 'Numéro de téléphone',
      example: 'Exemple: {example}'
    }
  },
  dropzone: {
    dragAndDrop: 'Déposez vos fichiers',
    selectFile: 'sélectionner un fichier',
    divider: 'ou',
    fileMaxCount: 'Maximum {count} fichiers',
    fileMaxSize: 'Maximum {size} MB',
    fileTypes: 'Types de fichiers autorisés: {types}'
  },
  datePicker: {
    shortcuts: {
      lastSevenDays: 'Les 7 derniers jours',
      lastThirtyDays: 'Les 30 derniers jours',
      thisWeek: 'Cette semaine',
      lastWeek: 'La semaine dernière',
      thisMonth: 'Ce mois-ci',
      thisYear: 'Cette année',
      lastYear: 'L\'année dernière'
    }
  }
  // You can omit translations you don't want to override
  // Default Maz-UI translations will be used automatically
}
```

### Adding a New Language

```typescript
// locales/nl.ts (Dutch)
export default {
  inputPhoneNumber: {
    countrySelect: {
      placeholder: 'Landcode',
      error: 'Kies land',
      searchPlaceholder: 'Zoek het land'
    },
    phoneInput: {
      placeholder: 'Telefoonnummer',
      example: 'Bijvoorbeeld: {example}'
    }
  },
  dropzone: {
    dragAndDrop: 'Sleep je bestanden hierheen',
    selectFile: 'bestand selecteren',
    divider: 'of'
  }
}
```

## Complete Translation Keys Reference

All available translation keys for the 10 translated components:

```typescript
export default {
  /**
   * MazSelectCountry component
   */
  selectCountry: {
    searchPlaceholder: 'Search country'
  },

  /**
   * MazInputPhoneNumber component
   */
  inputPhoneNumber: {
    countrySelect: {
      placeholder: 'Country code',
      error: 'Choose country',
      searchPlaceholder: 'Search the country'
    },
    phoneInput: {
      placeholder: 'Phone number',
      example: 'Example: {example}' // {example} replaced dynamically
    }
  },

  /**
   * MazDropzone component
   */
  dropzone: {
    dragAndDrop: 'Drop your files',
    selectFile: 'select file',
    divider: 'or',
    fileMaxCount: 'Maximum {count} files', // {count} replaced dynamically
    fileMaxSize: 'Maximum {size} MB', // {size} replaced dynamically
    fileTypes: 'Allowed file types: {types}' // {types} replaced dynamically
  },

  /**
   * MazDatePicker component
   */
  datePicker: {
    shortcuts: {
      lastSevenDays: 'Last 7 days',
      lastThirtyDays: 'Last 30 days',
      thisWeek: 'This week',
      lastWeek: 'Last week',
      thisMonth: 'This month',
      thisYear: 'This year',
      lastYear: 'Last year'
    }
  },

  /**
   * MazDropdown component
   */
  dropdown: {
    screenReaderDescription: 'Open menu dropdown'
  },

  /**
   * MazSelect component
   */
  select: {
    searchPlaceholder: 'Search'
  },

  /**
   * MazTable component
   */
  table: {
    noResults: 'No results',
    actionColumnTitle: 'Actions',
    searchByInput: {
      all: 'All',
      placeholder: 'Search by'
    },
    searchInput: {
      placeholder: 'Search'
    },
    pagination: {
      all: 'All',
      rowsPerPage: 'Rows per page',
      of: 'of'
    }
  },

  /**
   * MazPagination component
   */
  pagination: {
    navAriaLabel: 'page navigation',
    screenReader: {
      firstPage: 'First Page, page {page}', // {page} replaced dynamically
      previousPage: 'Previous Page, page {page}',
      page: 'Page {page}',
      nextPage: 'Next Page, page {page}',
      lastPage: 'Last Page, page {page}'
    }
  },

  /**
   * MazCarousel component
   */
  carousel: {
    ariaLabel: {
      previousButton: 'Scroll to previous items',
      nextButton: 'Scroll to next items'
    }
  },

  /**
   * MazChecklist component
   */
  checklist: {
    noResultsFound: 'No results found',
    searchInput: {
      placeholder: 'Search'
    }
  }
}
```

## Variable Substitution

Some translations include variables in curly braces that get replaced dynamically:

| Variable | Used In | Example |
|----------|---------|---------|
| `{example}` | InputPhoneNumber | `"Example: +33 6 12 34 56 78"` |
| `{count}` | Dropzone | `"Maximum 5 files"` |
| `{size}` | Dropzone | `"Maximum 10 MB"` |
| `{types}` | Dropzone | `"Allowed file types: .jpg, .png"` |
| `{page}` | Pagination | `"Page 3"` |

**Example**:
```typescript
// Your translation
phoneInput: {
  example: 'Example: {example}'
}

// Becomes (dynamically)
"Example: +33 6 12 34 56 78"
```

Variables are replaced automatically by Maz-UI - you don't need to handle them yourself.

## Production Patterns

### 1. Browser Language Detection

```typescript
async function detectUserLanguage() {
  try {
    // Detect from browser
    const browserLang = navigator.language.split('-')[0]

    // Check if supported
    const supportedLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh']

    if (supportedLanguages.includes(browserLang)) {
      return browserLang
    }

    // Fallback to English
    return 'en'
  } catch {
    return 'en'
  }
}

// Use automatic detection
app.use(MazUi, {
  translations: {
    locale: await detectUserLanguage(),
    messages: {
      fr: () => import('@maz-ui/translations/locales/fr'),
      es: () => import('@maz-ui/translations/locales/es'),
      de: () => import('@maz-ui/translations/locales/de')
    }
  }
})
```

### 2. Smart Caching Strategy

```typescript
// Custom cache for translations
const translationCache = new Map()

const messages = {
  fr: async () => {
    if (translationCache.has('fr')) {
      return translationCache.get('fr')
    }

    const translations = await import('./locales/fr.ts').then(m => m.default)
    translationCache.set('fr', translations)
    return translations
  }
}
```

**Note**: Maz-UI already caches loaded translations internally. Once loaded, switching back to a previously loaded language is instant.

### 3. Error Handling for Async Loading

```vue
<script setup>
import { useTranslations } from '@maz-ui/translations'
import { useToast } from 'maz-ui/composables'

const { setLocale } = useTranslations()
const toast = useToast()

async function switchLanguage(locale) {
  try {
    await setLocale(locale)
    toast.success(`Language changed to ${locale}`)
  } catch (error) {
    console.error('Translation loading error:', error)
    toast.error('Failed to load translations. Please try again.')
  }
}
</script>
```

### 4. Loading States During Language Switching

See "Language Switcher" example above with `isLoading` state management.

### 5. Overriding Default Translations

```typescript
import { fr as defaultFr } from '@maz-ui/translations'

app.use(MazUi, {
  translations: {
    locale: 'fr',
    messages: {
      fr: {
        ...defaultFr,
        // Override specific keys
        inputPhoneNumber: {
          ...defaultFr.inputPhoneNumber,
          countrySelect: {
            ...defaultFr.inputPhoneNumber.countrySelect,
            placeholder: 'Code téléphonique' // Custom translation
          }
        }
      }
    }
  }
})
```

## Best Practices & Performance

### 10 Important Notes

1. **All 8 built-in languages load automatically** - You don't need to provide fr, es, de, it, pt, ja, zh-CN unless you want to override them.

2. **Translate only what you need** - You're not required to translate every key. Add only those for the components you use.

3. **Components update automatically** - Once configured, all Maz-UI components automatically use the right language when you call `setLocale()`.

4. **Variables are replaced automatically** - Don't worry about `{example}`, `{page}`, etc. - Maz-UI handles them for you.

5. **Fallback to English** - If a translation is missing in your language and fallback language, it falls back to English.

6. **Lazy loading is asynchronous** - When using lazy loading, `setLocale()` returns a Promise. Use `await setLocale('fr')` in your code.

7. **Translations are cached** - Once a language is loaded, it stays in memory. Switching back is instant.

8. **preloadFallback option** - By default (`preloadFallback: true`), fallback language is preloaded at startup for smoother experience. Set to `false` to optimize initial loading.

9. **Partial translations supported** - You can provide partial translations. Maz-UI will automatically use default translations for missing keys.

10. **Avoid hydration issues** - In SSR/SSG (Nuxt), always provide initial locale translations in `messages` to avoid hydration mismatches and flashes.

### Performance Tips

**DO:**
- ✅ Use lazy loading for all non-initial languages
- ✅ Set `preloadFallback: false` if bundle size is critical
- ✅ Load only languages your users need
- ✅ Use browser language detection
- ✅ Cache translations once loaded

**DON'T:**
- ❌ Load all languages immediately
- ❌ Forget to handle loading errors
- ❌ Skip providing initial locale in SSR
- ❌ Provide complete translations if partial is sufficient

### SSR/SSG Considerations (Nuxt)

```typescript
// nuxt.config.ts
import { fr } from '@maz-ui/translations'

export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'fr',
      fallbackLocale: 'en',
      preloadFallback: true,
      messages: {
        // IMPORTANT: Provide initial locale to avoid hydration issues
        fr // Load immediately, not lazily
      }
    }
  }
})
```

**Why?** In SSR, if translations load asynchronously, the server-rendered HTML won't match client-side rendering, causing hydration mismatches.

## Troubleshooting

### Translation Keys Show as Raw Strings

**Problem**: You see `inputPhoneNumber.phoneInput.example` instead of translated text.

**Causes**:
1. Missing locale import
2. Lazy loading not awaited
3. Language file failed to load

**Solutions**:
```typescript
// 1. Import locale directly
import { fr } from '@maz-ui/translations'
app.use(MazUi, {
  translations: {
    locale: 'fr',
    messages: { fr } // Not lazy-loaded
  }
})

// 2. Await setLocale
await setLocale('fr') // Don't forget await!

// 3. Add error handling
try {
  await setLocale('fr')
} catch (error) {
  console.error('Failed to load:', error)
}
```

### Hydration Mismatch in Nuxt

**Problem**: Warning about hydration mismatch in browser console.

**Cause**: Initial locale not provided in SSR.

**Solution**:
```typescript
// nuxt.config.ts
import { fr } from '@maz-ui/translations'

export default defineNuxtConfig({
  mazUi: {
    translations: {
      locale: 'fr',
      messages: {
        fr // Provide immediately, not as function
      }
    }
  }
})
```

### Language Doesn't Switch

**Problem**: Calling `setLocale()` doesn't update components.

**Causes**:
1. Not using `await`
2. Translation loading failed
3. Incorrect language code

**Solutions**:
```typescript
// Always use await
await setLocale('fr')

// Check for errors
try {
  await setLocale('fr')
} catch (error) {
  console.error('Switch failed:', error)
}

// Verify language code
const supportedLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh-CN']
if (supportedLanguages.includes(newLocale)) {
  await setLocale(newLocale)
}
```

## Official Resources

- **Documentation**: https://maz-ui.com/guide/translations
- **Package**: https://www.npmjs.com/package/@maz-ui/translations
- **GitHub**: https://github.com/LouisMazel/maz-ui
- **Discord**: https://discord.gg/maz-ui
