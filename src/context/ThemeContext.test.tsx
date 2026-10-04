import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

const renderWithTheme = () =>
  render(
    <ThemeProvider>
      <ThemeButton />
    </ThemeProvider>
  );

const htmlTheme = () => document.documentElement.getAttribute("data-theme");

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ThemeProvider", () => {
  it("defaults to light", () => {
    renderWithTheme();

    expect(screen.getByRole("button")).toHaveTextContent("light");
    expect(htmlTheme()).toBe("light");
  });

  it("restores the saved theme", () => {
    localStorage.setItem("theme", "dark");

    renderWithTheme();

    expect(screen.getByRole("button")).toHaveTextContent("dark");
    expect(htmlTheme()).toBe("dark");
  });

  it("ignores an unknown saved value", () => {
    localStorage.setItem("theme", "purple");

    renderWithTheme();

    expect(screen.getByRole("button")).toHaveTextContent("light");
  });

  it("toggles, updates <html> and persists the choice", async () => {
    renderWithTheme();

    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("dark");
    expect(htmlTheme()).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("follows a change made in another tab", () => {
    renderWithTheme();

    act(() => {
      localStorage.setItem("theme", "dark");
      window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
    });

    expect(screen.getByRole("button")).toHaveTextContent("dark");
  });

  it("still toggles when localStorage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    renderWithTheme();

    await userEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("dark");
  });
});

describe("useTheme", () => {
  it("throws outside ThemeProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used inside ThemeProvider"
    );
  });
});
