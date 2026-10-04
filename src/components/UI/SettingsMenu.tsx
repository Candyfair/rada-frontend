import type { CSSProperties } from "react";

// The parent owns the open state and closes the menu itself
// (settings button, filter modal close, logout).
interface LogoutMenuProps {
  onLogout: () => void;
  opacity?: number;
}

export default function LogoutMenu({ onLogout, opacity = 1 }: LogoutMenuProps) {
  return (
    <div style={{ ...styles.menu, backgroundColor: `hsla(42, 22%, 91%, ${opacity})` }}>
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
} satisfies Record<string, CSSProperties>;
