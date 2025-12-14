# File Attachments Guide

**Purpose**: Add file upload and attachment support to chat interfaces. Handle images, PDFs, and other file types in messages.

**Use When**: Building chat UIs that need to accept file uploads (images for vision models, PDFs for document analysis, etc.).

---

### File Attachments

Upload files (images, PDFs, etc.) alongside messages:

```tsx
'use client';
import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function ChatWithAttachments() {
  const { messages, sendMessage, isLoading } = useChat({ api: '/api/chat' });
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    sendMessage({
      content: input,
      experimental_attachments: files
        ? Array.from(files).map(file => ({
            name: file.name,
            contentType: file.type,
            url: URL.createObjectURL(file),
          }))
        : undefined,
    });

    setInput('');
    setFiles(null);
  };

  return (
    <div>
      {/* Messages */}
      {messages.map(m => (
        <div key={m.id}>
          {m.content}
          {m.experimental_attachments?.map((att, idx) => (
            <div key={idx}>
              <img src={att.url} alt={att.name} />
            </div>
          ))}
        </div>
      ))}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          accept="image/*"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

---

**Related References**:
- `references/hooks-api-full.md` - Full useChat API with attachment handling
- `references/best-practices.md` - File upload optimization and security
- `references/route-handlers.md` - Server-side file processing setup
