import type { CSSProperties } from "react";
import ToggleSwitch from "./ToggleSwitch";

// Menu under the settings button: accessibility mode, then logout.
// The parent owns the open state and closes the menu itself
// (settings button, filter modal close, logout).
interface SettingsMenuProps {
  isAccessibilityMode: boolean;
  onAccessibilityModeChange: (enabled: boolean) => void;
  onLogout: () => void;
  opacity?: number;
}

export default function SettingsMenu({
  isAccessibilityMode,
  onAccessibilityModeChange,
  onLogout,
  opacity = 1,
}: SettingsMenuProps) {
  return (
    <div style={{ ...styles.menu, backgroundColor: `hsla(42, 22%, 91%, ${opacity})` }}>
      {/* A click on the text flips the switch too */}
      <label style={{ ...styles.item, ...styles.switchItem }}>
        Accessibility
        <ToggleSwitch
          enabled={isAccessibilityMode}
          onChange={onAccessibilityModeChange}
          label="Accessibility"
        />
      </label>
      <button style={styles.item} onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

const styles = {
  menu: {
    position: "absolute",
    top: 44,
    right: 0,
    zIndex: 30,
    borderRadius: 10,
    border: "1px solid var(--color-logout-border)",
    padding: "4px 0",
    minWidth: 120,
  },
  item: {
    display: "block",
    width: "100%",
    background: "none",
    border: "none",
    textAlign: "left",
    padding: "10px 16px",
    fontSize: 15,
    fontWeight: "500",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  },
  switchItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderBottom: "1px solid var(--color-logout-border)",
  },
} satisfies Record<string, CSSProperties>;
