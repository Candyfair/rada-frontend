import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LogoutMenu from "./LogoutMenu";

describe("LogoutMenu", () => {
  it("calls onLogout", async () => {
    const onLogout = vi.fn();
    render(<LogoutMenu onLogout={onLogout} />);

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("applies the background opacity", () => {
    const { container } = render(<LogoutMenu onLogout={() => {}} opacity={0.5} />);

    expect(container.firstElementChild).toHaveStyle({
      backgroundColor: "hsla(42, 22%, 91%, 0.5)",
    });
  });
});
