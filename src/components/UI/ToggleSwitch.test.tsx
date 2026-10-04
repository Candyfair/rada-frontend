import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ToggleSwitch from "./ToggleSwitch";

describe("ToggleSwitch", () => {
  it.each([true, false])("exposes enabled=%s as a checked switch", (enabled) => {
    render(<ToggleSwitch label="Battery" enabled={enabled} onChange={() => {}} />);

    expect(screen.getByRole("switch", { name: "Battery" })).toHaveAttribute(
      "aria-checked",
      String(enabled)
    );
  });

  it("calls onChange with the opposite value on click", async () => {
    const onChange = vi.fn();
    render(<ToggleSwitch label="Battery" enabled={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole("switch"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("works from the keyboard", async () => {
    const onChange = vi.fn();
    render(<ToggleSwitch label="Battery" enabled onChange={onChange} />);

    await userEvent.tab();
    expect(screen.getByRole("switch")).toHaveFocus();
    await userEvent.keyboard(" ");

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
