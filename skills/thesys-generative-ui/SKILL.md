---
name: thesys-generative-ui
description: AI-powered generative UI with Thesys - create React components from natural language.
license: MIT
---

# Thesys Generative UI

**Last Updated**: 2025-11-10

## Quick Start

```typescript
import { generateUI } from 'thesys';

const ui = await generateUI({
  prompt: 'Create a user profile card with avatar, name, and email',
  schema: {
    type: 'component',
    props: ['name', 'email', 'avatar']
  }
});

export default function Profile() {
  return <div>{ui}</div>;
}
```

## Core Features

- **Natural Language**: Describe UI in plain English
- **Schema-Driven**: Type-safe component generation
- **React Components**: Generate production-ready components
- **AI-Powered**: Uses LLMs for intelligent design

## Example

```typescript
const form = await generateUI({
  prompt: 'Create a contact form with name, email, and message fields',
  theme: 'modern'
});
```

## Resources

- `templates/basic-usage.tsx` - Usage examples
- `references/error-catalog.md` - Common errors

**Docs**: https://thesys.io
