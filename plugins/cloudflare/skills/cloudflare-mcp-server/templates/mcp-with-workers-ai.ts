/**
 * MCP Server with Workers AI Integration
 *
 * Demonstrates Workers AI integration for image and text generation.
 * Shows how to use AI binding in MCP tools.
 *
 * Based on: https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-github-oauth
 *
 * ═══════════════════════════════════════════════════════════════
 * 🤖 WORKERS AI INTEGRATION
 * ═══════════════════════════════════════════════════════════════
 *
 * This template shows:
 * 1. AI binding configuration (wrangler.jsonc)
 * 2. Image generation with Flux
 * 3. Text generation with Llama
 * 4. Error handling for AI requests
 * 5. Streaming responses
 *
 * ═══════════════════════════════════════════════════════════════
 * 📋 REQUIRED CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 *
 * wrangler.jsonc:
 * {
 *   "ai": {
 *     "binding": "AI"
 *   }
 * }
 *
 * No API keys required! Workers AI is built into Cloudflare Workers.
 *
 * Pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
 * - Free tier: 10,000 Neurons per day
 * - Image generation: ~500 Neurons per image
 * - Text generation: Varies by token count
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Env = {
  AI: Ai; // Workers AI binding (configured in wrangler.jsonc)
};

/**
 * MCP Server with Workers AI tools
 */
export class MyMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Workers AI MCP Server",
    version: "1.0.0",
  });

  async init() {
    // ═══════════════════════════════════════════════════════════════
    // TOOL 1: Generate Image with Flux
    // ═══════════════════════════════════════════════════════════════
    // Model: @cf/black-forest-labs/flux-1-schnell
    // Fast image generation model (2-4 seconds)
    // Input: Text prompt → Output: Base64-encoded PNG
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "generate_image",
      "Generate an image from a text prompt using Flux AI model",
      {
        prompt: z
          .string()
          .describe("Detailed description of the image to generate"),
        num_steps: z
          .number()
          .min(1)
          .max(8)
          .default(4)
          .optional()
          .describe("Number of inference steps (1-8, default 4). Higher = better quality but slower"),
      },
      async ({ prompt, num_steps = 4 }) => {
        try {
          // Call Workers AI
          const response = await this.env.AI.run(
            "@cf/black-forest-labs/flux-1-schnell",
            {
              prompt,
              num_steps,
            }
          );

          // Response is a base64-encoded PNG image
          const imageBase64 = (response as { image: string }).image;

          return {
            content: [
              {
                type: "text",
                text: `Generated image from prompt: "${prompt}"`,
              },
              {
                type: "image",
                data: imageBase64,
                mimeType: "image/png",
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error generating image: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // TOOL 2: Generate Text with Llama
    // ═══════════════════════════════════════════════════════════════
    // Model: @cf/meta/llama-3.1-8b-instruct
    // Fast text generation model
    // Input: User message → Output: AI-generated text
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "generate_text",
      "Generate text using Llama AI model",
      {
        prompt: z.string().describe("The prompt or question for the AI"),
        max_tokens: z
          .number()
          .min(1)
          .max(2048)
          .default(512)
          .optional()
          .describe("Maximum number of tokens to generate (default 512)"),
      },
      async ({ prompt, max_tokens = 512 }) => {
        try {
          // Call Workers AI
          const response = await this.env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct",
            {
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              max_tokens,
            }
          );

          // Extract generated text
          const text = (response as { response: string }).response;

          return {
            content: [
              {
                type: "text",
                text,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error generating text: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // TOOL 3: List Available AI Models
    // ═══════════════════════════════════════════════════════════════
    // Shows all models available in Workers AI
    // Useful for discovering what's available
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "list_ai_models",
      "List all available Workers AI models",
      {},
      async () => {
        // This is a static list, but you could dynamically fetch from CF API
        const models = [
          {
            name: "@cf/black-forest-labs/flux-1-schnell",
            type: "Image Generation",
            description: "Fast image generation (2-4s)",
          },
          {
            name: "@cf/meta/llama-3.1-8b-instruct",
            type: "Text Generation",
            description: "Fast text generation",
          },
          {
            name: "@cf/meta/llama-3.1-70b-instruct",
            type: "Text Generation",
            description: "High-quality text generation (slower)",
          },
          {
            name: "@cf/openai/whisper",
            type: "Speech Recognition",
            description: "Audio transcription",
          },
          {
            name: "@cf/baai/bge-base-en-v1.5",
            type: "Text Embeddings",
            description: "Generate embeddings for semantic search",
          },
        ];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(models, null, 2),
            },
          ],
        };
      }
    );
  }
}

/**
 * Worker fetch handler
 *
 * ═══════════════════════════════════════════════════════════════
 * 🔧 CONFIGURATION NOTES
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. AI Binding Setup (wrangler.jsonc):
 *    {
 *      "ai": {
 *        "binding": "AI"
 *      }
 *    }
 *
 * 2. Deploy:
 *    npx wrangler deploy
 *
 * 3. Test Tools:
 *    - generate_image: Creates PNG images from prompts
 *    - generate_text: Generates text responses
 *    - list_ai_models: Shows available models
 *
 * 4. Client URL:
 *    "url": "https://YOUR-WORKER.workers.dev/sse"
 *
 * ═══════════════════════════════════════════════════════════════
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // SSE transport
    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    // HTTP transport
    if (pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    // Health check with AI binding info
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({
          name: "Workers AI MCP Server",
          version: "1.0.0",
          transports: {
            sse: "/sse",
            http: "/mcp",
          },
          features: {
            ai: !!env.AI,
          },
          models: [
            "flux-1-schnell (image generation)",
            "llama-3.1-8b-instruct (text generation)",
          ],
          status: "ok",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};
