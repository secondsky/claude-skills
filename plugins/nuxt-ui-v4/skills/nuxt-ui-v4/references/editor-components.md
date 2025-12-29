# Editor Components Reference

Nuxt UI v4 provides 6 components for rich text editing based on TipTap.

## Component Overview

| Component | Purpose |
|-----------|---------|
| Editor | Main TipTap editor |
| EditorToolbar | Formatting toolbar |
| EditorDragHandle | Block reordering |
| EditorMentionMenu | @ mentions |
| EditorEmojiMenu | Emoji picker |
| EditorSuggestionMenu | / commands |

## Installation

```bash
bun add @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-placeholder
```

## Basic Setup

```vue
<script setup lang="ts">
const content = ref('')
</script>

<template>
  <UEditor v-model="content">
    <template #toolbar>
      <UEditorToolbar />
    </template>
  </UEditor>
</template>
```

## Editor

Main editor component wrapping TipTap.

### Props

```ts
interface EditorProps {
  modelValue?: string          // Content (HTML, Markdown, or JSON)
  format?: 'html' | 'markdown' | 'json'  // Content format
  extensions?: Extension[]     // TipTap extensions
  editable?: boolean          // Enable editing (default: true)
  autofocus?: boolean | 'start' | 'end'
  placeholder?: string        // Placeholder text
}
```

### Events

- `@update:modelValue` - Content change
- `@focus` - Editor focused
- `@blur` - Editor blurred
- `@create` - Editor created (provides editor instance)

### Slots

- `toolbar` - Toolbar area
- `default` - Additional content

### Usage

```vue
<script setup>
import { StarterKit } from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const content = ref('<p>Hello world</p>')

const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: 'Start typing...'
  })
]
</script>

<template>
  <UEditor
    v-model="content"
    format="html"
    :extensions="extensions"
    autofocus="end"
  >
    <template #toolbar>
      <UEditorToolbar />
    </template>
  </UEditor>
</template>
```

## EditorToolbar

Formatting toolbar with multiple display modes.

### Props

```ts
interface EditorToolbarProps {
  mode?: 'fixed' | 'bubble' | 'floating'  // Display mode
  items?: ToolbarItem[]       // Custom toolbar items
}
```

### Toolbar Modes

- `fixed` - Always visible above editor
- `bubble` - Appears on text selection
- `floating` - Follows cursor position

### Default Items

```ts
const defaultItems = [
  { type: 'bold', icon: 'i-heroicons-bold' },
  { type: 'italic', icon: 'i-heroicons-italic' },
  { type: 'underline', icon: 'i-heroicons-underline' },
  { type: 'strike', icon: 'i-heroicons-strikethrough' },
  { type: 'separator' },
  { type: 'heading', level: 1 },
  { type: 'heading', level: 2 },
  { type: 'heading', level: 3 },
  { type: 'separator' },
  { type: 'bulletList', icon: 'i-heroicons-list-bullet' },
  { type: 'orderedList', icon: 'i-heroicons-numbered-list' },
  { type: 'separator' },
  { type: 'link', icon: 'i-heroicons-link' },
  { type: 'image', icon: 'i-heroicons-photo' },
  { type: 'code', icon: 'i-heroicons-code-bracket' },
  { type: 'codeBlock', icon: 'i-heroicons-code-bracket-square' }
]
```

### Custom Toolbar

```vue
<UEditorToolbar
  mode="bubble"
  :items="[
    { type: 'bold' },
    { type: 'italic' },
    { type: 'separator' },
    { type: 'link' },
    {
      type: 'custom',
      icon: 'i-heroicons-sparkles',
      action: () => enhanceWithAI()
    }
  ]"
/>
```

## EditorDragHandle

Draggable handle for block reordering.

### Usage

```vue
<UEditor v-model="content">
  <template #drag-handle>
    <UEditorDragHandle />
  </template>
</UEditor>
```

## EditorMentionMenu

Shows user suggestions when typing `@`.

### Props

```ts
interface EditorMentionMenuProps {
  items?: MentionItem[]       // Suggestion items
  command?: (item: MentionItem) => void  // Selection handler
}
```

