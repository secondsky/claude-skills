## File Attachments Guide

**Purpose**: Add file upload and attachment support to chat interfaces. Handle image file attachments in messages.

**Use When**: Building chat UIs that need to accept image uploads for vision models.

---

## File Attachments

Upload files (images, PDFs, etc.) alongside messages:

```tsx
'use client';
import { useChat } from 'ai/react';
import { useState, FormEvent, useRef, useEffect } from 'react';

export default function ChatWithAttachments() {
  const { messages, append, isLoading } = useChat({ api: '/api/chat' });
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const createdUrls = useRef<string[]>([]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Create URLs and track them
    const attachmentUrls = files
      ? Array.from(files).map(file => {
          const url = URL.createObjectURL(file);
          createdUrls.current.push(url);
          return url;
        })
      : [];

    append({
      role: 'user',
      content: input,
      experimental_attachments: files
        ? attachmentUrls.map((url, i) => ({
            name: files[i].name,
            contentType: files[i].type,
            url
          }))
        : undefined,
    });

    // Clean up URLs after sending
    createdUrls.current.forEach(url => URL.revokeObjectURL(url));
    createdUrls.current = [];

    setInput('');
    setFiles(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      createdUrls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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
