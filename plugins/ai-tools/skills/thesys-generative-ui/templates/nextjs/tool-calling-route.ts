/**
 * Next.js API Route with Tool Calling
 *
 * File: app/api/chat-with-tools/route.ts
 *
 * Demonstrates tool calling integration with TheSys C1.
 * Includes:
 * - Zod schema definitions
 * - Web search tool (Tavily)
 * - Product inventory tool
 * - Order creation tool
 * - Streaming with tool execution
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { transformStream } from "@crayonai/stream";
import { TavilySearchAPIClient } from "@tavily/core";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

const tavily = new TavilySearchAPIClient({
  apiKey: process.env.TAVILY_API_KEY || "",
});

// ============================================================================
// Tool Schemas
// ============================================================================

const webSearchSchema = z.object({
  query: z.string().describe("The search query"),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe("Maximum number of results"),
});

const productLookupSchema = z.object({
  product_type: z
    .enum(["gloves", "hat", "scarf", "all"])
    .optional()
    .describe("Type of product to lookup, or 'all' for everything"),
});

const orderItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("gloves"),
    size: z.enum(["S", "M", "L", "XL"]),
    color: z.string(),
    quantity: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("hat"),
    style: z.enum(["beanie", "baseball", "fedora"]),
    color: z.string(),
    quantity: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("scarf"),
    length: z.enum(["short", "medium", "long"]),
    material: z.enum(["wool", "cotton", "silk"]),
    quantity: z.number().int().min(1),
  }),
]);

const createOrderSchema = z.object({
  customer_email: z.string().email().describe("Customer email address"),
  items: z.array(orderItemSchema).min(1).describe("Items to order"),
});

// ============================================================================
// Tool Definitions
// ============================================================================

const webSearchTool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description: "Search the web for current information using Tavily API",
    parameters: zodToJsonSchema(webSearchSchema),
  },
};

const productLookupTool = {
  type: "function" as const,
  function: {
    name: "lookup_product",
    description: "Look up products in inventory",
    parameters: zodToJsonSchema(productLookupSchema),
  },
};

const createOrderTool = {
  type: "function" as const,
  function: {
    name: "create_order",
    description: "Create a new product order",
    parameters: zodToJsonSchema(createOrderSchema),
  },
};

// ============================================================================
// Tool Execution Functions
// ============================================================================

async function executeWebSearch(args: z.infer<typeof webSearchSchema>) {
  const validated = webSearchSchema.parse(args);

  const results = await tavily.search(validated.query, {
    maxResults: validated.max_results,
    includeAnswer: true,
  });

  return {
    query: validated.query,
    answer: results.answer,
    results: results.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    })),
  };
}

async function executeProductLookup(
  args: z.infer<typeof productLookupSchema>
) {
  const validated = productLookupSchema.parse(args);

  // Mock inventory - replace with actual database query
  const inventory = {
    gloves: [
      { id: 1, size: "M", color: "blue", price: 29.99, stock: 15 },
      { id: 2, size: "L", color: "red", price: 29.99, stock: 8 },
    ],
    hat: [
      { id: 3, style: "beanie", color: "black", price: 19.99, stock: 20 },
      { id: 4, style: "baseball", color: "navy", price: 24.99, stock: 12 },
    ],
    scarf: [
      { id: 5, length: "medium", material: "wool", price: 34.99, stock: 10 },
    ],
  };

  if (validated.product_type && validated.product_type !== "all") {
    return {
      type: validated.product_type,
      products: inventory[validated.product_type],
    };
  }

  return { type: "all", inventory };
}

async function executeCreateOrder(args: z.infer<typeof createOrderSchema>) {
  const validated = createOrderSchema.parse(args);

  // Mock order creation - replace with actual database insert
  const orderId = `ORD-${Date.now()}`;

  // Simulate saving to database
  console.log("Creating order:", {
    orderId,
    customer: validated.customer_email,
    items: validated.items,
  });

  return {
    success: true,
    orderId,
    customer_email: validated.customer_email,
    items: validated.items,
    total: validated.items.reduce(
      (sum, item) => sum + item.quantity * 29.99,
      0
    ), // Mock price
    message: `Order ${orderId} created successfully`,
  };
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const { prompt, previousC1Response } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt" },
        { status: 400 }
      );
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a helpful shopping assistant with access to tools.
You can:
1. Search the web for product information
2. Look up products in our inventory
3. Create orders for customers

Always use tools when appropriate. Be friendly and helpful.`,
      },
      { role: "user", content: prompt },
    ];

    if (previousC1Response) {
      messages.splice(1, 0, {
        role: "assistant",
        content: previousC1Response,
      });
    }

    // Create streaming completion with tools
    const llmStream = await client.beta.chat.completions.runTools({
      model: "c1/anthropic/claude-sonnet-4/v-20250617",
      messages,
      stream: true,
      tools: [webSearchTool, productLookupTool, createOrderTool],
      toolChoice: "auto", // Let AI decide when to use tools
      temperature: 0.7,
    });

    // Handle tool execution
    llmStream.on("message", async (event) => {
      if (event.tool_calls) {
        for (const toolCall of event.tool_calls) {
          try {
            let result;

            switch (toolCall.function.name) {
              case "web_search":
                const searchArgs = JSON.parse(toolCall.function.arguments);
                result = await executeWebSearch(searchArgs);
                break;

              case "lookup_product":
                const lookupArgs = JSON.parse(toolCall.function.arguments);
                result = await executeProductLookup(lookupArgs);
                break;

              case "create_order":
                const orderArgs = JSON.parse(toolCall.function.arguments);
                result = await executeCreateOrder(orderArgs);
                break;

              default:
                throw new Error(`Unknown tool: ${toolCall.function.name}`);
            }

            console.log(`Tool ${toolCall.function.name} executed:`, result);

            // Tool results are automatically sent back to the LLM
            // by the runTools method
          } catch (error) {
            console.error(`Tool execution error:`, error);
            // Error will be sent back to LLM
          }
        }
      }
    });

    // Transform stream to C1 format
    const responseStream = transformStream(llmStream, (chunk) => {
      return chunk.choices[0]?.delta?.content || "";
    }) as ReadableStream<string>;

    return new NextResponse(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: error.message,
          type: error.type,
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

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
