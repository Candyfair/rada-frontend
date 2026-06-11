import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { getBubbleColor, getMetricValue } from "@/lib/bubbleUtils";
import BubbleNode from "./BubbleNode";

const CONFIG = {
  MIN_RADIUS: 24,
  MAX_RADIUS: 72,
  CENTER_FORCE_STRENGTH: 0.04,
  COLLISION_PADDING: 6,
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 4,
  FLOAT_SPEED_MIN: 0.006,
  FLOAT_SPEED_MAX: 0.022,
  FLOAT_FORCE: 0.22,
  VELOCITY_DECAY: 0.55,
};

export default function BubbleChart({ assets, metric, selectedId, onSelect }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const labelsRef = useRef(null); // ref to the HTML label overlay container
  const simulationRef = useRef(null);
  const zoomRef = useRef(null);
  const nodesRef = useRef([]);

  const [nodes, setNodes] = useState([]);
  const [currentScale, setCurrentScale] = useState(1);

  // currentZoom tracks the active D3 zoom transform so label positions
  // can be recalculated correctly when the user pans or zooms.
  const currentZoomRef = useRef(d3.zoomIdentity);

  const buildRadiusScale = useCallback((data, metricKey) => {
    // getMetricValue returns Math.abs() for power_mw,
    // so negative values don't collapse the radius scale
    const values = data.map((b) => getMetricValue(b, metricKey));
    return d3
      .scaleLinear()
      .domain([d3.min(values), d3.max(values)])
      .range([CONFIG.MIN_RADIUS, CONFIG.MAX_RADIUS]);
  }, []);

  // -------------------------------------------------------------------
  // LABEL POSITION UPDATE
  // Applies the current zoom transform to a node's simulation coordinates
  // to get the correct screen position for its HTML label.
  // Called both in the simulation tick and in the zoom event handler.
  // -------------------------------------------------------------------
  const updateLabelPositions = useCallback(() => {
    if (!labelsRef.current) return;
    const labelDivs = labelsRef.current.children;
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
  // assets are NOT in the dependency array intentionally:
  // we never want to restart the simulation when data refreshes.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Initialise with empty nodes — the data update effect will populate them
    nodesRef.current = [];

    function floatForce() {
      nodesRef.current.forEach((node) => {
        node.floatAngle += node.floatSpeed + (Math.random() - 0.5) * 0.006;
        node.vx += Math.cos(node.floatAngle) * CONFIG.FLOAT_FORCE;
        node.vy += Math.sin(node.floatAngle) * CONFIG.FLOAT_FORCE;
      });
    }

    const simulation = d3
      .forceSimulation([])
      .force(
        "center",
        d3
          .forceCenter(width / 2, height / 2)
          .strength(CONFIG.CENTER_FORCE_STRENGTH),
      )
      .force(
        "collide",
        d3.forceCollide((d) => d.r + CONFIG.COLLISION_PADDING).strength(0.8),
      )
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
          if (groups[i]) {
            groups[i].setAttribute(
              "transform",
              `translate(${node.x}, ${node.y})`,
            );
          }
        });
        updateLabelPositions();
      });

    simulationRef.current = simulation;

    const zoom = d3
      .zoom()
      .scaleExtent([CONFIG.ZOOM_MIN, CONFIG.ZOOM_MAX])
      .on("zoom", (event) => {
        d3.select(gRef.current).attr("transform", event.transform);
        currentZoomRef.current = event.transform;
        updateLabelPositions();
        setCurrentScale(event.transform.k);
      });

    svg.call(zoom);
    const initialScale = 2.5;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(initialScale)
        .translate(-width / 2, -height / 2),
    );

    zoomRef.current = zoom;

    return () => {
      simulation.stop();
      svg.on(".zoom", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------
  // DATA UPDATE — runs on every assets refresh (polling) and filter change
  // - First load: creates nodes with random positions
  // - Filter change: rebuilds nodes but reuses known x/y positions
  // - Silent poll: merges new values without touching positions
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!assets.length || !simulationRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const radiusScale = buildRadiusScale(assets, metric);

    // Build a map of existing positions keyed by asset id
    // so we can reuse them if the same asset reappears after a filter change
    const existingPositions = {};
    nodesRef.current.forEach((node) => {
      existingPositions[node.id] = {
        x: node.x,
        y: node.y,
        vx: node.vx,
        vy: node.vy,
      };
    });

    // Check whether the current nodes match the incoming assets exactly
    const currentIds = new Set(nodesRef.current.map((n) => n.id));
    const incomingIds = new Set(assets.map((a) => a.id));
    const sameSet =
      currentIds.size === incomingIds.size &&
      [...incomingIds].every((id) => currentIds.has(id));

    if (sameSet && nodesRef.current.length > 0) {
      // --- Silent poll: same assets, just update values ---
      nodesRef.current.forEach((node) => {
        const fresh = assets.find((a) => a.id === node.id);
        if (!fresh) return;

        const { x, y, vx, vy, floatAngle, floatSpeed } = node;
        Object.assign(node, fresh);
        node.x = x;
        node.y = y;
        node.vx = vx;
        node.vy = vy;
        node.floatAngle = floatAngle;
        node.floatSpeed = floatSpeed;
        node.r = radiusScale(getMetricValue(node, metric));
      });

      simulationRef.current
        .force(
          "collide",
          d3.forceCollide((d) => d.r + CONFIG.COLLISION_PADDING).strength(0.8),
        )
        .alpha(0.3)
        .restart();

      setNodes([...nodesRef.current]);
    } else {
      // --- First load or filter change: rebuild nodes ---
      // Reuse known positions when available, otherwise place near centre
      const newNodes = assets.map((b) => {
        const known = existingPositions[b.id];
        return {
          ...b,
          r: radiusScale(getMetricValue(b, metric)),
          x: known ? known.x : width / 2 + (Math.random() - 0.5) * 100,
          y: known ? known.y : height / 2 + (Math.random() - 0.5) * 100,
          vx: known ? known.vx : 0,
          vy: known ? known.vy : 0,
          floatAngle: Math.random() * Math.PI * 2,
          floatSpeed:
            CONFIG.FLOAT_SPEED_MIN +
            Math.random() * (CONFIG.FLOAT_SPEED_MAX - CONFIG.FLOAT_SPEED_MIN),
        };
      });

      nodesRef.current = newNodes;
      simulationRef.current.nodes(newNodes).alpha(0.5).restart();
      setNodes([...newNodes]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, buildRadiusScale]);

  // -------------------------------------------------------------------
  // METRIC UPDATE
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!simulationRef.current || !nodesRef.current.length) return;

    const radiusScale = buildRadiusScale(assets, metric);
    nodesRef.current.forEach((node) => {
      node.r = radiusScale(getMetricValue(node, metric));
    });

    simulationRef.current
      .force(
        "collide",
        d3.forceCollide((d) => d.r + CONFIG.COLLISION_PADDING).strength(0.8),
      )
      .alpha(0.5)
      .restart();
  }, [metric, assets, buildRadiusScale]);

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
          {nodes.map((node) => (
            <g
              key={node.id}
              className="bubble-node"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node);
              }}
              style={{ cursor: "pointer", willChange: "transform" }}
            >
              <BubbleNode
                radius={node.r}
                color={getBubbleColor(node)}
                isSelected={node.id === selectedId}
              />
            </g>
          ))}
        </g>
      </svg>

      {/* ---- LAYER 2 : HTML label overlay ---- */}
      {/* position: absolute + inset: 0 makes this layer cover the SVG exactly. */}
      {/* pointerEvents: none lets taps fall through to the SVG circles below.  */}
      <div
        ref={labelsRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {nodes.map((node) => {
          const rawPower = node.power_mw ?? 0;
          const isNegative = metric === "power_mw" && rawPower < 0;

          const metricLabel =
            metric === "energy_mwh"
              ? `${Math.round(node.energy_mwh).toFixed(1)} MWh`
              : `${rawPower >= 0 ? "" : "-"}${Math.abs(rawPower).toFixed(2)} MW`;

          const fontSize = Math.max(
            8,
            Math.min(node.r * currentScale * 0.24, 13 * currentScale),
          );
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
                  color: isNegative
                    ? "#FF6B6B"
                    : isSelected
                      ? "#e0f7fa"
                      : "rgba(255,255,255,0.7)",
                  lineHeight: 1.1,
                  textAlign: "center",
                }}
              >
                {metricLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
