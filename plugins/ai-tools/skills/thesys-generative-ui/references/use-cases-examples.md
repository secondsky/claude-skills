# Use Cases & Examples

## When to Use This Skill

Use this skill when building:

### 1. Chat Interfaces with Rich UI
- Conversational interfaces that need more than text
- Customer support chatbots with forms and actions
- AI assistants that show data visualizations

### 2. Data Visualization Applications
- Analytics dashboards with AI-generated charts
- Business intelligence tools with dynamic tables
- Search interfaces with structured results

### 3. Dynamic Form Generation
- E-commerce product configurators
- Multi-step workflows driven by AI
- Data collection with intelligent forms

### 4. AI Copilots and Assistants
- Developer tools with code snippets and docs
- Educational platforms with interactive lessons
- Research tools with citations and references

### 5. Search and Discovery
- Semantic search with structured results
- Document analysis with highlighted findings
- Knowledge bases with interactive answers

---

## Errors This Skill Prevents

- ❌ Empty agent responses from incorrect streaming setup
- ❌ Models ignoring system prompts due to message array issues
- ❌ Version compatibility errors between SDK and API
- ❌ Themes not applying without ThemeProvider
- ❌ Streaming failures from improper response transformation
- ❌ Tool calling bugs from invalid Zod schemas
- ❌ Thread state loss from missing persistence
- ❌ CSS conflicts from import order issues
- ❌ TypeScript errors from outdated type definitions
- ❌ CORS failures from missing headers
- ❌ Rate limit crashes without retry logic
- ❌ Authentication token errors from environment issues

---

## Templates & Examples

This skill includes 15+ working templates in the `templates/` directory:

### Vite + React (5 templates)
1. **`basic-chat.tsx`** - Minimal C1Chat setup with custom backend
2. **`custom-component.tsx`** - Using C1Component with manual state
3. **`tool-calling.tsx`** - Web search + database query tools
4. **`theme-dark-mode.tsx`** - Custom theming with dark mode toggle
5. **`package.json`** - Exact dependency versions

### Next.js (4 templates)
1. **`app/page.tsx`** - C1Chat page component
2. **`app/api/chat/route.ts`** - Streaming API route handler
3. **`tool-calling-route.ts`** - API route with tool integration
4. **`package.json`** - Next.js dependency setup

### Cloudflare Workers (3 templates)
1. **`worker-backend.ts`** - Hono API with TheSys proxy
2. **`frontend-setup.tsx`** - React frontend configuration
3. **`wrangler.jsonc`** - Worker deployment config

### Shared Utilities (3 templates)
1. **`theme-config.ts`** - Reusable theme configurations
2. **`tool-schemas.ts`** - Common Zod schemas for tools
3. **`streaming-utils.ts`** - Helper functions for streaming

---

## Additional Resources

### Reference Guides

See the `references/` directory for detailed guides:

- **`component-api.md`** - Complete prop reference for all components
- **`ai-provider-setup.md`** - Step-by-step setup for each AI provider
- **`tool-calling-guide.md`** - Comprehensive tool calling patterns
- **`theme-customization.md`** - Theme system deep dive
- **`common-errors.md`** - Expanded error catalog with solutions

### Scripts

- **`scripts/install-dependencies.sh`** - Install all required packages
- **`scripts/check-versions.sh`** - Verify package versions

### Official Documentation

- TheSys Docs: https://docs.thesys.dev
- C1 Playground: https://console.thesys.dev/playground
- GitHub Examples: Search for "thesysai" on GitHub
- Context7: `/websites/thesys_dev`

---

**Note**: All templates use Bun as the preferred package manager. Use `bun install` instead of `npm install` for faster installation and better performance.
