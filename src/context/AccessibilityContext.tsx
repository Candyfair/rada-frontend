// src/context/AccessibilityContext.tsx
// -------------------------------------------------------------------
// Opt-in accessibility mode, switched on from the settings menu.
//
// Off by default, so mouse and touch users keep the plain bubble map:
// no focus ring on click, no extra tab stops. When on, the bubbles can
// be reached and selected from the keyboard.
//
// The choice is kept in localStorage like the theme (see
// lib/storedPreference) and shared by every tab.
// -------------------------------------------------------------------
"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createStoredPreference } from "@/lib/storedPreference";

interface AccessibilityContextValue {
  isAccessibilityMode: boolean;
  setAccessibilityMode: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

const modePreference = createStoredPreference("accessibility", ["off", "on"], "off");

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(
    modePreference.subscribe,
    modePreference.read,
    () => modePreference.defaultValue
  );

  const setAccessibilityMode = useCallback((enabled: boolean) => {
    modePreference.write(enabled ? "on" : "off");
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{ isAccessibilityMode: mode === "on", setAccessibilityMode }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return ctx;
}
