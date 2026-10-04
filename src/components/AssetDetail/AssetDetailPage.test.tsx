import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { assets, historySnapshot } from "@/__fixtures__";
import AssetDetailPage from "./AssetDetailPage";

type Props = Parameters<typeof AssetDetailPage>[0];

const battery = assets[0]!;
const solar = assets[1]!;
const record = historySnapshot.record;

const props = (overrides: Partial<Props> = {}): Props => ({
  asset: battery,
  detail: historySnapshot,
  loading: false,
  error: null,
  onBack: vi.fn(),
  ...overrides,
});

const valueOf = (label: string) => screen.getByText(label).nextElementSibling;

describe("AssetDetailPage", () => {
  it("shows the asset identity", () => {
    render(<AssetDetailPage {...props()} />);

    expect(screen.getByText(battery.name)).toBeInTheDocument();
    expect(screen.getByText(`EIC code: ${battery.eic_code}`)).toBeInTheDocument();
  });

  it("shows the latest record", () => {
    render(<AssetDetailPage {...props()} />);

    expect(valueOf("Capacity")).toHaveTextContent(`${historySnapshot.max_capacity_mwh} MWh`);
    expect(valueOf("Current capacity")).toHaveTextContent(`${record.energy_mwh} MWh`);
    expect(valueOf("Active power")).toHaveTextContent(`${record.power_mw} MW`);
    expect(valueOf("Reactive power")).toHaveTextContent(`${record.reactive_power_mvar} MVAr`);
    expect(valueOf("Voltage")).toHaveTextContent(`${record.voltage} V`);
    expect(valueOf("Current Amps")).toHaveTextContent(`${record.current_amps} A`);
    expect(valueOf("Temperature")).toHaveTextContent(`${record.temperature_celsius} °C`);
    expect(valueOf("Operational mode")).toHaveTextContent(record.operational_mode);
    expect(valueOf("Telemetric status")).toHaveTextContent(record.asset_status);
  });

  it.each([
    [-1, "Charging"],
    [1, "Discharging"],
  ])("describes a power of %s MW as %s", (power_mw, state) => {
    const detail = { ...historySnapshot, record: { ...record, power_mw } };
    render(<AssetDetailPage {...props({ detail })} />);

    expect(valueOf("Battery state")).toHaveTextContent(state);
  });

  it("shows the battery block for batteries only", () => {
    render(<AssetDetailPage {...props({ asset: solar })} />);

    expect(screen.queryByText("Capacity")).not.toBeInTheDocument();
    expect(screen.getByText("Active power")).toBeInTheDocument();
  });

  it("shows the update time in French format", () => {
    render(<AssetDetailPage {...props()} />);

    const expected = new Date(record.timestamp).toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(valueOf("Last updated time")).toHaveTextContent(expected);
  });

  it("shows dashes while loading", () => {
    render(<AssetDetailPage {...props({ detail: null, loading: true })} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(valueOf("Capacity")).toHaveTextContent("—");
    expect(valueOf("Active power")).toHaveTextContent("—");
    expect(valueOf("Last updated time")).toHaveTextContent("—");
  });

  it("shows the error", () => {
    render(<AssetDetailPage {...props({ detail: null, error: "HTTP 500" })} />);

    expect(screen.getByText("Error: HTTP 500")).toBeInTheDocument();
  });

  it("goes back", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<AssetDetailPage {...p} />);

    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(p.onBack).toHaveBeenCalledOnce();
  });
});
