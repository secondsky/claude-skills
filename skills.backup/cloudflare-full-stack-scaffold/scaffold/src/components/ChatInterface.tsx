/**
 * Chat Interface Component (Optional AI Chat)
 *
 * By default, this component shows a placeholder.
 * Run `npm run enable-ai-chat` to uncomment the AI chat implementation.
 *
 * Uses AI SDK v5 useChat hook for streaming chat with the backend.
 * Works with /api/ai-sdk/chat route (Workers AI by default).
 *
 * Usage:
 *   <ChatInterface />
 */

/* AI CHAT START
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
AI CHAT END */
import { useState } from 'react'

export function ChatInterface() {
  const [input, setInput] = useState('')

  /* AI CHAT START
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai-sdk/chat',
    }),
  })
  AI CHAT END */

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      {/* AI CHAT START */}
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">AI Chat (Disabled)</h2>
        <p className="text-gray-600 mb-4">
          Run <code className="bg-gray-100 px-2 py-1 rounded">npm run enable-ai-chat</code> to enable AI chat.
        </p>
        <p className="text-sm text-gray-500">
          This will uncomment the AI SDK integration and enable streaming chat.
        </p>
      </div>
      {/* AI CHAT END */}

      {/* AI CHAT START
      {/* Chat messages *\/}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Start a conversation with the AI
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <div className="text-sm font-semibold mb-1">
                {message.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className="whitespace-pre-wrap">
                {message.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return <span key={i}>{part.text}</span>
                  }
                  return null
                })}
              </div>
            </div>
          </div>
        ))}

        {(status === 'streaming' || status === 'submitted') && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                <span>AI is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat input *\/}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={async e => {
            if (e.key === 'Enter' && status === 'ready' && input.trim()) {
              sendMessage({ text: input })
              setInput('')
            }
          }}
          placeholder="Type your message and press Enter..."
          disabled={status !== 'ready'}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={() => {
            if (status === 'ready' && input.trim()) {
              sendMessage({ text: input })
              setInput('')
            }
          }}
          disabled={status !== 'ready' || !input.trim()}
          className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
      AI CHAT END */}
    </div>
  )
}

/* AI CHAT START
/**
 * Simple Message Component
 *
 * Alternative to inline rendering for better organization.
 * Note: AI SDK v5 uses message.parts[] instead of message.content
 */
interface MessageProps {
  role: 'user' | 'assistant'
  parts: Array<{ type: string; text?: string }>
}

function Message({ role, parts }: MessageProps) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-900'
        }`}
      >
        <div className="text-sm font-semibold mb-1">
          {role === 'user' ? 'You' : 'AI'}
        </div>
        <div className="whitespace-pre-wrap">
          {parts.map((part, i) => {
            if (part.type === 'text' && part.text) {
              return <span key={i}>{part.text}</span>
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}
AI CHAT END */
