"use client";

// TotalPowerBadge — two separate elements that crossfade.
//
// collapsed (small) : top-left, amount only
// expanded (large)  : bottom-center, full label + amount
//
// Both elements are always mounted. CSS transitions handle
// position, opacity and width simultaneously.
// Phases overlap naturally because each element animates independently.

  export default function TotalPowerBadge({ value, unit = "MW", label = "Total power", isExpanded, isDetailOpen }) {
  // Formats the power value — shows a dash while data is loading
  function formatPower(value) {
    if (value === null || value === undefined) return `— ${unit}`;
    return `${value} ${unit}`;
  }

  return (
    <>
      {/* ---- SMALL BADGE — top left ---- */}
      <div style={{
        ...styles.badge,
        top: 12,
        left: 12,
        opacity: isExpanded || isDetailOpen ? 0 : 1,
        pointerEvents: isExpanded || isDetailOpen ? "none" : "auto",
        transform: isExpanded
          ? "translate(40px, 100px)"   // slides toward bottom-left as it fades
          : "translate(0, 0)",
        transition: [
          "opacity 0.2s ease",
          "transform 0.2s ease",
        ].join(", "),
      }}>
        <span style={styles.text}>{formatPower(value)}</span>
      </div>

      {/* ---- LARGE BADGE — bottom center ---- */}
      <div style={{
        ...styles.badge,
        bottom: 32,
        left: "50%",
        transform: isExpanded
          ? "translateX(-50%)"
          : "translateX(-50%) translate(-40px, -40px)", // starts from top-left area
        opacity: isExpanded && !isDetailOpen ? 1 : 0,
        pointerEvents: isExpanded && !isDetailOpen ? "auto" : "none",
        transition: [
          "opacity 0.2s ease",
          "transform 0.2s ease",
        ].join(", "),
      }}>
        <span style={styles.textLarge}>
          {isExpanded ? `${label}: ${formatPower(value)}` : formatPower(value)}
        </span>
      </div>
    </>
  );
}

const styles = {
  badge: {
    position: "fixed",
    zIndex: 60,
    backgroundColor: "var(--color-power-bg)",
    border: "1px solid var(--color-power-border)",
    borderRadius: 10,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    whiteSpace: "nowrap",
  },

  text: {
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    fontSize: 14,
    color: "var(--color-panel-title)",
    letterSpacing: "-0.05em",
  },

  textLarge: {
    fontSize: 20,
  }
};