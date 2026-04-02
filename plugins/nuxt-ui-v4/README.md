# Nuxt UI v4 Plugin

Production-ready **Nuxt UI v4** plugin for **Nuxt v4** projects with **125+ accessible components**, 3 specialized agents, 4 commands, MCP integration, and comprehensive templates.

## What This Plugin Provides

### Core Features
- **125+ Components**: Complete UI component library covering all application needs
- **3 Specialized Agents**: Component selection, migration assistance, troubleshooting
- **4 Slash Commands**: Setup, migrate, theme configuration, component scaffolding
- **MCP Integration**: Official Nuxt UI MCP server for real-time component discovery
- **38 Reference Docs**: Deep-dive guides organized by component category
- **7 Semantic Colors**: Primary, secondary, success, info, warning, error, neutral with dark mode support
- **Accessibility**: WAI-ARIA compliant components built on Reka UI
- **AI Integration**: 8 Chat components for AI chatbots with streaming, reasoning, and tool calling
- **Dashboard System**: 11 dashboard components for admin interfaces
- **Page Layout**: 16 page layout components for landing pages and marketing sites
- **Auth System**: Pre-built AuthForm for login/register/password reset

## When to Use

Use this plugin when working with:

- Nuxt v4 projects with @nuxt/ui module
- Vue projects via Vite plugin (Nuxt optional)
- Building dashboard applications
- Creating landing pages and marketing sites
- Implementing AI chat interfaces with reasoning and tool calling
- Building rich text editors
- Form-heavy applications with validation
- Data tables with sorting/pagination
- SaaS pricing pages
- Documentation sites and blogs
- Migrating from Nuxt UI v2/v3 to v4

## Component Coverage (125+)

### Dashboard (11 components)
DashboardGroup, DashboardSidebar, DashboardPanel, DashboardNavbar, DashboardToolbar, DashboardSidebarToggle, DashboardSidebarCollapse, DashboardSearch, DashboardSearchButton, DashboardResizeHandle

### Chat/AI (8 components)
ChatMessage, ChatMessages, ChatPalette, ChatPrompt, ChatPromptSubmit, ChatReasoning, ChatTool, ChatShimmer

### Editor (6 components)
Editor, EditorToolbar, EditorDragHandle, EditorMentionMenu, EditorEmojiMenu, EditorSuggestionMenu

### Page Layout (16 components)
Page, PageAside, PageBody, PageCard, PageColumns, PageCTA, PageHeader, PageHero, PageFeature, PageGrid, PageLinks, PageList, PageLogos, PageSection, PageAnchors, UApp

### Content (9 components)
BlogPost, BlogPosts, ChangelogVersion, ChangelogVersions, ContentNavigation, ContentSearch, ContentSearchButton, ContentSurround, ContentToc

### Pricing (3 components)
PricingPlan, PricingPlans, PricingTable

### Forms (22 components)
Input, InputDate, InputTime, InputNumber, InputTags, InputMenu, Select, SelectMenu, Textarea, Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, Calendar, ColorPicker, PinInput, Form, FormField, FileUpload, FieldGroup, AuthForm

### Navigation (8 components)
Tabs, Breadcrumb, Link, Pagination, CommandPalette, NavigationMenu, Stepper, Tree

### Overlays (8 components)
Modal, Drawer, Slideover, Popover, DropdownMenu, ContextMenu, Tooltip, Collapsible

### Feedback (7 components)
Alert, Toast, Progress, Skeleton, Empty, Error, Banner

### Data (2 components)
Table (with virtualization), ScrollArea

### General (14 components)
Button, Avatar, AvatarGroup, Badge, Accordion, Carousel, Chip, Icon, Kbd, Marquee, Timeline, User, Container, Separator

### Color Mode (6 components)
ColorModeAvatar, ColorModeButton, ColorModeImage, ColorModeSelect, ColorModeSwitch, LocaleSelect

## Agents

### nuxt-ui-component-selector
Recommends the best Nuxt UI components for your use case. Uses MCP tools to search and analyze components.

### nuxt-ui-migration-assistant
Guides v2/v3 to v4 migration with breaking change detection and automated fixes.

### nuxt-ui-troubleshooter
Diagnoses and fixes common Nuxt UI issues automatically.

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

## Quick Start

```bash
# Install Nuxt UI v4
bun add @nuxt/ui tailwindcss
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css']
})
```

```css
/* assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
```

```vue
<!-- app.vue - REQUIRED: UApp wrapper -->
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

### Official Templates

```bash
npm create nuxt@latest -- -t ui             # Starter
npm create nuxt@latest -- -t ui/dashboard    # Dashboard
npm create nuxt@latest -- -t ui/chat         # AI Chat
npm create nuxt@latest -- -t ui/landing      # Landing page
npm create nuxt@latest -- -t ui/saas         # SaaS
npm create nuxt@latest -- -t ui/docs         # Documentation
npm create nuxt@latest -- -t ui/portfolio    # Portfolio
npm create nuxt@latest -- -t ui/changelog    # Changelog
npm create nuxt@latest -- -t ui/editor       # Rich text editor
```

## Version Requirements

| Package | Version | Required |
|---------|---------|----------|
| nuxt | 4.x | Yes |
| @nuxt/ui | 4.x | Yes |
| tailwindcss | 4.x | Yes |
| vue | 3.5+ | Yes |
| ai (Vercel AI SDK) | 5.x | For AI features |
| @ai-sdk/vue | 5.x | For AI features |
| @ai-sdk/gateway | latest | For AI features |
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

**Last Updated**: 2026-03-30
**Version**: 3.2.1
