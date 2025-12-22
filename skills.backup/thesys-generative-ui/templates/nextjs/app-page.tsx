/**
 * Next.js App Router - Page Component with C1Chat
 *
 * File: app/page.tsx
 *
 * Simplest possible integration - just drop in C1Chat and point to API route.
 *
 * Features:
 * - Pre-built C1Chat component
 * - Automatic state management
 * - Thread support (optional)
 * - Responsive design
 */

"use client";

import { C1Chat } from "@thesysai/genui-sdk";
import { themePresets } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <C1Chat
          apiUrl="/api/chat"
          agentName="AI Assistant"
          logoUrl="https://placehold.co/100x100/3b82f6/ffffff?text=AI"
          theme={themePresets.default}
        />
      </div>
    </main>
  );
}

/**
 * Alternative: With custom theme and dark mode
 *
 * import { useState, useEffect } from "react";
 *
 * function useSystemTheme() {
 *   const [theme, setTheme] = useState<"light" | "dark">("light");
 *
 *   useEffect(() => {
 *     const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
 *     setTheme(mediaQuery.matches ? "dark" : "light");
 *
 *     const handler = (e: MediaQueryListEvent) => {
 *       setTheme(e.matches ? "dark" : "light");
 *     };
 *
 *     mediaQuery.addEventListener("change", handler);
 *     return () => mediaQuery.removeEventListener("change", handler);
 *   }, []);
 *
 *   return theme;
 * }
 *
 * export default function Home() {
 *   const systemTheme = useSystemTheme();
 *
 *   return (
 *     <C1Chat
 *       apiUrl="/api/chat"
 *       theme={{ ...themePresets.candy, mode: systemTheme }}
 *     />
 *   );
 * }
 */

/**
 * Alternative: With thread management
 *
 * import {
 *   useThreadListManager,
 *   useThreadManager,
 * } from "@thesysai/genui-sdk";
 *
 * export default function Home() {
 *   const threadListManager = useThreadListManager({
 *     fetchThreadList: async () => {
 *       const res = await fetch("/api/threads");
 *       return res.json();
 *     },
 *     deleteThread: async (threadId: string) => {
 *       await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
 *     },
 *     updateThread: async (thread) => {
 *       const res = await fetch(`/api/threads/${thread.threadId}`, {
 *         method: "PUT",
 *         body: JSON.stringify(thread),
 *       });
 *       return res.json();
 *     },
 *     createThread: async (firstMessage) => {
 *       const res = await fetch("/api/threads", {
 *         method: "POST",
 *         body: JSON.stringify({ title: firstMessage.message }),
 *       });
 *       return res.json();
 *     },
 *     onSwitchToNew: () => {
 *       window.history.replaceState(null, "", "/");
 *     },
 *     onSelectThread: (threadId) => {
 *       window.history.replaceState(null, "", `/?threadId=${threadId}`);
 *     },
 *   });
 *
 *   const threadManager = useThreadManager({
 *     threadListManager,
 *     loadThread: async (threadId) => {
 *       const res = await fetch(`/api/threads/${threadId}/messages`);
 *       return res.json();
 *     },
 *     onUpdateMessage: async ({ message }) => {
 *       // Handle message updates
 *     },
 *   });
 *
 *   return (
 *     <C1Chat
 *       threadManager={threadManager}
 *       threadListManager={threadListManager}
 *     />
 *   );
 * }
 */
