# Maz-UI MCP Server Reference

Guide to integrating Maz-UI with AI assistants using Model Context Protocol (MCP).

## Overview

### What is Model Context Protocol (MCP)?

**Model Context Protocol (MCP)** is a standardized way to connect AI assistants with external knowledge sources. Think of it as a **smart bridge** between your AI assistant and Maz-UI's documentation.

**Package**: `@maz-ui/mcp`
**NPM**: [![@maz-ui/mcp](https://badgen.net/npm/v/@maz-ui/mcp/latest)](https://www.npmjs.com/package/@maz-ui/mcp)

### Benefits

Instead of asking _"How do I use MazBtn?"_ and getting generic or outdated answers, your AI can now:

- 🔍 **Search** through all 50+ Maz-UI components
- 📖 **Read** exact documentation for components, composables, directives, plugins
- 💡 **Suggest** best implementation approaches
- 🛠️ **Help** with code examples and best practices

### What's Included

The MCP server provides **read-only access** to:

| Resource Type | Count | Description |
|--------------|-------|-------------|
| **Components** | 50+ | All Vue components with props, events, examples |
| **Guides** | 11 | Installation, theming, migration, best practices |
| **Composables** | 14+ | Reusable Vue composition functions |
| **Directives** | 5 | Vue directives for enhanced functionality |
| **Plugins** | 4 | Toast, dialog, AOS, wait overlay systems |
| **Helpers** | 20+ | Utility functions for common tasks |

::: tip Security Note
The MCP server provides **read-only access** to documentation. No sensitive data is transmitted or stored.
:::

---

## Supported AI Assistants

Maz-UI MCP server works with:

- **Claude Code** - Anthropic's CLI tool
- **Claude Desktop** - Desktop application
- **Cursor IDE** - AI-powered code editor
- **Windsurf** - Development environment
- **VS Code Copilot** - GitHub Copilot in VS Code
- **Cline** - VS Code extension

---

## Installation & Configuration

### Claude Code

**1. Add MCP Server**:
```bash
# Install at project scope (recommended)
claude mcp add maz-ui npx @maz-ui/mcp --scope project

# Or user scope (global)
claude mcp add maz-ui npx @maz-ui/mcp --scope user

# Or local scope (current directory only)
claude mcp add maz-ui npx @maz-ui/mcp --scope local
```

**2. Configuration File**:

The command creates/updates `~/.mcp.json` (or project-specific `.mcp.json`):

```json
{
  "mcpServers": {
    "maz-ui": {
      "type": "stdio",
      "command": "npx",
      "args": ["@maz-ui/mcp"]
    }
  }
}
```

**3. Restart**:
```bash
# Restart Claude Code to apply configuration
```

**4. Verify**:

Ask Claude Code: _"What Maz-UI components are available for forms?"_

The AI will now search the MCP server and provide accurate, up-to-date information.

---

### Claude Desktop

**1. Open Settings**:
- Launch Claude Desktop
- Navigate to **Settings**

**2. Edit Config**:
- Under **Developer** tab
- Tap **Edit Config** to open configuration file

**3. Add Configuration**:

```json
{
  "mcpServers": {
    "maz-ui": {
      "type": "stdio",
      "command": "npx",
      "args": ["@maz-ui/mcp"]
    }
  }
}
```

**4. Restart**:
- Save configuration file
- Restart Claude Desktop

**5. Verify**:
- Start a new chat
- Look for hammer (MCP) icon
- Maz-UI server should be listed as available

---

### Cursor IDE

**1. Create Config Directory**:
```bash
# In your project root
mkdir -p .cursor
```

**2. Create MCP Config**:

Create `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "maz-ui": {
      "command": "npx",
      "args": ["@maz-ui/mcp"]
    }
  }
}
```

**3. Verify Connection**:
- Open Cursor Settings
- Navigate to **Settings** → **MCP**
- Green active status = successfully connected

**4. Usage**:

Ask Cursor: _"Show me how to implement a multi-step form with MazStepper"_

---

### Windsurf

**1. Open MCP Settings**:
- Launch Windsurf
- Navigate to **Cascade assistant**
- Tap hammer (MCP) icon
- Tap **Configure**

**2. Add Configuration**:

```json
{
  "mcpServers": {
    "maz-ui": {
      "command": "npx",
      "args": ["@maz-ui/mcp"]
    }
  }
}
```

**3. Reload**:
- Save configuration file
- Tap **Refresh** in Cascade assistant

**4. Verify**:
- Green active status = successfully connected

---

### Visual Studio Code (Copilot)

**1. Create Config Directory**:
```bash
# In your project root
mkdir -p .vscode
```

**2. Create MCP Config**:

Create `.vscode/mcp.json`:

```json
{
  "servers": {
    "maz-ui": {
      "command": "npx",
      "args": ["@maz-ui/mcp"]
    }
  }
}
```

**3. Setup Copilot**:
- Open Copilot chat
- Switch to **Agent** mode
- Tap tool icon to confirm MCP tools are available
- Enter personal access token when prompted

**4. Usage**:

Ask Copilot: _"What's the best way to handle form validation with Maz-UI?"_

---

### Cline (VS Code Extension)

**1. Open MCP Settings**:
- Open Cline extension in VS Code
- Tap **MCP Servers** icon
- Tap **Configure MCP Servers**

**2. Add Configuration**:

```json
{
  "mcpServers": {
    "maz-ui": {
      "command": "npx",
      "args": ["@maz-ui/mcp"]
    }
  }
}
```

**3. Auto-Reload**:
- Save configuration file
- Cline automatically reloads configuration

**4. Verify**:
- Green active status = successfully connected

---

## Usage Examples

### Component Discovery

**Before MCP**:
```
User: "How do I create a button in Maz-UI?"
AI: *Generic answer or outdated information*
```

**With MCP**:
```
User: "How do I create a button in Maz-UI?"
AI: *Searches MCP server, returns current MazBtn documentation with props, events, and examples*
```

---

### Implementation Help

**Query**: _"I need a form with email validation, a loading state, and toast notifications on submit"_

**AI Response** (with MCP):
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'maz-ui'
import { string, email, pipe } from 'valibot'

const toast = useToast()
const isLoading = ref(false)
const emailValue = ref('')

const schema = {
  email: pipe(
    string('Email is required'),
    email('Invalid email format')
  )
}

const handleSubmit = async () => {
  isLoading.value = true
  try {
    await submitToAPI({ email: emailValue.value })
    toast.success('Email submitted successfully!')
  } catch (error) {
    toast.error('Submission failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <MazInput
      v-model="emailValue"
      type="email"
      label="Email Address"
      placeholder="Enter your email"
      required
    />
    <MazBtn type="submit" :loading="isLoading">
      Submit
    </MazBtn>
  </form>
</template>
```

The AI knows:
- MazInput component with validation props
- MazBtn with loading state
- useToast composable for notifications
- Valibot integration for schema validation

---

### Best Practices Discovery

**Query**: _"What's the recommended way to handle theming in Maz-UI v4?"_

**AI Response** (with MCP):
- Fetches theming guide from MCP server
- Suggests @maz-ui/themes package (not legacy CLI)
- Provides runtime theme switching example
- Recommends built-in presets (maz-ui, ocean, pristine, obsidian)

---

## Available Resources Details

### 50+ Components

**Forms**:
- MazInput, MazSelect, MazTextarea, MazCheckbox, MazRadio
- MazPhoneNumberInput, MazInputPrice, MazInputCode, MazInputTags
- MazPicker (date/time), MazSlider, MazSwitch

**Navigation**:
- MazTabs, MazStepper, MazPagination, MazBreadcrumbs

**Feedback**:
- MazFullscreenLoader, MazLoadingBar, MazCircularProgressBar
- MazDialog, MazToast, MazAlert, MazBadge, MazAvatar

**Layout**:
- MazCard, MazAccordion, MazDrawer, MazBottomSheet
- MazCarousel, MazGallery, MazDropdown, MazPopover

**Display**:
- MazBtn, MazIcon, MazLazyImg, MazAnimatedText, MazAnimatedCounter

### 14+ Composables

- **Theme**: useTheme (runtime theme switching)
- **i18n**: useTranslations (8 languages)
- **UI**: useToast, useDialog, useWait
- **Layout**: useBreakpoints, useWindowSize
- **Forms**: useFormValidator (Valibot integration)
- **Interaction**: useSwipe, useIdleTimeout, useUserVisibility
- **Utilities**: useTimer, useReadingTime, useStringMatching, useDisplayNames, useFormField

### 5 Directives

- **v-tooltip**: Customizable tooltips with positioning
- **v-click-outside**: Detect clicks outside element
- **v-lazy-img**: Lazy load images with blur-up effect
- **v-zoom-img**: Image zoom on hover/click
- **v-fullscreen-img**: Open images in fullscreen viewer

### 4 Plugins

- **Toast**: Notification system with actions, persistence, stacking
- **Dialog**: Promise-based modals with custom buttons
- **AOS**: Animate On Scroll with 60+ animations
- **Wait**: Global loading state management

### 11 Guides

1. Getting Started
2. Installation (Vue, Nuxt)
3. Theming (v4 themes package)
4. Migration (v3 → v4)
5. Auto-Import Resolvers
6. CLI (legacy v3)
7. MCP Server
8. SSR/SSG Support
9. Accessibility
10. Performance Optimization
11. Best Practices

### 20+ Helpers

**String**: capitalize, kebabCase, camelCase, snakeCase, slugify
**Number**: formatNumber, formatCurrency, clamp, randomInt
**Date**: formatDate, formatRelative, isValidDate
**Array**: chunk, unique, shuffle, groupBy
**Object**: deepClone, mergeDeep, pick, omit
**Color**: hexToRgb, rgbToHex, lighten, darken, getContrast
**Validation**: isEmail, isURL, isPhoneNumber, isCreditCard

---

## Troubleshooting

### MCP Server Not Appearing

**Issue**: AI assistant doesn't show Maz-UI in available MCP servers

**Solutions**:
1. **Check configuration file syntax**:
   ```bash
   # Validate JSON
   cat ~/.mcp.json | jq .
   ```
2. **Verify npx is installed**:
   ```bash
   npx --version
   ```
3. **Check network connectivity** (npx needs to download @maz-ui/mcp)
4. **Restart AI assistant** after configuration changes

---

### Connection Failed

**Issue**: MCP server shows as "inactive" or "connection failed"

**Solutions**:
1. **Test npx command directly**:
   ```bash
   npx @maz-ui/mcp
   ```
2. **Check Node.js version**:
   ```bash
   node --version  # Should be 18+
   ```
3. **Clear npx cache**:
   ```bash
   npx clear-npx-cache
   npx @maz-ui/mcp
   ```
4. **Check firewall settings** (if using corporate network)

---

### Outdated Documentation Returned

**Issue**: AI returns old information despite MCP server

**Solutions**:
1. **Verify MCP server is active** (green status)
2. **Check @maz-ui/mcp version**:
   ```bash
   npm view @maz-ui/mcp version
   ```
3. **Update package**:
   ```bash
   npx @maz-ui/mcp@latest
   ```
4. **Restart AI assistant**

---

### AI Not Using MCP Server

**Issue**: AI gives generic answers instead of using MCP

**Solutions**:
1. **Explicitly request MCP usage**:
   - "Search Maz-UI documentation for..."
   - "Using the Maz-UI MCP server, show me..."
2. **Check MCP server is enabled** in AI settings
3. **Verify hammer (MCP) icon** appears in UI

---

## Advanced Configuration

### Custom Installation Path

**Problem**: Don't want to use npx (prefer global installation)

**Solution**:

1. **Install globally**:
   ```bash
   npm install -g @maz-ui/mcp
   ```

2. **Update configuration**:
   ```json
   {
     "mcpServers": {
       "maz-ui": {
         "command": "maz-ui-mcp",
         "args": []
       }
     }
   }
   ```

---

### Multiple Projects

**Problem**: Different Maz-UI versions across projects

**Solution**: Use **project-scoped configuration**

**Claude Code**:
```bash
# In project directory
claude mcp add maz-ui npx @maz-ui/mcp --scope project
```

Creates `.mcp.json` in project root, not global `~/.mcp.json`.

**Cursor IDE**:
```bash
# Each project has .cursor/mcp.json
```

**VS Code**:
```bash
# Each project has .vscode/mcp.json
```

---

### Offline Usage

**Problem**: Need MCP server without internet

**Solution**:

1. **Cache @maz-ui/mcp**:
   ```bash
   npx @maz-ui/mcp  # Downloads and caches
   ```

2. **Verify cache**:
   ```bash
   ls ~/.npm/_npx
   ```

3. **Offline mode**: npx uses cached version when offline

---

## Benefits Summary

### Before MCP
- ❌ Generic answers from AI training data
- ❌ Outdated documentation (AI cutoff date)
- ❌ No context about current Maz-UI version
- ❌ Manual documentation searching

### After MCP
- ✅ Accurate, up-to-date documentation
- ✅ Current Maz-UI v4 best practices
- ✅ Component-specific examples
- ✅ AI searches documentation for you
- ✅ Integration examples with your stack

### Example Impact

**Without MCP**:
```
User: "How do I validate a form in Maz-UI?"
AI: *Generic Vue form validation answer*
```

**With MCP**:
```
User: "How do I validate a form in Maz-UI?"
AI: *Returns useFormValidator documentation with Valibot schemas,
     validation modes (lazy, aggressive, eager, blur, progressive),
     error handling, TypeScript type inference, real-world examples*
```

---

## Related Documentation

- **[Setup Vue](./setup-vue.md)** - Vue 3 installation with auto-import resolvers
- **[Setup Nuxt](./setup-nuxt.md)** - Nuxt 3 module configuration
- **[Composables](./composables.md)** - All 14+ composables reference
- **[Components Forms](./components-forms.md)** - Form components catalog
- **[Theming](./theming.md)** - v4 theme customization
- **[Troubleshooting](./troubleshooting.md)** - Common issues and fixes

---

## External Resources

- **[@maz-ui/mcp on NPM](https://www.npmjs.com/package/@maz-ui/mcp)** - MCP server package
- **[Official MCP Docs](https://maz-ui.com/guide/mcp)** - Official guide
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - MCP specification
- **[Claude Code MCP Guide](https://docs.anthropic.com/claude/docs/mcp)** - Anthropic's MCP documentation

---

**MCP Server Version**: @maz-ui/mcp (latest)
**Supported Maz-UI Version**: v4.3.3+
**Last Updated**: 2025-12-14

::: tip Recommendation
Enable MCP for all Maz-UI projects to get intelligent, context-aware AI assistance with components, composables, and best practices.
:::
