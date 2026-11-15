// Copyright (c) 2026 EdTech. All rights reserved.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/admin/actions", () => ({ signIn: vi.fn() }));

import { AdminLoginForm } from "./admin-login-form";

describe("AdminLoginForm", () => {
  it("shows the server's error as an alert tied to the field", async () => {
    const action = vi.fn<(state: unknown, form: FormData) => Promise<{ error: string }>>(
      async () => ({ error: "That password is not right." }),
    );
    render(<AdminLoginForm action={action} />);
    const field = screen.getByLabelText("Password");
    fireEvent.change(field, { target: { value: "wrong-password-1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("That password is not right.");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute("aria-describedby", alert.id);
    expect(action.mock.calls[0]?.[1].get("password")).toBe("wrong-password-1234");
  });

  it("disables the form while signing in", async () => {
    let finish: (state: null) => void = () => {};
    const action = vi.fn(() => new Promise<null>((resolve) => (finish = resolve)));
    render(<AdminLoginForm action={action} />);
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("button", { name: "Signing in…" })).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    finish(null);
  });

  it("can show the password", () => {
    render(<AdminLoginForm action={vi.fn()} />);
    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(field).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
  });
});
