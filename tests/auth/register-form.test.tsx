import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RegisterForm } from "@/features/auth/components/register-form";

const { signIn } = vi.hoisted(() => ({
  signIn: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn,
}));

describe("register form", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    signIn.mockReset();
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
    expect(signIn).not.toHaveBeenCalled();
  });
});
