import { useConversation } from '@elevenlabs/react-native';
import { View, Button, Text, ScrollView } from 'react-native';
import { z } from 'zod';
import { useState } from 'react';

export default function VoiceAgent() {
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);

  const { startConversation, stopConversation, status } = useConversation({
    agentId: process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID!,

    // Use signed URL (most secure)
    signedUrl: async () => {
      try {
        // TODO: Replace with your actual API endpoint
        const response = await fetch('https://your-api.com/elevenlabs/auth');

        if (!response.ok) {
          throw new Error(`Auth failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.signedUrl) {
          throw new Error('Missing signedUrl in response');
        }

        return data.signedUrl;
      } catch (error) {
        console.error('Failed to get signed URL:', error);
        throw error;
      }
    },

    clientTools: {
      updateProfile: {
        description: "Update user profile",
        parameters: z.object({
          name: z.string()
        }),
        handler: async ({ name }) => {
          console.log('Updating profile:', name);
          return { success: true };
        }
      }
    },

    onEvent: (event) => {
      if (event.type === 'transcript') {
        setTranscript(prev => [...prev, { role: 'user', text: event.data.text }]);
      } else if (event.type === 'agent_response') {
        setTranscript(prev => [...prev, { role: 'agent', text: event.data.text }]);
      }
    }
  });

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Voice Agent</Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <Button title="Start" onPress={startConversation} disabled={status === 'connected'} />
        <Button title="Stop" onPress={stopConversation} disabled={status !== 'connected'} />
      </View>

      <Text>Status: {status}</Text>

      <ScrollView style={{ marginTop: 20, maxHeight: 400 }}>
        {transcript.map((msg, i) => (
          <View key={i} style={{ padding: 10, marginBottom: 10, backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5' }}>
            <Text style={{ fontWeight: 'bold' }}>{msg.role === 'user' ? 'You' : 'Agent'}</Text>
            <Text>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
