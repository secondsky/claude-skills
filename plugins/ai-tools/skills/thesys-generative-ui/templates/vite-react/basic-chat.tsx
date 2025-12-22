/**
 * Basic C1Chat Integration for Vite + React
 *
 * Minimal setup showing how to integrate TheSys Generative UI
 * into a Vite + React application with custom backend.
 *
 * Features:
 * - Simple form input
 * - C1Component for custom UI control
 * - Manual state management
 * - Basic error handling
 *
 * Prerequisites:
 * - Backend API endpoint at /api/chat
 * - Environment variable: VITE_API_URL (optional, defaults to relative path)
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

  const apiUrl = import.meta.env.VITE_API_URL || "/api/chat";

  const makeApiCall = async (query: string, previousResponse?: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          previousC1Response: previousResponse || c1Response,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setC1Response(data.response || data.c1Response);
      setQuestion(""); // Clear input after successful request
    } catch (err) {
      console.error("Error calling API:", err);
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
      <header>
        <h1>TheSys AI Assistant</h1>
        <p>Ask me anything and I'll generate an interactive response</p>
      </header>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask me anything..."
          className="question-input"
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading || !question.trim()}
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
                // Handle interactive actions from generated UI
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
