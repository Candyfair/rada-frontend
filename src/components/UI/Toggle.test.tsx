import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Toggle from "./Toggle";

describe("Toggle", () => {
  it("marks the active metric as pressed and disabled", () => {
    render(<Toggle value="energy_mwh" onChange={() => {}} />);

    const capacity = screen.getByRole("button", { name: "Capacity" });
    expect(capacity).toHaveAttribute("aria-pressed", "true");
    expect(capacity).toBeDisabled();
    expect(screen.getByRole("button", { name: "Charge rate" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("calls onChange with the other metric", async () => {
    const onChange = vi.fn();
    render(<Toggle value="energy_mwh" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Charge rate" }));

    expect(onChange).toHaveBeenCalledWith("power_mw");
  });

  it("ignores a click on the active metric", async () => {
    const onChange = vi.fn();
    render(<Toggle value="power_mw" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Charge rate" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
