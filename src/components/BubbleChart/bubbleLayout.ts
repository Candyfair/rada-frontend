import { extent, scaleLinear } from "d3";
import type { SimulationNodeDatum } from "d3";
import { getMetricValue } from "@/lib/bubbleUtils";
import type { Asset, BubbleMetric } from "@/types/api";

export const CONFIG = {
  MIN_RADIUS: 24,
  MAX_RADIUS: 72,
  CENTER_FORCE_STRENGTH: 0.04,
  COLLISION_PADDING: 6,
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 4,
  INITIAL_ZOOM: 2.5,
  FLOAT_SPEED_MIN: 0.006,
  FLOAT_SPEED_MAX: 0.022,
  FLOAT_FORCE: 0.22,
  VELOCITY_DECAY: 0.55,
  // New bubbles are dropped in a square of this size around the centre
  SPAWN_SPREAD: 100,
} as const;

/** An asset as a node of the D3 force simulation */
export interface BubbleDatum extends Asset, SimulationNodeDatum {
  /** Radius in simulation units, from the radius scale */
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Direction of the floating drift, in radians */
  floatAngle: number;
  floatSpeed: number;
}

export interface Point {
  x: number;
  y: number;
}

// Maps the metric of each asset to a radius between MIN_RADIUS and MAX_RADIUS.
// getMetricValue returns Math.abs() for power_mw, so negative values don't
// collapse the radius scale.
export function buildRadiusScale(assets: Asset[], metric: BubbleMetric) {
  const [min = 0, max = 0] = extent(assets, (a) => getMetricValue(a, metric));
  return scaleLinear().domain([min, max]).range([CONFIG.MIN_RADIUS, CONFIG.MAX_RADIUS]);
}

/**
 * Builds the simulation nodes for the given assets.
 * A node already in `previous` is updated in place, so it keeps its position,
 * velocity and drift: data refreshes and filter changes don't make bubbles jump.
 * New assets get a node near `center`.
 */
export function syncNodes(
  previous: BubbleDatum[],
  assets: Asset[],
  metric: BubbleMetric,
  center: Point,
  random: () => number = Math.random
): BubbleDatum[] {
  const radiusScale = buildRadiusScale(assets, metric);
  const known = new Map(previous.map((node) => [node.id, node]));

  return assets.map((asset) => {
    const r = radiusScale(getMetricValue(asset, metric));
    const node = known.get(asset.id);
    if (node) return Object.assign(node, asset, { r });

    return {
      ...asset,
      r,
      x: center.x + (random() - 0.5) * CONFIG.SPAWN_SPREAD,
      y: center.y + (random() - 0.5) * CONFIG.SPAWN_SPREAD,
      vx: 0,
      vy: 0,
      floatAngle: random() * Math.PI * 2,
      floatSpeed:
        CONFIG.FLOAT_SPEED_MIN + random() * (CONFIG.FLOAT_SPEED_MAX - CONFIG.FLOAT_SPEED_MIN),
    };
  });
}

// Value shown under the asset name
export function formatMetricLabel(asset: Asset, metric: BubbleMetric): string {
  return metric === "energy_mwh"
    ? `${asset.energy_mwh.toFixed(1)} MWh`
    : `${asset.power_mw.toFixed(2)} MW`;
}

// Name font size in screen pixels: grows with the bubble on screen,
// between 8px and 13px at zoom 1
export function labelFontSize(radius: number, zoom: number): number {
  return Math.max(8, Math.min(radius * zoom * 0.24, 13 * zoom));
}
