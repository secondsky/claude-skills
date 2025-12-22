# Tool Calling with Zod Schemas

**Tool calling** allows your AI to invoke functions and display interactive UI for data collection, external API calls, and complex workflows.

## 1. Define Tools with Zod

```typescript
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

// Define the tool schema
const webSearchSchema = z.object({
  query: z.string().describe("The search query"),
  max_results: z.number().int().min(1).max(10).default(5)
    .describe("Maximum number of results to return"),
});

// Convert to OpenAI tool format
export const webSearchTool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description: "Search the web for current information",
    parameters: zodToJsonSchema(webSearchSchema),
  },
};
```

## 2. More Complex Example: Order Management

```typescript
import { z } from "zod";

// Discriminated union for different product types
const productOrderSchema = z.discriminatedUnion("type", [
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
  customer_email: z.string().email(),
  items: z.array(productOrderSchema).min(1),
  shipping_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),
});

export const createOrderTool = {
  type: "function" as const,
  function: {
    name: "create_order",
    description: "Create a new order for products",
    parameters: zodToJsonSchema(createOrderSchema),
  },
};
```

## 3. Implement Tool Execution

```typescript
// tools.ts
import { TavilySearchAPIClient } from "@tavily/core";

const tavily = new TavilySearchAPIClient({
  apiKey: process.env.TAVILY_API_KEY,
});

export async function executeWebSearch(query: string, max_results: number) {
  const results = await tavily.search(query, {
    maxResults: max_results,
    includeAnswer: true,
  });

  return {
    query,
    results: results.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    })),
    answer: results.answer,
  };
}

export async function executeCreateOrder(orderData: z.infer<typeof createOrderSchema>) {
  // Validate with Zod
  const validated = createOrderSchema.parse(orderData);

  // Save to database
  const orderId = await saveOrderToDatabase(validated);

  return {
    success: true,
    orderId,
    message: `Order ${orderId} created successfully`,
  };
}
```

## 4. Integrate Tools in API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import { webSearchTool, createOrderTool } from "./tools";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const llmStream = await client.beta.chat.completions.runTools({
    model: "c1/anthropic/claude-sonnet-4/v-20250930",
    messages: [
      {
        role: "system",
        content: "You are a helpful shopping assistant. Use tools to search for products and create orders.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
    tools: [webSearchTool, createOrderTool],
    toolChoice: "auto", // Let AI decide when to use tools
  });

  // Handle tool execution
  llmStream.on("message", async (event) => {
    if (event.tool_calls) {
      for (const toolCall of event.tool_calls) {
        if (toolCall.function.name === "web_search") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await executeWebSearch(args.query, args.max_results);
          // Send result back to LLM...
        } else if (toolCall.function.name === "create_order") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await executeCreateOrder(args);
          // Send result back to LLM...
        }
      }
    }
  });

  const responseStream = transformStream(llmStream, (chunk) => {
    return chunk.choices[0]?.delta?.content || "";
  }) as ReadableStream<string>;

  return new NextResponse(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
```

## 5. Display Tool Results in UI

The C1Component automatically renders tool interactions as forms and displays results. You just need to handle the `onAction` callback:

```typescript
<C1Component
  c1Response={c1Response}
  onAction={async ({ llmFriendlyMessage, rawAction }) => {
    console.log("Tool action triggered:", rawAction);
    // Make API call with llmFriendlyMessage to continue conversation
    await makeApiCall(llmFriendlyMessage);
  }}
/>
```

---

**Note**: Tool calling with Zod schemas provides type-safe validation and automatic JSON Schema generation for OpenAI's function calling API. The TheSys C1 API automatically renders these tools as interactive UI components.

For more examples, see the `templates/tool-calling.tsx` and `templates/tool-calling-route.ts` files.
