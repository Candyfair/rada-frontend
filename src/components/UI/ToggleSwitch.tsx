// -------------------------------------------------------------------
// Generic on/off toggle switch used in the filter modal.
// Purely presentational — state is managed by the parent.
//
// Rendered as a <button role="switch"> so it is focusable, works with
// Enter/Space and announces its state to assistive tech.
//
// Props:
//   enabled  : boolean — current state
//   onChange : callback fired with the new boolean value
//   label    : accessible name, e.g. "Battery"
// -------------------------------------------------------------------
import type { CSSProperties } from "react";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}

export default function ToggleSwitch({ enabled, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      style={{
        ...styles.track,
        // Track background is the same regardless of state
        backgroundColor: "var(--color-switch-track)",
      }}
    >
      <div
        style={{
          ...styles.thumb,
          backgroundColor: enabled
            ? "var(--color-switch-thumb-on)"
            : "var(--color-switch-thumb-off)",
          transform: enabled ? "translateX(20px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

const styles = {
  track: {
    // Reset native button styles
    border: "none",
    padding: 0,
    width: 44,
    height: 26,
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    // Smooth thumb slide
    transition: "background-color 0.2s ease",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    transition: "transform 0.2s ease, background-color 0.2s ease",
  },
} satisfies Record<string, CSSProperties>;
