/**
 * Cloudflare Worker Backend with Hono + TheSys C1
 *
 * File: backend/src/index.ts
 *
 * Features:
 * - Hono routing
 * - TheSys C1 API proxy
 * - Streaming support
 * - Static assets serving
 * - CORS handling
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/cloudflare-workers";

type Bindings = {
  THESYS_API_KEY: string;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// ============================================================================
// Chat API Endpoint
// ============================================================================

app.post("/api/chat", async (c) => {
  try {
    const { prompt, previousC1Response } = await c.req.json();

    if (!prompt || typeof prompt !== "string") {
      return c.json({ error: "Invalid prompt" }, 400);
    }

    // Check API key binding
    if (!c.env.THESYS_API_KEY) {
      console.error("THESYS_API_KEY binding not found");
      return c.json({ error: "Server configuration error" }, 500);
    }

    // Build messages
    const messages = [
      {
        role: "system",
        content: "You are a helpful AI assistant that generates interactive UI.",
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    if (previousC1Response) {
      messages.splice(1, 0, {
        role: "assistant",
        content: previousC1Response,
      });
    }

    // Call TheSys C1 API
    const response = await fetch(
      "https://api.thesys.dev/v1/embed/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${c.env.THESYS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "c1/openai/gpt-5/v-20250930",
          messages,
          stream: false, // Or handle streaming
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("TheSys API Error:", error);
      return c.json(
        { error: "Failed to get AI response" },
        response.status
      );
    }

    const data = await response.json();

    return c.json({
      response: data.choices[0]?.message?.content || "",
      usage: data.usage,
    });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      500
    );
  }
});

// ============================================================================
// Streaming Chat Endpoint
// ============================================================================

app.post("/api/chat/stream", async (c) => {
  try {
    const { prompt } = await c.req.json();

    const response = await fetch(
      "https://api.thesys.dev/v1/embed/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${c.env.THESYS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "c1/openai/gpt-5/v-20250930",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      return c.json({ error: "Stream failed" }, response.status);
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    return c.json({ error: "Stream failed" }, 500);
  }
});

// ============================================================================
// Health Check
// ============================================================================

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Serve Static Assets (Vite build output)
// ============================================================================

app.get("/*", serveStatic({ root: "./", mimes: {} }));

export default app;

/**
 * Alternative: Using Workers AI directly (cheaper for some models)
 *
 * type Bindings = {
 *   AI: any; // Cloudflare AI binding
 * };
 *
 * app.post("/api/chat", async (c) => {
 *   const { prompt } = await c.req.json();
 *
 *   const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
 *     messages: [
 *       { role: "system", content: "You are a helpful assistant." },
 *       { role: "user", content: prompt },
 *     ],
 *   });
 *
 *   // Then optionally send to TheSys C1 for UI generation
 *   const c1Response = await fetch("https://api.thesys.dev/v1/embed/chat/completions", {
 *     method: "POST",
 *     headers: {
 *       "Authorization": `Bearer ${c.env.THESYS_API_KEY}`,
 *       "Content-Type": "application/json",
 *     },
 *     body: JSON.stringify({
 *       model: "c1/openai/gpt-5/v-20250930",
 *       messages: [
 *         {
 *           role: "system",
 *           content: "Generate a UI for this content: " + aiResponse.response,
 *         },
 *       ],
 *     }),
 *   });
 *
 *   // ... return c1Response
 * });
 */

/**
 * Alternative: With D1 Database for message persistence
 *
 * type Bindings = {
 *   THESYS_API_KEY: string;
 *   DB: D1Database; // D1 binding
 * };
 *
 * app.post("/api/chat", async (c) => {
 *   const { userId, threadId, prompt } = await c.req.json();
 *
 *   // Save user message
 *   await c.env.DB.prepare(
 *     "INSERT INTO messages (thread_id, user_id, role, content) VALUES (?, ?, ?, ?)"
 *   )
 *     .bind(threadId, userId, "user", prompt)
 *     .run();
 *
 *   // Get conversation history
 *   const { results } = await c.env.DB.prepare(
 *     "SELECT role, content FROM messages WHERE thread_id = ? ORDER BY created_at"
 *   )
 *     .bind(threadId)
 *     .all();
 *
 *   const messages = [
 *     { role: "system", content: "You are a helpful assistant." },
 *     ...results,
 *   ];
 *
 *   // Call TheSys API with full history...
 * });
 */
