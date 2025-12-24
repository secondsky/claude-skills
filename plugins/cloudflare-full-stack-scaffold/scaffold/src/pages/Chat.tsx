/**
 * Chat Page (Optional AI Chat)
 *
 * By default, this page is disabled.
 * Run `npm run enable-ai-chat` to uncomment and enable AI chat functionality.
 *
 * Uses the ChatInterface component with AI SDK's useChat hook.
 */

/* AI CHAT START
import { ChatInterface } from '@/components/ChatInterface'
AI CHAT END */

export function Chat() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* AI CHAT START */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <h1 className="text-3xl font-bold mb-4">AI Chat (Disabled)</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page is currently disabled. To enable AI chat functionality:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <code className="text-sm">npm run enable-ai-chat</code>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will uncomment the AI SDK integration and enable streaming chat with Workers AI.
          </p>
        </div>
      </div>
      {/* AI CHAT END */}

      {/* AI CHAT START
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">AI Chat</h1>
        <div className="h-[600px]">
          <ChatInterface />
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Powered by Workers AI (free tier). Switch to OpenAI or Anthropic by configuring
            API keys in .dev.vars and updating backend/routes/ai-sdk.ts
          </p>
        </div>
      </div>
      AI CHAT END */}
    </div>
  )
}
