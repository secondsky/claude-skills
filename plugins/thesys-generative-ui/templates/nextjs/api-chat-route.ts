/**
 * Next.js App Router - API Route for Chat
 *
 * File: app/api/chat/route.ts
 *
 * Handles streaming chat completions with TheSys C1 API.
 *
 * Features:
 * - Streaming responses
 * - OpenAI SDK integration
 * - Error handling
 * - CORS headers
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

// System prompt for the AI
const SYSTEM_PROMPT = `You are a helpful AI assistant that generates interactive user interfaces.
When responding:
- Use clear, concise language
- Generate appropriate UI components (charts, tables, forms) when beneficial
- Ask clarifying questions when needed
- Be friendly and professional`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, previousC1Response } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt" },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.THESYS_API_KEY) {
      console.error("THESYS_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ];

    // If there's previous context, include it
    if (previousC1Response) {
      messages.splice(1, 0, {
        role: "assistant",
        content: previousC1Response,
      });
    }

    // Create streaming completion
    const stream = await client.chat.completions.create({
      model: "c1/openai/gpt-5/v-20250930", // or claude-sonnet-4/v-20250930
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Transform OpenAI stream to C1 format
    const responseStream = transformStream(stream, (chunk) => {
      return chunk.choices[0]?.delta?.content || "";
    }) as ReadableStream<string>;

    return new NextResponse(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: error.message,
          type: error.type,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * Alternative: Using Anthropic (Claude) models
 *
 * const stream = await client.chat.completions.create({
 *   model: "c1/anthropic/claude-sonnet-4/v-20250617",
 *   messages,
 *   stream: true,
 *   temperature: 0.8,
 *   max_tokens: 4096,
 * });
 */

/**
 * Alternative: With message persistence
 *
 * import { db } from "@/lib/db";
 *
 * export async function POST(req: NextRequest) {
 *   const { userId } = auth(); // Clerk, NextAuth, etc.
 *   const { prompt, threadId } = await req.json();
 *
 *   // Save user message
 *   await db.insert(messages).values({
 *     threadId,
 *     userId,
 *     role: "user",
 *     content: prompt,
 *   });
 *
 *   // Get conversation history
 *   const history = await db
 *     .select()
 *     .from(messages)
 *     .where(eq(messages.threadId, threadId))
 *     .orderBy(messages.createdAt);
 *
 *   const llmMessages = history.map((m) => ({
 *     role: m.role,
 *     content: m.content,
 *   }));
 *
 *   const stream = await client.chat.completions.create({
 *     model: "c1/openai/gpt-5/v-20250930",
 *     messages: [{ role: "system", content: SYSTEM_PROMPT }, ...llmMessages],
 *     stream: true,
 *   });
 *
 *   // ... transform and return stream
 *
 *   // Save assistant response after streaming completes
 *   // (You'd need to handle this in the client or use a callback)
 * }
 */
