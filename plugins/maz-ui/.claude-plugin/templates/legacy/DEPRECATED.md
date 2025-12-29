# ⚠️ DEPRECATED TEMPLATES

**These templates are deprecated as of Maz-UI plugin v4.3.3 (2025-12-29)**

## Why deprecated?

The "universal" template approach forced compromises that reduced code quality:
- Vue examples couldn't use framework-agnostic patterns optimally
- Nuxt examples couldn't showcase auto-imports and $fetch
- Developers had to mentally filter framework-specific code
- Every change required "does this work in both?" validation

## New template structure

Use the framework-specific templates instead:

### For Vue 3 + Vite projects
**Location**: `../vue/`

**Templates**:
- `setup/vite.config.ts` - Vite configuration with auto-import resolvers
- `components/form-basic.vue` - Basic form validation
- `components/form-multi-step.vue` - Multi-step wizard
- `components/dialog-confirm.vue` - Dialog patterns
- `components/data-table.vue` - Data table with pagination

**Characteristics**:
- ✅ Explicit imports: `import { ref } from 'vue'`
- ✅ Uses standard `fetch()` API
- ✅ Framework-agnostic code
- ✅ Vite optimizations

### For Nuxt 3 projects
**Location**: `../nuxt/`

**Templates**:
- `setup/nuxt.config.ts` - Nuxt module configuration
- `components/form-basic.vue` - Basic form validation
- `components/form-multi-step.vue` - Multi-step wizard
- `components/dialog-confirm.vue` - Dialog patterns
- `components/data-table.vue` - Data table with reactive data

**Characteristics**:
- ✅ Auto-imports (no import statements needed)
- ✅ Uses `$fetch` (Nuxt's ofetch wrapper)
- ✅ Leverages Nuxt composables
- ✅ SSR patterns

## Migration guide

**Old** (deprecated):
```
templates/components/form-basic.vue
templates/setup/vite.config.ts
```

**New** (use instead):
```
# For Vue 3:
templates/vue/components/form-basic.vue
templates/vue/setup/vite.config.ts

# For Nuxt 3:
templates/nuxt/components/form-basic.vue
templates/nuxt/setup/nuxt.config.ts
```

## Benefits of new structure

✅ **Framework-specific best practices** - Each template showcases its framework properly
✅ **Zero compromises** - Vue uses `fetch()`, Nuxt uses `$fetch`
✅ **Clearer for users** - "I use Nuxt" → use `templates/nuxt/`
✅ **Easier maintenance** - No conditional logic or framework checks
✅ **Better examples** - Can show SSR, auto-imports, server routes in Nuxt
✅ **Production ready** - Both versions are truly production-grade

## What about themes?

The `themes/` directory contains a custom theme template that works for both Vue and Nuxt. It will be moved back to the root templates directory in a future update.

---

**Last Updated**: 2025-12-29
**Deprecated in**: Maz-UI plugin v4.3.3
**Will be removed in**: v5.0.0 (tentative)
