# AI Elements Complete Component Catalog

**Version**: 1.6.0
**Last Updated**: 2025-11-07
**Source**: https://www.shadcn.io/ai

---

## Installation Commands

```bash
# Core chat components
pnpm dlx ai-elements@latest add message
pnpm dlx ai-elements@latest add message-content
pnpm dlx ai-elements@latest add conversation
pnpm dlx ai-elements@latest add response

# Input components
pnpm dlx ai-elements@latest add prompt-input
pnpm dlx ai-elements@latest add actions
pnpm dlx ai-elements@latest add suggestion

# AI-specific features
pnpm dlx ai-elements@latest add tool
pnpm dlx ai-elements@latest add reasoning
pnpm dlx ai-elements@latest add sources
pnpm dlx ai-elements@latest add inline-citation

# Code and media
pnpm dlx ai-elements@latest add code-block
pnpm dlx ai-elements@latest add image
pnpm dlx ai-elements@latest add web-preview

# Advanced features
pnpm dlx ai-elements@latest add branch
pnpm dlx ai-elements@latest add task
pnpm dlx ai-elements@latest add loader
```

---

## Core Message Components

### Message
**Purpose**: Container for single chat message with role-based styling
**Import**: `import { Message } from '@/components/ui/ai/message'`
**Props**:
- `role: 'user' | 'assistant' | 'system'` - Message role
- `children: ReactNode` - Message content
- `className?: string` - Additional CSS classes

**Usage**:
```tsx
<Message role="user">
  <MessageContent>Hello!</MessageContent>
</Message>
```

---

### MessageContent
**Purpose**: Wrapper for message parts (text, tools, reasoning, etc.)
**Import**: `import { MessageContent } from '@/components/ui/ai/message-content'`
**Props**:
- `children: ReactNode` - Content parts
- `className?: string` - Additional CSS classes

**Usage**:
```tsx
<MessageContent>
  <Response markdown={text} />
  {tool && <Tool {...tool} />}
  {reasoning && <Reasoning content={reasoning} />}
</MessageContent>
```

---

### Response
**Purpose**: Streaming-optimized markdown renderer with syntax highlighting
**Import**: `import { Response } from '@/components/ui/ai/response'`
**Props**:
- `markdown: string` - Markdown content to render
- `streaming?: boolean` - Whether content is currently streaming
- `onComplete?: () => void` - Callback when streaming completes
- `components?: object` - Custom component overrides
- `className?: string` - Additional CSS classes

**Features**:
- Real-time markdown rendering during streaming
- Syntax highlighting for code blocks
- LaTeX/math support
- Table rendering
- Optimized for AI SDK's streaming format

**Usage**:
```tsx
<Response
  markdown={content}
  streaming={isStreaming}
  onComplete={() => console.log('Done')}
/>
```

---

### Conversation
**Purpose**: Auto-scrolling chat container maintaining scroll position during streaming
**Import**: `import { Conversation } from '@/components/ui/ai/conversation'`
**Props**:
- `children: ReactNode` - Message components
- `className?: string` - Additional CSS classes

**Features**:
- Auto-scroll to bottom during streaming
- Maintains scroll position when user scrolls up
- Virtualization support for long conversations
- Sticky timestamp headers

**Usage**:
```tsx
<Conversation>
  {messages.map(msg => (
    <Message key={msg.id} role={msg.role}>
      <MessageContent>
        <Response markdown={msg.content} />
      </MessageContent>
    </Message>
  ))}
</Conversation>
```

---

## Input & Interaction Components

### PromptInput
**Purpose**: Auto-resizing textarea with toolbar, keyboard shortcuts, and voice input
**Import**: `import { PromptInput } from '@/components/ui/ai/prompt-input'`
**Props**:
- `value: string` - Input value
- `onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void` - Change handler
- `onSubmit: (e: FormEvent) => void` - Submit handler
- `placeholder?: string` - Placeholder text
- `disabled?: boolean` - Disable input
- `enableSpeech?: boolean` - Enable voice input (Chrome/Edge only)
- `enableFileUpload?: boolean` - Enable file upload
- `maxLength?: number` - Character limit
- `className?: string` - Additional CSS classes

