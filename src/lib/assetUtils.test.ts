import { describe, expect, it } from "vitest";
import { getModeColor, getStatusColor, getValueColor } from "./assetUtils";

const DEFAULT = "var(--color-panel-value)";

describe("getModeColor", () => {
  it.each([
    ["active", "var(--color-status-active)"],
    ["fault", "var(--color-status-fault)"],
    ["curtailed", "var(--color-status-curtailed)"],
  ])("maps %s to its status token", (mode, token) => {
    expect(getModeColor(mode)).toBe(token);
  });

  it("returns the default token for an unknown mode", () => {
    expect(getModeColor("maintenance")).toBe(DEFAULT);
  });

  it("returns the provided default for an unknown mode", () => {
    expect(getModeColor(undefined, "red")).toBe("red");
  });
});

describe("getStatusColor", () => {
  it("highlights communicating assets", () => {
    expect(getStatusColor("communicating")).toBe("var(--color-status-active)");
  });

  it("returns the default token for any other status", () => {
    expect(getStatusColor("unreachable")).toBe(DEFAULT);
    expect(getStatusColor("unreachable", "grey")).toBe("grey");
  });
});

describe("getValueColor", () => {
  it("colours negative values", () => {
    expect(getValueColor(-0.01)).toBe("var(--color-value-negative)");
  });

  it.each([0, 4.2])("keeps the default colour for %s", (value) => {
    expect(getValueColor(value)).toBe(DEFAULT);
    expect(getValueColor(value, "black")).toBe("black");
  });
});
