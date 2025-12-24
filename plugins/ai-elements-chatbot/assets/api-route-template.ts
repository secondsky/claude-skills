/**
 * AI Elements API Route Template
 * Complete API route with all AI SDK v5 features
 *
 * Usage:
 * 1. Copy to app/api/chat/route.ts
 * 2. Install AI SDK: pnpm add ai @ai-sdk/openai
 * 3. Set OPENAI_API_KEY in .env
 * 4. Customize model, tools, and features as needed
 */

import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Example: Basic streaming
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
  });

  return result.toDataStreamResponse();
}

// Example: With tool calling
/*
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    tools: {
      get_weather: tool({
        description: 'Get current weather for a location',
        parameters: z.object({
          location: z.string().describe('City name'),
          unit: z.enum(['celsius', 'fahrenheit']).default('celsius')
        }),
        execute: async ({ location, unit }) => {
          // Call weather API
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${location}`
          );
          const data = await response.json();

          return {
            temperature: unit === 'celsius' ? data.current.temp_c : data.current.temp_f,
            conditions: data.current.condition.text,
            location: data.location.name
          };
        }
      }),

      search_database: tool({
        description: 'Search internal knowledge base',
        parameters: z.object({
          query: z.string()
        }),
        execute: async ({ query }) => {
          // Search your database
          const results = await db.search(query);
          return results;
        }
      })
    }
  });

  return result.toDataStreamResponse();
}
*/

// Example: With system prompt and max tokens
/*
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful AI assistant. Be concise and accurate.',
    messages,
    maxTokens: 1000,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}
*/

// Example: With error handling
/*
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages', { status: 400 });
    }

    const result = streamText({
      model: openai('gpt-4o'),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
*/

// Example: With authentication (Clerk)
/*
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are assisting user ${userId}. Be helpful and personalized.`,
    messages,
  });

  return result.toDataStreamResponse();
}
*/

// Example: With RAG (Retrieval-Augmented Generation)
/*
export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // Retrieve relevant documents
  const docs = await vectorStore.similaritySearch(lastMessage, 3);
  const context = docs.map(doc => doc.pageContent).join('\n\n');

  const result = streamText({
    model: openai('gpt-4o'),
    system: `Answer based on this context:\n\n${context}`,
    messages,
  });

  return result.toDataStreamResponse();
}
*/
