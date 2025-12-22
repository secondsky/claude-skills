/**
 * ElevenLabs Agents - Basic React Integration Template
 * 
 * This template shows the minimal setup for voice chat in a React app.
 * Copy this file and customize for your use case.
 */

import { useConversation } from '@elevenlabs/react';
import { z } from 'zod';
import { useState } from 'react';

export default function VoiceAgentChat() {
  const [transcript, setTranscript] = useState<string[]>([]);

  const { startConversation, stopConversation, status } = useConversation({
    // OPTION 1: Public agent (no authentication needed)
    agentId: 'your-agent-id',

    // OPTION 2: Private agent with API key (NOT RECOMMENDED for production)
    // apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,

    // OPTION 3: Signed URL (RECOMMENDED for production)
    // signedUrl: '/api/elevenlabs/auth',

    // Client-side tools (browser functions the agent can call)
    clientTools: {
      showNotification: {
        description: "Display a notification to the user",
        parameters: z.object({
          message: z.string(),
          type: z.enum(['info', 'success', 'warning', 'error'])
        }),
        handler: async ({ message, type }) => {
          console.log(`Notification (${type}):`, message);
          // Implement your notification logic here
          return { success: true, displayed: message };
        }
      },

      updateUserPreference: {
        description: "Save user preference",
        parameters: z.object({
          key: z.string(),
          value: z.string()
        }),
        handler: async ({ key, value }) => {
          console.log('Saving preference:', key, value);
          // Implement your storage logic here
          return { success: true, saved: { key, value } };
        }
      }
    },

    // Event handlers
    onConnect: () => {
      console.log('Connected to agent');
      setTranscript(prev => [...prev, 'System: Connected']);
    },

    onDisconnect: () => {
      console.log('Disconnected from agent');
      setTranscript(prev => [...prev, 'System: Disconnected']);
    },

    onEvent: (event) => {
      switch (event.type) {
        case 'transcript':
          // User spoke
          console.log('User said:', event.data.text);
          setTranscript(prev => [...prev, `User: ${event.data.text}`]);
          break;

        case 'agent_response':
          // Agent replied
          console.log('Agent replied:', event.data.text);
          setTranscript(prev => [...prev, `Agent: ${event.data.text}`]);
          break;

        case 'tool_call':
          // Agent called a tool
          console.log('Tool called:', event.data.tool_name);
          break;

        case 'error':
          // Error occurred
          console.error('Error:', event.data.message);
          break;
      }
    },

    // Regional compliance (GDPR, data residency)
    serverLocation: 'us', // 'us' | 'global' | 'eu-residency' | 'in-residency'

    // Android-specific delay to prevent audio cutoff (Error #16)
    connectionDelay: {
      android: 3_000,  // 3 seconds for Android
      ios: 0,
      default: 0
    }
  });

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Voice Agent Chat</h1>

      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={startConversation}
          disabled={status === 'connected'}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: status === 'connected' ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: status === 'connected' ? 'not-allowed' : 'pointer'
          }}
        >
          Start Conversation
        </button>

        <button 
          onClick={stopConversation}
          disabled={status !== 'connected'}
          style={{
            padding: '10px 20px',
            backgroundColor: status !== 'connected' ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: status !== 'connected' ? 'not-allowed' : 'pointer'
          }}
        >
          Stop Conversation
        </button>

        <div style={{ marginTop: '10px' }}>
          <strong>Status:</strong> {status}
        </div>
      </div>

      {/* Transcript */}
      <div style={{
        border: '1px solid #ddd',
        padding: '10px',
        borderRadius: '4px',
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>Transcript</h3>
        {transcript.length === 0 ? (
          <p style={{ color: '#999' }}>No messages yet. Start a conversation.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {transcript.map((msg, idx) => (
              <li key={idx} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
                {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * For Next.js API Route (Signed URL Authentication):
 * 
 * // app/api/elevenlabs/auth/route.ts
 * import { ElevenLabsClient } from 'elevenlabs';
 * 
 * export async function POST(req: Request) {
 *   const client = new ElevenLabsClient({
 *     apiKey: process.env.ELEVENLABS_API_KEY  // Server-side only
 *   });
 * 
 *   const signedUrl = await client.convai.getSignedUrl({
 *     agent_id: 'your-agent-id'
 *   });
 * 
 *   return Response.json({ signedUrl });
 * }
 */

/**
 * Installation:
 * npm install @elevenlabs/react zod
 * 
 * Environment Variables (if using API key):
 * NEXT_PUBLIC_ELEVENLABS_API_KEY=your-api-key
 * 
 * For Production:
 * - Use signed URL authentication (Option 3)
 * - Never expose API keys in client code
 * - Test on Android devices for audio cutoff
 * - Configure CSP if needed (see Error #17 in error-catalog.md)
 */