**Features**:
- Auto-resize as user types
- Keyboard shortcuts (Cmd+Enter to submit, Shift+Enter for new line)
- Voice input with Web Speech API (Chrome/Edge only)
- File upload support
- Character counter
- Submit button with loading state

**Known Issues**:
- Voice input doesn't work in Firefox/Safari (Web Speech API limitation)
- Responsive design issues on mobile (add `min-h-[100px] sm:min-h-[60px]`)

**Usage**:
```tsx
const isSpeechSupported = typeof window !== 'undefined' &&
  ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

<PromptInput
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  placeholder="Ask me anything..."
  enableSpeech={isSpeechSupported}
  enableFileUpload={true}
  maxLength={4000}
/>
```

---

### Actions
**Purpose**: Interactive button group for message/response operations
**Import**: `import { Actions } from '@/components/ui/ai/actions'`
**Subcomponents**:
- `Actions.Copy` - Copy to clipboard
- `Actions.Regenerate` - Regenerate response
- `Actions.Edit` - Edit message
- `Actions.Delete` - Delete message

**Props** (Actions.Copy):
- `content: string` - Content to copy
- `format?: 'text' | 'markdown'` - Copy format (default: 'text')

**Props** (Actions.Regenerate):
- `onClick: () => void` - Click handler

**Usage**:
```tsx
<Actions>
  <Actions.Copy content={msg.content} format="markdown" />
  <Actions.Regenerate onClick={() => reload()} />
  <Actions.Edit onClick={() => handleEdit(msg.id)} />
  <Actions.Delete onClick={() => handleDelete(msg.id)} />
</Actions>
```

---

### Suggestion
**Purpose**: Scrollable suggestion pills for quick prompts
**Import**: `import { Suggestion } from '@/components/ui/ai/suggestion'`
**Props**:
- `suggestions: string[]` - Array of suggestion text
- `onSelect: (suggestion: string) => void` - Selection handler
- `className?: string` - Additional CSS classes

**Usage**:
```tsx
<Suggestion
  suggestions={[
    'Explain quantum computing',
    'Write a haiku about AI',
    'Help me debug this code'
  ]}
  onSelect={(suggestion) => handleSubmit(suggestion)}
/>
```

---

## AI-Specific Features

### Tool
**Purpose**: Collapsible display for function/tool call execution with status tracking
**Import**: `import { Tool } from '@/components/ui/ai/tool'`
**Props**:
- `name: string` - Tool/function name
- `args: object` - Tool arguments
- `result?: any` - Tool execution result
- `status: 'pending' | 'success' | 'error'` - Execution status
- `className?: string` - Additional CSS classes

**Features**:
- Shows tool name, arguments, and result
- Collapsible (starts collapsed, expandable)
- Status indicators (pending/success/error)
- JSON syntax highlighting for args/result
- Timestamp display

**Usage**:
```tsx
<Tool
  name="get_weather"
  args={{ location: "San Francisco", unit: "celsius" }}
  result={{ temperature: 18, conditions: "Cloudy" }}
  status="success"
/>
```

---

### Reasoning
**Purpose**: Collapsible "thinking" process display with auto-streaming behavior
**Import**: `import { Reasoning } from '@/components/ui/ai/reasoning'`
**Props**:
- `content: string` - Reasoning/thinking text
- `streaming?: boolean` - Whether currently streaming
- `collapsed?: boolean` - Start collapsed (default: true)
- `className?: string` - Additional CSS classes

**Features**:
- Shows AI's reasoning/thinking process (like Claude's thinking, o1's reasoning)
- Auto-expands during streaming
- Auto-collapses after streaming completes
- Markdown rendering
- Token count display

