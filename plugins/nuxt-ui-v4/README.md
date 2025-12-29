# Nuxt UI v4 Plugin

Production-ready **Nuxt UI v4** plugin for **Nuxt v4** projects with **125+ accessible components**, 3 specialized agents, 4 commands, MCP integration, and comprehensive templates.

## What This Plugin Provides

### Core Features
- **125+ Components**: Complete UI component library covering all application needs
- **3 Specialized Agents**: Component selection, migration assistance, troubleshooting
- **4 Slash Commands**: Setup, migrate, theme configuration, component scaffolding
- **MCP Integration**: Official Nuxt UI MCP server for real-time component discovery
- **23 Vue Templates**: Production-ready component examples
- **34 Reference Docs**: Deep-dive guides organized by component category
- **Semantic Color System**: 7 color aliases with dark mode support
- **Accessibility**: WAI-ARIA compliant components built on Reka UI
- **AI Integration**: AI SDK v5 chat components (ChatMessages, ChatPrompt, etc.)
- **Dashboard System**: 11 dashboard components for admin interfaces
- **Page Layout**: 16 page layout components for landing pages and marketing sites

## When to Use

Use this plugin when working with:

- Nuxt v4 projects with @nuxt/ui module
- Building dashboard applications
- Creating landing pages and marketing sites
- Implementing AI chat interfaces
- Building rich text editors
- Form-heavy applications
- Data tables with sorting/pagination
- SaaS pricing pages
- Documentation sites and blogs
- Migrating from Nuxt UI v2/v3 to v4

## Component Coverage (125+)

### Dashboard (11 components)
DashboardGroup, DashboardSidebar, DashboardPanel, DashboardNavbar, DashboardToolbar, DashboardSidebarToggle, DashboardSidebarCollapse, DashboardSearch, DashboardSearchButton, DashboardModal

### Chat/AI (5 components)
ChatMessage, ChatMessages, ChatPalette, ChatPrompt, ChatPromptSubmit

### Editor (6 components)
Editor, EditorToolbar, EditorDragHandle, EditorMentionMenu, EditorEmojiMenu, EditorSuggestionMenu

### Page Layout (16 components)
Page, PageAside, PageBody, PageCard, PageColumns, PageCTA, PageError, PageFeature, PageGrid, PageHeader, PageHero, PageLinks, PageList, PageLogos, PageSection, UApp

### Content (9 components)
BlogPost, BlogPosts, ChangelogVersion, ChangelogVersions, ContentNavigation, ContentSearch, ContentSearchButton, ContentSurround, ContentToc

### Pricing (3 components)
PricingPlan, PricingPlans, PricingTable

### Forms (17 components)
Input, InputNumber, InputDate, InputTime, InputMenu, Select, SelectMenu, Textarea, Checkbox, CheckboxGroup, RadioGroup, Switch, Toggle, Slider, Calendar, ColorPicker, PinInput

### Navigation (7 components)
Tabs, Breadcrumb, Link, Pagination, CommandPalette, NavigationMenu, Tree

### Overlays (8 components)
Modal, Drawer, Dialog, Popover, DropdownMenu, ContextMenu, Sheet, Tooltip

### Feedback (7 components)
Alert, Toast, Notification, Progress, Meter, Skeleton, Empty

### Layout (5 components)
Card, Container, Divider, Separator, Collapsible

### Data (1 component)
Table

### General (13+ components)
Button, ButtonGroup, Avatar, AvatarGroup, Badge, Accordion, Carousel, Chip, Icon, Kbd, Stepper, User, more...

## Agents

### nuxt-ui-component-selector
Recommends the best Nuxt UI components for your use case. Uses MCP tools to search and analyze components.

```
"I need a user profile card" → Recommends Card, Avatar, Badge with example code
```

### nuxt-ui-migration-assistant
Guides v2/v3 to v4 migration with breaking change detection and automated fixes.

```
"Migrate my Nuxt UI v2 project" → Analyzes code, identifies breaking changes, provides migration steps
```

### nuxt-ui-troubleshooter
Diagnoses and fixes 10+ common Nuxt UI issues automatically.

```
"My modal isn't showing" → Checks UApp wrapper, event handling, provides fix
```

## Commands

### /nuxt-ui:setup
Initialize Nuxt UI in a project with optional features:
```bash
/nuxt-ui:setup              # Basic setup
/nuxt-ui:setup --ai         # With AI chat components
/nuxt-ui:setup --dashboard  # With dashboard layout
/nuxt-ui:setup --editor     # With rich text editor
```

### /nuxt-ui:migrate
Migrate from v2/v3 to v4:
```bash
/nuxt-ui:migrate            # Interactive migration
/nuxt-ui:migrate --dry-run  # Preview changes only
```

### /nuxt-ui:theme
Generate custom theme configuration:
```bash
/nuxt-ui:theme              # Interactive theme builder
```

