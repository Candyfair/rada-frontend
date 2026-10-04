import { cloneElement, isValidElement } from "react";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assetNotFound, assets, historyRange } from "@/__fixtures__";
import { mockFetch } from "@/hooks/testUtils";
import { parisInputToUtcIso } from "@/lib/dateUtils";
import AssetComparisonChart from "./AssetComparisonChart";

// jsdom has no layout, so ResponsiveContainer would measure 0×0 and draw
// nothing: give the chart a fixed size instead
vi.mock("recharts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("recharts")>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) =>
    isValidElement<{ width?: number; height?: number }>(children)
      ? cloneElement(children, { width: 600, height: 300 })
      : null,
}));

const NOW = "2026-10-03T16:00:00.000Z";
const megapack = assets[0]!; // id 1
const stem = assets[3]!; // id 23

type Reply = { body: unknown; status?: number };

// Answers each asset with the range fixture, unless `replies` says otherwise
function mockHistory(replies: Record<number, Reply> = {}) {
  return mockFetch((url) => {
    const id = Number(new URL(url, "http://localhost").searchParams.get("asset_id"));
    return replies[id] ?? { body: { ...historyRange, asset_id: id } };
  });
}

const requests = (fetchMock: ReturnType<typeof mockHistory>) =>
  fetchMock.mock.calls.map(([url]) =>
    Object.fromEntries(new URL(String(url), "http://localhost").searchParams)
  );

const renderChart = (initialAssetId: number | null = megapack.id) =>
  render(<AssetComparisonChart initialAssetId={initialAssetId} assets={assets} />);

