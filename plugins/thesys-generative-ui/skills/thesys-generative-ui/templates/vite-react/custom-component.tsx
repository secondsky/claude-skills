/**
 * Custom C1Component Integration with Advanced State Management
 *
 * Shows how to use C1Component with full control over:
 * - Message history
 * - Conversation state
 * - Custom UI layout
 * - Error boundaries
 *
 * Use this when you need more control than C1Chat provides.
 */

import "@crayonai/react-ui/styles/index.css";
import { ThemeProvider, C1Component } from "@thesysai/genui-sdk";
import { useState, useRef, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import "./App.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <pre className="error-details">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="retry-button">
        Try again
      </button>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isStreaming) return;

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsStreaming(true);
    setCurrentResponse("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add assistant response
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setCurrentResponse(data.response);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const clearConversation = () => {
    setMessages([]);
    setCurrentResponse("");
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="chat-container">
        <div className="chat-header">
          <h1>AI Assistant</h1>
          <button onClick={clearConversation} className="clear-button">
            Clear
          </button>
        </div>

        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`message message-${message.role}`}
            >
              <div className="message-header">
                <span className="message-role">
                  {message.role === "user" ? "You" : "AI"}
                </span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {message.role === "assistant" ? (
                <ThemeProvider>
                  <C1Component
                    c1Response={message.content}
                    isStreaming={
                      index === messages.length - 1 && isStreaming
                    }
                    updateMessage={(updatedContent) => {
                      setCurrentResponse(updatedContent);
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === message.id
                            ? { ...m, content: updatedContent }
                            : m
                        )
                      );
                    }}
                    onAction={({ llmFriendlyMessage }) => {
                      sendMessage(llmFriendlyMessage);
                    }}
                  />
                </ThemeProvider>
              ) : (
                <div className="message-content">{message.content}</div>
              )}
            </div>
          ))}

          {isStreaming && !currentResponse && (
            <div className="loading-indicator">
              <div className="spinner" />
              <span>AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="message-input"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="send-button"
          >
            {isStreaming ? "..." : "Send"}
          </button>
        </form>
      </div>
    </ErrorBoundary>
  );
}
