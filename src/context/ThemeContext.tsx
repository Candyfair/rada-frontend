// src/context/ThemeContext.tsx
// -------------------------------------------------------------------
// Provides theme state ("light" | "dark") and a toggle function
// to the entire component tree.
//
// The active theme is written as a data-theme attribute on <html>
// so CSS custom properties in tokens.css can target it with
// [data-theme="dark"] without any JavaScript-level style injection.
//
// localStorage holds the user's preference across sessions
// (see lib/storedPreference): the server and the hydration pass
// render "light", then React switches to the saved value.
// -------------------------------------------------------------------
"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createStoredPreference } from "@/lib/storedPreference";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themePreference = createStoredPreference<Theme>("theme", ["light", "dark"], "light");

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    themePreference.subscribe,
    themePreference.read,
    () => themePreference.defaultValue
  );

  // Whenever theme changes — update the HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    themePreference.write(themePreference.read() === "light" ? "dark" : "light");
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

// Custom hook — shorthand for consuming the context
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
