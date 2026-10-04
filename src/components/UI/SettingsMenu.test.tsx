import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SettingsMenu from "./SettingsMenu";

type Props = Parameters<typeof SettingsMenu>[0];

function renderMenu(props: Partial<Props> = {}) {
  const handlers = { onLogout: vi.fn(), onAccessibilityModeChange: vi.fn() };
  const view = render(<SettingsMenu isAccessibilityMode={false} {...handlers} {...props} />);
  return { ...view, ...handlers };
}

describe("SettingsMenu", () => {
  it("calls onLogout", async () => {
    const { onLogout } = renderMenu();

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("puts the accessibility switch above Logout", () => {
    const { container } = renderMenu();

    const [first, second] = container.querySelectorAll("button");
    expect(first).toHaveAccessibleName("Accessibility");
    expect(second).toHaveAccessibleName("Logout");
  });

  it.each([false, true])("shows the accessibility mode (on=%s)", (isAccessibilityMode) => {
    renderMenu({ isAccessibilityMode });

    expect(screen.getByRole("switch", { name: "Accessibility" })).toHaveAttribute(
      "aria-checked",
      String(isAccessibilityMode)
    );
  });

  it("turns the accessibility mode on from the switch", async () => {
    const { onAccessibilityModeChange } = renderMenu();

    await userEvent.click(screen.getByRole("switch", { name: "Accessibility" }));

    expect(onAccessibilityModeChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("turns the accessibility mode off from its label", async () => {
    const { onAccessibilityModeChange } = renderMenu({ isAccessibilityMode: true });

    await userEvent.click(screen.getByText("Accessibility"));

    expect(onAccessibilityModeChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("applies the background opacity", () => {
    const { container } = renderMenu({ opacity: 0.5 });

    expect(container.firstElementChild).toHaveStyle({
      backgroundColor: "hsla(42, 22%, 91%, 0.5)",
    });
  });
});
