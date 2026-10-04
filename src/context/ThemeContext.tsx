// src/context/ThemeContext.tsx
// -------------------------------------------------------------------
// Provides theme state ("light" | "dark") and a toggle function
// to the entire component tree.
//
// The active theme is written as a data-theme attribute on <html>
// so CSS custom properties in tokens.css can target it with
// [data-theme="dark"] without any JavaScript-level style injection.
//
// localStorage holds the user's preference across sessions and is read
// through useSyncExternalStore: the server and the hydration pass render
// "light", then React switches to the saved value without a setState in
// an effect. Other tabs stay in sync through the "storage" event.
// -------------------------------------------------------------------
"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "theme";
const DEFAULT_THEME: Theme = "light";

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Same-tab subscribers; the "storage" event only fires in other tabs
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

// localStorage can throw (blocked storage, some private modes):
// the toggle then still works for the current page
let fallbackTheme: Theme = DEFAULT_THEME;

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : DEFAULT_THEME;
  } catch {
    return fallbackTheme;
  }
}

function writeTheme(theme: Theme) {
  fallbackTheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Preference just won't persist
  }
  listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);

  // Whenever theme changes — update the HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    writeTheme(readTheme() === "light" ? "dark" : "light");
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

// Custom hook — shorthand for consuming the context
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
