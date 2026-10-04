import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FilterModal, { type AssetFilter } from "./FilterModal";

function setup(active: AssetFilter[]) {
  const onChange = vi.fn<(filters: Set<AssetFilter>) => void>();
  const onClose = vi.fn();
  render(<FilterModal activeFilters={new Set(active)} onChange={onChange} onClose={onClose} />);
  const toggle = (name: string) => userEvent.click(screen.getByRole("switch", { name }));
  // Filters passed to the last onChange call
  const lastFilters = () => [...(onChange.mock.lastCall?.[0] ?? [])].sort();
  return { onChange, onClose, toggle, lastFilters };
}

describe("FilterModal", () => {
  it("shows the active filters as checked switches", () => {
    setup(["battery", "wind"]);

    const checked = (name: string) =>
      screen.getByRole("switch", { name }).getAttribute("aria-checked");
    expect(checked("Battery")).toBe("true");
    expect(checked("Solar PV")).toBe("false");
    expect(checked("Wind")).toBe("true");
    expect(checked("View all")).toBe("false");
  });

  it("switches from View all to the chosen type only", async () => {
    const { toggle, lastFilters } = setup(["all"]);

    await toggle("Solar PV");

    expect(lastFilters()).toEqual(["solar"]);
  });

  it("combines individual types", async () => {
    const { toggle, lastFilters } = setup(["battery"]);

    await toggle("Wind");

    expect(lastFilters()).toEqual(["battery", "wind"]);
  });

  it("removes a type that was active", async () => {
    const { toggle, lastFilters } = setup(["battery", "wind"]);

    await toggle("Battery");

    expect(lastFilters()).toEqual(["wind"]);
  });

  it("falls back to View all when the last type is removed", async () => {
    const { toggle, lastFilters } = setup(["battery"]);

    await toggle("Battery");

    expect(lastFilters()).toEqual(["all"]);
  });

  it("View all replaces individual types", async () => {
    const { toggle, lastFilters } = setup(["battery", "solar"]);

    await toggle("View all");

    expect(lastFilters()).toEqual(["all"]);
  });

  it("View all cannot be turned off", async () => {
    const { toggle, onChange } = setup(["all"]);

    await toggle("View all");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not mutate the Set it receives", async () => {
    const active = new Set<AssetFilter>(["battery"]);
    render(<FilterModal activeFilters={active} onChange={() => {}} onClose={() => {}} />);

    await userEvent.click(screen.getByRole("switch", { name: "Wind" }));

    expect([...active]).toEqual(["battery"]);
  });

  it("closes with the confirm button", async () => {
    const { onClose } = setup(["all"]);

    await userEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on a click outside the card, not inside", async () => {
    const { onClose } = setup(["all"]);
    const dialog = screen.getByRole("dialog", { name: "Filter assets" });

    await userEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(dialog.parentElement!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
