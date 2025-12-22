/**
 * AI Elements Chat Interface Starter
 * Complete working chat page template
 *
 * Usage:
 * 1. Copy to app/chat/page.tsx
 * 2. Create API route at app/api/chat/route.ts
 * 3. Customize as needed
 */

'use client';

import { useChat } from 'ai/react';
import { Conversation } from '@/components/ui/ai/conversation';
import { Message } from '@/components/ui/ai/message';
import { MessageContent } from '@/components/ui/ai/message-content';
import { Response } from '@/components/ui/ai/response';
import { PromptInput } from '@/components/ui/ai/prompt-input';
import { Actions } from '@/components/ui/ai/actions';
import { Loader } from '@/components/ui/ai/loader';

export default function ChatPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop
  } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background px-4 py-3">
        <h1 className="text-lg font-semibold">AI Chat</h1>
      </header>

      {/* Conversation */}
      <Conversation className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Start a conversation...</p>
          </div>
        )}

        {messages.map((msg) => (
          <Message key={msg.id} role={msg.role}>
            <MessageContent>
              {msg.content && <Response markdown={msg.content} />}

              {/* Show actions for assistant messages */}
              {msg.role === 'assistant' && (
                <Actions>
                  <Actions.Copy content={msg.content} format="markdown" />
                  <Actions.Regenerate onClick={() => reload()} />
                </Actions>
              )}
            </MessageContent>
          </Message>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader size="sm" variant="dots" />
            <span>Thinking...</span>
          </div>
        )}
      </Conversation>

      {/* Input */}
      <div className="border-t border-border bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <PromptInput
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="min-h-[60px] sm:min-h-[48px]"
          />
          {isLoading && (
            <button
              type="button"
              onClick={stop}
              className="mt-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Stop generating
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
