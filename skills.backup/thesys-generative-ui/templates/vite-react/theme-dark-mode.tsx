/**
 * TheSys C1 with Custom Theming and Dark Mode
 *
 * Demonstrates:
 * - Custom theme configuration
 * - Dark mode toggle
 * - System theme detection
 * - Theme presets
 * - CSS variable overrides
 */

import "@crayonai/react-ui/styles/index.css";
import { C1Chat, ThemeProvider } from "@thesysai/genui-sdk";
import { themePresets } from "@crayonai/react-ui";
import { useState, useEffect } from "react";
import "./App.css";

type ThemeMode = "light" | "dark" | "system";

// Custom theme object
const customLightTheme = {
  mode: "light" as const,
  colors: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    background: "#ffffff",
    foreground: "#1f2937",
    border: "#e5e7eb",
    muted: "#f3f4f6",
    accent: "#10b981",
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Poppins', sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },
  borderRadius: "8px",
  spacing: {
    base: "16px",
  },
};

const customDarkTheme = {
  ...customLightTheme,
  mode: "dark" as const,
  colors: {
    primary: "#60a5fa",
    secondary: "#a78bfa",
    background: "#111827",
    foreground: "#f9fafb",
    border: "#374151",
    muted: "#1f2937",
    accent: "#34d399",
  },
};

function useSystemTheme(): "light" | "dark" {
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    () =>
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return systemTheme;
}

export default function ThemedChat() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem("theme-mode") as ThemeMode) || "system"
  );
  const [usePreset, setUsePreset] = useState(false);
  const systemTheme = useSystemTheme();

  // Determine actual theme to use
  const actualTheme =
    themeMode === "system" ? systemTheme : themeMode;

  // Choose theme object
  const theme = usePreset
    ? themePresets.candy // Use built-in preset
    : actualTheme === "dark"
    ? customDarkTheme
    : customLightTheme;

  // Persist theme preference
  useEffect(() => {
    localStorage.setItem("theme-mode", themeMode);

    // Apply to document for app-wide styling
    document.documentElement.setAttribute("data-theme", actualTheme);
  }, [themeMode, actualTheme]);

  return (
    <div className="themed-app">
      <div className="theme-controls">
        <div className="theme-selector">
          <h3>Theme Mode</h3>
          <div className="button-group">
            <button
              className={themeMode === "light" ? "active" : ""}
              onClick={() => setThemeMode("light")}
            >
              ☀️ Light
            </button>
            <button
              className={themeMode === "dark" ? "active" : ""}
              onClick={() => setThemeMode("dark")}
            >
              🌙 Dark
            </button>
            <button
              className={themeMode === "system" ? "active" : ""}
              onClick={() => setThemeMode("system")}
            >
              💻 System
            </button>
          </div>
        </div>

        <div className="theme-type">
          <h3>Theme Type</h3>
          <div className="button-group">
            <button
              className={!usePreset ? "active" : ""}
              onClick={() => setUsePreset(false)}
            >
              Custom
            </button>
            <button
              className={usePreset ? "active" : ""}
              onClick={() => setUsePreset(true)}
            >
              Preset (Candy)
            </button>
          </div>
        </div>
      </div>

      <div className="chat-wrapper">
        <ThemeProvider theme={{ ...theme, mode: actualTheme }}>
          <C1Chat
            apiUrl="/api/chat"
            agentName="Themed AI Assistant"
            logoUrl="https://placehold.co/100x100/3b82f6/ffffff?text=AI"
          />
        </ThemeProvider>
      </div>

      <div className="theme-info">
        <h3>Current Theme</h3>
        <pre className="theme-preview">
          {JSON.stringify(
            {
              mode: actualTheme,
              usingPreset: usePreset,
              preferredMode: themeMode,
              systemPreference: systemTheme,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

/**
 * CSS Example (App.css):
 *
 * [data-theme="light"] {
 *   --app-bg: #ffffff;
 *   --app-text: #1f2937;
 * }
 *
 * [data-theme="dark"] {
 *   --app-bg: #111827;
 *   --app-text: #f9fafb;
 * }
 *
 * .themed-app {
 *   background: var(--app-bg);
 *   color: var(--app-text);
 *   min-height: 100vh;
 *   transition: background-color 0.3s ease, color 0.3s ease;
 * }
 *
 * .theme-controls {
 *   padding: 2rem;
 *   display: flex;
 *   gap: 2rem;
 *   border-bottom: 1px solid var(--app-text);
 * }
 *
 * .button-group button {
 *   padding: 0.5rem 1rem;
 *   border: 1px solid var(--app-text);
 *   background: transparent;
 *   color: var(--app-text);
 *   cursor: pointer;
 *   transition: all 0.2s;
 * }
 *
 * .button-group button.active {
 *   background: var(--app-text);
 *   color: var(--app-bg);
 * }
 */
