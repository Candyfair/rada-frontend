// -------------------------------------------------------------------
// Filter modal — lets the user show/hide asset types on the bubble map.
// Opens as an overlay above the map with a blur effect behind it.
//
// Behaviour:
//   - "View all" is mutually exclusive with the individual type options
//   - Individual types are freely combinable
//   - If all individual types are deselected, "View all" reactivates
//   - Closes on outside tap or on the confirm button
//
// Props:
//   activeFilters : Set<string> — currently active asset types,
//                  or a Set containing "all" for View all
//   onChange      : callback fired with the new Set on every toggle
//   onClose       : callback fired when the modal should close
// -------------------------------------------------------------------
import { CircleCheckBig } from "lucide-react";
import ToggleSwitch from "./ToggleSwitch";

const ASSET_TYPES = [
  { key: "battery", label: "Battery" },
  { key: "solar", label: "Solar PV" },
  { key: "wind", label: "Wind" },
];

export default function FilterModal({ activeFilters, onChange, onClose }) {
  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------

  function handleTypeToggle(key) {
    const next = new Set(activeFilters);

    // If "all" is currently active, switch to this type only
    if (next.has("all")) {
      next.delete("all");
      next.add(key);
      onChange(next);
      return;
    }

    // Toggle the selected type
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }

    // If nothing is selected anymore, fall back to "all"
    if (next.size === 0) {
      next.add("all");
    }

    onChange(next);
  }

  function handleViewAllToggle() {
    // "View all" is already active — do nothing (can't deselect everything)
    if (activeFilters.has("all")) return;
    onChange(new Set(["all"]));
  }

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    // Backdrop — full screen, blurs the map behind, closes on tap
    <div style={styles.backdrop} onClick={onClose}>
      {/* Modal card — stop propagation so tapping inside doesn't close */}
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Filter rows — individual types first */}
        {ASSET_TYPES.map(({ key, label }) => (
          <div key={key} style={styles.row}>
            <span style={styles.label}>{label}</span>
            <ToggleSwitch enabled={activeFilters.has(key)} onChange={() => handleTypeToggle(key)} />
          </div>
        ))}

        {/* Divider */}
        <div style={styles.divider} />

        {/* View all — last row, mutually exclusive */}
        <div style={styles.row}>
          <span style={styles.labelAll}>View all</span>
          <ToggleSwitch enabled={activeFilters.has("all")} onChange={handleViewAllToggle} />
        </div>

        {/* Confirm button — centred at the bottom */}
        <div style={styles.confirmWrapper}>
          <button style={styles.confirmButton} onClick={onClose}>
            <CircleCheckBig size={32} color="var(--color-modal-border)" />
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// STYLES
// -------------------------------------------------------------------
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "var(--color-modal-bg)",
    border: "1px solid var(--color-modal-border)",
    borderRadius: 16,
    padding: "24px 20px",
    width: "80%",
    maxWidth: 320,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 20,
    fontWeight: "500",
    color: "var(--color-modal-label)",
  },
  labelAll: {
    fontSize: 20,
    fontWeight: "600",
    color: "var(--color-modal-label)",
  },
  divider: {
    height: 1,
    backgroundColor: "var(--color-modal-border)",
    opacity: 0.15,
    marginTop: -4,
    marginBottom: -4,
  },
  confirmWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: 4,
  },
  confirmButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
