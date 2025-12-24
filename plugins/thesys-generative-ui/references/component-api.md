# Component API Reference

Complete prop reference for all TheSys C1 components.

---

## `<C1Chat>`

Pre-built chat component with state management.

```typescript
import { C1Chat } from "@thesysai/genui-sdk";

<C1Chat
  apiUrl="/api/chat"
  agentName="Assistant"
  logoUrl="https://..."
  theme={themeObject}
  threadManager={threadManager}
  threadListManager={threadListManager}
  customizeC1={{ ... }}
/>
```

**Props**:
- `apiUrl` (required): Backend API endpoint
- `agentName`: Display name for AI
- `logoUrl`: Avatar image URL
- `theme`: Theme configuration object
- `threadManager`: For multi-thread support
- `threadListManager`: For thread list UI
- `customizeC1`: Custom components object

---

## `<C1Component>`

Low-level renderer for custom integration.

```typescript
import { C1Component } from "@thesysai/genui-sdk";

<C1Component
  c1Response={response}
  isStreaming={boolean}
  updateMessage={(msg) => setResponse(msg)}
  onAction={({ llmFriendlyMessage, rawAction }) => {...}}
/>
```

**Props**:
- `c1Response` (required): C1 API response string
- `isStreaming`: Shows loading indicator
- `updateMessage`: Callback for response updates
- `onAction`: Handle user interactions

---

## `<ThemeProvider>`

Theme wrapper component.

```typescript
import { ThemeProvider } from "@thesysai/genui-sdk";

<ThemeProvider theme={customTheme} mode="dark">
  <C1Component {...} />
</ThemeProvider>
```

**Props**:
- `theme`: Theme object
- `mode`: "light" | "dark" | "system"
- `children`: React nodes to wrap

---

For complete details, see SKILL.md.
