import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RegisterForm } from "@/features/auth/components/register-form";

describe("register form", () => {
  const originalFetch = global.fetch;
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        assign,
      },
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("shows a specific validation error from the register route", async () => {
    global.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: "Password must be at least 8 characters long.",
        }),
        { status: 400 }
      );
    });

    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Aymane");
    await user.type(screen.getByLabelText(/^email$/i), "aymane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /password must be at least 8 characters long/i
      )
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("redirects to sign in after account creation", async () => {
    global.fetch = vi.fn(async () => new Response(null, { status: 201 }));

    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Aymane");
    await user.type(screen.getByLabelText(/^email$/i), "aymane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "longpassword");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(
        "/sign-in?registered=1&email=aymane%40example.com"
      )
    );
  });
});
