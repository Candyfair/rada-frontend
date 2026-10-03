// src/context/ThemeContext.js
// -------------------------------------------------------------------
// Provides theme state ("light" | "dark") and a toggle function
// to the entire component tree.
//
// The active theme is written as a data-theme attribute on <html>
// so CSS custom properties in tokens.css can target it with
// [data-theme="dark"] without any JavaScript-level style injection.
//
// localStorage is used to persist the user's preference across sessions.
// -------------------------------------------------------------------
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // On mount — restore the saved preference if it exists
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  // Whenever theme changes — update the HTML attribute and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

// Custom hook — shorthand for consuming the context
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