### /nuxt-ui:component
Scaffold components:
```bash
/nuxt-ui:component form       # Form with validation
/nuxt-ui:component table      # Data table
/nuxt-ui:component modal      # Modal dialog
/nuxt-ui:component dashboard  # Dashboard layout
/nuxt-ui:component chat       # AI chat interface
/nuxt-ui:component page       # Landing page
```

## MCP Integration

This plugin integrates with the official Nuxt UI MCP server:

```json
{
  "mcpServers": {
    "nuxt-ui": {
      "type": "http",
      "url": "https://ui.nuxt.com/mcp"
    }
  }
}
```

**Available MCP Tools**:
- `list_components` - List all 125+ components
- `get_component` - Get detailed component documentation
- `get_component_metadata` - Get component metadata
- `search_components_by_category` - Search by category

## Quick Start

```bash
# Install Nuxt UI v4
npm install @nuxt/ui

# Configure nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui']
})
```

```vue
<!-- app.vue - REQUIRED: UApp wrapper -->
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

## Templates Included

### Layout Templates
- `layouts/dashboard.vue` - Complete dashboard with sidebar, navbar, search
- `pages/landing.vue` - Marketing landing page with hero, features, pricing, testimonials

### Component Templates
- `components/ui-chat-full.vue` - Full AI chat with MDC rendering
- `components/ui-form-example.vue` - Form with validation
- `components/ui-data-table.vue` - Table with sorting, pagination
- `components/ui-modal-dialog.vue` - Modal patterns
- `components/ui-command-palette.vue` - Search with Fuse.js
- Plus 17 more component templates...

### Config Templates
- `nuxt.config.ts` - Nuxt v4 + @nuxt/ui configuration
- `app.config.ts` - Theme and semantic colors
- `app.vue` - UApp wrapper with CSS imports

## Reference Documentation

### New in v2.0
- **dashboard-components.md** - 11 dashboard components
- **chat-components.md** - 5 AI chat components
- **editor-components.md** - 6 TipTap-based editor components
- **page-layout-components.md** - 16 page components
- **pricing-components.md** - 3 pricing components
- **content-components.md** - Blog, changelog, docs components

### Core References
- **semantic-color-system.md** - 7 semantic colors, theming
- **form-validation-patterns.md** - Forms, validation, Zod
- **ai-sdk-v5-integration.md** - Chat, streaming, AI SDK
- **accessibility-patterns.md** - Reka UI, ARIA, keyboard nav
- Plus 28 more reference docs...

## Common Issues Solved

This plugin prevents 20+ common errors:

1. Missing UApp wrapper causing render issues
2. Module not registered in nuxt.config.ts
3. Incorrect CSS import order (Tailwind before @nuxt/ui)
4. Dashboard components not rendering (missing DashboardGroup)
5. Chat messages not updating (incorrect AI SDK integration)
6. Editor toolbar not showing (missing EditorToolbar component)
7. Page layout breaking (incorrect Page slot usage)
8. Pricing toggle not working (billing state management)
9. Content navigation not highlighting (route matching)
10. Modal vs Drawer vs Dialog confusion
... and 10+ more documented solutions

## Version Requirements

| Package | Version | Required |
|---------|---------|----------|
| nuxt | 4.x | Yes |
| @nuxt/ui | 4.x | Yes |
| vue | 3.5+ | Yes |
| tailwindcss | 4.x | Yes |
| ai (Vercel AI SDK) | 5.x | For AI features |
| @tiptap/vue-3 | 2.x | For Editor |
| fuse.js | 7.x | For CommandPalette |
| embla-carousel-vue | 8.x | For Carousel |
| zod | 3.x | For validation |

## Installation

```bash
# Via Claude Code plugin marketplace
/plugin install nuxt-ui-v4@claude-skills

# Or clone and install manually
git clone https://github.com/secondsky/claude-skills.git
cd claude-skills
./scripts/install-skill.sh nuxt-ui-v4
```

## Keywords for Discovery

Nuxt v4, Nuxt UI v4, @nuxt/ui, Dashboard, DashboardSidebar, DashboardPanel, DashboardNavbar, ChatMessages, ChatPrompt, Editor, EditorToolbar, Page, PageHero, PageSection, PricingPlan, BlogPost, ContentNavigation, Tailwind v4, Reka UI, accessible components, dark mode, theming, form validation, data tables, overlays, modals, drawers, AI chat, rich text editor, landing pages, SaaS pricing, documentation sites

## Links

- **Nuxt UI Documentation**: https://ui.nuxt.com
- **Nuxt UI MCP Server**: https://ui.nuxt.com/mcp
- **Nuxt v4 Documentation**: https://nuxt.com
- **Reka UI**: https://reka-ui.com
- **Tailwind CSS v4**: https://tailwindcss.com
- **AI SDK**: https://sdk.vercel.ai
- **Claude Skills Repository**: https://github.com/secondsky/claude-skills

## License

MIT License - See LICENSE file in repository root

## Maintainer

Claude Skills Maintainers

**Last Updated**: 2025-12-28
**Version**: 2.0.0
