"use client";

import { Moon, Sun, ChartColumnBig, ShipWheelIcon } from "lucide-react";
import type { CSSProperties } from "react";
import SettingsMenu from "@/components/UI/SettingsMenu";
import type { Theme } from "@/context/ThemeContext";

// HomeHeader — fixed top-right controls bar.
//
// Contains (left to right) :
//   - Dark mode toggle
//   - Chart button (placeholder — stats modal to be built later)
//   - Settings button — opens filter modal + settings menu simultaneously
//
// The settings button border and settings menu opacity adapt to context :
//   - On home : border visible, settings menu at 50% opacity
//   - On detail page : border visible, settings menu at 100% opacity

interface HomeHeaderProps {
  theme: Theme;
  isThemeSpinning: boolean;
  onThemeToggle: () => void;
  onChartPress: () => void;
  onSettingsPress: () => void;
  isLogoutMenuOpen: boolean;
  isAccessibilityMode: boolean;
  onAccessibilityModeChange: (enabled: boolean) => void;
  onLogout: () => void;
  isDetailOpen: boolean;
}

export default function HomeHeader({
  theme,
  isThemeSpinning,
  onThemeToggle,
  onChartPress,
  onSettingsPress,
  isLogoutMenuOpen,
  isAccessibilityMode,
  onAccessibilityModeChange,
  onLogout,
  isDetailOpen,
}: HomeHeaderProps) {
  const menuOpacity = isDetailOpen ? 1 : 0.5;

  return (
    <div style={styles.header}>
      {/* Dark mode toggle */}
      <button style={styles.headerButton} onClick={onThemeToggle} aria-label="Toggle theme">
        <span
          style={{
            display: "flex",
            animation: isThemeSpinning ? "spin-once 0.35s ease-in-out" : "none",
          }}
        >
          {theme === "light" ? (
            <Moon size={22} color="var(--color-icon)" />
          ) : (
            <Sun size={22} color="var(--color-icon)" />
          )}
        </span>
      </button>

      {/* Chart button — stats modal placeholder */}
      <button style={styles.headerButton} onClick={onChartPress} aria-label="View statistics">
        <ChartColumnBig size={22} color="var(--color-icon)" />
      </button>

      {/* Settings button — wrapped in relative div to anchor SettingsMenu */}
      <div style={{ position: "relative" }}>
        <button
          style={styles.settingsButton}
          onClick={onSettingsPress}
          aria-label="Open settings"
          aria-expanded={isLogoutMenuOpen}
        >
          <ShipWheelIcon size={22} color="var(--color-icon)" />
        </button>

        {isLogoutMenuOpen && (
          <SettingsMenu
            opacity={menuOpacity}
            isAccessibilityMode={isAccessibilityMode}
            onAccessibilityModeChange={onAccessibilityModeChange}
            onLogout={onLogout}
          />
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// STYLES
// -------------------------------------------------------------------
const styles = {
  header: {
    position: "fixed",
    top: 12,
    right: 12,
    zIndex: 60,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "var(--color-bg-header)",
    borderRadius: 8,
  },

  headerButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  settingsButton: {
    background: "none",
    border: 0,
    cursor: "pointer",
    padding: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
} satisfies Record<string, CSSProperties>;
