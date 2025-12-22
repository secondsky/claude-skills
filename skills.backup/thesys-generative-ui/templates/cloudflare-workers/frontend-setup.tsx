/**
 * Cloudflare Workers + Vite Frontend Setup
 *
 * File: src/App.tsx
 *
 * Frontend configuration for Vite + React app deployed with Cloudflare Workers.
 * Uses relative paths since Worker and frontend run on same origin.
 *
 * Key Differences from standalone Vite:
 * - API URLs are relative (not absolute)
 * - No CORS issues (same origin)
 * - Worker handles routing, serves static assets
 */

import "@crayonai/react-ui/styles/index.css";
import { ThemeProvider, C1Component } from "@thesysai/genui-sdk";
import { useState } from "react";
import "./App.css";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [c1Response, setC1Response] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const makeApiCall = async (query: string, previousResponse?: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // NOTE: Using relative path - Worker handles this on same domain
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          previousC1Response: previousResponse || c1Response,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setC1Response(data.response);
      setQuestion("");
    } catch (err) {
      console.error("API Error:", err);
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    makeApiCall(question);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cloudflare AI Assistant</h1>
        <p>Powered by Workers + TheSys C1</p>
      </header>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="question-input"
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="submit-button"
        >
          {isLoading ? "Processing..." : "Send"}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {c1Response && (
        <div className="response-container">
          <ThemeProvider>
            <C1Component
              c1Response={c1Response}
              isStreaming={isLoading}
              updateMessage={(message) => setC1Response(message)}
              onAction={({ llmFriendlyMessage }) => {
                if (!isLoading) {
                  makeApiCall(llmFriendlyMessage, c1Response);
                }
              }}
            />
          </ThemeProvider>
        </div>
      )}
    </div>
  );
}

/**
 * vite.config.ts Configuration
 *
 * IMPORTANT: When using @cloudflare/vite-plugin, the Worker runs
 * alongside Vite on the same port, so use relative API paths.
 *
 * import { defineConfig } from "vite";
 * import react from "@vitejs/plugin-react";
 * import { cloudflare } from "@cloudflare/vite-plugin";
 *
 * export default defineConfig({
 *   plugins: [
 *     react(),
 *     cloudflare({
 *       configPath: "./wrangler.jsonc",
 *     }),
 *   ],
 *   build: {
 *     outDir: "dist",
 *   },
 * });
 */

/**
 * Alternative: Streaming Setup
 *
 * For streaming responses, modify the API call:
 *
 * const makeStreamingApiCall = async (query: string) => {
 *   setIsLoading(true);
 *   setC1Response("");
 *
 *   const response = await fetch("/api/chat/stream", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ prompt: query }),
 *   });
 *
 *   if (!response.ok) {
 *     throw new Error("Stream failed");
 *   }
 *
 *   const reader = response.body?.getReader();
 *   if (!reader) return;
 *
 *   const decoder = new TextDecoder();
 *   let accumulated = "";
 *
 *   while (true) {
 *     const { done, value } = await reader.read();
 *     if (done) break;
 *
 *     const chunk = decoder.decode(value);
 *     accumulated += chunk;
 *     setC1Response(accumulated);
 *   }
 *
 *   setIsLoading(false);
 * };
 */

/**
 * Deployment Steps:
 *
 * 1. Build frontend:
 *    npm run build
 *
 * 2. Deploy to Cloudflare:
 *    npx wrangler deploy
 *
 * 3. Set secrets:
 *    npx wrangler secret put THESYS_API_KEY
 *
 * 4. Test:
 *    Visit your-worker.workers.dev
 */
