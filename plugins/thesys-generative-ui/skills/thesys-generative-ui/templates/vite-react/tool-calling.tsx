/**
 * Tool Calling Integration Example
 *
 * Demonstrates how to integrate tool calling (function calling) with TheSys C1.
 * Shows:
 * - Web search tool with Tavily API
 * - Product inventory lookup
 * - Order creation with Zod validation
 * - Interactive UI for tool results
 *
 * Backend Requirements:
 * - OpenAI SDK with runTools support
 * - Zod for schema validation
 * - Tool execution handlers
 */

import "@crayonai/react-ui/styles/index.css";
import { ThemeProvider, C1Component } from "@thesysai/genui-sdk";
import { useState } from "react";
import "./App.css";

// Example tool schemas (these match backend Zod schemas)
interface WebSearchTool {
  name: "web_search";
  args: {
    query: string;
    max_results: number;
  };
}

interface ProductLookupTool {
  name: "lookup_product";
  args: {
    product_type?: "gloves" | "hat" | "scarf";
  };
}

interface CreateOrderTool {
  name: "create_order";
  args: {
    customer_email: string;
    items: Array<{
      type: "gloves" | "hat" | "scarf";
      quantity: number;
      [key: string]: any;
    }>;
  };
}

type ToolCall = WebSearchTool | ProductLookupTool | CreateOrderTool;

export default function ToolCallingExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [c1Response, setC1Response] = useState("");
  const [question, setQuestion] = useState("");
  const [activeTools, setActiveTools] = useState<string[]>([]);

  const makeApiCall = async (query: string, previousResponse?: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setActiveTools([]);

    try {
      const response = await fetch("/api/chat-with-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          previousC1Response: previousResponse,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "tool_call") {
                // Track which tools are being called
                setActiveTools((prev) => [...prev, data.tool_name]);
              } else if (data.type === "content") {
                accumulatedResponse += data.content;
                setC1Response(accumulatedResponse);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setQuestion("");
    } catch (err) {
      console.error("Error:", err);
      setC1Response(
        `Error: ${err instanceof Error ? err.message : "Failed to get response"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    makeApiCall(question);
  };

  // Example prompts to demonstrate tools
  const examplePrompts = [
    "Search the web for the latest AI news",
    "Show me available products in the inventory",
    "Create an order for 2 blue gloves size M and 1 red hat",
  ];

  return (
    <div className="tool-calling-container">
      <header>
        <h1>AI Assistant with Tools</h1>
        <p>Ask me to search the web, check inventory, or create orders</p>
      </header>

      <div className="example-prompts">
        <h3>Try these examples:</h3>
        {examplePrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => {
              setQuestion(prompt);
              makeApiCall(prompt);
            }}
            className="example-button"
            disabled={isLoading}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask me to use a tool..."
          className="question-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? "Processing..." : "Send"}
        </button>
      </form>

      {activeTools.length > 0 && (
        <div className="active-tools">
          <h4>Active Tools:</h4>
          <div className="tool-badges">
            {activeTools.map((tool, index) => (
              <span key={index} className="tool-badge">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {c1Response && (
        <div className="response-container">
          <ThemeProvider>
            <C1Component
              c1Response={c1Response}
              isStreaming={isLoading}
              updateMessage={(message) => setC1Response(message)}
              onAction={({ llmFriendlyMessage, rawAction }) => {
                console.log("Tool action:", rawAction);

                if (!isLoading) {
                  makeApiCall(llmFriendlyMessage, c1Response);
                }
              }}
            />
          </ThemeProvider>
        </div>
      )}

      <div className="tool-info">
        <h3>Available Tools</h3>
        <ul>
          <li>
            <strong>web_search</strong> - Search the web for current information
          </li>
          <li>
            <strong>lookup_product</strong> - Check product inventory
          </li>
          <li>
            <strong>create_order</strong> - Create a new product order
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Backend API Example (route.ts or server.ts):
 *
 * import { z } from "zod";
 * import zodToJsonSchema from "zod-to-json-schema";
 * import OpenAI from "openai";
 * import { TavilySearchAPIClient } from "@tavily/core";
 *
 * const webSearchSchema = z.object({
 *   query: z.string(),
 *   max_results: z.number().int().min(1).max(10).default(5),
 * });
 *
 * const webSearchTool = {
 *   type: "function" as const,
 *   function: {
 *     name: "web_search",
 *     description: "Search the web for current information",
 *     parameters: zodToJsonSchema(webSearchSchema),
 *   },
 * };
 *
 * const client = new OpenAI({
 *   baseURL: "https://api.thesys.dev/v1/embed",
 *   apiKey: process.env.THESYS_API_KEY,
 * });
 *
 * const tavily = new TavilySearchAPIClient({
 *   apiKey: process.env.TAVILY_API_KEY,
 * });
 *
 * export async function POST(req) {
 *   const { prompt } = await req.json();
 *
 *   const stream = await client.beta.chat.completions.runTools({
 *     model: "c1/openai/gpt-5/v-20250930",
 *     messages: [
 *       {
 *         role: "system",
 *         content: "You are a helpful assistant with access to tools.",
 *       },
 *       { role: "user", content: prompt },
 *     ],
 *     stream: true,
 *     tools: [webSearchTool, productLookupTool, createOrderTool],
 *     toolChoice: "auto",
 *   });
 *
 *   // Handle tool execution and streaming...
 * }
 */
