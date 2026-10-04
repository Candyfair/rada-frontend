import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TotalPowerBadge from "./TotalPowerBadge";

type Props = Parameters<typeof TotalPowerBadge>[0];

const renderBadge = (props: Partial<Props> = {}) =>
  render(<TotalPowerBadge value={812} isExpanded={false} isDetailOpen={false} {...props} />);

// The two badges, in DOM order: small (top-left) then large (bottom-center)
const badges = () => screen.getAllByText(/MW/).map((el) => el.parentElement!);

describe("TotalPowerBadge", () => {
  it("shows the value with its unit", () => {
    renderBadge();

    expect(screen.getAllByText("812 MW")).toHaveLength(2);
  });

  it.each([null, undefined])("shows a dash while the value is %s", (value) => {
    renderBadge({ value });

    expect(screen.getAllByText("— MW")).toHaveLength(2);
  });

  it("keeps a zero value", () => {
    renderBadge({ value: 0 });

    expect(screen.getAllByText("0 MW")).toHaveLength(2);
  });

  it("collapsed: only the small badge is visible", () => {
    renderBadge();

    const [small, large] = badges();
    expect(small).toHaveStyle({ opacity: "1" });
    expect(large).toHaveStyle({ opacity: "0", pointerEvents: "none" });
  });

  it("expanded: the large badge shows the label", () => {
    renderBadge({ isExpanded: true, unit: "MWh", label: "Total capacity" });

    expect(screen.getByText("Total capacity: 812 MWh").parentElement).toHaveStyle({ opacity: "1" });
    expect(screen.getByText("812 MWh").parentElement).toHaveStyle({ opacity: "0" });
  });

  it.each([false, true])("hides both badges on the detail page (expanded=%s)", (isExpanded) => {
    renderBadge({ isDetailOpen: true, isExpanded });

    for (const badge of badges()) expect(badge).toHaveStyle({ opacity: "0" });
  });
});
