// -------------------------------------------------------------------
// COMPONENT
// Renders only the circle for a single asset bubble.
// Labels are rendered as HTML overlays in BubbleChart to avoid
// SVG text pixel-snapping on Safari/WebKit, which causes vertical jitter.
//
// Props:
//   radius     : pixel radius computed by BubbleChart's radius scale
//   color      : fill colour string from getBubbleColor()
//   isSelected : whether this bubble is currently selected
// -------------------------------------------------------------------
export default function BubbleNode({ radius, color, isSelected }) {
  return (
    <circle
      r={radius}
      fill={color}
      stroke={isSelected ? "#ffffff" : "transparent"}
      strokeWidth={isSelected ? 2 : 0}
      style={{ transition: "fill 0.3s ease" }}
    />
  );
}