**Known Issue**:
- Long responses can duplicate thinking blocks (#106) - merge consecutive blocks client-side

**Usage**:
```tsx
const isStreaming = isLoading && idx === messages.length - 1;

<Reasoning
  content={thinkingProcess}
  streaming={isStreaming}
  collapsed={!isStreaming}
/>
```

---

### Sources
**Purpose**: Expandable citation display for referenced content
**Import**: `import { Sources } from '@/components/ui/ai/sources'`
**Props**:
- `sources: Source[]` - Array of source objects
- `citations: string[]` - Array of cited source IDs
- `className?: string` - Additional CSS classes

**Source type**:
```typescript
type Source = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
};
```

**Features**:
- Expandable source list
- Click to view full source
- Highlight cited sources
- Snippet preview
- Integrates with InlineCitation component

**Usage**:
```tsx
<Sources
  sources={[
    { id: '1', title: 'Wikipedia - AI', url: 'https://...', snippet: '...' },
    { id: '2', title: 'Research Paper', url: 'https://...', snippet: '...' }
  ]}
  citations={['1', '2']}
/>
```

---

### InlineCitation
**Purpose**: Hover-preview citations (Perplexity-style)
**Import**: `import { InlineCitation } from '@/components/ui/ai/inline-citation'`
**Props**:
- `sourceId: string` - Source ID to reference
- `className?: string` - Additional CSS classes

**Features**:
- Superscript citation numbers
- Hover to preview source
- Click to scroll to full source in Sources component

**Usage**:
```tsx
<p>
  AI is transforming software development
  <InlineCitation sourceId="1" /> and many other fields
  <InlineCitation sourceId="2" />.
</p>
```

---

## Code and Media Components

### CodeBlock
**Purpose**: Syntax-highlighted code with copy functionality
**Import**: `import { CodeBlock } from '@/components/ui/ai/code-block'`
**Props**:
- `language: string` - Programming language
- `code: string` - Code content
- `filename?: string` - Filename to display
- `showLineNumbers?: boolean` - Show line numbers (default: false)
- `className?: string` - Additional CSS classes

**Features**:
- Syntax highlighting (via Prism or Shiki)
- Copy to clipboard button
- Line numbers (optional)
- Filename display
- Language badge

**Usage**:
```tsx
<CodeBlock
  language="typescript"
  code={`function greet(name: string) {
  console.log(\`Hello, \${name}!\`);
}`}
  filename="greet.ts"
  showLineNumbers={true}
/>
```

---

### Image
**Purpose**: Display handler for AI-generated images with loading states
**Import**: `import { Image } from '@/components/ui/ai/image'`
**Props**:
- `src: string` - Image URL
- `alt: string` - Alt text
- `loading?: boolean` - Show loading state
- `prompt?: string` - Generation prompt to display
- `className?: string` - Additional CSS classes

**Features**:
- Loading skeleton
- Error handling
- Lightbox/zoom on click
- Prompt display
- Download button

**Usage**:
```tsx
<Image
  src={imageUrl}
  alt="AI generated image"
  loading={isGenerating}
  prompt="A serene mountain landscape at sunset"
/>
```

---

### WebPreview
**Purpose**: Iframe viewer for AI-generated websites/HTML
**Import**: `import { WebPreview } from '@/components/ui/ai/web-preview'`
**Props**:
- `html: string` - HTML content to display
- `sandbox?: boolean` - Enable iframe sandbox (default: true)
- `height?: number` - Iframe height in pixels (default: 600)
- `className?: string` - Additional CSS classes

**Features**:
- Sandboxed iframe (security)
- Responsive height
- Reload button
- Open in new tab button

**Usage**:
```tsx
<WebPreview
  html={generatedHTML}
  sandbox={true}
  height={600}
/>
```

---

## Advanced Features

### Branch
**Purpose**: Navigation between multiple AI response variations
**Import**: `import { Branch } from '@/components/ui/ai/branch'`
**Props**:
- `branches: Branch[]` - Array of branch objects
- `currentBranch: string` - Current branch ID
- `onBranchChange: (branchId: string) => void` - Branch change handler
- `className?: string` - Additional CSS classes

**Branch type**:
```typescript
type Branch = {
  id: string;
  content: string;
};
```

**Features**:
- Navigate between multiple AI responses
- Visual branch indicator
- Keyboard navigation (arrows)
- Branch comparison view

**Usage**:
```tsx
<Branch
  branches={[
    { id: '1', content: 'Response option 1' },
    { id: '2', content: 'Response option 2' },
    { id: '3', content: 'Response option 3' }
  ]}
  currentBranch={currentBranchId}
  onBranchChange={(branchId) => setCurrentBranch(branchId)}
/>
```

---

### Task
**Purpose**: Progress-tracking task lists with file references
**Import**: `import { Task } from '@/components/ui/ai/task'`
**Props**:
- `tasks: Task[]` - Array of task objects
- `onTaskToggle: (taskId: string) => void` - Task toggle handler
- `className?: string` - Additional CSS classes

**Task type**:
```typescript
type Task = {
  id: string;
  title: string;
  completed: boolean;
  files?: string[];
};
```

**Features**:
- Checkbox completion tracking
- File reference links
- Progress bar
- Collapsible subtasks

**Usage**:
```tsx
<Task
  tasks={[
    { id: '1', title: 'Create component', completed: true, files: ['Button.tsx'] },
    { id: '2', title: 'Add tests', completed: false, files: ['Button.test.tsx'] },
    { id: '3', title: 'Update docs', completed: false, files: ['README.md'] }
  ]}
  onTaskToggle={(taskId) => toggleTask(taskId)}
/>
```

---

### Loader
**Purpose**: Loading spinner for streaming/processing states
**Import**: `import { Loader } from '@/components/ui/ai/loader'`
**Props**:
- `size?: 'sm' | 'md' | 'lg'` - Loader size (default: 'md')
- `variant?: 'spinner' | 'dots' | 'pulse'` - Loader style (default: 'spinner')
- `className?: string` - Additional CSS classes

**Usage**:
```tsx
<Loader size="md" variant="dots" />
```

---

## Component Hierarchy

```
Conversation (container)
  └─ Message (single message)
      └─ MessageContent (content wrapper)
          ├─ Reasoning (thinking process - optional)
          ├─ Response (main text content)
          ├─ Tool (function calls - optional, multiple)
          ├─ CodeBlock (code snippets - optional, multiple)
          ├─ Image (generated images - optional, multiple)
          ├─ Task (task lists - optional)
          ├─ Sources (citations - optional)
          └─ Actions (copy/regenerate buttons)
```

---

## Quick Reference: Most Used Components

### Basic Chat (5 components)
```bash
pnpm dlx ai-elements@latest add message message-content conversation response prompt-input
```

### Chat with Actions (6 components)
```bash
pnpm dlx ai-elements@latest add message message-content conversation response prompt-input actions
```

### Chat with Tool Calling (7 components)
```bash
pnpm dlx ai-elements@latest add message message-content conversation response prompt-input actions tool
```

### Chat with Reasoning (8 components)
```bash
pnpm dlx ai-elements@latest add message message-content conversation response prompt-input actions tool reasoning
```

### Full-Featured Chat (12+ components)
```bash
pnpm dlx ai-elements@latest add message message-content conversation response prompt-input actions tool reasoning sources inline-citation code-block loader
```

---

**Total Components**: 30+
**All Open Source**: Apache 2.0 License
**Full Code Ownership**: Components copied to your project (shadcn model)

---

**Last Updated**: 2025-11-07
**AI Elements Version**: 1.6.0
