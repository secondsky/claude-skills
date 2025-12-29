---
name: nuxt-ui-v4:setup
description: Initialize Nuxt UI v4 in an existing Nuxt project with proper configuration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
argument-hint: "[--ai] [--dashboard] [--editor]"
---

# Nuxt UI v4 Setup Command

Initialize Nuxt UI v4 in the current Nuxt project with optimal configuration.

## Arguments

- `--ai`: Include AI SDK v5 and Chat components setup
- `--dashboard`: Include Dashboard components configuration
- `--editor`: Include TipTap Editor setup

## Instructions

1. **Check Prerequisites**
   - Verify this is a Nuxt 4 project (check `nuxt.config.ts`)
   - Check current @nuxt/ui version if already installed

2. **Install Dependencies**
   ```bash
   bun add @nuxt/ui
   ```

   If `--ai` flag:
   ```bash
   bun add ai @ai-sdk/vue @ai-sdk/gateway
   ```

   If `--editor` flag:
   ```bash
   bun add @tiptap/vue-3 @tiptap/starter-kit
   ```

3. **Configure nuxt.config.ts**
   Add @nuxt/ui to modules:
   ```ts
   export default defineNuxtConfig({
     modules: ['@nuxt/ui'],
     ui: {
       colorMode: true
     }
   })
   ```

4. **Setup app.vue**
   Wrap with UApp and add CSS imports:
   ```vue
   <template>
     <UApp>
       <NuxtPage />
     </UApp>
   </template>

   <style>
   @import "tailwindcss";
   @import "@nuxt/ui";
   </style>
   ```

5. **Create app.config.ts**
   Setup semantic colors:
   ```ts
   export default defineAppConfig({
     ui: {
       theme: {
         colors: {
           primary: 'green',
           neutral: 'slate'
         }
       }
     }
   })
   ```

6. **If --dashboard flag**: Create dashboard layout
   ```
   layouts/dashboard.vue
   ```

7. **If --ai flag**: Create chat API endpoint
   ```
   server/api/chat.post.ts
   ```

8. **Generate Types**
   ```bash
   bunx nuxt prepare
   ```

9. **Verify Installation**
   ```bash
   bun run dev
   ```

## Output

Report what was configured:
- Packages installed
- Files created/modified
- Next steps for the user

## Tips

- Use `bun` as the preferred package manager
- Check for existing Tailwind config and migrate if needed
- Warn if using incompatible Tailwind v3
