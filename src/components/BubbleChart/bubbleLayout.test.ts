import { describe, expect, it } from "vitest";
import { assets } from "@/__fixtures__";
import type { Asset } from "@/types/api";
import {
  CONFIG,
  buildRadiusScale,
  formatMetricLabel,
  labelFontSize,
  syncNodes,
} from "./bubbleLayout";

const asset = (id: number, values: Partial<Asset> = {}): Asset => ({
  ...assets[0]!,
  id,
  ...values,
});

const CENTER = { x: 100, y: 50 };
// Always 0.5: new nodes land exactly on the centre
const middle = () => 0.5;

describe("buildRadiusScale", () => {
  it("maps the smallest value to MIN_RADIUS and the largest to MAX_RADIUS", () => {
    const scale = buildRadiusScale(
      [asset(1, { power_mw: 2 }), asset(2, { power_mw: 10 })],
      "power_mw"
    );

    expect(scale(2)).toBe(CONFIG.MIN_RADIUS);
    expect(scale(10)).toBe(CONFIG.MAX_RADIUS);
    expect(scale(6)).toBe((CONFIG.MIN_RADIUS + CONFIG.MAX_RADIUS) / 2);
  });

  it("sizes on the absolute power, so charging batteries are not shrunk", () => {
    const scale = buildRadiusScale(
      [asset(1, { power_mw: -10 }), asset(2, { power_mw: 2 })],
      "power_mw"
    );

    expect(scale.domain()).toEqual([2, 10]);
  });

  it("reads the requested metric", () => {
    const scale = buildRadiusScale(
      [asset(1, { power_mw: 1, energy_mwh: 4 }), asset(2, { power_mw: 9, energy_mwh: 8 })],
      "energy_mwh"
    );

    expect(scale.domain()).toEqual([4, 8]);
  });

  it("gives a middle-sized radius when every value is the same", () => {
    const scale = buildRadiusScale([asset(1, { power_mw: 3 })], "power_mw");

    expect(scale(3)).toBe((CONFIG.MIN_RADIUS + CONFIG.MAX_RADIUS) / 2);
  });

  it("does not fail without assets", () => {
    expect(() => buildRadiusScale([], "power_mw")).not.toThrow();
  });
});

describe("syncNodes", () => {
  it("places new assets on the centre, at rest", () => {
    const [node] = syncNodes([], [asset(1)], "power_mw", CENTER, middle);

    expect(node).toMatchObject({ id: 1, x: CENTER.x, y: CENTER.y, vx: 0, vy: 0 });
    expect(node!.floatSpeed).toBeGreaterThanOrEqual(CONFIG.FLOAT_SPEED_MIN);
    expect(node!.floatSpeed).toBeLessThanOrEqual(CONFIG.FLOAT_SPEED_MAX);
  });

  it("spreads new assets around the centre", () => {
    const [low] = syncNodes([], [asset(1)], "power_mw", CENTER, () => 0);
    const [high] = syncNodes([], [asset(1)], "power_mw", CENTER, () => 0.999);

    expect(low!.x).toBe(CENTER.x - CONFIG.SPAWN_SPREAD / 2);
    expect(high!.x).toBeCloseTo(CENTER.x + CONFIG.SPAWN_SPREAD / 2, 0);
  });

  it("keeps the node, its position and drift on a data refresh", () => {
    const previous = syncNodes([], [asset(1, { power_mw: 1 })], "power_mw", CENTER);
    const node = previous[0]!;
    Object.assign(node, { x: 7, y: 8, vx: 1, vy: 2, floatAngle: 3 });

    const [next] = syncNodes(previous, [asset(1, { power_mw: 5 })], "power_mw", CENTER);

    expect(next).toBe(node);
    expect(next).toMatchObject({ power_mw: 5, x: 7, y: 8, vx: 1, vy: 2, floatAngle: 3 });
  });

  it("keeps the nodes of the assets still shown after a filter change", () => {
    const previous = syncNodes([], [asset(1), asset(2)], "power_mw", CENTER);

    const next = syncNodes(previous, [asset(2), asset(3)], "power_mw", CENTER);

    expect(next.map((n) => n.id)).toEqual([2, 3]);
    expect(next[0]).toBe(previous[1]);
  });

  it("resizes every node when the metric changes", () => {
    const shown = [
      asset(1, { power_mw: 1, energy_mwh: 8 }),
      asset(2, { power_mw: 9, energy_mwh: 2 }),
    ];
    const byPower = syncNodes([], shown, "power_mw", CENTER).map((n) => n.r);

    const byEnergy = syncNodes([], shown, "energy_mwh", CENTER).map((n) => n.r);

    expect(byPower).toEqual([CONFIG.MIN_RADIUS, CONFIG.MAX_RADIUS]);
    expect(byEnergy).toEqual([CONFIG.MAX_RADIUS, CONFIG.MIN_RADIUS]);
  });

  it("returns no node without assets", () => {
    const previous = syncNodes([], [asset(1)], "power_mw", CENTER);

    expect(syncNodes(previous, [], "power_mw", CENTER)).toEqual([]);
  });
});

describe("formatMetricLabel", () => {
  it("shows the power with two decimals, signed", () => {
    expect(formatMetricLabel(asset(1, { power_mw: 1.5 }), "power_mw")).toBe("1.50 MW");
    expect(formatMetricLabel(asset(1, { power_mw: -0.256 }), "power_mw")).toBe("-0.26 MW");
  });

  it("shows the energy with one decimal", () => {
    expect(formatMetricLabel(asset(1, { energy_mwh: 3.14 }), "energy_mwh")).toBe("3.1 MWh");
  });
});

describe("labelFontSize", () => {
  it("grows with the bubble on screen", () => {
    expect(labelFontSize(40, 1)).toBeCloseTo(9.6);
    expect(labelFontSize(40, 1.2)).toBeCloseTo(11.52);
  });

  it("stays between 8px and 13px per zoom level", () => {
    expect(labelFontSize(10, 1)).toBe(8);
    expect(labelFontSize(72, 1)).toBe(13);
    expect(labelFontSize(72, 2)).toBe(26);
  });
});
