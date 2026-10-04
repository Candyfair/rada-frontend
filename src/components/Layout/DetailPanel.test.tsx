import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { assets } from "@/__fixtures__";
import DetailPanel from "./DetailPanel";

type Props = Parameters<typeof DetailPanel>[0];

const battery = assets[0]!;
const solar = assets[1]!;

const props = (overrides: Partial<Props> = {}): Props => ({
  selectedAsset: battery,
  isDetailOpen: false,
  onDismiss: vi.fn(),
  onOpenDetail: vi.fn(),
  onOpenStats: vi.fn(),
  ...overrides,
});

// The panel root: the closest ancestor with an inline transform
// (by text: once dismissed, the panel is visibility: hidden, out of the a11y tree)
const panel = () =>
  screen.getByText(/./, { selector: "h2" }).closest<HTMLElement>("[style*=transform]")!;
const valueOf = (label: string) => screen.getByText(label).nextElementSibling;

describe("DetailPanel", () => {
  it("shows the summary of a battery", () => {
    render(<DetailPanel {...props()} />);

    expect(screen.getByRole("heading", { name: battery.name })).toBeInTheDocument();
    expect(valueOf("Type")).toHaveTextContent("battery");
    expect(valueOf("Maximum capacity")).toHaveTextContent(`${battery.max_capacity_mwh} MWh`);
    expect(valueOf("Current energy")).toHaveTextContent(`${battery.energy_mwh.toFixed(2)} MWh`);
    expect(valueOf("Maximum power")).toHaveTextContent(`${battery.max_discharge_rate_mw} MW`);
    expect(valueOf("Operational mode")).toHaveTextContent(battery.operational_mode);
    expect(valueOf("Status")).toHaveTextContent(battery.asset_status);
  });

  it("hides the battery-only rows for other assets", () => {
    render(<DetailPanel {...props({ selectedAsset: solar })} />);

    expect(screen.queryByText("Maximum capacity")).not.toBeInTheDocument();
    expect(screen.queryByText("Current energy")).not.toBeInTheDocument();
  });

  it.each([
    [-1.5, "Current charge"],
    [1.5, "Current power"],
  ])("labels a power of %s MW as %s", (power_mw, label) => {
    render(<DetailPanel {...props({ selectedAsset: { ...battery, power_mw } })} />);

    expect(valueOf(label)).toHaveTextContent(`${power_mw.toFixed(2)} MW`);
  });

  it("calls its handlers", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<DetailPanel {...p} />);

    await user.click(screen.getByRole("button", { name: "Close panel" }));
    await user.click(screen.getByRole("button", { name: "Open stats for this asset" }));
    await user.click(screen.getByRole("button", { name: "View asset details" }));

    expect(p.onDismiss).toHaveBeenCalledOnce();
    expect(p.onOpenStats).toHaveBeenCalledOnce();
    expect(p.onOpenDetail).toHaveBeenCalledOnce();
  });

  it("keeps the last asset on screen while sliding away", () => {
    const { rerender } = render(<DetailPanel {...props()} />);

    rerender(<DetailPanel {...props({ selectedAsset: null })} />);

    expect(screen.getByText(battery.name)).toBeInTheDocument();
    expect(panel().style.transform).toContain("translateY(150%)");
    expect(panel().style.visibility).toBe("hidden");
  });

  it("follows a newly selected asset", () => {
    const { rerender } = render(<DetailPanel {...props()} />);

    rerender(<DetailPanel {...props({ selectedAsset: solar })} />);

    expect(screen.getByRole("heading", { name: solar.name })).toBeInTheDocument();
  });

  it("slides out to the left when the detail page opens", () => {
    render(<DetailPanel {...props({ isDetailOpen: true })} />);

    expect(panel().style.transform).toBe("translateX(calc(-50% - 120%))");
    expect(panel().style.opacity).toBe("0");
  });

  it("renders nothing until an asset is selected", () => {
    render(<DetailPanel {...props({ selectedAsset: null })} />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
