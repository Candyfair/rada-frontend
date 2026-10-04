"use client";

import { Moon, Sun, ChartColumnBig, ShipWheelIcon } from "lucide-react";
import type { CSSProperties } from "react";
import LogoutMenu from "@/components/UI/LogoutMenu";
import type { Theme } from "@/context/ThemeContext";

// HomeHeader — fixed top-right controls bar.
//
// Contains (left to right) :
//   - Dark mode toggle
//   - Chart button (placeholder — stats modal to be built later)
//   - Settings button — opens filter modal + logout menu simultaneously
//
// The settings button border and logout menu opacity adapt to context :
//   - On home : border visible, logout menu at 50% opacity
//   - On detail page : border visible, logout menu at 100% opacity

interface HomeHeaderProps {
  theme: Theme;
  isThemeSpinning: boolean;
  onThemeToggle: () => void;
  onChartPress: () => void;
  onSettingsPress: () => void;
  isLogoutMenuOpen: boolean;
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
  onLogout,
  isDetailOpen,
}: HomeHeaderProps) {
  const logoutOpacity = isDetailOpen ? 1 : 0.5;

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

      {/* Settings button — wrapped in relative div to anchor LogoutMenu */}
      <div style={{ position: "relative" }}>
        <button
          style={styles.settingsButton}
          onClick={onSettingsPress}
          aria-label="Open settings"
          aria-expanded={isLogoutMenuOpen}
        >
          <ShipWheelIcon size={22} color="var(--color-icon)" />
        </button>

        {isLogoutMenuOpen && <LogoutMenu opacity={logoutOpacity} onLogout={onLogout} />}
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
