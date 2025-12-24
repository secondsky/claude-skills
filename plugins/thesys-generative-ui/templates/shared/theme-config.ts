/**
 * Reusable Theme Configurations for TheSys C1
 *
 * Collection of custom theme objects that can be used across
 * any framework (Vite, Next.js, Cloudflare Workers).
 *
 * Usage:
 * import { darkTheme, lightTheme, oceanTheme } from "./theme-config";
 *
 * <C1Chat theme={oceanTheme} />
 */

export interface C1Theme {
  mode: "light" | "dark";
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    border: string;
    muted: string;
    accent: string;
    destructive?: string;
    success?: string;
    warning?: string;
  };
  fonts: {
    body: string;
    heading: string;
    mono?: string;
  };
  borderRadius: string;
  spacing: {
    base: string;
  };
}

// ============================================================================
// Light Themes
// ============================================================================

export const lightTheme: C1Theme = {
  mode: "light",
  colors: {
    primary: "#3b82f6", // Blue
    secondary: "#8b5cf6", // Purple
    background: "#ffffff",
    foreground: "#1f2937",
    border: "#e5e7eb",
    muted: "#f3f4f6",
    accent: "#10b981", // Green
    destructive: "#ef4444", // Red
    success: "#10b981", // Green
    warning: "#f59e0b", // Amber
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Inter', sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },
  borderRadius: "8px",
  spacing: {
    base: "16px",
  },
};

export const oceanTheme: C1Theme = {
  mode: "light",
  colors: {
    primary: "#0ea5e9", // Sky blue
    secondary: "#06b6d4", // Cyan
    background: "#f0f9ff",
    foreground: "#0c4a6e",
    border: "#bae6fd",
    muted: "#e0f2fe",
    accent: "#0891b2",
    destructive: "#dc2626",
    success: "#059669",
    warning: "#d97706",
  },
  fonts: {
    body: "'Nunito', sans-serif",
    heading: "'Nunito', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  borderRadius: "12px",
  spacing: {
    base: "16px",
  },
};

export const sunsetTheme: C1Theme = {
  mode: "light",
  colors: {
    primary: "#f59e0b", // Amber
    secondary: "#f97316", // Orange
    background: "#fffbeb",
    foreground: "#78350f",
    border: "#fed7aa",
    muted: "#fef3c7",
    accent: "#ea580c",
    destructive: "#dc2626",
    success: "#16a34a",
    warning: "#f59e0b",
  },
  fonts: {
    body: "'Poppins', sans-serif",
    heading: "'Poppins', sans-serif",
    mono: "'Source Code Pro', monospace",
  },
  borderRadius: "6px",
  spacing: {
    base: "16px",
  },
};

// ============================================================================
// Dark Themes
// ============================================================================

export const darkTheme: C1Theme = {
  mode: "dark",
  colors: {
    primary: "#60a5fa", // Light blue
    secondary: "#a78bfa", // Light purple
    background: "#111827",
    foreground: "#f9fafb",
    border: "#374151",
    muted: "#1f2937",
    accent: "#34d399",
    destructive: "#f87171",
    success: "#34d399",
    warning: "#fbbf24",
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Inter', sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },
  borderRadius: "8px",
  spacing: {
    base: "16px",
  },
};

export const midnightTheme: C1Theme = {
  mode: "dark",
  colors: {
    primary: "#818cf8", // Indigo
    secondary: "#c084fc", // Purple
    background: "#0f172a",
    foreground: "#e2e8f0",
    border: "#334155",
    muted: "#1e293b",
    accent: "#8b5cf6",
    destructive: "#f87171",
    success: "#4ade80",
    warning: "#facc15",
  },
  fonts: {
    body: "'Roboto', sans-serif",
    heading: "'Roboto', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },
  borderRadius: "10px",
  spacing: {
    base: "16px",
  },
};

export const forestTheme: C1Theme = {
  mode: "dark",
  colors: {
    primary: "#4ade80", // Green
    secondary: "#22d3ee", // Cyan
    background: "#064e3b",
    foreground: "#d1fae5",
    border: "#065f46",
    muted: "#047857",
    accent: "#10b981",
    destructive: "#fca5a5",
    success: "#6ee7b7",
    warning: "#fde047",
  },
  fonts: {
    body: "'Lato', sans-serif",
    heading: "'Lato', sans-serif",
    mono: "'Consolas', monospace",
  },
  borderRadius: "8px",
  spacing: {
    base: "18px",
  },
};

// ============================================================================
// High Contrast Themes (Accessibility)
// ============================================================================

export const highContrastLight: C1Theme = {
  mode: "light",
  colors: {
    primary: "#0000ff", // Pure blue
    secondary: "#ff00ff", // Pure magenta
    background: "#ffffff",
    foreground: "#000000",
    border: "#000000",
    muted: "#f5f5f5",
    accent: "#008000", // Pure green
    destructive: "#ff0000",
    success: "#008000",
    warning: "#ff8800",
  },
  fonts: {
    body: "'Arial', sans-serif",
    heading: "'Arial', bold, sans-serif",
    mono: "'Courier New', monospace",
  },
  borderRadius: "2px",
  spacing: {
    base: "20px",
  },
};

export const highContrastDark: C1Theme = {
  mode: "dark",
  colors: {
    primary: "#00ccff", // Bright cyan
    secondary: "#ff00ff", // Bright magenta
    background: "#000000",
    foreground: "#ffffff",
    border: "#ffffff",
    muted: "#1a1a1a",
    accent: "#00ff00", // Bright green
    destructive: "#ff0000",
    success: "#00ff00",
    warning: "#ffaa00",
  },
  fonts: {
    body: "'Arial', sans-serif",
    heading: "'Arial', bold, sans-serif",
    mono: "'Courier New', monospace",
  },
  borderRadius: "2px",
  spacing: {
    base: "20px",
  },
};

// ============================================================================
// Theme Utilities
// ============================================================================

/**
 * Get system theme preference
 */
export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Listen to system theme changes
 */
export function onSystemThemeChange(callback: (theme: "light" | "dark") => void) {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handler);

  return () => mediaQuery.removeEventListener("change", handler);
}

/**
 * Get theme based on user preference
 */
export function getTheme(
  preference: "light" | "dark" | "system",
  lightThemeConfig: C1Theme = lightTheme,
  darkThemeConfig: C1Theme = darkTheme
): C1Theme {
  if (preference === "system") {
    const systemPref = getSystemTheme();
    return systemPref === "dark" ? darkThemeConfig : lightThemeConfig;
  }

  return preference === "dark" ? darkThemeConfig : lightThemeConfig;
}

/**
 * All available themes by name
 */
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  midnight: midnightTheme,
  forest: forestTheme,
  "high-contrast-light": highContrastLight,
  "high-contrast-dark": highContrastDark,
} as const;

export type ThemeName = keyof typeof themes;

/**
 * Get theme by name
 */
export function getThemeByName(name: ThemeName): C1Theme {
  return themes[name];
}
