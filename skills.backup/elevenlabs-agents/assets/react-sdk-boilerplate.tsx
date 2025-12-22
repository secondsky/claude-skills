import { useConversation } from '@elevenlabs/react';
import { z } from 'zod';
import { useState } from 'react';

export default function VoiceAgent() {
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    startConversation,
    stopConversation,
    status,
    isSpeaking
  } = useConversation({
    // Agent Configuration
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,

    // Authentication (choose one)
    // Option 1: API key (for private agents, less secure)
    // apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,

    // Option 2: Signed URL (most secure, recommended for production)
    signedUrl: async () => {
      const response = await fetch('/api/elevenlabs/auth');
      const { signedUrl } = await response.json();
      return signedUrl;
    },

    // Client-side tools (browser functions)
    clientTools: {
      updateCart: {
        description: "Update the shopping cart with items",
        parameters: z.object({
          item: z.string().describe("The item name"),
          quantity: z.number().describe("Quantity to add"),
          action: z.enum(['add', 'remove']).describe("Add or remove item")
        }),
        handler: async ({ item, quantity, action }) => {
          console.log(`${action} ${quantity}x ${item}`);
          // Your cart logic here
          return { success: true, total: 99.99 };
        }
      },

      navigate: {
        description: "Navigate to a different page",
        parameters: z.object({
          url: z.string().url().describe("The URL to navigate to")
        }),
        handler: async ({ url }) => {
          window.location.href = url;
          return { success: true };
        }
      }
    },

    // Event handlers
    onConnect: () => {
      console.log('Connected to agent');
      setTranscript([]);
      setError(null);
    },

    onDisconnect: () => {
      console.log('Disconnected from agent');
    },

    onEvent: (event) => {
      switch (event.type) {
        case 'transcript':
          setTranscript(prev => [
            ...prev,
            { role: 'user', text: event.data.text }
          ]);
          break;

        case 'agent_response':
          setTranscript(prev => [
            ...prev,
            { role: 'agent', text: event.data.text }
          ]);
          break;

        case 'tool_call':
          console.log('Tool called:', event.data.tool_name, event.data.parameters);
          break;

        case 'error':
          console.error('Agent error:', event.data);
          setError(event.data.message);
          break;
      }
    },

    onError: (error) => {
      console.error('Connection error:', error);
      setError(error.message);
    },

    // Regional compliance (for GDPR)
    serverLocation: 'us' // 'us' | 'global' | 'eu-residency' | 'in-residency'
  });

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Voice Agent</h1>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={startConversation}
          disabled={status === 'connected'}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Conversation
        </button>

        <button
          onClick={stopConversation}
          disabled={status !== 'connected'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop
        </button>
      </div>

      {/* Status */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p>Status: <span className="font-semibold">{status}</span></p>
        {isSpeaking && <p className="text-blue-600">Agent is speaking...</p>}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto border rounded p-4 space-y-2">
        <h2 className="font-semibold mb-2">Transcript</h2>

        {transcript.length === 0 ? (
          <p className="text-gray-500">No conversation yet. Click "Start Conversation" to begin.</p>
        ) : (
          transcript.map((message, i) => (
            <div
              key={i}
              className={`p-2 rounded ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-8'
                  : 'bg-gray-100 mr-8'
              }`}
            >
              <p className="text-xs font-semibold mb-1">
                {message.role === 'user' ? 'You' : 'Agent'}
              </p>
              <p>{message.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
