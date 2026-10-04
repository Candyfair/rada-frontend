// -------------------------------------------------------------------
// CONFIGURATION
// Add or remove entries here to support additional metrics.
// -------------------------------------------------------------------
import type { CSSProperties } from "react";
import type { BubbleMetric } from "@/types/api";

const OPTIONS: { key: BubbleMetric; label: string }[] = [
  { key: "energy_mwh", label: "Capacity" },
  { key: "power_mw", label: "Charge rate" },
];

// -------------------------------------------------------------------
// COMPONENT
// Controlled toggle — owns no internal state.
// The active value and the change handler both come from the parent.
//
// Props:
//   value    : currently active metric key
//   onChange : callback fired with the new metric key on user tap
// -------------------------------------------------------------------
interface ToggleProps {
  value: BubbleMetric;
  onChange: (metric: BubbleMetric) => void;
}

export default function Toggle({ value, onChange }: ToggleProps) {
  return (
    <div style={styles.wrapper}>
      {OPTIONS.map((option) => {
        const isActive = option.key === value;
        return (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            // Disable the already-active option to prevent redundant callbacks
            // and to signal the current state semantically to assistive tech.
            disabled={isActive}
            aria-pressed={isActive}
            style={{
              ...styles.option,
              ...(isActive ? styles.optionActive : styles.optionInactive),
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "var(--color-toggle-bg)",
    borderRadius: 24,
    padding: 4,
    gap: 4,
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  },
  option: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 20,
    border: "none",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    cursor: "pointer",
    transition: "background-color 0.2s ease, color 0.2s ease",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  optionActive: {
    backgroundColor: "var(--color-toggle-active)",
    color: "var(--color-text-on-dark)",
    cursor: "default",
  },
  optionInactive: {
    backgroundColor: "transparent",
    color: "var(--color-toggle-inactive)",
  },
} satisfies Record<string, CSSProperties>;