const startInput = () => screen.getByLabelText<HTMLInputElement>("Start date");
const endInput = () => screen.getByLabelText<HTMLInputElement>("End date");
const applyButton = () => screen.getByRole("button", { name: "Apply" });
const selector = () => screen.getByRole("button", { name: "Select assets" });
const lines = (container: HTMLElement) => container.querySelectorAll(".recharts-line");
const waitForLoad = () =>
  waitFor(() => expect(screen.queryByText("Loading data...")).not.toBeInTheDocument());

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AssetComparisonChart", () => {
  it("loads the last 5 hours of the pre-selected asset", async () => {
    const fetchMock = mockHistory();

    const { container } = renderChart();

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
    await waitForLoad();
    expect(requests(fetchMock)).toEqual([
      { asset_id: "1", mode: "D", from_ts: "2026-10-03T11:00:00.000Z", to_ts: NOW },
    ]);
    expect(screen.getByText(megapack.name)).toBeInTheDocument();
    expect(lines(container)).toHaveLength(1);
  });

  it("fills the date inputs with the range returned, in Paris time", async () => {
    mockHistory();

    renderChart();

    // from_ts / to_ts of the fixture: 15:00 → 16:00 UTC
    await waitFor(() => expect(startInput()).toHaveValue("2026-10-03T17:00"));
    expect(endInput()).toHaveValue("2026-10-03T18:00");
  });

  it("waits for a selection when no asset is pre-selected", () => {
    const fetchMock = mockHistory();

    const { container } = renderChart(null);

    expect(screen.getByText("Select an asset to display the chart.")).toBeInTheDocument();
    expect(applyButton()).toBeDisabled();
    expect(lines(container)).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads the first asset picked in the selector", async () => {
    const user = userEvent.setup();
    const fetchMock = mockHistory();
    const { container } = renderChart(null);

    await user.click(selector());
    await user.click(screen.getByRole("button", { name: stem.name }));
    await waitForLoad();

    expect(requests(fetchMock)).toEqual([
      { asset_id: "23", mode: "D", from_ts: "2026-10-03T11:00:00.000Z", to_ts: NOW },
    ]);
    expect(lines(container)).toHaveLength(1);
    // The dropdown closes once an asset is picked
    expect(screen.queryByRole("button", { name: stem.name })).not.toBeInTheDocument();
  });

  it("reloads every line over the shown range when an asset is added", async () => {
    const user = userEvent.setup();
    const fetchMock = mockHistory();
    const { container } = renderChart();
    await waitFor(() => expect(startInput()).toHaveValue("2026-10-03T17:00"));

    await user.click(selector());
    await user.click(screen.getByRole("button", { name: stem.name }));
    await waitForLoad();

    const range = {
      mode: "D",
      from_ts: parisInputToUtcIso("2026-10-03T17:00"),
      to_ts: parisInputToUtcIso("2026-10-03T18:00"),
    };
    expect(requests(fetchMock).slice(1)).toEqual([
      { asset_id: "1", ...range },
      { asset_id: "23", ...range },
    ]);
    expect(lines(container)).toHaveLength(2);
  });

  it("applies an edited range to every selected asset", async () => {
    const user = userEvent.setup();
    const fetchMock = mockHistory();
    renderChart();
    await waitFor(() => expect(startInput()).toHaveValue("2026-10-03T17:00"));
    await user.click(selector());
    await user.click(screen.getByRole("button", { name: stem.name }));
    await waitForLoad();
    fetchMock.mockClear();

    fireEvent.change(startInput(), { target: { value: "2026-10-01T08:00" } });
    await user.click(applyButton());
    await waitForLoad();

    expect(requests(fetchMock).map((r) => [r.asset_id, r.from_ts, r.to_ts])).toEqual([
      ["1", parisInputToUtcIso("2026-10-01T08:00"), parisInputToUtcIso("2026-10-03T18:00")],
      ["23", parisInputToUtcIso("2026-10-01T08:00"), parisInputToUtcIso("2026-10-03T18:00")],
    ]);
    // The typed range stays, even if the backend answers another one
    expect(startInput()).toHaveValue("2026-10-01T08:00");
  });

  it("removes an asset with the × of its tag", async () => {
    const user = userEvent.setup();
    mockHistory();
    const { container } = renderChart();
    await waitForLoad();

    await user.click(screen.getByRole("button", { name: `Remove ${megapack.name}` }));

    expect(screen.getByText("Select an asset to display the chart.")).toBeInTheDocument();
    expect(lines(container)).toHaveLength(0);
    // The click on × does not open the dropdown
    expect(selector()).toHaveAttribute("aria-expanded", "false");
  });

  it("removes an asset picked again in the dropdown", async () => {
    const user = userEvent.setup();
    mockHistory();
    renderChart();
    await waitForLoad();

    await user.click(selector());
    const item = screen.getByRole("button", { name: megapack.name });
    expect(item).toHaveAttribute("aria-pressed", "true");
    await user.click(item);

    expect(screen.queryByRole("button", { name: `Remove ${megapack.name}` })).toBeNull();
  });

  it("says when the period holds no data, and keeps the range editable", async () => {
    mockHistory({ 1: { body: assetNotFound, status: 404 } });

    renderChart();

    expect(await screen.findByText("No data for this period.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // The requested range is shown, so Apply can try another one
    expect(startInput()).toHaveValue("2026-10-03T13:00");
    expect(endInput()).toHaveValue("2026-10-03T18:00");
    expect(applyButton()).toBeEnabled();
  });

  it("reports an asset that failed to load", async () => {
    mockHistory({ 1: { body: {}, status: 500 } });

    renderChart();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      `Could not load ${megapack.name}: HTTP 500`
    );
    expect(screen.queryByText("No data for this period.")).not.toBeInTheDocument();
  });

  it("switches the drawn metric", async () => {
    const user = userEvent.setup();
    mockHistory();
    renderChart();
    await waitForLoad();
    const energy = screen.getByRole("button", { name: "Energy" });

    expect(screen.getByRole("button", { name: "Power" })).toHaveAttribute("aria-pressed", "true");
    await user.click(energy);

    expect(energy).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Power" })).toHaveAttribute("aria-pressed", "false");
  });

  describe("asset selector", () => {
    it("opens with Enter and closes with Escape", async () => {
      const user = userEvent.setup();
      mockHistory();
      renderChart(null);

      selector().focus();
      await user.keyboard("{Enter}");
      expect(selector()).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: stem.name })).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(selector()).toHaveAttribute("aria-expanded", "false");
    });

    it("closes on a click outside", async () => {
      const user = userEvent.setup();
      mockHistory();
      renderChart(null);
      await user.click(selector());

      await user.click(screen.getByRole("button", { name: "Energy" }));

      expect(selector()).toHaveAttribute("aria-expanded", "false");
    });

    it("lists every asset, none selected yet", async () => {
      const user = userEvent.setup();
      mockHistory();
      renderChart(null);

      await user.click(selector());

      for (const asset of assets) {
        expect(screen.getByRole("button", { name: asset.name })).toHaveAttribute(
          "aria-pressed",
          "false"
        );
      }
    });
  });
});
