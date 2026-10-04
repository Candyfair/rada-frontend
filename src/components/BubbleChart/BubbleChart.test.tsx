import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { assets } from "@/__fixtures__";
import type { Asset, BubbleMetric } from "@/types/api";
import BubbleChart from "./BubbleChart";
import { CONFIG } from "./bubbleLayout";

// jsdom has no SVG layout: d3-zoom reads the <svg> size from width.baseVal
beforeAll(() => {
  for (const side of ["width", "height"]) {
    Object.defineProperty(SVGSVGElement.prototype, side, {
      configurable: true,
      get: () => ({ baseVal: { value: 0 } }),
    });
  }
});

const [megapack, solar, wind, stem] = assets as [Asset, Asset, Asset, Asset];

interface Props {
  shown?: Asset[];
  metric?: BubbleMetric;
  selectedId?: number | null;
}

function renderChart({ shown = assets, metric = "power_mw", selectedId = null }: Props = {}) {
  const onSelect = vi.fn();
  const view = render(
    <BubbleChart assets={shown} metric={metric} selectedId={selectedId} onSelect={onSelect} />
  );
  const rerender = (next: Props) =>
    view.rerender(
      <BubbleChart
        assets={next.shown ?? shown}
        metric={next.metric ?? metric}
        selectedId={next.selectedId ?? selectedId}
        onSelect={onSelect}
      />
    );
  return { ...view, onSelect, rerender };
}

const bubble = (asset: Asset) =>
  screen.getByRole("button", { name: new RegExp(`^${asset.name},`) });
const radiusOf = (asset: Asset) => Number(bubble(asset).querySelector("circle")?.getAttribute("r"));

describe("BubbleChart", () => {
  it("draws one bubble per asset, named with its power", () => {
    renderChart();

    expect(screen.getAllByRole("button")).toHaveLength(assets.length);
    expect(bubble(megapack)).toHaveAccessibleName(`${megapack.name}, 1.54 MW`);
  });

  it("sizes the bubbles on the absolute power", () => {
    renderChart();

    // Smallest power: Stem (0.413 MW), largest: wind (73.838 MW)
    expect(radiusOf(stem)).toBe(CONFIG.MIN_RADIUS);
    expect(radiusOf(wind)).toBe(CONFIG.MAX_RADIUS);
    expect(radiusOf(megapack)).toBeGreaterThan(radiusOf(stem));
    expect(radiusOf(solar)).toBeLessThan(radiusOf(wind));
  });

  it("resizes and relabels the bubbles as soon as the metric changes", () => {
    const shown = [
      { ...megapack, energy_mwh: 1 },
      { ...stem, energy_mwh: 3.14 },
    ];
    const { rerender } = renderChart({ shown });
    expect(radiusOf(megapack)).toBe(CONFIG.MAX_RADIUS);

    rerender({ metric: "energy_mwh" });

    expect(radiusOf(megapack)).toBe(CONFIG.MIN_RADIUS);
    expect(radiusOf(stem)).toBe(CONFIG.MAX_RADIUS);
    expect(bubble(stem)).toHaveAccessibleName(`${stem.name}, 3.1 MWh`);
    expect(screen.getByText("3.1 MWh")).toBeInTheDocument();
  });

  it("swaps the bubbles when the filtered assets change", () => {
    const { rerender } = renderChart({ shown: [megapack, stem] });

    rerender({ shown: [stem, wind] });

    expect(screen.queryByRole("button", { name: new RegExp(megapack.name) })).toBeNull();
    expect(bubble(stem)).toBeInTheDocument();
    expect(bubble(wind)).toBeInTheDocument();
  });

  it("draws nothing without assets", () => {
    const { rerender } = renderChart({ shown: [megapack] });

    rerender({ shown: [] });

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("selects a bubble on click, without dismissing it through the map", () => {
    const onMapClick = vi.fn();
    const onSelect = vi.fn();
    render(
      <div onClick={onMapClick}>
        <BubbleChart assets={assets} metric="power_mw" selectedId={null} onSelect={onSelect} />
      </div>
    );

    // A plain click: d3-zoom's mousedown handler needs a real window (event.view)
    fireEvent.click(bubble(solar));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: solar.id }));
    expect(onMapClick).not.toHaveBeenCalled();
  });

  it.each(["{Enter}", " "])("selects the focused bubble with %s", async (key) => {
    const user = userEvent.setup();
    const { onSelect } = renderChart();

    bubble(wind).focus();
    await user.keyboard(key);

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: wind.id }));
  });

  it("outlines the selected bubble", () => {
    renderChart({ selectedId: wind.id });

    expect(bubble(wind)).toHaveAttribute("aria-pressed", "true");
    expect(bubble(wind).querySelector("circle")).toHaveAttribute("stroke", "#ffffff");
    expect(bubble(stem)).toHaveAttribute("aria-pressed", "false");
  });
});
