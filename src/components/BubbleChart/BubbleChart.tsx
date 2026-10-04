import { useEffect, useRef, useCallback, useState } from "react";
import type { KeyboardEvent } from "react";
import * as d3 from "d3";
import { getBubbleColor } from "@/lib/bubbleUtils";
import type { Asset, BubbleMetric } from "@/types/api";
import BubbleNode from "./BubbleNode";
import { CONFIG, formatMetricLabel, labelFontSize, syncNodes } from "./bubbleLayout";
import type { BubbleDatum } from "./bubbleLayout";

const collide = () =>
  d3.forceCollide<BubbleDatum>((d) => d.r + CONFIG.COLLISION_PADDING).strength(0.8);

interface BubbleChartProps {
  /** Assets drawn as bubbles, already filtered */
  assets: Asset[];
  /** Metric that sizes the bubbles and is shown under their name */
  metric: BubbleMetric;
  selectedId: number | null;
  onSelect: (asset: Asset) => void;
}

export default function BubbleChart({ assets, metric, selectedId, onSelect }: BubbleChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null); // ref to the HTML label overlay container
  const simulationRef = useRef<d3.Simulation<BubbleDatum, undefined>>(null);
  const nodesRef = useRef<BubbleDatum[]>([]);
  // Assets and metric of the current layout, to tell a data refresh
  // from a change that moves the bubbles around
  const layoutKeyRef = useRef<string | null>(null);

  const [nodes, setNodes] = useState<BubbleDatum[]>([]);
  const [currentScale, setCurrentScale] = useState(1);

  // currentZoom tracks the active D3 zoom transform so label positions
  // can be recalculated correctly when the user pans or zooms.
  const currentZoomRef = useRef(d3.zoomIdentity);

  // -------------------------------------------------------------------
  // LABEL POSITION UPDATE
  // Applies the current zoom transform to a node's simulation coordinates
  // to get the correct screen position for its HTML label.
  // Called both in the simulation tick and in the zoom event handler.
  // -------------------------------------------------------------------
  const updateLabelPositions = useCallback(() => {
    if (!labelsRef.current) return;
    const labelDivs = labelsRef.current.querySelectorAll<HTMLDivElement>(":scope > div");
    const t = currentZoomRef.current;

    nodesRef.current.forEach((node, i) => {
      const el = labelDivs[i];
      if (!el) return;
      // Apply the zoom transform to the simulation coordinates.
      // t.applyX / t.applyY convert from simulation space to screen space.
      const screenX = t.applyX(node.x);
      const screenY = t.applyY(node.y);
      // translate(-50%, -50%) centres the label div on the bubble position.
      el.style.transform = `translate(calc(${screenX}px - 50%), calc(${screenY}px - 50%))`;
    });
  }, []);

  // -------------------------------------------------------------------
  // SIMULATION INIT — runs once on mount only
  // Data refreshes never restart the simulation: the data effect below
  // only swaps its nodes.
  // -------------------------------------------------------------------
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    const width = svgEl.clientWidth;
    const height = svgEl.clientHeight;

    // Initialise with empty nodes — the data update effect will populate them
    nodesRef.current = [];
    layoutKeyRef.current = null;

    function floatForce() {
      nodesRef.current.forEach((node) => {
        node.floatAngle += node.floatSpeed + (Math.random() - 0.5) * 0.006;
        node.vx += Math.cos(node.floatAngle) * CONFIG.FLOAT_FORCE;
        node.vy += Math.sin(node.floatAngle) * CONFIG.FLOAT_FORCE;
      });
    }

    const simulation = d3
      .forceSimulation<BubbleDatum>([])
      .force("center", d3.forceCenter(width / 2, height / 2).strength(CONFIG.CENTER_FORCE_STRENGTH))
      .force("collide", collide())
      .force("x", d3.forceX(width / 2).strength(0.02))
      .force("y", d3.forceY(height / 2).strength(0.02))
      .force("float", floatForce)
      .velocityDecay(CONFIG.VELOCITY_DECAY)
      .alphaDecay(0)
      .alphaTarget(0.3)
      .on("tick", () => {
        if (!gRef.current) return;
        const groups = gRef.current.querySelectorAll("g.bubble-node");
        nodesRef.current.forEach((node, i) => {
          groups[i]?.setAttribute("transform", `translate(${node.x}, ${node.y})`);
        });
        updateLabelPositions();
      });

    simulationRef.current = simulation;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([CONFIG.ZOOM_MIN, CONFIG.ZOOM_MAX])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        if (gRef.current) gRef.current.setAttribute("transform", event.transform.toString());
        currentZoomRef.current = event.transform;
        updateLabelPositions();
        setCurrentScale(event.transform.k);
      });

    svg.call(zoom);
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(CONFIG.INITIAL_ZOOM)
        .translate(-width / 2, -height / 2)
    );

    return () => {
      simulation.stop();
      simulationRef.current = null;
      svg.on(".zoom", null);
    };
  }, [updateLabelPositions]);

  // -------------------------------------------------------------------
  // DATA UPDATE — runs on every assets refresh (polling), filter change
  // and metric change. Nodes already on screen keep their position;
  // only their values and radius change.
  // -------------------------------------------------------------------
  useEffect(() => {
    const simulation = simulationRef.current;
    const svgEl = svgRef.current;
    if (!simulation || !svgEl) return;

    const center = { x: svgEl.clientWidth / 2, y: svgEl.clientHeight / 2 };
    const next = syncNodes(nodesRef.current, assets, metric, center);
    nodesRef.current = next;

    // A plain data refresh nudges the bubbles; a new set of assets or
    // a new metric shakes them harder so they settle into the new layout
    const layoutKey = `${metric}:${assets.map((a) => a.id).join(",")}`;
    const isRefresh = layoutKey === layoutKeyRef.current;
    layoutKeyRef.current = layoutKey;

    // Setting the nodes re-initialises the forces, so the collision
    // force picks up the new radii
    simulation
      .nodes(next)
      .alpha(isRefresh ? 0.3 : 0.5)
      .restart();

    // Render the new radii now, not at the next re-render
    setNodes(next);
  }, [assets, metric]);

  function handleBubbleKeyDown(e: KeyboardEvent<SVGGElement>, node: BubbleDatum) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(node);
    }
  }

  // -------------------------------------------------------------------
  // RENDER
  // Two layers stacked inside a relative container:
  //   1. SVG  — renders circles only, managed by D3
  //   2. HTML div overlay — renders text labels, positioned via CSS transform
  //      pointerEvents: none so taps pass through to the SVG circles below
  // -------------------------------------------------------------------
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ---- LAYER 1 : SVG circles ---- */}
      <svg
        ref={svgRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-label="Asset fleet map"
      >
        <g ref={gRef}>
          {nodes.map((node) => {
            const isSelected = node.id === selectedId;
            return (
              <g
                key={node.id}
                className="bubble-node"
                role="button"
                tabIndex={0}
                aria-label={`${node.name}, ${formatMetricLabel(node, metric)}`}
                aria-pressed={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(node);
                }}
                onKeyDown={(e) => handleBubbleKeyDown(e, node)}
                style={{ cursor: "pointer", willChange: "transform" }}
              >
                <BubbleNode radius={node.r} color={getBubbleColor(node)} isSelected={isSelected} />
              </g>
            );
          })}
        </g>
      </svg>

      {/* ---- LAYER 2 : HTML label overlay ---- */}
      {/* position: absolute + inset: 0 makes this layer cover the SVG exactly. */}
      {/* pointerEvents: none lets taps fall through to the SVG circles below.  */}
      {/* Hidden from screen readers: each bubble already carries its label.   */}
      <div
        ref={labelsRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {nodes.map((node) => {
          const isNegative = metric === "power_mw" && node.power_mw < 0;
          const fontSize = labelFontSize(node.r, currentScale);
          const isSelected = node.id === selectedId;

          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                // Width matches the bubble diameter so text wraps correctly
                width: node.r * currentScale * 1.8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                // Initial position — D3 will update this every tick via
                // updateLabelPositions() without going through React state
                transform: "translate(-50%, -50%)",
                willChange: "transform",
              }}
            >
              <span
                style={{
                  fontSize,
                  fontWeight: 600,
                  fontFamily: "var(--font-serif)",
                  letterSpacing: "normal",
                  color: "#ffffff",
                  lineHeight: 1.1,
                  textAlign: "center",
                  maxWidth: "100%",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {node.name}
              </span>

              <span
                style={{
                  fontSize: fontSize * 0.88,
                  fontFamily: "var(--font-serif)",
                  letterSpacing: "normal",
                  color: isNegative ? "#FF6B6B" : isSelected ? "#e0f7fa" : "rgba(255,255,255,0.7)",
                  lineHeight: 1.1,
                  textAlign: "center",
                }}
              >
                {formatMetricLabel(node, metric)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
