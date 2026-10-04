import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessibilityProvider, useAccessibility } from "./AccessibilityContext";

function ModeButton() {
  const { isAccessibilityMode, setAccessibilityMode } = useAccessibility();
  return (
    <button onClick={() => setAccessibilityMode(!isAccessibilityMode)}>
      {isAccessibilityMode ? "on" : "off"}
    </button>
  );
}

const renderWithMode = () =>
  render(
    <AccessibilityProvider>
      <ModeButton />
    </AccessibilityProvider>
  );

beforeEach(() => {
  localStorage.clear();
});

describe("AccessibilityProvider", () => {
  it("is off by default", () => {
    renderWithMode();

    expect(screen.getByRole("button")).toHaveTextContent("off");
  });

  it("restores the saved mode", () => {
    localStorage.setItem("accessibility", "on");

    renderWithMode();

    expect(screen.getByRole("button")).toHaveTextContent("on");
  });

  it("ignores an unknown saved value", () => {
    localStorage.setItem("accessibility", "yes");

    renderWithMode();

    expect(screen.getByRole("button")).toHaveTextContent("off");
  });

  it("switches and persists the choice", async () => {
    renderWithMode();

    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("on");
    expect(localStorage.getItem("accessibility")).toBe("on");

    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("off");
    expect(localStorage.getItem("accessibility")).toBe("off");
  });

  it("follows a change made in another tab", () => {
    renderWithMode();

    act(() => {
      localStorage.setItem("accessibility", "on");
      window.dispatchEvent(new StorageEvent("storage", { key: "accessibility" }));
    });

    expect(screen.getByRole("button")).toHaveTextContent("on");
  });
});

describe("useAccessibility", () => {
  it("throws outside AccessibilityProvider", () => {
    expect(() => render(<ModeButton />)).toThrow(/inside AccessibilityProvider/);
  });
});
