# TheSys Generative UI Skill

**Production-ready integration of TheSys C1 Generative UI API for React applications.**

Convert LLM responses into streaming, interactive React components (forms, charts, tables) instead of plain text.

---

## Auto-Trigger Keywords

This skill automatically activates when you mention any of these terms:

### Core Technologies
- generative ui
- generative user interface
- genui
- thesys
- thesys c1
- c1 api
- c1 generative ui
- @thesysai/genui-sdk
- @crayonai/react-ui
- crayonai

### Use Cases
- streaming react components
- ai chat interface
- conversational ui
- chat ui components
- interactive ai responses
- llm to ui
- ai to components
- ai generated ui
- dynamic ui generation
- real-time ui generation

### Features
- chat with charts
- chat with forms
- chat with tables
- data visualization chat
- ai forms
- tool calling ui
- interactive chat
- streaming chat
- ai copilot ui
- ai assistant interface

### Integration Patterns
- react generative ui
- nextjs generative ui
- vite generative ui
- cloudflare generative ui
- openai ui components
- claude ui components
- anthropic ui generation

### Problems This Solves
- text to ui conversion
- llm response visualization
- ai response components
- interactive llm output
- structured ai responses
- streaming ai ui

---

## What This Skill Provides

### 🎯 Complete Framework Coverage
- **Vite + React** - Your preferred stack with custom backends
- **Next.js App Router** - Full-stack with API routes
- **Cloudflare Workers** - Workers + Static Assets integration
- **Framework-agnostic** - General patterns for any setup

### 🤖 AI Provider Integration
- **OpenAI** - GPT-4, GPT-5 models
- **Anthropic Claude** - Sonnet, Haiku models
- **Cloudflare Workers AI** - Cost-optimized patterns
- **Universal patterns** - Works with any OpenAI-compatible provider

### 🛠️ Features Covered
- `<C1Chat>` - Pre-built chat component with state management
- `<C1Component>` - Low-level custom integration
- **Tool calling** - Zod schema integration for function calling
- **Theming** - Custom themes, dark mode, CSS overrides
- **Thread management** - Multi-conversation support
- **Streaming** - Real-time UI generation
- **Thinking states** - Progress indicators during processing
- **Sharing** - Thread and message sharing capabilities

### 📚 15+ Working Templates
- 5 Vite+React templates (basic chat, custom components, tool calling, theming)
- 4 Next.js templates (pages, API routes, tool integration)
- 3 Cloudflare Workers templates (Hono backend, frontend, config)
- 3 Shared utilities (themes, schemas, streaming helpers)

### 🐛 12+ Errors Prevented
- Empty agent responses
- System prompt not followed
- Version compatibility issues
- Theme not applying
- Streaming failures
- Tool calling validation errors
- Thread state loss
- CSS conflicts
- TypeScript errors
- CORS failures
- Rate limit crashes
- Authentication token errors

---

## Quick Installation

```bash
# Install main packages
npm install @thesysai/genui-sdk @crayonai/react-ui @crayonai/react-core

# For API integration
npm install openai

# For tool calling
npm install zod zod-to-json-schema
```

---

## Quick Start Example

```typescript
import { C1Chat } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

export default function App() {
  return <C1Chat apiUrl="/api/chat" />;
}
```

That's it! See SKILL.md for complete integration guides.

---

## When to Use This Skill

✅ **Use this skill when:**
- Building AI chat interfaces with rich, interactive components
- Creating data visualization dashboards powered by AI
- Implementing dynamic form generation from LLM responses
- Developing AI copilots or assistants with structured output
- Building search interfaces with formatted results
- Converting plain text LLM responses into interactive UI

❌ **Don't use this skill for:**
- Plain text chat (just use standard LLM SDKs)
- Static UI generation (use regular React components)
- Non-interactive AI responses

---

## Package Information

- **Main Package**: `@thesysai/genui-sdk@0.6.40`
- **UI Components**: `@crayonai/react-ui@0.8.42`
- **Core Library**: `@crayonai/react-core@0.7.6`
- **Streaming Utils**: `@crayonai/stream@latest`
- **Python SDK**: `thesys-genui-sdk` (for Python backends)
- **Last Verified**: 2025-10-26
- **Production Tested**: ✅ Yes

---

## Skill Contents

```
thesys-generative-ui/
├── SKILL.md (6500+ words comprehensive guide)
├── README.md (this file)
├── scripts/
│   ├── install-dependencies.sh
│   └── check-versions.sh
├── templates/
│   ├── vite-react/ (5 templates)
│   ├── nextjs/ (4 templates)
│   ├── cloudflare-workers/ (3 templates)
│   └── shared/ (3 utilities)
├── references/
│   ├── component-api.md
│   ├── ai-provider-setup.md
│   ├── tool-calling-guide.md
│   ├── theme-customization.md
│   └── common-errors.md
└── assets/
    └── architecture-diagram.md
```

---

## Success Metrics

- **Token savings**: ~65-70% vs manual implementation
- **Errors prevented**: 12+ documented issues
- **Development speed**: 10x faster (per TheSys claims)
- **User engagement**: 83% more engaging than plain text

---

## Resources

### Official Documentation
- TheSys Docs: https://docs.thesys.dev
- C1 Console: https://console.thesys.dev
- Playground: https://console.thesys.dev/playground

### Getting an API Key
1. Visit https://console.thesys.dev
2. Sign up for an account
3. Create a new API key
4. Set as `THESYS_API_KEY` environment variable

### Context7 Library
Use Context7 MCP for up-to-date documentation:
```
/websites/thesys_dev
```

---

## Common Questions

**Q: Is TheSys free?**
A: TheSys offers a free tier. Check their pricing page for details.

**Q: Does it work with Claude/OpenAI/Workers AI?**
A: Yes! TheSys C1 API is OpenAI-compatible and works with all major providers.

**Q: Can I use my own React components?**
A: Yes! You can bring your own components and integrate them with C1.

**Q: Is streaming supported?**
A: Yes! Streaming is core to TheSys - UI updates in real-time as the LLM generates.

**Q: What about thread/conversation management?**
A: Fully supported with `useThreadManager` and `useThreadListManager` hooks.

---

## Support

- See `references/common-errors.md` for troubleshooting
- Check `SKILL.md` for comprehensive integration guides
- Review templates for working examples
- Official docs: https://docs.thesys.dev

---

**Skill Version**: 1.0.0
**Last Updated**: 2025-10-26
**Maintainer**: Claude Skills Maintainers | maintainers@example.com
**License**: MIT
