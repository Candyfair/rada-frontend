import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomeHeader from "./HomeHeader";

type Props = Parameters<typeof HomeHeader>[0];

function renderHeader(props: Partial<Props> = {}) {
  const handlers = {
    onThemeToggle: vi.fn(),
    onChartPress: vi.fn(),
    onSettingsPress: vi.fn(),
    onLogout: vi.fn(),
    onAccessibilityModeChange: vi.fn(),
  };
  render(
    <HomeHeader
      theme="light"
      isThemeSpinning={false}
      isLogoutMenuOpen={false}
      isAccessibilityMode={false}
      isDetailOpen={false}
      {...handlers}
      {...props}
    />
  );
  return handlers;
}

describe("HomeHeader", () => {
  it.each([
    ["Toggle theme", "onThemeToggle"],
    ["View statistics", "onChartPress"],
    ["Open settings", "onSettingsPress"],
  ] as const)("%s calls %s", async (name, handler) => {
    const handlers = renderHeader();

    await userEvent.click(screen.getByRole("button", { name }));

    expect(handlers[handler]).toHaveBeenCalledOnce();
  });

  it.each([
    ["light", "lucide-moon"],
    ["dark", "lucide-sun"],
  ] as const)("in %s mode shows the %s icon", (theme, icon) => {
    renderHeader({ theme });

    const button = screen.getByRole("button", { name: "Toggle theme" });
    expect(button.querySelector(`svg.${icon}`)).not.toBeNull();
  });

  it("hides the settings menu when closed", () => {
    renderHeader();

    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open settings" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("shows the settings menu when open and forwards onLogout", async () => {
    const { onLogout } = renderHeader({ isLogoutMenuOpen: true });

    expect(screen.getByRole("button", { name: "Open settings" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it.each([
    [false, "0.5"],
    [true, "1"],
  ])("settings menu opacity with detail open=%s is %s", (isDetailOpen, opacity) => {
    renderHeader({ isLogoutMenuOpen: true, isDetailOpen });

    expect(screen.getByRole("button", { name: "Logout" }).parentElement).toHaveStyle({
      backgroundColor: `hsla(42, 22%, 91%, ${opacity})`,
    });
  });

  it("forwards the accessibility mode to the settings menu", async () => {
    const { onAccessibilityModeChange } = renderHeader({
      isLogoutMenuOpen: true,
      isAccessibilityMode: true,
    });
    const toggle = screen.getByRole("switch", { name: "Accessibility" });

    expect(toggle).toHaveAttribute("aria-checked", "true");
    await userEvent.click(toggle);

    expect(onAccessibilityModeChange).toHaveBeenCalledExactlyOnceWith(false);
  });
});
