# React Integration Patterns (TanStack AI)

## Minimal hook usage
```tsx
const { messages, sendMessage, isLoading } = useChat({
  connection: fetchServerSentEvents('/api/chat'),
  tools: clientTools(showToast),
})
```

## Local UI state + optimistic send
```tsx
const [input, setInput] = useState('')
const { sendMessage, isLoading } = useChat({...})

function onSubmit(e) {
  e.preventDefault()
  sendMessage(input, { experimental_optimisticResponse: true })
  setInput('')
}
```

## Rendering tool approvals
```tsx
const { approval } = useChat({...})
return approval?.pending ? (
  <>
    <p>{approval.toolCall.name} wants to run.</p>
    <button onClick={() => approval.approve()}>Approve</button>
    <button onClick={() => approval.reject()}>Reject</button>
  </>
) : null
```

## Error boundaries
Wrap chat UI with an error boundary to catch stream/tool errors and allow retry.

## Suspense-friendly
`useChat` can coexist with React Suspense data fetching; keep chat state isolated to avoid tearing.

## Devtools (DIY for now)
Add console logging on `onChunk` to inspect partial deltas during development:
```tsx
useChat({
  ...,
  onChunk(chunk) {
    console.debug('chunk', chunk.delta)
  },
})
```

## Keyboard UX
- `Enter` to send, `Shift+Enter` for newline.
- Disable send while `isLoading` to avoid concurrent runs, or queue messages manually.

## Styling tips
- Keep messages array as single source of truth; derive UI (roles, tool outputs) from it.
- Render tool call results inline: when a message has `toolResult`, show a compact card with status and payload.
