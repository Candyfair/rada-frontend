import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { assets } from "@/__fixtures__";
import StatsModal from "./StatsModal";

// The chart has its own tests: here we only check how the modal mounts it
vi.mock("./AssetComparisonChart", () => ({
  default: ({ initialAssetId }: { initialAssetId: number | null }) => (
    <p data-testid="chart">chart for {String(initialAssetId)}</p>
  ),
}));

type Props = Parameters<typeof StatsModal>[0];

const renderModal = (props: Partial<Props> = {}) => {
  const onClose = vi.fn();
  const view = render(
    <StatsModal assetId={1} assets={assets} isOpen onClose={onClose} {...props} />
  );
  return { onClose, ...view };
};

describe("StatsModal", () => {
  it("mounts the chart with the selected asset while open", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: "Fleet statistics" })).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toHaveTextContent("chart for 1");
  });

  it("unmounts the chart when closed, so it reopens from a clean state", () => {
    const { rerender, onClose } = renderModal();

    rerender(<StatsModal assetId={1} assets={assets} isOpen={false} onClose={onClose} />);

    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
    // Hidden from assistive tech and from the keyboard while it slides away
    expect(screen.getByRole("dialog", { hidden: true })).toHaveAttribute("inert");
  });

  it("opens without a pre-selected asset", () => {
    renderModal({ assetId: null });

    expect(screen.getByTestId("chart")).toHaveTextContent("chart for null");
  });

  it("closes with the close button, the overlay and Escape", async () => {
    const user = userEvent.setup();
    const { onClose, container } = renderModal();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(container.firstElementChild!);
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("ignores Escape while closed", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ isOpen: false });

    await user.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
  });
});
