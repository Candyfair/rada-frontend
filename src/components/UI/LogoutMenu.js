export default function LogoutMenu({ onClose, onLogout, opacity = 1 }) {
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
};