### Usage

```vue
<script setup>
const users = [
  { id: '1', label: 'John Doe', avatar: '/john.jpg' },
  { id: '2', label: 'Jane Smith', avatar: '/jane.jpg' }
]

function onMentionSelect(user) {
  // Insert mention
}
</script>

<template>
  <UEditor v-model="content">
    <template #mention-menu="{ items, command }">
      <UEditorMentionMenu
        :items="items"
        :command="command"
      />
    </template>
  </UEditor>
</template>
```

## EditorEmojiMenu

Shows emoji suggestions when typing `:`.

### Usage

```vue
<UEditor v-model="content">
  <template #emoji-menu="{ items, command }">
    <UEditorEmojiMenu
      :items="items"
      :command="command"
    />
  </template>
</UEditor>
```

## EditorSuggestionMenu

Shows command suggestions when typing `/`.

### Props

```ts
interface EditorSuggestionMenuProps {
  items?: SuggestionItem[]
  command?: (item: SuggestionItem) => void
}
```

### Usage

```vue
<script setup>
const suggestions = [
  { id: 'heading1', label: 'Heading 1', icon: 'i-heroicons-h1' },
  { id: 'heading2', label: 'Heading 2', icon: 'i-heroicons-h2' },
  { id: 'bullet', label: 'Bullet List', icon: 'i-heroicons-list-bullet' },
  { id: 'code', label: 'Code Block', icon: 'i-heroicons-code-bracket' }
]
</script>

<template>
  <UEditor v-model="content">
    <template #suggestion-menu="{ items, command }">
      <UEditorSuggestionMenu
        :items="items"
        :command="command"
      />
    </template>
  </UEditor>
</template>
```

## TipTap Extensions

### Common Extensions

```ts
import { StarterKit } from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { lowlight } from 'lowlight'

const extensions = [
  StarterKit.configure({
    codeBlock: false // Using CodeBlockLowlight instead
  }),
  Placeholder.configure({
    placeholder: 'Start writing...'
  }),
  Link.configure({
    openOnClick: false
  }),
  Image,
  CodeBlockLowlight.configure({
    lowlight
  })
]
```

### Custom Extension

```ts
import { Extension } from '@tiptap/core'

const CustomExtension = Extension.create({
  name: 'custom',

  addCommands() {
    return {
      customCommand: () => ({ commands }) => {
        // Custom command logic
      }
    }
  }
})
```

## Content Formats

### HTML Format

```vue
<UEditor
  v-model="htmlContent"
  format="html"
/>

<!-- htmlContent: '<p>Hello <strong>world</strong></p>' -->
```

### Markdown Format

```vue
<UEditor
  v-model="markdownContent"
  format="markdown"
/>

<!-- markdownContent: 'Hello **world**' -->
```

### JSON Format

```vue
<UEditor
  v-model="jsonContent"
  format="json"
/>

<!-- jsonContent: { type: 'doc', content: [...] } -->
```

## Theming

```ts
export default defineAppConfig({
  ui: {
    editor: {
      base: 'prose prose-sm dark:prose-invert max-w-none',
      slots: {
        root: 'border border-default rounded-lg',
        content: 'p-4 min-h-[200px] focus:outline-none'
      }
    },
    editorToolbar: {
      base: 'flex items-center gap-1 p-2 border-b border-default',
      item: 'p-2 rounded hover:bg-elevated'
    }
  }
})
```

## Common Patterns

### Editor with Image Upload

```vue
<script setup>
async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })

  const { url } = await response.json()
  return url
}
</script>

<template>
  <UEditor v-model="content" @image-upload="uploadImage" />
</template>
```

### Read-Only Mode

```vue
<UEditor
  :model-value="content"
  :editable="false"
/>
```

### Collaborative Editing

```ts
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('wss://example.com', 'room', ydoc)

const extensions = [
  StarterKit.configure({ history: false }),
  Collaboration.configure({ document: ydoc }),
  CollaborationCursor.configure({
    provider,
    user: { name: 'User', color: '#ff0000' }
  })
]
```
