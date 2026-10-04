import { describe, expect, it } from "vitest";
import { assets } from "@/__fixtures__";
import { getBubbleColor, getMetricValue } from "./bubbleUtils";

// Built from loose overrides on purpose: the tests also cover values the
// API types do not allow (unknown type, missing mode)
const asset = (overrides: Record<string, unknown>) =>
  ({
    asset_type: "battery",
    operational_mode: "active",
    asset_status: "communicating",
    ...overrides,
  }) as Parameters<typeof getBubbleColor>[0];

describe("getBubbleColor", () => {
  it.each([
    ["battery", "#7AA5AB"],
    ["solar", "#78AB84"],
    ["wind", "#E68B6D"],
  ])("colours an active, communicating %s by its type", (type, color) => {
    expect(getBubbleColor(asset({ asset_type: type }))).toBe(color);
  });

  it("falls back to the unknown colour for an unrecognised type", () => {
    expect(getBubbleColor(asset({ asset_type: "hydro" }))).toBe("#8E9AA0");
  });

  it("uses the unreachable colour when the asset is active but unreachable", () => {
    expect(getBubbleColor(asset({ asset_status: "unreachable" }))).toBe("#E3E2DF");
  });

  it.each(["fault", "curtailed", undefined])(
    "uses the fault colour for any non-active mode (%s), even when unreachable",
    (mode) => {
      expect(getBubbleColor(asset({ operational_mode: mode, asset_status: "unreachable" }))).toBe(
        "#683138"
      );
    }
  );

  it("handles every asset of the API fixture", () => {
    for (const a of assets) {
      expect(getBubbleColor(a)).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe("getMetricValue", () => {
  it("returns the metric value", () => {
    expect(getMetricValue({ power_mw: 12.5 }, "power_mw")).toBe(12.5);
  });

  it("returns the absolute value so negative power still gives a visible bubble", () => {
    expect(getMetricValue({ power_mw: -3.2 }, "power_mw")).toBe(3.2);
  });

  it.each([null, undefined])("returns 0 when the metric is %s", (value) => {
    expect(getMetricValue({ energy_mwh: value }, "energy_mwh")).toBe(0);
  });
});
